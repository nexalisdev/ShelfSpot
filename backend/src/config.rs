use anyhow::{Context, Result};

#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub resend_api_key: Option<String>,
    pub resend_from_email: String,
    pub alert_email_recipient: Option<String>,
    pub frontend_url: String,
    pub port: u16,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        Ok(Config {
            database_url: std::env::var("DATABASE_URL")
                .context("DATABASE_URL must be set")?,
            jwt_secret: std::env::var("JWT_SECRET")
                .context("JWT_SECRET must be set")?,
            resend_api_key: std::env::var("RESEND_API_KEY").ok(),
            resend_from_email: std::env::var("RESEND_FROM_EMAIL")
                .unwrap_or_else(|_| "ShelfSpot <noreply@shelfspot.app>".to_string()),
            alert_email_recipient: std::env::var("ALERT_EMAIL_RECIPIENT").ok(),
            frontend_url: std::env::var("FRONTEND_URL")
                .unwrap_or_else(|_| "http://localhost:3000".to_string()),
            port: std::env::var("PORT")
                .unwrap_or_else(|_| "3001".to_string())
                .parse()
                .context("PORT must be a valid number")?,
        })
    }
}
