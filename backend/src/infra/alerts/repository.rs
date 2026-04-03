use sqlx::PgPool;

use crate::domain::alerts::dto::{CreateAlertDto, UpdateAlertDto};
use crate::domain::alerts::entity::{Alert, MonthlyStatEntry};
use crate::error::{AppError, Result};

const ALERT_SELECT: &str = r#"
    SELECT id, "itemId" as item_id, threshold, name,
           "isActive" as is_active, "lastSent" as last_sent,
           "createdAt" as created_at, "updatedAt" as updated_at
    FROM "Alert"
"#;

#[derive(sqlx::FromRow)]
pub struct TriggeredAlert {
    pub id: i32,
    pub threshold: i32,
    pub last_sent: Option<chrono::DateTime<chrono::Utc>>,
    pub item_name: String,
    pub quantity: i32,
}

pub struct AlertsRepository<'a>(pub &'a PgPool);

impl<'a> AlertsRepository<'a> {
    pub fn new(db: &'a PgPool) -> Self {
        Self(db)
    }


    pub async fn find_all_paginated(
        &self,
        item_id: Option<i32>,
        limit: i64,
        offset: i64,
    ) -> Result<(Vec<Alert>, i64)> {
        let total: i64 = if let Some(iid) = item_id {
            sqlx::query_scalar(r#"SELECT COUNT(*) FROM "Alert" WHERE "itemId" = $1"#)
                .bind(iid)
                .fetch_one(self.0)
                .await
                .map_err(AppError::Sqlx)?
        } else {
            sqlx::query_scalar(r#"SELECT COUNT(*) FROM "Alert""#)
                .fetch_one(self.0)
                .await
                .map_err(AppError::Sqlx)?
        };

        let items = if let Some(iid) = item_id {
            sqlx::query_as::<_, Alert>(&format!(
                r#"{} WHERE "itemId" = $1 ORDER BY id DESC LIMIT $2 OFFSET $3"#,
                ALERT_SELECT
            ))
            .bind(iid)
            .bind(limit)
            .bind(offset)
            .fetch_all(self.0)
            .await
            .map_err(AppError::Sqlx)?
        } else {
            sqlx::query_as::<_, Alert>(&format!(
                r#"{} ORDER BY id DESC LIMIT $1 OFFSET $2"#,
                ALERT_SELECT
            ))
            .bind(limit)
            .bind(offset)
            .fetch_all(self.0)
            .await
            .map_err(AppError::Sqlx)?
        };

        Ok((items, total))
    }

    pub async fn find_one(&self, id: i32) -> Result<Alert> {
        sqlx::query_as::<_, Alert>(&format!(r#"{} WHERE id = $1"#, ALERT_SELECT))
            .bind(id)
            .fetch_optional(self.0)
            .await
            .map_err(AppError::Sqlx)?
            .ok_or_else(|| AppError::NotFound("Alert not found".to_string()))
    }

    pub async fn find_active_for_item(&self, item_id: i32) -> Result<Vec<Alert>> {
        sqlx::query_as::<_, Alert>(&format!(
            r#"{} WHERE "itemId" = $1 AND "isActive" = true"#,
            ALERT_SELECT
        ))
        .bind(item_id)
        .fetch_all(self.0)
        .await
        .map_err(AppError::Sqlx)
    }

    pub async fn find_triggered(&self) -> anyhow::Result<Vec<TriggeredAlert>> {
        sqlx::query_as::<_, TriggeredAlert>(
            r#"SELECT a.id, a.threshold, a."lastSent" as last_sent,
                      i.name as item_name, i.quantity
               FROM "Alert" a
               JOIN "Item" i ON a."itemId" = i.id
               WHERE a."isActive" = true AND i.quantity <= a.threshold"#,
        )
        .fetch_all(self.0)
        .await
        .map_err(anyhow::Error::from)
    }

    pub async fn insert(&self, dto: &CreateAlertDto) -> Result<Alert> {
        let id = sqlx::query_scalar::<_, i32>(
            r#"INSERT INTO "Alert"("itemId", threshold, name) VALUES($1, $2, $3) RETURNING id"#,
        )
        .bind(dto.item_id)
        .bind(dto.threshold)
        .bind(&dto.name)
        .fetch_one(self.0)
        .await
        .map_err(|e| {
            if let sqlx::Error::Database(ref de) = e {
                if de.code().as_deref() == Some("23505") {
                    return AppError::Conflict(
                        "Alert already exists for this item and threshold".to_string(),
                    );
                }
            }
            AppError::Sqlx(e)
        })?;
        self.find_one(id).await
    }

    pub async fn update_row(&self, id: i32, dto: &UpdateAlertDto, current: &Alert) -> Result<()> {
        let threshold = dto.threshold.unwrap_or(current.threshold);
        let name = dto.name.clone().or_else(|| current.name.clone());
        let is_active = dto.is_active.unwrap_or(current.is_active);
        sqlx::query(
            r#"UPDATE "Alert" SET threshold=$1, name=$2, "isActive"=$3, "updatedAt"=now() WHERE id=$4"#,
        )
        .bind(threshold)
        .bind(name)
        .bind(is_active)
        .bind(id)
        .execute(self.0)
        .await
        .map_err(AppError::Sqlx)?;
        Ok(())
    }

    pub async fn delete(&self, id: i32) -> Result<()> {
        let result = sqlx::query(r#"DELETE FROM "Alert" WHERE id=$1"#)
            .bind(id)
            .execute(self.0)
            .await
            .map_err(AppError::Sqlx)?;
        if result.rows_affected() == 0 {
            return Err(AppError::NotFound("Alert not found".to_string()));
        }
        Ok(())
    }

    pub async fn mark_sent(&self, alert_id: i32) -> anyhow::Result<()> {
        sqlx::query(
            r#"UPDATE "Alert" SET "lastSent"=now(), "updatedAt"=now() WHERE id=$1"#,
        )
        .bind(alert_id)
        .execute(self.0)
        .await?;
        Ok(())
    }

    pub async fn get_monthly_statistics(&self) -> Result<Vec<MonthlyStatEntry>> {
        #[derive(sqlx::FromRow)]
        struct MonthRow {
            month: String,
            count: i64,
        }
        let rows = sqlx::query_as::<_, MonthRow>(
            r#"SELECT TO_CHAR("createdAt", 'YYYY-MM') as month, COUNT(*) as count
               FROM "Alert"
               WHERE "createdAt" >= NOW() - INTERVAL '12 months'
               GROUP BY month
               ORDER BY month ASC"#,
        )
        .fetch_all(self.0)
        .await
        .map_err(AppError::Sqlx)?;
        Ok(rows
            .into_iter()
            .map(|r| MonthlyStatEntry { month: r.month, count: r.count })
            .collect())
    }
}
