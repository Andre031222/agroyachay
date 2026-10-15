mod common;

use agroyachay_api::infra::repo::password_resets;
use axum::http::StatusCode;
use serde_json::{Value, json};

async fn store_token(app: &common::TestApp, user_id: i64, token: &str, minutes: i64) {
    sqlx::query(
        "INSERT INTO password_resets (user_id, token_hash, expires_at) \
         VALUES ($1, $2, now() + make_interval(mins => $3))",
    )
    .bind(user_id)
    .bind(password_resets::hash_token(token))
    .bind(minutes as i32)
    .execute(&app.db)
    .await
    .unwrap();
}

#[tokio::test]
async fn forgot_password_never_reveals_whether_an_account_exists() {
    let app = common::spawn().await;
    let (_, user_id, email) = app.register("Rosa").await;
    for address in [email.clone(), "nobody-here@example.org".to_string()] {
        let response = app
            .request(
                "POST",
                "/api/auth/password/forgot",
                None,
                Some(json!({"email": address, "locale": "qu"})),
            )
            .await;
        assert_eq!(response.status, StatusCode::OK, "{}", response.body);
        assert_eq!(response.body, json!({"data": {"sent": true}}));
    }
    let pending: i64 = sqlx::query_scalar(
        "SELECT count(*) FROM password_resets WHERE user_id = $1 AND used_at IS NULL",
    )
    .bind(user_id)
    .fetch_one(&app.db)
    .await
    .unwrap();
    assert_eq!(pending, 1);

    let again = app
        .request(
            "POST",
            "/api/auth/password/forgot",
            None,
            Some(json!({"email": email})),
        )
        .await;
    assert_eq!(again.status, StatusCode::OK);
    let (pending, total): (i64, i64) = sqlx::query_as(
        "SELECT count(*) FILTER (WHERE used_at IS NULL), count(*) FROM password_resets WHERE user_id = $1",
    )
    .bind(user_id)
    .fetch_one(&app.db)
    .await
    .unwrap();
    assert_eq!((pending, total), (1, 2));

    let actions: Vec<String> = sqlx::query_scalar(
        "SELECT action FROM audit_log WHERE user_id = $1 AND action = 'password_reset_request'",
    )
    .bind(user_id)
    .fetch_all(&app.db)
    .await
    .unwrap();
    assert_eq!(actions.len(), 2);

    let invalid = app
        .request(
            "POST",
            "/api/auth/password/forgot",
            None,
            Some(json!({"email": "not-an-email"})),
        )
        .await;
    assert_eq!(invalid.status, StatusCode::UNPROCESSABLE_ENTITY);
}

#[tokio::test]
async fn reset_token_sets_a_new_password_once_and_signs_in() {
    let app = common::spawn().await;
    let (_, user_id, email) = app.register("Teodoro").await;
    let token = common::unique("reset");
    store_token(&app, user_id, &token, 60).await;

    let short = app
        .request(
            "POST",
            "/api/auth/password/reset",
            None,
            Some(json!({"token": token, "new_password": "short"})),
        )
        .await;
    assert_eq!(short.status, StatusCode::UNPROCESSABLE_ENTITY);

    let response = app
        .request(
            "POST",
            "/api/auth/password/reset",
            None,
            Some(json!({"token": token, "new_password": "nueva clave segura"})),
        )
        .await;
    assert_eq!(response.status, StatusCode::OK, "{}", response.body);
    assert!(response.body["data"]["token"].as_str().is_some());
    assert_eq!(response.body["data"]["user"]["id"], json!(user_id));

    let login = app
        .request(
            "POST",
            "/api/auth/login",
            None,
            Some(json!({"email": email, "password": "nueva clave segura"})),
        )
        .await;
    assert_eq!(login.status, StatusCode::OK);

    let reused = app
        .request(
            "POST",
            "/api/auth/password/reset",
            None,
            Some(json!({"token": token, "new_password": "otra clave segura"})),
        )
        .await;
    assert_eq!(reused.status, StatusCode::BAD_REQUEST);
    assert_eq!(reused.body["error"]["code"], json!("reset_token_invalid"));

    let expired = common::unique("expired");
    store_token(&app, user_id, &expired, -1).await;
    let late = app
        .request(
            "POST",
            "/api/auth/password/reset",
            None,
            Some(json!({"token": expired, "new_password": "otra clave segura"})),
        )
        .await;
    assert_eq!(late.status, StatusCode::BAD_REQUEST);
    assert_eq!(late.body["error"]["code"], json!("reset_token_invalid"));

    let audited: i64 = sqlx::query_scalar(
        "SELECT count(*) FROM audit_log WHERE user_id = $1 AND action = 'password_reset'",
    )
    .bind(user_id)
    .fetch_one(&app.db)
    .await
    .unwrap();
    assert_eq!(audited, 1);
}

