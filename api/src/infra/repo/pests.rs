use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::{FromRow, PgPool};

use crate::error::AppResult;

#[derive(Clone, Debug, FromRow)]
pub struct PestDiagnosis {
    pub id: i64,
    pub user_id: i64,
    pub crop_id: Option<i64>,
    pub crop_label: Option<String>,
    pub image_path: String,
    pub engine: String,
    pub model: String,
    pub healthy: bool,
    pub disease: Option<String>,
    pub confidence: f64,
    pub severity: String,
    pub result: Value,
    pub plan: Option<Value>,
    pub created_at: DateTime<Utc>,
}

pub struct NewDiagnosis<'a> {
    pub user_id: i64,
    pub crop_id: Option<i64>,
    pub crop_label: Option<&'a str>,
    pub image_path: &'a str,
    pub engine: &'a str,
    pub model: &'a str,
    pub healthy: bool,
    pub disease: Option<&'a str>,
    pub confidence: f64,
    pub severity: &'a str,
    pub result: Value,
}

const COLUMNS: &str = "id, user_id, crop_id, crop_label, image_path, engine, model, healthy, disease, \
     confidence, severity, result, plan, created_at";

pub async fn insert(db: &PgPool, diagnosis: NewDiagnosis<'_>) -> AppResult<PestDiagnosis> {
    let sql = sqlx::AssertSqlSafe(format!(
        "INSERT INTO pest_diagnoses (user_id, crop_id, crop_label, image_path, engine, model, healthy, disease, \
         confidence, severity, result) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING {COLUMNS}"
    ));
    Ok(sqlx::query_as::<_, PestDiagnosis>(sql)
        .bind(diagnosis.user_id)
        .bind(diagnosis.crop_id)
        .bind(diagnosis.crop_label)
        .bind(diagnosis.image_path)
        .bind(diagnosis.engine)
        .bind(diagnosis.model)
        .bind(diagnosis.healthy)
        .bind(diagnosis.disease)
        .bind(diagnosis.confidence)
        .bind(diagnosis.severity)
        .bind(diagnosis.result)
        .fetch_one(db)
        .await?)
}

pub async fn find_owned(db: &PgPool, id: i64, user_id: i64) -> AppResult<Option<PestDiagnosis>> {
    let sql = sqlx::AssertSqlSafe(format!(
        "SELECT {COLUMNS} FROM pest_diagnoses WHERE id = $1 AND user_id = $2"
    ));
    Ok(sqlx::query_as::<_, PestDiagnosis>(sql)
        .bind(id)
        .bind(user_id)
        .fetch_optional(db)
        .await?)
}

pub async fn list_for_user(db: &PgPool, user_id: i64, limit: i64) -> AppResult<Vec<PestDiagnosis>> {
    let sql = sqlx::AssertSqlSafe(format!(
        "SELECT {COLUMNS} FROM pest_diagnoses WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2"
    ));
    Ok(sqlx::query_as::<_, PestDiagnosis>(sql)
        .bind(user_id)
        .bind(limit)
        .fetch_all(db)
        .await?)
}

pub async fn set_plan(db: &PgPool, id: i64, plan: &Value) -> AppResult<()> {
    sqlx::query("UPDATE pest_diagnoses SET plan = $2 WHERE id = $1")
        .bind(id)
        .bind(plan)
        .execute(db)
        .await?;
    Ok(())
}

pub async fn count_for_user(db: &PgPool, user_id: i64) -> AppResult<i64> {
    Ok(
        sqlx::query_scalar("SELECT count(*) FROM pest_diagnoses WHERE user_id = $1")
            .bind(user_id)
            .fetch_one(db)
            .await?,
    )
}

pub async fn count_all(db: &PgPool, days: Option<i32>) -> AppResult<i64> {
    Ok(sqlx::query_scalar(
        "SELECT count(*) FROM pest_diagnoses WHERE ($1::int IS NULL OR created_at >= now() - make_interval(days => $1))",
    )
    .bind(days)
    .fetch_one(db)
    .await?)
}
