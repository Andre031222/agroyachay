# AgroYachay REST API

Reference for the AgroYachay 3.0.0 API (Rust, Axum 0.8). It summarises
[`ARCHITECTURE.md`](ARCHITECTURE.md) §2–3, which is the binding contract; the
handlers live in `api/src/routes/`.

- Base URL: `https://agroyachay.ginit.dev/api`; `POST /api/sensores/lectura`
  is also accepted over plain HTTP for the node firmware
- Development: `http://localhost:5000/api` (`PORT`; on macOS use another port,
  for example 9001, if the AirPlay receiver holds 5000)
- Content type: `application/json; charset=utf-8`, except image upload
  (`multipart/form-data`) and spreadsheet download
- Field names: `snake_case`

## Conventions

| Topic | Rule |
|---|---|
| Success | `200` or `201` with `{"data": …}`; lists may add `"meta": {"page", "per_page", "total"}` |
| Error | `{"error": {"code": "not_found", "message": "…"}}` with the matching HTTP status |
| Language | Error messages and model replies follow `Accept-Language`: `es` (default), `en`, `qu`, `ay` |
| Authentication | `Authorization: Bearer <JWT>`, HS256, claims `{sub, role, exp}`, valid 24 h |
| Roles | `farmer` (default), `admin`, `superadmin` |
| Rate limit | `POST` login, register, google, password, password/forgot and password/reset under `/api/auth/`: 10 requests per minute per IP by default, `AUTH_RATE_LIMIT_PER_MINUTE` (`429 rate_limited` with `Retry-After`) |
| Audit | logins, failed logins, registrations, password changes, password reset requests and resets, role and activation changes, settings changes, device claim and release, and deletions are written to `audit_log` |

Auth column: `–` public, `user` any signed-in user, `owner` the user who owns
the resource, `admin` admin or superadmin, `superadmin` superadmin only.

## Device and AgroCommish contract

These four interactions keep the v1 shapes exactly and do not use the
`{"data": …}` envelope. They are served on `agroyachay.ginit.dev`, the
domain used by v1, so flashed nodes and AgroCommish need no change.

### `POST /api/sensores/lectura` (–)

Called by the ESP32 node every 10 s.

```json
{ "esp32_id": "ESP32_A1B2C3", "temperatura": 24.0, "humedad_aire": 65.0,
  "humedad_suelo": 23, "timestamp": 1745000000 }
```

Also accepted: `{"esp32_id": "…", "lecturas": [{"tipo": "temperatura", "valor": 24.0, "unidad": "C"}]}`.

| Status | Body |
|---|---|
| 201 | `{success: true, message, sensor_id, esp32_id, lecturas_procesadas, timestamp, alertas?}` |
| 400 | `{success: false, message}` when `esp32_id` is missing or no value is valid |

- An unknown `esp32_id` creates a device with status `pending`.
- `timestamp` is Unix seconds; when missing or earlier than 2020 the server
  time is used.
- Metric mapping: `temperatura`/`temperatura_aire` → `air_temperature` (°C),
  `humedad_aire` → `air_humidity` (%), `humedad_suelo` → `soil_moisture` (%).
- Plausibility limits: temperature −40 to 80, humidity 0 to 100. Out-of-range
  values are rejected one by one.
- Accepted over plain HTTP as well as HTTPS.

### `GET /api/sensores/lecturas-recientes?esp32_id=X` (–)

Used by AgroCommish to verify a newly configured node.

| Status | Body |
|---|---|
| 200 | `{success: true, esp32_id, lecturas: [{tipo_lectura, valor, unidad, timestamp}]}`: last 9 values, newest first; `tipo_lectura` ∈ `temperatura_aire`, `humedad_aire`, `humedad_suelo`; ISO 8601 timestamp |
| 404 | `{success: false, message, lecturas: []}` |

### `POST /api/auth/login` (–)

Body `{"email": "…", "password": "…"}` (`username` is accepted in place of
`email`).

| Status | Body |
|---|---|
| 200 | `{success: true, token, data: {token, user: {id, nombre, name, email, role, rol}}}` |
| 401 | `{success: false, message}` |

### `/auto-login#token=JWT&redirect=devices` (web route)

