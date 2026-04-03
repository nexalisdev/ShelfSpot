use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Item {
    pub id: i32,
    pub name: String,
    pub quantity: i32,
    pub image: Option<String>,
    pub price: Option<f64>,
    pub sellprice: Option<f64>,
    pub status: Option<String>,
    pub consumable: bool,
    pub place_id: Option<i32>,
    pub room_id: Option<i32>,
    pub container_id: Option<i32>,
    pub item_link: Option<String>,
    pub importance_score: f64,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ItemWithRelations {
    pub id: i32,
    pub name: String,
    pub quantity: i32,
    pub image: Option<String>,
    pub price: Option<f64>,
    pub sellprice: Option<f64>,
    pub status: Option<String>,
    pub consumable: bool,
    pub place_id: Option<i32>,
    pub room_id: Option<i32>,
    pub container_id: Option<i32>,
    pub item_link: Option<String>,
    pub importance_score: f64,
    pub deleted_at: Option<DateTime<Utc>>,
    pub tags: Vec<String>,
    pub room: Option<RoomRef>,
    pub place: Option<PlaceRef>,
    pub container: Option<ContainerRef>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct RoomRef {
    pub id: i32,
    pub name: String,
    pub icon: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PlaceRef {
    pub id: i32,
    pub name: String,
    pub icon: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ContainerRef {
    pub id: i32,
    pub name: String,
    pub icon: Option<String>,
}
