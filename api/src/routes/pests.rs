use axum::extract::{DefaultBodyLimit, Multipart, Path, State};
use axum::http::header;
use axum::response::{IntoResponse, Response};
use axum::{Router, routing};
use base64::Engine;
use serde::Deserialize;
use serde_json::{Value, json};

use super::extract::{Created, Data, locale_or_current};
use crate::auth::AuthUser;
use crate::domain::ai_schema::{
    Diagnosis, PestPlan, VisionFinding, finding_only_diagnosis, parse_diagnosis_advice,
    parse_pest_plan, parse_vision_finding,
};
use crate::domain::prompts;
use crate::domain::species;
use crate::error::{AppError, AppResult};
use crate::infra::llm::{ChatMessage, ChatOptions, chat_json};
use crate::infra::repo::pests::{self, NewDiagnosis, PestDiagnosis};
use crate::infra::repo::{crops, products};
use crate::infra::storage::{ImageKind, MAX_IMAGE_BYTES, Storage};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route(
            "/api/pests/diagnose",
            routing::post(diagnose).layer(DefaultBodyLimit::max(MAX_IMAGE_BYTES + 512 * 1024)),
        )
        .route("/api/pests/history", routing::get(history))
        .route("/api/pests/{id}", routing::get(detail))
        .route("/api/pests/{id}/plan", routing::post(plan))
        .route("/api/pests/{id}/image", routing::get(image))
}

fn view(row: &PestDiagnosis) -> Value {
    let result = &row.result;
    json!({
        "id": row.id,
        "crop_id": row.crop_id,
        "crop": row.crop_label,
        "image_url": format!("/api/pests/{}/image", row.id),
        "engine": row.engine,
        "model": row.model,
        "healthy": row.healthy,
        "disease": row.disease,
        "scientific_name": result.get("scientific_name").cloned().unwrap_or(Value::Null),
        "confidence": row.confidence,
        "severity": row.severity,
        "description": result.get("description").cloned().unwrap_or(Value::Null),
        "causes": result.get("causes").cloned().unwrap_or_else(|| json!([])),
        "treatment": result.get("treatment").cloned().unwrap_or_else(|| json!([])),
        "prevention": result.get("prevention").cloned().unwrap_or_else(|| json!([])),
        "plan": row.plan,
        "created_at": row.created_at,
    })
}

struct DiagnoseForm {
    image: Option<Vec<u8>>,
    crop: Option<String>,
    crop_id: Option<i64>,
    locale: Option<String>,
}

async fn read_form(mut multipart: Multipart) -> AppResult<DiagnoseForm> {
    let mut form = DiagnoseForm {
        image: None,
        crop: None,
        crop_id: None,
        locale: None,
    };
    while let Some(field) = multipart.next_field().await? {
        let name = field.name().unwrap_or_default().to_string();
        match name.as_str() {
            "image" | "imagen" | "file" => {
                let bytes = field.bytes().await?;
                if bytes.len() > MAX_IMAGE_BYTES {
                    return Err(AppError::PayloadTooLarge);
                }
                form.image = Some(bytes.to_vec());
            }
            "crop" | "cultivo" => form.crop = super::extract::non_empty(Some(field.text().await?)),
            "crop_id" => {
                let text = field.text().await?;
                let trimmed = text.trim();
                if !trimmed.is_empty() {
                    form.crop_id =
                        Some(trimmed.parse().map_err(|_| {
                            AppError::Validation("crop_id must be a number".into())
                        })?);
                }
            }
            "locale" => form.locale = super::extract::non_empty(Some(field.text().await?)),
            _ => {}
        }
    }
    Ok(form)
}