#[tokio::test]
async fn google_only_accounts_gain_a_password_by_reset() {
    let app = common::spawn().await;
    let email = format!("{}@example.org", common::unique("google"));
    let user_id: i64 = sqlx::query_scalar(
        "INSERT INTO users (name, email, google_sub) VALUES ('Lucía', $1, $2) RETURNING id",
    )
    .bind(&email)
    .bind(common::unique("sub"))
    .fetch_one(&app.db)
    .await
    .unwrap();
    let token = common::unique("reset");
    store_token(&app, user_id, &token, 60).await;
    let response = app
        .request(
            "POST",
            "/api/auth/password/reset",
            None,
            Some(json!({"token": token, "new_password": "clave para lucia"})),
        )
        .await;
    assert_eq!(response.status, StatusCode::OK, "{}", response.body);
    let user: &Value = &response.body["data"]["user"];
    assert_eq!(user["has_password"], json!(true));
    assert_eq!(user["google_linked"], json!(true));
}

#[tokio::test]
async fn listed_emails_become_superadmin_without_demotions() {
    let existing = format!("{}@example.org", common::unique("boss"));
    let fresh = format!("{}@Example.org", common::unique("chief"));
    {
        let app = common::spawn().await;
        let response = app
            .request(
                "POST",
                "/api/auth/register",
                None,
                Some(
                    json!({"name": "Boss", "email": existing, "password": "correct horse battery"}),
                ),
            )
            .await;
        assert_eq!(response.status, StatusCode::CREATED);
        assert_eq!(response.body["data"]["user"]["role"], json!("farmer"));
    }
    let listed = format!("{}, {}", existing.to_uppercase(), fresh);
    let app = common::spawn_with(|config| {
        config.superadmin_emails = agroyachay_api::config::parse_email_list(&listed);
    })
    .await;
    let (role, id): (String, i64) =
        sqlx::query_as("SELECT role, id FROM users WHERE lower(email) = lower($1)")
            .bind(&existing)
            .fetch_one(&app.db)
            .await
            .unwrap();
    assert_eq!(role, "superadmin");
    let meta: Value = sqlx::query_scalar(
        "SELECT meta FROM audit_log WHERE user_id = $1 AND action = 'role_change' ORDER BY id DESC LIMIT 1",
    )
    .bind(id)
    .fetch_one(&app.db)
    .await
    .unwrap();
    assert_eq!(meta["source"], json!("env"));

    let created = app
        .request(
            "POST",
            "/api/auth/register",
            None,
            Some(json!({"name": "Chief", "email": fresh, "password": "correct horse battery"})),
        )
        .await;
    assert_eq!(created.status, StatusCode::CREATED, "{}", created.body);
    assert_eq!(created.body["data"]["user"]["role"], json!("superadmin"));

    let (_, farmer_id, _) = app.register("Farmer").await;
    let role: String = sqlx::query_scalar("SELECT role FROM users WHERE id = $1")
        .bind(farmer_id)
        .fetch_one(&app.db)
        .await
        .unwrap();
    assert_eq!(role, "farmer");
}
