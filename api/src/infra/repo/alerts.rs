use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::{FromRow, PgPool};

use crate::domain::thresholds::Breach;
use crate::error::AppResult;

#[derive(Clone, Debug, FromRow, Serialize)]
pub struct Alert {
    pub id: i64,
    pub device_id: i64,
    pub device_name: String,
    pub esp32_id: String,
    pub metric: String,
    pub kind: String,
    pub value: Option<f64>,
    pub threshold: Option<f64>,
    pub created_at: DateTime<Utc>,
    pub resolved_at: Option<DateTime<Utc>>,
}

pub async fn open_breaches(
    db: &PgPool,
    device_id: i64,
    breaches: &[Breach],
) -> AppResult<Vec<i64>> {
    let mut opened = Vec::new();
    for breach in breaches {
        let id: Option<i64> = sqlx::query_scalar(
            "INSERT INTO alerts (device_id, metric, kind, value, threshold) VALUES ($1, $2, $3, $4, $5) \
             ON CONFLICT (device_id, metric, kind) WHERE resolved_at IS NULL DO NOTHING RETURNING id",
        )
        .bind(device_id)
        .bind(breach.metric.as_str())
        .bind(breach.kind.as_str())
        .bind(breach.value)
        .bind(breach.threshold)
        .fetch_optional(db)
        .await?;
        opened.extend(id);
    }
    Ok(opened)
}

pub async fn resolve_offline(db: &PgPool, device_id: i64) -> AppResult<()> {
    sqlx::query(
        "UPDATE alerts SET resolved_at = now() WHERE device_id = $1 AND kind = 'offline' AND resolved_at IS NULL",
    )
    .bind(device_id)
    .execute(db)
    .await?;
    Ok(())
}

pub async fn open_offline_alerts(db: &PgPool, stale_minutes: i64) -> AppResult<u64> {
    let result = sqlx::query(
        "INSERT INTO alerts (device_id, metric, kind) \
         SELECT id, 'connection', 'offline' FROM devices \
         WHERE status = 'active' AND user_id IS NOT NULL \
         AND last_seen_at < now() - make_interval(mins => $1::int) \
         ON CONFLICT (device_id, metric, kind) WHERE resolved_at IS NULL DO NOTHING",
    )
    .bind(stale_minutes)
    .execute(db)
    .await?;
    Ok(result.rows_affected())
}

const ALERT_SELECT: &str = "SELECT a.id, a.device_id, d.name AS device_name, d.esp32_id, a.metric, a.kind, a.value, \
     a.threshold, a.created_at, a.resolved_at FROM alerts a JOIN devices d ON d.id = a.device_id";

pub async fn list_for_user(
    db: &PgPool,
    user_id: i64,
    open_only: bool,
    limit: i64,
) -> AppResult<Vec<Alert>> {
    let sql = sqlx::AssertSqlSafe(format!(
        "{ALERT_SELECT} WHERE d.user_id = $1 AND (NOT $2 OR a.resolved_at IS NULL) \
         ORDER BY a.created_at DESC, a.id DESC LIMIT $3"
    ));
    Ok(sqlx::query_as::<_, Alert>(sql)
        .bind(user_id)
        .bind(open_only)
        .bind(limit)
        .fetch_all(db)
        .await?)
}

pub async fn resolve_owned(db: &PgPool, id: i64, user_id: i64) -> AppResult<Option<Alert>> {
    let updated: Option<i64> = sqlx::query_scalar(
        "UPDATE alerts a SET resolved_at = COALESCE(a.resolved_at, now()) FROM devices d \
         WHERE a.id = $1 AND d.id = a.device_id AND d.user_id = $2 RETURNING a.id",
    )
    .bind(id)
    .bind(user_id)
    .fetch_optional(db)
    .await?;
    let Some(id) = updated else {
        return Ok(None);
    };
    let sql = sqlx::AssertSqlSafe(format!("{ALERT_SELECT} WHERE a.id = $1"));
    Ok(sqlx::query_as::<_, Alert>(sql)
        .bind(id)
        .fetch_optional(db)
        .await?)
}

pub async fn count_open_for_user(db: &PgPool, user_id: i64) -> AppResult<i64> {
    Ok(sqlx::query_scalar(
        "SELECT count(*) FROM alerts a JOIN devices d ON d.id = a.device_id \
         WHERE d.user_id = $1 AND a.resolved_at IS NULL",
    )
    .bind(user_id)
    .fetch_one(db)
    .await?)
}
