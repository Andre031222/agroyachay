use axum::extract::{Path, State};
use axum::http::header;
use axum::response::{IntoResponse, Response};
use axum::{Router, routing};
use chrono::{Duration, Utc};
use serde_json::{Value, json};

use super::devices::device_views;
use super::extract::Data;
use crate::auth::AuthUser;
use crate::domain::inputs;
use crate::domain::species;
use crate::error::{AppError, AppResult};
use crate::i18n::Locale;
use crate::infra::repo::crops::Crop;
use crate::infra::repo::users::UserView;
use crate::infra::repo::{alerts, crops, devices, pests, products, readings, settings, yields};
use crate::infra::spreadsheet::{self, Cell, Sheet};
use crate::state::AppState;

pub const EXPORT_ROW_LIMIT: i64 = 50_000;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/reports/summary", routing::get(summary))
        .route("/api/reports/{file}", routing::get(spreadsheet_download))
}

fn round2(value: f64) -> f64 {
    (value * 100.0).round() / 100.0
}

struct CropFinance {
    crop: Crop,
    input_cost_pen: Option<f64>,
    expected_total_t: Option<f64>,
    expected_revenue_pen: Option<f64>,
    estimate_confidence: Option<f64>,
}

async fn crop_finances(state: &AppState, user_id: i64) -> AppResult<Vec<CropFinance>> {
    let crop_list = crops::list_for_user(&state.db, user_id).await?;
    let estimates = yields::latest_per_crop(&state.db, user_id).await?;
    let prices = products::price_book(&state.db).await?;
    let labour = settings::labour_day_pen(&state.db).await?;
    Ok(crop_list
        .into_iter()
        .map(|crop| {
            let input_cost_pen = species::find(&crop.species).map(|found| {
                inputs::calculate(found, crop.area_ha, None, labour, &prices).total_pen
            });
            let estimate = estimates
                .iter()
                .find(|estimate| estimate.crop_id == Some(crop.id));
            CropFinance {
                input_cost_pen,
                expected_total_t: estimate.map(|e| e.total_t),
                expected_revenue_pen: estimate.map(|e| e.revenue_pen),
                estimate_confidence: estimate.map(|e| e.confidence),
                crop,
            }
        })
        .collect())
}

pub async fn summary(State(state): State<AppState>, user: AuthUser) -> AppResult<Data<Value>> {
    let finances = crop_finances(&state, user.id).await?;
    let device_list = devices::list_for_user(&state.db, user.id).await?;
    let device_ids: Vec<i64> = device_list.iter().map(|device| device.id).collect();
    let views = device_views(&state, device_list, false).await?;
    let since = Utc::now() - Duration::days(30);
    let stats = readings::stats_for_devices(&state.db, &device_ids, since).await?;
    let recent_alerts = alerts::list_for_user(&state.db, user.id, false, 20).await?;
    let open_alerts = alerts::count_open_for_user(&state.db, user.id).await?;
    let diagnoses = pests::list_for_user(&state.db, user.id, 10).await?;

    let total_area: f64 = finances.iter().map(|f| f.crop.area_ha).sum();
    let total_cost: f64 = finances.iter().filter_map(|f| f.input_cost_pen).sum();
    let total_revenue: f64 = finances.iter().filter_map(|f| f.expected_revenue_pen).sum();
    let crops_json: Vec<Value> = finances
        .iter()
        .map(|finance| {
            let mut crop = serde_json::to_value(&finance.crop).unwrap_or(Value::Null);
            crop["input_cost_pen"] = json!(finance.input_cost_pen);
            crop["expected_total_t"] = json!(finance.expected_total_t);
            crop["expected_revenue_pen"] = json!(finance.expected_revenue_pen);
            crop["estimate_confidence"] = json!(finance.estimate_confidence);
            crop["expected_margin_pen"] = json!(
                finance
                    .expected_revenue_pen
                    .zip(finance.input_cost_pen)
                    .map(|(revenue, cost)| round2(revenue - cost))
            );
            crop
        })
        .collect();
    let diagnoses_json: Vec<Value> = diagnoses
        .iter()
        .map(|row| {
            json!({
                "id": row.id,
                "crop": row.crop_label,
                "healthy": row.healthy,
                "disease": row.disease,
                "confidence": row.confidence,
                "severity": row.severity,
                "created_at": row.created_at,
            })
        })
        .collect();
    Ok(Data(json!({
        "generated_at": Utc::now(),
        "user": UserView::from(&user.user),
        "totals": {
            "crops": finances.len(),
            "area_ha": round2(total_area),
            "devices": views.len(),
            "devices_online": views.iter().filter(|view| view.online).count(),
            "open_alerts": open_alerts,
            "diagnoses": diagnoses.len(),
            "input_cost_pen": round2(total_cost),
            "expected_revenue_pen": round2(total_revenue),
            "expected_margin_pen": round2(total_revenue - total_cost),
        },
        "crops": crops_json,
        "devices": views,
        "readings_30d": stats,
        "alerts": recent_alerts,
        "diagnoses": diagnoses_json,
    })))
}

