use sqlx::PgPool;
use validator::Validate;

use crate::domain::tags::dto::{CreateTagDto, UpdateTagDto};
use crate::domain::tags::entity::Tag;
use crate::error::{AppError, Result};
use crate::infra::tags::repository::TagsRepository;

pub struct TagsService;

impl TagsService {
    pub async fn find_all(db: &PgPool) -> Result<Vec<Tag>> {
        TagsRepository::new(db).find_all().await
    }

    pub async fn find_one(db: &PgPool, id: i32) -> Result<Tag> {
        TagsRepository::new(db).find_one(id).await
    }

    pub async fn create(db: &PgPool, dto: CreateTagDto) -> Result<Tag> {
        dto.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;
        TagsRepository::new(db).insert(&dto).await
    }

    pub async fn update(db: &PgPool, id: i32, dto: UpdateTagDto) -> Result<Tag> {
        dto.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;
        let repo = TagsRepository::new(db);
        let current = repo.find_one(id).await?;
        repo.update_row(id, &dto, &current).await?;
        repo.find_one(id).await
    }

    pub async fn delete(db: &PgPool, id: i32) -> Result<()> {
        TagsRepository::new(db).delete(id).await
    }
}
