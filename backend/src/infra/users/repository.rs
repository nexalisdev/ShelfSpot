use chrono::{DateTime, Utc};
use sqlx::PgPool;

use crate::domain::users::entity::{SafeUser, User};
use crate::error::{AppError, Result};

pub struct UsersRepository<'a>(pub &'a PgPool);

impl<'a> UsersRepository<'a> {
    pub fn new(db: &'a PgPool) -> Self {
        Self(db)
    }

    pub async fn find_by_email(&self, email: &str) -> Result<Option<User>> {
        sqlx::query_as::<_, User>(
            r#"SELECT id, email, password, name, admin, "notificationToken" as notification_token, "createdAt" as created_at
               FROM "User" WHERE email = $1"#,
        )
        .bind(email)
        .fetch_optional(self.0)
        .await
        .map_err(AppError::Sqlx)
    }

    pub async fn find_by_id(&self, id: i32) -> Result<Option<SafeUser>> {
        sqlx::query_as::<_, SafeUser>(
            r#"SELECT id, email, name, admin, "notificationToken" as notification_token, "createdAt" as created_at
               FROM "User" WHERE id = $1"#,
        )
        .bind(id)
        .fetch_optional(self.0)
        .await
        .map_err(AppError::Sqlx)
    }

    // pub async fn find_admin_flag(&self, id: i32) -> Result<bool> {
    //     let admin: Option<bool> =
    //         sqlx::query_scalar(r#"SELECT admin FROM "User" WHERE id = $1"#)
    //             .bind(id)
    //             .fetch_optional(self.0)
    //             .await
    //             .map_err(AppError::Sqlx)?;
    //     Ok(admin.unwrap_or(false))
    // }

    pub async fn email_exists(&self, email: &str) -> Result<bool> {
        let exists: bool =
            sqlx::query_scalar(r#"SELECT EXISTS(SELECT 1 FROM "User" WHERE email=$1)"#)
                .bind(email)
                .fetch_one(self.0)
                .await
                .map_err(AppError::Sqlx)?;
        Ok(exists)
    }

    pub async fn email_exists_except(&self, email: &str, exclude_id: i32) -> Result<bool> {
        let id: Option<i32> =
            sqlx::query_scalar(r#"SELECT id FROM "User" WHERE email = $1 AND id != $2"#)
                .bind(email)
                .bind(exclude_id)
                .fetch_optional(self.0)
                .await
                .map_err(AppError::Sqlx)?;
        Ok(id.is_some())
    }

    pub async fn create(
        &self,
        email: &str,
        hashed_password: &str,
        name: Option<&str>,
        notification_token: Option<&str>,
    ) -> Result<SafeUser> {
        sqlx::query_as::<_, SafeUser>(
            r#"INSERT INTO "User" (email, password, name, "notificationToken")
               VALUES ($1, $2, $3, $4)
               RETURNING id, email, name, admin, "notificationToken" as notification_token, "createdAt" as created_at"#,
        )
        .bind(email)
        .bind(hashed_password)
        .bind(name)
        .bind(notification_token)
        .fetch_one(self.0)
        .await
        .map_err(AppError::Sqlx)
    }

    pub async fn create_admin(
        &self,
        email: &str,
        hashed_password: &str,
        name: Option<&str>,
        admin: bool,
    ) -> Result<SafeUser> {
        sqlx::query_as::<_, SafeUser>(
            r#"INSERT INTO "User"(email, password, name, admin) VALUES($1, $2, $3, $4)
               RETURNING id, email, name, admin, "notificationToken" as notification_token, "createdAt" as created_at"#,
        )
        .bind(email)
        .bind(hashed_password)
        .bind(name)
        .bind(admin)
        .fetch_one(self.0)
        .await
        .map_err(AppError::Sqlx)
    }

    pub async fn update_name(&self, user_id: i32, name: &str) -> Result<SafeUser> {
        sqlx::query_as::<_, SafeUser>(
            r#"UPDATE "User" SET name = $1 WHERE id = $2
               RETURNING id, email, name, admin, "notificationToken" as notification_token, "createdAt" as created_at"#,
        )
        .bind(name)
        .bind(user_id)
        .fetch_optional(self.0)
        .await
        .map_err(AppError::Sqlx)?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))
    }

