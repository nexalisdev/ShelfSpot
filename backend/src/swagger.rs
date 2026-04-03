use axum::{
  http::StatusCode,
    http::header,
    response::{Html, IntoResponse},
};
use utoipa::{Modify, OpenApi};
use utoipa::openapi::security::{Http, HttpAuthScheme, SecurityScheme};

struct SecurityAddon;

fn add_schema<T>(components: &mut utoipa::openapi::schema::Components)
where
  T: utoipa::ToSchema<'static>,
{
  let (name, schema) = <T as utoipa::ToSchema<'static>>::schema();
  components
    .schemas
    .entry(name.to_string())
    .or_insert(schema);

  for (alias, alias_schema) in <T as utoipa::ToSchema<'static>>::aliases() {
    components
      .schemas
      .entry(alias.to_string())
      .or_insert(alias_schema.into());
  }
}

impl Modify for SecurityAddon {
  fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
    let components = openapi.components.get_or_insert_with(Default::default);

    add_schema::<crate::domain::admin::dto::CreateUserDto>(components);
    add_schema::<crate::domain::admin::dto::UpdateUserDto>(components);
    add_schema::<crate::domain::auth::dto::ForgotPasswordDto>(components);
    add_schema::<crate::domain::auth::dto::LoginDto>(components);
    add_schema::<crate::domain::auth::dto::LoginResponse>(components);
    add_schema::<crate::domain::auth::dto::RefreshTokenDto>(components);
    add_schema::<crate::domain::auth::dto::RegisterDto>(components);
    add_schema::<crate::domain::auth::dto::ResetPasswordDto>(components);
    add_schema::<crate::domain::auth::dto::UpdateEmailDto>(components);
    add_schema::<crate::domain::auth::dto::UpdateNameDto>(components);
    add_schema::<crate::domain::auth::dto::UpdateNotificationTokenDto>(components);
    add_schema::<crate::domain::auth::dto::UserPayload>(components);
    add_schema::<crate::domain::alerts::dto::CreateAlertDto>(components);
    add_schema::<crate::domain::alerts::dto::TestAlertResetDto>(components);
    add_schema::<crate::domain::alerts::dto::UpdateAlertDto>(components);
    add_schema::<crate::domain::alerts::entity::Alert>(components);
    add_schema::<crate::domain::alerts::entity::MonthlyStatEntry>(components);
    add_schema::<crate::domain::containers::dto::ContainerWithRelations>(components);
    add_schema::<crate::domain::containers::dto::CreateContainerDto>(components);
    add_schema::<crate::domain::containers::dto::UpdateContainerDto>(components);
    add_schema::<crate::domain::favourites::dto::AddFavouriteDto>(components);
    add_schema::<crate::domain::favourites::entity::FavouriteWithItem>(components);
    add_schema::<crate::domain::items::dto::CreateItemDto>(components);
    add_schema::<crate::domain::items::dto::InventoryValue>(components);
    add_schema::<crate::domain::items::dto::StatusStat>(components);
    add_schema::<crate::domain::items::dto::StatusStatistics>(components);
    add_schema::<crate::domain::items::dto::UpdateItemDto>(components);
    add_schema::<crate::domain::items::entity::ContainerRef>(components);
    add_schema::<crate::domain::items::entity::ItemWithRelations>(components);
    add_schema::<crate::domain::items::entity::PlaceRef>(components);
    add_schema::<crate::domain::items::entity::RoomRef>(components);
    add_schema::<crate::domain::notifications::dto::SendTestPushDto>(components);
    add_schema::<crate::domain::places::dto::CreatePlaceDto>(components);
    add_schema::<crate::domain::places::dto::UpdatePlaceDto>(components);
    add_schema::<crate::domain::places::entity::Place>(components);
    add_schema::<crate::domain::preferences::dto::UpdatePreferencesDto>(components);
    add_schema::<crate::domain::preferences::entity::UserPreferences>(components);
    add_schema::<crate::domain::projects::dto::AddProjectItemDto>(components);
    add_schema::<crate::domain::projects::dto::CreateProjectDto>(components);
    add_schema::<crate::domain::projects::dto::UpdateProjectDto>(components);
    add_schema::<crate::domain::projects::dto::UpdateProjectItemDto>(components);
    add_schema::<crate::domain::projects::entity::ProjectItemResponse>(components);
    add_schema::<crate::domain::projects::entity::ProjectResponse>(components);
    add_schema::<crate::domain::rooms::dto::CreateRoomDto>(components);
    add_schema::<crate::domain::rooms::dto::RoomWithDetails>(components);
    add_schema::<crate::domain::rooms::dto::UpdateRoomDto>(components);
    add_schema::<crate::domain::tags::dto::CreateTagDto>(components);
    add_schema::<crate::domain::tags::dto::UpdateTagDto>(components);
    add_schema::<crate::domain::tags::entity::Tag>(components);
    add_schema::<crate::domain::users::entity::SafeUser>(components);

