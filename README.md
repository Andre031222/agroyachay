<div align="center">

<img src="web/public/brand/agroyachay-mark-256.png" alt="AgroYachay" width="112" height="112">

# AgroYachay

### An open-source IoT and large-language-model platform supporting agronomic and economic decision-making for Andean smallholders

<a href="https://doi.org/10.1016/j.softx.2026.103037"><img src="https://img.shields.io/badge/SoftwareX_DOI-10.1016%2Fj.softx.2026.103037-1d4ed8?style=for-the-badge" alt="SoftwareX DOI"></a>
<a href="https://doi.org/10.5281/zenodo.20829992"><img src="https://img.shields.io/badge/DOI-10.5281%2Fzenodo.20829992-1d4ed8?style=for-the-badge" alt="Zenodo DOI"></a>
<a href="https://www.scimagojr.com/journalsearch.php?q=21100422153&tip=sid&clean=0"><img src="https://img.shields.io/badge/SCImago-Scopus_Q2-F39C12?style=for-the-badge" alt="SCImago Scopus Q2"></a>
<br>
<a href="https://agroyachay.ginit.dev"><img src="https://img.shields.io/badge/Live-agroyachay.ginit.dev-0F2444?style=for-the-badge" alt="Live instance"></a>
<a href="https://agroyachay.ginit.dev/guide"><img src="https://img.shields.io/badge/Video_guide-12_%C3%97_20_s-0F2444?style=for-the-badge" alt="Video guide"></a>
<a href="https://github.com/Andre031222/agrocommish"><img src="https://img.shields.io/badge/Companion-AgroCommish-7B2CBF?style=for-the-badge" alt="AgroCommish"></a>
<a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-2E7D32?style=for-the-badge" alt="MIT licence"></a>

<a href="https://github.com/Andre031222/agroyachay/actions/workflows/ci.yml"><img src="https://github.com/Andre031222/agroyachay/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
<img src="https://img.shields.io/badge/version-3.0.0-248a3d" alt="Version 3.0.0">
<img src="https://img.shields.io/badge/Rust-Axum_0.8-b7410e?logo=rust&logoColor=white" alt="Rust">
<img src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white" alt="Next.js 16">
<img src="https://img.shields.io/badge/PostgreSQL-17-336791?logo=postgresql&logoColor=white" alt="PostgreSQL 17">
<img src="https://img.shields.io/badge/models-llama.cpp_%7C_Ollama-555555" alt="llama.cpp or Ollama">
<img src="https://img.shields.io/badge/ES_%7C_QU_%7C_AY_%7C_EN-4_languages-248a3d" alt="Four languages">

</div>

AgroYachay (*yachay*, "knowledge" in Quechua) turns readings from low-cost
ESP32 field nodes into agronomic and economic decisions for smallholders in the
Peruvian and Bolivian highlands. It combines real-time monitoring, local
weather, a computed agricultural almanac, pest and disease triage from a photo
with a locally hosted vision model, input costing and a transparent yield and
revenue model, in Spanish, English, Quechua and Aymara. Version 3.0.0 is a
rewrite of the platform described in the SoftwareX article: a Rust API, a
Next.js web application, PostgreSQL, and open models served by any
OpenAI-compatible server (llama.cpp or Ollama).

## What it does

- **Monitoring**: air temperature, air humidity and soil moisture from each
  node, per-device thresholds, alerts (including an offline alert), and a
  plain-language verdict on every metric.
- **Weather**: Open-Meteo forecast for the user's location (browser
  geolocation or place search) with frost risk, spray windows, reference
  evapotranspiration and a weekly activity plan written by the text model.
- **Almanac**: moon phases, sunrise and sunset, and the Andean agricultural
  calendar, computed for the user's coordinates; moon-related practices are
  labelled as traditional knowledge, not agronomic evidence.
- **Pest triage**: the vision model identifies the problem in a photo, the text
  model explains it and proposes a management plan. Every result carries the
  note that it is a first check, not a final diagnosis.
