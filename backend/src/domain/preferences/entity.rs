use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UserPreferences {
    pub id: i32,
    pub user_id: i32,
    pub show_welcome_header: bool,
    pub show_stats_cards: bool,
    pub show_recent_items: bool,
    pub show_room_distribution: bool,
    pub show_alerts_per_month: bool,
    pub show_inventory_value: bool,
    pub show_status_distribution: bool,
}
