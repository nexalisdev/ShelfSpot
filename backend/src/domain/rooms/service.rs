use sqlx::PgPool;
use validator::Validate;

use crate::domain::rooms::dto::{CreateRoomDto, UpdateRoomDto};
use crate::domain::rooms::entity::RoomWithDetails;
use crate::error::{AppError, Result};
use crate::infra::rooms::repository::RoomsRepository;

pub struct RoomsService;

impl RoomsService {
    pub async fn find_all(db: &PgPool) -> Result<Vec<RoomWithDetails>> {
        RoomsRepository::new(db).find_all().await
    }

    pub async fn find_one(db: &PgPool, id: i32) -> Result<RoomWithDetails> {
        RoomsRepository::new(db).find_one(id).await
    }

    pub async fn create(db: &PgPool, dto: CreateRoomDto) -> Result<RoomWithDetails> {
        dto.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;
        let repo = RoomsRepository::new(db);
        let id = repo.insert(&dto).await?;
        repo.find_one(id).await
    }

    pub async fn bulk_create(
        db: &PgPool,
        rooms: Vec<CreateRoomDto>,
    ) -> Result<Vec<RoomWithDetails>> {
        let mut result = Vec::new();
        for dto in rooms {
            result.push(Self::create(db, dto).await?);
        }
        Ok(result)
    }

    pub async fn update(db: &PgPool, id: i32, dto: UpdateRoomDto) -> Result<RoomWithDetails> {
        dto.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;
        let repo = RoomsRepository::new(db);
        let current = repo.find_one(id).await?;
        let name = dto.name.unwrap_or(current.name);
        let icon = dto.icon.or(current.icon);
        repo.update_row(id, name, icon).await?;
        repo.find_one(id).await
    }

    pub async fn delete(db: &PgPool, id: i32) -> Result<()> {
        RoomsRepository::new(db).delete(id).await
    }
}
