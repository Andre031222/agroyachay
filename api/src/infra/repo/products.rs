use std::collections::HashMap;

use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::{FromRow, PgPool};

use crate::domain::inputs::{CatalogPrice, PriceBook};
use crate::error::{AppError, AppResult};

#[derive(Clone, Debug, FromRow, Serialize)]
pub struct Product {
    pub id: i64,
    pub sku: Option<String>,
    pub name: String,
    pub category: String,
    pub unit: String,
    pub price_pen: f64,
    pub supplier: Option<String>,
    pub url: Option<String>,
    pub active: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Clone, Debug)]
pub struct ProductFields {
    pub sku: Option<String>,
    pub name: String,
    pub category: String,
    pub unit: String,
    pub price_pen: f64,
    pub supplier: Option<String>,
    pub url: Option<String>,
    pub active: bool,
}

impl From<&Product> for ProductFields {
    fn from(product: &Product) -> Self {
        Self {
            sku: product.sku.clone(),
            name: product.name.clone(),
            category: product.category.clone(),
            unit: product.unit.clone(),
            price_pen: product.price_pen,
            supplier: product.supplier.clone(),
            url: product.url.clone(),
            active: product.active,
        }
    }
}

pub const CATEGORIES: [&str; 5] = [
    "fertilizer",
    "seed",
    "agrochemical",
    "amendment",
    "equipment",
];

const COLUMNS: &str = "id, sku, name, category, unit, price_pen::float8 AS price_pen, supplier, url, active, created_at";

pub async fn list(
    db: &PgPool,
    category: Option<&str>,
    query: Option<&str>,
    include_inactive: bool,
) -> AppResult<Vec<Product>> {
    let pattern = query
        .map(str::trim)
        .filter(|text| !text.is_empty())
        .map(|text| format!("%{}%", text.replace('%', "\\%").replace('_', "\\_")));
    let sql = sqlx::AssertSqlSafe(format!(
        "SELECT {COLUMNS} FROM products WHERE ($1::text IS NULL OR category = $1) \
         AND ($2::text IS NULL OR name ILIKE $2 OR supplier ILIKE $2) AND ($3 OR active) \
         ORDER BY category, name"
    ));
    Ok(sqlx::query_as::<_, Product>(sql)
        .bind(category)
        .bind(pattern)
        .bind(include_inactive)
        .fetch_all(db)
        .await?)
}

pub async fn find(db: &PgPool, id: i64) -> AppResult<Option<Product>> {
    let sql = sqlx::AssertSqlSafe(format!("SELECT {COLUMNS} FROM products WHERE id = $1"));
    Ok(sqlx::query_as::<_, Product>(sql)
        .bind(id)
        .fetch_optional(db)
        .await?)
}

fn map_conflict(error: sqlx::Error) -> AppError {
    if super::users::is_unique_violation(&error) {
        AppError::Conflict("conflict")
    } else {
        AppError::Database(error)
    }
}

pub async fn create(db: &PgPool, fields: ProductFields) -> AppResult<Product> {
    let sql = sqlx::AssertSqlSafe(format!(
        "INSERT INTO products (sku, name, category, unit, price_pen, supplier, url, active) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING {COLUMNS}"
    ));
    sqlx::query_as::<_, Product>(sql)
        .bind(fields.sku)
        .bind(fields.name)
        .bind(fields.category)
        .bind(fields.unit)
        .bind(fields.price_pen)
        .bind(fields.supplier)
        .bind(fields.url)
        .bind(fields.active)
        .fetch_one(db)
        .await
        .map_err(map_conflict)
}

pub async fn update(db: &PgPool, id: i64, fields: ProductFields) -> AppResult<Product> {
    let sql = sqlx::AssertSqlSafe(format!(
        "UPDATE products SET sku = $2, name = $3, category = $4, unit = $5, price_pen = $6, supplier = $7, \
         url = $8, active = $9 WHERE id = $1 RETURNING {COLUMNS}"
    ));
    sqlx::query_as::<_, Product>(sql)
        .bind(id)
        .bind(fields.sku)
        .bind(fields.name)
        .bind(fields.category)
        .bind(fields.unit)
        .bind(fields.price_pen)
        .bind(fields.supplier)
        .bind(fields.url)
        .bind(fields.active)
        .fetch_one(db)
        .await
        .map_err(map_conflict)
}

pub async fn delete(db: &PgPool, id: i64) -> AppResult<bool> {
    Ok(sqlx::query("DELETE FROM products WHERE id = $1")
        .bind(id)
        .execute(db)
        .await?
        .rows_affected()
        > 0)
}

pub struct CataloguePrices(HashMap<String, CatalogPrice>);

impl PriceBook for CataloguePrices {
    fn price(&self, sku: &str) -> Option<CatalogPrice> {
        self.0.get(sku).cloned()
    }
}

pub async fn price_book(db: &PgPool) -> AppResult<CataloguePrices> {
    let products = list(db, None, None, false).await?;
    Ok(CataloguePrices(
        products
            .into_iter()
            .filter_map(|product| {
                let sku = product.sku?;
                Some((
                    sku,
                    CatalogPrice {
                        product_id: Some(product.id),
                        name: product.name,
                        unit: product.unit,
                        price_pen: product.price_pen,
                    },
                ))
            })
            .collect(),
    ))
}
