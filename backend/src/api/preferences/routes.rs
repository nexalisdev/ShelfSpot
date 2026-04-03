use axum::{
    extract::{Json, State},
    response::IntoResponse,
    routing::get,
    Router,
};

use crate::api::auth::extractor::AuthUser;
use crate::domain::preferences::dto::UpdatePreferencesDto;
use crate::domain::preferences::service::PreferencesService;
use crate::error::Result;
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/", get(get_preferences).put(update_preferences))
}

#[utoipa::path(
    get,
    path = "/preferences",
    tag = "Preferences",
    security(("bearerAuth" = [])),
    responses(
        (status = 200, description = "User preferences", body = UserPreferences),
    )
)]
pub async fn get_preferences(
    State(s): State<AppState>,
    user: AuthUser,
) -> Result<impl IntoResponse> {
    Ok(Json(PreferencesService::get_or_create(&s.db, user.user_id).await?))
}

#[utoipa::path(
    put,
    path = "/preferences",
    tag = "Preferences",
    security(("bearerAuth" = [])),
    request_body = UpdatePreferencesDto,
    responses(
        (status = 200, description = "Updated preferences", body = UserPreferences),
    )
)]
pub async fn update_preferences(
    State(s): State<AppState>,
    user: AuthUser,
    Json(dto): Json<UpdatePreferencesDto>,
) -> Result<impl IntoResponse> {
    Ok(Json(PreferencesService::update(&s.db, user.user_id, dto).await?))
}
