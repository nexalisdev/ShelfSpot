use sqlx::PgPool;

use crate::domain::containers::dto::CreateContainerDto;
use crate::domain::containers::entity::ContainerWithRelations;
use crate::error::{AppError, Result};

#[derive(sqlx::FromRow)]
struct ContainerRow {
    id: i32,
    name: String,
    icon: Option<String>,
    room_id: Option<i32>,
    place_id: Option<i32>,
    room_name: Option<String>,
    place_name: Option<String>,
    item_count: i64,
}

impl From<ContainerRow> for ContainerWithRelations {
    fn from(row: ContainerRow) -> Self {
        ContainerWithRelations {
            id: row.id,
            name: row.name,
            icon: row.icon,
            room_id: row.room_id,
            place_id: row.place_id,
            room_name: row.room_name,
            place_name: row.place_name,
            item_count: row.item_count,
        }
    }
}

const CONTAINER_DETAILS_QUERY: &str = r#"
    SELECT c.id, c.name, c.icon,
           c."roomId" as room_id, c."placeId" as place_id,
           r.name as room_name, p.name as place_name,
           COUNT(i.id) as item_count
    FROM "Container" c
    LEFT JOIN "Room" r ON c."roomId" = r.id
    LEFT JOIN "Place" p ON c."placeId" = p.id
    LEFT JOIN "Item" i ON i."containerId" = c.id
    GROUP BY c.id, r.name, p.name
    ORDER BY c.name
"#;

pub struct ContainersRepository<'a>(pub &'a PgPool);

impl<'a> ContainersRepository<'a> {
    pub fn new(db: &'a PgPool) -> Self {
        Self(db)
    }

    pub async fn find_all(&self) -> Result<Vec<ContainerWithRelations>> {
        let rows = sqlx::query_as::<_, ContainerRow>(CONTAINER_DETAILS_QUERY)
            .fetch_all(self.0)
            .await?;
        Ok(rows.into_iter().map(Into::into).collect())
    }

    pub async fn find_one(&self, id: i32) -> Result<ContainerWithRelations> {
        let row = sqlx::query_as::<_, ContainerRow>(
            r#"SELECT c.id, c.name, c.icon,
                      c."roomId" as room_id, c."placeId" as place_id,
                      r.name as room_name, p.name as place_name,
                      COUNT(i.id) as item_count
               FROM "Container" c
               LEFT JOIN "Room" r ON c."roomId" = r.id
               LEFT JOIN "Place" p ON c."placeId" = p.id
               LEFT JOIN "Item" i ON i."containerId" = c.id
               WHERE c.id = $1
               GROUP BY c.id, r.name, p.name"#,
        )
        .bind(id)
        .fetch_optional(self.0)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Container {} not found", id)))?;
        Ok(row.into())
    }

    pub async fn insert(&self, dto: &CreateContainerDto) -> Result<i32> {
        let id = sqlx::query_scalar::<_, i32>(
            r#"INSERT INTO "Container"(name, icon, "roomId", "placeId") VALUES($1, $2, $3, $4) RETURNING id"#,
        )
        .bind(&dto.name)
        .bind(&dto.icon)
        .bind(dto.room_id)
        .bind(dto.place_id)
        .fetch_one(self.0)
        .await?;
        Ok(id)
    }

    pub async fn update_row(
        &self,
        id: i32,
        name: String,
        icon: Option<String>,
        room_id: Option<i32>,
        place_id: Option<i32>,
    ) -> Result<()> {
        sqlx::query(
            r#"UPDATE "Container" SET name=$1, icon=$2, "roomId"=$3, "placeId"=$4 WHERE id=$5"#,
        )
        .bind(name)
        .bind(icon)
        .bind(room_id)
        .bind(place_id)
        .bind(id)
        .execute(self.0)
        .await?;
        Ok(())
    }

    pub async fn delete(&self, id: i32) -> Result<()> {
        let result = sqlx::query(r#"DELETE FROM "Container" WHERE id=$1"#)
            .bind(id)
            .execute(self.0)
            .await?;
        if result.rows_affected() == 0 {
            return Err(AppError::NotFound(format!("Container {} not found", id)));
        }
        Ok(())
    }
}
