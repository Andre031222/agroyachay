mod common;

use axum::http::StatusCode;
use serde_json::{Value, json};

#[tokio::test]
async fn firmware_reading_is_accepted_and_creates_a_pending_device() {
    let app = common::spawn().await;
    let esp32_id = common::unique("AGV");
    let response = app
        .request(
            "POST",
            "/api/sensores/lectura",
            None,
            Some(json!({
                "esp32_id": esp32_id,
                "temperatura": 14.5,
                "humedad_aire": 61.2,
                "humedad_suelo": 43,
                "timestamp": 1_790_000_000
            })),
        )
        .await;
    assert_eq!(response.status, StatusCode::CREATED, "{}", response.body);
    let body = &response.body;
    assert_eq!(body["success"], json!(true));
    assert_eq!(body["esp32_id"], json!(esp32_id));
    assert_eq!(body["lecturas_procesadas"], json!(3));
    assert!(body["sensor_id"].as_i64().is_some());
    assert!(body["message"].as_str().is_some());
    assert!(
        body["timestamp"]
            .as_str()
            .is_some_and(|stamp| stamp.starts_with("2026-09-21"))
    );
    assert!(body.get("alertas").is_none());

    let status: String = sqlx::query_scalar("SELECT status FROM devices WHERE esp32_id = $1")
        .bind(&esp32_id)
        .fetch_one(&app.db)
        .await
        .unwrap();
    assert_eq!(status, "pending");
}

#[tokio::test]
async fn readings_array_and_old_timestamps_are_supported() {
    let app = common::spawn().await;
    let esp32_id = common::unique("AGV");
    let response = app
        .request(
            "POST",
            "/api/sensores/lectura",
            None,
            Some(json!({
                "esp32_id": esp32_id,
                "timestamp": 12,
                "lecturas": [
                    {"tipo": "temperatura_aire", "valor": 9.5, "unidad": "C"},
                    {"tipo": "humedad_suelo", "valor": 150, "unidad": "%"}
                ]
            })),
        )
        .await;
    assert_eq!(response.status, StatusCode::CREATED, "{}", response.body);
    assert_eq!(response.body["lecturas_procesadas"], json!(1));
    assert_eq!(response.body["errores"].as_array().map(Vec::len), Some(1));
    let stamp = response.body["timestamp"].as_str().unwrap();
    assert!(stamp.starts_with(&chrono::Utc::now().format("%Y-").to_string()));
}

#[tokio::test]
async fn invalid_firmware_payloads_return_legacy_400() {
    let app = common::spawn().await;
    let missing_id = app
        .request(
            "POST",
            "/api/sensores/lectura",
            None,
            Some(json!({"temperatura": 10.0})),
        )
        .await;
    assert_eq!(missing_id.status, StatusCode::BAD_REQUEST);
    assert_eq!(missing_id.body["success"], json!(false));
    assert!(missing_id.body["message"].as_str().is_some());

    let no_values = app
        .request(
            "POST",
            "/api/sensores/lectura",
            None,
            Some(json!({"esp32_id": common::unique("AGV"), "temperatura": 120.0})),
        )
        .await;
    assert_eq!(no_values.status, StatusCode::BAD_REQUEST);
    assert_eq!(no_values.body["success"], json!(false));

    let garbage = app.raw("POST", "/api/sensores/lectura", "not json").await;
    assert_eq!(garbage.status, StatusCode::BAD_REQUEST);
    assert_eq!(garbage.body["success"], json!(false));
}

#[tokio::test]
async fn recent_readings_return_last_nine_newest_first() {
    let app = common::spawn().await;
    let esp32_id = common::unique("AGV");
    for offset in 0..4 {
        let response = app
            .request(
                "POST",
                "/api/sensores/lectura",
                None,
                Some(json!({
                    "esp32_id": esp32_id,
                    "temperatura": 10.0 + f64::from(offset),
                    "humedad_aire": 50.0,
                    "humedad_suelo": 40,
                    "timestamp": 1_780_000_000 + offset * 30
                })),
            )
            .await;
        assert_eq!(response.status, StatusCode::CREATED);
    }
    let response = app
        .request(
            "GET",
            &format!("/api/sensores/lecturas-recientes?esp32_id={esp32_id}"),
            None,
            None,
        )
        .await;
    assert_eq!(response.status, StatusCode::OK, "{}", response.body);
    assert_eq!(response.body["success"], json!(true));
    assert_eq!(response.body["esp32_id"], json!(esp32_id));
    let readings = response.body["lecturas"].as_array().unwrap();
    assert_eq!(readings.len(), 9);
    let kinds: Vec<&str> = readings
        .iter()
        .map(|reading| reading["tipo_lectura"].as_str().unwrap())
        .collect();
    assert!(
        kinds
            .iter()
            .all(|kind| { ["temperatura_aire", "humedad_aire", "humedad_suelo"].contains(kind) })
    );
    assert!(readings.iter().all(|reading| reading["valor"].is_f64()));
    let newest_temperature = readings
        .iter()
        .find(|reading| reading["tipo_lectura"] == "temperatura_aire")
        .unwrap();
    assert_eq!(newest_temperature["valor"], json!(13.0));
    assert_eq!(newest_temperature["unidad"], json!("Celsius"));
    let stamps: Vec<&str> = readings
        .iter()
        .map(|reading| reading["timestamp"].as_str().unwrap())
        .collect();
    let mut sorted = stamps.clone();
    sorted.sort_unstable_by(|a, b| b.cmp(a));
    assert_eq!(stamps, sorted);
}

