use chrono::{DateTime, Utc};
use sqlx::PgPool;

use crate::domain::projects::dto::CreateProjectDto;
use crate::domain::projects::entity::{ProjectItemResponse, ProjectResponse};
use crate::domain::scoring::service::ScoringService;
use crate::error::{AppError, Result};

pub struct ProjectsRepository<'a>(pub &'a PgPool);

impl<'a> ProjectsRepository<'a> {
    pub fn new(db: &'a PgPool) -> Self {
        Self(db)
    }

    pub async fn find_all(&self) -> Result<Vec<ProjectResponse>> {
        sqlx::query_as::<_, ProjectResponse>(
            r#"SELECT p.id, p.name, p.description,
                      p.status::text as status, p.priority::text as priority,
                      p."startDate" as start_date, p."endDate" as end_date,
                      p."createdAt" as created_at, p."updatedAt" as updated_at,
                      COUNT(pi.id) as item_count
               FROM "Project" p
               LEFT JOIN "ProjectItem" pi ON pi."projectId" = p.id
               GROUP BY p.id
               ORDER BY p."createdAt" DESC"#,
        )
        .fetch_all(self.0)
        .await
        .map_err(AppError::Sqlx)
    }

    pub async fn find_one(&self, id: i32) -> Result<ProjectResponse> {
        sqlx::query_as::<_, ProjectResponse>(
            r#"SELECT p.id, p.name, p.description,
                      p.status::text as status, p.priority::text as priority,
                      p."startDate" as start_date, p."endDate" as end_date,
                      p."createdAt" as created_at, p."updatedAt" as updated_at,
                      COUNT(pi.id) as item_count
               FROM "Project" p
               LEFT JOIN "ProjectItem" pi ON pi."projectId" = p.id
               WHERE p.id = $1
               GROUP BY p.id"#,
        )
        .bind(id)
        .fetch_optional(self.0)
        .await
        .map_err(AppError::Sqlx)?
        .ok_or_else(|| AppError::NotFound(format!("Project {} not found", id)))
    }

    pub async fn insert(&self, dto: &CreateProjectDto) -> Result<i32> {
        let status = dto.status.clone().unwrap_or_else(|| "ACTIVE".to_string());
        let priority = dto.priority.clone().unwrap_or_else(|| "MEDIUM".to_string());
        sqlx::query_scalar(
            r#"INSERT INTO "Project"(name, description, status, priority, "startDate", "endDate")
               VALUES($1, $2, $3::"ProjectStatus", $4::"ProjectPriority", $5, $6)
               RETURNING id"#,
        )
        .bind(&dto.name)
        .bind(&dto.description)
        .bind(&status)
        .bind(&priority)
        .bind(dto.start_date)
        .bind(dto.end_date)
        .fetch_one(self.0)
        .await
        .map_err(AppError::Sqlx)
    }

    pub async fn update_row(
        &self,
        id: i32,
        name: String,
        description: Option<String>,
        status: String,
        priority: String,
        start_date: Option<DateTime<Utc>>,
        end_date: Option<DateTime<Utc>>,
    ) -> Result<()> {
        sqlx::query(
            r#"UPDATE "Project"
               SET name=$1, description=$2, status=$3::"ProjectStatus", priority=$4::"ProjectPriority",
                   "startDate"=$5, "endDate"=$6, "updatedAt"=now()
               WHERE id=$7"#,
        )
        .bind(&name)
        .bind(&description)
        .bind(&status)
        .bind(&priority)
        .bind(start_date)
        .bind(end_date)
        .bind(id)
        .execute(self.0)
        .await
        .map_err(AppError::Sqlx)?;
        Ok(())
    }

