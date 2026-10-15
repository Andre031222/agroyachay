use axum::extract::{FromRequest, FromRequestParts};
use axum::response::{IntoResponse, Response};
use serde::{Deserialize, Deserializer, Serialize};
use serde_json::{Value, json};

use crate::error::AppError;
use crate::i18n::Locale;

#[derive(FromRequest)]
#[from_request(via(axum::Json), rejection(AppError))]
pub struct ApiJson<T>(pub T);

#[derive(FromRequestParts)]
#[from_request(via(axum::extract::Query), rejection(AppError))]
pub struct ApiQuery<T>(pub T);

pub fn double_option<'de, T, D>(deserializer: D) -> Result<Option<Option<T>>, D::Error>
where
    T: Deserialize<'de>,
    D: Deserializer<'de>,
{
    Option::<T>::deserialize(deserializer).map(Some)
}

pub struct Data<T>(pub T);

impl<T: Serialize> IntoResponse for Data<T> {
    fn into_response(self) -> Response {
        axum::Json(json!({ "data": self.0 })).into_response()
    }
}

pub struct Created<T>(pub T);

impl<T: Serialize> IntoResponse for Created<T> {
    fn into_response(self) -> Response {
        (
            axum::http::StatusCode::CREATED,
            axum::Json(json!({ "data": self.0 })),
        )
            .into_response()
    }
}

pub struct Paged<T> {
    pub items: Vec<T>,
    pub page: i64,
    pub per_page: i64,
    pub total: i64,
}

impl<T: Serialize> IntoResponse for Paged<T> {
    fn into_response(self) -> Response {
        axum::Json(json!({
            "data": self.items,
            "meta": {"page": self.page, "per_page": self.per_page, "total": self.total},
        }))
        .into_response()
    }
}

pub fn page_bounds(page: Option<i64>, per_page: Option<i64>) -> (i64, i64) {
    (
        page.unwrap_or(1).max(1),
        per_page.unwrap_or(20).clamp(1, 100),
    )
}

pub fn locale_or_current(requested: Option<&str>) -> Locale {
    requested
        .and_then(Locale::parse)
        .unwrap_or_else(Locale::current)
}

pub fn non_empty(value: Option<String>) -> Option<String> {
    value
        .map(|text| text.trim().to_string())
        .filter(|text| !text.is_empty())
}

pub fn required_text(value: Option<&str>, field: &str, max: usize) -> Result<String, AppError> {
    let text = value.map(str::trim).unwrap_or("");
    if text.is_empty() {
        return Err(AppError::Validation(format!("{field} is required")));
    }
    if text.chars().count() > max {
        return Err(AppError::Validation(format!(
            "{field} must have at most {max} characters"
        )));
    }
    Ok(text.to_string())
}

pub fn validate_coordinates(latitude: Option<f64>, longitude: Option<f64>) -> Result<(), AppError> {
    if latitude.is_some_and(|value| !(-90.0..=90.0).contains(&value)) {
        return Err(AppError::Validation(
            "latitude must be within [-90, 90]".into(),
        ));
    }
    if longitude.is_some_and(|value| !(-180.0..=180.0).contains(&value)) {
        return Err(AppError::Validation(
            "longitude must be within [-180, 180]".into(),
        ));
    }
    Ok(())
}

pub fn empty_object() -> Value {
    json!({})
}