- **Inputs and yield**: N-P-K, seed, lime and labour with costs from an
  editable product catalogue; yield and revenue from the article's Eq. 1 with
  every factor shown in plain words.
- **Advisory and reports**: an assistant that knows the user's crops and
  readings, requests to a human agronomist, a printable report and `.xlsx`
  downloads.
- **Accounts**: e-mail and password or Google sign-in, password recovery by
  e-mail, roles `farmer`, `admin` and `superadmin`, and an audit log
  (bitácora) of every sensitive action.

A public [video guide](https://agroyachay.ginit.dev/guide) shows each module
in twelve 20-second videos.

## Architecture

```mermaid
flowchart LR
    node["ESP32 node"] -- "POST /api/sensores/lectura<br/>(HTTP or HTTPS)" --> nginx
    commish["AgroCommish"] -- "login, verification" --> nginx
    browser["Browser"] -- HTTPS --> nginx
    nginx -- "/api/*" --> api["API<br/>Rust, Axum"]
    nginx -- "everything else" --> web["Web<br/>Next.js"]
    api --> db[("PostgreSQL")]
    api -- "/v1/chat/completions" --> llm["OpenAI-compatible model server<br/>llama.cpp or Ollama"]
    api --> meteo["Open-Meteo"]
    api -. "optional, text only" .-> groq["Groq"]
```

| Component | Technology | Folder |
|---|---|---|
| API | Rust (edition 2024), Axum 0.8, SQLx 0.9, Tokio | `api/` |
| Web application | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 | `web/` |
| Database | PostgreSQL 17 (14 or newer works); schema in SQLx migrations | `api/migrations/` |
| Sensing node | ESP32 DevKit v1, DHT11, FC-28; contract unchanged since v1 | `firmware/agroyachay-node/` |
| Simulation | Wokwi browser simulation of the node | `simulation/` |
| Language models | Qwen2.5-VL-3B-Instruct (vision; the model validated in the article) and a text model, through llama.cpp or Ollama; Groq optional for text | `docs/DEPLOYMENT.md` (Appendix B) |
| Commissioning | [AgroCommish](https://github.com/Andre031222/agrocommish) desktop tool | separate repository |

The binding description of the contract, data model and conventions is
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Repository layout

```
api/          Rust service: REST API, telemetry ingestion, models, reports, SQL migrations
web/          Next.js landing page, video guide and application
firmware/     ESP32 node firmware (Arduino sketch)
simulation/   Wokwi simulation of the node, no hardware needed
deploy/       nginx, systemd, Docker Compose, model servers, v1 → v3 data migration
docs/         architecture, API reference, deployment, release policy, tutorial script
```

## Quick start (development)

Requirements: Rust 1.88 or newer, Node.js 22 or newer with pnpm
(`corepack enable`), PostgreSQL 14 or newer, and optionally llama.cpp or
Ollama for the AI features.

**1. Database.** The role needs `CREATEDB` only for the integration tests,
which create `agroyachay_test`.

```bash
psql -U postgres -c "CREATE ROLE agroyachay LOGIN PASSWORD 'agroyachay' CREATEDB;"
psql -U postgres -c "CREATE DATABASE agroyachay OWNER agroyachay;"
```

**2. API** (port 5000; migrations run on start-up and a superadmin is created
from `ADMIN_EMAIL`/`ADMIN_PASSWORD` if none exists).

```bash
cd api
cat > .env <<'EOF'
DATABASE_URL=postgres://agroyachay:agroyachay@127.0.0.1:5432/agroyachay
JWT_SECRET=dev-only-secret-change-me
PORT=5000
PUBLIC_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000
ADMIN_EMAIL=admin@example.org
ADMIN_PASSWORD=change-me-now
LLM_PROVIDER=llamacpp
LLAMACPP_TEXT_URL=http://127.0.0.1:8081
LLAMACPP_VISION_URL=http://127.0.0.1:8082
LLAMACPP_TEXT_MODEL=qwen3-4b-instruct
LLAMACPP_VISION_MODEL=qwen2.5-vl-3b
EOF
cargo run
curl -s http://127.0.0.1:5000/api/health
```

On macOS the AirPlay receiver may already hold port 5000. Use another port
(`PORT=9001 cargo run`) and point the web proxy at it in step 3.

**3. Web** (<http://localhost:3000>; requests to `/api` are forwarded to
`API_PROXY_TARGET`, default `http://127.0.0.1:5000`).

```bash
cd web
pnpm install
pnpm dev                                            # API on :5000
API_PROXY_TARGET=http://127.0.0.1:9001 pnpm dev     # API on :9001
```

**4. Models** (optional; without them the API still runs, `/api/health`
reports `llm` and `vision` as `unavailable` and AI endpoints answer `503`).
Either two llama.cpp servers, as in the `.env` above:

```bash
llama-server -m Qwen3-4B-Instruct-2507-Q4_K_M.gguf --alias qwen3-4b-instruct \
  --host 127.0.0.1 --port 8081 -c 8192 --jinja
llama-server -m Qwen2.5-VL-3B-Instruct-Q4_K_M.gguf \
  --mmproj mmproj-Qwen2.5-VL-3B-Instruct-f16.gguf --alias qwen2.5-vl-3b \
  --host 127.0.0.1 --port 8082 -c 8192 --jinja
```

or one Ollama server for both roles, with these lines in `api/.env`:

```bash
ollama pull qwen2.5vl:3b
ollama pull qwen2.5:3b
# api/.env
LLAMACPP_TEXT_URL=http://127.0.0.1:11434
LLAMACPP_VISION_URL=http://127.0.0.1:11434
LLAMACPP_TEXT_MODEL=qwen2.5:3b
LLAMACPP_VISION_MODEL=qwen2.5vl:3b
```

GGUF downloads, flags and Ollama notes are in
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md#appendix-b-local-language-and-vision-models); every variable is listed in
[Appendix A](docs/DEPLOYMENT.md#appendix-a-environment-variables-api). A single-host stack with Docker Compose is
in [`deploy/docker-compose.yml`](deploy/docker-compose.yml), and the
production procedure in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Compatibility with flashed devices

Nodes flashed and configured with AgroCommish for v1 need no change. These
requests keep the v1 paths and payloads on the same domain,
`agroyachay.ginit.dev`:

| Caller | Request |
|---|---|
| ESP32 firmware | `POST /api/sensores/lectura`, also accepted over plain HTTP |
| AgroCommish verification | `GET /api/sensores/lecturas-recientes?esp32_id=…` |
| AgroCommish activation | `POST /api/auth/login` with `{username\|email, password}` |
| AgroCommish hand-off | the browser opens `/auto-login#token=…&redirect=devices` |

Plain HTTP stays open for ingestion because the firmware has no CA bundle and
does not follow redirects. A node that reports an unknown `esp32_id` appears in
**Devices** as pending until a user claims it. In development the API listens
on port 5000, which is also the port AgroCommish proposes for a LAN server
(`http://<lan-ip>:5000/api/sensores/lectura`).

## Tests

```bash
cd api
cargo test --lib                              # unit tests, no database or models needed
cargo test                                    # also integration tests (needs PostgreSQL)
cargo clippy --all-targets -- -D warnings

cd web
pnpm lint                                     # ESLint and tsc --noEmit
pnpm i18n:check                               # the four locale files share one key set
pnpm build
```

The integration tests (`api/tests/`) use `TEST_DATABASE_URL`, or
`DATABASE_URL` with the database name replaced by `agroyachay_test`. The node
can be exercised end to end without hardware with the
[Wokwi simulation](simulation/README.md).

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): contract, data model, AI layer, web design rules
- [`docs/API.md`](docs/API.md): REST API reference
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md): production deployment (Debian 12, nginx, systemd)
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md): production deployment, local models (llama.cpp or Ollama) and every environment variable
- [`docs/HARDWARE.md`](docs/HARDWARE.md): wiring, firmware, calibration ([Spanish](docs/HARDWARE.es.md))
- [`simulation/README.md`](simulation/README.md): Wokwi simulation of the node

