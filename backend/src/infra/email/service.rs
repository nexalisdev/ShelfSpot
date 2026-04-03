use reqwest::Client;
use serde_json::json;

#[derive(Clone)]
pub struct EmailService {
    client: Client,
    api_key: Option<String>,
    from_email: String,
}

impl EmailService {
    pub fn new(api_key: Option<String>, from_email: String) -> Self {
        Self {
            client: Client::new(),
            api_key,
            from_email,
        }
    }

    pub async fn send_alert_email(
        &self,
        to: &str,
        item_name: &str,
        quantity: i32,
        threshold: i32,
    ) -> anyhow::Result<()> {
        let Some(api_key) = &self.api_key else {
            tracing::warn!("RESEND_API_KEY not set, skipping email");
            return Ok(());
        };

        let html = format!(
            r#"<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h2 style="color: #e53e3e;">⚠️ Stock Alert - ShelfSpot</h2>
<p>The following item is running low:</p>
<table style="width:100%; border-collapse: collapse; margin: 20px 0;">
  <tr style="background:#f7fafc">
    <th style="padding:12px; border:1px solid #e2e8f0; text-align:left">Item</th>
    <th style="padding:12px; border:1px solid #e2e8f0; text-align:left">Current Quantity</th>
    <th style="padding:12px; border:1px solid #e2e8f0; text-align:left">Alert Threshold</th>
  </tr>
  <tr>
    <td style="padding:12px; border:1px solid #e2e8f0">{}</td>
    <td style="padding:12px; border:1px solid #e2e8f0; color:#e53e3e">{}</td>
    <td style="padding:12px; border:1px solid #e2e8f0">{}</td>
  </tr>
</table>
<p style="color: #718096; font-size: 14px;">This is an automated alert from ShelfSpot inventory management.</p>
</body>
</html>"#,
            item_name, quantity, threshold
        );

        self.client
            .post("https://api.resend.com/emails")
            .header("Authorization", format!("Bearer {}", api_key))
            .json(&json!({
                "from": self.from_email,
                "to": [to],
                "subject": format!("Stock Alert: {} is running low (qty: {})", item_name, quantity),
                "html": html,
            }))
            .send()
            .await?
            .error_for_status()?;

        Ok(())
    }

    pub async fn send_temp_password_email(
        &self,
        to: &str,
        temp_password: &str,
    ) -> anyhow::Result<()> {
        let Some(api_key) = &self.api_key else {
            tracing::warn!("RESEND_API_KEY not set, skipping email");
            return Ok(());
        };

        let html = format!(
            r#"<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h2>🔐 Password Reset - ShelfSpot</h2>
<p>Your temporary password is:</p>
<p style="font-size: 24px; font-weight: bold; background: #f7fafc; padding: 16px; border-radius: 8px; letter-spacing: 4px;">{}</p>
<p>Please log in and change your password immediately.</p>
</body>
</html>"#,
            temp_password
        );

        self.client
            .post("https://api.resend.com/emails")
            .header("Authorization", format!("Bearer {}", api_key))
            .json(&json!({
                "from": self.from_email,
                "to": [to],
                "subject": "Your ShelfSpot temporary password",
                "html": html,
            }))
            .send()
            .await?
            .error_for_status()?;

        Ok(())
    }
}
