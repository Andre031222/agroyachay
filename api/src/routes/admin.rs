use axum::extract::{Path, State};
use axum::{Router, routing};
use chrono::{DateTime, NaiveDate, Utc};
use serde::Deserialize;
use serde_json::{Map, Value, json};

use super::extract::{ApiJson, ApiQuery, Data, Paged, page_bounds};
use crate::auth::{AdminUser, Client, SuperadminUser};
use crate::config::LlmProvider;
use crate::domain::roles::{Role, RoleChangeDenied, authorize_user_update};
use crate::error::{AppError, AppResult};
use crate::infra::repo::audit::{self, AuditEntry, AuditFilter};
use crate::infra::repo::users::{self, UserView};
use crate::infra::repo::{devices, pests, readings, settings};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/admin/stats", routing::get(stats))
        .route("/api/admin/users", routing::get(list_users))
        .route("/api/admin/users/{id}", routing::patch(update_user))
        .route("/api/admin/audit", routing::get(audit_log))
        .route(
            "/api/admin/settings",
            routing::get(get_settings).put(put_settings),
        )
}

pub async fn stats(State(state): State<AppState>, _admin: AdminUser) -> AppResult<Data<Value>> {
    let roles = users::count_by_role(&state.db).await?;
    let mut by_role = json!({"farmer": 0, "admin": 0, "superadmin": 0});
    let mut total = 0;
    for entry in &roles {
        by_role[entry.role.as_str()] = json!(entry.total);
        total += entry.total;
    }
    Ok(Data(json!({
        "users_total": total,
        "users_by_role": by_role,
        "active_last_7d": users::count_active_since_days(&state.db, 7).await?,
        "devices": devices::global_counts(&state.db).await?,
        "readings_24h": readings::count_since_hours(&state.db, 24).await?,
        "diagnoses_total": pests::count_all(&state.db, None).await?,
        "diagnoses_7d": pests::count_all(&state.db, Some(7)).await?,
    })))
}

#[derive(Deserialize)]
pub struct UsersQuery {
    q: Option<String>,
    page: Option<i64>,
    per_page: Option<i64>,
}

pub async fn list_users(
    State(state): State<AppState>,
    _admin: AdminUser,
    ApiQuery(query): ApiQuery<UsersQuery>,
) -> AppResult<Paged<UserView>> {
    let (page, per_page) = page_bounds(query.page, query.per_page);
    let (list, total) = users::list(&state.db, query.q.as_deref(), page, per_page).await?;
    Ok(Paged {
        items: list.iter().map(UserView::from).collect(),
        page,
        per_page,
        total,
    })
}

#[derive(Deserialize)]
pub struct UserPatch {
    role: Option<String>,
    active: Option<bool>,
}

pub async fn update_user(
    State(state): State<AppState>,
    Client(client): Client,
    AdminUser(admin): AdminUser,
    Path(id): Path<i64>,
    ApiJson(body): ApiJson<UserPatch>,
) -> AppResult<Data<UserView>> {
    let target = users::find_by_id(&state.db, id)
        .await?
        .ok_or(AppError::NotFound)?;
    let target_role = Role::parse(&target.role).unwrap_or(Role::Farmer);
    let new_role = match body.role.as_deref() {
        Some(raw) => Some(
            Role::parse(raw)
                .filter(|role| role.as_str() == raw.trim().to_ascii_lowercase())
                .ok_or_else(|| {
                    AppError::Validation("role must be farmer, admin or superadmin".into())
                })?,
        ),
        None => None,
    };
    authorize_user_update(admin.id, admin.role, id, target_role, new_role, body.active).map_err(
        |denied| match denied {
            RoleChangeDenied::SelfChange => AppError::Validation(
                "you cannot change your own role or deactivate yourself".into(),
            ),
            _ => AppError::Forbidden,
        },
    )?;
    let role = new_role.unwrap_or(target_role);
    let active = body.active.unwrap_or(target.active);
    let updated = users::set_role_and_active(&state.db, id, role.as_str(), active).await?;
    if role != target_role {
        audit::record(
            &state.db,
            Some(admin.id),
            "role_change",
            Some(format!("user:{id}")),
            &client,
            json!({"from": target_role.as_str(), "to": role.as_str()}),
        )
        .await;
    }
    if active != target.active {
        audit::record(
            &state.db,
            Some(admin.id),
            "activation_change",
            Some(format!("user:{id}")),
            &client,
            json!({"from": target.active, "to": active}),
        )
        .await;
    }
    Ok(Data(UserView::from(&updated)))
}

#[derive(Deserialize)]
pub struct AuditQuery {
    page: Option<i64>,
    per_page: Option<i64>,
    action: Option<String>,
    user_id: Option<i64>,
    from: Option<String>,
    to: Option<String>,
}

