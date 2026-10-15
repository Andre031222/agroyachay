use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use axum::http::{HeaderMap, header};
use chrono::Utc;
use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header, Validation, decode, encode};
use serde::{Deserialize, Serialize};

use crate::domain::roles::Role;
use crate::error::AppError;
use crate::infra::repo::audit::ClientInfo;
use crate::infra::repo::users::{self, User};
use crate::state::AppState;

pub const TOKEN_LIFETIME_HOURS: i64 = 24;
pub const BCRYPT_COST: u32 = 12;
pub const MIN_PASSWORD_LENGTH: usize = 8;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub role: String,
    pub iat: i64,
    pub exp: i64,
}

pub fn issue_token(secret: &str, user_id: i64, role: &str) -> Result<String, AppError> {
    let now = Utc::now().timestamp();
    let claims = Claims {
        sub: user_id.to_string(),
        role: role.to_string(),
        iat: now,
        exp: now + TOKEN_LIFETIME_HOURS * 3600,
    };
    encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(AppError::internal)
}

pub fn verify_token(secret: &str, token: &str) -> Result<Claims, AppError> {
    let validation = Validation::new(Algorithm::HS256);
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )
    .map(|data| data.claims)
    .map_err(|_| AppError::InvalidToken)
}

pub async fn hash_password(password: &str) -> Result<String, AppError> {
    let password = password.to_string();
    tokio::task::spawn_blocking(move || bcrypt::hash(password, BCRYPT_COST))
        .await
        .map_err(AppError::internal)?
        .map_err(AppError::internal)
}

pub async fn verify_password(password: &str, hash: &str) -> bool {
    let password = password.to_string();
    let hash = hash.to_string();
    tokio::task::spawn_blocking(move || bcrypt::verify(password, &hash).unwrap_or(false))
        .await
        .unwrap_or(false)
}

pub fn validate_password(password: &str) -> Result<(), AppError> {
    if password.chars().count() < MIN_PASSWORD_LENGTH {
        return Err(AppError::Validation(format!(
            "password must have at least {MIN_PASSWORD_LENGTH} characters"
        )));
    }
    if password.len() > 72 {
        return Err(AppError::Validation(
            "password must have at most 72 bytes".into(),
        ));
    }
    Ok(())
}

fn bearer_token(headers: &HeaderMap) -> Option<&str> {
    headers
        .get(header::AUTHORIZATION)?
        .to_str()
        .ok()?
        .strip_prefix("Bearer ")
        .map(str::trim)
        .filter(|token| !token.is_empty())
}

#[derive(Clone, Debug)]
pub struct AuthUser {
    pub id: i64,
    pub role: Role,
    pub user: User,
}

impl FromRequestParts<AppState> for AuthUser {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, AppError> {
        let token = bearer_token(&parts.headers).ok_or(AppError::Unauthorized)?;
        let claims = verify_token(&state.config.jwt_secret, token)?;
        let id: i64 = claims.sub.parse().map_err(|_| AppError::InvalidToken)?;
        let user = users::find_by_id(&state.db, id)
            .await?
            .ok_or(AppError::InvalidToken)?;
        if !user.active {
            return Err(AppError::AccountDisabled);
        }
        let role = Role::parse(&user.role).unwrap_or(Role::Farmer);
        Ok(Self { id, role, user })
    }
}

pub struct AdminUser(pub AuthUser);

impl FromRequestParts<AppState> for AdminUser {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, AppError> {
        let user = AuthUser::from_request_parts(parts, state).await?;
        if user.role.is_admin() {
            Ok(Self(user))
        } else {
            Err(AppError::Forbidden)
        }
    }
}

pub struct SuperadminUser(pub AuthUser);

impl FromRequestParts<AppState> for SuperadminUser {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, AppError> {
        let user = AuthUser::from_request_parts(parts, state).await?;
        if user.role == Role::Superadmin {
            Ok(Self(user))
        } else {
            Err(AppError::Forbidden)
        }
    }
}

pub fn client_ip(parts_headers: &HeaderMap, peer: Option<std::net::SocketAddr>) -> Option<String> {
    let forwarded = parts_headers
        .get("x-forwarded-for")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.split(',').next_back())
        .map(str::trim)
        .filter(|value| !value.is_empty());
    let real_ip = parts_headers
        .get("x-real-ip")
        .and_then(|value| value.to_str().ok())
        .map(str::trim)
        .filter(|value| !value.is_empty());
    real_ip
        .or(forwarded)
        .map(str::to_string)
        .or_else(|| peer.map(|address| address.ip().to_string()))
}

pub struct Client(pub ClientInfo);

impl<S: Send + Sync> FromRequestParts<S> for Client {
    type Rejection = std::convert::Infallible;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let peer = parts
            .extensions
            .get::<axum::extract::ConnectInfo<std::net::SocketAddr>>()
            .map(|info| info.0);
        Ok(Self(ClientInfo {
            ip: client_ip(&parts.headers, peer),
            user_agent: parts
                .headers
                .get(header::USER_AGENT)
                .and_then(|value| value.to_str().ok())
                .map(str::to_string),
        }))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tokens_round_trip_and_reject_tampering() {
        let token = issue_token("a-very-long-test-secret", 42, "farmer").unwrap();
        let claims = verify_token("a-very-long-test-secret", &token).unwrap();
        assert_eq!(claims.sub, "42");
        assert_eq!(claims.role, "farmer");
        assert_eq!(claims.exp - claims.iat, 24 * 3600);
        assert!(verify_token("another-secret-entirely", &token).is_err());
    }

    #[test]
    fn proxy_headers_identify_the_client() {
        let mut headers = HeaderMap::new();
        headers.insert(
            "x-forwarded-for",
            "198.51.100.7, 203.0.113.9".parse().unwrap(),
        );
        assert_eq!(client_ip(&headers, None), Some("203.0.113.9".into()));
        headers.insert("x-real-ip", "10.0.0.2".parse().unwrap());
        assert_eq!(client_ip(&headers, None), Some("10.0.0.2".into()));
    }

    #[test]
    fn short_passwords_are_rejected() {
        assert!(validate_password("short").is_err());
        assert!(validate_password("long enough").is_ok());
    }
}
