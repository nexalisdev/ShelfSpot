use crate::domain::notifications::dto::SendTestPushDto;
use crate::error::{AppError, Result};
use crate::infra::push::service::PushNotificationService;

pub struct NotificationsService;

impl NotificationsService {
    /// Send a test push notification to a specific token.
    pub async fn send_test(push_svc: &PushNotificationService, dto: SendTestPushDto) -> Result<()> {
        push_svc
            .send_notifications(vec![dto.push_token], &dto.title, &dto.body)
            .await
            .map_err(|e| AppError::InternalServerError(e.to_string()))
    }
}
