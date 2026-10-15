use axum::extract::State;
use axum::{Router, routing};
use chrono::{Duration, NaiveDate, Utc};
use serde::Deserialize;
use serde_json::{Value, json};

use super::extract::{ApiJson, Created, Data, validate_coordinates};
use super::weather::resolve_place;
use crate::auth::AuthUser;
use crate::domain::species;
use crate::domain::yield_model::{self, ClimateObservation, YieldInputs};
use crate::error::{AppError, AppResult};
use crate::infra::repo::yields::{self, NewEstimate, StoredEstimate};
use crate::infra::repo::{crops, devices, readings};
use crate::state::AppState;

pub const MIN_SENSOR_READINGS_FOR_CLIMATE: i64 = 20;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/yield/estimate", routing::post(estimate))
        .route("/api/yield/history", routing::get(history))
}

#[derive(Deserialize)]
pub struct EstimateBody {
    crop_id: Option<i64>,
    species: Option<String>,
    area_ha: Option<f64>,
    sowing_date: Option<NaiveDate>,
    lat: Option<f64>,
    lon: Option<f64>,
}

fn view(stored: &StoredEstimate) -> Value {
    let mut body = json!({
        "id": stored.id,
        "crop_id": stored.crop_id,
        "crop_name": stored.crop_name,
        "yield_t_ha": stored.yield_t_ha,
        "total_t": stored.total_t,
        "revenue_pen": stored.revenue_pen,
        "confidence": stored.confidence,
        "factors": stored.factors,
        "inputs": stored.inputs,
        "created_at": stored.created_at,
    });
    for key in ["species", "area_ha", "price_pen_kg", "sowing_date"] {
        body[key] = stored.inputs.get(key).cloned().unwrap_or(Value::Null);
    }
    body
}

pub async fn estimate(
    State(state): State<AppState>,
    user: AuthUser,
    ApiJson(body): ApiJson<EstimateBody>,
) -> AppResult<Created<Value>> {
    validate_coordinates(body.lat, body.lon)?;
    let mut climate = ClimateObservation::default();
    let (species_code, area_ha, sowing_date, latitude, longitude, crop_id) = match body.crop_id {
        Some(crop_id) => {
            let crop = crops::find_owned(&state.db, crop_id, user.id)
                .await?
                .ok_or(AppError::NotFound)?;
            let linked: Vec<i64> = devices::list_for_crop(&state.db, crop.id)
                .await?
                .iter()
                .map(|device| device.id)
                .collect();
            if !linked.is_empty() {
                let stats = readings::stats_for_devices(
                    &state.db,
                    &linked,
                    Utc::now() - Duration::days(30),
                )
                .await?;
                for stat in stats {
                    if stat.count < MIN_SENSOR_READINGS_FOR_CLIMATE {
                        continue;
                    }
                    match stat.metric.as_str() {
                        "air_temperature" => climate.mean_temperature_c = Some(stat.avg),
                        "air_humidity" => climate.mean_air_humidity_pct = Some(stat.avg),
                        _ => {}
                    }
                    climate.sensor_readings += stat.count;
                }
                if climate.sensor_readings > 0 {
                    climate.sources.push("sensors");
                }
            }
            (
                crop.species.clone(),
                crop.area_ha,
                crop.sowing_date,
                body.lat.or(crop.latitude),
                body.lon.or(crop.longitude),
                Some(crop.id),
            )
        }
        None => {
            let species_code = body
                .species
                .clone()
                .ok_or_else(|| AppError::Validation("crop_id or species is required".into()))?;
            let area = body
                .area_ha
                .ok_or_else(|| AppError::Validation("area_ha is required".into()))?;
            (
                species_code,
                area,
                body.sowing_date,
                body.lat,
                body.lon,
                None,
            )
        }
    };
    let species = species::find(&species_code).ok_or_else(|| {
        AppError::Validation(format!(
            "yield model has no parameters for species {species_code}"
        ))
    })?;
    if !(area_ha > 0.0 && area_ha <= 100_000.0) {
        return Err(AppError::Validation(
            "area_ha must be greater than 0".into(),
        ));
    }

    let place = resolve_place(&state, &user, latitude, longitude).await?;
    match state
        .weather
        .recent_climate(place.latitude, place.longitude)
        .await
    {
        Ok(summary) => {
            if climate.mean_temperature_c.is_none() {
                climate.mean_temperature_c = summary.mean_temperature_c;
            }
            if climate.mean_air_humidity_pct.is_none() {
                climate.mean_air_humidity_pct = summary.mean_air_humidity_pct;
            }
            climate.rainfall_30d_mm = summary.rainfall_30d_mm;
            climate.sources.push("open-meteo");
        }
        Err(error) => tracing::warn!(%error, "climate data unavailable for yield estimate"),
    }

    let today = Utc::now().date_naive();
    let days_since_sowing = sowing_date.map(|date| (today - date).num_days());
    let result = yield_model::estimate(YieldInputs {
        species,
        area_ha,
        days_since_sowing,
        climate,
    });
    let inputs = json!({
        "species": species.code,
        "area_ha": area_ha,
        "sowing_date": sowing_date,
        "latitude": place.latitude,
        "longitude": place.longitude,
        "price_pen_kg": result.price_pen_kg,
    });
    let stored = yields::insert(
        &state.db,
        NewEstimate {
            user_id: user.id,
            crop_id,
            inputs,
            yield_t_ha: result.yield_t_ha,
            total_t: result.total_t,
            revenue_pen: result.revenue_pen,
            confidence: result.confidence,
            factors: serde_json::to_value(&result.factors).map_err(AppError::internal)?,
        },
    )
    .await?;
    Ok(Created(view(&stored)))
}

pub async fn history(State(state): State<AppState>, user: AuthUser) -> AppResult<Data<Vec<Value>>> {
    let rows = yields::list_for_user(&state.db, user.id, 200).await?;
    Ok(Data(rows.iter().map(view).collect()))
}
