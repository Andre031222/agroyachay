use axum::extract::State;
use axum::response::{IntoResponse, Response};
use axum::{Json, Router, routing};
use base64::Engine;
use serde::Deserialize;
use serde_json::{Value, json};

use super::extract::{ApiJson, Created, Data, double_option, validate_coordinates};
use crate::auth::{self, AuthUser, Client};
use crate::domain::emails;
use crate::error::{AppError, AppResult, LegacyError};
use crate::i18n::{self, Locale, SUPPORTED_LOCALES};
use crate::infra::repo::audit::ClientInfo;
use crate::infra::repo::users::{self, NewUser, ProfileUpdate, User, UserView};
use crate::infra::repo::{audit, password_resets, settings};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/auth/register", routing::post(register))
        .route("/api/auth/login", routing::post(login))
        .route("/api/auth/google", routing::post(google))
        .route("/api/auth/me", routing::get(me).patch(update_me))
        .route("/api/auth/password", routing::post(change_password))
        .route("/api/auth/password/forgot", routing::post(forgot_password))
        .route("/api/auth/password/reset", routing::post(reset_password))
}

fn initial_role(state: &AppState, email: &str) -> &'static str {
    if state.config.is_superadmin_email(email) {
        "superadmin"
    } else {
        "farmer"
    }
}

async fn promote_listed_superadmin(
    state: &AppState,
    user: User,
    client: &ClientInfo,
) -> AppResult<User> {
    if user.role == "superadmin" || !user.active || !state.config.is_superadmin_email(&user.email) {
        return Ok(user);
    }
    let promoted = users::set_role_and_active(&state.db, user.id, "superadmin", true).await?;
    audit::record(
        &state.db,
        Some(user.id),
        "role_change",
        Some(format!("user:{}", user.id)),
        client,
        json!({"from": user.role, "to": "superadmin", "source": "env"}),
    )
    .await;
    Ok(promoted)
}

fn session(state: &AppState, user: &User) -> AppResult<Value> {
    let token = auth::issue_token(&state.config.jwt_secret, user.id, &user.role)?;
    Ok(json!({ "token": token, "user": UserView::from(user) }))
}

fn valid_email(email: &str) -> bool {
    let email = email.trim();
    let Some((local, domain)) = email.split_once('@') else {
        return false;
    };
    !local.is_empty()
        && domain.contains('.')
        && !domain.starts_with('.')
        && !domain.ends_with('.')
        && !email.chars().any(char::is_whitespace)
        && email.len() <= 254
}

#[derive(Deserialize)]
pub struct RegisterBody {
    name: Option<String>,
    nombre: Option<String>,
    email: Option<String>,
    password: Option<String>,
    locale: Option<String>,
}

pub async fn register(
    State(state): State<AppState>,
    Client(client): Client,
    ApiJson(body): ApiJson<RegisterBody>,
) -> AppResult<Created<Value>> {
    let email = body.email.unwrap_or_default().trim().to_lowercase();
    if !state.config.is_superadmin_email(&email) && !settings::registration_open(&state.db).await? {
        return Err(AppError::RegistrationClosed);
    }
    let name = super::extract::required_text(
        body.name.as_deref().or(body.nombre.as_deref()),
        "name",
        120,
    )?;
    if !valid_email(&email) {
        return Err(AppError::Validation("email is not valid".into()));
    }
    let password = body.password.unwrap_or_default();
    auth::validate_password(&password)?;
    let locale = body
        .locale
        .as_deref()
        .and_then(Locale::parse)
        .unwrap_or_else(Locale::current);
    let hash = auth::hash_password(&password).await?;
    let user = users::create(
        &state.db,
        NewUser {
            name: &name,
            email: &email,
            password_hash: Some(&hash),
            google_sub: None,
            avatar_url: None,
            role: initial_role(&state, &email),
            locale: locale.code(),
        },
    )
    .await?;
    users::touch_login(&state.db, user.id).await?;
    audit::record(
        &state.db,
        Some(user.id),
        "register",
        Some(format!("user:{}", user.id)),
        &client,
        json!({"method": "password", "role": user.role}),
    )
    .await;
    Ok(Created(session(&state, &user)?))
}

#[derive(Deserialize)]
pub struct LoginBody {
    username: Option<String>,
    email: Option<String>,
    password: Option<String>,
}

