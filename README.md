# AgroYachay: An Open-Source IoT and Large-Language-Model Platform for Climate-Smart Decision Support in Smallholder Andean Agriculture

**Status:** Manuscript in preparation for SoftwareX (Elsevier)
**License:** [MIT](LICENSE)
**Live demo:** [agroyachay.ginit.dev](https://agroyachay.ginit.dev)
**Companion tool:** [AgroCommish](https://github.com/Andre031222/agrocommish) — ESP32 commissioning ([DOI 10.5281/zenodo.20655610](https://doi.org/10.5281/zenodo.20655610))

[![DOI](https://img.shields.io/badge/DOI-pending-1d4ed8?style=flat-square)](https://doi.org/10.5281/zenodo.XXXXXXX)
[![License: MIT](https://img.shields.io/badge/License-MIT-15803d?style=flat-square)](LICENSE)
[![Python 3.9+](https://img.shields.io/badge/Python-3.9%2B-64748b?style=flat-square)](https://www.python.org/)
[![React 18](https://img.shields.io/badge/React-18-38bdf8?style=flat-square)](https://react.dev/)
[![PostgreSQL 14+](https://img.shields.io/badge/PostgreSQL-14%2B-336791?style=flat-square)](https://www.postgresql.org/)

---

## Authors

| Name | Institution |
| --- | --- |
| Richar Andre Vilca-Solorzano | Universidad Nacional del Altiplano de Puno, Peru |
| Dina Maribel Yana-Yucra | Universidad Nacional del Altiplano de Puno, Peru |
| Renato Quispe-Vargas | Universidad Nacional del Altiplano de Puno, Peru |
| Vladimiro Ibañez-Quispe | Universidad Nacional del Altiplano de Puno, Peru |
| Fred Torres-Cruz | Universidad Nacional del Altiplano de Puno, Peru |

**Faculty:** Ingeniería Estadística e Informática — Universidad Nacional del Altiplano (UNAP), Puno, Peru

---

## Overview

Deploying low-cost agricultural IoT is now economically feasible, but reviews of
the field consistently report that the harder, recurring gap is the *last mile*
between raw telemetry and a decision a smallholder can act on. A node reporting
"soil moisture 18 %" does not tell a Quechua-speaking potato grower at 3,800 m
whether to irrigate today, whether the leaf spots on a plant are late blight, or
whether the season will pay for its inputs.

**AgroYachay** (*yachay*: "knowledge" in Quechua) closes that loop. It is an
open-source web platform that turns low-cost ESP32 telemetry into actionable
agronomic and economic decisions for Andean smallholders. ESP32 nodes streaming
air temperature/humidity (DHT11) and soil moisture (FC-28) feed a Flask/PostgreSQL
backend and a React dashboard with threshold alerts. A large-language-model layer
(Groq) adds image-based pest/disease diagnosis with locally available treatments,
a context-aware conversational agronomic assistant, and forecast-driven activity
planning. A transparent factor model couples crop phenology, climate and parcel
area with regional market prices to estimate yield, revenue and confidence, and
the system exports PDF/Excel reports. The interface is trilingual (Spanish,
Quechua, Aymara).

AgroYachay is the cloud counterpart of the **AgroCommish** commissioning tool,
which manufactures and provisions the ESP32 nodes; together they form an open,
reproducible *device-to-decision* pipeline for low-resource agriculture.

---

## Key Features

| Module | Function |
| --- | --- |
| Real-time monitoring | Ingests ESP32 readings, links devices to crops/users, stores time series, renders live temperature, air- and soil-humidity charts (Recharts) |
| Threshold alerts | Per-sensor configurable limits raise frost, drought and water-logging alerts |
| LLM pest/disease diagnosis | Upload a leaf photo → vision LLM returns a structured verdict (disease, confidence, severity) and a Peru-specific management plan with product doses and an organic alternative |
| Conversational agronomy | Context-aware assistant answers free-form questions conditioned on the farmer's crops, region and latest sensor values |
| Forecast planning | Turns current conditions and the 5-day OpenWeather forecast into a risk level, weekly activity plan and optimal-day recommendations |
| Yield & revenue estimation | Transparent multiplicative factor model (climate × phenology × area) × regional price → projected tonnage, expected revenue and a confidence score; no training data required |
| Reporting | Executive, crop-status, financial and climate-impact reports as styled PDF (ReportLab) and Excel (OpenPyXL) |
| Trilingual UI | Runtime locale dictionaries for Spanish (`es`), Quechua (`qu`) and Aymara (`ay`) |
| Security | JWT auth (Flask-JWT-Extended) with bcrypt hashing and optional Google OAuth |

---

## Architecture

AgroYachay follows a three-tier edge–cloud architecture:

```text
ESP32 (DHT11 + FC-28)  ──WiFi/HTTP(JSON)──►  Flask 3 backend  ──►  PostgreSQL 17
   (commissioned by                          │  controllers + services
    AgroCommish)                             │  ├─ groq_service   (LLM)
                                             │  └─ weather_service (OpenWeather)
                                             ▼
                                   React 18 SPA (Tailwind + Recharts)
                                   JWT-secured REST API
```

- **Backend** — Flask 3 (~7,300 LOC): request controllers (`auth`, `sensores`,
  `cultivos`, `plagas`, `clima`, `asistente`, `superadmin`), feature route
  modules (`prediccion`, `asesoria`, `informes`, `insumos`, `marketplace`),
  SQLAlchemy models, and a service layer. State persists in PostgreSQL across
  15 normalised tables.
- **Frontend** — React 18 SPA (~13,000 LOC) with Tailwind CSS, Recharts and an
  Axios REST client.
- **External services** — Groq LLM API (intelligence layer) and OpenWeather API
  (current conditions and forecast).

---

## Repository Structure

```text
.
├── backend/                     # Flask 3 + SQLAlchemy + PostgreSQL
│   ├── main.py                  # app entry point (WSGI: main:app)
│   ├── controllers/             # auth, sensores, cultivos, plagas, clima, asistente, superadmin
│   ├── app/
│   │   ├── routes/              # prediccion, asesoria, informes, insumos, marketplace
│   │   ├── models/              # SQLAlchemy models
│   │   ├── services/            # groq_service, weather_service, ml_prediccion
│   │   └── utils/               # PDF/Excel reports, email
│   ├── migrations/              # SQL schema + advanced-features migrations
│   ├── scripts/setup_postgres.py# one-shot DB bootstrap (tables, indexes, admin)
│   ├── tests/                   # pytest suite
│   └── requirements.txt
├── frontend/                    # React 18 + Vite + Tailwind
│   ├── src/                     # components, pages, context, locales (es/qu/ay)
│   ├── public/
│   └── package.json
├── arduino/                     # ESP32 firmware (companion: AgroCommish)
├── HARDWARE_SETUP.md            # wiring (ESP32 + DHT11 + FC-28)
├── CITATION.cff
└── LICENSE
```

---

## Installation

Requires **Python ≥ 3.9**, **Node.js ≥ 18** and **PostgreSQL ≥ 14**.

### 1. Backend

```bash
cd backend
python -m venv .venv && . .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                              # then fill in DB + API keys

# Bootstrap the database (tables, indexes, superadmin).
# Set ADMIN_EMAIL / ADMIN_PASSWORD first; otherwise a random password is printed.
python scripts/setup_postgres.py

python main.py                                     # serves on http://localhost:5000
```

Required environment variables (see [`backend/.env.example`](backend/.env.example)):
`DB_*`, `SECRET_KEY`, `JWT_SECRET_KEY`, `GROQ_API_KEY`, `OPENWEATHER_API_KEY`,
and optional `GOOGLE_CLIENT_ID` / `PLANT_ID_API_KEY`.

### 2. Frontend

```bash
cd frontend
npm install            # or: pnpm install
npm run dev            # development server
npm run build          # production build → frontend/build
```

Set `VITE_API_URL` (and optional `VITE_GOOGLE_CLIENT_ID`) in `frontend/.env`
(see [`frontend/.env.example`](frontend/.env.example)). For a same-origin
deployment, point the web server's `/api/*` to the backend and serve the build
statically.

### 3. Firmware

The ESP32 firmware and the full flashing/provisioning workflow are provided by
the companion tool **[AgroCommish](https://github.com/Andre031222/agrocommish)**.
Wiring is documented in [`HARDWARE_SETUP.md`](HARDWARE_SETUP.md).

---

## Tests

```bash
cd backend
pip install pytest
python -m pytest          # 15 tests

cd ../frontend
npm run test:run          # 13 tests (Vitest)
```

---

## Companion Ecosystem

| Project | Role | Reference |
| --- | --- | --- |
| **AgroCommish** | Manufactures and commissions ESP32 sensor nodes (detect → flash → provision → verify → activate) | [DOI 10.5281/zenodo.20655610](https://doi.org/10.5281/zenodo.20655610) |
| **AgroYachay** (this repo) | Cloud decision platform: monitoring, LLM agronomy, yield/revenue, reports | this repository |

Together they form a complete open device-to-decision pipeline on commodity
hardware, with no per-seat licensing.

---

## Citation

If you use this software, please cite:

```bibtex
@software{vilca2026agroyachay,
  author  = {Vilca Solorzano, Richar Andre and Yana Yucra, Dina Maribel and
             Quispe Vargas, Renato and Iba{\~n}ez Quispe, Vladimiro and
             Torres Cruz, Fred},
  title   = {AgroYachay: An open-source IoT and large-language-model platform
             for climate-smart decision support in smallholder Andean agriculture},
  year    = {2026},
  version = {1.0.0},
  url     = {https://github.com/Andre031222/agroyachay}
}
```

Citation metadata is also available in [`CITATION.cff`](CITATION.cff)
(GitHub: "Cite this repository").

---

## License

This project is licensed under the [MIT License](LICENSE).
