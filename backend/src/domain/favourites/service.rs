use sqlx::PgPool;

use crate::domain::favourites::dto::AddFavouriteDto;
use crate::domain::favourites::entity::FavouriteWithItem;
use crate::error::Result;
use crate::infra::favourites::repository::FavouritesRepository;

pub struct FavouritesService;

impl FavouritesService {
    pub async fn find_by_user(db: &PgPool, user_id: i32) -> Result<Vec<FavouriteWithItem>> {
        FavouritesRepository::new(db).find_by_user(user_id).await
    }

    pub async fn add(db: &PgPool, user_id: i32, dto: AddFavouriteDto) -> Result<FavouriteWithItem> {
        FavouritesRepository::new(db).insert(user_id, dto.item_id).await
    }

    pub async fn add_by_item_id(
        db: &PgPool,
        user_id: i32,
        item_id: i32,
    ) -> Result<FavouriteWithItem> {
        FavouritesRepository::new(db).insert(user_id, item_id).await
    }

    pub async fn remove_by_id(db: &PgPool, user_id: i32, favourite_id: i32) -> Result<()> {
        FavouritesRepository::new(db)
            .delete_by_id(user_id, favourite_id)
            .await
    }

    pub async fn remove_by_item_id(db: &PgPool, user_id: i32, item_id: i32) -> Result<()> {
        FavouritesRepository::new(db)
            .delete_by_item_id(user_id, item_id)
            .await
    }
}
