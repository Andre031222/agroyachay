use std::collections::BTreeMap;

use axum::extract::{Path, State};
use axum::{Router, routing};
use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

use super::extract::{ApiJson, ApiQuery, Data, double_option};
use crate::auth::{AuthUser, Client};
use crate::domain::telemetry::Metric;
use crate::domain::thresholds::Threshold;
use crate::error::{AppError, AppResult};
use crate::infra::repo::devices::{self, Device};
use crate::infra::repo::{audit, crops, readings};
use crate::state::AppState;

pub const ONLINE_WINDOW_SECONDS: i64 = 120;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/devices", routing::get(list))
        .route("/api/devices/pending", routing::get(pending))
        .route("/api/devices/{id}", routing::get(detail).patch(update))
        .route("/api/devices/{id}/claim", routing::post(claim))
        .route("/api/devices/{id}/release", routing::post(release))
        .route("/api/devices/{id}/readings", routing::get(readings_range))
}

#[derive(Clone, Debug, Serialize)]
pub struct LatestValue {
    pub value: f64,
    pub unit: &'static str,
    pub recorded_at: DateTime<Utc>,
}

#[derive(Clone, Debug, Serialize)]
pub struct DeviceView {
    pub id: i64,
    pub esp32_id: String,
    pub name: String,
    pub status: String,
    pub online: bool,
    pub crop_id: Option<i64>,
    pub crop_name: Option<String>,
    pub last_seen_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub latest: BTreeMap<String, LatestValue>,
    pub thresholds: Vec<Threshold>,
}

pub fn is_online(last_seen_at: Option<DateTime<Utc>>) -> bool {
    last_seen_at.is_some_and(|seen| Utc::now() - seen <= Duration::seconds(ONLINE_WINDOW_SECONDS))
}

pub async fn device_views(
    state: &AppState,
    list: Vec<Device>,
    with_thresholds: bool,
) -> AppResult<Vec<DeviceView>> {
    let ids: Vec<i64> = list.iter().map(|device| device.id).collect();
    let latest = devices::latest_readings(&state.db, &ids).await?;
    let mut views = Vec::with_capacity(list.len());
    for device in list {
        let latest_for_device = latest
            .iter()
            .filter(|reading| reading.device_id == device.id)
            .filter_map(|reading| {
                let metric = Metric::parse(&reading.metric)?;
                Some((
                    metric.as_str().to_string(),
                    LatestValue {
                        value: reading.value,
                        unit: metric.unit(),
                        recorded_at: reading.recorded_at,
                    },
                ))
            })
            .collect();
        let thresholds = if with_thresholds {
            devices::thresholds(&state.db, device.id).await?
        } else {
            Vec::new()
        };
        views.push(DeviceView {
            online: is_online(device.last_seen_at),
            id: device.id,
            esp32_id: device.esp32_id,
            name: device.name,
            status: device.status,
            crop_id: device.crop_id,
            crop_name: device.crop_name,
            last_seen_at: device.last_seen_at,
            created_at: device.created_at,
            latest: latest_for_device,
            thresholds,
        });
    }
    Ok(views)
}

async fn owned_device(state: &AppState, id: i64, user: &AuthUser) -> AppResult<Device> {
    devices::find_owned(&state.db, id, user.id)
        .await?
        .ok_or(AppError::NotFound)
}

async fn ensure_crop_owned(state: &AppState, crop_id: Option<i64>, user_id: i64) -> AppResult<()> {
    if let Some(crop_id) = crop_id
        && crops::find_owned(&state.db, crop_id, user_id)
            .await?
            .is_none()
    {
        return Err(AppError::Validation(
            "crop_id does not belong to you".into(),
        ));
    }
    Ok(())
}

pub async fn list(
    State(state): State<AppState>,
    user: AuthUser,
) -> AppResult<Data<Vec<DeviceView>>> {
    let list = devices::list_for_user(&state.db, user.id).await?;
    Ok(Data(device_views(&state, list, true).await?))
}

pub async fn pending(
    State(state): State<AppState>,
    _user: AuthUser,
) -> AppResult<Data<Vec<DeviceView>>> {
    let list = devices::list_pending(&state.db).await?;
    Ok(Data(device_views(&state, list, false).await?))
}

pub async fn detail(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<i64>,
) -> AppResult<Data<DeviceView>> {
    let device = owned_device(&state, id, &user).await?;
    let mut views = device_views(&state, vec![device], true).await?;
    views.pop().map(Data).ok_or(AppError::NotFound)
}

#[derive(Deserialize)]
pub struct ClaimBody {
    name: Option<String>,
    crop_id: Option<i64>,
}

pub async fn claim(
    State(state): State<AppState>,
    Client(client): Client,
    user: AuthUser,
    Path(id): Path<i64>,
    ApiJson(body): ApiJson<ClaimBody>,
) -> AppResult<Data<DeviceView>> {
    let device = devices::find_by_id(&state.db, id)
        .await?
        .ok_or(AppError::NotFound)?;
    if device.user_id.is_some() {
        return Err(AppError::Conflict("device_already_claimed"));
    }
    ensure_crop_owned(&state, body.crop_id, user.id).await?;
    let name = super::extract::non_empty(body.name)
        .map(|name| name.chars().take(80).collect::<String>())
        .unwrap_or_else(|| device.name.clone());
    if !devices::claim(&state.db, id, user.id, &name, body.crop_id).await? {
        return Err(AppError::Conflict("device_already_claimed"));
    }
    audit::record(
        &state.db,
        Some(user.id),
        "device_claim",
        Some(format!("device:{id}")),
        &client,
        json!({"esp32_id": device.esp32_id, "crop_id": body.crop_id}),
    )
    .await;
    detail(State(state), user, Path(id)).await
}