AgroCommish opens this URL in the browser. The web application stores the
token, loads `GET /api/auth/me` and navigates to `/app/<redirect>`
(`dispositivos` is mapped to `devices`). The route is served on the same
domain as the API, `https://agroyachay.ginit.dev/auto-login`.

## Endpoints

### System and authentication

| Method and path | Auth | Description |
|---|---|---|
| `GET /api/health` | – | `{data: {status, name, version, database, llm, vision, llm_provider, llm_model, vision_model}}`; `llm` and `vision` are `ok` or `unavailable`, checked with `GET /health` and then `GET /v1/models` on the model server |
| `GET /api/config/public` | – | `{data: {name, long_name, google_client_id, languages, features}}` |
| `POST /api/auth/register` | – | `{name, email, password}` (password ≥ 8 characters) → `{data: {token, user}}` |
| `POST /api/auth/login` | – | see above |
| `POST /api/auth/google` | – | `{credential}` (Google ID token, verified against `GOOGLE_CLIENT_ID`) → `{data: {token, user}}`; links to an existing account with the same e-mail |
| `GET /api/auth/me` | user | `{data: user}` |
| `PATCH /api/auth/me` | user | `{name?, locale?, latitude?, longitude?, place_name?}` |
| `POST /api/auth/password` | user | `{current_password, new_password}` |
| `POST /api/auth/password/forgot` | – | `{email, locale?}` → always `{data: {sent: true}}`; sends a reset link by e-mail when the account exists and is active |
| `POST /api/auth/password/reset` | – | `{token, new_password}` → `{data: {token, user}}` (signs in) |

### Field

| Method and path | Auth | Description |
|---|---|---|
| `GET /api/dashboard` | user | counts (crops, active and pending devices, open alerts, diagnoses), latest reading per device, last 5 alerts |
| `GET /api/weather?lat&lon` | user | current conditions, next 24 h hourly, 7-day daily, and indicators `frost_risk` (min ≤ 2 °C), `heat_stress`, `rain_7d_mm`, `et0_7d_mm`, `spray_windows` (wind < 15 km/h, no rain, 08–17 h), `irrigation_hint`; source Open-Meteo |
| `POST /api/weather/plan` | user | `{lat, lon, locale}` → `{data: {summary, risk_level, days: [{date, activities[], avoid[]}]}}` (language model) |
| `GET /api/almanac?year&month&lat&lon` | user | `{data: {month, season, phases: [{name, at}], days: [{date, phase, illumination, sunrise, sunset, day_length_min, tasks[], events[]}], calendar: [{crop, stage, months[]}]}}` |

### Crops, devices and alerts

| Method and path | Auth | Description |
|---|---|---|
| `GET /api/crops/catalog` | user | supported species and their agronomic parameters |
| `GET /api/crops` | user | my crops |
| `POST /api/crops` | user | create a crop |
| `GET /api/crops/:id` | owner | detail with linked devices and latest readings |
| `PATCH /api/crops/:id` | owner | update |
| `DELETE /api/crops/:id` | owner | delete |
| `GET /api/devices` | user | my devices with latest reading and status (`online` if seen in the last 120 s) |
| `GET /api/devices/pending` | user | unclaimed devices seen in the last 24 h |
| `GET /api/devices/:id` | owner | one device with latest reading and thresholds |
| `POST /api/devices/:id/claim` | user | `{name, crop_id?}`; default thresholds are created |
| `PATCH /api/devices/:id` | owner | `{name?, crop_id?, thresholds?: [{metric, min, max}]}` |
| `POST /api/devices/:id/release` | owner | unlink; the device returns to `pending` |
| `GET /api/devices/:id/readings?range=1h\|24h\|7d\|30d` | owner | series per metric with min, avg and max; raw up to 24 h, hourly buckets for 7 d, 6-hour buckets for 30 d |
| `GET /api/alerts?status=open\|all` | user | alerts of my devices |
| `POST /api/alerts/:id/resolve` | owner | close an alert |

Default thresholds: air temperature 2–28 °C, air humidity 40–85 %, soil
moisture 30–80 %. A reading outside a threshold opens an alert unless one of
the same metric and kind is already open.

### Decisions

