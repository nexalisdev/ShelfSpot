use serde::Deserialize;

// ── Commands ─────────────────────────────────────────────────────────────────

#[derive(Deserialize, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct AddFavouriteDto {
    pub item_id: i32,
}

// ── Queries ───────────────────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct FavouriteQuery {
    pub user_id: Option<i32>, // admin only
}

// Read model FavouriteWithItem lives in entity.rs.
