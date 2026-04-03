use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Unauthorized")]
    Unauthorized,

    #[error("Forbidden")]
    Forbidden,

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Internal server error: {0}")]
    InternalServerError(String),

    #[error(transparent)]
    Sqlx(#[from] sqlx::Error),

    #[error(transparent)]
    Anyhow(#[from] anyhow::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized".to_string()),
            AppError::Forbidden => (StatusCode::FORBIDDEN, "Forbidden".to_string()),
            AppError::Conflict(msg) => (StatusCode::CONFLICT, msg.clone()),
            AppError::InternalServerError(msg) => {
                (StatusCode::INTERNAL_SERVER_ERROR, msg.clone())
            }
            AppError::Sqlx(e) => {
                tracing::error!("Database error: {}", e);
                // Check for unique constraint violations
                if let sqlx::Error::Database(db_err) = e {
                    if let Some(code) = db_err.code() {
                        if code == "23505" {
                            return (
                                StatusCode::CONFLICT,
                                Json(json!({ "error": "Conflict: resource already exists" })),
                            )
                                .into_response();
                        }
                    }
                }
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Database error".to_string(),
                )
            }
            AppError::Anyhow(e) => {
                tracing::error!("Internal error: {}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
            }
        };

        (status, Json(json!({ "error": message }))).into_response()
    }
}

pub type Result<T> = std::result::Result<T, AppError>;
