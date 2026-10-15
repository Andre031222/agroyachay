# AgroYachay API

Rust service for AgroYachay 3.0.0 (edition 2024, Axum 0.8, SQLx 0.9, Tokio,
PostgreSQL 17; 14 or newer works). The contract is in
[`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) and the endpoint reference
in [`../docs/API.md`](../docs/API.md).

## Run

```bash
cp .env.example .env          # set DATABASE_URL, JWT_SECRET, PUBLIC_URL, ADMIN_EMAIL, ADMIN_PASSWORD
createdb agroyachay
cargo run                     # migrations run on startup; a superadmin is created from ADMIN_* if none exists
curl localhost:5000/api/health
```

`.env.example` sets `PUBLIC_URL` to the production origin; use
`PUBLIC_URL=http://localhost:3000` in development so that password-reset links
point to the local web server.

The server binds `HOST` (default `0.0.0.0`, so ESP32 nodes on the LAN can reach
it) and `PORT` (default `5000`, the address AgroCommish proposes for a LAN
server). The reference production deployment sets `PORT=9011` behind nginx
(see [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md)); the Docker Compose
stack uses `9001`.

On macOS the AirPlay receiver (ControlCenter) listens on port 5000. Either
disable *System Settings → General → AirDrop & Handoff → AirPlay Receiver* or
run on another port, for example `PORT=9001 cargo run`, and start the web
server with `API_PROXY_TARGET=http://127.0.0.1:9001`.

## Models

Text and vision go through one OpenAI-compatible client
(`POST {url}/v1/chat/completions`). Any server that speaks that API works; the
two used in practice are:

| Setup | `LLAMACPP_TEXT_URL` / `LLAMACPP_VISION_URL` | `LLAMACPP_TEXT_MODEL` / `LLAMACPP_VISION_MODEL` |
|---|---|---|
| llama.cpp, two `llama-server` processes (development) | `http://127.0.0.1:8081` / `http://127.0.0.1:8082` | `qwen3-4b-instruct` / `qwen2.5-vl-3b` (the `--alias` of each server) |
| Ollama, one server for both (reference production) | `http://127.0.0.1:11434` / `http://127.0.0.1:11434` | `qwen2.5vl:3b` / `qwen2.5vl:3b` |

The variable names keep the `LLAMACPP_` prefix for both. A trailing `/v1` in
the URL is accepted. Availability is checked with `GET {url}/health` and, when
that fails (Ollama has no `/health`), `GET {url}/v1/models`. Without a model
server the API still starts: `/api/health` reports `llm` and `vision` as
`unavailable` and AI endpoints answer `503 {"error":{"code":"ai_unavailable",…}}`.
See [`../deploy/llama-cpp.md`](../deploy/llama-cpp.md).

Values that contain spaces or `<`/`>` (for example `SMTP_FROM`) must be quoted
in `.env`: `SMTP_FROM="AgroYachay <no-reply@ginit.dev>"`. An unquoted value
stops `.env` loading at that line; the API logs a warning when this happens.

## Test

```bash
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo test --lib              # unit tests only: no database, network or models
cargo test                    # unit and integration tests
```

Integration tests (`tests/compat.rs`, `tests/accounts.rs`) need PostgreSQL.
They use `TEST_DATABASE_URL`, or `DATABASE_URL` with the database name replaced
by `agroyachay_test`, and create that database when it does not exist (the role
needs `CREATEDB`).

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | required | PostgreSQL connection string |
| `JWT_SECRET` | required (≥ 16 chars) | HS256 signing key |
| `HOST` / `PORT` | `0.0.0.0` / `5000` | listen address |
| `PUBLIC_URL` | `http://localhost:3000` | public web origin, used in password-reset links |
| `CORS_ORIGINS` | `http://localhost:3000` | comma-separated allowed origins |
| `GOOGLE_CLIENT_ID` | empty (Google sign-in disabled) | audience for Google ID tokens |
| `LLM_PROVIDER` | `llamacpp` | text engine, `llamacpp` (any OpenAI-compatible server, including Ollama) or `groq`; overridable at runtime from admin settings |
| `LLAMACPP_TEXT_URL` | `http://127.0.0.1:8081` | OpenAI-compatible server for the text model |
| `LLAMACPP_VISION_URL` | `http://127.0.0.1:8082` | OpenAI-compatible server for the vision model (always used for photos) |
| `LLAMACPP_TEXT_MODEL` / `LLAMACPP_VISION_MODEL` | `qwen3-4b-instruct` / `qwen2.5-vl-3b` | model names sent in each request |
| `VISION_MAX_SIDE` | `768` | longest side, in pixels, of the copy sent to the vision model (0 keeps the original) |
| `LLM_TEXT_TIMEOUT_SECS` / `LLM_VISION_TIMEOUT_SECS` | `150` / `180` | request timeouts; raise them on CPU-only servers |
| `LLAMACPP_API_KEY` | empty | bearer key, only when the model server requires one |
| `GROQ_API_KEY` / `GROQ_MODEL` | empty / `openai/gpt-oss-120b` | Groq text adapter (`GROQ_URL` defaults to `https://api.groq.com/openai/v1`) |
| `UPLOAD_DIR` | `./uploads` | diagnosis images |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | empty | bootstrap superadmin, created only when no superadmin exists |
| `SUPERADMIN_EMAILS` | empty | comma-separated e-mails that are always superadmin (promoted at startup, on registration and on Google sign-in; nobody is demoted automatically) |
| `SMTP_HOST` / `SMTP_PORT` | empty / `587` | mail server for password recovery; `587` uses STARTTLS, `465` implicit TLS; empty host logs the reset link instead of sending it |
| `SMTP_USERNAME` / `SMTP_PASSWORD` | empty | SMTP credentials (Gmail: an App Password) |
| `SMTP_FROM` | `AgroYachay <no-reply@ginit.dev>` | sender mailbox (quote it in `.env`) |
| `AUTH_RATE_LIMIT_PER_MINUTE` | `10` | per-IP limit on login, register, google, password change, forgot and reset |
| `OFFLINE_AFTER_MINUTES` | `15` | silence before an `offline` alert is opened |
| `OPEN_METEO_URL` | `https://api.open-meteo.com/v1/forecast` | weather source (no key) |
| `TEST_DATABASE_URL` | derived | database for integration tests |
| `RUST_LOG` | `agroyachay_api=info,tower_http=info` | log filter |

## v1 data

`../deploy/migrate_v1.sql` copies users, crops, sensors and readings from the
v1 database `as_terrasense` with `dblink`; see the header of that file and
[`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md) §7.
