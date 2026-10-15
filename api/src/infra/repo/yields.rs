use chrono::{DateTime, Utc};
use serde::Serialize;
use serde_json::Value;
use sqlx::{FromRow, PgPool};

use crate::error::AppResult;

#[derive(Clone, Debug, FromRow, Serialize)]
pub struct StoredEstimate {
    pub id: i64,
    pub user_id: i64,
    pub crop_id: Option<i64>,
    pub crop_name: Option<String>,
    pub inputs: Value,
    pub yield_t_ha: f64,
    pub total_t: f64,
    pub revenue_pen: f64,
    pub confidence: f64,
    pub factors: Value,
    pub created_at: DateTime<Utc>,
}

pub struct NewEstimate {
    pub user_id: i64,
    pub crop_id: Option<i64>,
    pub inputs: Value,
    pub yield_t_ha: f64,
    pub total_t: f64,
    pub revenue_pen: f64,
    pub confidence: f64,
    pub factors: Value,
}

const SELECT: &str = "SELECT y.id, y.user_id, y.crop_id, c.name AS crop_name, y.inputs, y.yield_t_ha, y.total_t, \
     y.revenue_pen, y.confidence, y.factors, y.created_at FROM yield_estimates y LEFT JOIN crops c ON c.id = y.crop_id";

pub async fn insert(db: &PgPool, estimate: NewEstimate) -> AppResult<StoredEstimate> {
    let id: i64 = sqlx::query_scalar(
        "INSERT INTO yield_estimates (user_id, crop_id, inputs, yield_t_ha, total_t, revenue_pen, confidence, factors) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
    )
    .bind(estimate.user_id)
    .bind(estimate.crop_id)
    .bind(estimate.inputs)
    .bind(estimate.yield_t_ha)
    .bind(estimate.total_t)
    .bind(estimate.revenue_pen)
    .bind(estimate.confidence)
    .bind(estimate.factors)
    .fetch_one(db)
    .await?;
    let sql = sqlx::AssertSqlSafe(format!("{SELECT} WHERE y.id = $1"));
    Ok(sqlx::query_as::<_, StoredEstimate>(sql)
        .bind(id)
        .fetch_one(db)
        .await?)
}

pub async fn list_for_user(
    db: &PgPool,
    user_id: i64,
    limit: i64,
) -> AppResult<Vec<StoredEstimate>> {
    let sql = sqlx::AssertSqlSafe(format!(
        "{SELECT} WHERE y.user_id = $1 ORDER BY y.created_at DESC, y.id DESC LIMIT $2"
    ));
    Ok(sqlx::query_as::<_, StoredEstimate>(sql)
        .bind(user_id)
        .bind(limit)
        .fetch_all(db)
        .await?)
}

pub async fn latest_per_crop(db: &PgPool, user_id: i64) -> AppResult<Vec<StoredEstimate>> {
    let sql = sqlx::AssertSqlSafe(format!(
        "{SELECT} WHERE y.id IN (SELECT DISTINCT ON (crop_id) id FROM yield_estimates \
         WHERE user_id = $1 AND crop_id IS NOT NULL ORDER BY crop_id, created_at DESC)"
    ));
    Ok(sqlx::query_as::<_, StoredEstimate>(sql)
        .bind(user_id)
        .fetch_all(db)
        .await?)
}
