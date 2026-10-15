# Deployment (production)

This guide installs AgroYachay 3.0.0 on a Debian 12 server. It describes the
reference deployment behind <https://agroyachay.ginit.dev>, which runs on a
server shared with other applications. nginx terminates TLS for this single
domain: `/api/` goes to the Rust API and every other path to the Next.js
server. Sensor ingestion is also accepted over plain HTTP.

```
                        ┌─ agroyachay.ginit.dev ─────────────────────────────────────────────┐
Internet ─► nginx :443 ─┤   /api/*  → 127.0.0.1:9011  agroyachay-api ─► PostgreSQL :5432 (agroyachay)
            nginx :80   │   /*      → 127.0.0.1:3050  agroyachay-web   └► Ollama 127.0.0.1:11434
                        └─ http://…/api/sensores/lectura → API (plain HTTP kept for the nodes)
```

## 0. Reference layout

| Item | Value |
|---|---|
| Server | Debian 12, shared with other sites |
| Domain and nginx site | `agroyachay.ginit.dev`, `/etc/nginx/sites-available/agroyachay.ginit.dev.conf` ([`deploy/nginx/`](../deploy/nginx/agroyachay.ginit.dev.conf)) |
| API | `agroyachay-api.service`, 127.0.0.1:9011 ([`deploy/systemd/agroyachay-api.service`](../deploy/systemd/agroyachay-api.service)) |
| Web | `agroyachay-web.service`, Next.js standalone, 127.0.0.1:3050 ([`deploy/systemd/agroyachay-web.service`](../deploy/systemd/agroyachay-web.service)) |
| Application files | `/opt/apps/rust/agroyachay` |
| API environment | `/opt/apps/rust/agroyachay/api.env` (mode 600) |
| Database | PostgreSQL, database `agroyachay`, role `agroyachay` |
| Models | Ollama on 127.0.0.1:11434: `qwen2.5:3b` for text, `qwen2.5vl:3b` for vision (images reduced to 640 px); one model loaded at a time (`OLLAMA_MAX_LOADED_MODELS=1`, `OLLAMA_KEEP_ALIVE=3m`). Measured on 6 vCPU without GPU: pest triage 115–120 s with warm models, about 180 s on the first request; assistant replies 5–10 s |
| v1 | data imported from database `as_terrasense` with [`deploy/migrate_v1.sql`](../deploy/migrate_v1.sql); `terrasense.service` kept disabled for rollback |

Directory layout:

```
/opt/apps/rust/agroyachay/
├── src/                git checkout of the repository
├── api/
│   ├── agroyachay-api  release binary
│   └── uploads/        diagnosis photos (UPLOAD_DIR)
├── web/                contents of web/.next/standalone (server.js), .next/static, public/
└── api.env             API environment (chmod 600, owner agroyachay)
```

Neither port is exposed publicly. The v3 ports differ from those of v1, so the
two can be installed side by side; only one serves the domain at a time.

A single-host alternative with Docker Compose (API on 9001, web on 3010, two
llama.cpp containers) is in [`deploy/docker-compose.yml`](../deploy/docker-compose.yml).

## 1. Prerequisites