| Method and path | Auth | Description |
|---|---|---|
| `POST /api/pests/diagnose` | user | multipart `image` (JPEG, PNG or WebP, ≤ 8 MB, checked by magic bytes), `crop?`, `crop_id?` → `{healthy, disease, scientific_name, confidence, severity, description, causes[], treatment[], prevention[]}` from the local vision model |
| `GET /api/pests/:id` | owner | one diagnosis |
| `GET /api/pests/:id/image` | owner | the stored photo (bearer required; fetch as a blob) |
| `POST /api/pests/:id/plan` | owner | management plan for Peru `{urgency, steps[], products: [{name, dose}], organic_alternative, consult_agronomist}` |
| `GET /api/pests/history` | user | my diagnoses |

The diagnosis is made in two steps: the vision model (`LLAMACPP_VISION_URL`,
Qwen2.5-VL-3B) identifies the plant and the problem, and the text model words
the explanation in the requested language. The web shows every result with
the note that it is a first check, not a final diagnosis.

| `POST /api/yield/estimate` | user | `{crop_id}` or `{species, area_ha, sowing_date, lat?, lon?}` → yield (t/ha and total), revenue (PEN), confidence and every factor |
| `GET /api/yield/history` | user | my estimates |
| `POST /api/inputs/calculate` | user | `{species, area_ha, target_yield_t_ha?}` → N-P-K fertiliser, seed, lime and labour, each with quantity, unit, unit price and subtotal |
| `GET /api/products?category&q` | user | product catalogue (agrochemicals, seeds, fertilisers, equipment) with supplier link |
| `POST /api/assistant/chat` | user | `{messages: [{role, content}], locale}` → `{data: {reply}}`; the prompt includes the user's crops, region and latest readings |
| `GET /api/advisory` | user | my requests to an agronomist (admin: all requests) |
| `POST /api/advisory` | user | `{topic, priority, description, crop_id?}`; an AI draft answer is attached |
| `GET /api/advisory/:id` | owner or admin | one request |
| `POST /api/advisory/:id/answer` | admin | `{answer, status}` |

Yield model (article Eq. 1): `ŷ_ha = y0(c) · f_cli · f_phe`,
`Ŷ = ŷ_ha · A · f_area(A)`, `R̂ = 1000 · Ŷ · p(c)`. See ARCHITECTURE.md §5 for
the factor ranges and species parameters.

### Records and administration

| Method and path | Auth | Description |
|---|---|---|
| `GET /api/reports/summary` | user | data for the printable report page |
| `GET /api/reports/:kind.xlsx` | user | spreadsheet; `kind` ∈ `crops`, `readings`, `finance` |
| `GET /api/admin/products` | admin | catalogue including inactive products |
| `POST /api/admin/products` | admin | create a catalogue product |
| `PATCH /api/admin/products/:id` | admin | update a product |
| `DELETE /api/admin/products/:id` | admin | delete a product |
| `GET /api/admin/stats` | admin | users by role, users active in the last 7 days, devices, readings in the last 24 h, diagnoses |
| `GET /api/admin/users?q&page` | admin | user list |
| `PATCH /api/admin/users/:id` | admin | `{role?, active?}`; only a superadmin may grant `admin` or `superadmin` |
| `GET /api/admin/audit?page&action&user_id&from&to` | admin | audit log |
| `GET /api/admin/settings` | superadmin | key/value settings |
| `PUT /api/admin/settings` | superadmin | announcement, registration open, default region, LLM provider |

## Examples

```bash
# sign in and keep the token
TOKEN=$(curl -s https://agroyachay.ginit.dev/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.org","password":"••••••••"}' | jq -r .token)

# weather for Puno
curl -s "https://agroyachay.ginit.dev/api/weather?lat=-15.84&lon=-70.02" \
  -H "Authorization: Bearer $TOKEN" -H 'Accept-Language: es'

# pest triage from a photograph
curl -s https://agroyachay.ginit.dev/api/pests/diagnose \
  -H "Authorization: Bearer $TOKEN" -F image=@leaf.jpg -F crop=potato
```

## Response shapes

