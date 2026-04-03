use axum::{
    extract::{Json, State},
    response::IntoResponse,
    Router,
};

use crate::api::auth::extractor::AuthUser;
use crate::domain::notifications::dto::SendTestPushDto;
use crate::domain::notifications::service::NotificationsService;
use crate::domain::alerts::dto::TestAlertResetDto;
use crate::domain::alerts::service::AlertsService;
use crate::error::{AppError, Result};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/test", axum::routing::post(test_push))
        .route("/test-alert-reset", axum::routing::post(test_alert_reset))
}

#[utoipa::path(
    post,
    path = "/notifications/test",
    tag = "Notifications",
    security(("bearerAuth" = [])),
    request_body = SendTestPushDto,
    responses(
        (status = 200, description = "Push notification sent"),
    )
)]
pub async fn test_push(
    State(s): State<AppState>,
    _u: AuthUser,
    Json(dto): Json<SendTestPushDto>,
) -> Result<impl IntoResponse> {
    NotificationsService::send_test(&s.push, dto).await?;
    Ok(Json(serde_json::json!({ "message": "Push notification sent" })))
}

#[utoipa::path(
    post,
    path = "/notifications/test-alert-reset",
    tag = "Notifications",
    security(("bearerAuth" = [])),
    request_body = TestAlertResetDto,
    responses(
        (status = 200, description = "Alert reset and check triggered"),
    )
)]
pub async fn test_alert_reset(
    State(s): State<AppState>,
    _u: AuthUser,
    Json(dto): Json<TestAlertResetDto>,
) -> Result<impl IntoResponse> {
    AlertsService::check_item_alerts(
        &s.db,
        &s.email,
        &s.push,
        s.config.alert_email_recipient.as_deref(),
        dto.item_id,
        dto.quantity,
    )
    .await
    .map_err(|e| AppError::InternalServerError(e.to_string()))?;
    Ok(Json(serde_json::json!({ "message": "Alert check triggered" })))
}