pub async fn login(
    State(state): State<AppState>,
    Client(client): Client,
    body: Result<Json<LoginBody>, axum::extract::rejection::JsonRejection>,
) -> Result<Response, LegacyError> {
    let Json(body) = body.map_err(AppError::from)?;
    let identifier = body
        .email
        .or(body.username)
        .unwrap_or_default()
        .trim()
        .to_string();
    let password = body.password.unwrap_or_default();
    if identifier.is_empty() || password.is_empty() {
        return Err(AppError::Validation("email and password are required".into()).into());
    }
    let user = users::find_by_email(&state.db, &identifier).await?;
    let verified = match user.as_ref().and_then(|user| user.password_hash.as_deref()) {
        Some(hash) => auth::verify_password(&password, hash).await,
        None => {
            auth::verify_password(&password, DUMMY_HASH).await;
            false
        }
    };
    let user = match user {
        Some(user) if verified && user.active => user,
        other => {
            audit::record(
                &state.db,
                other.as_ref().map(|user| user.id),
                "login_failed",
                Some(format!("email:{}", identifier.to_lowercase())),
                &client,
                json!({"reason": if verified { "inactive" } else { "credentials" }}),
            )
            .await;
            return Err(AppError::InvalidCredentials.into());
        }
    };
    users::touch_login(&state.db, user.id).await?;
    audit::record(
        &state.db,
        Some(user.id),
        "login",
        Some(format!("user:{}", user.id)),
        &client,
        json!({"method": "password"}),
    )
    .await;
    let token = auth::issue_token(&state.config.jwt_secret, user.id, &user.role)?;
    let mut user_json = serde_json::to_value(UserView::from(&user)).map_err(AppError::internal)?;
    user_json["nombre"] = Value::String(user.name.clone());
    user_json["rol"] = Value::String(user.role.clone());
    Ok(Json(json!({
        "success": true,
        "message": i18n::message("login_ok", Locale::current()),
        "token": token,
        "data": { "token": token, "user": user_json },
    }))
    .into_response())
}

const DUMMY_HASH: &str = "$2b$12$zhCJLHl8eX4c/nuKYPzkB.M5pWdPgsZiM1U6Z8o1jt0OgqOWJ4qp6";

#[derive(Deserialize)]
pub struct GoogleBody {
    credential: Option<String>,
}

pub async fn google(
    State(state): State<AppState>,
    Client(client): Client,
    ApiJson(body): ApiJson<GoogleBody>,
) -> AppResult<Data<Value>> {
    let credential = body
        .credential
        .filter(|credential| !credential.trim().is_empty())
        .ok_or_else(|| AppError::Validation("credential is required".into()))?;
    let identity = state.google.verify(credential.trim()).await?;

    let user = if let Some(user) = users::find_by_google_sub(&state.db, &identity.sub).await? {
        user
    } else if let Some(user) = users::find_by_email(&state.db, &identity.email).await? {
        let linked = users::link_google(
            &state.db,
            user.id,
            &identity.sub,
            identity.picture.as_deref(),
        )
        .await?;
        audit::record(
            &state.db,
            Some(user.id),
            "google_link",
            Some(format!("user:{}", user.id)),
            &client,
            json!({}),
        )
        .await;
        linked
    } else {
        if !state.config.is_superadmin_email(&identity.email)
            && !settings::registration_open(&state.db).await?
        {
            return Err(AppError::RegistrationClosed);
        }
        let name = identity
            .name
            .clone()
            .filter(|name| !name.trim().is_empty())
            .unwrap_or_else(|| {
                identity
                    .email
                    .split('@')
                    .next()
                    .unwrap_or("AgroYachay")
                    .to_string()
            });
        let created = users::create(
            &state.db,
            NewUser {
                name: &name,
                email: &identity.email,
                password_hash: None,
                google_sub: Some(&identity.sub),
                avatar_url: identity.picture.as_deref(),
                role: initial_role(&state, &identity.email),
                locale: Locale::current().code(),
            },
        )
        .await?;
        audit::record(
            &state.db,
            Some(created.id),
            "register",
            Some(format!("user:{}", created.id)),
            &client,
            json!({"method": "google", "role": created.role}),
        )
        .await;
        created
    };
    if !user.active {
        return Err(AppError::AccountDisabled);
    }
    let user = promote_listed_superadmin(&state, user, &client).await?;
    users::touch_login(&state.db, user.id).await?;
    audit::record(
        &state.db,
        Some(user.id),
        "login",
        Some(format!("user:{}", user.id)),
        &client,
        json!({"method": "google"}),
    )
    .await;
    Ok(Data(session(&state, &user)?))
}

pub async fn me(user: AuthUser) -> Data<UserView> {
    Data(UserView::from(&user.user))
}

#[derive(Deserialize)]
pub struct ProfileBody {
    name: Option<String>,
    locale: Option<String>,
    #[serde(default, deserialize_with = "double_option")]
    latitude: Option<Option<f64>>,
    #[serde(default, deserialize_with = "double_option")]
    longitude: Option<Option<f64>>,
    #[serde(default, deserialize_with = "double_option")]
    place_name: Option<Option<String>>,
}

pub async fn update_me(
    State(state): State<AppState>,
    user: AuthUser,
    ApiJson(body): ApiJson<ProfileBody>,
) -> AppResult<Data<UserView>> {
    let current = user.user;
    let name = match body.name {
        Some(name) => super::extract::required_text(Some(&name), "name", 120)?,
        None => current.name.clone(),
    };
    let locale = match body.locale {
        Some(locale) if SUPPORTED_LOCALES.contains(&locale.as_str()) => locale,
        Some(_) => {
            return Err(AppError::Validation(
                "locale must be one of es, en, qu, ay".into(),
            ));
        }
        None => current.locale.clone(),
    };
    let latitude = body.latitude.unwrap_or(current.latitude);
    let longitude = body.longitude.unwrap_or(current.longitude);
    validate_coordinates(latitude, longitude)?;
    if latitude.is_some() != longitude.is_some() {
        return Err(AppError::Validation(
            "latitude and longitude must be set together".into(),
        ));
    }
    let place_name = body
        .place_name
        .unwrap_or(current.place_name.clone())
        .map(|place| place.trim().chars().take(160).collect::<String>())
        .filter(|place| !place.is_empty());
    let updated = users::update_profile(
        &state.db,
        current.id,
        ProfileUpdate {
            name,
            locale,
            latitude,
            longitude,
            place_name,
        },
    )
    .await?;
    Ok(Data(UserView::from(&updated)))
}

