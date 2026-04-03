use std::net::SocketAddr;
use std::sync::Arc;

use axum::{Router, http::Method};
use axum::http::{HeaderName, HeaderValue};
use sqlx::postgres::PgPoolOptions;
use tower_governor::{governor::GovernorConfigBuilder, key_extractor::SmartIpKeyExtractor, GovernorLayer};
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod api;
mod config;
mod db;
mod domain;
mod error;
mod infra;
mod state;
mod swagger;

use state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info,sqlx=warn".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = config::Config::from_env()?;
    let port = config.port;

    tracing::info!("Connecting to database...");
    let db = PgPoolOptions::new()
        .max_connections(20)
        .connect(&config.database_url)
        .await?;

    // Run embedded SQL migrations from backend/migrations.
    let migrator = sqlx::migrate!("./migrations");
    migrator.run(&db).await?;

    let state = AppState::new(db, config.clone());

    let frontend_origin: HeaderValue = config.frontend_url
        .parse()
        .expect("FRONTEND_URL is not a valid HTTP origin");

    let cors = CorsLayer::new()
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::PATCH,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([
            HeaderName::from_static("authorization"),
            HeaderName::from_static("content-type"),
            HeaderName::from_static("accept"),
            HeaderName::from_static("cookie"),
        ])
        .allow_origin(frontend_origin)
        .allow_credentials(true);

    // General rate limit: 100 burst, 1 req per 200ms per IP
    let general_rate_config = Arc::new(
        GovernorConfigBuilder::default()
            .per_millisecond(200)
            .burst_size(100)
            .key_extractor(SmartIpKeyExtractor)
            .finish()
            .unwrap(),
    );

    let app = Router::new()
        .route("/api/openapi.json", axum::routing::get(swagger::openapi_json))
        .route("/api/swagger", axum::routing::get(swagger::swagger_ui))
        .nest("/auth", api::auth::routes::router())
        .nest("/admin", api::admin::routes::router())
        .nest("/items", api::items::routes::router())
        .nest("/rooms", api::rooms::routes::router())
        .nest("/places", api::places::routes::router())
        .nest("/containers", api::containers::routes::router())
        .nest("/tags", api::tags::routes::router())
        .nest("/favourites", api::favourites::routes::router())
        .nest("/alerts", api::alerts::routes::router())
        .nest("/consumables", api::consumables::routes::router())
        .nest("/projects", api::projects::routes::router())
        .nest("/scoring", api::scoring::routes::router())
        .nest("/notifications", api::notifications::routes::router())
        .nest("/preferences", api::preferences::routes::router())
        .layer(GovernorLayer { config: general_rate_config })
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("ShelfSpot api running on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await?;

    Ok(())
}
