pub mod admin;
pub mod alerts;
pub mod auth;
pub mod consumables;
pub mod containers;
pub mod favourites;
pub mod items;
pub mod notifications;
pub mod places;
pub mod preferences;
pub mod projects;
pub mod rooms;
pub mod scoring;
pub mod tags;

use serde::{Deserialize, Serialize};
use utoipa::IntoParams;

#[derive(Debug, Deserialize, IntoParams)]
pub struct PaginationQuery {
    /// Page number (1-indexed). Defaults to 1.
    pub page: Option<i64>,
    /// Items per page (max 200). Defaults to 50.
    pub limit: Option<i64>,
}

impl PaginationQuery {
    pub fn offset(&self) -> i64 {
        let page = self.page.unwrap_or(1).max(1);
        (page - 1) * self.limit()
    }

    pub fn limit(&self) -> i64 {
        self.limit.unwrap_or(50).min(200).max(1)
    }

    pub fn page(&self) -> i64 {
        self.page.unwrap_or(1).max(1)
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginatedResponse<T: Serialize> {
    pub data: Vec<T>,
    pub total: i64,
    pub page: i64,
    pub limit: i64,
    pub total_pages: i64,
}

impl<T: Serialize> PaginatedResponse<T> {
    pub fn new(data: Vec<T>, total: i64, pagination: &PaginationQuery) -> Self {
        let limit = pagination.limit();
        let page = pagination.page();
        let total_pages = if limit == 0 { 0 } else { (total + limit - 1) / limit };
        Self { data, total, page, limit, total_pages }
    }
}
