use chrono::{DateTime, NaiveDate, Utc};
use serde::Serialize;
use sqlx::{AssertSqlSafe, FromRow, PgPool};

use crate::error::AppResult;

const CROP_COLUMNS: &str = "c.id, c.user_id, c.name, c.species, c.variety, c.area_ha::float8 AS area_ha, \
     c.latitude, c.longitude, c.location_name, c.sowing_date, c.harvest_date, c.status, c.notes, \
     c.created_at, c.updated_at, \
     (SELECT count(*) FROM devices d WHERE d.crop_id = c.id) AS device_count";

#[derive(Clone, Debug, FromRow, Serialize)]
pub struct Crop {
    pub id: i64,
    pub user_id: i64,
    pub name: String,
    pub species: String,
    pub variety: Option<String>,
    pub area_ha: f64,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub location_name: Option<String>,
    pub sowing_date: Option<NaiveDate>,
    pub harvest_date: Option<NaiveDate>,
    pub status: String,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub device_count: i64,
}

#[derive(Clone, Debug)]
pub struct CropFields {
    pub name: String,
    pub species: String,
    pub variety: Option<String>,
    pub area_ha: f64,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub location_name: Option<String>,
    pub sowing_date: Option<NaiveDate>,
    pub harvest_date: Option<NaiveDate>,
    pub status: String,
    pub notes: Option<String>,
}

impl From<&Crop> for CropFields {
    fn from(crop: &Crop) -> Self {
        Self {
            name: crop.name.clone(),
            species: crop.species.clone(),
            variety: crop.variety.clone(),
            area_ha: crop.area_ha,
            latitude: crop.latitude,
            longitude: crop.longitude,
            location_name: crop.location_name.clone(),
            sowing_date: crop.sowing_date,
            harvest_date: crop.harvest_date,
            status: crop.status.clone(),
            notes: crop.notes.clone(),
        }
    }
}

fn select(clause: &str) -> AssertSqlSafe<String> {
    AssertSqlSafe(format!("SELECT {CROP_COLUMNS} FROM crops c {clause}"))
}

pub async fn list_for_user(db: &PgPool, user_id: i64) -> AppResult<Vec<Crop>> {
    Ok(sqlx::query_as::<_, Crop>(select(
        "WHERE c.user_id = $1 ORDER BY c.created_at DESC, c.id DESC",
    ))
    .bind(user_id)
    .fetch_all(db)
    .await?)
}

pub async fn find_owned(db: &PgPool, id: i64, user_id: i64) -> AppResult<Option<Crop>> {
    Ok(
        sqlx::query_as::<_, Crop>(select("WHERE c.id = $1 AND c.user_id = $2"))
            .bind(id)
            .bind(user_id)
            .fetch_optional(db)
            .await?,
    )
}

pub async fn create(db: &PgPool, user_id: i64, fields: CropFields) -> AppResult<Crop> {
    let id: i64 = sqlx::query_scalar(
        "INSERT INTO crops (user_id, name, species, variety, area_ha, latitude, longitude, location_name, \
         sowing_date, harvest_date, status, notes) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id",
    )
    .bind(user_id)
    .bind(fields.name)
    .bind(fields.species)
    .bind(fields.variety)
    .bind(fields.area_ha)
    .bind(fields.latitude)
    .bind(fields.longitude)
    .bind(fields.location_name)
    .bind(fields.sowing_date)
    .bind(fields.harvest_date)
    .bind(fields.status)
    .bind(fields.notes)
    .fetch_one(db)
    .await?;
    let crop = find_owned(db, id, user_id).await?;
    crop.ok_or(crate::error::AppError::NotFound)
}

pub async fn update(db: &PgPool, id: i64, user_id: i64, fields: CropFields) -> AppResult<Crop> {
    sqlx::query(
        "UPDATE crops SET name = $3, species = $4, variety = $5, area_ha = $6, latitude = $7, longitude = $8, \
         location_name = $9, sowing_date = $10, harvest_date = $11, status = $12, notes = $13, updated_at = now() \
         WHERE id = $1 AND user_id = $2",
    )
    .bind(id)
    .bind(user_id)
    .bind(fields.name)
    .bind(fields.species)
    .bind(fields.variety)
    .bind(fields.area_ha)
    .bind(fields.latitude)
    .bind(fields.longitude)
    .bind(fields.location_name)
    .bind(fields.sowing_date)
    .bind(fields.harvest_date)
    .bind(fields.status)
    .bind(fields.notes)
    .execute(db)
    .await?;
    find_owned(db, id, user_id)
        .await?
        .ok_or(crate::error::AppError::NotFound)
}

pub async fn delete(db: &PgPool, id: i64, user_id: i64) -> AppResult<bool> {
    let result = sqlx::query("DELETE FROM crops WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(user_id)
        .execute(db)
        .await?;
    Ok(result.rows_affected() > 0)
}

pub async fn count_for_user(db: &PgPool, user_id: i64) -> AppResult<i64> {
    Ok(
        sqlx::query_scalar("SELECT count(*) FROM crops WHERE user_id = $1")
            .bind(user_id)
            .fetch_one(db)
            .await?,
    )
}
