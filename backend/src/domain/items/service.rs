use sqlx::PgPool;
use validator::Validate;

use crate::domain::items::dto::{CreateItemDto, InventoryValue, StatusStatistics, UpdateItemDto};
use crate::domain::items::entity::ItemWithRelations;
use crate::domain::alerts::service::AlertsService;
use crate::error::{AppError, Result};
use crate::infra::email::service::EmailService;
use crate::infra::items::repository::ItemRepository;
use crate::infra::push::service::PushNotificationService;

pub struct ItemsService;

impl ItemsService {
    // ── Regular items ──────────────────────────────────────────────────────────

    pub async fn find_all(db: &PgPool) -> Result<Vec<ItemWithRelations>> {
        ItemRepository::new(db).find_all().await
    }

    pub async fn find_all_paginated(
        db: &PgPool,
        limit: i64,
        offset: i64,
    ) -> Result<(Vec<ItemWithRelations>, i64)> {
        ItemRepository::new(db).find_all_paginated(limit, offset).await
    }

    pub async fn find_one(db: &PgPool, id: i32) -> Result<ItemWithRelations> {
        ItemRepository::new(db).find_one(id).await
    }

    #[tracing::instrument(skip(db, dto), fields(item_name = %dto.name))]
    pub async fn create(db: &PgPool, dto: CreateItemDto) -> Result<ItemWithRelations> {
        dto.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;
        let repo = ItemRepository::new(db);
        let new_id = repo.insert(&dto, None).await?;
        if let Some(tags) = &dto.tags {
            repo.upsert_tags(new_id, tags).await?;
        }
        repo.find_one(new_id).await
    }

    #[tracing::instrument(skip(db, items), fields(item_count = items.len()))]
    pub async fn bulk_create(
        db: &PgPool,
        items: Vec<CreateItemDto>,
    ) -> Result<Vec<ItemWithRelations>> {
        let mut tx = db.begin().await.map_err(crate::error::AppError::Sqlx)?;
        let mut ids = Vec::with_capacity(items.len());
        let repo = ItemRepository::new(db);

        for dto in &items {
            let id = repo.insert_tx(&mut tx, dto, None).await?;
            if let Some(tags) = &dto.tags {
                repo.upsert_tags_tx(&mut tx, id, tags).await?;
            }
            ids.push(id);
        }

        tx.commit().await.map_err(crate::error::AppError::Sqlx)?;

        let mut results = Vec::with_capacity(ids.len());
        for id in ids {
            results.push(repo.find_one(id).await?);
        }
        Ok(results)
    }

    pub async fn update(db: &PgPool, id: i32, dto: UpdateItemDto) -> Result<ItemWithRelations> {
        dto.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;
        let repo = ItemRepository::new(db);
        let current = repo.find_one(id).await?;
        repo.update_row(id, &dto, &current).await?;
        if let Some(tags) = &dto.tags {
            repo.replace_tags(id, tags).await?;
        }
        repo.find_one(id).await
    }

    pub async fn delete(db: &PgPool, id: i32) -> Result<()> {
        ItemRepository::new(db).delete(id).await
    }

    pub async fn hard_delete(db: &PgPool, id: i32) -> Result<()> {
        ItemRepository::new(db).hard_delete(id).await
    }

    pub async fn search(db: &PgPool, q: &str) -> Result<Vec<ItemWithRelations>> {
        ItemRepository::new(db).search(q).await
    }

    pub async fn get_inventory_value(db: &PgPool) -> Result<InventoryValue> {
        ItemRepository::new(db).get_inventory_value().await
    }

    pub async fn get_status_statistics(db: &PgPool) -> Result<StatusStatistics> {
        ItemRepository::new(db).get_status_statistics().await
    }

    // ── Consumables ────────────────────────────────────────────────────────────

    pub async fn find_all_consumables(db: &PgPool) -> Result<Vec<ItemWithRelations>> {
        ItemRepository::new(db).find_all_consumables().await
    }

    pub async fn find_all_consumables_paginated(
        db: &PgPool,
        limit: i64,
        offset: i64,
    ) -> Result<(Vec<ItemWithRelations>, i64)> {
        ItemRepository::new(db).find_all_consumables_paginated(limit, offset).await
    }

    pub async fn find_one_consumable(db: &PgPool, id: i32) -> Result<ItemWithRelations> {
        ItemRepository::new(db).find_one_consumable(id).await
    }

    pub async fn create_consumable(db: &PgPool, dto: CreateItemDto) -> Result<ItemWithRelations> {
        let repo = ItemRepository::new(db);
        let new_id = repo.insert(&dto, Some(true)).await?;
        if let Some(tags) = &dto.tags {
            repo.upsert_tags(new_id, tags).await?;
        }
        repo.find_one_consumable(new_id).await
    }

    /// Update a consumable item and fire-and-forget alert checks.
    pub async fn update_consumable(
        db: &PgPool,
        id: i32,
        dto: UpdateItemDto,
        email_svc: &EmailService,
        push_svc: &PushNotificationService,
        alert_email: Option<String>,
    ) -> Result<ItemWithRelations> {
        let repo = ItemRepository::new(db);
        let current = repo.find_one_consumable(id).await?;
        repo.update_consumable_row(id, &dto, &current).await?;
        if let Some(tags) = &dto.tags {
            repo.replace_tags(id, tags).await?;
        }
        let updated = repo.find_one_consumable(id).await?;

        // Fire-and-forget alert check after quantity changes
        let db2 = db.clone();
        let email2 = email_svc.clone();
        let push2 = push_svc.clone();
        let new_quantity = updated.quantity;
        tokio::spawn(async move {
            if let Err(e) = AlertsService::check_item_alerts(
                &db2,
                &email2,
                &push2,
                alert_email.as_deref(),
                id,
                new_quantity,
            )
            .await
            {
                tracing::error!("Alert check failed for item {}: {}", id, e);
            }
        });

        Ok(updated)
    }

    pub async fn delete_consumable(db: &PgPool, id: i32) -> Result<()> {
        ItemRepository::new(db).delete_consumable(id).await
    }

    pub async fn get_low_stock(db: &PgPool, threshold: i32) -> Result<Vec<ItemWithRelations>> {
        ItemRepository::new(db).get_low_stock(threshold).await
    }
}

