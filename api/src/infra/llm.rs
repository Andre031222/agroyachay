use std::time::Duration;

use async_trait::async_trait;
use serde_json::{Value, json};

use crate::domain::ai_schema::{extract_json_object, strip_reasoning};
use crate::error::AppError;

#[derive(Clone, Debug, PartialEq)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
    pub images: Vec<String>,
}

impl ChatMessage {
    fn new(role: &str, content: impl Into<String>) -> Self {
        Self {
            role: role.into(),
            content: content.into(),
            images: Vec::new(),
        }
    }

    pub fn system(content: impl Into<String>) -> Self {
        Self::new("system", content)
    }

    pub fn user(content: impl Into<String>) -> Self {
        Self::new("user", content)
    }

    pub fn assistant(content: impl Into<String>) -> Self {
        Self::new("assistant", content)
    }

    pub fn user_with_image(content: impl Into<String>, mime: &str, image_base64: &str) -> Self {
        Self {
            images: vec![format!("data:{mime};base64,{image_base64}")],
            ..Self::new("user", content)
        }
    }

    pub fn to_wire(&self) -> Value {
        if self.images.is_empty() {
            return json!({"role": self.role, "content": self.content});
        }
        let mut parts: Vec<Value> = self
            .images
            .iter()
            .map(|url| json!({"type": "image_url", "image_url": {"url": url}}))
            .collect();
        parts.push(json!({"type": "text", "text": self.content}));
        json!({"role": self.role, "content": parts})
    }
}

#[derive(Clone, Copy, Debug)]
pub struct ChatOptions {
    pub temperature: f32,
    pub json: bool,
    pub max_tokens: u32,
}

impl ChatOptions {
    pub fn text(temperature: f32) -> Self {
        Self {
            temperature,
            json: false,
            max_tokens: 1200,
        }
    }

    pub fn json(temperature: f32) -> Self {
        Self {
            temperature,
            json: true,
            max_tokens: 2000,
        }
    }
}

#[derive(Debug, thiserror::Error)]
pub enum LlmError {
    #[error("model unavailable: {0}")]
    Unavailable(String),
    #[error("unexpected model response: {0}")]
    BadResponse(String),
}

impl From<LlmError> for AppError {
    fn from(error: LlmError) -> Self {
        match error {
            LlmError::Unavailable(reason) => AppError::AiUnavailable(reason),
            LlmError::BadResponse(reason) => {
                tracing::warn!(%reason, "model returned an unusable response");
                AppError::AiInvalidResponse
            }
        }
    }
}

#[async_trait]
pub trait ChatModel: Send + Sync {
    fn provider(&self) -> &'static str;
    fn model(&self) -> &str;
    async fn chat(
        &self,
        messages: &[ChatMessage],
        options: ChatOptions,
    ) -> Result<String, LlmError>;
    async fn is_available(&self) -> bool;
}

async fn classify_status(response: reqwest::Response) -> Result<Value, LlmError> {
    let status = response.status();
    if status.is_success() {
        return response
            .json::<Value>()
            .await
            .map_err(|error| LlmError::BadResponse(error.to_string()));
    }
    let body = response.text().await.unwrap_or_default();
    let summary: String = body.chars().take(300).collect();
    match status.as_u16() {
        401 | 403 => Err(LlmError::Unavailable(format!(
            "{status}: credentials rejected"
        ))),
        404 | 429 => Err(LlmError::Unavailable(format!("{status}: {summary}"))),
        _ if status.is_server_error() => Err(LlmError::Unavailable(format!("{status}: {summary}"))),
        _ => Err(LlmError::BadResponse(format!("{status}: {summary}"))),
    }
}

pub struct OpenAiChat {
    http: reqwest::Client,
    provider: &'static str,
    base_url: String,
    health_url: Option<String>,
    api_key: Option<String>,
    model: String,
    timeout: Duration,
}