- Debian 12. Without local models 2 vCPU and 4 GB RAM are enough; with
  `qwen2.5vl:3b` in Ollama plan for 4 vCPU and 8 GB RAM or more (see
  [Appendix B](#appendix-b-local-language-and-vision-models)).
- Packages:

  ```bash
  sudo apt update
  sudo apt install -y build-essential pkg-config git curl rsync nginx \
                      certbot python3-certbot-nginx
  ```

- PostgreSQL 17. Debian 12 ships version 15; version 17 comes from the
  PostgreSQL apt repository (<https://www.postgresql.org/download/linux/debian/>).
  Any version from 14 works.
- Rust 1.88 or newer for the user that builds:
  `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- Node.js 22 or newer at `/usr/bin/node`, and pnpm 11 (`corepack enable`).
- The account that runs the services and the directories. On the production
  server the units run as the existing deploy user `andre`; change `User=` and
  `Group=` in `deploy/systemd/*.service` if you use another account:

  ```bash
  sudo install -d -o andre -g andre /opt/apps/rust/agroyachay \
       /opt/apps/rust/agroyachay/bin /opt/apps/rust/agroyachay/uploads \
       /opt/apps/rust/agroyachay/logs /opt/apps/rust/agroyachay/web
  sudo install -d -o "$USER" /opt/apps/rust/agroyachay/src
  ```

The commands below build as the deploying user in `src/` and install the
results with `sudo`.

## 2. DNS

`agroyachay.ginit.dev` already points to the server. For a new server, create
an `A` record (and `AAAA` if the server has IPv6) and check it with
`dig +short agroyachay.ginit.dev` before requesting a certificate.

## 3. PostgreSQL

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE agroyachay LOGIN ENCRYPTED PASSWORD '<strong-password>';
CREATE DATABASE agroyachay OWNER agroyachay ENCODING 'UTF8';
SQL
```

The schema is defined by the SQL migrations in `api/migrations/`, which the
API applies when it starts. pgAdmin 4 can be used through an SSH tunnel
(`ssh -L 5432:127.0.0.1:5432 <server>`); do not open port 5432 publicly.

## 4. API

```bash
git clone https://github.com/Andre031222/agroyachay.git /opt/apps/rust/agroyachay/src
cd /opt/apps/rust/agroyachay/src/api
cargo build --release --locked
sudo install -o andre -g andre -m 755 target/release/agroyachay-api \
     /opt/apps/rust/agroyachay/bin/agroyachay-api
```

Create `/opt/apps/rust/agroyachay/api.env`, owned by `andre` with mode
600 (`sudo install -o andre -g andre -m 600 /dev/null /opt/apps/rust/agroyachay/api.env`,
then edit it):

```bash
DATABASE_URL=postgres://agroyachay:<strong-password>@127.0.0.1:5432/agroyachay
JWT_SECRET=<64 random characters: openssl rand -hex 32>
PUBLIC_URL=https://agroyachay.ginit.dev
CORS_ORIGINS=https://agroyachay.ginit.dev
GOOGLE_CLIENT_ID=<client id>.apps.googleusercontent.com
LLM_PROVIDER=llamacpp
LLAMACPP_TEXT_URL=http://127.0.0.1:11434
LLAMACPP_VISION_URL=http://127.0.0.1:11434
LLAMACPP_TEXT_MODEL=qwen2.5:3b
LLAMACPP_VISION_MODEL=qwen2.5vl:3b
VISION_MAX_SIDE=640
LLM_TEXT_TIMEOUT_SECS=180
LLM_VISION_TIMEOUT_SECS=280
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-120b
UPLOAD_DIR=/opt/apps/rust/agroyachay/uploads
ADMIN_EMAIL=<superadmin e-mail>
ADMIN_PASSWORD=<initial superadmin password>
SUPERADMIN_EMAILS=<e-mail>,<e-mail>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=<account>@gmail.com
SMTP_PASSWORD=<16-character App Password>
SMTP_FROM="AgroYachay <account@gmail.com>"
```

`LLM_PROVIDER=llamacpp` means "the OpenAI-compatible server at
`LLAMACPP_TEXT_URL`", which here is Ollama; the variable names keep the
`LLAMACPP_` prefix. Quote every value that contains spaces or `<`/`>` (such as
`SMTP_FROM`); the `.env` reader stops at the first line it cannot parse and the
API logs a warning. `SUPERADMIN_EMAILS` (comma-separated, case-insensitive)
promotes those existing accounts to superadmin at every start and creates or
links them as superadmin on registration or Google sign-in; nobody is ever
demoted automatically. `ADMIN_EMAIL`/`ADMIN_PASSWORD` are used only when no
superadmin exists.

`HOST=127.0.0.1` and `PORT=9011` are set in the unit file. Install the
service:

```bash
sudo cp /opt/apps/rust/agroyachay/src/deploy/systemd/agroyachay-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now agroyachay-api
curl -s http://127.0.0.1:9011/api/health
```

## 5. Models (Ollama)

```bash
curl -fsSL https://ollama.com/install.sh | sh     # installs ollama.service on 127.0.0.1:11434
ollama pull qwen2.5vl:3b
ollama pull qwen2.5:3b
# keep one model in memory at a time on a shared server
sudo install -d /etc/systemd/system/ollama.service.d
sudo cp /opt/apps/rust/agroyachay/src/deploy/systemd/ollama-agroyachay.conf /etc/systemd/system/ollama.service.d/agroyachay.conf
sudo systemctl daemon-reload && sudo systemctl restart ollama
curl -s http://127.0.0.1:11434/v1/models          # must list qwen2.5vl:3b
```

The API reaches Ollama through its OpenAI-compatible endpoint
(`/v1/chat/completions`). Ollama has no `/health` route, so the API's health
check falls back to `GET /v1/models`. Qwen2.5-VL-3B is the vision model
validated in the article; here the same model also writes the text answers.
The API starts without a model server; `/api/health` then reports `llm` and
`vision` as `unavailable` and the AI features answer `503`.

The alternative with two llama.cpp servers (`agroyachay-llm-text.service` on
:8081 and `agroyachay-llm-vision.service` on :8082) and the trade-offs between
the two setups are in [Appendix B](#appendix-b-local-language-and-vision-models).

## 6. E-mail (password recovery)

`POST /api/auth/password/forgot` sends a reset link
(`${PUBLIC_URL}/reset-password#token=…`, valid 60 minutes, single use) by SMTP
with `lettre` over rustls: port 587 uses STARTTLS, port 465 implicit TLS. The
message is plain text plus simple HTML (no images, no external CSS) in the
user's language (Spanish, English, Quechua or Aymara; the Quechua and Aymara
versions repeat the text in Spanish).

With Gmail or Google Workspace:

1. Turn on 2-Step Verification for the sending account.
2. Create an App Password at <https://myaccount.google.com/apppasswords>
   (the normal account password is rejected over SMTP).
3. Set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`,
   `SMTP_USERNAME=<account>@gmail.com`, `SMTP_PASSWORD=<App Password without
   spaces>` and `SMTP_FROM="AgroYachay <account@gmail.com>"`. Gmail rewrites a
   different From address to the authenticated account unless it is
   configured as a "Send mail as" alias.

Gmail allows about 500 messages a day from a personal account. Leave
`SMTP_HOST` empty on test servers: the link is then written to the API log at
INFO level instead of being sent. Check the result in the log:
`journalctl -u agroyachay-api | grep "password reset"`.

## 7. Web

```bash
cd /opt/apps/rust/agroyachay/src/web
pnpm install --frozen-lockfile
env NEXT_PUBLIC_API_URL= \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=<client id>.apps.googleusercontent.com \
    API_PROXY_TARGET=http://127.0.0.1:9011 \
    pnpm build
sudo rsync -a --delete .next/standalone/ /opt/apps/rust/agroyachay/web/
sudo rsync -a --delete .next/static/ /opt/apps/rust/agroyachay/web/.next/static/
sudo rsync -a --delete public/ /opt/apps/rust/agroyachay/web/public/
sudo chown -R andre:andre /opt/apps/rust/agroyachay/web
```

`NEXT_PUBLIC_*` values and the `/api` rewrite target are fixed at build time.
`NEXT_PUBLIC_API_URL` stays empty because the API is served from the same
origin; nginx sends `/api/` to the API directly, so the rewrite is only a
fallback. Install the service (`PORT=3050`, bound to `127.0.0.1`):

```bash
sudo cp /opt/apps/rust/agroyachay/src/deploy/systemd/agroyachay-web.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now agroyachay-web
curl -sI http://127.0.0.1:3050/ | head -1
```

## 8. nginx and certificates

Define the WebSocket upgrade map once (skip if the shared server already has
it):

```bash
sudo tee /etc/nginx/conf.d/connection_upgrade.conf >/dev/null <<'EOF'
map $http_upgrade $connection_upgrade { default upgrade; '' close; }
EOF
```

The certificate for `agroyachay.ginit.dev` already exists from v1 (`certbot
--nginx`, which also installed `/etc/letsencrypt/options-ssl-nginx.conf` and
`ssl-dhparams.pem`). Check its name and path:

```bash
sudo certbot certificates
sudo mkdir -p /var/www/certbot        # used by the acme-challenge location
```

If the certificate is stored under another name than
`/etc/letsencrypt/live/agroyachay.ginit.dev/`, adjust `ssl_certificate` and
`ssl_certificate_key` in the site file. On a new server, obtain one first with
`sudo certbot certonly --nginx -d agroyachay.ginit.dev`, since `nginx -t` fails
while the certificate path does not exist.

The site file serves the whole domain. On a server that still serves v1,
remove the v1 site link first (§9, step 5); then:

```bash
sudo cp /opt/apps/rust/agroyachay/src/deploy/nginx/agroyachay.ginit.dev.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/agroyachay.ginit.dev.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Renewal is handled by the `certbot.timer` unit; check it with
`sudo certbot renew --dry-run`.

Behaviour of the site file:

| Request | Result |
|---|---|
| `https://…/api/*` | API (127.0.0.1:9011), 10 MB body limit, 300 s timeout |
| `http://…/api/sensores/lectura` | API (plain HTTP accepted) |
| `http://…/.well-known/acme-challenge/*` | files in `/var/www/certbot` |
| any other `http://…` request | 301 to the same path over HTTPS |
| any other `https://…` path | web (127.0.0.1:3050) |

Plain HTTP stays open for sensor ingestion because the node firmware posts with
`HTTPClient` without a CA bundle and does not follow redirects, so nodes
configured with an `http://` URL must reach the API directly.

### Google sign-in

In Google Cloud Console → APIs & Services → Credentials, open the OAuth
client (type *Web application*) and add to *Authorized JavaScript origins*:

- `https://agroyachay.ginit.dev`
- `http://localhost:3000` (development)

No *Authorized redirect URI* is needed: the web uses the Google Identity
Services button, which returns an ID token to the page, and the API verifies
it against `GOOGLE_CLIENT_ID` (`POST /api/auth/google`). The same client ID
goes into `GOOGLE_CLIENT_ID` (API) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (web
build). Changes to the origins can take a few minutes to apply. The
`Cross-Origin-Opener-Policy: same-origin-allow-popups` header set by nginx is
required for the sign-in pop-up.

## 9. Switching over from v1

v1 (tag `v1.0.1`) is a Flask API under Gunicorn, run as `terrasense.service`,
with a React build served by nginx and its data in the PostgreSQL database
`as_terrasense`. Prepare §1 to §7 first: the v3 API and web run on their own
ports while v1 still serves the domain. The steps below then take a few
minutes during which readings are not stored.

The v1 database is only read by the migration and is not modified.
[`deploy/migrate_v1.sql`](../deploy/migrate_v1.sql) copies users
(`usuarios`), crops (`cultivos`), devices (`sensores`) and readings
(`lecturas_sensores`) through `dblink`. bcrypt password hashes are compatible,
so users keep their passwords; v1 roles `usuario` and `agricultor` become
`farmer`. Its header documents the mapping and the `v1_conn` parameter.

```bash
# 1. stop and disable v1 (stops writes; the unit stays installed for rollback)
sudo systemctl disable --now terrasense

# 2. back up the v1 database
sudo install -d -m 700 /var/backups/agroyachay
sudo -u postgres pg_dump -Fc as_terrasense > /var/backups/agroyachay/as_terrasense-$(date +%F).dump

# 3. make sure the v3 schema exists (the API applies the migrations on start)
curl -s http://127.0.0.1:9011/api/health

# 4. copy the v1 data (transactional; rows already copied are skipped on a re-run)
sudo -u postgres psql -d agroyachay -v ON_ERROR_STOP=1 -f /opt/apps/rust/agroyachay/src/deploy/migrate_v1.sql
sudo -u postgres psql -d agroyachay -c "SELECT (SELECT count(*) FROM users) users,
  (SELECT count(*) FROM crops) crops, (SELECT count(*) FROM devices) devices,
  (SELECT count(*) FROM readings) readings;"

# 5. replace the v1 site for the same domain (the v1 file stays in sites-available)
grep -l 'server_name agroyachay.ginit.dev' /etc/nginx/sites-enabled/*
sudo rm /etc/nginx/sites-enabled/<v1 site file>
sudo cp /opt/apps/rust/agroyachay/src/deploy/nginx/agroyachay.ginit.dev.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/agroyachay.ginit.dev.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

If two enabled sites declare `server_name agroyachay.ginit.dev`, nginx warns
about a conflicting server name and may keep serving v1. The existing
certificate is reused; no certbot run is needed.

Compare the counts with the v1 tables (`usuarios`, `cultivos`, `sensores`,
`lecturas_sensores`); implausible readings and unknown reading types are
skipped by design, and the import is recorded in the audit log as
`v1_import`. Flashed nodes and AgroCommish keep using the same domain and
paths, so readings resume as soon as nginx is reloaded.

## 10. Verification

```bash
curl -s https://agroyachay.ginit.dev/api/health
curl -sI http://agroyachay.ginit.dev/app | grep -i '^location'      # → https://agroyachay.ginit.dev/app
curl -sI https://agroyachay.ginit.dev/guide | head -1                # → 200

# device contract, over HTTP (as the firmware sends it) and HTTPS
for u in http://agroyachay.ginit.dev https://agroyachay.ginit.dev; do
  curl -s -X POST "$u/api/sensores/lectura" -H 'Content-Type: application/json' \
       -d '{"esp32_id":"ESP32_DEPLOYTEST","temperatura":12.5,"humedad_aire":60,"humedad_suelo":40}'
  echo
done
curl -s "https://agroyachay.ginit.dev/api/sensores/lecturas-recientes?esp32_id=ESP32_DEPLOYTEST"
```

`/api/health` must report `"database":"ok"`, and `"llm":"ok"` and
`"vision":"ok"` once Ollama has the model. Each POST must return `201` with
`"success":true`. Delete the test device afterwards:
`sudo -u postgres psql -d agroyachay -c "DELETE FROM devices WHERE esp32_id = 'ESP32_DEPLOYTEST';"`.
Then sign in
with a migrated v1 account and with Google, upload a leaf photo in **Plagas**,
and request a password reset to check SMTP.

## 11. Updating

```bash
sudo install -d -m 700 /var/backups/agroyachay
sudo -u postgres pg_dump -Fc agroyachay > /var/backups/agroyachay/agroyachay-$(date +%F).dump

cd /opt/apps/rust/agroyachay/src && git pull
# API
cd api && cargo build --release --locked
sudo install -o andre -g andre -m 755 target/release/agroyachay-api \
     /opt/apps/rust/agroyachay/bin/agroyachay-api
sudo systemctl restart agroyachay-api
# web: repeat the build and rsync of §7, then
sudo systemctl restart agroyachay-web
```

## 12. Rollback to v1

v1 stays deployable from tag `v1.0.1` (Zenodo 10.5281/zenodo.20829992), its
database `as_terrasense` is not modified by the migration, and
`terrasense.service` stays installed but disabled.

1. Stop v3: `sudo systemctl disable --now agroyachay-web agroyachay-api`.
2. Restore the v1 site for the same domain:
   ```bash
   sudo rm /etc/nginx/sites-enabled/agroyachay.ginit.dev.conf
   sudo ln -s /etc/nginx/sites-available/<v1 site file> /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```
3. Re-enable v1: `sudo systemctl enable --now terrasense`.
4. If the v1 code or static build was removed from the server, reinstall it
   from the tag (`git clone --branch v1.0.1 https://github.com/Andre031222/agroyachay.git`)
   and follow `docs/DEPLOYMENT.md` at that tag.

Readings and accounts created in v3 after the switch-over are not copied back
to v1. If they are needed, export them from the v3 database
(`pg_dump -Fc agroyachay`) before rolling back.

## Appendix A. Environment variables (API)

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

## Appendix B. Local language and vision models

The API talks to its models through one OpenAI-compatible client
(`POST {url}/v1/chat/completions`). Any server that implements that API can be
used. Two setups are documented here:

| Setup | Where it is used | Text | Vision |
|---|---|---|---|
| **A. llama.cpp**, two `llama-server` processes | development, servers with a GPU or spare RAM | Qwen3-4B-Instruct-2507 on :8081 | Qwen2.5-VL-3B-Instruct on :8082 |
| **B. Ollama**, one server | reference production server (shared host) | `qwen2.5:3b` on :11434 | `qwen2.5vl:3b` on :11434 |

Qwen2.5-VL-3B is the vision model evaluated in the article (509 images:
sensitivity 100 %, specificity 62 %, macro-F1 0.55). Because specificity is
moderate, the application presents every pest result as a first check, not a
final diagnosis. Both model families are Apache 2.0.

The environment variables keep the `LLAMACPP_` prefix in both setups:

| Variable | A. llama.cpp | B. Ollama |
|---|---|---|
| `LLM_PROVIDER` | `llamacpp` | `llamacpp` |
| `LLAMACPP_TEXT_URL` | `http://127.0.0.1:8081` | `http://127.0.0.1:11434` |
| `LLAMACPP_VISION_URL` | `http://127.0.0.1:8082` | `http://127.0.0.1:11434` |
| `LLAMACPP_TEXT_MODEL` | `qwen3-4b-instruct` (the `--alias`) | `qwen2.5:3b` |
| `LLAMACPP_VISION_MODEL` | `qwen2.5-vl-3b` (the `--alias`) | `qwen2.5vl:3b` |
| `LLAMACPP_API_KEY` | only with `--api-key` | empty |

A trailing `/v1` in a URL is accepted. The API checks availability with
`GET {url}/health` and, when that fails, `GET {url}/v1/models`; llama.cpp
answers the first, Ollama the second. `GET /api/health` reports the result as
`llm` and `vision` (`ok` or `unavailable`).

With `LLM_PROVIDER=llamacpp` no text and no image leaves the host.
`LLM_PROVIDER=groq` (or the admin setting) moves only the text features to the
Groq API; photographs always go to `LLAMACPP_VISION_URL`.

A diagnosis is made in two steps: the vision model identifies the plant and
the problem (strict JSON, temperature 0), then the text model explains it to
the farmer in the chosen language, with doses per 20-litre backpack sprayer.
The text model also writes the assistant replies, the weekly weather plan, the
pest management plan and the advisory drafts. The API waits up to 150 s for a
text answer and 180 s for a photo; nginx allows 300 s on `/api/`.

### A. llama.cpp

#### A.1 Install on Debian

Option 1, build from source (uses every instruction set of the CPU):

```bash
sudo apt install -y build-essential cmake git libcurl4-openssl-dev
git clone --depth 1 https://github.com/ggml-org/llama.cpp /tmp/llama.cpp
cd /tmp/llama.cpp
cmake -B build -DCMAKE_BUILD_TYPE=Release -DGGML_NATIVE=ON -DLLAMA_CURL=ON
cmake --build build --config Release -j"$(nproc)" --target llama-server
sudo install -d /opt/llama.cpp/bin
sudo install -m 0755 build/bin/llama-server /opt/llama.cpp/bin/
sudo cp -a build/bin/*.so* /opt/llama.cpp/bin/ 2>/dev/null || true
/opt/llama.cpp/bin/llama-server --version
```

With an NVIDIA GPU, install the CUDA toolkit and add `-DGGML_CUDA=ON`; then add
`-ngl 99` to both units so that every layer runs on the GPU.

Option 2, release binaries: download `llama-<tag>-bin-ubuntu-x64.zip` from
<https://github.com/ggml-org/llama.cpp/releases>, unzip it and copy the content
of `build/bin/` to `/opt/llama.cpp/bin/`.

On macOS, `brew install llama.cpp` provides `llama-server`.

#### A.2 Service user and models

| Purpose | Port | Alias | GGUF files | Approx. RAM |
|---|---|---|---|---|
| Text | 8081 | `qwen3-4b-instruct` | `Qwen3-4B-Instruct-2507-Q4_K_M.gguf` | 3 GB |
| Vision | 8082 | `qwen2.5-vl-3b` | `Qwen2.5-VL-3B-Instruct-Q4_K_M.gguf` + `mmproj-Qwen2.5-VL-3B-Instruct-f16.gguf` | 3.5 GB |

```bash
sudo useradd --system --home /var/lib/llama --shell /usr/sbin/nologin llama
sudo install -d -o llama -g llama /var/lib/llama/models
cd /var/lib/llama/models

base=https://huggingface.co
sudo -u llama curl -fL -O "$base/unsloth/Qwen3-4B-Instruct-2507-GGUF/resolve/main/Qwen3-4B-Instruct-2507-Q4_K_M.gguf"
sudo -u llama curl -fL -O "$base/ggml-org/Qwen2.5-VL-3B-Instruct-GGUF/resolve/main/Qwen2.5-VL-3B-Instruct-Q4_K_M.gguf"
sudo -u llama curl -fL -O "$base/ggml-org/Qwen2.5-VL-3B-Instruct-GGUF/resolve/main/mmproj-Qwen2.5-VL-3B-Instruct-f16.gguf"
ls -lh
```

`pip install -U huggingface_hub` and `hf download <repo> <file> --local-dir .`
do the same and resume interrupted downloads.

#### A.3 systemd units

The units are in [`systemd/`](systemd/): `agroyachay-llm-text.service`
(127.0.0.1:8081) and `agroyachay-llm-vision.service` (127.0.0.1:8082).

```bash
sudo cp deploy/systemd/agroyachay-llm-text.service deploy/systemd/agroyachay-llm-vision.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now agroyachay-llm-text agroyachay-llm-vision
ss -ltnp | grep -E '808[12]'                 # must show 127.0.0.1 only
curl -s http://127.0.0.1:8081/health         # {"status":"ok"}
curl -s http://127.0.0.1:8082/v1/models      # alias qwen2.5-vl-3b
```

Flags used:

| Flag | Why |
|---|---|
| `--host 127.0.0.1` | llama-server has no user accounts; it must never be reachable from the network |
| `-c 8192` | context for the longest prompt (weather plan) or a photo plus the prompt |
| `--jinja` | uses the chat template stored in the GGUF (needed for Qwen3 and for images) |
| `--parallel 2` / `--parallel 1` | two simultaneous text requests share the context; vision serves one photo at a time |
| `--alias` | the model name the API sends; must match `LLAMACPP_TEXT_MODEL` / `LLAMACPP_VISION_MODEL` |
| `--no-webui` | the built-in chat page is not needed |

`/health` answers 503 while a model is loading and 200 when it is ready.

Quick test:

```bash
curl -s http://127.0.0.1:8081/v1/chat/completions -H 'Content-Type: application/json' \
  -d '{"model":"qwen3-4b-instruct","messages":[{"role":"user","content":"En una frase: ¿cuándo se siembra la papa en el Altiplano?"}]}'
```

#### A.4 A larger text model

On a machine with 24 GB of RAM or more, a mixture-of-experts model such as
Qwen3-30B-A3B-Instruct-2507 (Q4_K_M, about 18 GB) gives clearly better answers
at a speed close to the 4B model, because only about 3B parameters are active
per token. Change the `-m` path and `--alias` in
`agroyachay-llm-text.service`, set `LLAMACPP_TEXT_MODEL` to the same alias,
and restart:

```bash
sudo systemctl daemon-reload
sudo systemctl restart agroyachay-llm-text agroyachay-api
```

### B. Ollama

One Ollama server can serve both roles with the vision model, which keeps the
memory footprint to one model (about 3–4 GB) on a shared host.

```bash
curl -fsSL https://ollama.com/install.sh | sh     # ollama.service on 127.0.0.1:11434
ollama pull qwen2.5vl:3b
curl -s http://127.0.0.1:11434/v1/models          # lists qwen2.5vl:3b
curl -s http://127.0.0.1:11434/v1/chat/completions -H 'Content-Type: application/json' \
  -d '{"model":"qwen2.5vl:3b","messages":[{"role":"user","content":"En una frase: ¿cuándo se siembra la papa en el Altiplano?"}]}'
```

Then set the four `LLAMACPP_*` variables as in the table above and restart the
API. Ollama binds to 127.0.0.1 by default; keep it that way. Ollama loads the
model on the first request and unloads it after a period of inactivity, so the
first answer after a pause takes longer. A separate text model can be pulled
(for example a Qwen3 instruct model) and set in `LLAMACPP_TEXT_MODEL`; the
vision model must stay a vision-language model.

### Latency

Measured on the development machine with llama.cpp (Apple M1 Pro, both models
on the GPU, one request at a time, Q4_K_M): weather plan 16–18 s, assistant
reply 3–5 s, photo diagnosis 7–10 s (vision 2–3 s plus wording 5–7 s),
management plan 7–8 s. On a CPU-only server expect roughly:

| Host | Assistant reply | Weather plan | Photo diagnosis |
|---|---|---|---|
| 4 vCPU, 8 GB RAM | 15–40 s | 60–120 s | 40–120 s |
| 8 cores, 16 GB RAM | 8–20 s | 30–60 s | 20–60 s |
| NVIDIA GPU ≥ 8 GB VRAM | 1–3 s | 5–10 s | 3–8 s |

Reserve about 7 GB of RAM for the two llama.cpp servers, or about 4 GB for
Ollama with `qwen2.5vl:3b`.

### Running the models on another machine

On a separate GPU host, bind the model server to a private address, allow its
ports only from the API server in the firewall, and point
`LLAMACPP_TEXT_URL` / `LLAMACPP_VISION_URL` to it. If the link crosses an
untrusted network, put the server behind a TLS proxy that requires a key and
set `LLAMACPP_API_KEY` (llama.cpp can also check the key itself with
`--api-key`). Never expose a model server to the internet.

## Appendix C. Environment variables (web)

| Variable | When | Purpose |
|---|---|---|
| `API_PROXY_TARGET` | build and dev | target of the `/api/*` rewrite in `next.config.ts`; default `http://127.0.0.1:5000` |
| `NEXT_PUBLIC_API_URL` | build | API origin for browser requests; leave empty when the API is served from the same origin (production behind nginx) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | build | enables the Google button; must equal the API's `GOOGLE_CLIENT_ID` |

`NEXT_PUBLIC_*` values are embedded at build time. In production nginx sends
`/api/` straight to the API, so the rewrite is only a fallback; the reference
deployment builds with `API_PROXY_TARGET=http://127.0.0.1:9011`.

Google sign-in uses the Identity Services button, which returns an ID token to
the page; the API verifies it. Only *Authorized JavaScript origins* are needed
in the Google Cloud client (no redirect URI).
