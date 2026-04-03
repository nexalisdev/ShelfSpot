use serde::Deserialize;

// ── Commands ─────────────────────────────────────────────────────────────────

#[derive(Deserialize, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePreferencesDto {
    pub show_welcome_header: Option<bool>,
    pub show_stats_cards: Option<bool>,
    pub show_recent_items: Option<bool>,
    pub show_room_distribution: Option<bool>,
    pub show_alerts_per_month: Option<bool>,
    pub show_inventory_value: Option<bool>,
    pub show_status_distribution: Option<bool>,
}
