use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::{AssertSqlSafe, FromRow, PgPool};

use crate::domain::telemetry::Metric;
use crate::domain::thresholds::Threshold;
use crate::error::AppResult;

const DEVICE_COLUMNS: &str = "d.id, d.esp32_id, d.name, d.user_id, d.crop_id, c.name AS crop_name, \
     d.status, d.last_seen_at, d.created_at";

#[derive(Clone, Debug, FromRow, Serialize)]
pub struct Device {
    pub id: i64,
    pub esp32_id: String,
    pub name: String,
    pub user_id: Option<i64>,
    pub crop_id: Option<i64>,
    pub crop_name: Option<String>,
    pub status: String,
    pub last_seen_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Clone, Debug, FromRow, Serialize)]
pub struct LatestReading {
    pub device_id: i64,
    pub metric: String,
    pub value: f64,
    pub recorded_at: DateTime<Utc>,
}

#[derive(Clone, Debug, FromRow)]
struct ThresholdRow {
    metric: String,
    min_value: f64,
    max_value: f64,
}

fn select(clause: &str) -> AssertSqlSafe<String> {
    AssertSqlSafe(format!(
        "SELECT {DEVICE_COLUMNS} FROM devices d LEFT JOIN crops c ON c.id = d.crop_id {clause}"
    ))
}

pub async fn find_by_id(db: &PgPool, id: i64) -> AppResult<Option<Device>> {
    Ok(sqlx::query_as::<_, Device>(select("WHERE d.id = $1"))
        .bind(id)
        .fetch_optional(db)
        .await?)
}

pub async fn find_owned(db: &PgPool, id: i64, user_id: i64) -> AppResult<Option<Device>> {
    Ok(
        sqlx::query_as::<_, Device>(select("WHERE d.id = $1 AND d.user_id = $2"))
            .bind(id)
            .bind(user_id)
            .fetch_optional(db)
            .await?,
    )
}

pub async fn find_by_esp32_id(db: &PgPool, esp32_id: &str) -> AppResult<Option<Device>> {
    Ok(sqlx::query_as::<_, Device>(select("WHERE d.esp32_id = $1"))
        .bind(esp32_id)
        .fetch_optional(db)
        .await?)
}

pub async fn register_contact(db: &PgPool, esp32_id: &str) -> AppResult<i64> {
    Ok(sqlx::query_scalar(
        "INSERT INTO devices (esp32_id, name, status, last_seen_at) VALUES ($1, 'Sensor ' || $1, 'pending', now()) \
         ON CONFLICT (esp32_id) DO UPDATE SET last_seen_at = now() RETURNING id",
    )
    .bind(esp32_id)
    .fetch_one(db)
    .await?)
}

pub async fn list_for_user(db: &PgPool, user_id: i64) -> AppResult<Vec<Device>> {
    Ok(sqlx::query_as::<_, Device>(select(
        "WHERE d.user_id = $1 ORDER BY d.last_seen_at DESC NULLS LAST, d.id",
    ))
    .bind(user_id)
    .fetch_all(db)
    .await?)
}

pub async fn list_for_crop(db: &PgPool, crop_id: i64) -> AppResult<Vec<Device>> {
    Ok(
        sqlx::query_as::<_, Device>(select("WHERE d.crop_id = $1 ORDER BY d.id"))
            .bind(crop_id)
            .fetch_all(db)
            .await?,
    )
}

pub async fn list_pending(db: &PgPool) -> AppResult<Vec<Device>> {
    Ok(sqlx::query_as::<_, Device>(select(
        "WHERE d.user_id IS NULL AND d.status = 'pending' AND d.last_seen_at >= now() - interval '24 hours' \
         ORDER BY d.last_seen_at DESC",
    ))
    .fetch_all(db)
    .await?)
}

pub async fn claim(
    db: &PgPool,
    id: i64,
    user_id: i64,
    name: &str,
    crop_id: Option<i64>,
) -> AppResult<bool> {
    let mut transaction = db.begin().await?;
    let updated = sqlx::query(
        "UPDATE devices SET user_id = $2, name = $3, crop_id = $4, status = 'active' \
         WHERE id = $1 AND user_id IS NULL",
    )
    .bind(id)
    .bind(user_id)
    .bind(name)
    .bind(crop_id)
    .execute(&mut *transaction)
    .await?
    .rows_affected();
    if updated == 0 {
        transaction.rollback().await?;
        return Ok(false);
    }
    for threshold in crate::domain::thresholds::default_thresholds() {
        sqlx::query(
            "INSERT INTO thresholds (device_id, metric, min_value, max_value) VALUES ($1, $2, $3, $4) \
             ON CONFLICT (device_id, metric) DO NOTHING",
        )
        .bind(id)
        .bind(threshold.metric.as_str())
        .bind(threshold.min)
        .bind(threshold.max)
        .execute(&mut *transaction)
        .await?;
    }
    transaction.commit().await?;
    Ok(true)
}

