use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Favourite {
    pub id: i32,
    pub user_id: i32,
    pub item_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct FavouriteWithItem {
    pub id: i32,
    pub user_id: i32,
    pub item_id: i32,
    pub item_name: String,
    pub item_image: Option<String>,
    pub item_quantity: i32,
    pub item_status: Option<String>,
    pub item_consumable: bool,
    pub item_importance_score: f64,
}
