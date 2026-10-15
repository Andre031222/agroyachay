use axum::extract::{Path, State};
use axum::{Router, routing};
use chrono::NaiveDate;
use serde::Deserialize;
use serde_json::{Value, json};

use super::devices::device_views;
use super::extract::{ApiJson, Created, Data, double_option, required_text, validate_coordinates};
use crate::auth::{AuthUser, Client};
use crate::domain::species::{self, SPECIES};
use crate::error::{AppError, AppResult};
use crate::i18n::Locale;
use crate::infra::repo::crops::{self, Crop, CropFields};
use crate::infra::repo::{audit, devices};
use crate::state::AppState;

pub const STATUSES: [&str; 5] = ["planned", "sown", "growing", "harvested", "inactive"];

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/crops/catalog", routing::get(catalog))
        .route("/api/crops", routing::get(list).post(create))
        .route(
            "/api/crops/{id}",
            routing::get(detail).patch(update).delete(remove),
        )
}

pub async fn catalog(_user: AuthUser) -> Data<Vec<Value>> {
    let locale = Locale::current();
    Data(
        SPECIES
            .iter()
            .map(|species| {
                json!({
                    "code": species.code,
                    "name": species.localized_name(locale),
                    "names": {
                        "es": species.name_es, "en": species.name_en,
                        "qu": species.name_qu, "ay": species.name_ay,
                    },
                    "scientific_name": species.scientific_name,
                    "base_yield_t_ha": species.base_yield_t_ha,
                    "price_pen_kg": species.price_pen_kg,
                    "cycle_days": species.cycle_days,
                    "temperature_c": species.temperature_c,
                    "air_humidity_pct": species.air_humidity_pct,
                    "rainfall_30d_mm": species.rainfall_30d_mm,
                    "altitude_m": species.altitude_m,
                    "nutrients_kg_ha": species.nutrients,
                    "seed_rate_kg_ha": species.seed_rate_kg_ha,
                    "labour_days_ha": species.labour_days_ha,
                    "sowing_months": species.sowing_months,
                    "harvest_months": species.harvest_months,
                })
            })
            .collect(),
    )
}

pub async fn list(State(state): State<AppState>, user: AuthUser) -> AppResult<Data<Vec<Crop>>> {
    Ok(Data(crops::list_for_user(&state.db, user.id).await?))
}

#[derive(Deserialize, Default)]
pub struct CropBody {
    name: Option<String>,
    species: Option<String>,
    #[serde(default, deserialize_with = "double_option")]
    variety: Option<Option<String>>,
    area_ha: Option<f64>,
    #[serde(default, deserialize_with = "double_option")]
    latitude: Option<Option<f64>>,
    #[serde(default, deserialize_with = "double_option")]
    longitude: Option<Option<f64>>,
    #[serde(default, deserialize_with = "double_option")]
    location_name: Option<Option<String>>,
    #[serde(default, deserialize_with = "double_option")]
    sowing_date: Option<Option<NaiveDate>>,
    #[serde(default, deserialize_with = "double_option")]
    harvest_date: Option<Option<NaiveDate>>,
    status: Option<String>,
    #[serde(default, deserialize_with = "double_option")]
    notes: Option<Option<String>>,
}

fn trimmed(value: Option<String>, max: usize) -> Option<String> {
    value
        .map(|text| text.trim().chars().take(max).collect::<String>())
        .filter(|text| !text.is_empty())
}

