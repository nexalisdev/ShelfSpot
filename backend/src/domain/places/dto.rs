//! Command and query objects for the places domain.

use serde::Deserialize;
use validator::Validate;

#[derive(Debug, Clone, Deserialize, Validate, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreatePlaceDto {
    #[validate(length(min = 1, max = 100, message = "Name must be between 1 and 100 characters"))]
    pub name: String,
    pub icon: Option<String>,
    pub room_id: Option<i32>,
}

#[derive(Debug, Clone, Deserialize, Validate, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePlaceDto {
    #[validate(length(min = 1, max = 100, message = "Name must be between 1 and 100 characters"))]
    pub name: Option<String>,
    pub icon: Option<String>,
    pub room_id: Option<i32>,
}
