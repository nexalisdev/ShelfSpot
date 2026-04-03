use chrono::{DateTime, Utc};
use serde::Deserialize;
use validator::Validate;

// ── Commands ─────────────────────────────────────────────────────────────────

#[derive(Deserialize, Validate, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateProjectDto {
    #[validate(length(min = 1, max = 100, message = "Name must be between 1 and 100 characters"))]
    pub name: String,
    #[validate(length(max = 500, message = "Description must be at most 500 characters"))]
    pub description: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
}

#[derive(Deserialize, Validate, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProjectDto {
    #[validate(length(min = 1, max = 100, message = "Name must be between 1 and 100 characters"))]
    pub name: Option<String>,
    #[validate(length(max = 500, message = "Description must be at most 500 characters"))]
    pub description: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
}

#[derive(Deserialize, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct AddProjectItemDto {
    pub item_id: i32,
    pub quantity: Option<i32>,
    pub is_active: Option<bool>,
}

#[derive(Deserialize, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProjectItemDto {
    pub quantity: Option<i32>,
    pub is_active: Option<bool>,
}

// Read models (ProjectResponse, ProjectItemResponse) live in entity.rs.
