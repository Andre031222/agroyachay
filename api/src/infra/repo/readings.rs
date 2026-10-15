use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::{FromRow, PgPool};

use crate::domain::telemetry::Metric;
use crate::error::AppResult;

#[derive(Clone, Debug, FromRow)]
pub struct StoredReading {
    pub metric: String,
    pub value: f64,
    pub recorded_at: DateTime<Utc>,
}

#[derive(Clone, Debug, FromRow, Serialize)]
pub struct SeriesPoint {
    pub metric: String,
    pub t: DateTime<Utc>,
    pub avg: f64,
    pub min: f64,
    pub max: f64,
    pub n: i64,
}

#[derive(Clone, Debug, FromRow, Serialize)]
pub struct MetricStats {
    pub metric: String,
    pub min: f64,
    pub avg: f64,
    pub max: f64,
    pub count: i64,
}

pub async fn insert_batch(
    db: &PgPool,
    device_id: i64,
    values: &[(Metric, f64)],
    recorded_at: DateTime<Utc>,
) -> AppResult<u64> {
    let metrics: Vec<&str> = values.iter().map(|(metric, _)| metric.as_str()).collect();
    let numbers: Vec<f64> = values.iter().map(|(_, value)| *value).collect();
    let result = sqlx::query(
        "INSERT INTO readings (device_id, metric, value, recorded_at) \
         SELECT $1, metric, value, $4 FROM unnest($2::text[], $3::float8[]) AS t(metric, value)",
    )
    .bind(device_id)
    .bind(&metrics)
    .bind(&numbers)
    .bind(recorded_at)
    .execute(db)
    .await?;
    Ok(result.rows_affected())
}

pub async fn most_recent(db: &PgPool, device_id: i64, limit: i64) -> AppResult<Vec<StoredReading>> {
    Ok(sqlx::query_as::<_, StoredReading>(
        "SELECT metric, value, recorded_at FROM readings WHERE device_id = $1 \
         ORDER BY recorded_at DESC, id DESC LIMIT $2",
    )
    .bind(device_id)
    .bind(limit)
    .fetch_all(db)
    .await?)
}

pub async fn raw_series(
    db: &PgPool,
    device_id: i64,
    since: DateTime<Utc>,
) -> AppResult<Vec<SeriesPoint>> {
    Ok(sqlx::query_as::<_, SeriesPoint>(
        "SELECT metric, recorded_at AS t, value AS avg, value AS min, value AS max, 1::bigint AS n \
         FROM readings WHERE device_id = $1 AND recorded_at >= $2 ORDER BY metric, recorded_at",
    )
    .bind(device_id)
    .bind(since)
    .fetch_all(db)
    .await?)
}

pub async fn bucketed_series(
    db: &PgPool,
    device_id: i64,
    since: DateTime<Utc>,
    bucket: &str,
) -> AppResult<Vec<SeriesPoint>> {
    Ok(sqlx::query_as::<_, SeriesPoint>(
        "SELECT metric, date_bin($3::text::interval, recorded_at, TIMESTAMPTZ '2000-01-01 00:00:00+00') AS t, \
         avg(value) AS avg, min(value) AS min, max(value) AS max, count(*) AS n \
         FROM readings WHERE device_id = $1 AND recorded_at >= $2 GROUP BY metric, t ORDER BY metric, t",
    )
    .bind(device_id)
    .bind(since)
    .bind(bucket)
    .fetch_all(db)
    .await?)
}

pub async fn stats_for_devices(
    db: &PgPool,
    device_ids: &[i64],
    since: DateTime<Utc>,
) -> AppResult<Vec<MetricStats>> {
    Ok(sqlx::query_as::<_, MetricStats>(
        "SELECT metric, min(value) AS min, avg(value) AS avg, max(value) AS max, count(*) AS count \
         FROM readings WHERE device_id = ANY($1) AND recorded_at >= $2 GROUP BY metric ORDER BY metric",
    )
    .bind(device_ids)
    .bind(since)
    .fetch_all(db)
    .await?)
}

#[derive(Clone, Debug, FromRow)]
pub struct ExportRow {
    pub device_name: String,
    pub esp32_id: String,
    pub metric: String,
    pub value: f64,
    pub recorded_at: DateTime<Utc>,
}

pub async fn export_for_user(
    db: &PgPool,
    user_id: i64,
    since: DateTime<Utc>,
    limit: i64,
) -> AppResult<Vec<ExportRow>> {
    Ok(sqlx::query_as::<_, ExportRow>(
        "SELECT d.name AS device_name, d.esp32_id, r.metric, r.value, r.recorded_at \
         FROM readings r JOIN devices d ON d.id = r.device_id \
         WHERE d.user_id = $1 AND r.recorded_at >= $2 ORDER BY r.recorded_at DESC LIMIT $3",
    )
    .bind(user_id)
    .bind(since)
    .bind(limit)
    .fetch_all(db)
    .await?)
}

pub async fn count_since_hours(db: &PgPool, hours: i32) -> AppResult<i64> {
    Ok(sqlx::query_scalar(
        "SELECT count(*) FROM readings WHERE recorded_at >= now() - make_interval(hours => $1)",
    )
    .bind(hours)
    .fetch_one(db)
    .await?)
}
