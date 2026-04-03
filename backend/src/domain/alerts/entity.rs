use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Alert {
    pub id: i32,
    pub item_id: i32,
    pub threshold: i32,
    pub name: Option<String>,
    pub is_active: bool,
    pub last_sent: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, utoipa::ToSchema)]
pub struct MonthlyStatEntry {
    pub month: String,
    pub count: i64,
}
