use std::env;
use std::path::PathBuf;

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum LlmProvider {
    LlamaCpp,
    Groq,
}

impl LlmProvider {
    pub fn parse(value: &str) -> Option<Self> {
        match value.trim().to_ascii_lowercase().as_str() {
            "llamacpp" | "llama.cpp" | "llama-cpp" | "llama_cpp" => Some(Self::LlamaCpp),
            "groq" => Some(Self::Groq),
            _ => None,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::LlamaCpp => "llamacpp",
            Self::Groq => "groq",
        }
    }
}

#[derive(Clone, Debug, Default)]
pub struct SmtpConfig {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub from: String,
}

impl SmtpConfig {
    pub fn is_configured(&self) -> bool {
        !self.host.is_empty()
    }
}

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub host: String,
    pub port: u16,
    pub public_url: String,
    pub cors_origins: Vec<String>,
    pub google_client_id: String,
    pub llm_provider: LlmProvider,
    pub llamacpp_text_url: String,
    pub llamacpp_vision_url: String,
    pub llamacpp_text_model: String,
    pub llamacpp_vision_model: String,
    pub llamacpp_api_key: String,
    pub groq_api_key: String,
    pub groq_model: String,
    pub groq_url: String,
    pub upload_dir: PathBuf,
    pub admin_email: String,
    pub admin_password: String,
    pub superadmin_emails: Vec<String>,
    pub smtp: SmtpConfig,
    pub auth_rate_limit_per_minute: u32,
    pub open_meteo_url: String,
    pub offline_after_minutes: i64,
    pub vision_max_side: u32,
    pub text_timeout_secs: u64,
    pub vision_timeout_secs: u64,
}

pub fn parse_email_list(value: &str) -> Vec<String> {
    let mut emails: Vec<String> = value
        .split([',', ';', ' '])
        .map(|email| email.trim().to_lowercase())
        .filter(|email| email.contains('@'))
        .collect();
    emails.sort();
    emails.dedup();
    emails
}

fn read(key: &str, default: &str) -> String {
    env::var(key)
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| default.to_string())
}

impl Config {
    pub fn from_env() -> Result<Self, String> {
        let database_url = read("DATABASE_URL", "");
        if database_url.is_empty() {
            return Err("DATABASE_URL is required".into());
        }
        let jwt_secret = read("JWT_SECRET", "");
        if jwt_secret.len() < 16 {
            return Err("JWT_SECRET must be at least 16 characters".into());
        }
        let provider_name = read("LLM_PROVIDER", "llamacpp");
        let llm_provider = LlmProvider::parse(&provider_name)
            .ok_or_else(|| format!("LLM_PROVIDER must be llamacpp or groq, got {provider_name}"))?;
        Ok(Self {
            database_url,
            jwt_secret,
            host: read("HOST", "0.0.0.0"),
            port: read("PORT", "5000")
                .parse()
                .map_err(|_| "PORT must be a number".to_string())?,
            public_url: read("PUBLIC_URL", "http://localhost:3000"),
            cors_origins: read("CORS_ORIGINS", "http://localhost:3000")
                .split(',')
                .map(|origin| origin.trim().trim_end_matches('/').to_string())
                .filter(|origin| !origin.is_empty())
                .collect(),
            google_client_id: read("GOOGLE_CLIENT_ID", ""),
            llm_provider,
            llamacpp_text_url: read("LLAMACPP_TEXT_URL", "http://127.0.0.1:8081"),
            llamacpp_vision_url: read("LLAMACPP_VISION_URL", "http://127.0.0.1:8082"),
            llamacpp_text_model: read("LLAMACPP_TEXT_MODEL", "qwen3-4b-instruct"),
            llamacpp_vision_model: read("LLAMACPP_VISION_MODEL", "qwen2.5-vl-3b"),
            llamacpp_api_key: read("LLAMACPP_API_KEY", ""),
            groq_api_key: read("GROQ_API_KEY", ""),
            groq_model: read("GROQ_MODEL", "openai/gpt-oss-120b"),
            groq_url: read("GROQ_URL", "https://api.groq.com/openai/v1")
                .trim_end_matches('/')
                .to_string(),
            upload_dir: PathBuf::from(read("UPLOAD_DIR", "./uploads")),
            admin_email: read("ADMIN_EMAIL", ""),
            admin_password: read("ADMIN_PASSWORD", ""),
            superadmin_emails: parse_email_list(&read("SUPERADMIN_EMAILS", "")),
            smtp: SmtpConfig {
                host: read("SMTP_HOST", ""),
                port: read("SMTP_PORT", "587")
                    .parse()
                    .map_err(|_| "SMTP_PORT must be a number".to_string())?,
                username: read("SMTP_USERNAME", ""),
                password: read("SMTP_PASSWORD", ""),
                from: read("SMTP_FROM", "AgroYachay <no-reply@ginit.dev>"),
            },
            auth_rate_limit_per_minute: read("AUTH_RATE_LIMIT_PER_MINUTE", "10")
                .parse()
                .map_err(|_| "AUTH_RATE_LIMIT_PER_MINUTE must be a number".to_string())?,
            open_meteo_url: read("OPEN_METEO_URL", "https://api.open-meteo.com/v1/forecast"),
            offline_after_minutes: read("OFFLINE_AFTER_MINUTES", "15")
                .parse()
                .map_err(|_| "OFFLINE_AFTER_MINUTES must be a number".to_string())?,
            vision_max_side: read("VISION_MAX_SIDE", "768")
                .parse()
                .map_err(|_| "VISION_MAX_SIDE must be a number".to_string())?,
            text_timeout_secs: read("LLM_TEXT_TIMEOUT_SECS", "150")
                .parse()
                .map_err(|_| "LLM_TEXT_TIMEOUT_SECS must be a number".to_string())?,
            vision_timeout_secs: read("LLM_VISION_TIMEOUT_SECS", "180")
                .parse()
                .map_err(|_| "LLM_VISION_TIMEOUT_SECS must be a number".to_string())?,
        })
    }

