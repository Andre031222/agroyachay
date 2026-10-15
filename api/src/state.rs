use std::sync::{Arc, RwLock};
use std::time::Duration;

use sqlx::PgPool;

use crate::config::{Config, LlmProvider};
use crate::infra::google::GoogleVerifier;
use crate::infra::llm::{ChatModel, OpenAiChat};
use crate::infra::mailer::Mailer;
use crate::infra::rate_limit::RateLimiter;
use crate::infra::storage::Storage;
use crate::infra::weather::WeatherClient;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub config: Arc<Config>,
    pub llamacpp_text: Arc<dyn ChatModel>,
    pub groq_text: Arc<dyn ChatModel>,
    pub vision: Arc<dyn ChatModel>,
    pub provider: Arc<RwLock<LlmProvider>>,
    pub weather: WeatherClient,
    pub google: GoogleVerifier,
    pub auth_limiter: RateLimiter,
    pub storage: Storage,
    pub mailer: Mailer,
}

impl AppState {
    pub fn new(config: Config, db: PgPool) -> Result<Self, String> {
        let http = reqwest::Client::builder()
            .user_agent(concat!("agroyachay-api/", env!("CARGO_PKG_VERSION")))
            .connect_timeout(Duration::from_secs(5))
            .build()
            .map_err(|error| error.to_string())?;
        let llamacpp_text: Arc<dyn ChatModel> = Arc::new(OpenAiChat::llamacpp(
            http.clone(),
            &config.llamacpp_text_url,
            &config.llamacpp_api_key,
            &config.llamacpp_text_model,
            Duration::from_secs(config.text_timeout_secs),
        ));
        let groq_text: Arc<dyn ChatModel> = Arc::new(OpenAiChat::groq(
            http.clone(),
            &config.groq_url,
            &config.groq_api_key,
            &config.groq_model,
            Duration::from_secs(90),
        ));
        let vision: Arc<dyn ChatModel> = Arc::new(OpenAiChat::llamacpp(
            http.clone(),
            &config.llamacpp_vision_url,
            &config.llamacpp_api_key,
            &config.llamacpp_vision_model,
            Duration::from_secs(config.vision_timeout_secs),
        ));
        let mailer = Mailer::from_config(&config.smtp)?;
        Ok(Self {
            db,
            provider: Arc::new(RwLock::new(config.llm_provider.clone())),
            weather: WeatherClient::new(http.clone(), &config.open_meteo_url),
            google: GoogleVerifier::new(http, &config.google_client_id),
            auth_limiter: RateLimiter::per_minute(config.auth_rate_limit_per_minute),
            storage: Storage::new(config.upload_dir.clone()),
            config: Arc::new(config),
            llamacpp_text,
            groq_text,
            vision,
            mailer,
        })
    }

    pub fn llm_provider(&self) -> LlmProvider {
        match self.provider.read() {
            Ok(guard) => guard.clone(),
            Err(poisoned) => poisoned.into_inner().clone(),
        }
    }

    pub fn set_llm_provider(&self, provider: LlmProvider) {
        match self.provider.write() {
            Ok(mut guard) => *guard = provider,
            Err(poisoned) => *poisoned.into_inner() = provider,
        }
    }

    pub fn text_model(&self) -> Arc<dyn ChatModel> {
        match self.llm_provider() {
            LlmProvider::Groq => self.groq_text.clone(),
            LlmProvider::LlamaCpp => self.llamacpp_text.clone(),
        }
    }
}
