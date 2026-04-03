//! Command and query objects for the tags domain.

use serde::Deserialize;
use validator::Validate;

#[derive(Debug, Clone, Deserialize, Validate, utoipa::ToSchema)]
pub struct CreateTagDto {
    #[validate(length(min = 1, max = 50, message = "Name must be between 1 and 50 characters"))]
    pub name: String,
    pub icon: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Validate, utoipa::ToSchema)]
pub struct UpdateTagDto {
    #[validate(length(min = 1, max = 50, message = "Name must be between 1 and 50 characters"))]
    pub name: Option<String>,
    pub icon: Option<String>,
}