fn merge(base: CropFields, body: CropBody) -> AppResult<CropFields> {
    let name = match body.name {
        Some(name) => required_text(Some(&name), "name", 120)?,
        None => base.name,
    };
    let species = match body.species {
        Some(raw) => {
            if !species::is_known_or_other(&raw) {
                return Err(AppError::Validation(format!(
                    "species must be one of {} or other",
                    SPECIES
                        .iter()
                        .map(|s| s.code)
                        .collect::<Vec<_>>()
                        .join(", ")
                )));
            }
            species::normalize(&raw)
        }
        None => base.species,
    };
    let area_ha = body.area_ha.unwrap_or(base.area_ha);
    if !(area_ha > 0.0 && area_ha <= 100_000.0) {
        return Err(AppError::Validation(
            "area_ha must be greater than 0".into(),
        ));
    }
    let status = body.status.unwrap_or(base.status);
    if !STATUSES.contains(&status.as_str()) {
        return Err(AppError::Validation(format!(
            "status must be one of {}",
            STATUSES.join(", ")
        )));
    }
    let latitude = body.latitude.unwrap_or(base.latitude);
    let longitude = body.longitude.unwrap_or(base.longitude);
    validate_coordinates(latitude, longitude)?;
    let sowing_date = body.sowing_date.unwrap_or(base.sowing_date);
    let harvest_date = body.harvest_date.unwrap_or(base.harvest_date);
    if let (Some(sowing), Some(harvest)) = (sowing_date, harvest_date)
        && harvest < sowing
    {
        return Err(AppError::Validation(
            "harvest_date must be after sowing_date".into(),
        ));
    }
    Ok(CropFields {
        name,
        species,
        variety: body
            .variety
            .map(|value| trimmed(value, 120))
            .unwrap_or(base.variety),
        area_ha: (area_ha * 100.0).round() / 100.0,
        latitude,
        longitude,
        location_name: body
            .location_name
            .map(|value| trimmed(value, 160))
            .unwrap_or(base.location_name),
        sowing_date,
        harvest_date,
        status,
        notes: body
            .notes
            .map(|value| trimmed(value, 4000))
            .unwrap_or(base.notes),
    })
}

pub async fn create(
    State(state): State<AppState>,
    user: AuthUser,
    ApiJson(body): ApiJson<CropBody>,
) -> AppResult<Created<Crop>> {
    if body.name.is_none() || body.species.is_none() || body.area_ha.is_none() {
        return Err(AppError::Validation(
            "name, species and area_ha are required".into(),
        ));
    }
    let base = CropFields {
        name: String::new(),
        species: String::new(),
        variety: None,
        area_ha: 1.0,
        latitude: user.user.latitude,
        longitude: user.user.longitude,
        location_name: user.user.place_name.clone(),
        sowing_date: None,
        harvest_date: None,
        status: "planned".into(),
        notes: None,
    };
    let fields = merge(base, body)?;
    Ok(Created(crops::create(&state.db, user.id, fields).await?))
}

pub async fn detail(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<i64>,
) -> AppResult<Data<Value>> {
    let crop = crops::find_owned(&state.db, id, user.id)
        .await?
        .ok_or(AppError::NotFound)?;
    let linked = devices::list_for_crop(&state.db, crop.id).await?;
    let views = device_views(&state, linked, true).await?;
    let mut body = serde_json::to_value(&crop).map_err(AppError::internal)?;
    body["devices"] = serde_json::to_value(views).map_err(AppError::internal)?;
    Ok(Data(body))
}

pub async fn update(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<i64>,
    ApiJson(body): ApiJson<CropBody>,
) -> AppResult<Data<Crop>> {
    let crop = crops::find_owned(&state.db, id, user.id)
        .await?
        .ok_or(AppError::NotFound)?;
    let fields = merge(CropFields::from(&crop), body)?;
    Ok(Data(crops::update(&state.db, id, user.id, fields).await?))
}

pub async fn remove(
    State(state): State<AppState>,
    Client(client): Client,
    user: AuthUser,
    Path(id): Path<i64>,
) -> AppResult<Data<Value>> {
    let crop = crops::find_owned(&state.db, id, user.id)
        .await?
        .ok_or(AppError::NotFound)?;
    crops::delete(&state.db, id, user.id).await?;
    audit::record(
        &state.db,
        Some(user.id),
        "crop_delete",
        Some(format!("crop:{id}")),
        &client,
        json!({"name": crop.name, "species": crop.species}),
    )
    .await;
    Ok(Data(json!({"id": id, "deleted": true})))
}