    pub fn for_tests(database_url: &str) -> Self {
        Self {
            database_url: database_url.to_string(),
            jwt_secret: "test-secret-with-enough-length".into(),
            host: "127.0.0.1".into(),
            port: 0,
            public_url: "http://localhost:3000".into(),
            cors_origins: vec!["http://localhost:3000".into()],
            google_client_id: String::new(),
            llm_provider: LlmProvider::LlamaCpp,
            llamacpp_text_url: "http://127.0.0.1:9".into(),
            llamacpp_vision_url: "http://127.0.0.1:9".into(),
            llamacpp_text_model: "qwen3-4b-instruct".into(),
            llamacpp_vision_model: "qwen2.5-vl-3b".into(),
            llamacpp_api_key: String::new(),
            groq_api_key: String::new(),
            groq_model: "openai/gpt-oss-120b".into(),
            groq_url: "https://api.groq.com/openai/v1".into(),
            upload_dir: env::temp_dir().join("agroyachay-test-uploads"),
            admin_email: String::new(),
            admin_password: String::new(),
            superadmin_emails: Vec::new(),
            smtp: SmtpConfig::default(),
            auth_rate_limit_per_minute: 1000,
            open_meteo_url: "http://127.0.0.1:9/forecast".into(),
            offline_after_minutes: 15,
            vision_max_side: 768,
            text_timeout_secs: 150,
            vision_timeout_secs: 180,
        }
    }
}

impl Config {
    pub fn is_superadmin_email(&self, email: &str) -> bool {
        let email = email.trim().to_lowercase();
        self.superadmin_emails.contains(&email)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn providers_and_superadmin_lists_are_parsed() {
        assert_eq!(
            LlmProvider::parse(" LlamaCpp "),
            Some(LlmProvider::LlamaCpp)
        );
        assert_eq!(LlmProvider::parse("groq"), Some(LlmProvider::Groq));
        assert_eq!(LlmProvider::parse("ollama"), None);
        assert_eq!(
            parse_email_list(" A@x.org, b@y.org,,a@X.org;nope "),
            vec!["a@x.org".to_string(), "b@y.org".to_string()]
        );
        let mut config = Config::for_tests("postgres://localhost/agroyachay_test");
        config.superadmin_emails = parse_email_list("Root@Example.org");
        assert!(config.is_superadmin_email(" root@EXAMPLE.org"));
        assert!(!config.is_superadmin_email("other@example.org"));
    }
}