impl OpenAiChat {
    pub fn llamacpp(
        http: reqwest::Client,
        server_url: &str,
        api_key: &str,
        model: &str,
        timeout: Duration,
    ) -> Self {
        let server = server_url.trim_end_matches('/');
        let server = server.strip_suffix("/v1").unwrap_or(server);
        Self {
            http,
            provider: "llamacpp",
            base_url: format!("{server}/v1"),
            health_url: Some(format!("{server}/health")),
            api_key: Some(api_key.trim().to_string()).filter(|key| !key.is_empty()),
            model: model.to_string(),
            timeout,
        }
    }

    pub fn groq(
        http: reqwest::Client,
        base_url: &str,
        api_key: &str,
        model: &str,
        timeout: Duration,
    ) -> Self {
        Self {
            http,
            provider: "groq",
            base_url: base_url.trim_end_matches('/').to_string(),
            health_url: None,
            api_key: Some(api_key.trim().to_string()),
            model: model.to_string(),
            timeout,
        }
    }

    fn missing_key(&self) -> bool {
        self.api_key.as_deref().is_some_and(str::is_empty)
    }

    fn authorized(&self, request: reqwest::RequestBuilder) -> reqwest::RequestBuilder {
        match self.api_key.as_deref() {
            Some(key) if !key.is_empty() => request.bearer_auth(key),
            _ => request,
        }
    }

    pub fn request_body(&self, messages: &[ChatMessage], options: ChatOptions) -> Value {
        let mut body = json!({
            "model": self.model,
            "messages": messages.iter().map(ChatMessage::to_wire).collect::<Vec<_>>(),
            "temperature": options.temperature,
            "max_tokens": options.max_tokens,
            "stream": false,
        });
        if options.json {
            body["response_format"] = json!({"type": "json_object"});
        }
        body
    }
}

#[async_trait]
impl ChatModel for OpenAiChat {
    fn provider(&self) -> &'static str {
        self.provider
    }

    fn model(&self) -> &str {
        &self.model
    }

    async fn chat(
        &self,
        messages: &[ChatMessage],
        options: ChatOptions,
    ) -> Result<String, LlmError> {
        if self.missing_key() {
            return Err(LlmError::Unavailable(format!(
                "{} API key is not set",
                self.provider
            )));
        }
        let request = self
            .http
            .post(format!("{}/chat/completions", self.base_url))
            .timeout(self.timeout)
            .json(&self.request_body(messages, options));
        let response = self
            .authorized(request)
            .send()
            .await
            .map_err(|error| LlmError::Unavailable(error.to_string()))?;
        let payload = classify_status(response).await?;
        payload
            .pointer("/choices/0/message/content")
            .and_then(Value::as_str)
            .map(strip_reasoning)
            .filter(|text| !text.is_empty())
            .ok_or_else(|| LlmError::BadResponse("empty completion".into()))
    }

    async fn is_available(&self) -> bool {
        if self.missing_key() {
            return false;
        }
        let models = format!("{}/models", self.base_url);
        let candidates = self
            .health_url
            .iter()
            .cloned()
            .chain(std::iter::once(models));
        for url in candidates {
            let request = self.http.get(url).timeout(Duration::from_secs(3));
            if self
                .authorized(request)
                .send()
                .await
                .is_ok_and(|response| response.status().is_success())
            {
                return true;
            }
        }
        false
    }
}

