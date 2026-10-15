use chrono::{DateTime, Utc};
use serde::Serialize;
use serde_json::Value;
use sqlx::{FromRow, PgPool};

use crate::error::AppResult;

#[derive(Clone, Debug, Default)]
pub struct ClientInfo {
    pub ip: Option<String>,
    pub user_agent: Option<String>,
}

#[derive(Clone, Debug, FromRow, Serialize)]
pub struct AuditEntry {
    pub id: i64,
    pub user_id: Option<i64>,
    pub user_name: Option<String>,
    pub user_email: Option<String>,
    pub action: String,
    pub target: Option<String>,
    pub ip: Option<String>,
    pub user_agent: Option<String>,
    pub meta: Value,
    pub created_at: DateTime<Utc>,
}

pub async fn record(
    db: &PgPool,
    user_id: Option<i64>,
    action: &str,
    target: Option<String>,
    client: &ClientInfo,
    meta: Value,
) {
    let result = sqlx::query(
        "INSERT INTO audit_log (user_id, action, target, ip, user_agent, meta) VALUES ($1, $2, $3, $4, $5, $6)",
    )
    .bind(user_id)
    .bind(action)
    .bind(target)
    .bind(client.ip.as_deref())
    .bind(
        client
            .user_agent
            .as_deref()
            .map(|agent| agent.chars().take(400).collect::<String>()),
    )
    .bind(meta)
    .execute(db)
    .await;
    if let Err(error) = result {
        tracing::error!(%error, action, "could not write audit log entry");
    }
}

pub struct AuditFilter {
    pub action: Option<String>,
    pub user_id: Option<i64>,
    pub from: Option<DateTime<Utc>>,
    pub to: Option<DateTime<Utc>>,
}

pub async fn list(
    db: &PgPool,
    filter: &AuditFilter,
    page: i64,
    per_page: i64,
) -> AppResult<(Vec<AuditEntry>, i64)> {
    const CONDITIONS: &str = "($1::text IS NULL OR l.action = $1) AND ($2::bigint IS NULL OR l.user_id = $2) \
         AND ($3::timestamptz IS NULL OR l.created_at >= $3) AND ($4::timestamptz IS NULL OR l.created_at < $4)";
    let sql = sqlx::AssertSqlSafe(format!(
        "SELECT l.id, l.user_id, u.name AS user_name, u.email AS user_email, l.action, l.target, l.ip, \
         l.user_agent, l.meta, l.created_at FROM audit_log l LEFT JOIN users u ON u.id = l.user_id \
         WHERE {CONDITIONS} ORDER BY l.created_at DESC, l.id DESC LIMIT $5 OFFSET $6"
    ));
    let entries = sqlx::query_as::<_, AuditEntry>(sql)
        .bind(&filter.action)
        .bind(filter.user_id)
        .bind(filter.from)
        .bind(filter.to)
        .bind(per_page)
        .bind((page - 1) * per_page)
        .fetch_all(db)
        .await?;
    let count_sql = sqlx::AssertSqlSafe(format!(
        "SELECT count(*) FROM audit_log l WHERE {CONDITIONS}"
    ));
    let total: i64 = sqlx::query_scalar(count_sql)
        .bind(&filter.action)
        .bind(filter.user_id)
        .bind(filter.from)
        .bind(filter.to)
        .fetch_one(db)
        .await?;
    Ok((entries, total))
}
