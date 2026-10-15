use std::sync::Arc;
use std::time::{Duration, Instant};

use jsonwebtoken::jwk::JwkSet;
use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode, decode_header};
use serde::Deserialize;
use tokio::sync::RwLock;

use crate::error::AppError;

pub const GOOGLE_JWKS_URL: &str = "https://www.googleapis.com/oauth2/v3/certs";
pub const GOOGLE_ISSUERS: [&str; 2] = ["accounts.google.com", "https://accounts.google.com"];
const DEFAULT_JWKS_TTL: Duration = Duration::from_secs(3600);

#[derive(Debug, Clone, Deserialize)]
pub struct GoogleIdentity {
    pub sub: String,
    pub email: String,
    #[serde(default)]
    pub email_verified: bool,
    pub name: Option<String>,
    pub picture: Option<String>,
}

#[derive(Clone)]
pub struct GoogleVerifier {
    client_id: String,
    http: reqwest::Client,
    jwks_url: String,
    keys: Arc<RwLock<Option<(Instant, Duration, JwkSet)>>>,
}

fn max_age(headers: &reqwest::header::HeaderMap) -> Duration {
    headers
        .get(reqwest::header::CACHE_CONTROL)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| {
            value
                .split(',')
                .find_map(|part| part.trim().strip_prefix("max-age="))
                .and_then(|seconds| seconds.parse::<u64>().ok())
        })
        .map(Duration::from_secs)
        .unwrap_or(DEFAULT_JWKS_TTL)
}

impl GoogleVerifier {
    pub fn new(http: reqwest::Client, client_id: &str) -> Self {
        Self {
            client_id: client_id.to_string(),
            http,
            jwks_url: GOOGLE_JWKS_URL.to_string(),
            keys: Arc::new(RwLock::new(None)),
        }
    }

    pub fn is_configured(&self) -> bool {
        !self.client_id.is_empty()
    }

    async fn key_set(&self, force_refresh: bool) -> Result<JwkSet, AppError> {
        if !force_refresh
            && let Some((fetched_at, ttl, keys)) = self.keys.read().await.as_ref()
            && fetched_at.elapsed() < *ttl
        {
            return Ok(keys.clone());
        }
        let response = self
            .http
            .get(&self.jwks_url)
            .timeout(Duration::from_secs(8))
            .send()
            .await
            .map_err(|error| AppError::GoogleTokenInvalid(format!("jwks fetch: {error}")))?;
        let ttl = max_age(response.headers());
        let keys: JwkSet = response
            .json()
            .await
            .map_err(|error| AppError::GoogleTokenInvalid(format!("jwks decode: {error}")))?;
        *self.keys.write().await = Some((Instant::now(), ttl, keys.clone()));
        Ok(keys)
    }

    pub async fn verify(&self, credential: &str) -> Result<GoogleIdentity, AppError> {
        if !self.is_configured() {
            return Err(AppError::GoogleNotConfigured);
        }
        let header = decode_header(credential)
            .map_err(|error| AppError::GoogleTokenInvalid(error.to_string()))?;
        let key_id = header
            .kid
            .ok_or_else(|| AppError::GoogleTokenInvalid("missing kid".into()))?;
        let mut keys = self.key_set(false).await?;
        if keys.find(&key_id).is_none() {
            keys = self.key_set(true).await?;
        }
        let jwk = keys
            .find(&key_id)
            .ok_or_else(|| AppError::GoogleTokenInvalid("unknown signing key".into()))?;
        let decoding_key = DecodingKey::from_jwk(jwk)
            .map_err(|error| AppError::GoogleTokenInvalid(error.to_string()))?;
        let mut validation = Validation::new(Algorithm::RS256);
        validation.set_audience(&[self.client_id.as_str()]);
        validation.set_issuer(&GOOGLE_ISSUERS);
        validation.set_required_spec_claims(&["exp", "iss", "aud", "sub"]);
        let identity = decode::<GoogleIdentity>(credential, &decoding_key, &validation)
            .map_err(|error| AppError::GoogleTokenInvalid(error.to_string()))?
            .claims;
        if !identity.email_verified {
            return Err(AppError::GoogleTokenInvalid("email not verified".into()));
        }
        Ok(identity)
    }
}
