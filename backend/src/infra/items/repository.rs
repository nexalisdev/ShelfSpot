use sqlx::{PgPool, Postgres, Transaction};
use std::collections::HashMap;

use crate::domain::items::dto::{CreateItemDto, InventoryValue, StatusStat, StatusStatistics, UpdateItemDto};
use crate::domain::items::entity::{ContainerRef, ItemWithRelations, PlaceRef, RoomRef};
use crate::error::{AppError, Result};

#[derive(sqlx::FromRow)]
struct ItemRow {
    id: i32,
    name: String,
    quantity: i32,
    image: Option<String>,
    price: Option<f64>,
    sellprice: Option<f64>,
    status: Option<String>,
    consumable: bool,
    place_id: Option<i32>,
    room_id: Option<i32>,
    container_id: Option<i32>,
    item_link: Option<String>,
    importance_score: f64,
    deleted_at: Option<chrono::DateTime<chrono::Utc>>,
    room_id_r: Option<i32>,
    room_name: Option<String>,
    room_icon: Option<String>,
    place_id_p: Option<i32>,
    place_name: Option<String>,
    place_icon: Option<String>,
    container_id_c: Option<i32>,
    container_name: Option<String>,
    container_icon: Option<String>,
}

#[derive(sqlx::FromRow)]
struct ItemTagRow {
    item_id: i32,
    name: String,
}

const BASE_QUERY: &str = r#"
    SELECT
        i.id, i.name, i.quantity, i.image, i.price, i.sellprice, i.status,
        i.consumable, i."placeId" as place_id, i."roomId" as room_id,
        i."containerId" as container_id, i."itemLink" as item_link,
        i."importanceScore" as importance_score, i."deletedAt" as deleted_at,
        r.id as "room_id_r", r.name as "room_name", r.icon as "room_icon",
        p.id as "place_id_p", p.name as "place_name", p.icon as "place_icon",
        c.id as "container_id_c", c.name as "container_name", c.icon as "container_icon"
    FROM "Item" i
    LEFT JOIN "Room" r ON i."roomId" = r.id
    LEFT JOIN "Place" p ON i."placeId" = p.id
    LEFT JOIN "Container" c ON i."containerId" = c.id
"#;

fn row_to_item(row: ItemRow, tags: Vec<String>) -> ItemWithRelations {
    let room = row.room_id_r.map(|id| RoomRef {
        id,
        name: row.room_name.unwrap_or_default(),
        icon: row.room_icon,
    });
    let place = row.place_id_p.map(|id| PlaceRef {
        id,
        name: row.place_name.unwrap_or_default(),
        icon: row.place_icon,
    });
    let container = row.container_id_c.map(|id| ContainerRef {
        id,
        name: row.container_name.unwrap_or_default(),
        icon: row.container_icon,
    });
    ItemWithRelations {
        id: row.id,
        name: row.name,
        quantity: row.quantity,
        image: row.image,
        price: row.price,
        sellprice: row.sellprice,
        status: row.status,
        consumable: row.consumable,
        place_id: row.place_id,
        room_id: row.room_id,
        container_id: row.container_id,
        item_link: row.item_link,
        importance_score: row.importance_score,
        deleted_at: row.deleted_at,
        tags,
        room,
        place,
        container,
    }
}

async fn load_tags_for_ids(db: &PgPool, ids: &[i32]) -> Result<HashMap<i32, Vec<String>>> {
    if ids.is_empty() {
        return Ok(HashMap::new());
    }
    let tag_rows = sqlx::query_as::<_, ItemTagRow>(
        r#"SELECT it."itemId" as item_id, t.name
           FROM "Tag" t
           JOIN "ItemTag" it ON it."tagId" = t.id
           WHERE it."itemId" = ANY($1)"#,
    )
    .bind(ids)
    .fetch_all(db)
    .await?;

    let mut map: HashMap<i32, Vec<String>> = HashMap::new();
    for row in tag_rows {
        map.entry(row.item_id).or_default().push(row.name);
    }
    Ok(map)
}

pub struct ItemRepository<'a>(pub &'a PgPool);

impl<'a> ItemRepository<'a> {
    pub fn new(db: &'a PgPool) -> Self {
        Self(db)
    }