    components.add_security_scheme(
      "bearerAuth",
      SecurityScheme::Http(Http::new(HttpAuthScheme::Bearer)),
    );
  }
}

#[derive(OpenApi)]
#[openapi(
  info(
    title = "ShelfSpot API",
    version = "1.0.0",
    description = "ShelfSpot backend REST API"
  ),
  modifiers(&SecurityAddon),
  components(
    schemas(
      crate::domain::admin::dto::CreateUserDto,
      crate::domain::admin::dto::UpdateUserDto,
      crate::domain::auth::dto::ForgotPasswordDto,
      crate::domain::auth::dto::LoginDto,
      crate::domain::auth::dto::LoginResponse,
      crate::domain::auth::dto::RefreshTokenDto,
      crate::domain::auth::dto::RegisterDto,
      crate::domain::auth::dto::ResetPasswordDto,
      crate::domain::auth::dto::UpdateEmailDto,
      crate::domain::auth::dto::UpdateNameDto,
      crate::domain::auth::dto::UpdateNotificationTokenDto,
      crate::domain::auth::dto::UserPayload,
      crate::domain::alerts::dto::CreateAlertDto,
      crate::domain::alerts::dto::TestAlertResetDto,
      crate::domain::alerts::dto::UpdateAlertDto,
      crate::domain::alerts::entity::Alert,
      crate::domain::alerts::entity::MonthlyStatEntry,
      crate::domain::containers::dto::ContainerWithRelations,
      crate::domain::containers::dto::CreateContainerDto,
      crate::domain::containers::dto::UpdateContainerDto,
      crate::domain::favourites::dto::AddFavouriteDto,
      crate::domain::favourites::entity::FavouriteWithItem,
      crate::domain::items::dto::CreateItemDto,
      crate::domain::items::dto::InventoryValue,
      crate::domain::items::dto::StatusStatistics,
      crate::domain::items::dto::UpdateItemDto,
      crate::domain::items::entity::ItemWithRelations,
      crate::domain::notifications::dto::SendTestPushDto,
      crate::domain::places::dto::CreatePlaceDto,
      crate::domain::places::dto::UpdatePlaceDto,
      crate::domain::places::entity::Place,
      crate::domain::preferences::dto::UpdatePreferencesDto,
      crate::domain::preferences::entity::UserPreferences,
      crate::domain::projects::dto::AddProjectItemDto,
      crate::domain::projects::dto::CreateProjectDto,
      crate::domain::projects::dto::UpdateProjectDto,
      crate::domain::projects::dto::UpdateProjectItemDto,
      crate::domain::projects::entity::ProjectItemResponse,
      crate::domain::projects::entity::ProjectResponse,
      crate::domain::rooms::dto::CreateRoomDto,
      crate::domain::rooms::dto::RoomWithDetails,
      crate::domain::rooms::dto::UpdateRoomDto,
      crate::domain::tags::dto::CreateTagDto,
      crate::domain::tags::dto::UpdateTagDto,
      crate::domain::tags::entity::Tag,
      crate::domain::users::entity::SafeUser
    )
  ),
  paths(
    crate::api::admin::routes::list_users,
    crate::api::admin::routes::create_user,
    crate::api::admin::routes::update_user,
    crate::api::admin::routes::delete_user,
    crate::api::admin::routes::hard_delete_item,
    crate::api::auth::routes::register,
    crate::api::auth::routes::login,
    crate::api::auth::routes::logout,
    crate::api::auth::routes::refresh,
    crate::api::auth::routes::get_profile,
    crate::api::auth::routes::update_name,
    crate::api::auth::routes::update_email,
    crate::api::auth::routes::reset_password,
    crate::api::auth::routes::forgot_password,
    crate::api::auth::routes::update_notification_token,
    crate::api::alerts::routes::find_all,
    crate::api::alerts::routes::find_one,
    crate::api::alerts::routes::create,
    crate::api::alerts::routes::update,
    crate::api::alerts::routes::delete_alert,
    crate::api::alerts::routes::check_all,
    crate::api::alerts::routes::test_email,
    crate::api::alerts::routes::monthly_statistics,
    crate::api::consumables::routes::find_all,
    crate::api::consumables::routes::find_one,
    crate::api::consumables::routes::create,
    crate::api::consumables::routes::update,
    crate::api::consumables::routes::delete_consumable,
    crate::api::consumables::routes::get_low_stock,
    crate::api::containers::routes::find_all,
    crate::api::containers::routes::find_one,
    crate::api::containers::routes::create,
    crate::api::containers::routes::bulk_create,
    crate::api::containers::routes::update,
    crate::api::containers::routes::delete_container,
    crate::api::favourites::routes::get_favourites,
    crate::api::favourites::routes::add_favourite,
    crate::api::favourites::routes::add_by_param,
    crate::api::favourites::routes::remove_by_id,
    crate::api::favourites::routes::remove_by_item_id,
    crate::api::items::routes::find_all,
    crate::api::items::routes::find_one,
    crate::api::items::routes::create,
    crate::api::items::routes::bulk_create,
    crate::api::items::routes::update,
    crate::api::items::routes::delete_item,
    crate::api::items::routes::search,
    crate::api::items::routes::inventory_value,
    crate::api::items::routes::status_statistics,
    crate::api::notifications::routes::test_push,
    crate::api::notifications::routes::test_alert_reset,
    crate::api::places::routes::find_all,
    crate::api::places::routes::find_one,
    crate::api::places::routes::create,
    crate::api::places::routes::bulk_create,
    crate::api::places::routes::update,
    crate::api::places::routes::delete_place,
    crate::api::preferences::routes::get_preferences,
    crate::api::preferences::routes::update_preferences,
    crate::api::projects::routes::find_all,
    crate::api::projects::routes::find_one,
    crate::api::projects::routes::create,
    crate::api::projects::routes::update,
    crate::api::projects::routes::delete_project,
    crate::api::projects::routes::get_statistics,
    crate::api::projects::routes::get_score_breakdown,
    crate::api::projects::routes::get_items,
    crate::api::projects::routes::add_item,
    crate::api::projects::routes::update_item,
    crate::api::projects::routes::remove_item,
    crate::api::rooms::routes::find_all,
    crate::api::rooms::routes::find_one,
    crate::api::rooms::routes::create,
    crate::api::rooms::routes::bulk_create,
    crate::api::rooms::routes::update,
    crate::api::rooms::routes::delete_room,
    crate::api::scoring::routes::get_statistics,
    crate::api::scoring::routes::get_top_items,
    crate::api::scoring::routes::get_critical_items,
    crate::api::scoring::routes::recalculate,
    crate::api::tags::routes::find_all,
    crate::api::tags::routes::find_one,
    crate::api::tags::routes::create,
    crate::api::tags::routes::update,
    crate::api::tags::routes::delete_tag,
  )
)]
struct ApiDoc;

pub async fn openapi_json() -> impl IntoResponse {
  match serde_json::to_string_pretty(&ApiDoc::openapi()) {
    Ok(openapi) => ([(header::CONTENT_TYPE, "application/json")], openapi).into_response(),
    Err(_) => (
      StatusCode::INTERNAL_SERVER_ERROR,
      "Failed to generate OpenAPI JSON".to_string(),
    )
      .into_response(),
  }
}

pub async fn swagger_ui() -> Html<&'static str> {
    Html(
        r#"<!DOCTYPE html>
<html>
  <head>
    <title>ShelfSpot API</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
    <style>body { margin: 0; }</style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = function() {
        SwaggerUIBundle({
          url: "/api/openapi.json",
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          plugins: [SwaggerUIBundle.plugins.DownloadUrl],
          layout: "StandaloneLayout"
        });
      };
    </script>
  </body>
</html>"#,
    )
}