#[tokio::test]
async fn recent_readings_for_unknown_device_is_404() {
    let app = common::spawn().await;
    let response = app
        .request(
            "GET",
            "/api/sensores/lecturas-recientes?esp32_id=does-not-exist-anywhere",
            None,
            None,
        )
        .await;
    assert_eq!(response.status, StatusCode::NOT_FOUND);
    assert_eq!(response.body["success"], json!(false));
    assert_eq!(response.body["lecturas"], json!([]));
    assert!(response.body["message"].as_str().is_some());
}

#[tokio::test]
async fn legacy_login_returns_superset_shape() {
    let app = common::spawn().await;
    let (_, user_id, email) = app.register("Rosa Mamani").await;
    let response = app
        .request(
            "POST",
            "/api/auth/login",
            None,
            Some(json!({"username": email, "password": "correct horse battery"})),
        )
        .await;
    assert_eq!(response.status, StatusCode::OK, "{}", response.body);
    let body = &response.body;
    assert_eq!(body["success"], json!(true));
    let token = body["token"].as_str().unwrap();
    assert_eq!(body["data"]["token"].as_str(), Some(token));
    let user = &body["data"]["user"];
    assert_eq!(user["id"], json!(user_id));
    assert_eq!(user["nombre"], json!("Rosa Mamani"));
    assert_eq!(user["name"], json!("Rosa Mamani"));
    assert_eq!(user["email"], json!(email));
    assert_eq!(user["role"], json!("farmer"));
    assert_eq!(user["rol"], json!("farmer"));

    let me = app.request("GET", "/api/auth/me", Some(token), None).await;
    assert_eq!(me.status, StatusCode::OK);
    assert_eq!(me.body["data"]["id"], json!(user_id));

    let by_email = app
        .request(
            "POST",
            "/api/auth/login",
            None,
            Some(json!({"email": email.to_uppercase(), "password": "correct horse battery"})),
        )
        .await;
    assert_eq!(by_email.status, StatusCode::OK);
}

#[tokio::test]
async fn legacy_login_failure_is_401_with_success_false() {
    let app = common::spawn().await;
    let (_, _, email) = app.register("Juan Quispe").await;
    let response = app
        .request(
            "POST",
            "/api/auth/login",
            None,
            Some(json!({"username": email, "password": "wrong password"})),
        )
        .await;
    assert_eq!(response.status, StatusCode::UNAUTHORIZED);
    assert_eq!(response.body["success"], json!(false));
    assert!(response.body["message"].as_str().is_some());
    assert_eq!(response.body["error"]["code"], json!("invalid_credentials"));

    let audit_rows: i64 = sqlx::query_scalar(
        "SELECT count(*) FROM audit_log WHERE action = 'login_failed' AND target = $1",
    )
    .bind(format!("email:{email}"))
    .fetch_one(&app.db)
    .await
    .unwrap();
    assert_eq!(audit_rows, 1);
}