fn headers(locale: Locale, spanish: &[&str], english: &[&str]) -> Vec<String> {
    let chosen = if locale == Locale::En {
        english
    } else {
        spanish
    };
    chosen.iter().map(|text| text.to_string()).collect()
}

pub async fn spreadsheet_download(
    State(state): State<AppState>,
    user: AuthUser,
    Path(file): Path<String>,
) -> AppResult<Response> {
    let kind = file.strip_suffix(".xlsx").ok_or(AppError::NotFound)?;
    let locale = Locale::current();
    let sheet = match kind {
        "crops" => {
            let list = crops::list_for_user(&state.db, user.id).await?;
            Sheet {
                name: if locale == Locale::En {
                    "Crops"
                } else {
                    "Cultivos"
                }
                .into(),
                headers: headers(
                    locale,
                    &[
                        "ID",
                        "Nombre",
                        "Especie",
                        "Variedad",
                        "Área (ha)",
                        "Estado",
                        "Siembra",
                        "Cosecha",
                        "Ubicación",
                        "Latitud",
                        "Longitud",
                        "Dispositivos",
                    ],
                    &[
                        "ID",
                        "Name",
                        "Species",
                        "Variety",
                        "Area (ha)",
                        "Status",
                        "Sowing",
                        "Harvest",
                        "Location",
                        "Latitude",
                        "Longitude",
                        "Devices",
                    ],
                ),
                rows: list
                    .into_iter()
                    .map(|crop| {
                        vec![
                            Cell::Number(crop.id as f64),
                            crop.name.into(),
                            species::find(&crop.species)
                                .map(|found| found.localized_name(locale).to_string())
                                .unwrap_or(crop.species)
                                .into(),
                            crop.variety.into(),
                            crop.area_ha.into(),
                            crop.status.into(),
                            crop.sowing_date.map(|date| date.to_string()).into(),
                            crop.harvest_date.map(|date| date.to_string()).into(),
                            crop.location_name.into(),
                            crop.latitude.into(),
                            crop.longitude.into(),
                            Cell::Number(crop.device_count as f64),
                        ]
                    })
                    .collect(),
            }
        }
        "readings" => {
            let rows = readings::export_for_user(
                &state.db,
                user.id,
                Utc::now() - Duration::days(30),
                EXPORT_ROW_LIMIT,
            )
            .await?;
            Sheet {
                name: if locale == Locale::En {
                    "Readings"
                } else {
                    "Lecturas"
                }
                .into(),
                headers: headers(
                    locale,
                    &[
                        "Fecha y hora (UTC)",
                        "Dispositivo",
                        "ESP32",
                        "Variable",
                        "Valor",
                    ],
                    &["Timestamp (UTC)", "Device", "ESP32", "Metric", "Value"],
                ),
                rows: rows
                    .into_iter()
                    .map(|row| {
                        vec![
                            row.recorded_at
                                .format("%Y-%m-%d %H:%M:%S")
                                .to_string()
                                .into(),
                            row.device_name.into(),
                            row.esp32_id.into(),
                            row.metric.into(),
                            row.value.into(),
                        ]
                    })
                    .collect(),
            }
        }
        "finance" => {
            let finances = crop_finances(&state, user.id).await?;
            Sheet {
                name: if locale == Locale::En {
                    "Finance"
                } else {
                    "Finanzas"
                }
                .into(),
                headers: headers(
                    locale,
                    &[
                        "Cultivo",
                        "Especie",
                        "Área (ha)",
                        "Costo de insumos (PEN)",
                        "Producción esperada (t)",
                        "Ingreso esperado (PEN)",
                        "Margen esperado (PEN)",
                        "Confianza (%)",
                    ],
                    &[
                        "Crop",
                        "Species",
                        "Area (ha)",
                        "Input cost (PEN)",
                        "Expected output (t)",
                        "Expected revenue (PEN)",
                        "Expected margin (PEN)",
                        "Confidence (%)",
                    ],
                ),
                rows: finances
                    .into_iter()
                    .map(|finance| {
                        let margin = finance
                            .expected_revenue_pen
                            .zip(finance.input_cost_pen)
                            .map(|(revenue, cost)| round2(revenue - cost));
                        vec![
                            finance.crop.name.into(),
                            finance.crop.species.into(),
                            finance.crop.area_ha.into(),
                            finance.input_cost_pen.into(),
                            finance.expected_total_t.into(),
                            finance.expected_revenue_pen.into(),
                            margin.into(),
                            finance.estimate_confidence.into(),
                        ]
                    })
                    .collect(),
            }
        }
        _ => return Err(AppError::NotFound),
    };
    let bytes = spreadsheet::build(vec![sheet])?;
    let filename = format!("agroyachay-{kind}-{}.xlsx", Utc::now().format("%Y%m%d"));
    Ok((
        [
            (
                header::CONTENT_TYPE,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet".to_string(),
            ),
            (
                header::CONTENT_DISPOSITION,
                format!("attachment; filename=\"{filename}\""),
            ),
        ],
        bytes,
    )
        .into_response())
}
