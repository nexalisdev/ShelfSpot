use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: i32,
    pub email: String,
    #[serde(skip_serializing)]
    pub password: String,
    pub name: Option<String>,
    pub admin: bool,
    pub notification_token: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct SafeUser {
    pub id: i32,
    pub email: String,
    pub name: Option<String>,
    pub admin: bool,
    pub notification_token: Option<String>,
    pub created_at: DateTime<Utc>,
}
