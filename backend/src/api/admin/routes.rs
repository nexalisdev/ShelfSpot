use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Router,
};

use crate::api::auth::extractor::AdminUser;
use crate::domain::admin::dto::{CreateUserDto, UpdateUserDto};
use crate::domain::admin::service::AdminService;
use crate::domain::items::service::ItemsService;
use crate::error::Result;
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/users", get(list_users).post(create_user))
        .route(
            "/users/:id",
            axum::routing::put(update_user).delete(delete_user),
        )
        .route("/items/:id/hard", axum::routing::delete(hard_delete_item))
}

#[utoipa::path(
    get,
    path = "/admin/users",
    tag = "Admin",
    security(("bearerAuth" = [])),
    responses(
        (status = 200, description = "List of users", body = Vec<SafeUser>),
        (status = 403, description = "Forbidden"),
    )
)]
pub async fn list_users(
    State(s): State<AppState>,
    _u: AdminUser,
) -> Result<impl IntoResponse> {
    Ok(Json(AdminService::list_users(&s.db).await?))
}

#[utoipa::path(
    post,
    path = "/admin/users",
    tag = "Admin",
    security(("bearerAuth" = [])),
    request_body = CreateUserDto,
    responses(
        (status = 201, description = "User created", body = SafeUser),
        (status = 403, description = "Forbidden"),
    )
)]
pub async fn create_user(
    State(s): State<AppState>,
    _u: AdminUser,
    Json(dto): Json<CreateUserDto>,
) -> Result<impl IntoResponse> {
    let user = AdminService::create_user(&s.db, dto).await?;
    Ok((StatusCode::CREATED, Json(user)))
}

#[utoipa::path(
    put,
    path = "/admin/users/{id}",
    tag = "Admin",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "User ID")),
    request_body = UpdateUserDto,
    responses(
        (status = 200, description = "User updated", body = SafeUser),
        (status = 403, description = "Forbidden"),
    )
)]
pub async fn update_user(
    State(s): State<AppState>,
    _u: AdminUser,
    Path(id): Path<i32>,
    Json(dto): Json<UpdateUserDto>,
) -> Result<impl IntoResponse> {
    Ok(Json(AdminService::update_user(&s.db, id, dto).await?))
}

#[utoipa::path(
    delete,
    path = "/admin/users/{id}",
    tag = "Admin",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "User ID")),
    responses(
        (status = 204, description = "Deleted"),
        (status = 403, description = "Forbidden"),
    )
)]
pub async fn delete_user(
    State(s): State<AppState>,
    _u: AdminUser,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse> {
    AdminService::delete_user(&s.db, id).await?;
    Ok(StatusCode::NO_CONTENT)
}

#[utoipa::path(
    delete,
    path = "/admin/items/{id}/hard",
    tag = "Admin",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Item ID")),
    responses(
        (status = 204, description = "Item permanently deleted"),
        (status = 403, description = "Forbidden"),
        (status = 404, description = "Not found"),
    )
)]
pub async fn hard_delete_item(
    State(s): State<AppState>,
    _u: AdminUser,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse> {
    ItemsService::hard_delete(&s.db, id).await?;
    Ok(StatusCode::NO_CONTENT)
}
