pub mod admin;
pub mod advisory;
pub mod alerts;
pub mod auth;
pub mod compat;
pub mod crops;
pub mod devices;
pub mod extract;
pub mod inputs;
pub mod pests;
pub mod reports;
pub mod system;
pub mod weather;
pub mod yields;

use axum::Router;
use axum::extract::{ConnectInfo, Request, State};
use axum::http::{HeaderName, HeaderValue, Method, header};
use axum::middleware::{self, Next};
use axum::response::{IntoResponse, Response};
use tower_http::cors::{AllowOrigin, CorsLayer};
use tower_http::trace::TraceLayer;

use crate::auth::client_ip;
use crate::error::{AppError, LegacyError};
use crate::i18n;
use crate::state::AppState;

pub const RATE_LIMITED_PATHS: [&str; 6] = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/google",
    "/api/auth/password",
    "/api/auth/password/forgot",
    "/api/auth/password/reset",
];

async fn auth_rate_limit(State(state): State<AppState>, request: Request, next: Next) -> Response {
    let path = request.uri().path();
    if request.method() == Method::POST && RATE_LIMITED_PATHS.contains(&path) {
        let peer = request
            .extensions()
            .get::<ConnectInfo<std::net::SocketAddr>>()
            .map(|info| info.0);
        let key = client_ip(request.headers(), peer).unwrap_or_else(|| "unknown".into());
        if let Err(retry_after) = state.auth_limiter.check(&key) {
            let mut response = if path == "/api/auth/login" {
                LegacyError(AppError::RateLimited).into_response()
            } else {
                AppError::RateLimited.into_response()
            };
            if let Ok(value) = HeaderValue::from_str(&retry_after.as_secs().max(1).to_string()) {
                response.headers_mut().insert(header::RETRY_AFTER, value);
            }
            return response;
        }
    }
    next.run(request).await
}

async fn not_found() -> AppError {
    AppError::NotFound
}

fn cors(origins: &[String]) -> CorsLayer {
    let allowed: Vec<HeaderValue> = origins
        .iter()
        .filter_map(|origin| HeaderValue::from_str(origin).ok())
        .collect();
    CorsLayer::new()
        .allow_origin(AllowOrigin::list(allowed))
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::PATCH,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([
            header::AUTHORIZATION,
            header::CONTENT_TYPE,
            header::ACCEPT,
            header::ACCEPT_LANGUAGE,
        ])
        .expose_headers([
            header::CONTENT_DISPOSITION,
            header::RETRY_AFTER,
            HeaderName::from_static("x-request-id"),
        ])
}

pub fn app(state: AppState) -> Router {
    let cors_layer = cors(&state.config.cors_origins);
    Router::new()
        .merge(system::router())
        .merge(compat::router())
        .merge(auth::router())
        .merge(alerts::router())
        .merge(devices::router())
        .merge(crops::router())
        .merge(weather::router())
        .merge(pests::router())
        .merge(yields::router())
        .merge(inputs::router())
        .merge(advisory::router())
        .merge(reports::router())
        .merge(admin::router())
        .fallback(not_found)
        .layer(middleware::from_fn_with_state(
            state.clone(),
            auth_rate_limit,
        ))
        .layer(middleware::from_fn(i18n::locale_scope))
        .layer(cors_layer)
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}
