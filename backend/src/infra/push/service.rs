use reqwest::Client;
use serde_json::json;

#[derive(Clone)]
pub struct PushNotificationService {
    client: Client,
}

impl PushNotificationService {
    pub fn new() -> Self {
        Self { client: Client::new() }
    }

    pub fn is_expo_token(token: &str) -> bool {
        token.starts_with("ExponentPushToken[") || token.starts_with("ExpoPushToken[")
    }

    pub async fn send_notifications(
        &self,
        tokens: Vec<String>,
        title: &str,
        body: &str,
    ) -> anyhow::Result<()> {
        let valid_tokens: Vec<String> = tokens
            .into_iter()
            .filter(|t| Self::is_expo_token(t))
            .collect();

        if valid_tokens.is_empty() {
            return Ok(());
        }

        // Chunk into batches of 100
        for chunk in valid_tokens.chunks(100) {
            let messages: Vec<_> = chunk
                .iter()
                .map(|token| {
                    json!({
                        "to": token,
                        "title": title,
                        "body": body,
                        "sound": "default",
                    })
                })
                .collect();

            let result = self
                .client
                .post("https://exp.host/--/api/v2/push/send")
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .json(&messages)
                .send()
                .await;

            if let Err(e) = result {
                tracing::error!("Failed to send push notifications: {}", e);
            }
        }

        Ok(())
    }
}
