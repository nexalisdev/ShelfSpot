use axum::{
    extract::{Json, Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, post},
    Router,
};

use crate::api::auth::extractor::AuthUser;
use crate::domain::favourites::dto::{AddFavouriteDto, FavouriteQuery};
use crate::domain::favourites::service::FavouritesService;
use crate::error::Result;
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", post(add_favourite).get(get_favourites))
        .route("/item/:item_id", post(add_by_param).delete(remove_by_item_id))
        .route("/:id", delete(remove_by_id))
}

#[utoipa::path(
    get,
    path = "/favourites",
    tag = "Favourites",
    security(("bearerAuth" = [])),
    params(("userId" = Option<i32>, Query, description = "Admin: filter by user ID")),
    responses(
        (status = 200, description = "List of favourites", body = Vec<FavouriteWithItem>),
    )
)]
pub async fn get_favourites(
    State(state): State<AppState>,
    user: AuthUser,
    Query(query): Query<FavouriteQuery>,
) -> Result<impl IntoResponse> {
    let target_user_id = if user.admin {
        query.user_id.unwrap_or(user.user_id)
    } else {
        user.user_id
    };
    Ok(Json(FavouritesService::find_by_user(&state.db, target_user_id).await?))
}

#[utoipa::path(
    post,
    path = "/favourites",
    tag = "Favourites",
    security(("bearerAuth" = [])),
    request_body = AddFavouriteDto,
    responses(
        (status = 200, description = "Added favourite", body = FavouriteWithItem),
    )
)]
pub async fn add_favourite(
    State(state): State<AppState>,
    user: AuthUser,
    Json(dto): Json<AddFavouriteDto>,
) -> Result<impl IntoResponse> {
    Ok(Json(FavouritesService::add(&state.db, user.user_id, dto).await?))
}

#[utoipa::path(
    post,
    path = "/favourites/item/{item_id}",
    tag = "Favourites",
    security(("bearerAuth" = [])),
    params(("item_id" = i32, Path, description = "Item ID")),
    responses(
        (status = 200, description = "Added favourite", body = FavouriteWithItem),
    )
)]
pub async fn add_by_param(
    State(state): State<AppState>,
    user: AuthUser,
    Path(item_id): Path<i32>,
) -> Result<impl IntoResponse> {
    Ok(Json(FavouritesService::add_by_item_id(&state.db, user.user_id, item_id).await?))
}

#[utoipa::path(
    delete,
    path = "/favourites/{id}",
    tag = "Favourites",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Favourite ID")),
    responses(
        (status = 204, description = "Removed"),
    )
)]
pub async fn remove_by_id(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<i32>,
) -> Result<StatusCode> {
    FavouritesService::remove_by_id(&state.db, user.user_id, id).await?;
    Ok(StatusCode::NO_CONTENT)
}

#[utoipa::path(
    delete,
    path = "/favourites/item/{item_id}",
    tag = "Favourites",
    security(("bearerAuth" = [])),
    params(("item_id" = i32, Path, description = "Item ID")),
    responses(
        (status = 204, description = "Removed"),
    )
)]
pub async fn remove_by_item_id(
    State(state): State<AppState>,
    user: AuthUser,
    Path(item_id): Path<i32>,
) -> Result<StatusCode> {
    FavouritesService::remove_by_item_id(&state.db, user.user_id, item_id).await?;
    Ok(StatusCode::NO_CONTENT)
}
