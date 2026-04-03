use sqlx::PgPool;

use crate::domain::preferences::entity::UserPreferences;
use crate::error::{AppError, Result};

pub struct PreferencesRepository<'a>(pub &'a PgPool);

impl<'a> PreferencesRepository<'a> {
    pub fn new(db: &'a PgPool) -> Self {
        Self(db)
    }

    pub async fn get_or_create(&self, user_id: i32) -> Result<UserPreferences> {
        let existing = sqlx::query_as::<_, UserPreferences>(
            r#"SELECT id, "userId" as user_id, "showWelcomeHeader" as show_welcome_header,
               "showStatsCards" as show_stats_cards, "showRecentItems" as show_recent_items,
               "showRoomDistribution" as show_room_distribution, "showAlertsPerMonth" as show_alerts_per_month,
               "showInventoryValue" as show_inventory_value, "showStatusDistribution" as show_status_distribution
               FROM "UserPreferences" WHERE "userId" = $1"#,
        )
        .bind(user_id)
        .fetch_optional(self.0)
        .await
        .map_err(AppError::Sqlx)?;

        if let Some(prefs) = existing {
            return Ok(prefs);
        }

        sqlx::query_as::<_, UserPreferences>(
            r#"INSERT INTO "UserPreferences"("userId") VALUES($1)
               RETURNING id, "userId" as user_id, "showWelcomeHeader" as show_welcome_header,
               "showStatsCards" as show_stats_cards, "showRecentItems" as show_recent_items,
               "showRoomDistribution" as show_room_distribution, "showAlertsPerMonth" as show_alerts_per_month,
               "showInventoryValue" as show_inventory_value, "showStatusDistribution" as show_status_distribution"#,
        )
        .bind(user_id)
        .fetch_one(self.0)
        .await
        .map_err(AppError::Sqlx)
    }

    #[allow(clippy::too_many_arguments)]
    pub async fn update(
        &self,
        user_id: i32,
        show_welcome_header: bool,
        show_stats_cards: bool,
        show_recent_items: bool,
        show_room_distribution: bool,
        show_alerts_per_month: bool,
        show_inventory_value: bool,
        show_status_distribution: bool,
    ) -> Result<()> {
        sqlx::query(
            r#"UPDATE "UserPreferences" SET
               "showWelcomeHeader"=$1, "showStatsCards"=$2, "showRecentItems"=$3,
               "showRoomDistribution"=$4, "showAlertsPerMonth"=$5, "showInventoryValue"=$6,
               "showStatusDistribution"=$7
               WHERE "userId"=$8"#,
        )
        .bind(show_welcome_header)
        .bind(show_stats_cards)
        .bind(show_recent_items)
        .bind(show_room_distribution)
        .bind(show_alerts_per_month)
        .bind(show_inventory_value)
        .bind(show_status_distribution)
        .bind(user_id)
        .execute(self.0)
        .await
        .map_err(AppError::Sqlx)?;
        Ok(())
    }
}
