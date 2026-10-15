use axum::extract::State;
use axum::{Router, routing};
use serde_json::{Value, json};

use super::extract::Data;
use crate::error::AppResult;
use crate::i18n::SUPPORTED_LOCALES;
use crate::infra::repo::settings;
use crate::state::AppState;

pub const PRODUCT_NAME: &str = "AgroYachay";
pub const LONG_NAME: &str = "An open-source IoT and large-language-model platform supporting agronomic and economic decision-making for Andean smallholders";

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/health", routing::get(health))
        .route("/api/config/public", routing::get(public_config))
}

fn availability(flag: bool) -> &'static str {
    if flag { "ok" } else { "unavailable" }
}

pub async fn health(State(state): State<AppState>) -> Data<Value> {
    let text_model = state.text_model();
    let (database, llm, vision) = tokio::join!(
        sqlx::query_scalar::<_, i32>("SELECT 1").fetch_one(&state.db),
        text_model.is_available(),
        state.vision.is_available(),
    );
    let database_ok = database.is_ok();
    Data(json!({
        "status": if database_ok { "ok" } else { "degraded" },
        "name": PRODUCT_NAME,
        "version": env!("CARGO_PKG_VERSION"),
        "database": availability(database_ok),
        "llm": availability(llm),
        "vision": availability(vision),
        "llm_provider": text_model.provider(),
        "llm_model": text_model.model(),
        "vision_model": state.vision.model(),
    }))
}

pub async fn public_config(State(state): State<AppState>) -> AppResult<Data<Value>> {
    let stored = settings::all(&state.db).await?;
    let (region_name, latitude, longitude) = settings::default_region(&state.db).await?;
    Ok(Data(json!({
        "name": PRODUCT_NAME,
        "long_name": LONG_NAME,
        "version": env!("CARGO_PKG_VERSION"),
        "google_client_id": if state.config.google_client_id.is_empty() {
            Value::Null
        } else {
            Value::String(state.config.google_client_id.clone())
        },
        "languages": SUPPORTED_LOCALES,
        "default_language": "es",
        "announcement": stored.get(settings::ANNOUNCEMENT).cloned().unwrap_or(Value::Null),
        "default_region": {"name": region_name, "latitude": latitude, "longitude": longitude},
        "features": {
            "google_login": state.google.is_configured(),
            "registration_open": stored
                .get(settings::REGISTRATION_OPEN)
                .and_then(Value::as_bool)
                .unwrap_or(true),
            "llm_provider": state.llm_provider().as_str(),
            "vision_engine": state.vision.provider(),
            "weather": true,
            "almanac": true,
        },
    })))
}
