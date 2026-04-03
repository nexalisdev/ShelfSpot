use sqlx::PgPool;

use crate::domain::favourites::entity::FavouriteWithItem;
use crate::error::{AppError, Result};

const FAVOURITE_JOIN_QUERY: &str = r#"
    SELECT f.id, f."userId" as user_id, f."itemId" as item_id,
           i.name as item_name, i.image as item_image, i.quantity as item_quantity,
           i.status as item_status, i.consumable as item_consumable,
           i."importanceScore" as item_importance_score
    FROM "Favourite" f
    JOIN "Item" i ON f."itemId" = i.id
"#;

pub struct FavouritesRepository<'a>(pub &'a PgPool);

impl<'a> FavouritesRepository<'a> {
    pub fn new(db: &'a PgPool) -> Self {
        Self(db)
    }

    pub async fn find_by_user(&self, user_id: i32) -> Result<Vec<FavouriteWithItem>> {
        sqlx::query_as::<_, FavouriteWithItem>(&format!(
            r#"{} WHERE f."userId" = $1 ORDER BY f.id DESC"#,
            FAVOURITE_JOIN_QUERY
        ))
        .bind(user_id)
        .fetch_all(self.0)
        .await
        .map_err(AppError::Sqlx)
    }

    pub async fn find_one(&self, favourite_id: i32) -> Result<FavouriteWithItem> {
        sqlx::query_as::<_, FavouriteWithItem>(&format!(
            r#"{} WHERE f.id = $1"#,
            FAVOURITE_JOIN_QUERY
        ))
        .bind(favourite_id)
        .fetch_optional(self.0)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Favourite {} not found", favourite_id)))
    }

    pub async fn insert(&self, user_id: i32, item_id: i32) -> Result<FavouriteWithItem> {
        sqlx::query_scalar::<_, i32>(r#"SELECT id FROM "Item" WHERE id = $1"#)
            .bind(item_id)
            .fetch_optional(self.0)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Item {} not found", item_id)))?;

        let new_id = sqlx::query_scalar::<_, i32>(
            r#"INSERT INTO "Favourite"("userId", "itemId") VALUES($1, $2) RETURNING id"#,
        )
        .bind(user_id)
        .bind(item_id)
        .fetch_one(self.0)
        .await
        .map_err(|e| {
            if let sqlx::Error::Database(ref de) = e {
                if de.code().as_deref() == Some("23505") {
                    return AppError::Conflict("Item is already in favourites".to_string());
                }
            }
            AppError::Sqlx(e)
        })?;

        self.find_one(new_id).await
    }

    pub async fn delete_by_id(&self, user_id: i32, favourite_id: i32) -> Result<()> {
        let result =
            sqlx::query(r#"DELETE FROM "Favourite" WHERE id = $1 AND "userId" = $2"#)
                .bind(favourite_id)
                .bind(user_id)
                .execute(self.0)
                .await?;
        if result.rows_affected() == 0 {
            return Err(AppError::NotFound(format!(
                "Favourite {} not found",
                favourite_id
            )));
        }
        Ok(())
    }

    pub async fn delete_by_item_id(&self, user_id: i32, item_id: i32) -> Result<()> {
        let result =
            sqlx::query(r#"DELETE FROM "Favourite" WHERE "userId" = $1 AND "itemId" = $2"#)
                .bind(user_id)
                .bind(item_id)
                .execute(self.0)
                .await?;
        if result.rows_affected() == 0 {
            return Err(AppError::NotFound(format!(
                "Favourite for item {} not found",
                item_id
            )));
        }
        Ok(())
    }
}
