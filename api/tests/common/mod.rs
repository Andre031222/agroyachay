#![allow(dead_code)]

use agroyachay_api::config::Config;
use agroyachay_api::state::AppState;
use axum::Router;
use axum::body::Body;
use axum::http::{Request, StatusCode, header};
use http_body_util::BodyExt;
use serde_json::Value;
use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use sqlx::{ConnectOptions, Connection, PgPool};
use std::str::FromStr;
use tower::ServiceExt;

fn test_database_url() -> String {
    dotenvy::from_path(concat!(env!("CARGO_MANIFEST_DIR"), "/.env")).ok();
    if let Ok(url) = std::env::var("TEST_DATABASE_URL") {
        return url;
    }
    let base = std::env::var("DATABASE_URL")
        .expect("set TEST_DATABASE_URL or DATABASE_URL to run integration tests");
    match base.rsplit_once('/') {
        Some((prefix, _)) => format!("{prefix}/agroyachay_test"),
        None => base,
    }
}

async fn ensure_database(url: &str) {
    let options = PgConnectOptions::from_str(url).expect("valid TEST_DATABASE_URL");
    let name = options
        .get_database()
        .unwrap_or("agroyachay_test")
        .to_string();
    let mut admin = options
        .clone()
        .database("postgres")
        .connect()
        .await
        .expect("connect to maintenance database");
    let exists: bool =
        sqlx::query_scalar("SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = $1)")
            .bind(&name)
            .fetch_one(&mut admin)
            .await
            .expect("query pg_database");
    if !exists {
        let statement =
            sqlx::AssertSqlSafe(format!("CREATE DATABASE \"{}\"", name.replace('"', "")));
        if let Err(error) = sqlx::query(statement).execute(&mut admin).await {
            let duplicate = error
                .as_database_error()
                .and_then(|db| db.code())
                .is_some_and(|code| code == "42P04");
            assert!(duplicate, "could not create test database: {error}");
        }
    }
    admin.close().await.ok();
}

pub struct TestApp {
    pub router: Router,
    pub db: PgPool,
}

pub async fn spawn() -> TestApp {
    spawn_with(|_| {}).await
}

pub async fn spawn_with(customize: impl FnOnce(&mut Config)) -> TestApp {
    let url = test_database_url();
    ensure_database(&url).await;
    let db = PgPoolOptions::new()
        .max_connections(4)
        .connect(&url)
        .await
        .expect("connect to test database");
    let mut config = Config::for_tests(&url);
    customize(&mut config);
    let state = AppState::new(config, db.clone()).expect("state");
    agroyachay_api::bootstrap(&state).await.expect("bootstrap");
    TestApp {
        router: agroyachay_api::app(state),
        db,
    }
}

pub fn unique(prefix: &str) -> String {
    format!("{prefix}-{}", uuid::Uuid::new_v4().simple())
}

pub struct TestResponse {
    pub status: StatusCode,
    pub headers: axum::http::HeaderMap,
    pub body: Value,
}

impl TestApp {
    pub async fn request(
        &self,
        method: &str,
        uri: &str,
        token: Option<&str>,
        body: Option<Value>,
    ) -> TestResponse {
        let mut builder = Request::builder().method(method).uri(uri);
        if let Some(token) = token {
            builder = builder.header(header::AUTHORIZATION, format!("Bearer {token}"));
        }
        let request = match body {
            Some(value) => builder
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(value.to_string())),
            None => builder.body(Body::empty()),
        }
        .expect("request");
        self.send(request).await
    }

    pub async fn raw(&self, method: &str, uri: &str, content: &str) -> TestResponse {
        let request = Request::builder()
            .method(method)
            .uri(uri)
            .header(header::CONTENT_TYPE, "application/json")
            .body(Body::from(content.to_string()))
            .expect("request");
        self.send(request).await
    }

    pub async fn send(&self, request: Request<Body>) -> TestResponse {
        let response = self
            .router
            .clone()
            .oneshot(request)
            .await
            .expect("response");
        let status = response.status();
        let headers = response.headers().clone();
        let bytes = response
            .into_body()
            .collect()
            .await
            .expect("body")
            .to_bytes();
        let body = serde_json::from_slice(&bytes).unwrap_or(Value::Null);
        TestResponse {
            status,
            headers,
            body,
        }
    }

    pub async fn register(&self, name: &str) -> (String, i64, String) {
        let slug: String = name
            .chars()
            .filter(char::is_ascii_alphanumeric)
            .collect::<String>()
            .to_lowercase();
        let email = format!("{}@example.org", unique(&slug));
        let response = self
            .request(
                "POST",
                "/api/auth/register",
                None,
                Some(serde_json::json!({
                    "name": name, "email": email, "password": "correct horse battery"
                })),
            )
            .await;
        assert_eq!(response.status, StatusCode::CREATED, "{}", response.body);
        let token = response.body["data"]["token"]
            .as_str()
            .expect("token")
            .to_string();
        let id = response.body["data"]["user"]["id"].as_i64().expect("id");
        (token, id, email)
    }
}