pub async fn diagnose(
    State(state): State<AppState>,
    user: AuthUser,
    multipart: Multipart,
) -> AppResult<Created<Value>> {
    let form = read_form(multipart).await?;
    let image = form
        .image
        .ok_or_else(|| AppError::Validation("image is required".into()))?;
    let kind = Storage::validate_image(&image)?;
    let locale = locale_or_current(form.locale.as_deref());

    let mut crop_label = form.crop.clone();
    if let Some(crop_id) = form.crop_id {
        let crop = crops::find_owned(&state.db, crop_id, user.id)
            .await?
            .ok_or_else(|| AppError::Validation("crop_id does not belong to you".into()))?;
        let species_name = species::find(&crop.species)
            .map(|found| found.name_es.to_string())
            .unwrap_or(crop.species.clone());
        crop_label = Some(format!("{species_name} ({})", crop.name));
    }

    let stored_path = state.storage.save_image("pests", &image, kind).await?;
    let prepared =
        crate::infra::vision_image::prepare(&image, kind.mime(), state.config.vision_max_side);
    let encoded = base64::engine::general_purpose::STANDARD.encode(&prepared.bytes);
    let messages = vec![ChatMessage::user_with_image(
        prompts::vision_prompt(crop_label.as_deref()),
        prepared.mime,
        &encoded,
    )];
    let finding: VisionFinding = match chat_json(
        state.vision.as_ref(),
        messages,
        ChatOptions {
            temperature: 0.0,
            json: true,
            max_tokens: 500,
        },
        parse_vision_finding,
    )
    .await
    {
        Ok(finding) => finding,
        Err(error) => {
            state.storage.delete(&stored_path).await;
            return Err(error);
        }
    };
    let advice_messages = vec![
        ChatMessage::system(prompts::system_prompt(locale)),
        ChatMessage::user(prompts::diagnosis_advice_prompt(
            &finding,
            crop_label.as_deref(),
            locale,
        )),
    ];
    let text_model = state.text_model();
    let diagnosis = match chat_json(
        text_model.as_ref(),
        advice_messages,
        ChatOptions::json(0.2),
        |value| parse_diagnosis_advice(&finding, value),
    )
    .await
    {
        Ok(diagnosis) => diagnosis,
        Err(error) => {
            tracing::warn!(%error, "diagnosis advice unavailable; storing the vision finding only");
            finding_only_diagnosis(&finding)
        }
    };

    let result = serde_json::to_value(&diagnosis).map_err(AppError::internal)?;
    let row = pests::insert(
        &state.db,
        NewDiagnosis {
            user_id: user.id,
            crop_id: form.crop_id,
            crop_label: crop_label.as_deref(),
            image_path: &stored_path,
            engine: state.vision.provider(),
            model: state.vision.model(),
            healthy: diagnosis.healthy,
            disease: diagnosis.disease.as_deref(),
            confidence: diagnosis.confidence,
            severity: &diagnosis.severity,
            result,
        },
    )
    .await?;
    Ok(Created(view(&row)))
}

pub async fn history(State(state): State<AppState>, user: AuthUser) -> AppResult<Data<Vec<Value>>> {
    let rows = pests::list_for_user(&state.db, user.id, 200).await?;
    Ok(Data(rows.iter().map(view).collect()))
}

pub async fn detail(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<i64>,
) -> AppResult<Data<Value>> {
    let row = pests::find_owned(&state.db, id, user.id)
        .await?
        .ok_or(AppError::NotFound)?;
    Ok(Data(view(&row)))
}

pub async fn image(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<i64>,
) -> AppResult<Response> {
    let row = pests::find_owned(&state.db, id, user.id)
        .await?
        .ok_or(AppError::NotFound)?;
    let bytes = state.storage.read(&row.image_path).await?;
    let mime = ImageKind::from_extension(&row.image_path)
        .map(|kind| kind.mime())
        .unwrap_or("application/octet-stream");
    Ok((
        [
            (header::CONTENT_TYPE, mime),
            (header::CACHE_CONTROL, "private, max-age=86400"),
        ],
        bytes,
    )
        .into_response())
}

#[derive(Deserialize, Default)]
pub struct PlanBody {
    locale: Option<String>,
}

pub async fn plan(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<i64>,
    body: axum::body::Bytes,
) -> AppResult<Data<PestPlan>> {
    let row = pests::find_owned(&state.db, id, user.id)
        .await?
        .ok_or(AppError::NotFound)?;
    let body: PlanBody = if body.iter().all(u8::is_ascii_whitespace) {
        PlanBody::default()
    } else {
        serde_json::from_slice(&body).map_err(|error| AppError::BadRequest(error.to_string()))?
    };
    let locale = locale_or_current(body.locale.as_deref());
    let diagnosis: Diagnosis = serde_json::from_value(row.result.clone())
        .map_err(|error| AppError::internal(format!("stored diagnosis unreadable: {error}")))?;
    let catalogue: Vec<String> = products::list(&state.db, Some("agrochemical"), None, false)
        .await?
        .into_iter()
        .map(|product| product.name)
        .collect();
    let messages = vec![
        ChatMessage::system(prompts::system_prompt(locale)),
        ChatMessage::user(prompts::pest_plan_prompt(
            &diagnosis,
            row.crop_label.as_deref(),
            &catalogue,
            locale,
        )),
    ];
    let model = state.text_model();
    let plan = chat_json(
        model.as_ref(),
        messages,
        ChatOptions::json(0.2),
        parse_pest_plan,
    )
    .await?;
    let stored = serde_json::to_value(&plan).map_err(AppError::internal)?;
    pests::set_plan(&state.db, id, &stored).await?;
    Ok(Data(plan))
}