pub async fn update(
    db: &PgPool,
    id: i64,
    name: &str,
    crop_id: Option<i64>,
    thresholds: &[Threshold],
) -> AppResult<()> {
    let mut transaction = db.begin().await?;
    sqlx::query("UPDATE devices SET name = $2, crop_id = $3 WHERE id = $1")
        .bind(id)
        .bind(name)
        .bind(crop_id)
        .execute(&mut *transaction)
        .await?;
    for threshold in thresholds {
        sqlx::query(
            "INSERT INTO thresholds (device_id, metric, min_value, max_value) VALUES ($1, $2, $3, $4) \
             ON CONFLICT (device_id, metric) DO UPDATE SET min_value = EXCLUDED.min_value, max_value = EXCLUDED.max_value",
        )
        .bind(id)
        .bind(threshold.metric.as_str())
        .bind(threshold.min)
        .bind(threshold.max)
        .execute(&mut *transaction)
        .await?;
    }
    transaction.commit().await?;
    Ok(())
}

pub async fn release(db: &PgPool, id: i64) -> AppResult<()> {
    let mut transaction = db.begin().await?;
    sqlx::query(
        "UPDATE devices SET user_id = NULL, crop_id = NULL, status = 'pending', name = 'Sensor ' || esp32_id WHERE id = $1",
    )
    .bind(id)
    .execute(&mut *transaction)
    .await?;
    sqlx::query("DELETE FROM thresholds WHERE device_id = $1")
        .bind(id)
        .execute(&mut *transaction)
        .await?;
    sqlx::query(
        "UPDATE alerts SET resolved_at = now() WHERE device_id = $1 AND resolved_at IS NULL",
    )
    .bind(id)
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    Ok(())
}

pub async fn thresholds(db: &PgPool, device_id: i64) -> AppResult<Vec<Threshold>> {
    let rows = sqlx::query_as::<_, ThresholdRow>(
        "SELECT metric, min_value, max_value FROM thresholds WHERE device_id = $1 ORDER BY metric",
    )
    .bind(device_id)
    .fetch_all(db)
    .await?;
    Ok(rows
        .into_iter()
        .filter_map(|row| {
            Some(Threshold {
                metric: Metric::parse(&row.metric)?,
                min: row.min_value,
                max: row.max_value,
            })
        })
        .collect())
}

pub async fn latest_readings(db: &PgPool, device_ids: &[i64]) -> AppResult<Vec<LatestReading>> {
    if device_ids.is_empty() {
        return Ok(Vec::new());
    }
    Ok(sqlx::query_as::<_, LatestReading>(
        "SELECT latest.device_id, latest.metric, latest.value, latest.recorded_at \
         FROM unnest($1::bigint[]) AS ids(device_id) \
         CROSS JOIN LATERAL ( \
            SELECT DISTINCT ON (r.metric) r.device_id, r.metric, r.value, r.recorded_at \
            FROM readings r WHERE r.device_id = ids.device_id \
            AND r.recorded_at >= now() - interval '30 days' \
            ORDER BY r.metric, r.recorded_at DESC \
         ) AS latest",
    )
    .bind(device_ids)
    .fetch_all(db)
    .await?)
}

#[derive(Debug, FromRow, Serialize)]
pub struct DeviceCounts {
    pub total: i64,
    pub active: i64,
    pub pending: i64,
    pub online: i64,
}

pub async fn global_counts(db: &PgPool) -> AppResult<DeviceCounts> {
    Ok(sqlx::query_as::<_, DeviceCounts>(
        "SELECT count(*) AS total, \
         count(*) FILTER (WHERE status = 'active') AS active, \
         count(*) FILTER (WHERE status = 'pending') AS pending, \
         count(*) FILTER (WHERE last_seen_at >= now() - interval '120 seconds') AS online \
         FROM devices",
    )
    .fetch_one(db)
    .await?)
}

pub async fn count_pending_recent(db: &PgPool) -> AppResult<i64> {
    Ok(sqlx::query_scalar(
        "SELECT count(*) FROM devices WHERE user_id IS NULL AND status = 'pending' \
         AND last_seen_at >= now() - interval '24 hours'",
    )
    .fetch_one(db)
    .await?)
}
