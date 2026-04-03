use chrono::Utc;
use rand::distributions::Alphanumeric;
use rand::{thread_rng, Rng};
use sqlx::PgPool;
use validator::Validate;

use crate::domain::auth::dto::{
    ForgotPasswordDto, LoginDto, LoginResponse, RegisterDto, ResetPasswordDto,
    UpdateEmailDto, UpdateNameDto, UpdateNotificationTokenDto, UserPayload,
};
use crate::domain::auth::jwt::{create_refresh_token, create_token, hash_refresh_token};
use crate::domain::users::entity::SafeUser;
use crate::error::{AppError, Result};
use crate::infra::email::service::EmailService;
use crate::infra::users::repository::UsersRepository;

pub struct AuthService;

impl AuthService {
    #[tracing::instrument(skip(db, dto), fields(user_email = %dto.email))]
    pub async fn register(db: &PgPool, dto: RegisterDto) -> Result<SafeUser> {
        dto.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;
        let repo = UsersRepository::new(db);
        if repo.email_exists(&dto.email).await? {
            return Err(AppError::Conflict("Email already in use".to_string()));
        }
        let hashed_password = bcrypt::hash(&dto.password, 12)
            .map_err(|e| AppError::InternalServerError(format!("Bcrypt error: {}", e)))?;
        repo.create(
            &dto.email,
            &hashed_password,
            dto.name.as_deref(),
            dto.notification_token.as_deref(),
        )
        .await
    }

    #[tracing::instrument(skip(db, dto, jwt_secret), fields(user_email = %dto.email))]
    pub async fn login(
        db: &PgPool,
        dto: LoginDto,
        jwt_secret: &str,
    ) -> Result<(LoginResponse, String)> {
        dto.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;
        let repo = UsersRepository::new(db);
        let user = repo
            .find_by_email(&dto.email)
            .await?
            .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

        let valid = bcrypt::verify(&dto.password, &user.password)
            .map_err(|e| AppError::InternalServerError(format!("Bcrypt error: {}", e)))?;
        if !valid {
            return Err(AppError::Unauthorized);
        }

        let token = create_token(&user, jwt_secret)?;
        let (raw_refresh, hash_refresh) = create_refresh_token();
        let expiry = Utc::now() + chrono::Duration::days(30);
        repo.set_refresh_token(user.id, &hash_refresh, expiry).await?;

        let response = LoginResponse {
            access_token: token,
            user: UserPayload {
                id: user.id,
                email: user.email,
                name: user.name,
                admin: user.admin,
                notification_token: user.notification_token,
            },
        };
        Ok((response, raw_refresh))
    }

    /// Exchange a valid refresh token for a new access token.
    pub async fn refresh(
        db: &PgPool,
        raw_refresh_token: &str,
        jwt_secret: &str,
    ) -> Result<String> {
        let token_hash = hash_refresh_token(raw_refresh_token);
        let repo = UsersRepository::new(db);
        let user = repo
            .find_by_refresh_token(&token_hash)
            .await?
            .ok_or(AppError::Unauthorized)?;
        create_token(&user, jwt_secret)
    }

    pub async fn logout(db: &PgPool, user_id: i32) -> Result<()> {
        UsersRepository::new(db).clear_refresh_token(user_id).await
    }

    pub async fn get_profile(db: &PgPool, user_id: i32) -> Result<SafeUser> {
        UsersRepository::new(db)
            .find_by_id(user_id)
            .await?
            .ok_or_else(|| AppError::NotFound("User not found".to_string()))
    }

    pub async fn update_name(db: &PgPool, user_id: i32, dto: UpdateNameDto) -> Result<SafeUser> {
        if dto.name.len() < 5 {
            return Err(AppError::BadRequest(
                "Name must be at least 5 characters".to_string(),
            ));
        }
        UsersRepository::new(db).update_name(user_id, &dto.name).await
    }

    pub async fn update_email(db: &PgPool, user_id: i32, dto: UpdateEmailDto) -> Result<SafeUser> {
        dto.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;
        let repo = UsersRepository::new(db);
        if repo.email_exists_except(&dto.email, user_id).await? {
            return Err(AppError::Conflict("Email already in use".to_string()));
        }
        repo.update_email(user_id, &dto.email).await
    }

    pub async fn reset_password(db: &PgPool, user_id: i32, dto: ResetPasswordDto) -> Result<()> {
        dto.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;
        let repo = UsersRepository::new(db);
        let current_hash = repo
            .get_password_hash(user_id)
            .await?
            .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;
        let valid = bcrypt::verify(&dto.current_password, &current_hash)
            .map_err(|e| AppError::InternalServerError(format!("Bcrypt error: {}", e)))?;
        if !valid {
            return Err(AppError::Unauthorized);
        }
        let new_hash = bcrypt::hash(&dto.new_password, 12)
            .map_err(|e| AppError::InternalServerError(format!("Bcrypt error: {}", e)))?;
        repo.set_password(user_id, &new_hash).await
    }

    pub async fn forgot_password(
        db: &PgPool,
        email_svc: &EmailService,
        dto: ForgotPasswordDto,
    ) -> Result<()> {
        dto.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;
        let repo = UsersRepository::new(db);
        let user = repo
            .find_by_email(&dto.email)
            .await?
            .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

        let temp_password: String = thread_rng()
            .sample_iter(&Alphanumeric)
            .take(8)
            .map(char::from)
            .collect();
        let hashed = bcrypt::hash(&temp_password, 12)
            .map_err(|e| AppError::InternalServerError(format!("Bcrypt error: {}", e)))?;
        repo.set_password(user.id, &hashed).await?;
        if let Err(e) = email_svc.send_temp_password_email(&dto.email, &temp_password).await {
            tracing::error!("Failed to send temp password email to {}: {}", dto.email, e);
        }
        Ok(())
    }

    pub async fn update_notification_token(
        db: &PgPool,
        user_id: i32,
        dto: UpdateNotificationTokenDto,
    ) -> Result<()> {
        UsersRepository::new(db)
            .set_notification_token(user_id, &dto.notification_token)
            .await
    }
}
