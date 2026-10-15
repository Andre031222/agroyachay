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
  [`deploy/llama-cpp.md`](../deploy/llama-cpp.md)).
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
the two setups are in [`deploy/llama-cpp.md`](../deploy/llama-cpp.md).

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
