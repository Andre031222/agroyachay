use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::{FromRow, PgPool};

use crate::error::AppResult;

#[derive(Clone, Debug, FromRow, Serialize)]
pub struct AdvisoryRequest {
    pub id: i64,
    pub user_id: i64,
    pub user_name: String,
    pub user_email: String,
    pub crop_id: Option<i64>,
    pub crop_name: Option<String>,
    pub topic: String,
    pub priority: String,
    pub description: String,
    pub status: String,
    pub ai_draft: Option<String>,
    pub answer: Option<String>,
    pub answered_by: Option<i64>,
    pub answered_by_name: Option<String>,
    pub created_at: DateTime<Utc>,
    pub answered_at: Option<DateTime<Utc>>,
}

pub const PRIORITIES: [&str; 4] = ["low", "medium", "high", "urgent"];
pub const STATUSES: [&str; 4] = ["open", "in_progress", "answered", "closed"];

const SELECT: &str = "SELECT a.id, a.user_id, u.name AS user_name, u.email AS user_email, a.crop_id, c.name AS crop_name, \
     a.topic, a.priority, a.description, a.status, a.ai_draft, a.answer, a.answered_by, \
     answerer.name AS answered_by_name, a.created_at, a.answered_at \
     FROM advisory_requests a JOIN users u ON u.id = a.user_id \
     LEFT JOIN crops c ON c.id = a.crop_id LEFT JOIN users answerer ON answerer.id = a.answered_by";

pub struct NewAdvisory<'a> {
    pub user_id: i64,
    pub crop_id: Option<i64>,
    pub topic: &'a str,
    pub priority: &'a str,
    pub description: &'a str,
    pub ai_draft: Option<&'a str>,
}

pub async fn find(db: &PgPool, id: i64) -> AppResult<Option<AdvisoryRequest>> {
    let sql = sqlx::AssertSqlSafe(format!("{SELECT} WHERE a.id = $1"));
    Ok(sqlx::query_as::<_, AdvisoryRequest>(sql)
        .bind(id)
        .fetch_optional(db)
        .await?)
}

pub async fn create(db: &PgPool, request: NewAdvisory<'_>) -> AppResult<AdvisoryRequest> {
    let id: i64 = sqlx::query_scalar(
        "INSERT INTO advisory_requests (user_id, crop_id, topic, priority, description, ai_draft) \
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
    )
    .bind(request.user_id)
    .bind(request.crop_id)
    .bind(request.topic)
    .bind(request.priority)
    .bind(request.description)
    .bind(request.ai_draft)
    .fetch_one(db)
    .await?;
    find(db, id).await?.ok_or(crate::error::AppError::NotFound)
}

pub async fn list(
    db: &PgPool,
    user_id: Option<i64>,
    status: Option<&str>,
) -> AppResult<Vec<AdvisoryRequest>> {
    let sql = sqlx::AssertSqlSafe(format!(
        "{SELECT} WHERE ($1::bigint IS NULL OR a.user_id = $1) AND ($2::text IS NULL OR a.status = $2) \
         ORDER BY a.created_at DESC, a.id DESC LIMIT 500"
    ));
    Ok(sqlx::query_as::<_, AdvisoryRequest>(sql)
        .bind(user_id)
        .bind(status)
        .fetch_all(db)
        .await?)
}

pub async fn answer(
    db: &PgPool,
    id: i64,
    answer: &str,
    status: &str,
    answered_by: i64,
) -> AppResult<Option<AdvisoryRequest>> {
    let updated = sqlx::query(
        "UPDATE advisory_requests SET answer = $2, status = $3, answered_by = $4, answered_at = now() WHERE id = $1",
    )
    .bind(id)
    .bind(answer)
    .bind(status)
    .bind(answered_by)
    .execute(db)
    .await?
    .rows_affected();
    if updated == 0 {
        return Ok(None);
    }
    find(db, id).await
}
