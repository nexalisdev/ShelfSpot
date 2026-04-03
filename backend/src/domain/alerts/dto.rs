//! Command and query objects for the alerts domain.

use serde::Deserialize;
use validator::Validate;

// ---------------------------------------------------------------------------
// Commands (inputs)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Deserialize, Validate, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateAlertDto {
    pub item_id: i32,
    #[validate(range(min = 0, message = "Threshold must be non-negative"))]
    pub threshold: i32,
    #[validate(length(max = 100, message = "Name must be at most 100 characters"))]
    pub name: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Validate, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAlertDto {
    #[validate(range(min = 0, message = "Threshold must be non-negative"))]
    pub threshold: Option<i32>,
    #[validate(length(max = 100, message = "Name must be at most 100 characters"))]
    pub name: Option<String>,
    pub is_active: Option<bool>,
}

// ---------------------------------------------------------------------------
// Queries (inputs)
// ---------------------------------------------------------------------------

// #[derive(Debug, Deserialize)]
// pub struct AlertQuery {
//     #[serde(rename = "itemId")]
//     pub item_id: Option<i32>,
// }

#[derive(Debug, Deserialize)]
pub struct TestEmailQuery {
    pub email: Option<String>,
}

// ---------------------------------------------------------------------------
// Shared DTOs used by notifications module
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TestAlertResetDto {
    pub item_id: i32,
    pub quantity: i32,
}

// Read models are defined in entity.rs (Alert, MonthlyStatEntry).
