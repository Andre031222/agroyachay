# AgroYachay REST API

The backend exposes a JSON REST API (Flask) under `/api`. All responses are JSON
with a top-level `success` boolean; protected endpoints require a JWT
`Authorization: Bearer <token>` header. This document lists the endpoint groups
and the payloads of the most-used routes; the source of truth is the blueprint
definitions in [`backend/app/routes/`](../backend/app/routes/).

- **Base URL (demo):** `https://agroyachay.ginit.dev`
- **Auth scheme:** JWT (Flask-JWT-Extended), bcrypt password hashing
- **Content type:** `application/json` (except image upload, which is multipart)

## Endpoint groups

| Prefix | Module | Purpose |
|---|---|---|
| `/api/auth` | Authentication | register, login, Google OAuth, profile |
| `/api/sensores` | Sensors | ingest readings, list/link devices |
| `/api/cultivos` | Crops | CRUD crops, link devices, history |
| `/api/plagas` | Pest diagnosis | image-based vision diagnosis + advice |
| `/api/asistente` | Assistant | conversational agronomic Q&A (text LLM) |
| `/api/clima` | Weather | current conditions and forecast |
| `/api/prediccion` | Yield/revenue | factor-model yield and revenue estimate |
| `/api/informes` | Reports | generate/download PDF & Excel reports |
| `/api/insumos` | Inputs | input-cost calculation |
| `/api/asesoria` | Advisory | specialized advisory tickets |
| `/api/marketplace` | Marketplace | product listings |
| `/api/serial` | Provisioning | USB port detection and ESP32 config |
| `/health` | Health | liveness probe (no auth) |

## Key endpoints

### `POST /api/auth/login`
```json
{ "email": "user@example.com", "password": "secret" }
```
→ `{ "success": true, "data": { "token": "<jwt>", "user": { ... } } }`

### `POST /api/auth/register`
```json
{ "nombre": "Name", "email": "user@example.com", "password": "secret", "telefono": "999999999" }
```

### `POST /api/sensores/lectura`  *(called by the ESP32 node; no JWT)*
```json
{ "esp32_id": "ESP32_A1B2C3", "temperatura": 24.0, "humedad_aire": 65.0, "humedad_suelo": 23, "timestamp": 1745000000 }
```
→ stores the reading and evaluates threshold alerts.

### `POST /api/plagas/detectar-vision`  *(JWT; multipart)*
Form field `imagen` = leaf/plant photo. Runs the self-hosted open vision model
(qwen2.5-VL via Ollama) and returns a structured verdict:
```json
{ "success": true, "resultado": {
  "is_healthy": false, "nombre": "Tizón tardío", "confianza": 78,
  "severidad": "moderada", "descripcion": "...", "causas": "...",
  "tratamiento": "...", "prevencion": "..." } }
```

### `POST /api/asistente/consulta`  *(JWT)*
```json
{ "pregunta": "¿Cuándo debo regar mi cultivo de papa?" }
```
→ `{ "success": true, "data": { "respuesta": "...", "tokens_usados": 487 } }`

### `GET /api/clima/pronostico?ciudad=Puno`  *(JWT)*
→ current conditions and a 5-day forecast (OpenWeather, cached).

### `POST /api/prediccion/cosecha`  *(JWT)*
Estimates yield and revenue for a registered crop via the transparent factor
model (see the manuscript for the equations); returns projected tonnage,
expected revenue, contributing factors and a confidence score.

### `POST /api/informes/generar`  *(JWT)*
```json
{ "tipo_informe": "ejecutivo" }
```
→ generates a styled PDF/Excel report (executive, crop-status, financial or
climate-impact).

## Notes

- **Vision runs locally.** The pest endpoint calls a self-hosted Ollama model, so
  images are not sent to a third-party API. A `VISION_ENGINE=ollama|groq` switch
  selects the engine; `OLLAMA_URL` and `OLLAMA_VISION_MODEL` configure it.
- **Errors** return `{ "success": false, "message": "..." }` with an appropriate
  HTTP status (400 validation, 401/422 auth, 503 upstream model error).