    pub async fn find_all(&self) -> Result<Vec<ItemWithRelations>> {
        let sql = format!("{} WHERE i.\"deletedAt\" IS NULL ORDER BY i.id DESC", BASE_QUERY);
        let rows = sqlx::query_as::<_, ItemRow>(&sql).fetch_all(self.0).await?;
        let ids: Vec<i32> = rows.iter().map(|r| r.id).collect();
        let mut tags_map = load_tags_for_ids(self.0, &ids).await?;
        Ok(rows
            .into_iter()
            .map(|row| {
                let id = row.id;
                let tags = tags_map.remove(&id).unwrap_or_default();
                row_to_item(row, tags)
            })
            .collect())
    }

    pub async fn find_all_paginated(
        &self,
        limit: i64,
        offset: i64,
    ) -> Result<(Vec<ItemWithRelations>, i64)> {
        let total: i64 = sqlx::query_scalar(
            r#"SELECT COUNT(*) FROM "Item" WHERE consumable = false AND "deletedAt" IS NULL"#,
        )
        .fetch_one(self.0)
        .await?;

        let sql = format!(
            "{} WHERE i.consumable = false AND i.\"deletedAt\" IS NULL ORDER BY i.id DESC LIMIT $1 OFFSET $2",
            BASE_QUERY
        );
        let rows = sqlx::query_as::<_, ItemRow>(&sql)
            .bind(limit)
            .bind(offset)
            .fetch_all(self.0)
            .await?;
        let ids: Vec<i32> = rows.iter().map(|r| r.id).collect();
        let mut tags_map = load_tags_for_ids(self.0, &ids).await?;
        let items = rows
            .into_iter()
            .map(|row| {
                let id = row.id;
                let tags = tags_map.remove(&id).unwrap_or_default();
                row_to_item(row, tags)
            })
            .collect();
        Ok((items, total))
    }

    pub async fn find_all_consumables(&self) -> Result<Vec<ItemWithRelations>> {
        let sql = format!("{} WHERE i.consumable = true AND i.\"deletedAt\" IS NULL ORDER BY i.id DESC", BASE_QUERY);
        let rows = sqlx::query_as::<_, ItemRow>(&sql).fetch_all(self.0).await?;
        let ids: Vec<i32> = rows.iter().map(|r| r.id).collect();
        let mut tags_map = load_tags_for_ids(self.0, &ids).await?;
        Ok(rows
            .into_iter()
            .map(|row| {
                let id = row.id;
                let tags = tags_map.remove(&id).unwrap_or_default();
                row_to_item(row, tags)
            })
            .collect())
    }

    pub async fn find_all_consumables_paginated(
        &self,
        limit: i64,
        offset: i64,
    ) -> Result<(Vec<ItemWithRelations>, i64)> {
        let total: i64 = sqlx::query_scalar(
            r#"SELECT COUNT(*) FROM "Item" WHERE consumable = true AND "deletedAt" IS NULL"#,
        )
        .fetch_one(self.0)
        .await?;

        let sql = format!(
            "{} WHERE i.consumable = true AND i.\"deletedAt\" IS NULL ORDER BY i.id DESC LIMIT $1 OFFSET $2",
            BASE_QUERY
        );
        let rows = sqlx::query_as::<_, ItemRow>(&sql)
            .bind(limit)
            .bind(offset)
            .fetch_all(self.0)
            .await?;
        let ids: Vec<i32> = rows.iter().map(|r| r.id).collect();
        let mut tags_map = load_tags_for_ids(self.0, &ids).await?;
        let items = rows
            .into_iter()
            .map(|row| {
                let id = row.id;
                let tags = tags_map.remove(&id).unwrap_or_default();
                row_to_item(row, tags)
            })
            .collect();
        Ok((items, total))
    }

    pub async fn find_one(&self, id: i32) -> Result<ItemWithRelations> {
        let sql = format!("{} WHERE i.id = $1 AND i.\"deletedAt\" IS NULL", BASE_QUERY);
        let row = sqlx::query_as::<_, ItemRow>(&sql)
            .bind(id)
            .fetch_optional(self.0)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Item {} not found", id)))?;
        let tags = sqlx::query_scalar::<_, String>(
            r#"SELECT t.name FROM "Tag" t JOIN "ItemTag" it ON it."tagId" = t.id WHERE it."itemId" = $1"#,
        )
        .bind(id)
        .fetch_all(self.0)
        .await?;
        Ok(row_to_item(row, tags))
    }

