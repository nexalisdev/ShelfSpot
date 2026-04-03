use serde::Deserialize;

// ── Commands ─────────────────────────────────────────────────────────────────

#[derive(Deserialize, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateUserDto {
    pub email: String,
    pub password: String,
    pub name: Option<String>,
    pub admin: Option<bool>,
}

#[derive(Deserialize, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUserDto {
    pub email: Option<String>,
    pub name: Option<String>,
    pub admin: Option<bool>,
    pub notification_token: Option<String>,
}
