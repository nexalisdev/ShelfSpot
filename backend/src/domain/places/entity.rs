use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Place {
    pub id: i32,
    pub name: String,
    pub icon: Option<String>,
    pub room_id: Option<i32>,
}