    pub async fn delete(&self, id: i32) -> Result<()> {
        sqlx::query(r#"DELETE FROM "Project" WHERE id = $1"#)
            .bind(id)
            .execute(self.0)
            .await
            .map_err(AppError::Sqlx)?;
        Ok(())
    }

    pub async fn get_item_ids_for_project(&self, project_id: i32) -> Result<Vec<i32>> {
        sqlx::query_scalar(r#"SELECT "itemId" FROM "ProjectItem" WHERE "projectId" = $1"#)
            .bind(project_id)
            .fetch_all(self.0)
            .await
            .map_err(AppError::Sqlx)
    }

    pub async fn get_project_items(
        &self,
        project_id: i32,
    ) -> Result<Vec<ProjectItemResponse>> {
        sqlx::query_as::<_, ProjectItemResponse>(
            r#"SELECT pi.id, pi."projectId" as project_id, pi."itemId" as item_id,
                      pi.quantity, pi."isActive" as is_active,
                      pi."createdAt" as created_at, pi."updatedAt" as updated_at,
                      i.name as item_name, i.quantity as item_quantity,
                      i."importanceScore" as item_importance_score
               FROM "ProjectItem" pi
               JOIN "Item" i ON pi."itemId" = i.id
               WHERE pi."projectId" = $1
               ORDER BY pi.id"#,
        )
        .bind(project_id)
        .fetch_all(self.0)
        .await
        .map_err(AppError::Sqlx)
    }

    pub async fn get_project_item_by_id(&self, pi_id: i32) -> Result<ProjectItemResponse> {
        sqlx::query_as::<_, ProjectItemResponse>(
            r#"SELECT pi.id, pi."projectId" as project_id, pi."itemId" as item_id,
                      pi.quantity, pi."isActive" as is_active,
                      pi."createdAt" as created_at, pi."updatedAt" as updated_at,
                      i.name as item_name, i.quantity as item_quantity,
                      i."importanceScore" as item_importance_score
               FROM "ProjectItem" pi
               JOIN "Item" i ON pi."itemId" = i.id
               WHERE pi.id = $1"#,
        )
        .bind(pi_id)
        .fetch_optional(self.0)
        .await
        .map_err(AppError::Sqlx)?
        .ok_or_else(|| AppError::NotFound("Project item not found".to_string()))
    }

    pub async fn insert_project_item(
        &self,
        project_id: i32,
        item_id: i32,
        quantity: i32,
        is_active: bool,
    ) -> Result<i32> {
        sqlx::query_scalar(
            r#"INSERT INTO "ProjectItem"("projectId", "itemId", quantity, "isActive")
               VALUES($1, $2, $3, $4)
               RETURNING id"#,
        )
        .bind(project_id)
        .bind(item_id)
        .bind(quantity)
        .bind(is_active)
        .fetch_one(self.0)
        .await
        .map_err(AppError::Sqlx)
    }

    pub async fn find_project_item(
        &self,
        project_id: i32,
        item_id: i32,
    ) -> Result<(i32, i32, bool)> {
        sqlx::query_as::<_, (i32, i32, bool)>(
            r#"SELECT id, quantity, "isActive" FROM "ProjectItem" WHERE "projectId" = $1 AND "itemId" = $2"#,
        )
        .bind(project_id)
        .bind(item_id)
        .fetch_optional(self.0)
        .await
        .map_err(AppError::Sqlx)?
        .ok_or_else(|| AppError::NotFound("Project item not found".to_string()))
    }

    pub async fn update_project_item(
        &self,
        pi_id: i32,
        quantity: i32,
        is_active: bool,
    ) -> Result<()> {
        sqlx::query(
            r#"UPDATE "ProjectItem" SET quantity=$1, "isActive"=$2, "updatedAt"=now() WHERE id=$3"#,
        )
        .bind(quantity)
        .bind(is_active)
        .bind(pi_id)
        .execute(self.0)
        .await
        .map_err(AppError::Sqlx)?;
        Ok(())
    }

    pub async fn delete_project_item(&self, project_id: i32, item_id: i32) -> Result<()> {
        let result = sqlx::query(
            r#"DELETE FROM "ProjectItem" WHERE "projectId" = $1 AND "itemId" = $2"#,
        )
        .bind(project_id)
        .bind(item_id)
        .execute(self.0)
        .await
        .map_err(AppError::Sqlx)?;
        if result.rows_affected() == 0 {
            return Err(AppError::NotFound("Project item not found".to_string()));
        }
        Ok(())
    }

    pub async fn get_score_breakdown(
        &self,
        project_id: i32,
    ) -> Result<Vec<serde_json::Value>> {
        #[derive(sqlx::FromRow)]
        struct BreakdownRow {
            item_id: i32,
            item_name: String,
            is_active: bool,
            status_str: String,
            priority_str: String,
            item_importance_score: f64,
        }

        let rows = sqlx::query_as::<_, BreakdownRow>(
            r#"SELECT pi."itemId" as item_id, i.name as item_name, pi."isActive" as is_active,
                      p.status::text as status_str, p.priority::text as priority_str,
                      i."importanceScore" as item_importance_score
               FROM "ProjectItem" pi
               JOIN "Item" i ON pi."itemId" = i.id
               JOIN "Project" p ON pi."projectId" = p.id
               WHERE pi."projectId" = $1
               ORDER BY pi.id"#,
        )
        .bind(project_id)
        .fetch_all(self.0)
        .await
        .map_err(AppError::Sqlx)?;

        Ok(rows
            .iter()
            .map(|r| {
                let base = ScoringService::status_score_pub(&r.status_str);
                let mult = ScoringService::priority_multiplier_pub(&r.priority_str);
                let contribution = if r.is_active { base * mult } else { 0.0 };
                serde_json::json!({
                    "itemId": r.item_id,
                    "itemName": r.item_name,
                    "isActive": r.is_active,
                    "status": r.status_str,
                    "priority": r.priority_str,
                    "contribution": contribution,
                    "currentImportanceScore": r.item_importance_score,
                })
            })
            .collect())
    }

    pub async fn get_statistics(&self, project_id: i32) -> Result<serde_json::Value> {
        #[derive(sqlx::FromRow)]
        struct ProjStats {
            total_items: i64,
            active_items: i64,
            total_score: Option<f64>,
        }
        let stats = sqlx::query_as::<_, ProjStats>(
            r#"SELECT COUNT(*) as total_items,
                      COUNT(*) FILTER (WHERE pi."isActive") as active_items,
                      SUM(i."importanceScore") as total_score
               FROM "ProjectItem" pi
               JOIN "Item" i ON pi."itemId" = i.id
               WHERE pi."projectId" = $1"#,
        )
        .bind(project_id)
        .fetch_one(self.0)
        .await
        .map_err(AppError::Sqlx)?;

        Ok(serde_json::json!({
            "projectId": project_id,
            "totalItems": stats.total_items,
            "activeItems": stats.active_items,
            "totalScore": stats.total_score.unwrap_or(0.0),
        }))
    }
}
