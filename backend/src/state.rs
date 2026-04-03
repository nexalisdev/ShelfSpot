use crate::config::Config;
use crate::infra::email::service::EmailService;
use crate::infra::push::service::PushNotificationService;
use sqlx::PgPool;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub config: Config,
    pub email: EmailService,
    pub push: PushNotificationService,
}

impl AppState {
    pub fn new(db: PgPool, config: Config) -> Self {
        let email = EmailService::new(config.resend_api_key.clone(), config.resend_from_email.clone());
        let push = PushNotificationService::new();
        Self { db, config, email, push }
    }
}
