use axum::{
    extract::{Json, Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Router,
};
use serde::Deserialize;
use utoipa::IntoParams;

use crate::api::auth::extractor::AuthUser;
use crate::api::{PaginatedResponse, PaginationQuery};
use crate::domain::items::dto::{CreateItemDto, UpdateItemDto};
use crate::domain::items::service::ItemsService;
use crate::error::Result;
use crate::state::AppState;

#[derive(Debug, Deserialize, IntoParams)]
pub struct LowStockQuery {
    pub threshold: Option<i32>,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(find_all).post(create))
        .route("/low-stock", get(get_low_stock))
        .route("/:id", get(find_one).patch(update).delete(delete_consumable))
}

#[utoipa::path(
    get,
    path = "/consumables",
    tag = "Consumables",
    security(("bearerAuth" = [])),
    params(PaginationQuery),
    responses(
        (status = 200, description = "Paginated consumables"),
    )
)]
pub async fn find_all(
    State(s): State<AppState>,
    _u: AuthUser,
    Query(pagination): Query<PaginationQuery>,
) -> Result<impl IntoResponse> {
    let (items, total) = ItemsService::find_all_consumables_paginated(
        &s.db,
        pagination.limit(),
        pagination.offset(),
    )
    .await?;
    Ok(Json(PaginatedResponse::new(items, total, &pagination)))
}

#[utoipa::path(
    get,
    path = "/consumables/{id}",
    tag = "Consumables",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Consumable ID")),
    responses(
        (status = 200, description = "Consumable details", body = ItemWithRelations),
        (status = 404, description = "Not found"),
    )
)]
pub async fn find_one(
    State(s): State<AppState>,
    _u: AuthUser,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse> {
    Ok(Json(ItemsService::find_one_consumable(&s.db, id).await?))
}

#[utoipa::path(
    post,
    path = "/consumables",
    tag = "Consumables",
    security(("bearerAuth" = [])),
    request_body = CreateItemDto,
    responses(
        (status = 201, description = "Consumable created", body = ItemWithRelations),
    )
)]
pub async fn create(
    State(s): State<AppState>,
    _u: AuthUser,
    Json(dto): Json<CreateItemDto>,
) -> Result<impl IntoResponse> {
    let item = ItemsService::create_consumable(&s.db, dto).await?;
    Ok((StatusCode::CREATED, Json(item)))
}

#[utoipa::path(
    patch,
    path = "/consumables/{id}",
    tag = "Consumables",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Consumable ID")),
    request_body = UpdateItemDto,
    responses(
        (status = 200, description = "Updated consumable", body = ItemWithRelations),
    )
)]
pub async fn update(
    State(s): State<AppState>,
    _u: AuthUser,
    Path(id): Path<i32>,
    Json(dto): Json<UpdateItemDto>,
) -> Result<impl IntoResponse> {
    let item = ItemsService::update_consumable(
        &s.db,
        id,
        dto,
        &s.email,
        &s.push,
        s.config.alert_email_recipient.clone(),
    )
    .await?;
    Ok(Json(item))
}

#[utoipa::path(
    delete,
    path = "/consumables/{id}",
    tag = "Consumables",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Consumable ID")),
    responses(
        (status = 204, description = "Deleted"),
    )
)]
pub async fn delete_consumable(
    State(s): State<AppState>,
    _u: AuthUser,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse> {
    ItemsService::delete_consumable(&s.db, id).await?;
    Ok(StatusCode::NO_CONTENT)
}

#[utoipa::path(
    get,
    path = "/consumables/low-stock",
    tag = "Consumables",
    security(("bearerAuth" = [])),
    params(LowStockQuery),
    responses(
        (status = 200, description = "Low stock consumables", body = Vec<ItemWithRelations>),
    )
)]
pub async fn get_low_stock(
    State(s): State<AppState>,
    _u: AuthUser,
    Query(q): Query<LowStockQuery>,
) -> Result<impl IntoResponse> {
    let threshold = q.threshold.unwrap_or(5);
    Ok(Json(ItemsService::get_low_stock(&s.db, threshold).await?))
}