## Version 1 and version 3

The version described in the SoftwareX article is **AgroYachay v1.0.1** (Flask
API, React web). Its code stays available, unchanged, at tag
[`v1.0.1`](https://github.com/Andre031222/agroyachay/releases/tag/v1.0.1) and in
the immutable Zenodo record
[10.5281/zenodo.20829992](https://doi.org/10.5281/zenodo.20829992).

Version 3 keeps the scientific content of the article (sensing node and
telemetry contract, yield and revenue model, local vision triage with
Qwen2.5-VL-3B, four-language interface) and replaces the implementation.
Version 2 was an internal prototype that was never released, so the public
version numbers go from 1.0.1 to 3.0.0 on purpose. The tags `v1.0.0` and
`v1.0.1` and their Zenodo records are never moved or rewritten.

The pest triage figures reported in the article (Qwen2.5-VL-3B on 509 images:
sensitivity 100 %, specificity 62 %, macro-F1 0.55) are the reason the
application presents every result as a first check to be confirmed in the
field.

## How to cite

Please cite the article:

```bibtex
@article{torrescruz2026agroyachay,
  author  = {Torres-Cruz, Fred and Vilca-Solorzano, Richar Andre and
             Yana-Yucra, Dina Maribel and Iba{\~n}ez-Quispe, Vladimiro and
             Fuentes-Navarro, Eduardo Leuman},
  title   = {{AgroYachay}: An open-source {IoT} and large-language-model platform
             supporting agronomic and economic decision-making for {Andean} smallholders},
  journal = {SoftwareX},
  volume  = {36},
  pages   = {103037},
  year    = {2026},
  doi     = {10.1016/j.softx.2026.103037}
}
```

To refer to the code, cite the software archive,
[doi:10.5281/zenodo.20829992](https://doi.org/10.5281/zenodo.20829992)
(v1.0.1; later releases are added as new versions of the same Zenodo record).
GitHub's "Cite this repository" button reads [`CITATION.cff`](CITATION.cff).

## Authors

Authors of the work described in the article:

| Author | Affiliation |
|---|---|
| Fred Torres-Cruz | Doctoral Program in Sustainable Agriculture, Universidad Nacional Agraria La Molina, Peru |
| Richar Andre Vilca-Solorzano (corresponding) | Dept. of Statistical and Informatics Engineering, Universidad Nacional del Altiplano (UNAP), Puno, Peru |
| Dina Maribel Yana-Yucra | Universidad Nacional del Altiplano (UNAP), Puno, Peru |
| Vladimiro Ibañez-Quispe | Universidad Nacional del Altiplano (UNAP), Puno, Peru |
| Eduardo Leuman Fuentes-Navarro | Faculty of Animal Science, Universidad Nacional Agraria La Molina, Peru |

AgroYachay 3 was written by, and is maintained by, Richar Andre
Vilca-Solorzano ([@Andre031222](https://github.com/Andre031222)). Issues and
pull requests are welcome on
[GitHub](https://github.com/Andre031222/agroyachay).

## Acknowledgments

This open-source implementation was developed independently with a new architecture (IoT + LLM stack). We gratefully acknowledge the FINESI course project team whose early agro-IoT concept and title informed this line of work, including Flor, Sebastián, Yeferson Dariun Laura Livise, and the other classmates who contributed to that group presentation.

## Licence

Source code: MIT License, see [`LICENSE`](LICENSE). Photographs in
`web/public/images/` keep their own licences, listed in
[`CREDITS.md`](web/public/images/CREDITS.md). The hardware explainer clips use
AI-generated footage and synthetic narration, and are labelled as such in the
application.
