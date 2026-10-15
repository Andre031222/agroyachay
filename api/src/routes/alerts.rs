use axum::extract::{Path, State};
use axum::{Router, routing};
use serde::Deserialize;
use serde_json::{Value, json};

use super::devices::device_views;
use super::extract::{ApiQuery, Data};
use crate::auth::AuthUser;
use crate::error::{AppError, AppResult};
use crate::infra::repo::alerts::{self, Alert};
use crate::infra::repo::{crops, devices, pests};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/alerts", routing::get(list))
        .route("/api/alerts/{id}/resolve", routing::post(resolve))
        .route("/api/dashboard", routing::get(dashboard))
}

#[derive(Deserialize)]
pub struct AlertQuery {
    status: Option<String>,
}

pub async fn list(
    State(state): State<AppState>,
    user: AuthUser,
    ApiQuery(query): ApiQuery<AlertQuery>,
) -> AppResult<Data<Vec<Alert>>> {
    let open_only = match query.status.as_deref().unwrap_or("open") {
        "open" => true,
        "all" => false,
        _ => {
            return Err(AppError::Validation("status must be open or all".into()));
        }
    };
    Ok(Data(
        alerts::list_for_user(&state.db, user.id, open_only, 500).await?,
    ))
}

pub async fn resolve(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<i64>,
) -> AppResult<Data<Alert>> {
    alerts::resolve_owned(&state.db, id, user.id)
        .await?
        .map(Data)
        .ok_or(AppError::NotFound)
}

pub async fn dashboard(State(state): State<AppState>, user: AuthUser) -> AppResult<Data<Value>> {
    let crop_count = crops::count_for_user(&state.db, user.id).await?;
    let my_devices = devices::list_for_user(&state.db, user.id).await?;
    let active = my_devices
        .iter()
        .filter(|device| device.status == "active")
        .count();
    let pending = devices::count_pending_recent(&state.db).await?;
    let open_alerts = alerts::count_open_for_user(&state.db, user.id).await?;
    let diagnoses = pests::count_for_user(&state.db, user.id).await?;
    let views = device_views(&state, my_devices, false).await?;
    let online = views.iter().filter(|view| view.online).count();
    let latest: Vec<Value> = views
        .iter()
        .map(|view| {
            json!({
                "device_id": view.id,
                "device_name": view.name,
                "esp32_id": view.esp32_id,
                "crop_id": view.crop_id,
                "crop_name": view.crop_name,
                "online": view.online,
                "last_seen_at": view.last_seen_at,
                "readings": view.latest,
            })
        })
        .collect();
    let recent_alerts = alerts::list_for_user(&state.db, user.id, false, 5).await?;
    Ok(Data(json!({
        "counts": {
            "crops": crop_count,
            "devices_active": active,
            "devices_online": online,
            "devices_pending": pending,
            "open_alerts": open_alerts,
            "diagnoses": diagnoses,
        },
        "latest_readings": latest,
        "recent_alerts": recent_alerts,
    })))
}
