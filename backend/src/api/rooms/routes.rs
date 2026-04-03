use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Router,
};

use crate::api::auth::extractor::AuthUser;
use crate::domain::rooms::dto::{CreateRoomDto, UpdateRoomDto};
use crate::domain::rooms::service::RoomsService;
use crate::error::Result;
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", post(create).get(find_all))
        .route("/bulk", post(bulk_create))
        .route("/:id", get(find_one).patch(update).delete(delete_room))
}

#[utoipa::path(
    get,
    path = "/rooms",
    tag = "Rooms",
    security(("bearerAuth" = [])),
    responses(
        (status = 200, description = "List of rooms", body = Vec<RoomWithDetails>),
    )
)]
pub async fn find_all(State(state): State<AppState>, _user: AuthUser) -> Result<impl IntoResponse> {
    Ok(Json(RoomsService::find_all(&state.db).await?))
}

#[utoipa::path(
    get,
    path = "/rooms/{id}",
    tag = "Rooms",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Room ID")),
    responses(
        (status = 200, description = "Room details", body = RoomWithDetails),
        (status = 404, description = "Not found"),
    )
)]
pub async fn find_one(
    State(state): State<AppState>,
    _user: AuthUser,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse> {
    Ok(Json(RoomsService::find_one(&state.db, id).await?))
}

#[utoipa::path(
    post,
    path = "/rooms",
    tag = "Rooms",
    security(("bearerAuth" = [])),
    request_body = CreateRoomDto,
    responses(
        (status = 200, description = "Created room", body = RoomWithDetails),
    )
)]
pub async fn create(
    State(state): State<AppState>,
    _user: AuthUser,
    Json(dto): Json<CreateRoomDto>,
) -> Result<impl IntoResponse> {
    Ok(Json(RoomsService::create(&state.db, dto).await?))
}

#[utoipa::path(
    post,
    path = "/rooms/bulk",
    tag = "Rooms",
    security(("bearerAuth" = [])),
    request_body = Vec<CreateRoomDto>,
    responses(
        (status = 200, description = "Created rooms", body = Vec<RoomWithDetails>),
    )
)]
pub async fn bulk_create(
    State(state): State<AppState>,
    _user: AuthUser,
    Json(rooms): Json<Vec<CreateRoomDto>>,
) -> Result<impl IntoResponse> {
    Ok(Json(RoomsService::bulk_create(&state.db, rooms).await?))
}

#[utoipa::path(
    patch,
    path = "/rooms/{id}",
    tag = "Rooms",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Room ID")),
    request_body = UpdateRoomDto,
    responses(
        (status = 200, description = "Updated room", body = RoomWithDetails),
    )
)]
pub async fn update(
    State(state): State<AppState>,
    _user: AuthUser,
    Path(id): Path<i32>,
    Json(dto): Json<UpdateRoomDto>,
) -> Result<impl IntoResponse> {
    Ok(Json(RoomsService::update(&state.db, id, dto).await?))
}

#[utoipa::path(
    delete,
    path = "/rooms/{id}",
    tag = "Rooms",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Room ID")),
    responses(
        (status = 204, description = "Deleted"),
    )
)]
pub async fn delete_room(
    State(state): State<AppState>,
    _user: AuthUser,
    Path(id): Path<i32>,
) -> Result<StatusCode> {
    RoomsService::delete(&state.db, id).await?;
    Ok(StatusCode::NO_CONTENT)
}
