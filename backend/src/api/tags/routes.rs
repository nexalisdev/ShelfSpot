use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Router,
};

use crate::api::auth::extractor::AuthUser;
use crate::domain::tags::dto::{CreateTagDto, UpdateTagDto};
use crate::domain::tags::service::TagsService;
use crate::error::Result;
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", post(create).get(find_all))
        .route("/:id", get(find_one).patch(update).delete(delete_tag))
}

#[utoipa::path(
    get,
    path = "/tags",
    tag = "Tags",
    security(("bearerAuth" = [])),
    responses(
        (status = 200, description = "List of tags", body = Vec<Tag>),
    )
)]
pub async fn find_all(State(state): State<AppState>, _user: AuthUser) -> Result<impl IntoResponse> {
    Ok(Json(TagsService::find_all(&state.db).await?))
}

#[utoipa::path(
    get,
    path = "/tags/{id}",
    tag = "Tags",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Tag ID")),
    responses(
        (status = 200, description = "Tag details", body = Tag),
        (status = 404, description = "Not found"),
    )
)]
pub async fn find_one(
    State(state): State<AppState>,
    _user: AuthUser,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse> {
    Ok(Json(TagsService::find_one(&state.db, id).await?))
}

#[utoipa::path(
    post,
    path = "/tags",
    tag = "Tags",
    security(("bearerAuth" = [])),
    request_body = CreateTagDto,
    responses(
        (status = 200, description = "Created tag", body = Tag),
    )
)]
pub async fn create(
    State(state): State<AppState>,
    _user: AuthUser,
    Json(dto): Json<CreateTagDto>,
) -> Result<impl IntoResponse> {
    Ok(Json(TagsService::create(&state.db, dto).await?))
}

#[utoipa::path(
    patch,
    path = "/tags/{id}",
    tag = "Tags",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Tag ID")),
    request_body = UpdateTagDto,
    responses(
        (status = 200, description = "Updated tag", body = Tag),
    )
)]
pub async fn update(
    State(state): State<AppState>,
    _user: AuthUser,
    Path(id): Path<i32>,
    Json(dto): Json<UpdateTagDto>,
) -> Result<impl IntoResponse> {
    Ok(Json(TagsService::update(&state.db, id, dto).await?))
}

#[utoipa::path(
    delete,
    path = "/tags/{id}",
    tag = "Tags",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Tag ID")),
    responses(
        (status = 204, description = "Deleted"),
    )
)]
pub async fn delete_tag(
    State(state): State<AppState>,
    _user: AuthUser,
    Path(id): Path<i32>,
) -> Result<StatusCode> {
    TagsService::delete(&state.db, id).await?;
    Ok(StatusCode::NO_CONTENT)
}