#[derive(Deserialize)]
pub struct ThresholdInput {
    metric: String,
    min: f64,
    max: f64,
}

#[derive(Deserialize)]
pub struct UpdateBody {
    name: Option<String>,
    #[serde(default, deserialize_with = "double_option")]
    crop_id: Option<Option<i64>>,
    thresholds: Option<Vec<ThresholdInput>>,
}

pub async fn update(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<i64>,
    ApiJson(body): ApiJson<UpdateBody>,
) -> AppResult<Data<DeviceView>> {
    let device = owned_device(&state, id, &user).await?;
    let name = match body.name {
        Some(name) => super::extract::required_text(Some(&name), "name", 80)?,
        None => device.name.clone(),
    };
    let crop_id = body.crop_id.unwrap_or(device.crop_id);
    ensure_crop_owned(&state, crop_id, user.id).await?;
    let mut thresholds = Vec::new();
    for input in body.thresholds.unwrap_or_default() {
        let metric = Metric::parse(&input.metric)
            .ok_or_else(|| AppError::Validation(format!("unknown metric {}", input.metric)))?;
        let threshold = Threshold {
            metric,
            min: input.min,
            max: input.max,
        };
        threshold.validate().map_err(AppError::Validation)?;
        thresholds.push(threshold);
    }
    devices::update(&state.db, id, &name, crop_id, &thresholds).await?;
    detail(State(state), user, Path(id)).await
}

pub async fn release(
    State(state): State<AppState>,
    Client(client): Client,
    user: AuthUser,
    Path(id): Path<i64>,
) -> AppResult<Data<Value>> {
    let device = owned_device(&state, id, &user).await?;
    devices::release(&state.db, id).await?;
    audit::record(
        &state.db,
        Some(user.id),
        "device_release",
        Some(format!("device:{id}")),
        &client,
        json!({"esp32_id": device.esp32_id}),
    )
    .await;
    Ok(Data(json!({"id": id, "status": "pending"})))
}

#[derive(Deserialize)]
pub struct RangeQuery {
    range: Option<String>,
}

#[derive(Serialize)]
pub struct MetricSeries {
    metric: &'static str,
    unit: &'static str,
    points: Vec<Value>,
    stats: Option<Value>,
}

pub fn range_plan(range: &str) -> Option<(Duration, Option<&'static str>, &'static str)> {
    match range {
        "1h" => Some((Duration::hours(1), None, "raw")),
        "24h" => Some((Duration::hours(24), None, "raw")),
        "7d" => Some((Duration::days(7), Some("1 hour"), "1h")),
        "30d" => Some((Duration::days(30), Some("6 hours"), "6h")),
        _ => None,
    }
}

pub async fn readings_range(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<i64>,
    ApiQuery(query): ApiQuery<RangeQuery>,
) -> AppResult<Data<Value>> {
    owned_device(&state, id, &user).await?;
    let range = query.range.unwrap_or_else(|| "24h".to_string());
    let (span, bucket, bucket_label) = range_plan(&range)
        .ok_or_else(|| AppError::Validation("range must be one of 1h, 24h, 7d, 30d".into()))?;
    let to = Utc::now();
    let since = to - span;
    let points = match bucket {
        None => readings::raw_series(&state.db, id, since).await?,
        Some(interval) => readings::bucketed_series(&state.db, id, since, interval).await?,
    };
    let series: Vec<MetricSeries> = Metric::ALL
        .iter()
        .map(|metric| {
            let metric_points: Vec<&readings::SeriesPoint> = points
                .iter()
                .filter(|point| point.metric == metric.as_str())
                .collect();
            let count: i64 = metric_points.iter().map(|point| point.n).sum();
            let stats = (count > 0).then(|| {
                let min = metric_points
                    .iter()
                    .map(|point| point.min)
                    .fold(f64::INFINITY, f64::min);
                let max = metric_points
                    .iter()
                    .map(|point| point.max)
                    .fold(f64::NEG_INFINITY, f64::max);
                let weighted: f64 = metric_points
                    .iter()
                    .map(|point| point.avg * point.n as f64)
                    .sum();
                json!({
                    "min": min,
                    "avg": (weighted / count as f64 * 100.0).round() / 100.0,
                    "max": max,
                    "count": count,
                })
            });
            MetricSeries {
                metric: metric.as_str(),
                unit: metric.unit(),
                points: metric_points
                    .iter()
                    .map(|point| {
                        json!({
                            "t": point.t,
                            "avg": (point.avg * 100.0).round() / 100.0,
                            "min": point.min,
                            "max": point.max,
                            "n": point.n,
                        })
                    })
                    .collect(),
                stats,
            }
        })
        .collect();
    Ok(Data(json!({
        "device_id": id,
        "range": range,
        "bucket": bucket_label,
        "from": since,
        "to": to,
        "series": series,
    })))
}
