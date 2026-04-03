use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "ProjectStatus", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ProjectStatus {
    Active,
    Completed,
    Paused,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "ProjectPriority", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ProjectPriority {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
    pub status: ProjectStatus,
    pub priority: ProjectPriority,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ProjectItem {
    pub id: i32,
    pub project_id: i32,
    pub item_id: i32,
    pub quantity: i32,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ProjectResponse {
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: String,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub item_count: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ProjectItemResponse {
    pub id: i32,
    pub project_id: i32,
    pub item_id: i32,
    pub quantity: i32,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub item_name: Option<String>,
    pub item_quantity: Option<i32>,
    pub item_importance_score: Option<f64>,
}