    pub async fn find_one_consumable(&self, id: i32) -> Result<ItemWithRelations> {
        let sql = format!("{} WHERE i.id = $1 AND i.consumable = true AND i.\"deletedAt\" IS NULL", BASE_QUERY);
        let row = sqlx::query_as::<_, ItemRow>(&sql)
            .bind(id)
            .fetch_optional(self.0)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Consumable {} not found", id)))?;
        let tags = sqlx::query_scalar::<_, String>(
            r#"SELECT t.name FROM "Tag" t JOIN "ItemTag" it ON it."tagId" = t.id WHERE it."itemId" = $1"#,
        )
        .bind(id)
        .fetch_all(self.0)
        .await?;
        Ok(row_to_item(row, tags))
    }

    pub async fn search(&self, q: &str) -> Result<Vec<ItemWithRelations>> {
        let pattern = format!("%{}%", q);
        let sql = format!("{} WHERE i.name ILIKE $1 AND i.\"deletedAt\" IS NULL ORDER BY i.id DESC", BASE_QUERY);
        let rows = sqlx::query_as::<_, ItemRow>(&sql)
            .bind(&pattern)
            .fetch_all(self.0)
            .await?;
        let ids: Vec<i32> = rows.iter().map(|r| r.id).collect();
        let mut tags_map = load_tags_for_ids(self.0, &ids).await?;
        Ok(rows
            .into_iter()
            .map(|row| {
                let id = row.id;
                let tags = tags_map.remove(&id).unwrap_or_default();
                row_to_item(row, tags)
            })
            .collect())
    }

    pub async fn search_consumable(&self, q: &str) -> Result<Vec<ItemWithRelations>> {
        let pattern = format!("%{}%", q);
        let sql = format!(
            "{} WHERE i.consumable = true AND i.\"deletedAt\" IS NULL AND i.name ILIKE $1 ORDER BY i.id DESC",
            BASE_QUERY
        );
        let rows = sqlx::query_as::<_, ItemRow>(&sql)
            .bind(&pattern)
            .fetch_all(self.0)
            .await?;
        let ids: Vec<i32> = rows.iter().map(|r| r.id).collect();
        let mut tags_map = load_tags_for_ids(self.0, &ids).await?;
        Ok(rows
            .into_iter()
            .map(|row| {
                let id = row.id;
                let tags = tags_map.remove(&id).unwrap_or_default();
                row_to_item(row, tags)
            })
            .collect())
    }

    pub async fn get_low_stock(&self, threshold: i32) -> Result<Vec<ItemWithRelations>> {
        let sql = format!(
            "{} WHERE i.consumable = true AND i.\"deletedAt\" IS NULL AND i.quantity <= $1 ORDER BY i.id DESC",
            BASE_QUERY
        );
        let rows = sqlx::query_as::<_, ItemRow>(&sql)
            .bind(threshold)
            .fetch_all(self.0)
            .await?;
        let ids: Vec<i32> = rows.iter().map(|r| r.id).collect();
        let mut tags_map = load_tags_for_ids(self.0, &ids).await?;
        Ok(rows
            .into_iter()
            .map(|row| {
                let id = row.id;
                let tags = tags_map.remove(&id).unwrap_or_default();
                row_to_item(row, tags)
            })
            .collect())
    }

