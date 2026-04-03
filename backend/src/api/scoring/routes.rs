use axum::{
    extract::{Json, State},
    response::IntoResponse,
    routing::{get, post},
    Router,
};

use crate::api::auth::extractor::AuthUser;
use crate::domain::scoring::service::ScoringService;
use crate::error::Result;
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/statistics", get(get_statistics))
        .route("/top-items", get(get_top_items))
        .route("/critical-items", get(get_critical_items))
        .route("/recalculate", post(recalculate))
}

#[utoipa::path(
    get,
    path = "/scoring/statistics",
    tag = "Scoring",
    security(("bearerAuth" = [])),
    responses(
        (status = 200, description = "Global score statistics"),
    )
)]
pub async fn get_statistics(
    State(s): State<AppState>,
    _u: AuthUser,
) -> Result<impl IntoResponse> {
    Ok(Json(ScoringService::get_score_statistics(&s.db).await?))
}

#[utoipa::path(
    get,
    path = "/scoring/top-items",
    tag = "Scoring",
    security(("bearerAuth" = [])),
    responses(
        (status = 200, description = "Top scored items"),
    )
)]
pub async fn get_top_items(
    State(s): State<AppState>,
    _u: AuthUser,
) -> Result<impl IntoResponse> {
    Ok(Json(ScoringService::get_top_items(&s.db).await?))
}

#[utoipa::path(
    get,
    path = "/scoring/critical-items",
    tag = "Scoring",
    security(("bearerAuth" = [])),
    responses(
        (status = 200, description = "Critical (low-scored) items"),
    )
)]
pub async fn get_critical_items(
    State(s): State<AppState>,
    _u: AuthUser,
) -> Result<impl IntoResponse> {
    Ok(Json(ScoringService::get_critical_items(&s.db).await?))
}

#[utoipa::path(
    post,
    path = "/scoring/recalculate",
    tag = "Scoring",
    security(("bearerAuth" = [])),
    responses(
        (status = 200, description = "Score recalculation triggered"),
    )
)]
pub async fn recalculate(
    State(s): State<AppState>,
    _u: AuthUser,
) -> Result<impl IntoResponse> {
    let db = s.db.clone();
    tokio::spawn(async move {
        if let Err(e) = ScoringService::recalculate_all_scores(&db).await {
            tracing::error!("Score recalculation failed: {:?}", e);
        }
    });
    Ok(Json(serde_json::json!({ "message": "Score recalculation triggered" })))
}
