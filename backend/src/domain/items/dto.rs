//! Command and query objects for the items domain.

use serde::{Deserialize, Serialize};
use validator::{Validate, ValidationError};

fn validate_status(status: &str) -> Result<(), ValidationError> {
    match status {
        "active" | "inactive" | "archived" => Ok(()),
        _ => Err(ValidationError::new("invalid_status")),
    }
}

fn validate_tags(tags: &[String]) -> Result<(), ValidationError> {
    if tags.len() > 20 {
        return Err(ValidationError::new("too_many_tags"));
    }
    for tag in tags {
        if tag.len() > 50 {
            return Err(ValidationError::new("tag_too_long"));
        }
    }
    Ok(())
}

// ---------------------------------------------------------------------------
// Commands (inputs)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Deserialize, Validate, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateItemDto {
    #[validate(length(min = 1, max = 255, message = "Name must be between 1 and 255 characters"))]
    pub name: String,
    #[validate(range(min = 0, message = "Quantity must be non-negative"))]
    pub quantity: Option<i32>,
    pub image: Option<String>,
    #[validate(range(min = 0.0, message = "Price must be non-negative"))]
    pub price: Option<f64>,
    #[validate(range(min = 0.0, message = "Sell price must be non-negative"))]
    pub sellprice: Option<f64>,
    #[validate(custom(function = validate_status))]
    pub status: Option<String>,
    pub consumable: Option<bool>,
    pub place_id: Option<i32>,
    pub room_id: Option<i32>,
    pub container_id: Option<i32>,
    #[validate(url(message = "Item link must be a valid URL"))]
    pub item_link: Option<String>,
    #[validate(custom(function = validate_tags))]
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, Deserialize, Validate, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdateItemDto {
    #[validate(length(min = 1, max = 255, message = "Name must be between 1 and 255 characters"))]
    pub name: Option<String>,
    #[validate(range(min = 0, message = "Quantity must be non-negative"))]
    pub quantity: Option<i32>,
    pub image: Option<String>,
    #[validate(range(min = 0.0, message = "Price must be non-negative"))]
    pub price: Option<f64>,
    #[validate(range(min = 0.0, message = "Sell price must be non-negative"))]
    pub sellprice: Option<f64>,
    #[validate(custom(function = validate_status))]
    pub status: Option<String>,
    pub consumable: Option<bool>,
    pub place_id: Option<i32>,
    pub room_id: Option<i32>,
    pub container_id: Option<i32>,
    #[validate(url(message = "Item link must be a valid URL"))]
    pub item_link: Option<String>,
    #[validate(custom(function = validate_tags))]
    pub tags: Option<Vec<String>>,
}

// ---------------------------------------------------------------------------
// Queries (inputs)
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    pub q: Option<String>,
}

// ---------------------------------------------------------------------------
// Read models (outputs)
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct InventoryValue {
    pub total_value: f64,
    pub items_with_value: i64,
    pub total_items: i64,
}

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub struct StatusStat {
    pub status: Option<String>,
    pub count: i64,
}

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub struct StatusStatistics {
    pub data: Vec<StatusStat>,
    pub total: i64,
}
