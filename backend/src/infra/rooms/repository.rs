use sqlx::PgPool;

use crate::domain::rooms::dto::CreateRoomDto;
use crate::domain::rooms::entity::RoomWithDetails;
use crate::error::{AppError, Result};

const ROOM_DETAILS_QUERY: &str = r#"
    SELECT r.id, r.name, r.icon, COUNT(i.id) as item_count
    FROM "Room" r
    LEFT JOIN "Item" i ON i."roomId" = r.id
    GROUP BY r.id
    ORDER BY r.name
"#;

pub struct RoomsRepository<'a>(pub &'a PgPool);

impl<'a> RoomsRepository<'a> {
    pub fn new(db: &'a PgPool) -> Self {
        Self(db)
    }

    pub async fn find_all(&self) -> Result<Vec<RoomWithDetails>> {
        let rooms = sqlx::query_as::<_, RoomWithDetails>(ROOM_DETAILS_QUERY)
            .fetch_all(self.0)
            .await?;
        Ok(rooms)
    }

    pub async fn find_one(&self, id: i32) -> Result<RoomWithDetails> {
        let room = sqlx::query_as::<_, RoomWithDetails>(
            r#"SELECT r.id, r.name, r.icon, COUNT(i.id) as item_count
               FROM "Room" r
               LEFT JOIN "Item" i ON i."roomId" = r.id
               WHERE r.id = $1
               GROUP BY r.id"#,
        )
        .bind(id)
        .fetch_optional(self.0)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Room {} not found", id)))?;
        Ok(room)
    }

    pub async fn insert(&self, dto: &CreateRoomDto) -> Result<i32> {
        let id = sqlx::query_scalar::<_, i32>(
            r#"INSERT INTO "Room"(name, icon) VALUES($1, $2) RETURNING id"#,
        )
        .bind(&dto.name)
        .bind(&dto.icon)
        .fetch_one(self.0)
        .await?;
        Ok(id)
    }

    pub async fn update_row(&self, id: i32, name: String, icon: Option<String>) -> Result<()> {
        sqlx::query(r#"UPDATE "Room" SET name=$1, icon=$2 WHERE id=$3"#)
            .bind(name)
            .bind(icon)
            .bind(id)
            .execute(self.0)
            .await?;
        Ok(())
    }

    pub async fn delete(&self, id: i32) -> Result<()> {
        let result = sqlx::query(r#"DELETE FROM "Room" WHERE id=$1"#)
            .bind(id)
            .execute(self.0)
            .await?;
        if result.rows_affected() == 0 {
            return Err(AppError::NotFound(format!("Room {} not found", id)));
        }
        Ok(())
    }
}
