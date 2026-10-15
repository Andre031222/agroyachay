use serde_json::{Map, Value};
use sqlx::PgPool;

use crate::error::AppResult;

pub const ANNOUNCEMENT: &str = "announcement";
pub const REGISTRATION_OPEN: &str = "registration_open";
pub const DEFAULT_REGION: &str = "default_region";
pub const LLM_PROVIDER: &str = "llm_provider";
pub const LABOUR_DAY_PEN: &str = "labour_day_pen";

pub const KNOWN_KEYS: [&str; 5] = [
    ANNOUNCEMENT,
    REGISTRATION_OPEN,
    DEFAULT_REGION,
    LLM_PROVIDER,
    LABOUR_DAY_PEN,
];

pub async fn all(db: &PgPool) -> AppResult<Map<String, Value>> {
    let rows: Vec<(String, Value)> = sqlx::query_as("SELECT key, value FROM settings ORDER BY key")
        .fetch_all(db)
        .await?;
    Ok(rows.into_iter().collect())
}

pub async fn get(db: &PgPool, key: &str) -> AppResult<Option<Value>> {
    Ok(
        sqlx::query_scalar("SELECT value FROM settings WHERE key = $1")
            .bind(key)
            .fetch_optional(db)
            .await?,
    )
}

pub async fn put(db: &PgPool, key: &str, value: &Value, user_id: Option<i64>) -> AppResult<()> {
    sqlx::query(
        "INSERT INTO settings (key, value, updated_by, updated_at) VALUES ($1, $2, $3, now()) \
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now()",
    )
    .bind(key)
    .bind(value)
    .bind(user_id)
    .execute(db)
    .await?;
    Ok(())
}

pub async fn insert_default(db: &PgPool, key: &str, value: &Value) -> AppResult<()> {
    sqlx::query("INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING")
        .bind(key)
        .bind(value)
        .execute(db)
        .await?;
    Ok(())
}

pub async fn registration_open(db: &PgPool) -> AppResult<bool> {
    Ok(get(db, REGISTRATION_OPEN)
        .await?
        .and_then(|value| value.as_bool())
        .unwrap_or(true))
}

pub async fn labour_day_pen(db: &PgPool) -> AppResult<f64> {
    Ok(get(db, LABOUR_DAY_PEN)
        .await?
        .and_then(|value| value.as_f64())
        .filter(|price| *price > 0.0)
        .unwrap_or(50.0))
}

pub async fn default_region(db: &PgPool) -> AppResult<(String, f64, f64)> {
    let region = get(db, DEFAULT_REGION).await?.unwrap_or(Value::Null);
    let name = region
        .get("name")
        .and_then(Value::as_str)
        .unwrap_or("Puno, Perú")
        .to_string();
    let latitude = region
        .get("latitude")
        .and_then(Value::as_f64)
        .unwrap_or(-15.84);
    let longitude = region
        .get("longitude")
        .and_then(Value::as_f64)
        .unwrap_or(-70.02);
    Ok((name, latitude, longitude))
}