pub async fn chat_json<T>(
    model: &dyn ChatModel,
    mut messages: Vec<ChatMessage>,
    options: ChatOptions,
    parse: impl Fn(&Value) -> Result<T, String>,
) -> Result<T, AppError> {
    let mut last_problem = String::new();
    for attempt in 0..2 {
        let reply = model.chat(&messages, options).await?;
        match extract_json_object(&reply).ok_or_else(|| "no JSON object found".to_string()) {
            Ok(value) => match parse(&value) {
                Ok(parsed) => return Ok(parsed),
                Err(problem) => last_problem = problem,
            },
            Err(problem) => last_problem = problem,
        }
        let snippet: String = reply.chars().take(300).collect();
        tracing::warn!(attempt, problem = %last_problem, reply = %snippet, "model reply rejected");
        if attempt == 0 {
            messages.push(ChatMessage::assistant(reply));
            messages.push(ChatMessage::user(format!(
                "The previous answer was not valid ({last_problem}). Reply again with ONLY the JSON object in the exact schema requested, no extra text."
            )));
        }
    }
    Err(LlmError::BadResponse(last_problem).into())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    struct ScriptedModel {
        replies: Mutex<Vec<String>>,
    }

    #[async_trait]
    impl ChatModel for ScriptedModel {
        fn provider(&self) -> &'static str {
            "scripted"
        }

        fn model(&self) -> &str {
            "scripted"
        }

        async fn chat(
            &self,
            _messages: &[ChatMessage],
            _options: ChatOptions,
        ) -> Result<String, LlmError> {
            let mut replies = self.replies.lock().unwrap();
            if replies.is_empty() {
                Err(LlmError::Unavailable("no more replies".into()))
            } else {
                Ok(replies.remove(0))
            }
        }

        async fn is_available(&self) -> bool {
            true
        }
    }

    fn requires_answer(value: &Value) -> Result<String, String> {
        value
            .get("answer")
            .and_then(Value::as_str)
            .map(str::to_string)
            .ok_or_else(|| "missing answer".to_string())
    }

    #[tokio::test]
    async fn invalid_json_is_retried_once() {
        let model = ScriptedModel {
            replies: Mutex::new(vec!["not json".into(), "{\"answer\": \"ok\"}".into()]),
        };
        let result = chat_json(&model, vec![], ChatOptions::json(0.0), requires_answer).await;
        assert_eq!(result.unwrap(), "ok");
    }

    #[tokio::test]
    async fn second_invalid_answer_is_an_error() {
        let model = ScriptedModel {
            replies: Mutex::new(vec!["{}".into(), "{\"other\": 1}".into()]),
        };
        let result = chat_json(&model, vec![], ChatOptions::json(0.0), requires_answer).await;
        assert!(matches!(result, Err(AppError::AiInvalidResponse)));
    }

    #[tokio::test]
    async fn unreachable_llamacpp_is_reported_as_unavailable() {
        let model = OpenAiChat::llamacpp(
            reqwest::Client::new(),
            "http://127.0.0.1:9",
            "",
            "qwen3-4b-instruct",
            Duration::from_secs(2),
        );
        assert!(!model.is_available().await);
        let error = model
            .chat(&[ChatMessage::user("hola")], ChatOptions::text(0.2))
            .await
            .unwrap_err();
        assert!(matches!(error, LlmError::Unavailable(_)));
    }

    #[tokio::test]
    async fn groq_without_key_is_unavailable() {
        let model = OpenAiChat::groq(
            reqwest::Client::new(),
            "https://api.groq.com/openai/v1",
            "",
            "openai/gpt-oss-120b",
            Duration::from_secs(2),
        );
        assert!(!model.is_available().await);
        let error = model
            .chat(&[ChatMessage::user("hola")], ChatOptions::text(0.2))
            .await
            .unwrap_err();
        assert!(matches!(error, LlmError::Unavailable(_)));
    }

    #[test]
    fn vision_messages_use_openai_content_parts() {
        let model = OpenAiChat::llamacpp(
            reqwest::Client::new(),
            "http://127.0.0.1:8082/v1/",
            "",
            "qwen2.5-vl-3b",
            Duration::from_secs(2),
        );
        let message = ChatMessage::user_with_image("describe", "image/jpeg", "QUJD");
        let body = model.request_body(&[message], ChatOptions::json(0.0));
        assert_eq!(
            body["messages"][0]["content"][0]["image_url"]["url"],
            json!("data:image/jpeg;base64,QUJD")
        );
        assert_eq!(body["messages"][0]["content"][1]["type"], json!("text"));
        assert_eq!(body["response_format"]["type"], json!("json_object"));
        assert_eq!(model.base_url, "http://127.0.0.1:8082/v1");
        assert_eq!(
            model.health_url.as_deref(),
            Some("http://127.0.0.1:8082/health")
        );
        let text = model.request_body(&[ChatMessage::user("hola")], ChatOptions::text(0.2));
        assert_eq!(text["messages"][0]["content"], json!("hola"));
        assert!(text.get("response_format").is_none());
    }
}
