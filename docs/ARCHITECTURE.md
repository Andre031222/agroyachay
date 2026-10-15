# AgroYachay v3 — Architecture and contract

**AgroYachay** — *An open-source IoT and large-language-model platform supporting agronomic and economic decision-making for Andean smallholders.*

AgroYachay (*yachay*, "knowledge" in Quechua). AgroYachay 3.0 is the new version of the platform described in the SoftwareX article (SoftwareX 36 (2026) 103037, doi:10.1016/j.softx.2026.103037), which documents **AgroYachay v1.0.1**. The v1 code stays available at [tag `v1.0.1`](https://github.com/Andre031222/agroyachay/releases/tag/v1.0.1) and in the Zenodo archive [10.5281/zenodo.20829992](https://doi.org/10.5281/zenodo.20829992). Version 2 was an internal Rust/Next.js prototype that was never released, so the public version numbers go from 1.0.1 to 3.0.0.

| Item | Value |
|---|---|
| Short name | `AgroYachay` |
| Long name | An open-source IoT and large-language-model platform supporting agronomic and economic decision-making for Andean smallholders |
| Production | `https://agroyachay.ginit.dev` |
| Video guide | `https://agroyachay.ginit.dev/guide` |
| Version | 3.0.0 |
| Maintainer | Richar Andre Vilca-Solorzano (GitHub `Andre031222`) |

## 1. Repository layout

```
api/          Rust service (edition 2024, Axum 0.8, SQLx 0.9, Tokio, PostgreSQL)
web/          Next.js 16 (App Router, React 19, TypeScript, Tailwind CSS 4): landing, video guide, app
firmware/     ESP32 node firmware (unchanged contract)
simulation/   Wokwi browser simulation of the node
deploy/       nginx, systemd, docker-compose, model servers, v1 → v3 data migration (migrate_v1.sql)
docs/         architecture, API, deployment, release policy, tutorial script
```

PostgreSQL 17 (14 or newer works; administered with pgAdmin 4 or psql). Database name `agroyachay`.

Ports:

| Process | Development | Docker Compose | Reference production |
|---|---|---|---|
| API | 5000 (`PORT`; use 9001 on macOS if AirPlay holds 5000) | 9001 | 127.0.0.1:9011 |
| Web | 3000 | 3010 | 127.0.0.1:3050 |
| Text model | llama.cpp :8081 | llama.cpp :8081 | Ollama :11434 |
| Vision model | llama.cpp :8082 | llama.cpp :8082 | Ollama :11434 |

## 2. Non-negotiable compatibility contract

Devices already flashed by AgroCommish post to `…/api/sensores/lectura`, and AgroCommish itself calls three endpoints. These paths and payloads must keep working byte-for-byte on `agroyachay.ginit.dev`, the same domain that v1 used, including `POST /api/sensores/lectura` over plain HTTP.

| Caller | Request | Response |
|---|---|---|
| ESP32 firmware | `POST /api/sensores/lectura` JSON `{esp32_id, temperatura, humedad_aire, humedad_suelo, timestamp}` (also accepts `{esp32_id, lecturas:[{tipo, valor, unidad}]}`), no auth | `201 {success:true, message, sensor_id, esp32_id, lecturas_procesadas, timestamp, alertas?}`; `400 {success:false, message}` when `esp32_id` is missing or no valid value. Unknown `esp32_id` auto-creates a device with status `pending`. `timestamp` is Unix seconds; if missing or before 2020 use server time. |
| AgroCommish verification | `GET /api/sensores/lecturas-recientes?esp32_id=X`, no auth | `200 {success:true, esp32_id, lecturas:[{tipo_lectura, valor, unidad, timestamp}]}` (last 9, newest first, `tipo_lectura` ∈ `temperatura_aire`, `humedad_aire`, `humedad_suelo`, `valor` float, ISO timestamp); `404 {success:false, message, lecturas:[]}` |
| AgroCommish activation | `POST /api/auth/login` `{username|email, password}` | `200 {success:true, token, data:{token, user:{id, nombre, name, email, role, rol}}}`; `401 {success:false, message}` |
| AgroCommish hand-off | browser opens `/auto-login#token=JWT&redirect=devices` | web stores the token, loads `/api/auth/me`, navigates to `/app/<redirect>` (`dispositivos` maps to `devices`) |

Metric mapping between the device vocabulary and storage: `temperatura`/`temperatura_aire` ↔ `air_temperature` (°C), `humedad_aire` ↔ `air_humidity` (%), `humedad_suelo` ↔ `soil_moisture` (%). Plausibility limits: temperature −40…80, humidity 0…100; out-of-range values are rejected individually.

## 3. API conventions

- Base path `/api`. JSON, UTF-8, `snake_case` fields.
- Success: `200/201 {"data": …}`; list endpoints may add `"meta": {page, per_page, total}`.
- Error: `{"error": {"code": "not_found", "message": "…"}}` with matching HTTP status. Messages localised from `Accept-Language` (`es`, `en`, `qu`, `ay`; default `es`).
- Auth: `Authorization: Bearer <JWT HS256>`, claims `{sub: user_id, role, exp}`, 24 h expiry.
- Roles: `farmer` (default), `admin` (users, audit log, catalogue, advisory answers), `superadmin` (everything, plus settings and role changes to admin/superadmin).
- Rate limit on `POST /api/auth/{login,register,google,password,password/forgot,password/reset}`: 10 requests/min/IP (shared bucket, `AUTH_RATE_LIMIT_PER_MINUTE`).
- Every login, failed login, registration, password change, password reset request and reset, role change (including promotions from `SUPERADMIN_EMAILS`), activation change, settings change, device claim/release and deletion writes an `audit_log` row.

### Endpoints

| Method & path | Auth | Purpose |
|---|---|---|
| `GET /api/health` | – | `{data:{status:"ok"|"degraded", name, version, database, llm, vision, llm_provider, llm_model, vision_model}}`; `llm`/`vision` are `ok|unavailable`, from `GET {url}/health` or, if that fails, `GET {url}/v1/models` of the model server (Groq: `GET /models`) |
| `GET /api/config/public` | – | `{data:{name, long_name, google_client_id, languages, features}}` |
| `POST /api/auth/register` | – | `{name, email, password}` (password ≥ 8) → `{data:{token, user}}` |
| `POST /api/auth/login` | – | see §2 (superset shape) |
| `POST /api/auth/google` | – | `{credential}` (Google ID token, verified against `GOOGLE_CLIENT_ID`) → `{data:{token, user}}`; links by e-mail if the account exists |
| `GET /api/auth/me` | user | `{data:user}` |
| `PATCH /api/auth/me` | user | `{name?, locale?, latitude?, longitude?, place_name?}` |
| `POST /api/auth/password` | user | `{current_password, new_password}` |
| `POST /api/auth/password/forgot` | – | `{email, locale?}` → always `200 {data:{sent:true}}` (no account enumeration); for an active account, earlier tokens are invalidated and an e-mail with `${PUBLIC_URL}/reset-password#token=<token>` (valid 60 min, single use) is sent |
| `POST /api/auth/password/reset` | – | `{token, new_password}` (≥ 8) → `{data:{token, user}}` (signs the user in; works for Google-only accounts, which gain a password); `400 reset_token_invalid` when unknown, used or expired |
| `GET /api/dashboard` | user | counts (crops, devices active/pending, open alerts, diagnoses), latest reading per device, last 5 alerts |
| `GET /api/weather?lat&lon` | user | current, next 24 h hourly, 7-day daily, agro indicators: `frost_risk` (min ≤ 2 °C), `heat_stress`, `rain_7d_mm`, `et0_7d_mm`, `spray_windows` (wind < 15 km/h, no rain, 8–17 h), `irrigation_hint` |
| `POST /api/weather/plan` | user | `{lat, lon, locale}` → LLM 7-day activity plan `{data:{summary, risk_level, days:[{date, activities[], avoid[]}]}}` |
| `GET /api/almanac?year&month&lat&lon` | user | see §6 |
| `GET /api/crops/catalog` | user | supported species with agronomic parameters |
| `GET/POST /api/crops` | user | list / create |
| `GET/PATCH/DELETE /api/crops/:id` | owner | detail (with linked devices and latest readings) / update / delete |
| `GET /api/devices` | user | my devices with latest reading and status (`online` if seen ≤ 120 s) |
| `GET /api/devices/pending` | user | unclaimed devices seen in the last 24 h |
| `GET /api/devices/:id` | owner | one device with latest reading and thresholds |
| `POST /api/devices/:id/claim` | user | `{name, crop_id?}` |
| `PATCH /api/devices/:id` | owner | `{name?, crop_id?, thresholds?: [{metric, min, max}]}` |
| `POST /api/devices/:id/release` | owner | unlink, back to `pending` |
| `GET /api/devices/:id/readings?range=1h|24h|7d|30d` | owner | series per metric, bucketed (raw ≤ 24 h, hourly 7 d, 6-hourly 30 d) with min/avg/max |
| `GET /api/alerts?status=open|all` | user | alerts of my devices |
| `POST /api/alerts/:id/resolve` | owner | |
| `POST /api/pests/diagnose` | user | multipart `image` (jpeg/png/webp ≤ 8 MB, magic-byte checked), `crop?`, `crop_id?`; vision model returns `{healthy, disease, scientific_name, confidence, severity, description, causes[], treatment[], prevention[]}` |
| `GET /api/pests/:id` · `GET /api/pests/:id/image` | owner | one diagnosis / its photo (bearer required) |
| `POST /api/pests/:id/plan` | owner | text LLM management plan for Peru `{urgency, steps[], products[{name, dose}], organic_alternative, consult_agronomist}` |
| `GET /api/pests/history` | user | |
| `POST /api/yield/estimate` | user | `{crop_id}` or `{species, area_ha, sowing_date, lat?, lon?}` → see §5 |
| `GET /api/yield/history` | user | |
| `POST /api/inputs/calculate` | user | `{species, area_ha, target_yield_t_ha?}` → fertiliser N-P-K, seed, lime, labour estimate, each item with quantity, unit, unit price and subtotal from the product catalogue |
| `GET /api/products?category&q` | user | product catalogue (agrochemicals, seeds, fertilisers, equipment) with supplier link |
| `GET/POST /api/admin/products` · `PATCH/DELETE /api/admin/products/:id` | admin | catalogue maintenance (the list includes inactive products) |
| `POST /api/assistant/chat` | user | `{messages:[{role, content}], locale}` → `{data:{reply}}`; system prompt includes the user's crops, region and latest readings |
| `GET/POST /api/advisory` | user | my expert requests (admin: all) / new `{topic, priority, description, crop_id?}` (an AI draft is attached) |
| `GET /api/advisory/:id` | owner or admin | one request |
| `POST /api/advisory/:id/answer` | admin | `{answer, status}` |
| `GET /api/reports/summary` | user | JSON for the printable report page |
| `GET /api/reports/:kind.xlsx` | user | `crops`, `readings`, `finance` spreadsheets |
| `GET /api/admin/stats` | admin | users by role, active last 7 d, devices, readings last 24 h, diagnoses |
| `GET /api/admin/users?q&page` · `PATCH /api/admin/users/:id` | admin | `{role?, active?}`; only superadmin may grant admin/superadmin |
| `GET /api/admin/audit?page&action&user_id&from&to` | admin | audit log (bitácora) |
| `GET/PUT /api/admin/settings` | superadmin | key/value settings (announcement, registration open, default region, LLM provider) |

## 4. Data model (PostgreSQL, SQLx migrations in `api/migrations`)

```
users(id bigserial pk, name, email unique (lower), password_hash null, google_sub unique null,
      avatar_url, role check(farmer|admin|superadmin) default farmer, active bool default true,
      locale default 'es', latitude, longitude, place_name, created_at timestamptz, last_login_at)
crops(id, user_id fk cascade, name, species, variety, area_ha numeric(10,2), latitude, longitude,
      location_name, sowing_date date, harvest_date date,
      status check(planned|sown|growing|harvested|inactive), notes, created_at, updated_at)
devices(id, esp32_id unique, name, user_id fk null, crop_id fk null on delete set null,
        status check(pending|active|inactive), last_seen_at, created_at)
readings(id bigserial, device_id fk cascade, metric check(air_temperature|air_humidity|soil_moisture),
         value double precision, recorded_at timestamptz)
        index (device_id, metric, recorded_at desc)
thresholds(device_id fk cascade, metric, min_value, max_value, pk(device_id, metric))
alerts(id, device_id fk cascade, metric, kind check(low|high|offline), value, threshold,
       created_at, resolved_at null)
pest_diagnoses(id, user_id, crop_id null, crop_label, image_path, engine, model, healthy, disease,
               confidence, severity, result jsonb, plan jsonb null, created_at)
yield_estimates(id, user_id, crop_id null, inputs jsonb, yield_t_ha, total_t, revenue_pen,
                confidence, factors jsonb, created_at)
products(id, sku unique null, name, category check(fertilizer|seed|agrochemical|amendment|equipment),
         unit, price_pen numeric, supplier, url, active, created_at)
advisory_requests(id, user_id, crop_id null, topic, priority check(low|medium|high|urgent),
                  description, status check(open|in_progress|answered|closed), ai_draft,
                  answer, answered_by null, created_at, answered_at)
password_resets(id, user_id fk cascade, token_hash text unique (sha256 hex of the token), expires_at,
                used_at null, created_at)
audit_log(id bigserial, user_id null, action, target, ip, user_agent, meta jsonb, created_at)
settings(key pk, value jsonb, updated_by, updated_at)
```

Default thresholds for a newly claimed device: air_temperature 2–28 °C, air_humidity 40–85 %, soil_moisture 30–80 %. A reading outside `[min,max]` opens an alert unless an open alert of the same metric and kind already exists (enforced by a partial unique index). A background task checks every minute and opens an `offline` alert (metric `connection`) for an active device silent for `OFFLINE_AFTER_MINUTES` (default 15).

Migrations: `0001_schema.sql`, `0002_seed.sql` (product catalogue and default settings), `0003_password_resets_llamacpp.sql` (password resets; a stored `llm_provider` of `ollama` from the prototype becomes `llamacpp`).

`deploy/migrate_v1.sql` copies v1 `usuarios`, `cultivos`, `sensores`, `lecturas_sensores` into the v3 tables (bcrypt hashes are compatible; `usuario`/`agricultor` → `farmer`).

## 5. Yield and revenue model (paper Eq. 1)

```
ŷ_ha = y0(c) · f_cli · f_phe        Ŷ = ŷ_ha · A · f_area(A)        R̂ = 1000 · Ŷ · p(c)
f_cli = Π g_k   (temperature window, humidity window, 30-day rainfall window; each factor 0.85…1.10)
f_phe = min(d / D_c, 1) mapped to 0.6…1.05
f_area ∈ [0.95, 1.08], piecewise by area
conf = 70 + Δ_data + Δ_phe (%), capped at 95
```

Seed parameters per species (`y0` t/ha, `p` PEN/kg, `D_c` days): potato 15.5 / 2.40 / 150, quinoa 1.8 / 8.50 / 160, maize 3.5 / 1.80 / 180, faba bean 2.0 / 3.50 / 170, oca 8.5 / 2.00 / 210, cañihua 1.0 / 9.00 / 150, barley 2.2 / 1.50 / 140, wheat 2.0 / 1.70 / 150. Every factor is returned for audit.

## 6. Agricultural almanac

Computed, not static text:

- Moon phase per day (synodic month 29.530588853 d, reference new moon 2000-01-06 18:14 UTC), illumination %, phase name, exact instants of the four principal phases of the month (Meeus, ch. 49).
- Sunrise, sunset and day length for the user's coordinates (NOAA solar algorithm).
- Southern-hemisphere Andean season and the traditional agricultural calendar for the Altiplano and inter-Andean valleys (land preparation Aug–Sep, main sowing Sep–Dec, hilling and weeding Dec–Feb, harvest Apr–Jun, chuño and tunta processing Jun–Jul, frost season May–Aug).
- Moon-related traditional practices are labelled as *traditional knowledge*, not as agronomic evidence.
- Fixed observances: Candelaria (2 Feb), Inti Raymi (24 Jun), Pachamama offering (1 Aug), equinoxes and solstices computed for the year.
- Response: `{data:{month, season, phases:[{name, at}], days:[{date, phase, illumination, sunrise, sunset, day_length_min, tasks[], events[]}], calendar:[{crop, stage, months[]}]}}`.

## 7. AI layer

- One OpenAI-compatible chat client (`POST {base}/v1/chat/completions`, optional bearer key from `LLAMACPP_API_KEY`) serves every engine. Any server that implements that API works; two are documented in [`deploy/llama-cpp.md`](../deploy/llama-cpp.md):
  - **llama.cpp** `llama-server`, used in development: Qwen3-4B-Instruct-2507 Q4_K_M for text on `:8081` (alias `qwen3-4b-instruct`) and Qwen2.5-VL-3B-Instruct Q4_K_M with its f16 mmproj for vision on `:8082` (alias `qwen2.5-vl-3b`).
  - **Ollama**'s OpenAI endpoint, used by the reference production server: one Ollama at `http://127.0.0.1:11434` with `qwen2.5:3b` for text and `qwen2.5vl:3b` for vision. Photos are reduced to `VISION_MAX_SIDE` pixels on the longest side before inference (the stored original is untouched), which keeps CPU-only triage near one minute.
- The variable names keep the `LLAMACPP_` prefix whatever the server: `LLAMACPP_TEXT_URL`, `LLAMACPP_VISION_URL`, `LLAMACPP_TEXT_MODEL`, `LLAMACPP_VISION_MODEL`. A trailing `/v1` in the URL is accepted. Availability is checked with `GET {url}/health` and, when that fails (Ollama has no `/health`), `GET {url}/v1/models`; 3 s timeout.
- Text: `LLM_PROVIDER=llamacpp` (default; the OpenAI-compatible server above) or `groq` (`GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_URL`). The admin setting `llm_provider` (`llamacpp|groq`) overrides it at runtime. Timeouts: 150 s for the local text model, 90 s for Groq.
- Vision: always the local server at `LLAMACPP_VISION_URL`, never Groq. The photo is sent as an OpenAI `image_url` content part with a `data:<mime>;base64,…` URL, temperature 0, `response_format: {"type":"json_object"}`, 180 s timeout. Qwen2.5-VL-3B is the model validated in the article (509 images: sensitivity 100 %, specificity 62 %, macro-F1 0.55).
- Diagnosis in two steps: the vision model returns a compact finding `{plant, symptoms, healthy, disease, scientific_name, confidence, severity}` from an English prompt with a differential guide for Andean diseases; the text model then writes `disease, description, causes[], treatment[], prevention[]` in the requested language without changing the finding. If the text step fails, the finding alone is stored. The web always shows the result with the note "This is a first check, not a final diagnosis" and asks the user to look at other plants and consult an agronomist before applying any product.
- Every JSON answer is extracted robustly (Qwen3 `<think>` blocks and ```json fences are stripped, the first complete JSON object is parsed), validated server-side and retried once on invalid JSON (`502 ai_invalid_response` after the second failure; `503 ai_unavailable` when the server cannot be reached).
- Prompts are written for farmers with little technical background: short sentences, everyday words, Spanish addressed as *usted*, doses per 20-litre backpack sprayer with products sold in Peru and registered with SENASA, and a short block of reference facts (late blight, hilling, frost) to anchor small models. The weather plan receives precomputed day notes (frost, rain, wind) and the weekly water balance.
- Images are stored under `UPLOAD_DIR` and are only sent to the configured vision server, which in both documented setups runs on the same host.
- All prompts reply in the requested locale (`es`, `en`, `qu`, `ay`; for `qu`/`ay` the model answers in Spanish with key terms in the chosen language when it cannot do better).

## 8. Web application

Routes: `/` landing, `/guide` (public video guide), `/login`, `/register`, `/forgot-password`, `/reset-password` (reads `#token=` from the e-mail link), `/auto-login`, `/app` (overview), `/app/weather`, `/app/almanac`, `/app/crops`, `/app/monitoring`, `/app/devices`, `/app/inputs`, `/app/pests`, `/app/yield`, `/app/advisory`, `/app/reports`, `/app/admin` (statistics), `/app/admin/users`, `/app/admin/audit`, `/app/admin/catalog`, `/app/admin/settings` (superadmin only), `/app/profile`.

The landing page is a bento grid: node video, a live-reading example, weather, pest triage, a crop photo, languages, yield and research tiles. The overview (`/app`) starts with a first-steps checklist (add a crop, connect a sensor, link it to the crop, set the location) that the user can hide. Every module has a "¿Cómo se usa?" panel that links to its video in the guide. Crops are shown with a photo per species (`web/public/images/crops/`).

Navigation follows the farmer's workflow, from the field to the decision:

| Group (es) | Items, in order |
|---|---|
| — | Inicio |
| **Mi campo** | Cultivos · Dispositivos · Monitoreo |
| **Clima y calendario** | Clima · Almanaque |
| **Decisiones** | Plagas · Insumos · Cosecha · Asesoría |
| **Registros** | Informes |
| **Administración** (admin only) | Usuarios · Bitácora · Catálogo · Configuración (superadmin only) |

Mobile bottom bar: Inicio, Cultivos, Monitoreo, Plagas, Más. The account menu holds Perfil, the video guide and sign-out.

### Motion and performance

- Theme: light and dark only. The first visit follows the OS preference once; afterwards the user's choice is kept. One round 44 px button shows a moon in light mode and a sun in dark mode; the icon swaps with a 200 ms rotate and scale, and the page change uses the View Transitions API with a circular `clip-path` reveal from the button (no blur), falling back to an instant switch.
- Top bar: language pill (globe + two-letter code; the menu lists native names), theme button and avatar, all 44 px high with the same radius.
- Page headers: title, one-line description and a compact "¿Cómo se usa?" disclosure directly under the top bar. No decorative photo banners; photos appear only where they carry meaning (crop photos, empty states, the pest example, the hardware videos). App content is at most 1440 px wide.
- Language switch: globe icon + native name (Español, Runasimi, Aymar aru, English) with a two-letter badge, no flags; text crossfades with a 6 px vertical slide (180 ms).
- All motion uses `transform`/`opacity` only and is disabled under `prefers-reduced-motion`.
- Landing is server-rendered; images via `next/image` with `sizes`, `priority` only for the hero; charts are lazy-loaded client components; API data cached client-side with stale-while-revalidate; no layout shift (fixed aspect ratios, reserved skeleton heights). Targets: Lighthouse performance ≥ 90 mobile, CLS < 0.05.

### Dialogs and notifications

- Confirmations use an alert dialog modelled on shadcn/ui's Base UI `AlertDialog` (`@base-ui/react`): centred, `sm` and `default` sizes, optional media icon in a tinted square, title, description, footer with Cancel and Action; destructive actions use the `--danger` button. Opening is a 150 ms fade plus scale from 0.96; the overlay is solid black at 40 % (light) or 60 % (dark), never blurred. Focus goes to Cancel for destructive dialogs; Esc and the overlay close it. Browser `confirm()` and `alert()` are not used.
- Notifications follow the Sileo pattern, re-implemented without its gooey/blur filters: one stack at the top centre; each toast starts as a compact pill (state icon + title) and expands with a spring into a card with description and an optional action button, then collapses and leaves. States: success (`--accent`), error (`--danger`), warning (`--warn`), info (`--link`), loading (spinner) and `promise` (loading → success/error in place). Pill and card use `--elevated` with a 1 px `--line` border; animation uses transform, opacity and height only; hover or focus pauses the timer; swipe up dismisses on touch; `aria-live="polite"` (errors `assertive`); motion disabled under reduced motion.

### Video guide

`/guide` is public and needs no account. It holds twelve 20-second videos in menu order (`01-dashboard` … `12-profile`, files in `web/public/videos/guide/`), built from real screenshots of the application with demonstration data, narrated in English by synthetic voices with burned-in subtitles. The page states this, shows each transcript, and offers Previous/Next, *Watch all* (continuous play) and deep links (`/guide#07-pests`). It is linked from the landing navigation and footer, the account menu and each module's help panel.

### Hardware videos

Five 10-second explainer clips (`kit`, `dht11`, `soil`, `lm393`, `esp32`) in `web/public/videos/hardware/` with English and Spanish narration and WebVTT captions. The footage is AI-generated and the clips carry the label "AI-generated footage (Gemini/Veo); synthetic narration voice", with the generator's watermark left visible. Devices shows them in "Conozca su nodo sensor"; the landing loops the muted `kit` clip when visible, with a button to watch it with sound. Audio is English for the English UI and Spanish otherwise. Nothing is downloaded until played, and nothing autoplays under reduced motion.

### Data visualisation

Charts must be readable by a farmer at a glance, plain-language first, numbers second:

- Every metric card states a verdict in words ("Suelo húmedo — no hace falta regar hoy") with a status colour, then the value.
- Current values: semicircular gauge with the optimal band drawn as a solid arc segment and the value marker.
- Time series: smooth line with the threshold band as a flat translucent rectangle (solid colour at low opacity, never a gradient), direct end-of-line labels instead of legends, crosshair tooltip with time and value.
- Weather: Apple-Weather-style daily rows with icon, rain probability and a min–max temperature range bar on a shared scale; hourly strip scrolls horizontally.
- Yield: horizontal factor bars around 1.0 (below = reduces, above = increases) and a single big revenue figure.
- Admin: small multiples and simple bars; no pie charts, no 3D.

Merged modules: Inputs = calculator + product catalogue (former Marketplace). Advisory = AI assistant chat + request to a human agronomist (former Asesoría + Asistente).

Weather first-run: if the user has no saved coordinates, the page asks for the browser location (`navigator.geolocation`), stores it with `PATCH /api/auth/me` and offers manual search as fallback.

### Design system

Apple-like restraint: large type, generous whitespace, real photography, hairline separators.

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#ffffff` | `#000000` |
| `--surface` | `#f5f5f7` | `#1c1c1e` |
| `--elevated` | `#ffffff` | `#2c2c2e` |
| `--line` | `#d2d2d7` | `#38383a` |
| `--text` | `#1d1d1f` | `#f5f5f7` |
| `--muted` | `#6e6e73` | `#a1a1a6` |
| `--accent` | `#248a3d` | `#30d158` |
| `--link` | `#0066cc` | `#2997ff` |
| `--warn` | `#b25000` | `#ff9f0a` |
| `--danger` | `#d70015` | `#ff453a` |

Rules: no `backdrop-filter`, no `filter: blur`, no gradients, no blurred shadows, no glassmorphism. Depth comes from `--surface` blocks and 1px `--line` borders. Radius 12 (controls), 20 (cards), 980 (pill buttons). Font Geist (OFL, self-hosted). Display sizes 48–80 px, weight 600, tracking −0.02em. Text never sits on a photo without a solid `--bg`/`--surface` panel. Theme: light / dark, stored per browser, no flash on load. Breakpoints 640/1024/1280; sidebar becomes a bottom tab bar under 1024 px. Touch targets ≥ 44 px. WCAG AA contrast.

Images live in `web/public/images/` with fixed names and are credited in `web/public/images/CREDITS.md`: `hero.jpg`, `terraces.jpg`, `potato-field.jpg`, `quinoa.jpg`, `farmer.jpg`, `altiplano.jpg`, `harvest.jpg`, `leaf.jpg`, `market.jpg`, `soil.jpg`, `sensor.jpg`, `auth.jpg`.

### Languages

`web/src/locales/{es,en,qu,ay}.json` with identical key sets, checked by `pnpm i18n:check`. Spanish is the default. Quechua and Aymara reuse the v1 glossary.

## 9. Code rules

- No comments in source code. Names carry the meaning.
- Rust: `config`, `error` (one `AppError` → JSON), `state`, `auth`, `domain/` (pure logic: yield, almanac, inputs, thresholds, telemetry parsing — unit tested), `infra/` (repositories, LLM, mailer, weather, storage), `routes/` (thin handlers). `cargo clippy -- -D warnings` and `cargo test` must pass.
- Web: `src/app` (routes), `src/components/ui` (primitives), `src/features/<module>`, `src/lib` (api client, auth, i18n, theme). Strict TypeScript, `pnpm lint` and `pnpm build` must pass.
- Latest stable versions of every dependency at the time of writing (Next.js 16.4, React 19.3, Tailwind CSS 4.3, TypeScript 6.0, Axum 0.8, SQLx 0.9).

## 10. Environment

API (`api/.env` in development; `/opt/apps/rust/agroyachay/api.env` in the reference production deployment). Values below are those of production; defaults and the full list are in [`api/README.md`](../api/README.md).

```
DATABASE_URL=postgres://agroyachay:***@127.0.0.1:5432/agroyachay
JWT_SECRET=***
PORT=9011                                   # set in the systemd unit; 5000 by default
PUBLIC_URL=https://agroyachay.ginit.dev
CORS_ORIGINS=https://agroyachay.ginit.dev
GOOGLE_CLIENT_ID=***
LLM_PROVIDER=llamacpp                       # llamacpp (any OpenAI-compatible server) | groq (text only)
LLAMACPP_TEXT_URL=http://127.0.0.1:11434    # Ollama; development: llama.cpp on :8081
LLAMACPP_VISION_URL=http://127.0.0.1:11434  # Ollama; development: llama.cpp on :8082
LLAMACPP_TEXT_MODEL=qwen2.5:3b              # development: qwen3-4b-instruct
LLAMACPP_VISION_MODEL=qwen2.5vl:3b          # development: qwen2.5-vl-3b
VISION_MAX_SIDE=640
LLM_TEXT_TIMEOUT_SECS=180
LLM_VISION_TIMEOUT_SECS=280
LLAMACPP_API_KEY=                           # only if the model server requires a key
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-120b
UPLOAD_DIR=/opt/apps/rust/agroyachay/uploads
ADMIN_EMAIL=***
ADMIN_PASSWORD=***
SUPERADMIN_EMAILS=a@example.org,b@example.org   # always superadmin; never demoted automatically
SMTP_HOST=smtp.gmail.com                    # empty: the reset link is logged at INFO instead
SMTP_PORT=587                               # 587 STARTTLS, 465 implicit TLS
SMTP_USERNAME=***
SMTP_PASSWORD=***                           # Gmail: App Password
SMTP_FROM="AgroYachay <no-reply@ginit.dev>"
```

Also read: `HOST`, `GROQ_URL`, `AUTH_RATE_LIMIT_PER_MINUTE`, `OFFLINE_AFTER_MINUTES`, `OPEN_METEO_URL`, `TEST_DATABASE_URL`, `RUST_LOG`. Weather uses Open-Meteo (no key).

Web (build time): `NEXT_PUBLIC_API_URL` (empty in production, same origin), `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `API_PROXY_TARGET` (target of the `/api/*` rewrite; default `http://127.0.0.1:5000`, production `http://127.0.0.1:9011`).
