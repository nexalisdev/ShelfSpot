use sqlx::PgPool;

use crate::domain::admin::dto::{CreateUserDto, UpdateUserDto};
use crate::domain::users::entity::SafeUser;
use crate::error::{AppError, Result};
use crate::infra::users::repository::UsersRepository;

pub struct AdminService;

impl AdminService {
    pub async fn list_users(db: &PgPool) -> Result<Vec<SafeUser>> {
        UsersRepository::new(db).list_all().await
    }

    pub async fn create_user(db: &PgPool, dto: CreateUserDto) -> Result<SafeUser> {
        let repo = UsersRepository::new(db);
        if repo.email_exists(&dto.email).await? {
            return Err(AppError::Conflict("Email already in use".into()));
        }
        let hash = bcrypt::hash(&dto.password, 12)
            .map_err(|e| AppError::InternalServerError(e.to_string()))?;
        repo.create_admin(&dto.email, &hash, dto.name.as_deref(), dto.admin.unwrap_or(false))
            .await
    }

    pub async fn update_user(db: &PgPool, id: i32, dto: UpdateUserDto) -> Result<SafeUser> {
        let repo = UsersRepository::new(db);
        let current = repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::NotFound("User not found".into()))?;
        repo.admin_update(
            id,
            dto.email.unwrap_or(current.email),
            dto.name.or(current.name),
            dto.admin.unwrap_or(current.admin),
            dto.notification_token.or(current.notification_token),
        )
        .await
    }

    pub async fn delete_user(db: &PgPool, id: i32) -> Result<()> {
        UsersRepository::new(db).delete(id).await
    }
}
