use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::{AssertSqlSafe, FromRow, PgPool};

use crate::error::{AppError, AppResult};

const USER_COLUMNS: &str = "id, name, email, password_hash, google_sub, avatar_url, role, active, locale, \
     latitude, longitude, place_name, created_at, last_login_at";

#[derive(Clone, Debug, FromRow)]
pub struct User {
    pub id: i64,
    pub name: String,
    pub email: String,
    pub password_hash: Option<String>,
    pub google_sub: Option<String>,
    pub avatar_url: Option<String>,
    pub role: String,
    pub active: bool,
    pub locale: String,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub place_name: Option<String>,
    pub created_at: DateTime<Utc>,
    pub last_login_at: Option<DateTime<Utc>>,
}

#[derive(Clone, Debug, Serialize)]
pub struct UserView {
    pub id: i64,
    pub name: String,
    pub email: String,
    pub role: String,
    pub active: bool,
    pub locale: String,
    pub avatar_url: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub place_name: Option<String>,
    pub has_password: bool,
    pub google_linked: bool,
    pub created_at: DateTime<Utc>,
    pub last_login_at: Option<DateTime<Utc>>,
}

impl From<&User> for UserView {
    fn from(user: &User) -> Self {
        Self {
            id: user.id,
            name: user.name.clone(),
            email: user.email.clone(),
            role: user.role.clone(),
            active: user.active,
            locale: user.locale.clone(),
            avatar_url: user.avatar_url.clone(),
            latitude: user.latitude,
            longitude: user.longitude,
            place_name: user.place_name.clone(),
            has_password: user.password_hash.is_some(),
            google_linked: user.google_sub.is_some(),
            created_at: user.created_at,
            last_login_at: user.last_login_at,
        }
    }
}

pub struct NewUser<'a> {
    pub name: &'a str,
    pub email: &'a str,
    pub password_hash: Option<&'a str>,
    pub google_sub: Option<&'a str>,
    pub avatar_url: Option<&'a str>,
    pub role: &'a str,
    pub locale: &'a str,
}

pub struct ProfileUpdate {
    pub name: String,
    pub locale: String,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub place_name: Option<String>,
}

fn select(clause: &str) -> AssertSqlSafe<String> {
    AssertSqlSafe(format!("SELECT {USER_COLUMNS} FROM users {clause}"))
}

pub fn is_unique_violation(error: &sqlx::Error) -> bool {
    error
        .as_database_error()
        .and_then(|database_error| database_error.code())
        .is_some_and(|code| code == "23505")
}

pub async fn find_by_id(db: &PgPool, id: i64) -> AppResult<Option<User>> {
    Ok(sqlx::query_as::<_, User>(select("WHERE id = $1"))
        .bind(id)
        .fetch_optional(db)
        .await?)
}

pub async fn find_by_email(db: &PgPool, email: &str) -> AppResult<Option<User>> {
    Ok(
        sqlx::query_as::<_, User>(select("WHERE lower(email) = lower($1)"))
            .bind(email.trim())
            .fetch_optional(db)
            .await?,
    )
}

pub async fn find_by_google_sub(db: &PgPool, sub: &str) -> AppResult<Option<User>> {
    Ok(sqlx::query_as::<_, User>(select("WHERE google_sub = $1"))
        .bind(sub)
        .fetch_optional(db)
        .await?)
}

pub async fn create(db: &PgPool, user: NewUser<'_>) -> AppResult<User> {
    let sql = AssertSqlSafe(format!(
        "INSERT INTO users (name, email, password_hash, google_sub, avatar_url, role, locale) \
         VALUES ($1, lower($2), $3, $4, $5, $6, $7) RETURNING {USER_COLUMNS}"
    ));
    sqlx::query_as::<_, User>(sql)
        .bind(user.name.trim())
        .bind(user.email.trim())
        .bind(user.password_hash)
        .bind(user.google_sub)
        .bind(user.avatar_url)
        .bind(user.role)
        .bind(user.locale)
        .fetch_one(db)
        .await
        .map_err(|error| {
            if is_unique_violation(&error) {
                AppError::Conflict("email_taken")
            } else {
                AppError::Database(error)
            }
        })
}

