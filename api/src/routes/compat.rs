use axum::body::Bytes;
use axum::extract::{Query, State};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::{Json, Router, routing};
use chrono::{SecondsFormat, Utc};
use serde::Deserialize;
use serde_json::{Value, json};

use crate::domain::telemetry::{Metric, TelemetryError, parse_payload};
use crate::domain::thresholds::evaluate_all;
use crate::error::LegacyError;
use crate::i18n::{self, Locale};
use crate::infra::repo::{alerts, devices, readings};
use crate::state::AppState;

pub const RECENT_READINGS_LIMIT: i64 = 9;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/sensores/lectura", routing::post(receive_reading))
        .route(
            "/api/sensores/lecturas-recientes",
            routing::get(recent_readings),
        )
}

fn legacy_failure(status: StatusCode, key: &str, extra: Value) -> Response {
    let mut body = json!({
        "success": false,
        "message": i18n::message(key, Locale::current()),
    });
    if let (Value::Object(target), Value::Object(source)) = (&mut body, extra) {
        target.extend(source);
    }
    (status, Json(body)).into_response()
}

fn iso(instant: chrono::DateTime<Utc>) -> String {
    instant.to_rfc3339_opts(SecondsFormat::Secs, false)
}

pub async fn receive_reading(
    State(state): State<AppState>,
    body: Bytes,
) -> Result<Response, LegacyError> {
    let payload: Value = match serde_json::from_slice(&body) {
        Ok(value) => value,
        Err(_) => {
            return Ok(legacy_failure(
                StatusCode::BAD_REQUEST,
                "no_data",
                json!({}),
            ));
        }
    };
    let telemetry = match parse_payload(&payload, Utc::now()) {
        Ok(telemetry) => telemetry,
        Err(TelemetryError::NoData) => {
            return Ok(legacy_failure(
                StatusCode::BAD_REQUEST,
                "no_data",
                json!({}),
            ));
        }
        Err(TelemetryError::MissingEsp32Id) => {
            return Ok(legacy_failure(
                StatusCode::BAD_REQUEST,
                "missing_esp32_id",
                json!({}),
            ));
        }
        Err(TelemetryError::NoValidReadings(rejected)) => {
            let extra = if rejected.is_empty() {
                json!({})
            } else {
                json!({ "errores": rejected })
            };
            return Ok(legacy_failure(
                StatusCode::BAD_REQUEST,
                "no_valid_readings",
                extra,
            ));
        }
    };

    let device_id = devices::register_contact(&state.db, &telemetry.esp32_id).await?;
    let stored = readings::insert_batch(
        &state.db,
        device_id,
        &telemetry.values,
        telemetry.recorded_at,
    )
    .await? as usize;
    alerts::resolve_offline(&state.db, device_id).await?;

    let device = devices::find_by_id(&state.db, device_id).await?;
    let thresholds = devices::thresholds(&state.db, device_id).await?;
    let breaches = evaluate_all(&thresholds, &telemetry.values);
    if device
        .as_ref()
        .is_some_and(|device| device.user_id.is_some())
        && !breaches.is_empty()
    {
        alerts::open_breaches(&state.db, device_id, &breaches).await?;
    }

    let mut response = json!({
        "success": true,
        "message": i18n::message_with_count("readings_saved", Locale::current(), stored),
        "sensor_id": device_id,
        "esp32_id": telemetry.esp32_id,
        "lecturas_procesadas": stored,
        "timestamp": iso(telemetry.recorded_at),
    });
    if !telemetry.rejected.is_empty() {
        response["errores"] = json!(telemetry.rejected);
    }
    if !breaches.is_empty() {
        let now = iso(Utc::now());
        response["alertas"] = Value::Array(
            breaches
                .iter()
                .map(|breach| {
                    let threshold = thresholds
                        .iter()
                        .find(|threshold| threshold.metric == breach.metric);
                    json!({
                        "sensor_id": device_id,
                        "tipo": breach.metric.legacy_name(),
                        "valor": breach.value,
                        "nivel": breach.kind.legacy_level(),
                        "umbral": {
                            "min": threshold.map(|t| t.min),
                            "max": threshold.map(|t| t.max),
                            "unidad": breach.metric.unit(),
                        },
                        "timestamp": now,
                    })
                })
                .collect(),
        );
    }
    Ok((StatusCode::CREATED, Json(response)).into_response())
}

#[derive(Deserialize)]
pub struct RecentQuery {
    esp32_id: Option<String>,
}

pub async fn recent_readings(
    State(state): State<AppState>,
    Query(query): Query<RecentQuery>,
) -> Result<Response, LegacyError> {
    let esp32_id = query.esp32_id.unwrap_or_default().trim().to_string();
    if esp32_id.is_empty() {
        return Ok(legacy_failure(
            StatusCode::BAD_REQUEST,
            "missing_esp32_id",
            json!({ "lecturas": [] }),
        ));
    }
    let Some(device) = devices::find_by_esp32_id(&state.db, &esp32_id).await? else {
        return Ok(legacy_failure(
            StatusCode::NOT_FOUND,
            "device_not_found",
            json!({ "lecturas": [] }),
        ));
    };
    let rows = readings::most_recent(&state.db, device.id, RECENT_READINGS_LIMIT).await?;
    let lecturas: Vec<Value> = rows
        .iter()
        .map(|row| {
            let metric = Metric::parse(&row.metric);
            json!({
                "tipo_lectura": metric.map(|m| m.legacy_name()).unwrap_or(row.metric.as_str()),
                "valor": row.value,
                "unidad": metric.map(|m| m.legacy_unit()).unwrap_or(""),
                "timestamp": iso(row.recorded_at),
            })
        })
        .collect();
    Ok(Json(json!({
        "success": true,
        "esp32_id": esp32_id,
        "lecturas": lecturas,
    }))
    .into_response())
}
