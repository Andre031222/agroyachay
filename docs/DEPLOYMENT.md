# Deployment guide (production)

This is the native, same-origin deployment used for the public demo at
**https://agroyachay.ginit.dev**: Nginx serves the React build as static files
and reverse-proxies `/api/*` to a Gunicorn-served Flask backend. Frontend and
backend share one origin, so no CORS configuration is needed in the browser.

```
Internet ──443──► Nginx ──┬── /            → static React build
                          └── /api/*        → 127.0.0.1:9001 (Gunicorn → Flask)
                                              PostgreSQL on 127.0.0.1:5432
```

## Prerequisites

- Linux server (tested on Debian 12)
- Python ≥ 3.9, Node.js ≥ 18, PostgreSQL ≥ 14, Nginx, certbot
- A domain/subdomain pointing to the server, and a Groq + OpenWeather API key

## 1. PostgreSQL — database and app user

```sql
CREATE USER agroyachay_user WITH ENCRYPTED PASSWORD '<strong-password>';
CREATE DATABASE as_terrasense WITH OWNER agroyachay_user ENCODING 'UTF8';
GRANT ALL PRIVILEGES ON DATABASE as_terrasense TO agroyachay_user;
```

## 2. Backend (Gunicorn + systemd)

```bash
sudo mkdir -p /opt/apps/agroyachay/{src,logs}
# copy the backend/ contents into /opt/apps/agroyachay/src
cd /opt/apps/agroyachay
python3 -m venv venv
./venv/bin/pip install -r src/requirements.txt        # includes gunicorn
```

Create `/opt/apps/agroyachay/.env` (chmod 600) with `DB_*`, `SECRET_KEY`,
`JWT_SECRET_KEY`, `GROQ_API_KEY`, `OPENWEATHER_API_KEY`, `FRONTEND_URL`,
`CORS_ORIGINS=https://your.domain`, and `ADMIN_EMAIL`/`ADMIN_PASSWORD`.

Initialise the schema (creates tables, indexes and the superadmin):

```bash
cd /opt/apps/agroyachay/src
set -a; . /opt/apps/agroyachay/.env; set +a
../venv/bin/python scripts/setup_postgres.py
```

`/etc/systemd/system/agroyachay.service`:

```ini
[Unit]
Description=AgroYachay API (Flask + Gunicorn)
After=network.target postgresql.service

[Service]
User=appuser
WorkingDirectory=/opt/apps/agroyachay/src
EnvironmentFile=/opt/apps/agroyachay/.env
ExecStart=/opt/apps/agroyachay/venv/bin/gunicorn --workers 4 --bind 127.0.0.1:9001 \
    --timeout 120 --access-logfile ../logs/access.log --error-logfile ../logs/error.log main:app
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now agroyachay
curl http://127.0.0.1:9001/health     # {"status":"healthy"}
```

## 3. Frontend (static build)

```bash
cd frontend
echo 'VITE_API_URL=/api' > .env.production            # same-origin
echo 'VITE_GOOGLE_CLIENT_ID=<your-client-id>' >> .env.production
npm install && npm run build                          # outputs frontend/build
sudo mkdir -p /opt/apps/static/your.domain
sudo cp -r build/* /opt/apps/static/your.domain/
```

## 4. Nginx (same-origin: static + /api proxy)

`/etc/nginx/sites-available/your.domain`:

```nginx
server {
    listen 80;
    server_name your.domain;
    root /opt/apps/static/your.domain;
    index index.html;
    client_max_body_size 16M;

    location /api/ {
        proxy_pass http://127.0.0.1:9001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
    # Lets the Google sign-in popup read window.closed
    add_header Cross-Origin-Opener-Policy "same-origin-allow-popups" always;
    location / { try_files $uri $uri/ /index.html; }   # SPA fallback
}
```

```bash
sudo ln -s /etc/nginx/sites-available/your.domain /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 5. HTTPS

```bash
sudo certbot --nginx -d your.domain --redirect
```

## Updating a deployment

- **Backend:** copy the new `src/`, then `sudo systemctl restart agroyachay`.
- **Frontend:** `npm run build` and replace `/opt/apps/static/your.domain/`.

## Google OAuth (optional)

For "Sign in with Google" to work for all users, add `https://your.domain` to the
OAuth client's *Authorized JavaScript origins* and publish the consent screen
(Google Cloud Console → OAuth consent screen → Publish app). Email/password login
works without this.
