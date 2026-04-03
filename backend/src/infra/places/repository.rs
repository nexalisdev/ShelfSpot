use sqlx::PgPool;

use crate::domain::places::dto::{CreatePlaceDto, UpdatePlaceDto};
use crate::domain::places::entity::Place;
use crate::error::{AppError, Result};

pub struct PlacesRepository<'a>(pub &'a PgPool);

impl<'a> PlacesRepository<'a> {
    pub fn new(db: &'a PgPool) -> Self {
        Self(db)
    }

    pub async fn find_all(&self) -> Result<Vec<Place>> {
        let places = sqlx::query_as::<_, Place>(
            r#"SELECT id, name, icon, "roomId" as room_id FROM "Place" ORDER BY name"#,
        )
        .fetch_all(self.0)
        .await?;
        Ok(places)
    }

    pub async fn find_one(&self, id: i32) -> Result<Place> {
        let place = sqlx::query_as::<_, Place>(
            r#"SELECT id, name, icon, "roomId" as room_id FROM "Place" WHERE id = $1"#,
        )
        .bind(id)
        .fetch_optional(self.0)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Place {} not found", id)))?;
        Ok(place)
    }

    pub async fn insert(&self, dto: &CreatePlaceDto) -> Result<Place> {
        let place = sqlx::query_as::<_, Place>(
            r#"INSERT INTO "Place"(name, icon, "roomId") VALUES($1, $2, $3)
               RETURNING id, name, icon, "roomId" as room_id"#,
        )
        .bind(&dto.name)
        .bind(&dto.icon)
        .bind(dto.room_id)
        .fetch_one(self.0)
        .await?;
        Ok(place)
    }

    pub async fn update_row(&self, id: i32, dto: &UpdatePlaceDto, current: &Place) -> Result<()> {
        let name = dto.name.clone().unwrap_or_else(|| current.name.clone());
        let icon = dto.icon.clone().or_else(|| current.icon.clone());
        let room_id = if dto.room_id.is_some() { dto.room_id } else { current.room_id };
        sqlx::query(r#"UPDATE "Place" SET name=$1, icon=$2, "roomId"=$3 WHERE id=$4"#)
            .bind(name)
            .bind(icon)
            .bind(room_id)
            .bind(id)
            .execute(self.0)
            .await?;
        Ok(())
    }

    pub async fn delete(&self, id: i32) -> Result<()> {
        let result = sqlx::query(r#"DELETE FROM "Place" WHERE id=$1"#)
            .bind(id)
            .execute(self.0)
            .await?;
        if result.rows_affected() == 0 {
            return Err(AppError::NotFound(format!("Place {} not found", id)));
        }
        Ok(())
    }
}
