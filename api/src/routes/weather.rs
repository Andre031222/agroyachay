use axum::extract::State;
use axum::{Router, routing};
use chrono::{Datelike, FixedOffset, Utc};
use serde::Deserialize;
use serde_json::{Value, json};

use super::extract::{ApiJson, ApiQuery, Data, locale_or_current, validate_coordinates};
use crate::auth::AuthUser;
use crate::domain::agro_weather;
use crate::domain::ai_schema::{WeatherPlan, parse_weather_plan};
use crate::domain::almanac;
use crate::domain::prompts;
use crate::domain::species;
use crate::error::{AppError, AppResult};
use crate::i18n::Locale;
use crate::infra::llm::{ChatMessage, ChatOptions, chat_json};
use crate::infra::repo::{crops, settings};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/weather", routing::get(current))
        .route("/api/weather/plan", routing::post(plan))
        .route("/api/almanac", routing::get(almanac_month))
}

pub struct Place {
    pub latitude: f64,
    pub longitude: f64,
    pub name: Option<String>,
    pub source: &'static str,
}

pub async fn resolve_place(
    state: &AppState,
    user: &AuthUser,
    latitude: Option<f64>,
    longitude: Option<f64>,
) -> AppResult<Place> {
    validate_coordinates(latitude, longitude)?;
    if let (Some(latitude), Some(longitude)) = (latitude, longitude) {
        return Ok(Place {
            latitude,
            longitude,
            name: None,
            source: "query",
        });
    }
    if latitude.is_some() || longitude.is_some() {
        return Err(AppError::Validation(
            "lat and lon must be provided together".into(),
        ));
    }
    if let (Some(latitude), Some(longitude)) = (user.user.latitude, user.user.longitude) {
        return Ok(Place {
            latitude,
            longitude,
            name: user.user.place_name.clone(),
            source: "profile",
        });
    }
    let (name, latitude, longitude) = settings::default_region(&state.db).await?;
    Ok(Place {
        latitude,
        longitude,
        name: Some(name),
        source: "default",
    })
}

#[derive(Deserialize)]
pub struct CoordinatesQuery {
    lat: Option<f64>,
    lon: Option<f64>,
}

pub async fn current(
    State(state): State<AppState>,
    user: AuthUser,
    ApiQuery(query): ApiQuery<CoordinatesQuery>,
) -> AppResult<Data<Value>> {
    let place = resolve_place(&state, &user, query.lat, query.lon).await?;
    let forecast = state
        .weather
        .forecast(place.latitude, place.longitude)
        .await?;
    let next_hours = forecast.next_hours(24);
    let agro = agro_weather::indicators(&forecast.daily, &next_hours, Locale::current());
    Ok(Data(json!({
        "location": {
            "latitude": place.latitude,
            "longitude": place.longitude,
            "name": place.name,
            "source": place.source,
            "elevation": forecast.elevation,
            "timezone": forecast.timezone,
            "utc_offset_seconds": forecast.utc_offset_seconds,
        },
        "current": forecast.current,
        "hourly": next_hours,
        "daily": forecast.daily,
        "agro": agro,
        "source": "open-meteo",
    })))
}

#[derive(Deserialize)]
pub struct PlanBody {
    lat: Option<f64>,
    lon: Option<f64>,
    locale: Option<String>,
}

pub async fn plan(
    State(state): State<AppState>,
    user: AuthUser,
    ApiJson(body): ApiJson<PlanBody>,
) -> AppResult<Data<WeatherPlan>> {
    let locale = locale_or_current(body.locale.as_deref());
    let place = resolve_place(&state, &user, body.lat, body.lon).await?;
    let forecast = state
        .weather
        .forecast(place.latitude, place.longitude)
        .await?;
    let crop_names: Vec<String> = crops::list_for_user(&state.db, user.id)
        .await?
        .into_iter()
        .filter(|crop| crop.status != "harvested" && crop.status != "inactive")
        .map(|crop| match species::find(&crop.species) {
            Some(found) => format!("{} ({})", crop.name, found.name_es),
            None => crop.name,
        })
        .collect();
    let place_label = place
        .name
        .clone()
        .unwrap_or_else(|| format!("lat {:.2}, lon {:.2}", place.latitude, place.longitude));
    let messages = vec![
        ChatMessage::system(prompts::planner_system_prompt(locale)),
        ChatMessage::user(prompts::weather_plan_prompt(
            &place_label,
            &forecast.daily,
            &crop_names,
            locale,
        )),
    ];
    let model = state.text_model();
    let plan = chat_json(
        model.as_ref(),
        messages,
        ChatOptions::json(0.3),
        parse_weather_plan,
    )
    .await?;
    Ok(Data(plan))
}

#[derive(Deserialize)]
pub struct AlmanacQuery {
    year: Option<i32>,
    month: Option<u32>,
    lat: Option<f64>,
    lon: Option<f64>,
    utc_offset_minutes: Option<i32>,
}

pub async fn almanac_month(
    State(state): State<AppState>,
    user: AuthUser,
    ApiQuery(query): ApiQuery<AlmanacQuery>,
) -> AppResult<Data<almanac::Almanac>> {
    let place = resolve_place(&state, &user, query.lat, query.lon).await?;
    let offset = query
        .utc_offset_minutes
        .unwrap_or_else(|| almanac::default_utc_offset_minutes(place.longitude));
    if !(-720..=840).contains(&offset) {
        return Err(AppError::Validation(
            "utc_offset_minutes must be within [-720, 840]".into(),
        ));
    }
    let local_now = Utc::now().with_timezone(
        &FixedOffset::east_opt(offset * 60)
            .ok_or_else(|| AppError::Validation("bad offset".into()))?,
    );
    let year = query.year.unwrap_or(local_now.year());
    let month = query.month.unwrap_or(local_now.month());
    if !(1900..=2100).contains(&year) || !(1..=12).contains(&month) {
        return Err(AppError::Validation(
            "year must be within 1900..2100 and month within 1..12".into(),
        ));
    }
    almanac::build(
        year,
        month,
        place.latitude,
        place.longitude,
        offset,
        Locale::current(),
    )
    .map(Data)
    .ok_or_else(|| AppError::Validation("invalid date".into()))
}
