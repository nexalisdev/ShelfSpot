use axum::{
    extract::{Json, Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Router,
};

use crate::api::auth::extractor::AuthUser;
use crate::api::{PaginatedResponse, PaginationQuery};
use crate::domain::items::dto::{
    CreateItemDto, SearchQuery, UpdateItemDto,
};
use crate::domain::items::service::ItemsService;
use crate::error::Result;
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", post(create).get(find_all))
        .route("/bulk", post(bulk_create))
        .route("/inventory-value", get(inventory_value))
        .route("/statistics/status", get(status_statistics))
        .route("/search", get(search))
        .route("/:id", get(find_one).patch(update).delete(delete_item))
}

#[utoipa::path(
    get,
    path = "/items",
    tag = "Items",
    security(("bearerAuth" = [])),
    params(PaginationQuery),
    responses(
        (status = 200, description = "Paginated list of items"),
        (status = 401, description = "Unauthorized"),
    )
)]
pub async fn find_all(
    State(state): State<AppState>,
    _user: AuthUser,
    Query(pagination): Query<PaginationQuery>,
) -> Result<impl IntoResponse> {
    let (items, total) = ItemsService::find_all_paginated(
        &state.db,
        pagination.limit(),
        pagination.offset(),
    )
    .await?;
    Ok(Json(PaginatedResponse::new(items, total, &pagination)))
}

#[utoipa::path(
    get,
    path = "/items/{id}",
    tag = "Items",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Item ID")),
    responses(
        (status = 200, description = "Item details", body = ItemWithRelations),
        (status = 404, description = "Not found"),
    )
)]
pub async fn find_one(
    State(state): State<AppState>,
    _user: AuthUser,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse> {
    Ok(Json(ItemsService::find_one(&state.db, id).await?))
}

#[utoipa::path(
    post,
    path = "/items",
    tag = "Items",
    security(("bearerAuth" = [])),
    request_body = CreateItemDto,
    responses(
        (status = 200, description = "Created item", body = ItemWithRelations),
    )
)]
pub async fn create(
    State(state): State<AppState>,
    _user: AuthUser,
    Json(dto): Json<CreateItemDto>,
) -> Result<impl IntoResponse> {
    Ok(Json(ItemsService::create(&state.db, dto).await?))
}

#[utoipa::path(
    post,
    path = "/items/bulk",
    tag = "Items",
    security(("bearerAuth" = [])),
    request_body = Vec<CreateItemDto>,
    responses(
        (status = 200, description = "Created items", body = Vec<ItemWithRelations>),
    )
)]
pub async fn bulk_create(
    State(state): State<AppState>,
    _user: AuthUser,
    Json(items): Json<Vec<CreateItemDto>>,
) -> Result<impl IntoResponse> {
    Ok(Json(ItemsService::bulk_create(&state.db, items).await?))
}

#[utoipa::path(
    patch,
    path = "/items/{id}",
    tag = "Items",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Item ID")),
    request_body = UpdateItemDto,
    responses(
        (status = 200, description = "Updated item", body = ItemWithRelations),
    )
)]
pub async fn update(
    State(state): State<AppState>,
    _user: AuthUser,
    Path(id): Path<i32>,
    Json(dto): Json<UpdateItemDto>,
) -> Result<impl IntoResponse> {
    Ok(Json(ItemsService::update(&state.db, id, dto).await?))
}

#[utoipa::path(
    delete,
    path = "/items/{id}",
    tag = "Items",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Item ID")),
    responses(
        (status = 200, description = "Item deleted"),
    )
)]
pub async fn delete_item(
    State(state): State<AppState>,
    _user: AuthUser,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse> {
    ItemsService::delete(&state.db, id).await?;
    Ok(Json(serde_json::json!({ "message": "Item deleted successfully" })))
}

#[utoipa::path(
    get,
    path = "/items/search",
    tag = "Items",
    security(("bearerAuth" = [])),
    params(("q" = Option<String>, Query, description = "Search query")),
    responses(
        (status = 200, description = "Search results", body = Vec<ItemWithRelations>),
    )
)]
pub async fn search(
    State(state): State<AppState>,
    _user: AuthUser,
    Query(params): Query<SearchQuery>,
) -> Result<impl IntoResponse> {
    let q = params.q.unwrap_or_default();
    Ok(Json(ItemsService::search(&state.db, &q).await?))
}

#[utoipa::path(
    get,
    path = "/items/inventory-value",
    tag = "Items",
    security(("bearerAuth" = [])),
    responses(
        (status = 200, description = "Inventory value totals", body = InventoryValue),
    )
)]
pub async fn inventory_value(
    State(state): State<AppState>,
    _user: AuthUser,
) -> Result<impl IntoResponse> {
    Ok(Json(ItemsService::get_inventory_value(&state.db).await?))
}

#[utoipa::path(
    get,
    path = "/items/statistics/status",
    tag = "Items",
    security(("bearerAuth" = [])),
    responses(
        (status = 200, description = "Status distribution statistics", body = StatusStatistics),
    )
)]
pub async fn status_statistics(
    State(state): State<AppState>,
    _user: AuthUser,
) -> Result<impl IntoResponse> {
    Ok(Json(ItemsService::get_status_statistics(&state.db).await?))
}

// Needed for StatusCode import even though currently unused here
#[allow(dead_code)]
fn _use_status_code() -> StatusCode {
    StatusCode::OK
}
