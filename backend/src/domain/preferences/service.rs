use sqlx::PgPool;

use crate::domain::preferences::dto::UpdatePreferencesDto;
use crate::domain::preferences::entity::UserPreferences;
use crate::error::Result;
use crate::infra::preferences::repository::PreferencesRepository;

pub struct PreferencesService;

impl PreferencesService {
    pub async fn get_or_create(db: &PgPool, user_id: i32) -> Result<UserPreferences> {
        PreferencesRepository::new(db).get_or_create(user_id).await
    }

    pub async fn update(
        db: &PgPool,
        user_id: i32,
        dto: UpdatePreferencesDto,
    ) -> Result<UserPreferences> {
        let repo = PreferencesRepository::new(db);
        let current = repo.get_or_create(user_id).await?;

        let show_welcome_header = dto.show_welcome_header.unwrap_or(current.show_welcome_header);
        let show_stats_cards = dto.show_stats_cards.unwrap_or(current.show_stats_cards);
        let show_recent_items = dto.show_recent_items.unwrap_or(current.show_recent_items);
        let show_room_distribution =
            dto.show_room_distribution.unwrap_or(current.show_room_distribution);
        let show_alerts_per_month =
            dto.show_alerts_per_month.unwrap_or(current.show_alerts_per_month);
        let show_inventory_value =
            dto.show_inventory_value.unwrap_or(current.show_inventory_value);
        let show_status_distribution =
            dto.show_status_distribution.unwrap_or(current.show_status_distribution);

        repo.update(
            user_id,
            show_welcome_header,
            show_stats_cards,
            show_recent_items,
            show_room_distribution,
            show_alerts_per_month,
            show_inventory_value,
            show_status_distribution,
        )
        .await?;

        repo.get_or_create(user_id).await
    }
}
