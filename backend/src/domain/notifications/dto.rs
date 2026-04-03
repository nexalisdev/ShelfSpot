use serde::Deserialize;

// ── Commands ─────────────────────────────────────────────────────────────────

#[derive(Deserialize, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct SendTestPushDto {
    pub push_token: String,
    pub title: String,
    pub body: String,
}