Conventions: success `{"data": …}`; paged lists add `"meta":{page,per_page,total}` (admin users, audit; per_page default 20, max 100). Errors `{"error":{"code","message","detail?"}}`, message localized by Accept-Language (send the UI language). Validation errors 422 `validation_error`, malformed JSON 400. Codes: bad_request, validation_error, unauthorized, invalid_credentials, token_invalid, forbidden, account_disabled, not_found, email_taken, device_already_claimed, conflict, rate_limited (Retry-After), ai_unavailable (503), ai_invalid_response (502), reset_token_invalid (400), weather_unavailable (503), payload_too_large (413), unsupported_media_type (415), registration_closed (403), google_not_configured (503), google_token_invalid (401), internal. Timestamps ISO UTC; dates YYYY-MM-DD. Server labels (almanac, weather plan, catalogue) follow Accept-Language; qu/ay fall back to Spanish labels; crop catalogue has `names` for all 4.

UserView: {"id","name","email","role":"farmer|admin|superadmin","active","locale","avatar_url","latitude","longitude","place_name","has_password","google_linked","created_at","last_login_at"}

GET /api/health → {"data":{"status":"ok|degraded","name":"AgroYachay","version":"3.0.0","database":"ok|unavailable","llm":"ok|unavailable","vision":"ok|unavailable","llm_provider":"llamacpp|groq","llm_model":"<LLAMACPP_TEXT_MODEL or GROQ_MODEL>","vision_model":"<LLAMACPP_VISION_MODEL>"}} — llm/vision come from the model server's GET /health, or GET /v1/models when /health fails (Ollama); Groq: GET /models with the key
GET /api/config/public → {"data":{"name","long_name","version","google_client_id":null|string,"languages":["es","en","qu","ay"],"default_language":"es","announcement":null|string|{es,en,qu,ay},"default_region":{"name","latitude","longitude"},"features":{"google_login","registration_open","llm_provider":"llamacpp|groq","vision_engine":"llamacpp","weather","almanac"}}}

POST /api/auth/register {name,email,password,locale?} → 201 {"data":{"token","user":UserView}}
POST /api/auth/login {email|username,password} → 200 {"success":true,"message","token","data":{"token","user":{...UserView,"nombre","rol"}}}; errors also have success:false + top-level message
POST /api/auth/google {credential} → {"data":{"token","user"}}
GET /api/auth/me → {"data":UserView}; PATCH /api/auth/me {name?,locale?,latitude?,longitude?,place_name?} (null clears; lat/lon together) → {"data":UserView}
POST /api/auth/password {current_password,new_password} → {"data":{"updated":true}}
POST /api/auth/password/forgot {email,locale?} → 200 {"data":{"sent":true}} for any well-formed e-mail, registered or not (422 validation_error if malformed). For an active account: earlier unused tokens are invalidated, a 32-byte random token is created (only its SHA-256 hex is stored, valid 60 min, single use) and an e-mail is sent in the user's saved locale (fallback: body locale, then Accept-Language) with the link ${PUBLIC_URL}/reset-password#token=<token>. Without SMTP_HOST the link is written to the API log at INFO. The e-mail is sent in the background, so the response time does not reveal whether the account exists.
POST /api/auth/password/reset {token,new_password} (new_password ≥ 8 chars, ≤ 72 bytes) → 200 {"data":{"token","user":UserView}}; 400 reset_token_invalid (unknown, used or expired token), 422 validation_error, 403 account_disabled. Google-only accounts gain a password (has_password becomes true).
Superadmins by e-mail: addresses in SUPERADMIN_EMAILS are promoted to superadmin at startup (audit role_change, meta.source="env") and are created or linked as superadmin on register and Google sign-in (registration_open does not block them). Nobody is demoted automatically.

GET /api/dashboard → {"data":{"counts":{"crops","devices_active","devices_online","devices_pending","open_alerts","diagnoses"},"latest_readings":[{"device_id","device_name","esp32_id","crop_id","crop_name","online","last_seen_at","readings":{"air_temperature":{"value","unit","recorded_at"},"air_humidity":{…},"soil_moisture":{…}}}],"recent_alerts":[Alert×5]}}