#[tokio::test]
async fn claimed_device_opens_alerts_and_appears_in_dashboard() {
    let app = common::spawn().await;
    let (token, _, _) = app.register("Lucia").await;
    let esp32_id = common::unique("AGV");
    let first = app
        .request(
            "POST",
            "/api/sensores/lectura",
            None,
            Some(json!({"esp32_id": esp32_id, "temperatura": 15.0, "humedad_aire": 60.0, "humedad_suelo": 50})),
        )
        .await;
    let device_id = first.body["sensor_id"].as_i64().unwrap();

    let pending = app
        .request("GET", "/api/devices/pending", Some(&token), None)
        .await;
    assert!(
        pending.body["data"]
            .as_array()
            .unwrap()
            .iter()
            .any(|device| device["id"] == json!(device_id))
    );

    let crop = app
        .request(
            "POST",
            "/api/crops",
            Some(&token),
            Some(json!({"name": "Parcela norte", "species": "papa", "area_ha": 1.5, "sowing_date": "2026-09-20"})),
        )
        .await;
    assert_eq!(crop.status, StatusCode::CREATED, "{}", crop.body);
    assert_eq!(crop.body["data"]["species"], json!("potato"));
    let crop_id = crop.body["data"]["id"].as_i64().unwrap();

    let claim = app
        .request(
            "POST",
            &format!("/api/devices/{device_id}/claim"),
            Some(&token),
            Some(json!({"name": "Sensor parcela", "crop_id": crop_id})),
        )
        .await;
    assert_eq!(claim.status, StatusCode::OK, "{}", claim.body);
    assert_eq!(claim.body["data"]["status"], json!("active"));
    assert_eq!(
        claim.body["data"]["thresholds"].as_array().unwrap().len(),
        3
    );

    let (other_token, _, _) = app.register("Intruso").await;
    let stolen = app
        .request(
            "POST",
            &format!("/api/devices/{device_id}/claim"),
            Some(&other_token),
            Some(json!({"name": "mine"})),
        )
        .await;
    assert_eq!(stolen.status, StatusCode::CONFLICT);

    let frost = app
        .request(
            "POST",
            "/api/sensores/lectura",
            None,
            Some(json!({"esp32_id": esp32_id, "temperatura": -3.0, "humedad_aire": 60.0, "humedad_suelo": 50})),
        )
        .await;
    assert_eq!(frost.status, StatusCode::CREATED);
    let alerts_in_response = frost.body["alertas"].as_array().unwrap();
    assert_eq!(alerts_in_response[0]["tipo"], json!("temperatura_aire"));
    assert_eq!(alerts_in_response[0]["nivel"], json!("bajo"));

    let again = app
        .request(
            "POST",
            "/api/sensores/lectura",
            None,
            Some(json!({"esp32_id": esp32_id, "temperatura": -4.0})),
        )
        .await;
    assert_eq!(again.status, StatusCode::CREATED);

    let alerts = app.request("GET", "/api/alerts", Some(&token), None).await;
    let open: Vec<&Value> = alerts.body["data"].as_array().unwrap().iter().collect();
    assert_eq!(open.len(), 1, "{}", alerts.body);
    assert_eq!(open[0]["kind"], json!("low"));
    assert_eq!(open[0]["threshold"], json!(2.0));

    let resolved = app
        .request(
            "POST",
            &format!("/api/alerts/{}/resolve", open[0]["id"]),
            Some(&token),
            None,
        )
        .await;
    assert_eq!(resolved.status, StatusCode::OK);
    assert!(resolved.body["data"]["resolved_at"].is_string());

    let readings = app
        .request(
            "GET",
            &format!("/api/devices/{device_id}/readings?range=24h"),
            Some(&token),
            None,
        )
        .await;
    assert_eq!(readings.status, StatusCode::OK);
    assert_eq!(readings.body["data"]["bucket"], json!("raw"));
    let series = readings.body["data"]["series"].as_array().unwrap();
    assert_eq!(series.len(), 3);

    let forbidden = app
        .request(
            "GET",
            &format!("/api/devices/{device_id}/readings?range=7d"),
            Some(&other_token),
            None,
        )
        .await;
    assert_eq!(forbidden.status, StatusCode::NOT_FOUND);

    let dashboard = app
        .request("GET", "/api/dashboard", Some(&token), None)
        .await;
    assert_eq!(dashboard.status, StatusCode::OK);
    assert_eq!(dashboard.body["data"]["counts"]["devices_active"], json!(1));
}

#[tokio::test]
async fn errors_are_localised_from_accept_language() {
    let app = common::spawn().await;
    let request = axum::http::Request::builder()
        .uri("/api/auth/me")
        .header("accept-language", "en-US,en;q=0.9")
        .body(axum::body::Body::empty())
        .unwrap();
    let response = app.send(request).await;
    assert_eq!(response.status, StatusCode::UNAUTHORIZED);
    assert_eq!(response.body["error"]["code"], json!("unauthorized"));
    assert_eq!(
        response.body["error"]["message"],
        json!("Please sign in to continue.")
    );
}

#[tokio::test]
async fn ai_endpoints_degrade_to_503_when_llamacpp_is_absent() {
    let app = common::spawn().await;
    let (token, _, _) = app.register("Ana").await;
    let response = app
        .request(
            "POST",
            "/api/assistant/chat",
            Some(&token),
            Some(json!({"messages": [{"role": "user", "content": "¿Cuándo aporcar la papa?"}], "locale": "es"})),
        )
        .await;
    assert_eq!(response.status, StatusCode::SERVICE_UNAVAILABLE);
    assert_eq!(response.body["error"]["code"], json!("ai_unavailable"));

    let health = app.request("GET", "/api/health", None, None).await;
    assert_eq!(health.status, StatusCode::OK);
    assert_eq!(health.body["data"]["database"], json!("ok"));
    assert_eq!(health.body["data"]["llm"], json!("unavailable"));
    assert_eq!(health.body["data"]["vision"], json!("unavailable"));
}
