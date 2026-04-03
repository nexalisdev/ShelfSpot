use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Container {
    pub id: i32,
    pub name: String,
    pub icon: Option<String>,
    pub room_id: Option<i32>,
    pub place_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, utoipa::ToSchema)]
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