Crop: {"id","user_id","name","species":"potato","variety","area_ha","latitude","longitude","location_name","sowing_date","harvest_date","status":"planned|sown|growing|harvested|inactive","notes","created_at","updated_at","device_count"}
GET /api/crops → {"data":[Crop]}; POST → 201 {"data":Crop} (name, species, area_ha required); GET /api/crops/{id} → Crop + "devices":[DeviceView]; PATCH → Crop; DELETE → {"data":{"id","deleted":true}}
GET /api/crops/catalog → {"data":[{"code","name","names":{es,en,qu,ay},"scientific_name","base_yield_t_ha","price_pen_kg","cycle_days","temperature_c":{min,max},"air_humidity_pct":{min,max},"rainfall_30d_mm":{min,max},"altitude_m":{min,max},"nutrients_kg_ha":{n_kg_ha,p2o5_kg_ha,k2o_kg_ha},"seed_rate_kg_ha","labour_days_ha","sowing_months":[],"harvest_months":[]}]} codes: potato, quinoa, maize, faba_bean, oca, canihua, barley, wheat

DeviceView: {"id","esp32_id","name","status":"active|pending|inactive","online","crop_id","crop_name","last_seen_at","created_at","latest":{metric:{"value","unit","recorded_at"}},"thresholds":[{"metric","min","max"}]}
GET /api/devices, GET /api/devices/pending, GET /api/devices/{id} → DeviceView(s)
POST /api/devices/{id}/claim {name?,crop_id?} → DeviceView (409 device_already_claimed)
PATCH /api/devices/{id} {name?,crop_id?(null unlinks),thresholds?:[{metric,min,max}]} → DeviceView
POST /api/devices/{id}/release → {"data":{"id","status":"pending"}}
GET /api/devices/{id}/readings?range=1h|24h|7d|30d → {"data":{"device_id","range","bucket":"raw|1h|6h","from","to","series":[{"metric","unit","points":[{"t","avg","min","max","n"}],"stats":{"min","avg","max","count"}|null}]}} (always 3 series)

Alert: {"id","device_id","device_name","esp32_id","metric" (air_temperature|air_humidity|soil_moisture|connection),"kind":"low|high|offline","value","threshold","created_at","resolved_at"}
GET /api/alerts?status=open|all → {"data":[Alert]}; POST /api/alerts/{id}/resolve → {"data":Alert}

GET /api/weather?lat&lon → {"data":{"location":{"latitude","longitude","name","source":"query|profile|default","elevation","timezone","utc_offset_seconds"},"current":{"time","temperature","apparent_temperature","humidity","precipitation_mm","weather_code" (WMO),"cloud_cover","wind_kmh","wind_direction","is_day"},"hourly":[{"time" (local, no zone),"temperature","humidity","precipitation_mm","precipitation_probability","wind_kmh","weather_code"}×24],"daily":[{"date","weather_code","temperature_min","temperature_max","precipitation_mm","precipitation_probability","et0_mm","wind_max_kmh","uv_index_max","sunrise","sunset"}×7],"agro":{"frost_risk":{"risk","level":"none|moderate|severe","min_temperature","days":[]},"heat_stress":{"risk","max_temperature","days":[]},"rain_7d_mm","et0_7d_mm","spray_windows":[{"start","end","hours"}],"irrigation_hint":{"code":"irrigate|monitor|not_needed","balance_mm","message"}},"source":"open-meteo"}}
POST /api/weather/plan {lat?,lon?,locale?} → {"data":{"summary","risk_level":"low|medium|high|critical","days":[{"date","activities":[],"avoid":[]}]}}

GET /api/almanac?year&month&lat&lon&utc_offset_minutes? → {"data":{"month":{"year","month","name"},"latitude","longitude","utc_offset_minutes","season":{"code":"rainy|harvest|dry_frost|sowing","name","native_name","astronomical","astronomical_label"},"phases":[{"name":"new_moon|first_quarter|full_moon|last_quarter","label","at"}],"days":[{"date","phase","phase_label","illumination","moon_age_days","sunrise":"05:22","sunset":"17:37","day_length_min","tasks":[{"code","label","traditional"}],"events":[{"code","label"}]}],"month_tasks":[{"code","label","traditional"}],"calendar":[{"crop","crop_label","stage","stage_label","months":[]}],"traditional_knowledge_note"}}

