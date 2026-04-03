use axum::{
    extract::{Json, Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Router,
};

use crate::api::auth::extractor::AuthUser;
use crate::api::{PaginatedResponse, PaginationQuery};
use crate::domain::alerts::dto::{CreateAlertDto, TestEmailQuery, UpdateAlertDto};
use crate::domain::alerts::service::AlertsService;
use crate::error::{AppError, Result};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", post(create).get(find_all))
        .route("/statistics/monthly", get(monthly_statistics))
        .route("/check", post(check_all))
        .route("/test-email", post(test_email))
        .route("/:id", get(find_one).patch(update).delete(delete_alert))
}

#[derive(Debug, serde::Deserialize, utoipa::IntoParams)]
pub struct AlertsQuery {
    #[serde(rename = "itemId")]
    pub item_id: Option<i32>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

#[utoipa::path(
    get,
    path = "/alerts",
    tag = "Alerts",
    security(("bearerAuth" = [])),
    params(AlertsQuery),
    responses(
        (status = 200, description = "Paginated list of alerts"),
    )
)]
pub async fn find_all(
    State(s): State<AppState>,
    _u: AuthUser,
    Query(q): Query<AlertsQuery>,
) -> Result<impl IntoResponse> {
    let pagination = PaginationQuery { page: q.page, limit: q.limit };
    let (alerts, total) = AlertsService::find_all_paginated(
        &s.db,
        q.item_id,
        pagination.limit(),
        pagination.offset(),
    )
    .await?;
    Ok(Json(PaginatedResponse::new(alerts, total, &pagination)))
}

#[utoipa::path(
    get,
    path = "/alerts/{id}",
    tag = "Alerts",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Alert ID")),
    responses(
        (status = 200, description = "Alert details", body = Alert),
        (status = 404, description = "Not found"),
    )
)]
pub async fn find_one(
    State(s): State<AppState>,
    _u: AuthUser,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse> {
    Ok(Json(AlertsService::find_one(&s.db, id).await?))
}

#[utoipa::path(
    post,
    path = "/alerts",
    tag = "Alerts",
    security(("bearerAuth" = [])),
    request_body = CreateAlertDto,
    responses(
        (status = 201, description = "Created alert", body = Alert),
    )
)]
pub async fn create(
    State(s): State<AppState>,
    _u: AuthUser,
    Json(dto): Json<CreateAlertDto>,
) -> Result<impl IntoResponse> {
    let alert = AlertsService::create(&s.db, dto).await?;
    Ok((StatusCode::CREATED, Json(alert)))
}

#[utoipa::path(
    patch,
    path = "/alerts/{id}",
    tag = "Alerts",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Alert ID")),
    request_body = UpdateAlertDto,
    responses(
        (status = 200, description = "Updated alert", body = Alert),
    )
)]
pub async fn update(
    State(s): State<AppState>,
    _u: AuthUser,
    Path(id): Path<i32>,
    Json(dto): Json<UpdateAlertDto>,
) -> Result<impl IntoResponse> {
    Ok(Json(AlertsService::update(&s.db, id, dto).await?))
}

#[utoipa::path(
    delete,
    path = "/alerts/{id}",
    tag = "Alerts",
    security(("bearerAuth" = [])),
    params(("id" = i32, Path, description = "Alert ID")),
    responses(
        (status = 204, description = "Deleted"),
    )
)]
pub async fn delete_alert(
    State(s): State<AppState>,
    _u: AuthUser,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse> {
    AlertsService::delete(&s.db, id).await?;
    Ok(StatusCode::NO_CONTENT)
}

#[utoipa::path(
    post,
    path = "/alerts/check",
    tag = "Alerts",
    security(("bearerAuth" = [])),
    responses(
        (status = 200, description = "Alert check triggered"),
    )
)]
pub async fn check_all(State(s): State<AppState>, _u: AuthUser) -> Result<impl IntoResponse> {
    AlertsService::check_all_alerts(&s.db, &s.email, &s.push, s.config.alert_email_recipient.as_deref())
        .await
        .map_err(|e| AppError::InternalServerError(e.to_string()))?;
    Ok(Json(serde_json::json!({ "message": "Alert check completed" })))
}

#[utoipa::path(
    post,
    path = "/alerts/test-email",
    tag = "Alerts",
    security(("bearerAuth" = [])),
    params(("email" = Option<String>, Query, description = "Target email")),
    responses(
        (status = 200, description = "Test email sent"),
    )
)]
pub async fn test_email(
    State(s): State<AppState>,
    _u: AuthUser,
    Query(q): Query<TestEmailQuery>,
) -> Result<impl IntoResponse> {
    let email = q
        .email
        .or_else(|| s.config.alert_email_recipient.clone())
        .ok_or_else(|| AppError::BadRequest("No email address provided".into()))?;
    s.email
        .send_alert_email(&email, "Test Item", 2, 5)
        .await
        .map_err(|e| AppError::InternalServerError(e.to_string()))?;
    Ok(Json(serde_json::json!({ "message": "Test email sent" })))
}

#[utoipa::path(
    get,
    path = "/alerts/statistics/monthly",
    tag = "Alerts",
    security(("bearerAuth" = [])),
    responses(
        (status = 200, description = "Monthly statistics", body = Vec<MonthlyStatEntry>),
    )
)]
pub async fn monthly_statistics(
    State(s): State<AppState>,
    _u: AuthUser,
) -> Result<impl IntoResponse> {
    Ok(Json(AlertsService::get_monthly_statistics(&s.db).await?))
}

