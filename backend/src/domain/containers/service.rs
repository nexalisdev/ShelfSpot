use sqlx::PgPool;
use validator::Validate;

use crate::domain::containers::dto::{CreateContainerDto, UpdateContainerDto};
use crate::domain::containers::entity::ContainerWithRelations;
use crate::error::{AppError, Result};
use crate::infra::containers::repository::ContainersRepository;

pub struct ContainersService;

impl ContainersService {
    pub async fn find_all(db: &PgPool) -> Result<Vec<ContainerWithRelations>> {
        ContainersRepository::new(db).find_all().await
    }

    pub async fn find_one(db: &PgPool, id: i32) -> Result<ContainerWithRelations> {
        ContainersRepository::new(db).find_one(id).await
    }

    pub async fn create(db: &PgPool, dto: CreateContainerDto) -> Result<ContainerWithRelations> {
        dto.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;
        let repo = ContainersRepository::new(db);
        let id = repo.insert(&dto).await?;
        repo.find_one(id).await
    }

    pub async fn bulk_create(
        db: &PgPool,
        containers: Vec<CreateContainerDto>,
    ) -> Result<Vec<ContainerWithRelations>> {
        let mut result = Vec::new();
        for dto in containers {
            result.push(Self::create(db, dto).await?);
        }
        Ok(result)
    }

    pub async fn update(
        db: &PgPool,
        id: i32,
        dto: UpdateContainerDto,
    ) -> Result<ContainerWithRelations> {
        dto.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;
        let repo = ContainersRepository::new(db);
        let current = repo.find_one(id).await?;
        let name = dto.name.unwrap_or(current.name);
        let icon = dto.icon.or(current.icon);
        let room_id = if dto.room_id.is_some() { dto.room_id } else { current.room_id };
        let place_id = if dto.place_id.is_some() { dto.place_id } else { current.place_id };
        repo.update_row(id, name, icon, room_id, place_id).await?;
        repo.find_one(id).await
    }

    pub async fn delete(db: &PgPool, id: i32) -> Result<()> {
        ContainersRepository::new(db).delete(id).await
    }
}