    pub async fn insert(&self, dto: &CreateItemDto, force_consumable: Option<bool>) -> Result<i32> {
        let consumable = if force_consumable == Some(true) {
            true
        } else {
            dto.consumable.unwrap_or(false)
        };
        let row = sqlx::query_as::<_, (i32,)>(
            r#"INSERT INTO "Item" (name, quantity, image, price, sellprice, status, consumable,
                                   "placeId", "roomId", "containerId", "itemLink")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
               RETURNING id"#,
        )
        .bind(&dto.name)
        .bind(dto.quantity.unwrap_or(1))
        .bind(&dto.image)
        .bind(dto.price)
        .bind(dto.sellprice)
        .bind(&dto.status)
        .bind(consumable)
        .bind(dto.place_id)
        .bind(dto.room_id)
        .bind(dto.container_id)
        .bind(&dto.item_link)
        .fetch_one(self.0)
        .await?;
        Ok(row.0)
    }

    pub async fn update_row(
        &self,
        id: i32,
        dto: &UpdateItemDto,
        current: &ItemWithRelations,
    ) -> Result<()> {
        let name = dto.name.clone().unwrap_or_else(|| current.name.clone());
        let quantity = dto.quantity.unwrap_or(current.quantity);
        let image = dto.image.clone().or_else(|| current.image.clone());
        let price = dto.price.or(current.price);
        let sellprice = dto.sellprice.or(current.sellprice);
        let status = dto.status.clone().or_else(|| current.status.clone());
        let consumable = dto.consumable.unwrap_or(current.consumable);
        let place_id = dto.place_id.or(current.place_id);
        let room_id = dto.room_id.or(current.room_id);
        let container_id = dto.container_id.or(current.container_id);
        let item_link = dto.item_link.clone().or_else(|| current.item_link.clone());
        sqlx::query(
            r#"UPDATE "Item" SET name=$1, quantity=$2, image=$3, price=$4, sellprice=$5,
               status=$6, consumable=$7, "placeId"=$8, "roomId"=$9, "containerId"=$10,
               "itemLink"=$11 WHERE id=$12"#,
        )
        .bind(&name)
        .bind(quantity)
        .bind(&image)
        .bind(price)
        .bind(sellprice)
        .bind(&status)
        .bind(consumable)
        .bind(place_id)
        .bind(room_id)
        .bind(container_id)
        .bind(&item_link)
        .bind(id)
        .execute(self.0)
        .await?;
        Ok(())
    }

    pub async fn update_consumable_row(
        &self,
        id: i32,
        dto: &UpdateItemDto,
        current: &ItemWithRelations,
    ) -> Result<()> {
        let name = dto.name.clone().unwrap_or_else(|| current.name.clone());
        let quantity = dto.quantity.unwrap_or(current.quantity);
        let image = dto.image.clone().or_else(|| current.image.clone());
        let price = dto.price.or(current.price);
        let sellprice = dto.sellprice.or(current.sellprice);
        let status = dto.status.clone().or_else(|| current.status.clone());
        let place_id = dto.place_id.or(current.place_id);
        let room_id = dto.room_id.or(current.room_id);
        let container_id = dto.container_id.or(current.container_id);
        let item_link = dto.item_link.clone().or_else(|| current.item_link.clone());
        sqlx::query(
            r#"UPDATE "Item" SET name=$1, quantity=$2, image=$3, price=$4, sellprice=$5,
               status=$6, "placeId"=$7, "roomId"=$8, "containerId"=$9, "itemLink"=$10
               WHERE id=$11 AND consumable = true"#,
        )
        .bind(&name)
        .bind(quantity)
        .bind(&image)
        .bind(price)
        .bind(sellprice)
        .bind(&status)
        .bind(place_id)
        .bind(room_id)
        .bind(container_id)
        .bind(&item_link)
        .bind(id)
        .execute(self.0)
        .await?;
        Ok(())
    }

    pub async fn delete(&self, id: i32) -> Result<()> {
        let result = sqlx::query(
            r#"UPDATE "Item" SET "deletedAt" = NOW() WHERE id = $1 AND "deletedAt" IS NULL"#,
        )
        .bind(id)
        .execute(self.0)
        .await?;
        if result.rows_affected() == 0 {
            return Err(AppError::NotFound(format!("Item {} not found", id)));
        }
        Ok(())
    }

    pub async fn delete_consumable(&self, id: i32) -> Result<()> {
        let result = sqlx::query(
            r#"UPDATE "Item" SET "deletedAt" = NOW() WHERE id = $1 AND consumable = true AND "deletedAt" IS NULL"#,
        )
        .bind(id)
        .execute(self.0)
        .await?;
        if result.rows_affected() == 0 {
            return Err(AppError::NotFound(format!("Consumable {} not found", id)));
        }
        Ok(())
    }

    pub async fn hard_delete(&self, id: i32) -> Result<()> {
        let result = sqlx::query(r#"DELETE FROM "Item" WHERE id = $1"#)
            .bind(id)
            .execute(self.0)
            .await?;
        if result.rows_affected() == 0 {
            return Err(AppError::NotFound(format!("Item {} not found", id)));
        }
        Ok(())
    }

    pub async fn upsert_tags(&self, item_id: i32, tags: &[String]) -> Result<()> {
        for tag_name in tags {
            let tag_id: i32 = sqlx::query_scalar::<_, i32>(
                r#"INSERT INTO "Tag" (name)
                   VALUES ($1)
                   ON CONFLICT(name) DO UPDATE SET name = EXCLUDED.name
                   RETURNING id"#,
            )
            .bind(tag_name)
            .fetch_one(self.0)
            .await?;
            sqlx::query(
                r#"INSERT INTO "ItemTag" ("itemId", "tagId")
                   VALUES ($1, $2)
                   ON CONFLICT("itemId", "tagId") DO NOTHING"#,
            )
            .bind(item_id)
            .bind(tag_id)
            .execute(self.0)
            .await?;
        }
        Ok(())
    }

    /// Insert an item within an existing transaction, returning the new id.
    pub async fn insert_tx(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        dto: &CreateItemDto,
        force_consumable: Option<bool>,
    ) -> Result<i32> {
        let consumable = if force_consumable == Some(true) {
            true
        } else {
            dto.consumable.unwrap_or(false)
        };
        let row = sqlx::query_as::<_, (i32,)>(
            r#"INSERT INTO "Item" (name, quantity, image, price, sellprice, status, consumable,
                                   "placeId", "roomId", "containerId", "itemLink")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
               RETURNING id"#,
        )
        .bind(&dto.name)
        .bind(dto.quantity.unwrap_or(1))
        .bind(&dto.image)
        .bind(dto.price)
        .bind(dto.sellprice)
        .bind(&dto.status)
        .bind(consumable)
        .bind(dto.place_id)
        .bind(dto.room_id)
        .bind(dto.container_id)
        .bind(&dto.item_link)
        .fetch_one(&mut **tx)
        .await?;
        Ok(row.0)
    }

    /// Upsert tags for an item within an existing transaction.
    pub async fn upsert_tags_tx(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        item_id: i32,
        tags: &[String],
    ) -> Result<()> {
        for tag_name in tags {
            let tag_id: i32 = sqlx::query_scalar::<_, i32>(
                r#"INSERT INTO "Tag" (name)
                   VALUES ($1)
                   ON CONFLICT(name) DO UPDATE SET name = EXCLUDED.name
                   RETURNING id"#,
            )
            .bind(tag_name)
            .fetch_one(&mut **tx)
            .await?;
            sqlx::query(
                r#"INSERT INTO "ItemTag" ("itemId", "tagId")
                   VALUES ($1, $2)
                   ON CONFLICT("itemId", "tagId") DO NOTHING"#,
            )
            .bind(item_id)
            .bind(tag_id)
            .execute(&mut **tx)
            .await?;
        }
        Ok(())
    }

    pub async fn replace_tags(&self, item_id: i32, tags: &[String]) -> Result<()> {
        sqlx::query(r#"DELETE FROM "ItemTag" WHERE "itemId" = $1"#)
            .bind(item_id)
            .execute(self.0)
            .await?;
        self.upsert_tags(item_id, tags).await
    }

    pub async fn get_inventory_value(&self) -> Result<InventoryValue> {
        #[derive(sqlx::FromRow)]
        struct ValueRow {
            total_value: f64,
            items_with_value: i64,
            total_items: i64,
        }
        let row = sqlx::query_as::<_, ValueRow>(
            r#"SELECT COALESCE(SUM(sellprice * quantity), 0) as total_value,
                      COUNT(*) FILTER (WHERE sellprice IS NOT NULL) as items_with_value,
                      COUNT(*) as total_items
               FROM "Item" WHERE "deletedAt" IS NULL"#,
        )
        .fetch_one(self.0)
        .await?;
        Ok(InventoryValue {
            total_value: row.total_value,
            items_with_value: row.items_with_value,
            total_items: row.total_items,
        })
    }

    pub async fn get_status_statistics(&self) -> Result<StatusStatistics> {
        #[derive(sqlx::FromRow)]
        struct StatRow {
            status: Option<String>,
            count: i64,
        }
        let rows = sqlx::query_as::<_, StatRow>(
            r#"SELECT status, COUNT(*) as count FROM "Item" WHERE "deletedAt" IS NULL GROUP BY status ORDER BY count DESC"#,
        )
        .fetch_all(self.0)
        .await?;
        let total: i64 = rows.iter().map(|r| r.count).sum();
        let data = rows
            .into_iter()
            .map(|r| StatusStat { status: r.status, count: r.count })
            .collect();
        Ok(StatusStatistics { data, total })
    }
}