pub async fn link_google(
    db: &PgPool,
    id: i64,
    sub: &str,
    avatar_url: Option<&str>,
) -> AppResult<User> {
    let sql = AssertSqlSafe(format!(
        "UPDATE users SET google_sub = $2, avatar_url = COALESCE(avatar_url, $3) \
         WHERE id = $1 RETURNING {USER_COLUMNS}"
    ));
    Ok(sqlx::query_as::<_, User>(sql)
        .bind(id)
        .bind(sub)
        .bind(avatar_url)
        .fetch_one(db)
        .await?)
}

pub async fn touch_login(db: &PgPool, id: i64) -> AppResult<()> {
    sqlx::query("UPDATE users SET last_login_at = now() WHERE id = $1")
        .bind(id)
        .execute(db)
        .await?;
    Ok(())
}

pub async fn update_profile(db: &PgPool, id: i64, update: ProfileUpdate) -> AppResult<User> {
    let sql = AssertSqlSafe(format!(
        "UPDATE users SET name = $2, locale = $3, latitude = $4, longitude = $5, place_name = $6 \
         WHERE id = $1 RETURNING {USER_COLUMNS}"
    ));
    Ok(sqlx::query_as::<_, User>(sql)
        .bind(id)
        .bind(update.name)
        .bind(update.locale)
        .bind(update.latitude)
        .bind(update.longitude)
        .bind(update.place_name)
        .fetch_one(db)
        .await?)
}

pub async fn update_password(db: &PgPool, id: i64, password_hash: &str) -> AppResult<()> {
    sqlx::query("UPDATE users SET password_hash = $2 WHERE id = $1")
        .bind(id)
        .bind(password_hash)
        .execute(db)
        .await?;
    Ok(())
}

pub async fn set_role_and_active(
    db: &PgPool,
    id: i64,
    role: &str,
    active: bool,
) -> AppResult<User> {
    let sql = AssertSqlSafe(format!(
        "UPDATE users SET role = $2, active = $3 WHERE id = $1 RETURNING {USER_COLUMNS}"
    ));
    Ok(sqlx::query_as::<_, User>(sql)
        .bind(id)
        .bind(role)
        .bind(active)
        .fetch_one(db)
        .await?)
}

pub async fn list(
    db: &PgPool,
    query: Option<&str>,
    page: i64,
    per_page: i64,
) -> AppResult<(Vec<User>, i64)> {
    let pattern = query
        .map(str::trim)
        .filter(|text| !text.is_empty())
        .map(|text| format!("%{}%", text.replace('%', "\\%").replace('_', "\\_")));
    let users = sqlx::query_as::<_, User>(select(
        "WHERE ($1::text IS NULL OR name ILIKE $1 OR email ILIKE $1) \
         ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3",
    ))
    .bind(&pattern)
    .bind(per_page)
    .bind((page - 1) * per_page)
    .fetch_all(db)
    .await?;
    let total: i64 = sqlx::query_scalar(
        "SELECT count(*) FROM users WHERE ($1::text IS NULL OR name ILIKE $1 OR email ILIKE $1)",
    )
    .bind(&pattern)
    .fetch_one(db)
    .await?;
    Ok((users, total))
}

pub async fn superadmin_exists(db: &PgPool) -> AppResult<bool> {
    Ok(
        sqlx::query_scalar("SELECT EXISTS (SELECT 1 FROM users WHERE role = 'superadmin')")
            .fetch_one(db)
            .await?,
    )
}

#[derive(Debug, FromRow, Serialize)]
pub struct RoleCount {
    pub role: String,
    pub total: i64,
}

pub async fn count_by_role(db: &PgPool) -> AppResult<Vec<RoleCount>> {
    Ok(sqlx::query_as::<_, RoleCount>(
        "SELECT role, count(*) AS total FROM users GROUP BY role ORDER BY role",
    )
    .fetch_all(db)
    .await?)
}

pub async fn count_active_since_days(db: &PgPool, days: i32) -> AppResult<i64> {
    Ok(sqlx::query_scalar(
        "SELECT count(*) FROM users WHERE last_login_at >= now() - make_interval(days => $1)",
    )
    .bind(days)
    .fetch_one(db)
    .await?)
}
