use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Router,
};

use crate::api::auth::extractor::AuthUser;
use crate::domain::projects::dto::{
    AddProjectItemDto, CreateProjectDto, UpdateProjectDto, UpdateProjectItemDto,
};
use crate::domain::projects::service::ProjectsService;
use crate::error::Result;
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(find_all).post(create))
        .route("/:id", get(find_one).patch(update).delete(delete_project))
        .route("/:id/statistics", get(get_statistics))
        .route("/:id/scoring/breakdown", get(get_score_breakdown))
        .route("/:id/items", get(get_items).post(add_item))
        .route(
            "/:id/items/:item_id",
            axum::routing::put(update_item).delete(remove_item),
        )
}

#[utoipa::path(
    get,
    path = "/projects",
    tag = "Projects",
    security(("bearerAuth" = [])),
    responses(
        (status = 200, description = "List of projects", body = Vec<ProjectResponse>),
    )
)]
pub async fn find_all(
    State(s): State<AppState>,
    _u: AuthUser,
) -> Result<impl IntoResponse> {
    Ok(Json(ProjectsService::find_all(&s.db).await?))
}

#[utoipa::path(
    get,
    path = "/projects/{id}",
    tag = "Projects",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Project ID")),
    responses(
        (status = 200, description = "Project details", body = ProjectResponse),
        (status = 404, description = "Not found"),
    )
)]
pub async fn find_one(
    State(s): State<AppState>,
    _u: AuthUser,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse> {
    Ok(Json(ProjectsService::find_one(&s.db, id).await?))
}

#[utoipa::path(
    post,
    path = "/projects",
    tag = "Projects",
    security(("bearerAuth" = [])),
    request_body = CreateProjectDto,
    responses(
        (status = 201, description = "Project created", body = ProjectResponse),
    )
)]
pub async fn create(
    State(s): State<AppState>,
    _u: AuthUser,
    Json(dto): Json<CreateProjectDto>,
) -> Result<impl IntoResponse> {
    let project = ProjectsService::create(&s.db, dto).await?;
    Ok((StatusCode::CREATED, Json(project)))
}

#[utoipa::path(
    patch,
    path = "/projects/{id}",
    tag = "Projects",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Project ID")),
    request_body = UpdateProjectDto,
    responses(
        (status = 200, description = "Updated project", body = ProjectResponse),
    )
)]
pub async fn update(
    State(s): State<AppState>,
    _u: AuthUser,
    Path(id): Path<i32>,
    Json(dto): Json<UpdateProjectDto>,
) -> Result<impl IntoResponse> {
    Ok(Json(ProjectsService::update(&s.db, id, dto).await?))
}

#[utoipa::path(
    delete,
    path = "/projects/{id}",
    tag = "Projects",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Project ID")),
    responses(
        (status = 204, description = "Deleted"),
    )
)]
pub async fn delete_project(
    State(s): State<AppState>,
    _u: AuthUser,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse> {
    ProjectsService::delete(&s.db, id).await?;
    Ok(StatusCode::NO_CONTENT)
}

#[utoipa::path(
    get,
    path = "/projects/{id}/statistics",
    tag = "Projects",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Project ID")),
    responses(
        (status = 200, description = "Project statistics"),
    )
)]
pub async fn get_statistics(
    State(s): State<AppState>,
    _u: AuthUser,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse> {
    Ok(Json(ProjectsService::get_project_statistics(&s.db, id).await?))
}

#[utoipa::path(
    get,
    path = "/projects/{id}/scoring/breakdown",
    tag = "Projects",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Project ID")),
    responses(
        (status = 200, description = "Score breakdown for all items in the project"),
    )
)]
pub async fn get_score_breakdown(
    State(s): State<AppState>,
    _u: AuthUser,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse> {
    Ok(Json(ProjectsService::get_item_score_breakdown(&s.db, id).await?))
}

#[utoipa::path(
    get,
    path = "/projects/{id}/items",
    tag = "Projects",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Project ID")),
    responses(
        (status = 200, description = "Items in the project", body = Vec<ProjectItemResponse>),
    )
)]
pub async fn get_items(
    State(s): State<AppState>,
    _u: AuthUser,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse> {
    Ok(Json(ProjectsService::get_project_items(&s.db, id).await?))
}

#[utoipa::path(
    post,
    path = "/projects/{id}/items",
    tag = "Projects",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Project ID")),
    request_body = AddProjectItemDto,
    responses(
        (status = 201, description = "Item added to project", body = ProjectItemResponse),
    )
)]
pub async fn add_item(
    State(s): State<AppState>,
    _u: AuthUser,
    Path(id): Path<i32>,
    Json(dto): Json<AddProjectItemDto>,
) -> Result<impl IntoResponse> {
    let item = ProjectsService::add_item(&s.db, id, dto).await?;
    Ok((StatusCode::CREATED, Json(item)))
}

#[utoipa::path(
    put,
    path = "/projects/{id}/items/{item_id}",
    tag = "Projects",
    security(("bearerAuth" = [])),
    params(
        ("id" = i32, Path, description = "Project ID"),
        ("item_id" = i32, Path, description = "Item ID"),
    ),
    request_body = UpdateProjectItemDto,
    responses(
        (status = 200, description = "Updated project item", body = ProjectItemResponse),
    )
)]
pub async fn update_item(
    State(s): State<AppState>,
    _u: AuthUser,
    Path((project_id, item_id)): Path<(i32, i32)>,
    Json(dto): Json<UpdateProjectItemDto>,
) -> Result<impl IntoResponse> {
    Ok(Json(
        ProjectsService::update_item(&s.db, project_id, item_id, dto).await?,
    ))
}

#[utoipa::path(
    delete,
    path = "/projects/{id}/items/{item_id}",
    tag = "Projects",
    security(("bearerAuth" = [])),
    params(
        ("id" = i32, Path, description = "Project ID"),
        ("item_id" = i32, Path, description = "Item ID"),
    ),
    responses(
        (status = 204, description = "Item removed from project"),
    )
)]
pub async fn remove_item(
    State(s): State<AppState>,
    _u: AuthUser,
    Path((project_id, item_id)): Path<(i32, i32)>,
) -> Result<impl IntoResponse> {
    ProjectsService::remove_item(&s.db, project_id, item_id).await?;
    Ok(StatusCode::NO_CONTENT)
}
