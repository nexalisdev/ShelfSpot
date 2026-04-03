//! Command and query objects for the containers domain.

use serde::{Deserialize, Serialize};
use validator::Validate;

// ---------------------------------------------------------------------------
// Commands (inputs)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Deserialize, Validate, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateContainerDto {
    #[validate(length(min = 1, max = 100, message = "Name must be between 1 and 100 characters"))]
    pub name: String,
    pub icon: Option<String>,
    pub room_id: Option<i32>,
    pub place_id: Option<i32>,
}

#[derive(Debug, Clone, Deserialize, Validate, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdateContainerDto {
    #[validate(length(min = 1, max = 100, message = "Name must be between 1 and 100 characters"))]
    pub name: Option<String>,
    pub icon: Option<String>,
    pub room_id: Option<i32>,
    pub place_id: Option<i32>,
}

// ---------------------------------------------------------------------------
// Read models (outputs)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ContainerWithRelations {
    pub id: i32,
    pub name: String,
    pub icon: Option<String>,
    pub room_id: Option<i32>,
    pub place_id: Option<i32>,
    pub room_name: Option<String>,
    pub place_name: Option<String>,
    pub item_count: i64,
}
