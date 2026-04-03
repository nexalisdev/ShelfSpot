use sqlx::PgPool;

use crate::error::Result;
use crate::infra::scoring::repository::ScoringRepository;

pub struct ScoringService;

impl ScoringService {
    pub fn priority_multiplier_pub(priority: &str) -> f64 {
        Self::priority_multiplier(priority)
    }

    pub fn status_score_pub(status: &str) -> f64 {
        Self::status_score(status)
    }

    fn priority_multiplier(priority: &str) -> f64 {
        match priority {
            "LOW" => 1.0,
            "MEDIUM" => 1.5,
            "HIGH" => 2.0,
            "CRITICAL" => 3.0,
            _ => 1.0,
        }
    }

    fn status_score(status: &str) -> f64 {
        match status {
            "ACTIVE" => 10.0,
            "PAUSED" => 5.0,
            _ => 0.0,
        }
    }

    pub async fn recalculate_all_scores(db: &PgPool) -> anyhow::Result<()> {
        use std::collections::HashMap;

        let repo = ScoringRepository::new(db);
        let rows = repo.fetch_all_item_project_rows().await?;

        let mut item_scores: HashMap<i32, f64> = HashMap::new();
        let mut item_project_counts: HashMap<i32, usize> = HashMap::new();

        for row in &rows {
            if !row.is_active {
                continue;
            }
            let base = Self::status_score(&row.status_str);
            let mult = Self::priority_multiplier(&row.priority_str);
            *item_scores.entry(row.item_id).or_insert(0.0) += base * mult;
            *item_project_counts.entry(row.item_id).or_insert(0) += 1;
        }

        for (item_id, count) in &item_project_counts {
            if *count > 1 {
                *item_scores.entry(*item_id).or_insert(0.0) += (*count as f64 - 1.0) * 0.5;
            }
        }

        repo.reset_all_scores().await?;

        for (item_id, score) in item_scores {
            repo.set_score(item_id, score).await?;
        }

        Ok(())
    }

    pub async fn recalculate_for_item_ids(
        db: &PgPool,
        item_ids: Vec<i32>,
    ) -> anyhow::Result<()> {
        if item_ids.is_empty() {
            return Ok(());
        }

        use std::collections::HashMap;

        let repo = ScoringRepository::new(db);
        let rows = repo
            .fetch_item_project_rows_for_ids(&item_ids)
            .await?;

        let mut item_scores: HashMap<i32, f64> = HashMap::new();
        let mut item_project_counts: HashMap<i32, usize> = HashMap::new();

        for row in &rows {
            if !row.is_active {
                continue;
            }
            let base = Self::status_score(&row.status_str);
            let mult = Self::priority_multiplier(&row.priority_str);
            *item_scores.entry(row.item_id).or_insert(0.0) += base * mult;
            *item_project_counts.entry(row.item_id).or_insert(0) += 1;
        }

        for (item_id, count) in &item_project_counts {
            if *count > 1 {
                *item_scores.entry(*item_id).or_insert(0.0) += (*count as f64 - 1.0) * 0.5;
            }
        }

        repo.reset_scores_for_ids(&item_ids).await?;

        for (item_id, score) in item_scores {
            repo.set_score(item_id, score).await?;
        }

        Ok(())
    }

    pub async fn get_top_items(db: &PgPool) -> Result<Vec<serde_json::Value>> {
        let items = ScoringRepository::new(db).fetch_top_items().await?;
        Ok(items
            .iter()
            .map(|i| {
                serde_json::json!({
                    "id": i.id,
                    "name": i.name,
                    "quantity": i.quantity,
                    "importanceScore": i.importance_score,
                })
            })
            .collect())
    }

    pub async fn get_critical_items(db: &PgPool) -> Result<Vec<serde_json::Value>> {
        let items = ScoringRepository::new(db).fetch_critical_items().await?;
        Ok(items
            .iter()
            .map(|i| {
                serde_json::json!({
                    "id": i.id,
                    "name": i.name,
                    "quantity": i.quantity,
                    "importanceScore": i.importance_score,
                })
            })
            .collect())
    }

    pub async fn get_score_statistics(db: &PgPool) -> Result<serde_json::Value> {
        let stats = ScoringRepository::new(db).fetch_score_statistics().await?;
        Ok(serde_json::json!({
            "totalItems": stats.total_items,
            "itemsWithScore": stats.items_with_score,
            "avgScore": stats.avg_score,
            "maxScore": stats.max_score,
        }))
    }
}
