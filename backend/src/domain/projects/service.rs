use sqlx::PgPool;
use validator::Validate;

use crate::domain::projects::dto::{
    AddProjectItemDto, CreateProjectDto, UpdateProjectDto, UpdateProjectItemDto,
};
use crate::domain::projects::entity::{ProjectItemResponse, ProjectResponse};
use crate::domain::scoring::service::ScoringService;
use crate::error::{AppError, Result};
use crate::infra::projects::repository::ProjectsRepository;

pub struct ProjectsService;

impl ProjectsService {
    pub async fn find_all(db: &PgPool) -> Result<Vec<ProjectResponse>> {
        ProjectsRepository::new(db).find_all().await
    }

    pub async fn find_one(db: &PgPool, id: i32) -> Result<ProjectResponse> {
        ProjectsRepository::new(db).find_one(id).await
    }

    pub async fn create(db: &PgPool, dto: CreateProjectDto) -> Result<ProjectResponse> {
        dto.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;
        let repo = ProjectsRepository::new(db);
        let id = repo.insert(&dto).await?;
        repo.find_one(id).await
    }

    pub async fn update(db: &PgPool, id: i32, dto: UpdateProjectDto) -> Result<ProjectResponse> {
        dto.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;
        let repo = ProjectsRepository::new(db);
        let current = repo.find_one(id).await?;

        let name = dto.name.unwrap_or(current.name);
        let description = dto.description.or(current.description);
        let new_status = dto.status.unwrap_or_else(|| current.status.clone());
        let new_priority = dto.priority.unwrap_or_else(|| current.priority.clone());
        let start_date = dto.start_date.or(current.start_date);
        let end_date = dto.end_date.or(current.end_date);

        let status_changed = new_status != current.status;
        let priority_changed = new_priority != current.priority;

        repo.update_row(id, name, description, new_status, new_priority, start_date, end_date)
            .await?;

        if status_changed || priority_changed {
            let item_ids = repo.get_item_ids_for_project(id).await?;
            let db_clone = db.clone();
            tokio::spawn(async move {
                if let Err(e) =
                    ScoringService::recalculate_for_item_ids(&db_clone, item_ids).await
                {
                    tracing::error!("Score recalculation failed: {:?}", e);
                }
            });
        }

        repo.find_one(id).await
    }

    pub async fn delete(db: &PgPool, id: i32) -> Result<()> {
        let repo = ProjectsRepository::new(db);
        repo.find_one(id).await?;
        let item_ids = repo.get_item_ids_for_project(id).await?;
        repo.delete(id).await?;

        if !item_ids.is_empty() {
            let db_clone = db.clone();
            tokio::spawn(async move {
                if let Err(e) =
                    ScoringService::recalculate_for_item_ids(&db_clone, item_ids).await
                {
                    tracing::error!("Score recalculation failed: {:?}", e);
                }
            });
        }
        Ok(())
    }

    pub async fn get_project_items(
        db: &PgPool,
        project_id: i32,
    ) -> Result<Vec<ProjectItemResponse>> {
        let repo = ProjectsRepository::new(db);
        repo.find_one(project_id).await?;
        repo.get_project_items(project_id).await
    }

    pub async fn add_item(
        db: &PgPool,
        project_id: i32,
        dto: AddProjectItemDto,
    ) -> Result<ProjectItemResponse> {
        let repo = ProjectsRepository::new(db);
        repo.find_one(project_id).await?;
        let quantity = dto.quantity.unwrap_or(1);
        let is_active = dto.is_active.unwrap_or(true);
        let pi_id = repo
            .insert_project_item(project_id, dto.item_id, quantity, is_active)
            .await?;

        let item_id = dto.item_id;
        let db_clone = db.clone();
        tokio::spawn(async move {
            if let Err(e) =
                ScoringService::recalculate_for_item_ids(&db_clone, vec![item_id]).await
            {
                tracing::error!("Score recalculation failed: {:?}", e);
            }
        });

        repo.get_project_item_by_id(pi_id).await
    }

    pub async fn update_item(
        db: &PgPool,
        project_id: i32,
        item_id: i32,
        dto: UpdateProjectItemDto,
    ) -> Result<ProjectItemResponse> {
        let repo = ProjectsRepository::new(db);
        let (pi_id, current_quantity, current_is_active) = repo
            .find_project_item(project_id, item_id)
            .await?;

        let new_quantity = dto.quantity.unwrap_or(current_quantity);
        let new_is_active = dto.is_active.unwrap_or(current_is_active);
        let is_active_changed = new_is_active != current_is_active;

        repo.update_project_item(pi_id, new_quantity, new_is_active).await?;

        if is_active_changed {
            let db_clone = db.clone();
            tokio::spawn(async move {
                if let Err(e) =
                    ScoringService::recalculate_for_item_ids(&db_clone, vec![item_id]).await
                {
                    tracing::error!("Score recalculation failed: {:?}", e);
                }
            });
        }

        repo.get_project_item_by_id(pi_id).await
    }

    pub async fn remove_item(db: &PgPool, project_id: i32, item_id: i32) -> Result<()> {
        let repo = ProjectsRepository::new(db);
        repo.delete_project_item(project_id, item_id).await?;

        let db_clone = db.clone();
        tokio::spawn(async move {
            if let Err(e) =
                ScoringService::recalculate_for_item_ids(&db_clone, vec![item_id]).await
            {
                tracing::error!("Score recalculation failed: {:?}", e);
            }
        });
        Ok(())
    }

    pub async fn get_item_score_breakdown(
        db: &PgPool,
        project_id: i32,
    ) -> Result<Vec<serde_json::Value>> {
        let repo = ProjectsRepository::new(db);
        repo.find_one(project_id).await?;
        repo.get_score_breakdown(project_id).await
    }

    pub async fn get_project_statistics(
        db: &PgPool,
        project_id: i32,
    ) -> Result<serde_json::Value> {
        let repo = ProjectsRepository::new(db);
        repo.find_one(project_id).await?;
        repo.get_statistics(project_id).await
    }
}