#[derive(Deserialize)]
pub struct PasswordBody {
    current_password: Option<String>,
    new_password: Option<String>,
}

pub async fn change_password(
    State(state): State<AppState>,
    Client(client): Client,
    user: AuthUser,
    ApiJson(body): ApiJson<PasswordBody>,
) -> AppResult<Data<Value>> {
    let new_password = body.new_password.unwrap_or_default();
    auth::validate_password(&new_password)?;
    if let Some(hash) = user.user.password_hash.as_deref() {
        let current = body.current_password.unwrap_or_default();
        if !auth::verify_password(&current, hash).await {
            return Err(AppError::InvalidCredentials);
        }
    }
    let hash = auth::hash_password(&new_password).await?;
    users::update_password(&state.db, user.id, &hash).await?;
    audit::record(
        &state.db,
        Some(user.id),
        "password_change",
        Some(format!("user:{}", user.id)),
        &client,
        json!({}),
    )
    .await;
    Ok(Data(json!({ "updated": true })))
}

#[derive(Deserialize)]
pub struct ForgotBody {
    email: Option<String>,
    locale: Option<String>,
}

fn new_reset_token() -> String {
    let bytes: [u8; 32] = rand::random();
    base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(bytes)
}

pub async fn forgot_password(
    State(state): State<AppState>,
    Client(client): Client,
    ApiJson(body): ApiJson<ForgotBody>,
) -> AppResult<Data<Value>> {
    let email = body.email.unwrap_or_default().trim().to_lowercase();
    if !valid_email(&email) {
        return Err(AppError::Validation("email is not valid".into()));
    }
    let request_locale = body
        .locale
        .as_deref()
        .and_then(Locale::parse)
        .unwrap_or_else(Locale::current);
    let user = users::find_by_email(&state.db, &email)
        .await?
        .filter(|user| user.active);
    audit::record(
        &state.db,
        user.as_ref().map(|user| user.id),
        "password_reset_request",
        Some(format!("email:{email}")),
        &client,
        json!({"account": user.is_some()}),
    )
    .await;
    if let Some(user) = user {
        let token = new_reset_token();
        password_resets::replace_for_user(&state.db, user.id, &password_resets::hash_token(&token))
            .await?;
        let link = format!(
            "{}/reset-password#token={token}",
            state.config.public_url.trim_end_matches('/')
        );
        let locale = Locale::parse(&user.locale).unwrap_or(request_locale);
        if state.mailer.is_enabled() {
            let content = emails::password_reset(locale, &user.name, &link);
            let mailer = state.mailer.clone();
            let recipient = user.email.clone();
            tokio::spawn(async move {
                match mailer.send(&recipient, &content).await {
                    Ok(()) => tracing::info!(user_id = user.id, "password reset e-mail sent"),
                    Err(error) => {
                        tracing::error!(user_id = user.id, %error, "password reset e-mail failed")
                    }
                }
            });
        } else {
            tracing::info!(email = %user.email, %link, "SMTP_HOST is empty; password reset link");
        }
    }
    Ok(Data(json!({ "sent": true })))
}

#[derive(Deserialize)]
pub struct ResetBody {
    token: Option<String>,
    new_password: Option<String>,
}

pub async fn reset_password(
    State(state): State<AppState>,
    Client(client): Client,
    ApiJson(body): ApiJson<ResetBody>,
) -> AppResult<Data<Value>> {
    let token = body.token.unwrap_or_default().trim().to_string();
    if token.is_empty() {
        return Err(AppError::Validation("token is required".into()));
    }
    let new_password = body.new_password.unwrap_or_default();
    auth::validate_password(&new_password)?;
    let user_id = password_resets::consume(&state.db, &password_resets::hash_token(&token))
        .await?
        .ok_or(AppError::ResetTokenInvalid)?;
    let user = users::find_by_id(&state.db, user_id)
        .await?
        .ok_or(AppError::ResetTokenInvalid)?;
    if !user.active {
        return Err(AppError::AccountDisabled);
    }
    let hash = auth::hash_password(&new_password).await?;
    users::update_password(&state.db, user.id, &hash).await?;
    users::touch_login(&state.db, user.id).await?;
    audit::record(
        &state.db,
        Some(user.id),
        "password_reset",
        Some(format!("user:{}", user.id)),
        &client,
        json!({"had_password": user.password_hash.is_some()}),
    )
    .await;
    let user = users::find_by_id(&state.db, user.id)
        .await?
        .ok_or(AppError::NotFound)?;
    Ok(Data(session(&state, &user)?))
}