    pub async fn update_email(&self, user_id: i32, email: &str) -> Result<SafeUser> {
        sqlx::query_as::<_, SafeUser>(
            r#"UPDATE "User" SET email = $1 WHERE id = $2
               RETURNING id, email, name, admin, "notificationToken" as notification_token, "createdAt" as created_at"#,
        )
        .bind(email)
        .bind(user_id)
        .fetch_optional(self.0)
        .await
        .map_err(AppError::Sqlx)?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))
    }

    pub async fn get_password_hash(&self, user_id: i32) -> Result<Option<String>> {
        sqlx::query_scalar::<_, String>(r#"SELECT password FROM "User" WHERE id = $1"#)
            .bind(user_id)
            .fetch_optional(self.0)
            .await
            .map_err(AppError::Sqlx)
    }

    pub async fn set_password(&self, user_id: i32, hashed_password: &str) -> Result<()> {
        sqlx::query(r#"UPDATE "User" SET password = $1 WHERE id = $2"#)
            .bind(hashed_password)
            .bind(user_id)
            .execute(self.0)
            .await
            .map_err(AppError::Sqlx)?;
        Ok(())
    }

    pub async fn set_notification_token(&self, user_id: i32, token: &str) -> Result<()> {
        sqlx::query(r#"UPDATE "User" SET "notificationToken" = $1 WHERE id = $2"#)
            .bind(token)
            .bind(user_id)
            .execute(self.0)
            .await
            .map_err(AppError::Sqlx)?;
        Ok(())
    }

    pub async fn list_all(&self) -> Result<Vec<SafeUser>> {
        sqlx::query_as::<_, SafeUser>(
            r#"SELECT id, email, name, admin, "notificationToken" as notification_token, "createdAt" as created_at
               FROM "User" ORDER BY "createdAt" DESC"#,
        )
        .fetch_all(self.0)
        .await
        .map_err(AppError::Sqlx)
    }

    pub async fn admin_update(
        &self,
        id: i32,
        email: String,
        name: Option<String>,
        admin: bool,
        token: Option<String>,
    ) -> Result<SafeUser> {
        sqlx::query(
            r#"UPDATE "User" SET email=$1, name=$2, admin=$3, "notificationToken"=$4 WHERE id=$5"#,
        )
        .bind(&email)
        .bind(&name)
        .bind(admin)
        .bind(&token)
        .bind(id)
        .execute(self.0)
        .await
        .map_err(AppError::Sqlx)?;

        sqlx::query_as::<_, SafeUser>(
            r#"SELECT id, email, name, admin, "notificationToken" as notification_token, "createdAt" as created_at
               FROM "User" WHERE id=$1"#,
        )
        .bind(id)
        .fetch_one(self.0)
        .await
        .map_err(AppError::Sqlx)
    }

    pub async fn set_refresh_token(
        &self,
        user_id: i32,
        token_hash: &str,
        expiry: DateTime<Utc>,
    ) -> Result<()> {
        sqlx::query(
            r#"UPDATE "User" SET "refreshToken" = $1, "refreshTokenExpiry" = $2 WHERE id = $3"#,
        )
        .bind(token_hash)
        .bind(expiry)
        .bind(user_id)
        .execute(self.0)
        .await
        .map_err(AppError::Sqlx)?;
        Ok(())
    }

    pub async fn find_by_refresh_token(&self, token_hash: &str) -> Result<Option<User>> {
        sqlx::query_as::<_, User>(
            r#"SELECT id, email, password, name, admin, "notificationToken" as notification_token, "createdAt" as created_at
               FROM "User"
               WHERE "refreshToken" = $1 AND "refreshTokenExpiry" > NOW()"#,
        )
        .bind(token_hash)
        .fetch_optional(self.0)
        .await
        .map_err(AppError::Sqlx)
    }

    pub async fn clear_refresh_token(&self, user_id: i32) -> Result<()> {
        sqlx::query(
            r#"UPDATE "User" SET "refreshToken" = NULL, "refreshTokenExpiry" = NULL WHERE id = $1"#,
        )
        .bind(user_id)
        .execute(self.0)
        .await
        .map_err(AppError::Sqlx)?;
        Ok(())
    }

    pub async fn delete(&self, id: i32) -> Result<()> {
        let result = sqlx::query(r#"DELETE FROM "User" WHERE id=$1"#)
            .bind(id)
            .execute(self.0)
            .await
            .map_err(AppError::Sqlx)?;
        if result.rows_affected() == 0 {
            return Err(AppError::NotFound("User not found".into()));
        }
        Ok(())
    }

    // pub async fn find_full_by_id(&self, id: i32) -> Result<Option<SafeUser>> {
    //     sqlx::query_as::<_, SafeUser>(
    //         r#"SELECT id, email, name, admin, "notificationToken" as notification_token, "createdAt" as created_at
    //            FROM "User" WHERE id=$1"#,
    //     )
    //     .bind(id)
    //     .fetch_optional(self.0)
    //     .await
    //     .map_err(AppError::Sqlx)
    // }
}
