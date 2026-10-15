use axum::extract::{Path, State};
use axum::{Router, routing};
use serde::Deserialize;
use serde_json::{Value, json};

use super::extract::{ApiJson, ApiQuery, Created, Data, double_option, required_text};
use crate::auth::{AdminUser, AuthUser, Client};
use crate::domain::inputs::{self, InputPlan};
use crate::domain::species;
use crate::error::{AppError, AppResult};
use crate::infra::repo::products::{self, CATEGORIES, Product, ProductFields};
use crate::infra::repo::{audit, settings};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/inputs/calculate", routing::post(calculate))
        .route("/api/products", routing::get(list))
        .route("/api/admin/products", routing::get(admin_list).post(create))
        .route(
            "/api/admin/products/{id}",
            routing::patch(update).delete(remove),
        )
}

#[derive(Deserialize)]
pub struct CalculateBody {
    species: Option<String>,
    area_ha: Option<f64>,
    target_yield_t_ha: Option<f64>,
}

pub async fn calculate(
    State(state): State<AppState>,
    _user: AuthUser,
    ApiJson(body): ApiJson<CalculateBody>,
) -> AppResult<Data<InputPlan>> {
    let code = body
        .species
        .ok_or_else(|| AppError::Validation("species is required".into()))?;
    let species = species::find(&code)
        .ok_or_else(|| AppError::Validation(format!("unknown species {code}")))?;
    let area = body
        .area_ha
        .filter(|area| *area > 0.0 && *area <= 100_000.0)
        .ok_or_else(|| AppError::Validation("area_ha must be greater than 0".into()))?;
    if body
        .target_yield_t_ha
        .is_some_and(|target| !(target > 0.0 && target < 200.0))
    {
        return Err(AppError::Validation(
            "target_yield_t_ha must be a positive number".into(),
        ));
    }
    let prices = products::price_book(&state.db).await?;
    let labour = settings::labour_day_pen(&state.db).await?;
    Ok(Data(inputs::calculate(
        species,
        area,
        body.target_yield_t_ha,
        labour,
        &prices,
    )))
}

#[derive(Deserialize)]
pub struct ProductQuery {
    category: Option<String>,
    q: Option<String>,
}

pub async fn list(
    State(state): State<AppState>,
    _user: AuthUser,
    ApiQuery(query): ApiQuery<ProductQuery>,
) -> AppResult<Data<Vec<Product>>> {
    Ok(Data(
        products::list(
            &state.db,
            query.category.as_deref().filter(|c| !c.is_empty()),
            query.q.as_deref(),
            false,
        )
        .await?,
    ))
}

pub async fn admin_list(
    State(state): State<AppState>,
    _admin: AdminUser,
    ApiQuery(query): ApiQuery<ProductQuery>,
) -> AppResult<Data<Vec<Product>>> {
    Ok(Data(
        products::list(
            &state.db,
            query.category.as_deref().filter(|c| !c.is_empty()),
            query.q.as_deref(),
            true,
        )
        .await?,
    ))
}

#[derive(Deserialize, Default)]
pub struct ProductBody {
    #[serde(default, deserialize_with = "double_option")]
    sku: Option<Option<String>>,
    name: Option<String>,
    category: Option<String>,
    unit: Option<String>,
    price_pen: Option<f64>,
    #[serde(default, deserialize_with = "double_option")]
    supplier: Option<Option<String>>,
    #[serde(default, deserialize_with = "double_option")]
    url: Option<Option<String>>,
    active: Option<bool>,
}

fn clean(value: Option<String>, max: usize) -> Option<String> {
    value
        .map(|text| text.trim().chars().take(max).collect::<String>())
        .filter(|text| !text.is_empty())
}

fn merge(base: ProductFields, body: ProductBody) -> AppResult<ProductFields> {
    let category = body.category.unwrap_or(base.category);
    if !CATEGORIES.contains(&category.as_str()) {
        return Err(AppError::Validation(format!(
            "category must be one of {}",
            CATEGORIES.join(", ")
        )));
    }
    let price_pen = body.price_pen.unwrap_or(base.price_pen);
    if !(price_pen.is_finite() && price_pen >= 0.0) {
        return Err(AppError::Validation("price_pen must be >= 0".into()));
    }
    let url = body.url.map(|value| clean(value, 500)).unwrap_or(base.url);
    if url
        .as_deref()
        .is_some_and(|link| !(link.starts_with("https://") || link.starts_with("http://")))
    {
        return Err(AppError::Validation(
            "url must start with http(s)://".into(),
        ));
    }
    Ok(ProductFields {
        sku: body.sku.map(|value| clean(value, 60)).unwrap_or(base.sku),
        name: match body.name {
            Some(name) => required_text(Some(&name), "name", 160)?,
            None => base.name,
        },
        category,
        unit: match body.unit {
            Some(unit) => required_text(Some(&unit), "unit", 40)?,
            None => base.unit,
        },
        price_pen: (price_pen * 100.0).round() / 100.0,
        supplier: body
            .supplier
            .map(|value| clean(value, 160))
            .unwrap_or(base.supplier),
        url,
        active: body.active.unwrap_or(base.active),
    })
}

pub async fn create(
    State(state): State<AppState>,
    Client(client): Client,
    AdminUser(admin): AdminUser,
    ApiJson(body): ApiJson<ProductBody>,
) -> AppResult<Created<Product>> {
    if body.name.is_none()
        || body.category.is_none()
        || body.unit.is_none()
        || body.price_pen.is_none()
    {
        return Err(AppError::Validation(
            "name, category, unit and price_pen are required".into(),
        ));
    }
    let fields = merge(
        ProductFields {
            sku: None,
            name: String::new(),
            category: String::new(),
            unit: String::new(),
            price_pen: 0.0,
            supplier: None,
            url: None,
            active: true,
        },
        body,
    )?;
    let product = products::create(&state.db, fields).await?;
    audit::record(
        &state.db,
        Some(admin.id),
        "product_create",
        Some(format!("product:{}", product.id)),
        &client,
        json!({"name": product.name}),
    )
    .await;
    Ok(Created(product))
}

pub async fn update(
    State(state): State<AppState>,
    Client(client): Client,
    AdminUser(admin): AdminUser,
    Path(id): Path<i64>,
    ApiJson(body): ApiJson<ProductBody>,
) -> AppResult<Data<Product>> {
    let current = products::find(&state.db, id)
        .await?
        .ok_or(AppError::NotFound)?;
    let fields = merge(ProductFields::from(&current), body)?;
    let product = products::update(&state.db, id, fields).await?;
    audit::record(
        &state.db,
        Some(admin.id),
        "product_update",
        Some(format!("product:{id}")),
        &client,
        json!({"price_pen": {"from": current.price_pen, "to": product.price_pen}}),
    )
    .await;
    Ok(Data(product))
}

pub async fn remove(
    State(state): State<AppState>,
    Client(client): Client,
    AdminUser(admin): AdminUser,
    Path(id): Path<i64>,
) -> AppResult<Data<Value>> {
    let current = products::find(&state.db, id)
        .await?
        .ok_or(AppError::NotFound)?;
    products::delete(&state.db, id).await?;
    audit::record(
        &state.db,
        Some(admin.id),
        "product_delete",
        Some(format!("product:{id}")),
        &client,
        json!({"name": current.name}),
    )
    .await;
    Ok(Data(json!({"id": id, "deleted": true})))
}
