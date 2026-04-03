use sqlx::PgPool;
use validator::Validate;

use crate::domain::places::dto::{CreatePlaceDto, UpdatePlaceDto};
use crate::domain::places::entity::Place;
use crate::error::{AppError, Result};
use crate::infra::places::repository::PlacesRepository;

pub struct PlacesService;

impl PlacesService {
    pub async fn find_all(db: &PgPool) -> Result<Vec<Place>> {
        PlacesRepository::new(db).find_all().await
    }

    pub async fn find_one(db: &PgPool, id: i32) -> Result<Place> {
        PlacesRepository::new(db).find_one(id).await
    }

    pub async fn create(db: &PgPool, dto: CreatePlaceDto) -> Result<Place> {
        dto.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;
        PlacesRepository::new(db).insert(&dto).await
    }

    pub async fn bulk_create(db: &PgPool, places: Vec<CreatePlaceDto>) -> Result<Vec<Place>> {
        let mut result = Vec::new();
        for dto in places {
            match PlacesRepository::new(db).insert(&dto).await {
                Ok(place) => result.push(place),
                Err(AppError::Sqlx(sqlx::Error::Database(ref db_err)))
                    if db_err.code().as_deref() == Some("23505") => {}
                Err(e) => return Err(e),
            }
        }
        Ok(result)
    }

    pub async fn update(db: &PgPool, id: i32, dto: UpdatePlaceDto) -> Result<Place> {
        dto.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;
        let repo = PlacesRepository::new(db);
        let current = repo.find_one(id).await?;
        repo.update_row(id, &dto, &current).await?;
        repo.find_one(id).await
    }

    pub async fn delete(db: &PgPool, id: i32) -> Result<()> {
        PlacesRepository::new(db).delete(id).await
    }
}
