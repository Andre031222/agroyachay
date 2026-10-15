use std::net::SocketAddr;

use agroyachay_api::config::Config;
use agroyachay_api::state::AppState;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() {
    let dotenv = dotenvy::dotenv();
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("agroyachay_api=info,tower_http=info")),
        )
        .init();
    if let Err(error) = dotenv
        && !error.not_found()
    {
        tracing::warn!(%error, "the .env file could not be fully read; quote values that contain spaces or < >");
    }

    if let Err(error) = run().await {
        tracing::error!(%error, "agroyachay-api stopped");
        std::process::exit(1);
    }
}

async fn run() -> Result<(), String> {
    let config = Config::from_env()?;
    let address = format!("{}:{}", config.host, config.port);
    let pool = agroyachay_api::connect(&config)
        .await
        .map_err(|error| format!("database connection failed: {error}"))?;
    tokio::fs::create_dir_all(&config.upload_dir)
        .await
        .map_err(|error| format!("cannot create upload dir: {error}"))?;
    let state = AppState::new(config, pool)?;
    agroyachay_api::bootstrap(&state).await?;
    agroyachay_api::spawn_offline_monitor(state.clone());

    let listener = tokio::net::TcpListener::bind(&address)
        .await
        .map_err(|error| format!("cannot bind {address}: {error}"))?;
    tracing::info!(%address, version = env!("CARGO_PKG_VERSION"), "agroyachay-api listening");
    axum::serve(
        listener,
        agroyachay_api::app(state).into_make_service_with_connect_info::<SocketAddr>(),
    )
    .with_graceful_shutdown(shutdown_signal())
    .await
    .map_err(|error| error.to_string())
}

async fn shutdown_signal() {
    let interrupt = async {
        tokio::signal::ctrl_c().await.ok();
    };
    #[cfg(unix)]
    let terminate = async {
        if let Ok(mut signal) =
            tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
        {
            signal.recv().await;
        }
    };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();
    tokio::select! {
        _ = interrupt => {},
        _ = terminate => {},
    }
}
