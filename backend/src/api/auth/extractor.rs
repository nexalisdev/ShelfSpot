use axum::{async_trait, extract::FromRequestParts, http::header::{AUTHORIZATION, COOKIE}, http::request::Parts};

use crate::domain::auth::jwt::decode_token;
use crate::error::AppError;
use crate::state::AppState;

// ── AuthUser ─────────────────────────────────────────────────────────────────
// Validates the JWT from the Cookie header (preferred) or Authorization header.

#[derive(Debug, Clone)]
pub struct AuthUser {
    pub user_id: i32,
    pub email: String,
    // pub name: Option<String>,
    pub admin: bool,
    // pub notification_token: Option<String>,
}

fn extract_token_from_parts(parts: &Parts) -> Option<String> {
    // Priority 1: HttpOnly cookie
    if let Some(cookie_header) = parts.headers.get(COOKIE).and_then(|v| v.to_str().ok()) {
        for pair in cookie_header.split(';') {
            let pair = pair.trim();
            if let Some(token) = pair.strip_prefix("access_token=") {
                if !token.is_empty() {
                    return Some(token.to_string());
                }
            }
        }
    }

    // Priority 2: Authorization: Bearer <token>
    parts
        .headers
        .get(AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .map(|t| t.to_string())
}

#[async_trait]
impl FromRequestParts<AppState> for AuthUser {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> std::result::Result<Self, Self::Rejection> {
        let token = extract_token_from_parts(parts).ok_or(AppError::Unauthorized)?;
        let claims = decode_token(&token, &state.config.jwt_secret)?;
        let user_id: i32 = claims.sub.parse().map_err(|_| AppError::Unauthorized)?;

        Ok(AuthUser {
            user_id,
            email: claims.email,
            // name: claims.name,
            admin: claims.admin,
            // notification_token: claims.notification_token,
        })
    }
}

// ── AdminUser ─────────────────────────────────────────────────────────────────
// Validates JWT and performs ONE DB query to confirm admin status.

#[derive(Debug, Clone)]
pub struct AdminUser {
    pub user_id: i32,
    pub email: String,
}

#[async_trait]
impl FromRequestParts<AppState> for AdminUser {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> std::result::Result<Self, Self::Rejection> {
        let auth_user = AuthUser::from_request_parts(parts, state).await?;

        // Trust JWT claim for non-admin users to skip the DB round-trip.
        // For admin access we still verify in DB to catch revoked roles.
        if !auth_user.admin {
            return Err(AppError::Forbidden);
        }

        let is_admin: Option<bool> =
            sqlx::query_scalar(r#"SELECT admin FROM "User" WHERE id = $1"#)
                .bind(auth_user.user_id)
                .fetch_optional(&state.db)
                .await
                .map_err(|e| AppError::InternalServerError(e.to_string()))?;

        if !is_admin.unwrap_or(false) {
            return Err(AppError::Forbidden);
        }

        Ok(AdminUser {
            user_id: auth_user.user_id,
            email: auth_user.email,
        })
    }
}
