pub mod auth;
pub mod config;
pub mod domain;
pub mod error;
pub mod i18n;
pub mod infra;
pub mod routes;
pub mod state;

use std::time::Duration;

use serde_json::Value;
use sqlx::PgPool;
use sqlx::postgres::PgPoolOptions;

use crate::config::{Config, LlmProvider};
use crate::infra::repo::audit::ClientInfo;
use crate::infra::repo::{alerts, audit, settings, users};
use crate::state::AppState;

pub use routes::app;

pub static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations");

pub async fn connect(config: &Config) -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(20)
        .acquire_timeout(Duration::from_secs(5))
        .connect(&config.database_url)
        .await
}

pub async fn bootstrap(state: &AppState) -> Result<(), String> {
    MIGRATOR
        .run(&state.db)
        .await
        .map_err(|error| format!("migrations failed: {error}"))?;

    let stored_provider = settings::get(&state.db, settings::LLM_PROVIDER)
        .await
        .map_err(|error| error.to_string())?;
    match stored_provider
        .as_ref()
        .and_then(Value::as_str)
        .and_then(LlmProvider::parse)
    {
        Some(provider) => state.set_llm_provider(provider),
        None => settings::insert_default(
            &state.db,
            settings::LLM_PROVIDER,
            &Value::String(state.config.llm_provider.as_str().to_string()),
        )
        .await
        .map_err(|error| error.to_string())?,
    }

    promote_env_superadmins(state).await?;

    let config = &state.config;
    let has_superadmin = users::superadmin_exists(&state.db)
        .await
        .map_err(|error| error.to_string())?;
    if !has_superadmin {
        if config.admin_email.is_empty() || config.admin_password.len() < 8 {
            tracing::warn!(
                "no superadmin exists and ADMIN_EMAIL/ADMIN_PASSWORD are not set; skipping bootstrap"
            );
            return Ok(());
        }
        let hash = auth::hash_password(&config.admin_password)
            .await
            .map_err(|error| error.to_string())?;
        let existing = users::find_by_email(&state.db, &config.admin_email)
            .await
            .map_err(|error| error.to_string())?;
        let user = match existing {
            Some(user) => {
                users::update_password(&state.db, user.id, &hash)
                    .await
                    .map_err(|error| error.to_string())?;
                users::set_role_and_active(&state.db, user.id, "superadmin", true)
                    .await
                    .map_err(|error| error.to_string())?
            }
            None => users::create(
                &state.db,
                users::NewUser {
                    name: "Administrador AgroYachay",
                    email: &config.admin_email,
                    password_hash: Some(&hash),
                    google_sub: None,
                    avatar_url: None,
                    role: "superadmin",
                    locale: "es",
                },
            )
            .await
            .map_err(|error| error.to_string())?,
        };
        audit::record(
            &state.db,
            Some(user.id),
            "superadmin_bootstrap",
            Some(format!("user:{}", user.id)),
            &ClientInfo::default(),
            serde_json::json!({"email": user.email}),
        )
        .await;
        tracing::info!(email = %user.email, "superadmin bootstrapped");
    }
    Ok(())
}

async fn promote_env_superadmins(state: &AppState) -> Result<(), String> {
    for email in &state.config.superadmin_emails {
        let Some(user) = users::find_by_email(&state.db, email)
            .await
            .map_err(|error| error.to_string())?
        else {
            continue;
        };
        if !user.active || user.role == "superadmin" {
            continue;
        }
        users::set_role_and_active(&state.db, user.id, "superadmin", true)
            .await
            .map_err(|error| error.to_string())?;
        audit::record(
            &state.db,
            Some(user.id),
            "role_change",
            Some(format!("user:{}", user.id)),
            &ClientInfo::default(),
            serde_json::json!({"from": user.role, "to": "superadmin", "source": "env"}),
        )
        .await;
        tracing::info!(
            user_id = user.id,
            "user promoted to superadmin from SUPERADMIN_EMAILS"
        );
    }
    Ok(())
}

pub fn spawn_offline_monitor(state: AppState) -> tokio::task::JoinHandle<()> {
    tokio::spawn(async move {
        let mut ticker = tokio::time::interval(Duration::from_secs(60));
        loop {
            ticker.tick().await;
            match alerts::open_offline_alerts(&state.db, state.config.offline_after_minutes).await {
                Ok(0) => {}
                Ok(opened) => tracing::info!(opened, "offline alerts opened"),
                Err(error) => tracing::warn!(%error, "offline monitor failed"),
            }
        }
    })
}
