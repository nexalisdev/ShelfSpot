use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Router,
};

use crate::api::auth::extractor::AuthUser;
use crate::domain::containers::dto::{CreateContainerDto, UpdateContainerDto};
use crate::domain::containers::service::ContainersService;
use crate::error::Result;
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", post(create).get(find_all))
        .route("/bulk", post(bulk_create))
        .route("/:id", get(find_one).patch(update).delete(delete_container))
}

#[utoipa::path(
    get,
    path = "/containers",
    tag = "Containers",
    security(("bearerAuth" = [])),
    responses(
        (status = 200, description = "List of containers", body = Vec<ContainerWithRelations>),
    )
)]
pub async fn find_all(State(state): State<AppState>, _user: AuthUser) -> Result<impl IntoResponse> {
    Ok(Json(ContainersService::find_all(&state.db).await?))
}

#[utoipa::path(
    get,
    path = "/containers/{id}",
    tag = "Containers",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Container ID")),
    responses(
        (status = 200, description = "Container details", body = ContainerWithRelations),
        (status = 404, description = "Not found"),
    )
)]
pub async fn find_one(
    State(state): State<AppState>,
    _user: AuthUser,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse> {
    Ok(Json(ContainersService::find_one(&state.db, id).await?))
}

#[utoipa::path(
    post,
    path = "/containers",
    tag = "Containers",
    security(("bearerAuth" = [])),
    request_body = CreateContainerDto,
    responses(
        (status = 200, description = "Created container", body = ContainerWithRelations),
    )
)]
pub async fn create(
    State(state): State<AppState>,
    _user: AuthUser,
    Json(dto): Json<CreateContainerDto>,
) -> Result<impl IntoResponse> {
    Ok(Json(ContainersService::create(&state.db, dto).await?))
}

#[utoipa::path(
    post,
    path = "/containers/bulk",
    tag = "Containers",
    security(("bearerAuth" = [])),
    request_body = Vec<CreateContainerDto>,
    responses(
        (status = 200, description = "Created containers", body = Vec<ContainerWithRelations>),
    )
)]
pub async fn bulk_create(
    State(state): State<AppState>,
    _user: AuthUser,
    Json(containers): Json<Vec<CreateContainerDto>>,
) -> Result<impl IntoResponse> {
    Ok(Json(ContainersService::bulk_create(&state.db, containers).await?))
}

#[utoipa::path(
    patch,
    path = "/containers/{id}",
    tag = "Containers",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Container ID")),
    request_body = UpdateContainerDto,
    responses(
        (status = 200, description = "Updated container", body = ContainerWithRelations),
    )
)]
pub async fn update(
    State(state): State<AppState>,
    _user: AuthUser,
    Path(id): Path<i32>,
    Json(dto): Json<UpdateContainerDto>,
) -> Result<impl IntoResponse> {
    Ok(Json(ContainersService::update(&state.db, id, dto).await?))
}

#[utoipa::path(
    delete,
    path = "/containers/{id}",
    tag = "Containers",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Container ID")),
    responses(
        (status = 204, description = "Deleted"),
    )
)]
pub async fn delete_container(
    State(state): State<AppState>,
    _user: AuthUser,
    Path(id): Path<i32>,
) -> Result<StatusCode> {
    ContainersService::delete(&state.db, id).await?;
    Ok(StatusCode::NO_CONTENT)
}