Diagnosis: {"id","crop_id","crop","image_url":"/api/pests/{id}/image" (needs bearer → fetch as blob),"engine","model","healthy","disease","scientific_name","confidence":0-100,"severity":"none|low|moderate|high","description","causes":[],"treatment":[],"prevention":[],"plan":null|PestPlan,"created_at"}
POST /api/pests/diagnose multipart(image ≤8MB jpeg/png/webp, crop?, crop_id?, locale?) → 201 {"data":Diagnosis} (engine "llamacpp", model = LLAMACPP_VISION_MODEL; the vision model finds the problem, the text model words it in the requested locale); GET /api/pests/history; GET /api/pests/{id}
POST /api/pests/{id}/plan {locale?} → {"data":{"urgency":"immediate|24h|this_week|monitor","steps":[],"products":[{"name","dose"}],"organic_alternative","consult_agronomist"}}

POST /api/yield/estimate {crop_id} | {species,area_ha,sowing_date?,lat?,lon?} → 201 {"data":{"id","crop_id","crop_name","species","area_ha","sowing_date","price_pen_kg","yield_t_ha","total_t","revenue_pen","confidence","factors":{"base_yield_t_ha","f_cli","g_temperature":{"value","observed","window":[a,b]},"g_humidity":{…},"g_rainfall":{…},"f_phe":{"value","days_since_sowing","cycle_days","progress","assumed"},"f_area","delta_data","delta_phe","sensor_readings","data_sources":[]},"inputs":{},"created_at"}}; GET /api/yield/history

POST /api/inputs/calculate {species,area_ha,target_yield_t_ha?} → {"data":{"species","area_ha","target_yield_t_ha","scale","nutrient_demand":{"n_kg","p2o5_kg","k2o_kg"},"items":[{"code":"urea|dap|kcl|seed|lime|labour","kind","product_id","name","quantity","unit","unit_price_pen","subtotal_pen","amount_kg"}],"total_pen","cost_per_ha_pen","notes":["soil_test_recommended","split_nitrogen_application","lime_only_if_ph_below_5_5"]}} (notes are codes → translate in UI)
Product: {"id","sku","name","category":"fertilizer|seed|agrochemical|amendment|equipment","unit","price_pen","supplier","url","active","created_at"}
GET /api/products?category&q; GET /api/admin/products (incl. inactive); POST/PATCH/DELETE /api/admin/products[/{id}]

POST /api/assistant/chat {messages:[{role:"user|assistant",content}],locale} → {"data":{"reply","provider","model"}}
Advisory: {"id","user_id","user_name","user_email","crop_id","crop_name","topic","priority":"low|medium|high|urgent","description","status":"open|in_progress|answered|closed","ai_draft","answer","answered_by","answered_by_name","created_at","answered_at"}
GET /api/advisory?status&scope=mine (admins see all unless scope=mine); GET /api/advisory/{id}; POST /api/advisory → 201; POST /api/advisory/{id}/answer {answer,status} (admin)

GET /api/reports/summary → {"data":{"generated_at","user":UserView,"totals":{"crops","area_ha","devices","devices_online","open_alerts","diagnoses","input_cost_pen","expected_revenue_pen","expected_margin_pen"},"crops":[Crop+{input_cost_pen,expected_total_t,expected_revenue_pen,estimate_confidence,expected_margin_pen}],"devices":[DeviceView],"readings_30d":[{"metric","min","avg","max","count"}],"alerts":[Alert],"diagnoses":[{"id","crop","healthy","disease","confidence","severity","created_at"}]}}
GET /api/reports/{crops|readings|finance}.xlsx → file (fetch with bearer, save blob)

GET /api/admin/stats → {"data":{"users_total","users_by_role":{farmer,admin,superadmin},"active_last_7d","devices":{"total","active","pending","online"},"readings_24h","diagnoses_total","diagnoses_7d"}}
GET /api/admin/users?q&page&per_page → paged UserView; PATCH /api/admin/users/{id} {role?,active?} (admins manage farmers only; no self demote/deactivate → 422)
GET /api/admin/audit?page&per_page&action&user_id&from&to → paged {"id","user_id","user_name","user_email","action","target","ip","user_agent","meta","created_at"}; actions: login, login_failed, register, google_link, password_change, role_change, activation_change, settings_change, device_claim, device_release, crop_delete, product_create, product_update, product_delete, advisory_answer, superadmin_bootstrap, password_reset_request, password_reset, v1_import
GET/PUT /api/admin/settings (superadmin) → {"data":{"announcement","default_region":{"name","latitude","longitude"},"labour_day_pen","llm_provider":"llamacpp|groq","registration_open"}} (PUT partial)

