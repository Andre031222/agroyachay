use axum::extract::{Path, State};
use axum::{Router, routing};
use serde::Deserialize;
use serde_json::{Value, json};

use super::extract::{ApiJson, ApiQuery, Created, Data, locale_or_current, required_text};
use crate::auth::{AdminUser, AuthUser, Client};
use crate::domain::prompts::{self, FarmContext};
use crate::domain::species;
use crate::domain::telemetry::Metric;
use crate::error::{AppError, AppResult};
use crate::i18n::Locale;
use crate::infra::llm::{ChatMessage, ChatOptions};
use crate::infra::repo::advisory::{self, AdvisoryRequest, NewAdvisory, PRIORITIES, STATUSES};
use crate::infra::repo::{audit, crops, devices};
use crate::state::AppState;

pub const MAX_CHAT_MESSAGES: usize = 20;
pub const MAX_MESSAGE_CHARS: usize = 4000;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/assistant/chat", routing::post(chat))
        .route("/api/advisory", routing::get(list).post(create))
        .route("/api/advisory/{id}", routing::get(detail))
        .route("/api/advisory/{id}/answer", routing::post(answer))
}

async fn farm_context(state: &AppState, user: &AuthUser) -> AppResult<FarmContext> {
    let crop_list = crops::list_for_user(&state.db, user.id).await?;
    let crop_lines = crop_list
        .iter()
        .take(15)
        .map(|crop| {
            let species_name = species::find(&crop.species)
                .map(|found| found.name_es)
                .unwrap_or(crop.species.as_str());
            let sowing = crop
                .sowing_date
                .map(|date| format!(", sembrado el {date}"))
                .unwrap_or_default();
            format!(
                "{} ({species_name}), {:.2} ha, estado {}{sowing}",
                crop.name, crop.area_ha, crop.status
            )
        })
        .collect();
    let device_list = devices::list_for_user(&state.db, user.id).await?;
    let ids: Vec<i64> = device_list.iter().map(|device| device.id).collect();
    let latest = devices::latest_readings(&state.db, &ids).await?;
    let readings = latest
        .iter()
        .filter_map(|reading| {
            let metric = Metric::parse(&reading.metric)?;
            let device = device_list.iter().find(|d| d.id == reading.device_id)?;
            Some(format!(
                "{}: {} {:.1} {} ({})",
                device.name,
                metric.as_str(),
                reading.value,
                metric.unit(),
                reading.recorded_at.format("%Y-%m-%d %H:%M UTC")
            ))
        })
        .take(12)
        .collect();
    let place = user.user.place_name.clone().or_else(|| {
        user.user
            .latitude
            .zip(user.user.longitude)
            .map(|(lat, lon)| format!("lat {lat:.2}, lon {lon:.2}"))
    });
    Ok(FarmContext {
        user_name: user.user.name.clone(),
        place,
        crops: crop_lines,
        latest_readings: readings,
    })
}

#[derive(Deserialize)]
pub struct IncomingMessage {
    role: String,
    content: String,
}

#[derive(Deserialize)]
pub struct ChatBody {
    messages: Vec<IncomingMessage>,
    locale: Option<String>,
}

pub async fn chat(
    State(state): State<AppState>,
    user: AuthUser,
    ApiJson(body): ApiJson<ChatBody>,
) -> AppResult<Data<Value>> {
    let locale = locale_or_current(body.locale.as_deref());
    let mut conversation = Vec::new();
    for message in body.messages.iter().rev().take(MAX_CHAT_MESSAGES).rev() {
        let content = message.content.trim();
        if content.is_empty() {
            continue;
        }
        if content.chars().count() > MAX_MESSAGE_CHARS {
            return Err(AppError::Validation(format!(
                "messages must have at most {MAX_MESSAGE_CHARS} characters"
            )));
        }
        match message.role.as_str() {
            "user" => conversation.push(ChatMessage::user(content)),
            "assistant" => conversation.push(ChatMessage::assistant(content)),
            _ => {
                return Err(AppError::Validation(
                    "message role must be user or assistant".into(),
                ));
            }
        }
    }
    if conversation
        .last()
        .is_none_or(|message| message.role != "user")
    {
        return Err(AppError::Validation(
            "the last message must come from the user".into(),
        ));
    }
    let context = farm_context(&state, &user).await?;
    let mut messages = vec![ChatMessage::system(format!(
        "{}\n{}\n\n{}",
        prompts::system_prompt(locale),
        prompts::assistant_style(),
        prompts::assistant_context(&context)
    ))];
    messages.extend(conversation);
    let model = state.text_model();
    let reply = model.chat(&messages, ChatOptions::text(0.3)).await?;
    Ok(Data(json!({
        "reply": reply,
        "provider": model.provider(),
        "model": model.model(),
    })))
}

