//! Command and query objects for authentication.

use serde::{Deserialize, Serialize};
use validator::{Validate, ValidationError};

fn validate_password(password: &str) -> Result<(), ValidationError> {
    if password.len() < 8 {
        return Err(ValidationError::new("password_too_short"));
    }
    if !password.chars().any(|c| c.is_uppercase()) {
        return Err(ValidationError::new("password_needs_uppercase"));
    }
    if !password.chars().any(|c| c.is_ascii_digit()) {
        return Err(ValidationError::new("password_needs_digit"));
    }
    Ok(())
}

// ---------------------------------------------------------------------------
// Commands (inputs)
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize, Validate, utoipa::ToSchema)]
pub struct RegisterDto {
    #[validate(email(message = "Invalid email format"))]
    pub email: String,
    #[validate(custom(function = validate_password))]
    pub password: String,
    #[validate(length(max = 100))]
    pub name: Option<String>,
    pub notification_token: Option<String>,
}

#[derive(Debug, Deserialize, Validate, utoipa::ToSchema)]
pub struct LoginDto {
    #[validate(email(message = "Invalid email format"))]
    pub email: String,
    #[validate(length(min = 1, message = "Password is required"))]
    pub password: String,
}

#[derive(Debug, Deserialize, Validate, utoipa::ToSchema)]
pub struct UpdateNameDto {
    #[validate(length(min = 1, max = 100, message = "Name must be between 1 and 100 characters"))]
    pub name: String,
}

#[derive(Debug, Deserialize, Validate, utoipa::ToSchema)]
pub struct UpdateEmailDto {
    #[validate(email(message = "Invalid email format"))]
    pub email: String,
}

#[derive(Debug, Deserialize, Validate, utoipa::ToSchema)]
pub struct ResetPasswordDto {
    #[validate(length(min = 1, message = "Current password is required"))]
    pub current_password: String,
    #[validate(custom(function = validate_password))]
    pub new_password: String,
}

#[derive(Debug, Deserialize, Validate, utoipa::ToSchema)]
pub struct ForgotPasswordDto {
    #[validate(email(message = "Invalid email format"))]
    pub email: String,
}

#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct UpdateNotificationTokenDto {
    pub notification_token: String,
}

#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct RefreshTokenDto {
    pub refresh_token: String,
}

// ---------------------------------------------------------------------------
// Read models (outputs)
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub struct LoginResponse {
    pub access_token: String,
    pub user: UserPayload,
}

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub struct UserPayload {
    pub id: i32,
    pub email: String,
    pub name: Option<String>,
    pub admin: bool,
    pub notification_token: Option<String>,
}
