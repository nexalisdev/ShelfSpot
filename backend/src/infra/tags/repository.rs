use sqlx::PgPool;

use crate::domain::tags::dto::{CreateTagDto, UpdateTagDto};
use crate::domain::tags::entity::Tag;
use crate::error::{AppError, Result};

pub struct TagsRepository<'a>(pub &'a PgPool);

impl<'a> TagsRepository<'a> {
    pub fn new(db: &'a PgPool) -> Self {
        Self(db)
    }

    pub async fn find_all(&self) -> Result<Vec<Tag>> {
        let tags = sqlx::query_as::<_, Tag>(
            r#"SELECT id, name, icon FROM "Tag" ORDER BY name ASC"#,
        )
        .fetch_all(self.0)
        .await?;
        Ok(tags)
    }

    pub async fn find_one(&self, id: i32) -> Result<Tag> {
        let tag = sqlx::query_as::<_, Tag>(r#"SELECT id, name, icon FROM "Tag" WHERE id = $1"#)
            .bind(id)
            .fetch_optional(self.0)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Tag {} not found", id)))?;
        Ok(tag)
    }

    pub async fn insert(&self, dto: &CreateTagDto) -> Result<Tag> {
        sqlx::query_as::<_, Tag>(
            r#"INSERT INTO "Tag"(name, icon) VALUES($1, $2) RETURNING id, name, icon"#,
        )
        .bind(&dto.name)
        .bind(&dto.icon)
        .fetch_one(self.0)
        .await
        .map_err(|e| {
            if let sqlx::Error::Database(ref de) = e {
                if de.code().as_deref() == Some("23505") {
                    return AppError::Conflict("Tag with this name already exists".to_string());
                }
            }
            AppError::Sqlx(e)
        })
    }

    pub async fn update_row(&self, id: i32, dto: &UpdateTagDto, current: &Tag) -> Result<()> {
        let name = dto.name.clone().unwrap_or_else(|| current.name.clone());
        let icon = dto.icon.clone().or_else(|| current.icon.clone());
        sqlx::query(r#"UPDATE "Tag" SET name = $1, icon = $2 WHERE id = $3"#)
            .bind(&name)
            .bind(&icon)
            .bind(id)
            .execute(self.0)
            .await?;
        Ok(())
    }

    pub async fn delete(&self, id: i32) -> Result<()> {
        let result = sqlx::query(r#"DELETE FROM "Tag" WHERE id = $1"#)
            .bind(id)
            .execute(self.0)
            .await?;
        if result.rows_affected() == 0 {
            return Err(AppError::NotFound(format!("Tag {} not found", id)));
        }
        Ok(())
    }
}
