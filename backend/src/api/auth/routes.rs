use std::sync::Arc;

use axum::{
    extract::{Json, State},
    http::{header::SET_COOKIE, HeaderMap, HeaderValue, StatusCode},
    response::IntoResponse,
    routing::{get, post, put},
    Router,
};
use tower_governor::{governor::GovernorConfigBuilder, key_extractor::SmartIpKeyExtractor, GovernorLayer};

use crate::api::auth::extractor::AuthUser;
use crate::domain::auth::dto::{
    ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto,
    UpdateEmailDto, UpdateNameDto, UpdateNotificationTokenDto,
};
use crate::domain::auth::service::AuthService;
use crate::error::{AppError, Result};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    // 5 requests burst, then 1 per 12 seconds (≈ 5/min) for sensitive auth routes
    let rate_limit_conf = Arc::new(
        GovernorConfigBuilder::default()
            .per_millisecond(12_000)
            .burst_size(5)
            .key_extractor(SmartIpKeyExtractor)
            .finish()
            .unwrap(),
    );

    let rate_limited = Router::new()
        .route("/login", post(login))
        .route("/register", post(register))
        .route("/password/forgot", post(forgot_password))
        .layer(GovernorLayer {
            config: rate_limit_conf,
        });

    let open = Router::new()
        .route("/logout", post(logout))
        .route("/refresh", post(refresh))
        .route("/profile", get(get_profile))
        .route("/profile/name", put(update_name))
        .route("/profile/email", put(update_email))
        .route("/password/reset", post(reset_password))
        .route("/notification-token", put(update_notification_token));

    Router::new().merge(rate_limited).merge(open)
}

fn build_cookie(name: &str, value: &str, max_age: i64, frontend_url: &str) -> String {
    let secure = if frontend_url.starts_with("https://") {
        " Secure;"
    } else {
        ""
    };
    format!(
        "{}={}; HttpOnly;{} SameSite=Strict; Path=/; Max-Age={}",
        name, value, secure, max_age
    )
}

#[utoipa::path(
    post,
    path = "/auth/register",
    tag = "Auth",
    request_body = RegisterDto,
    responses(
        (status = 201, description = "User registered", body = crate::domain::users::entity::SafeUser),
        (status = 400, description = "Invalid payload"),
        (status = 409, description = "Email already in use"),
    )
)]
pub async fn register(
    State(state): State<AppState>,
    Json(dto): Json<RegisterDto>,
) -> Result<impl IntoResponse> {
    let user = AuthService::register(&state.db, dto).await?;
    Ok((StatusCode::CREATED, Json(user)))
}

#[utoipa::path(
    post,
    path = "/auth/login",
    tag = "Auth",
    request_body = LoginDto,
    responses(
        (status = 200, description = "User authenticated", body = crate::domain::auth::dto::LoginResponse),
        (status = 400, description = "Invalid payload"),
        (status = 401, description = "Invalid credentials"),
        (status = 404, description = "User not found"),
    )
)]
pub async fn login(
    State(state): State<AppState>,
    Json(dto): Json<LoginDto>,
) -> Result<impl IntoResponse> {
    let (response, raw_refresh) =
        AuthService::login(&state.db, dto, &state.config.jwt_secret).await?;

    let access_cookie =
        build_cookie("access_token", &response.access_token, 900, &state.config.frontend_url);
    let refresh_cookie =
        build_cookie("refresh_token", &raw_refresh, 2_592_000, &state.config.frontend_url);

    let access_header = HeaderValue::from_str(&access_cookie)
        .map_err(|_| AppError::InternalServerError("Cookie header error".to_string()))?;
    let refresh_header = HeaderValue::from_str(&refresh_cookie)
        .map_err(|_| AppError::InternalServerError("Cookie header error".to_string()))?;

    let mut headers = HeaderMap::new();
    headers.append(SET_COOKIE, access_header);
    headers.append(SET_COOKIE, refresh_header);

    Ok((headers, Json(response)))
}