fn parse_bound(value: Option<&str>, end_of_day: bool) -> AppResult<Option<DateTime<Utc>>> {
    let Some(text) = value.map(str::trim).filter(|text| !text.is_empty()) else {
        return Ok(None);
    };
    if let Ok(instant) = DateTime::parse_from_rfc3339(text) {
        return Ok(Some(instant.with_timezone(&Utc)));
    }
    let date = NaiveDate::parse_from_str(text, "%Y-%m-%d")
        .map_err(|_| AppError::Validation("from/to must be YYYY-MM-DD or RFC 3339".into()))?;
    let date = if end_of_day {
        date.succ_opt().unwrap_or(date)
    } else {
        date
    };
    Ok(date.and_hms_opt(0, 0, 0).map(|naive| naive.and_utc()))
}

pub async fn audit_log(
    State(state): State<AppState>,
    _admin: AdminUser,
    ApiQuery(query): ApiQuery<AuditQuery>,
) -> AppResult<Paged<AuditEntry>> {
    let (page, per_page) = page_bounds(query.page, query.per_page);
    let filter = AuditFilter {
        action: query.action.filter(|action| !action.trim().is_empty()),
        user_id: query.user_id,
        from: parse_bound(query.from.as_deref(), false)?,
        to: parse_bound(query.to.as_deref(), true)?,
    };
    let (entries, total) = audit::list(&state.db, &filter, page, per_page).await?;
    Ok(Paged {
        items: entries,
        page,
        per_page,
        total,
    })
}

pub async fn get_settings(
    State(state): State<AppState>,
    _superadmin: SuperadminUser,
) -> AppResult<Data<Map<String, Value>>> {
    Ok(Data(settings::all(&state.db).await?))
}

fn validate_setting(key: &str, value: &Value) -> AppResult<()> {
    let valid = match key {
        settings::ANNOUNCEMENT => {
            value.is_null()
                || value
                    .as_str()
                    .is_some_and(|text| text.chars().count() <= 500)
                || value.as_object().is_some_and(|map| {
                    map.iter().all(|(locale, text)| {
                        crate::i18n::SUPPORTED_LOCALES.contains(&locale.as_str())
                            && text.as_str().is_some_and(|t| t.chars().count() <= 500)
                    })
                })
        }
        settings::REGISTRATION_OPEN => value.is_boolean(),
        settings::DEFAULT_REGION => {
            value.get("name").and_then(Value::as_str).is_some()
                && value
                    .get("latitude")
                    .and_then(Value::as_f64)
                    .is_some_and(|lat| (-90.0..=90.0).contains(&lat))
                && value
                    .get("longitude")
                    .and_then(Value::as_f64)
                    .is_some_and(|lon| (-180.0..=180.0).contains(&lon))
        }
        settings::LLM_PROVIDER => value.as_str().and_then(LlmProvider::parse).is_some(),
        settings::LABOUR_DAY_PEN => value
            .as_f64()
            .is_some_and(|price| price > 0.0 && price < 10_000.0),
        _ => false,
    };
    if valid {
        Ok(())
    } else {
        Err(AppError::Validation(format!(
            "invalid value for setting {key}"
        )))
    }
}

pub async fn put_settings(
    State(state): State<AppState>,
    Client(client): Client,
    SuperadminUser(superadmin): SuperadminUser,
    ApiJson(body): ApiJson<Map<String, Value>>,
) -> AppResult<Data<Map<String, Value>>> {
    if body.is_empty() {
        return Err(AppError::Validation("no settings provided".into()));
    }
    for (key, value) in &body {
        if !settings::KNOWN_KEYS.contains(&key.as_str()) {
            return Err(AppError::Validation(format!("unknown setting {key}")));
        }
        validate_setting(key, value)?;
    }
    let previous = settings::all(&state.db).await?;
    for (key, value) in &body {
        settings::put(&state.db, key, value, Some(superadmin.id)).await?;
        if key == settings::LLM_PROVIDER
            && let Some(provider) = value.as_str().and_then(LlmProvider::parse)
        {
            state.set_llm_provider(provider);
        }
    }
    let changes: Map<String, Value> = body
        .iter()
        .map(|(key, value)| {
            (
                key.clone(),
                json!({"from": previous.get(key).cloned().unwrap_or(Value::Null), "to": value}),
            )
        })
        .collect();
    audit::record(
        &state.db,
        Some(superadmin.id),
        "settings_change",
        Some("settings".into()),
        &client,
        Value::Object(changes),
    )
    .await;
    Ok(Data(settings::all(&state.db).await?))
}
