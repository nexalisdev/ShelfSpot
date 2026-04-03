use sqlx::PgPool;

use crate::error::{AppError, Result};

#[derive(sqlx::FromRow)]
pub struct ItemProjectRow {
    pub item_id: i32,
    pub status_str: String,
    pub priority_str: String,
    pub is_active: bool,
}

#[derive(sqlx::FromRow)]
pub struct TopItemRow {
    pub id: i32,
    pub name: String,
    pub quantity: i32,
    pub importance_score: f64,
}

#[derive(sqlx::FromRow)]
pub struct ScoreStatsRow {
    pub total_items: i64,
    pub items_with_score: i64,
    pub avg_score: Option<f64>,
    pub max_score: Option<f64>,
}

pub struct ScoringRepository<'a>(pub &'a PgPool);

impl<'a> ScoringRepository<'a> {
    pub fn new(db: &'a PgPool) -> Self {
        Self(db)
    }

    pub async fn fetch_all_item_project_rows(&self) -> anyhow::Result<Vec<ItemProjectRow>> {
        sqlx::query_as::<_, ItemProjectRow>(
            r#"SELECT pi."itemId" as item_id,
                      p.status::text as status_str,
                      p.priority::text as priority_str,
                      pi."isActive" as is_active
               FROM "ProjectItem" pi
               JOIN "Project" p ON pi."projectId" = p.id"#,
        )
        .fetch_all(self.0)
        .await
        .map_err(anyhow::Error::from)
    }

    pub async fn fetch_item_project_rows_for_ids(
        &self,
        item_ids: &[i32],
    ) -> anyhow::Result<Vec<ItemProjectRow>> {
        sqlx::query_as::<_, ItemProjectRow>(
            r#"SELECT pi."itemId" as item_id,
                      p.status::text as status_str,
                      p.priority::text as priority_str,
                      pi."isActive" as is_active
               FROM "ProjectItem" pi
               JOIN "Project" p ON pi."projectId" = p.id
               WHERE pi."itemId" = ANY($1)"#,
        )
        .bind(item_ids)
        .fetch_all(self.0)
        .await
        .map_err(anyhow::Error::from)
    }

    pub async fn fetch_top_items(&self) -> Result<Vec<TopItemRow>> {
        sqlx::query_as::<_, TopItemRow>(
            r#"SELECT id, name, quantity, "importanceScore" as importance_score
               FROM "Item"
               WHERE "importanceScore" > 0
               ORDER BY "importanceScore" DESC
               LIMIT 20"#,
        )
        .fetch_all(self.0)
        .await
        .map_err(AppError::Sqlx)
    }

    pub async fn fetch_critical_items(&self) -> Result<Vec<TopItemRow>> {
        sqlx::query_as::<_, TopItemRow>(
            r#"SELECT id, name, quantity, "importanceScore" as importance_score
               FROM "Item"
               WHERE quantity <= 5 AND "importanceScore" > 0
               ORDER BY ("importanceScore" / NULLIF(quantity, 0)) DESC NULLS LAST"#,
        )
        .fetch_all(self.0)
        .await
        .map_err(AppError::Sqlx)
    }

    pub async fn fetch_score_statistics(&self) -> Result<ScoreStatsRow> {
        sqlx::query_as::<_, ScoreStatsRow>(
            r#"SELECT COUNT(*) as total_items,
                      COUNT(*) FILTER (WHERE "importanceScore" > 0) as items_with_score,
                      AVG("importanceScore") FILTER (WHERE "importanceScore" > 0) as avg_score,
                      MAX("importanceScore") as max_score
               FROM "Item""#,
        )
        .fetch_one(self.0)
        .await
        .map_err(AppError::Sqlx)
    }

    pub async fn reset_all_scores(&self) -> anyhow::Result<()> {
        sqlx::query(r#"UPDATE "Item" SET "importanceScore" = 0"#)
            .execute(self.0)
            .await?;
        Ok(())
    }

    pub async fn reset_scores_for_ids(&self, item_ids: &[i32]) -> anyhow::Result<()> {
        sqlx::query(r#"UPDATE "Item" SET "importanceScore" = 0 WHERE id = ANY($1)"#)
            .bind(item_ids)
            .execute(self.0)
            .await?;
        Ok(())
    }

    pub async fn set_score(&self, item_id: i32, score: f64) -> anyhow::Result<()> {
        sqlx::query(r#"UPDATE "Item" SET "importanceScore" = $1 WHERE id = $2"#)
            .bind(score)
            .bind(item_id)
            .execute(self.0)
            .await?;
        Ok(())
    }
}