#[utoipa::path(
    post,
    path = "/auth/logout",
    tag = "Auth",
    security(("bearerAuth" = [])),
    responses(
        (status = 204, description = "User logged out"),
        (status = 401, description = "Unauthorized"),
    )
)]
pub async fn logout(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<impl IntoResponse> {
    AuthService::logout(&state.db, auth_user.user_id).await?;
    let expired_access = "access_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0";
    let expired_refresh = "refresh_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0";
    let mut headers = HeaderMap::new();
    headers.append(SET_COOKIE, HeaderValue::from_static(expired_access));
    headers.append(SET_COOKIE, HeaderValue::from_static(expired_refresh));
    Ok((headers, StatusCode::NO_CONTENT))
}

#[utoipa::path(
    post,
    path = "/auth/refresh",
    tag = "Auth",
    responses(
        (status = 200, description = "Access token refreshed"),
        (status = 401, description = "Missing or invalid refresh token"),
    )
)]
pub async fn refresh(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse> {
    // Read refresh_token from cookie
    let raw_refresh = headers
        .get("cookie")
        .and_then(|v| v.to_str().ok())
        .and_then(|cookies| {
            cookies.split(';').find_map(|part| {
                let part = part.trim();
                part.strip_prefix("refresh_token=")
            })
        })
        .map(|s| s.to_string())
        .ok_or(AppError::Unauthorized)?;

    let access_token =
        AuthService::refresh(&state.db, &raw_refresh, &state.config.jwt_secret).await?;

    let access_cookie =
        build_cookie("access_token", &access_token, 900, &state.config.frontend_url);
    let access_header = HeaderValue::from_str(&access_cookie)
        .map_err(|_| AppError::InternalServerError("Cookie header error".to_string()))?;

    Ok((
        [(SET_COOKIE, access_header)],
        Json(serde_json::json!({ "access_token": access_token })),
    ))
}

#[utoipa::path(
    get,
    path = "/auth/profile",
    tag = "Auth",
    security(("bearerAuth" = [])),
    responses(
        (status = 200, description = "Current user profile", body = crate::domain::users::entity::SafeUser),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "User not found"),
    )
)]
pub async fn get_profile(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<impl IntoResponse> {
    let user = AuthService::get_profile(&state.db, auth_user.user_id).await?;
    Ok(Json(user))
}

#[utoipa::path(
    put,
    path = "/auth/profile/name",
    tag = "Auth",
    security(("bearerAuth" = [])),
    request_body = UpdateNameDto,
    responses(
        (status = 200, description = "User name updated", body = crate::domain::users::entity::SafeUser),
        (status = 400, description = "Invalid payload"),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "User not found"),
    )
)]
pub async fn update_name(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(dto): Json<UpdateNameDto>,
) -> Result<impl IntoResponse> {
    let user = AuthService::update_name(&state.db, auth_user.user_id, dto).await?;
    Ok(Json(user))
}

#[utoipa::path(
    put,
    path = "/auth/profile/email",
    tag = "Auth",
    security(("bearerAuth" = [])),
    request_body = UpdateEmailDto,
    responses(
        (status = 200, description = "User email updated", body = crate::domain::users::entity::SafeUser),
        (status = 400, description = "Invalid payload"),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "User not found"),
        (status = 409, description = "Email already in use"),
    )
)]
pub async fn update_email(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(dto): Json<UpdateEmailDto>,
) -> Result<impl IntoResponse> {
    let user = AuthService::update_email(&state.db, auth_user.user_id, dto).await?;
    Ok(Json(user))
}

#[utoipa::path(
    post,
    path = "/auth/password/reset",
    tag = "Auth",
    security(("bearerAuth" = [])),
    request_body = ResetPasswordDto,
    responses(
        (status = 204, description = "Password updated"),
        (status = 400, description = "Invalid payload"),
        (status = 401, description = "Unauthorized or current password invalid"),
        (status = 404, description = "User not found"),
    )
)]
pub async fn reset_password(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(dto): Json<ResetPasswordDto>,
) -> Result<impl IntoResponse> {
    AuthService::reset_password(&state.db, auth_user.user_id, dto).await?;
    Ok(StatusCode::NO_CONTENT)
}

#[utoipa::path(
    post,
    path = "/auth/password/forgot",
    tag = "Auth",
    request_body = ForgotPasswordDto,
    responses(
        (status = 200, description = "Temporary password sent"),
        (status = 400, description = "Invalid payload"),
        (status = 404, description = "User not found"),
    )
)]
pub async fn forgot_password(
    State(state): State<AppState>,
    Json(dto): Json<ForgotPasswordDto>,
) -> Result<impl IntoResponse> {
    AuthService::forgot_password(&state.db, &state.email, dto).await?;
    Ok(Json(serde_json::json!({ "message": "Temporary password sent" })))
}

#[utoipa::path(
    put,
    path = "/auth/notification-token",
    tag = "Auth",
    security(("bearerAuth" = [])),
    request_body = UpdateNotificationTokenDto,
    responses(
        (status = 204, description = "Notification token updated"),
        (status = 401, description = "Unauthorized"),
    )
)]
pub async fn update_notification_token(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(dto): Json<UpdateNotificationTokenDto>,
) -> Result<impl IntoResponse> {
    AuthService::update_notification_token(&state.db, auth_user.user_id, dto).await?;
    Ok(StatusCode::NO_CONTENT)
}
