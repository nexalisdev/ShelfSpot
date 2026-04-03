//! Command and query objects for the rooms domain.

use serde::{Deserialize, Serialize};
use validator::Validate;

// ---------------------------------------------------------------------------
// Commands (inputs)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Deserialize, Validate, utoipa::ToSchema)]
pub struct CreateRoomDto {
    #[validate(length(min = 1, max = 100, message = "Name must be between 1 and 100 characters"))]
    pub name: String,
    #[validate(length(max = 50, message = "Icon must be at most 50 characters"))]
    pub icon: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Validate, utoipa::ToSchema)]
pub struct UpdateRoomDto {
    #[validate(length(min = 1, max = 100, message = "Name must be between 1 and 100 characters"))]
    pub name: Option<String>,
    #[validate(length(max = 50, message = "Icon must be at most 50 characters"))]
    pub icon: Option<String>,
}

// ---------------------------------------------------------------------------
// Read models (outputs)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, sqlx::FromRow, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct RoomWithDetails {
    pub id: i32,
    pub name: String,
    pub icon: Option<String>,
    pub item_count: i64,
}
