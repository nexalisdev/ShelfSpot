use chrono::{Duration, Utc};
use sqlx::PgPool;
use validator::Validate;

use crate::domain::alerts::dto::{CreateAlertDto, UpdateAlertDto};
use crate::domain::alerts::entity::{Alert, MonthlyStatEntry};
use crate::error::{AppError, Result};
use crate::infra::alerts::repository::AlertsRepository;
use crate::infra::email::service::EmailService;
use crate::infra::push::service::PushNotificationService;

pub struct AlertsService;

impl AlertsService {

    pub async fn find_all_paginated(
        db: &PgPool,
        item_id: Option<i32>,
        limit: i64,
        offset: i64,
    ) -> Result<(Vec<Alert>, i64)> {
        AlertsRepository::new(db).find_all_paginated(item_id, limit, offset).await
    }

    pub async fn find_one(db: &PgPool, id: i32) -> Result<Alert> {
        AlertsRepository::new(db).find_one(id).await
    }

    pub async fn create(db: &PgPool, dto: CreateAlertDto) -> Result<Alert> {
        dto.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;
        AlertsRepository::new(db).insert(&dto).await
    }

    pub async fn update(db: &PgPool, id: i32, dto: UpdateAlertDto) -> Result<Alert> {
        dto.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;
        let repo = AlertsRepository::new(db);
        let current = repo.find_one(id).await?;
        repo.update_row(id, &dto, &current).await?;
        repo.find_one(id).await
    }

    pub async fn delete(db: &PgPool, id: i32) -> Result<()> {
        AlertsRepository::new(db).delete(id).await
    }

    pub async fn get_monthly_statistics(db: &PgPool) -> Result<Vec<MonthlyStatEntry>> {
        AlertsRepository::new(db).get_monthly_statistics().await
    }

    /// Check alerts for a specific item after a quantity change (24 h throttle).
    pub async fn check_item_alerts(
        db: &PgPool,
        email_svc: &EmailService,
        push_svc: &PushNotificationService,
        alert_email: Option<&str>,
        item_id: i32,
        quantity: i32,
    ) -> anyhow::Result<()> {
        let repo = AlertsRepository::new(db);
        let alerts = repo.find_active_for_item(item_id).await?;

        let tokens: Vec<String> = sqlx::query_scalar(
            r#"SELECT "notificationToken" FROM "User" WHERE "notificationToken" IS NOT NULL"#,
        )
        .fetch_all(db)
        .await
        .unwrap_or_default();

        let item_name: String =
            sqlx::query_scalar(r#"SELECT name FROM "Item" WHERE id=$1"#)
                .bind(item_id)
                .fetch_one(db)
                .await
                .unwrap_or_else(|_| "Unknown item".to_string());

        for alert in alerts {
            if quantity <= alert.threshold {
                if let Some(last_sent) = alert.last_sent {
                    if Utc::now() - last_sent < Duration::hours(24) {
                        continue;
                    }
                }

                if let Some(email) = alert_email {
                    if let Err(e) = email_svc
                        .send_alert_email(email, &item_name, quantity, alert.threshold)
                        .await
                    {
                        tracing::error!("Failed to send alert email for item {}: {}", item_name, e);
                    }
                }

                if let Err(e) = push_svc
                    .send_notifications(
                        tokens.clone(),
                        "Stock Alert",
                        &format!("{} is running low (qty: {})", item_name, quantity),
                    )
                    .await
                {
                    tracing::error!("Failed to send push notification for item {}: {}", item_name, e);
                }

                if let Err(e) = repo.mark_sent(alert.id).await {
                    tracing::error!("Failed to mark alert {} as sent: {}", alert.id, e);
                }
            }
        }
        Ok(())
    }

    /// Full scan check of all active alerts.
    pub async fn check_all_alerts(
        db: &PgPool,
        email_svc: &EmailService,
        push_svc: &PushNotificationService,
        alert_email: Option<&str>,
    ) -> anyhow::Result<()> {
        let repo = AlertsRepository::new(db);
        let triggered = repo.find_triggered().await?;

        let tokens: Vec<String> = sqlx::query_scalar(
            r#"SELECT "notificationToken" FROM "User" WHERE "notificationToken" IS NOT NULL"#,
        )
        .fetch_all(db)
        .await
        .unwrap_or_default();

        for alert in triggered {
            if let Some(last_sent) = alert.last_sent {
                if Utc::now() - last_sent < Duration::hours(24) {
                    continue;
                }
            }

            if let Some(email) = alert_email {
                if let Err(e) = email_svc
                    .send_alert_email(email, &alert.item_name, alert.quantity, alert.threshold)
                    .await
                {
                    tracing::error!("Failed to send alert email for item {}: {}", alert.item_name, e);
                }
            }

            if let Err(e) = push_svc
                .send_notifications(
                    tokens.clone(),
                    "Stock Alert",
                    &format!("{} is running low (qty: {})", alert.item_name, alert.quantity),
                )
                .await
            {
                tracing::error!("Failed to send push notification for item {}: {}", alert.item_name, e);
            }

            if let Err(e) = repo.mark_sent(alert.id).await {
                tracing::error!("Failed to mark alert {} as sent: {}", alert.id, e);
            }
        }
        Ok(())
    }
}
