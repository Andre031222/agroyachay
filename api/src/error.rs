use axum::Json;
use axum::extract::multipart::MultipartError;
use axum::extract::rejection::{JsonRejection, QueryRejection};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde_json::{Value, json};

use crate::i18n::{self, Locale};

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("bad request: {0}")]
    BadRequest(String),
    #[error("validation failed: {0}")]
    Validation(String),
    #[error("unauthorized")]
    Unauthorized,
    #[error("invalid credentials")]
    InvalidCredentials,
    #[error("invalid token")]
    InvalidToken,
    #[error("forbidden")]
    Forbidden,
    #[error("account disabled")]
    AccountDisabled,
    #[error("not found")]
    NotFound,
    #[error("conflict: {0}")]
    Conflict(&'static str),
    #[error("rate limited")]
    RateLimited,
    #[error("ai unavailable: {0}")]
    AiUnavailable(String),
    #[error("ai returned an invalid response")]
    AiInvalidResponse,
    #[error("weather unavailable: {0}")]
    WeatherUnavailable(String),
    #[error("payload too large")]
    PayloadTooLarge,
    #[error("unsupported media type")]
    UnsupportedMediaType,
    #[error("registration closed")]
    RegistrationClosed,
    #[error("google sign-in not configured")]
    GoogleNotConfigured,
    #[error("password reset token invalid")]
    ResetTokenInvalid,
    #[error("google token invalid: {0}")]
    GoogleTokenInvalid(String),
    #[error("database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("internal error: {0}")]
    Internal(String),
}

pub type AppResult<T> = Result<T, AppError>;

impl AppError {
    pub fn internal(error: impl std::fmt::Display) -> Self {
        Self::Internal(error.to_string())
    }

    pub fn status(&self) -> StatusCode {
        match self {
            Self::BadRequest(_) | Self::ResetTokenInvalid => StatusCode::BAD_REQUEST,
            Self::Validation(_) => StatusCode::UNPROCESSABLE_ENTITY,
            Self::Unauthorized | Self::InvalidCredentials | Self::InvalidToken => {
                StatusCode::UNAUTHORIZED
            }
            Self::GoogleTokenInvalid(_) => StatusCode::UNAUTHORIZED,
            Self::Forbidden | Self::AccountDisabled | Self::RegistrationClosed => {
                StatusCode::FORBIDDEN
            }
            Self::NotFound => StatusCode::NOT_FOUND,
            Self::Conflict(_) => StatusCode::CONFLICT,
            Self::RateLimited => StatusCode::TOO_MANY_REQUESTS,
            Self::AiUnavailable(_) | Self::WeatherUnavailable(_) | Self::GoogleNotConfigured => {
                StatusCode::SERVICE_UNAVAILABLE
            }
            Self::AiInvalidResponse => StatusCode::BAD_GATEWAY,
            Self::PayloadTooLarge => StatusCode::PAYLOAD_TOO_LARGE,
            Self::UnsupportedMediaType => StatusCode::UNSUPPORTED_MEDIA_TYPE,
            Self::Database(_) | Self::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    pub fn code(&self) -> &'static str {
        match self {
            Self::BadRequest(_) => "bad_request",
            Self::Validation(_) => "validation_error",
            Self::Unauthorized => "unauthorized",
            Self::InvalidCredentials => "invalid_credentials",
            Self::InvalidToken => "token_invalid",
            Self::Forbidden => "forbidden",
            Self::AccountDisabled => "account_disabled",
            Self::NotFound => "not_found",
            Self::Conflict(code) => code,
            Self::RateLimited => "rate_limited",
            Self::AiUnavailable(_) => "ai_unavailable",
            Self::AiInvalidResponse => "ai_invalid_response",
            Self::WeatherUnavailable(_) => "weather_unavailable",
            Self::PayloadTooLarge => "payload_too_large",
            Self::UnsupportedMediaType => "unsupported_media_type",
            Self::RegistrationClosed => "registration_closed",
            Self::GoogleNotConfigured => "google_not_configured",
            Self::GoogleTokenInvalid(_) => "google_token_invalid",
            Self::ResetTokenInvalid => "reset_token_invalid",
            Self::Database(_) | Self::Internal(_) => "internal",
        }
    }

    pub fn detail(&self) -> Option<&str> {
        match self {
            Self::BadRequest(detail) | Self::Validation(detail) => Some(detail.as_str()),
            _ => None,
        }
    }

    pub fn localized_message(&self, locale: Locale) -> String {
        i18n::message(self.code(), locale)
    }

    pub fn body(&self, locale: Locale) -> Value {
        let mut error = json!({
            "code": self.code(),
            "message": self.localized_message(locale),
        });
        if let Some(detail) = self.detail() {
            error["detail"] = Value::String(detail.to_string());
        }
        json!({ "error": error })
    }

    fn log(&self) {
        match self {
            Self::Database(error) => tracing::error!(%error, "database error"),
            Self::Internal(error) => tracing::error!(%error, "internal error"),
            Self::AiUnavailable(reason) => tracing::warn!(%reason, "ai unavailable"),
            Self::WeatherUnavailable(reason) => tracing::warn!(%reason, "weather unavailable"),
            Self::GoogleTokenInvalid(reason) => tracing::info!(%reason, "google token rejected"),
            _ => {}
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        self.log();
        let locale = Locale::current();
        (self.status(), Json(self.body(locale))).into_response()
    }
}

impl From<JsonRejection> for AppError {
    fn from(rejection: JsonRejection) -> Self {
        Self::BadRequest(rejection.body_text())
    }
}

impl From<QueryRejection> for AppError {
    fn from(rejection: QueryRejection) -> Self {
        Self::BadRequest(rejection.body_text())
    }
}

impl From<MultipartError> for AppError {
    fn from(error: MultipartError) -> Self {
        if error.status() == StatusCode::PAYLOAD_TOO_LARGE {
            Self::PayloadTooLarge
        } else {
            Self::BadRequest(error.body_text())
        }
    }
}

pub struct LegacyError(pub AppError);

impl IntoResponse for LegacyError {
    fn into_response(self) -> Response {
        self.0.log();
        let locale = Locale::current();
        let mut body = self.0.body(locale);
        body["success"] = Value::Bool(false);
        body["message"] = Value::String(self.0.localized_message(locale));
        (self.0.status(), Json(body)).into_response()
    }
}

impl From<AppError> for LegacyError {
    fn from(error: AppError) -> Self {
        Self(error)
    }
}

impl From<sqlx::Error> for LegacyError {
    fn from(error: sqlx::Error) -> Self {
        Self(AppError::Database(error))
    }
}