#[derive(Deserialize)]
pub struct ListQuery {
    status: Option<String>,
    scope: Option<String>,
}

pub async fn list(
    State(state): State<AppState>,
    user: AuthUser,
    ApiQuery(query): ApiQuery<ListQuery>,
) -> AppResult<Data<Vec<AdvisoryRequest>>> {
    let status = query.status.filter(|status| !status.is_empty());
    if status
        .as_deref()
        .is_some_and(|status| !STATUSES.contains(&status))
    {
        return Err(AppError::Validation(format!(
            "status must be one of {}",
            STATUSES.join(", ")
        )));
    }
    let see_all = user.role.is_admin() && query.scope.as_deref() != Some("mine");
    let owner = if see_all { None } else { Some(user.id) };
    Ok(Data(
        advisory::list(&state.db, owner, status.as_deref()).await?,
    ))
}

pub async fn detail(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<i64>,
) -> AppResult<Data<AdvisoryRequest>> {
    let request = advisory::find(&state.db, id)
        .await?
        .ok_or(AppError::NotFound)?;
    if request.user_id != user.id && !user.role.is_admin() {
        return Err(AppError::NotFound);
    }
    Ok(Data(request))
}

#[derive(Deserialize)]
pub struct CreateBody {
    topic: Option<String>,
    priority: Option<String>,
    description: Option<String>,
    crop_id: Option<i64>,
    locale: Option<String>,
}

pub async fn create(
    State(state): State<AppState>,
    user: AuthUser,
    ApiJson(body): ApiJson<CreateBody>,
) -> AppResult<Created<AdvisoryRequest>> {
    let topic = required_text(body.topic.as_deref(), "topic", 160)?;
    let description = required_text(body.description.as_deref(), "description", 5000)?;
    let priority = body.priority.unwrap_or_else(|| "medium".into());
    if !PRIORITIES.contains(&priority.as_str()) {
        return Err(AppError::Validation(format!(
            "priority must be one of {}",
            PRIORITIES.join(", ")
        )));
    }
    let mut crop_label = None;
    if let Some(crop_id) = body.crop_id {
        let crop = crops::find_owned(&state.db, crop_id, user.id)
            .await?
            .ok_or_else(|| AppError::Validation("crop_id does not belong to you".into()))?;
        crop_label = Some(format!("{} ({})", crop.name, crop.species));
    }
    let locale = body
        .locale
        .as_deref()
        .and_then(Locale::parse)
        .unwrap_or_else(Locale::current);
    let model = state.text_model();
    let draft = match model
        .chat(
            &[
                ChatMessage::system(prompts::system_prompt(locale)),
                ChatMessage::user(prompts::advisory_draft_prompt(
                    &topic,
                    &priority,
                    &description,
                    crop_label.as_deref(),
                    locale,
                )),
            ],
            ChatOptions::text(0.4),
        )
        .await
    {
        Ok(text) => Some(text.replace("**", "")),
        Err(error) => {
            tracing::warn!(%error, "advisory draft skipped");
            None
        }
    };
    let request = advisory::create(
        &state.db,
        NewAdvisory {
            user_id: user.id,
            crop_id: body.crop_id,
            topic: &topic,
            priority: &priority,
            description: &description,
            ai_draft: draft.as_deref(),
        },
    )
    .await?;
    Ok(Created(request))
}

#[derive(Deserialize)]
pub struct AnswerBody {
    answer: Option<String>,
    status: Option<String>,
}

pub async fn answer(
    State(state): State<AppState>,
    Client(client): Client,
    AdminUser(admin): AdminUser,
    Path(id): Path<i64>,
    ApiJson(body): ApiJson<AnswerBody>,
) -> AppResult<Data<AdvisoryRequest>> {
    let text = required_text(body.answer.as_deref(), "answer", 10_000)?;
    let status = body.status.unwrap_or_else(|| "answered".into());
    if !STATUSES.contains(&status.as_str()) {
        return Err(AppError::Validation(format!(
            "status must be one of {}",
            STATUSES.join(", ")
        )));
    }
    let request = advisory::answer(&state.db, id, &text, &status, admin.id)
        .await?
        .ok_or(AppError::NotFound)?;
    audit::record(
        &state.db,
        Some(admin.id),
        "advisory_answer",
        Some(format!("advisory:{id}")),
        &client,
        json!({"status": status}),
    )
    .await;
    Ok(Data(request))
}
