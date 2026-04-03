use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Router,
};

use crate::api::auth::extractor::AuthUser;
use crate::domain::places::dto::{CreatePlaceDto, UpdatePlaceDto};
use crate::domain::places::service::PlacesService;
use crate::error::Result;
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", post(create).get(find_all))
        .route("/bulk", post(bulk_create))
        .route("/:id", get(find_one).patch(update).delete(delete_place))
}

#[utoipa::path(
    get,
    path = "/places",
    tag = "Places",
    security(("bearerAuth" = [])),
    responses(
        (status = 200, description = "List of places", body = Vec<Place>),
    )
)]
pub async fn find_all(State(state): State<AppState>, _user: AuthUser) -> Result<impl IntoResponse> {
    Ok(Json(PlacesService::find_all(&state.db).await?))
}

#[utoipa::path(
    get,
    path = "/places/{id}",
    tag = "Places",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Place ID")),
    responses(
        (status = 200, description = "Place details", body = Place),
        (status = 404, description = "Not found"),
    )
)]
pub async fn find_one(
    State(state): State<AppState>,
    _user: AuthUser,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse> {
    Ok(Json(PlacesService::find_one(&state.db, id).await?))
}

#[utoipa::path(
    post,
    path = "/places",
    tag = "Places",
    security(("bearerAuth" = [])),
    request_body = CreatePlaceDto,
    responses(
        (status = 200, description = "Created place", body = Place),
    )
)]
pub async fn create(
    State(state): State<AppState>,
    _user: AuthUser,
    Json(dto): Json<CreatePlaceDto>,
) -> Result<impl IntoResponse> {
    Ok(Json(PlacesService::create(&state.db, dto).await?))
}

#[utoipa::path(
    post,
    path = "/places/bulk",
    tag = "Places",
    security(("bearerAuth" = [])),
    request_body = Vec<CreatePlaceDto>,
    responses(
        (status = 200, description = "Created places", body = Vec<Place>),
    )
)]
pub async fn bulk_create(
    State(state): State<AppState>,
    _user: AuthUser,
    Json(places): Json<Vec<CreatePlaceDto>>,
) -> Result<impl IntoResponse> {
    Ok(Json(PlacesService::bulk_create(&state.db, places).await?))
}

#[utoipa::path(
    patch,
    path = "/places/{id}",
    tag = "Places",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Place ID")),
    request_body = UpdatePlaceDto,
    responses(
        (status = 200, description = "Updated place", body = Place),
    )
)]
pub async fn update(
    State(state): State<AppState>,
    _user: AuthUser,
    Path(id): Path<i32>,
    Json(dto): Json<UpdatePlaceDto>,
) -> Result<impl IntoResponse> {
    Ok(Json(PlacesService::update(&state.db, id, dto).await?))
}

#[utoipa::path(
    delete,
    path = "/places/{id}",
    tag = "Places",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Place ID")),
    responses(
        (status = 204, description = "Deleted"),
    )
)]
pub async fn delete_place(
    State(state): State<AppState>,
    _user: AuthUser,
    Path(id): Path<i32>,
) -> Result<StatusCode> {
    PlacesService::delete(&state.db, id).await?;
    Ok(StatusCode::NO_CONTENT)
}
