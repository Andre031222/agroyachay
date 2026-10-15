# AgroYachay web

Next.js 16 (App Router) application for AgroYachay 3.0.0: landing page, public
video guide and the signed-in application. React 19, TypeScript, Tailwind CSS
4, Base UI dialogs, Recharts, and Google Identity Services through
`@react-oauth/google`. The API contract is in
[`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

## Run

Requirements: Node.js 22 or newer and pnpm 11 (`corepack enable`). The API
must be running (see [`../api/README.md`](../api/README.md)).

```bash
pnpm install
pnpm dev                                          # http://localhost:3000, /api → http://127.0.0.1:5000
API_PROXY_TARGET=http://127.0.0.1:9001 pnpm dev   # when the API runs on another port
```

| Script | Purpose |
|---|---|
| `pnpm dev` | development server on port 3000 |
| `pnpm build` | production build (`output: "standalone"`) |
| `pnpm start` | serve the build on port 3000 |
| `pnpm lint` | ESLint and `tsc --noEmit` |
| `pnpm i18n:check` | checks that `src/locales/{es,en,qu,ay}.json` share the same keys and placeholders |

## Environment

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

## Routes

| Route | Content |
|---|---|
| `/` | landing page (bento grid with the node video, a live-reading example, weather, pest triage, crops, languages, yield and research tiles) |
| `/guide` | public video guide: twelve 20-second videos in menu order, with transcripts, Previous/Next, *Watch all* and deep links such as `/guide#07-pests` |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | e-mail and password or Google; `/reset-password` reads `#token=` from the e-mail link |
| `/auto-login` | AgroCommish hand-off, `#token=…&redirect=devices` |
| `/app` | overview with the first-steps checklist (crop, sensor, link, location) |
| `/app/crops`, `/app/devices`, `/app/monitoring` | my field |
| `/app/weather`, `/app/almanac` | weather and calendar |
| `/app/pests`, `/app/inputs`, `/app/yield`, `/app/advisory` | decisions |
| `/app/reports` | printable report and `.xlsx` downloads |
| `/app/admin`, `/app/admin/users`, `/app/admin/audit`, `/app/admin/catalog`, `/app/admin/settings` | administration (settings: superadmin only) |
| `/app/profile` | name, language, location, password |

## Code layout

```
src/app/              routes (App Router)
src/components/ui/    primitives: Button, Card, AlertDialog, Toast, Tabs, Meter, PageHeader…
src/components/common/ language pill, theme button, logo, providers
src/features/<module> one folder per module (landing, guide, hardware, overview, crops, …)
src/lib/              API client, auth, i18n, theme, formatting
src/locales/          es (default), en, qu, ay
public/images/        photographs (credits in public/images/CREDITS.md), crop photos in images/crops/
public/videos/guide/  the twelve guide videos and posters
public/videos/hardware/ hardware explainer clips (es/en audio, WebVTT captions)
```

## Videos

- **Guide** (`public/videos/guide/`): built from real screenshots of the
  application with demonstration data, narrated in English with synthetic
  voices and burned-in subtitles. The page says so, and each video has its
  transcript.
- **Hardware** (`public/videos/hardware/`): five 10-second clips (`kit`,
  `dht11`, `soil`, `lm393`, `esp32`) with Spanish and English narration and
  captions, shown on Devices and on the landing page. The footage is
  AI-generated and labelled as such in the interface. Nothing is downloaded
  until a clip is played, and nothing autoplays under reduced motion.

## Design rules

Light and dark themes only (first visit follows the OS, then the user's
choice is kept). No `backdrop-filter`, no blur, no gradients, no shadows:
depth comes from `--surface` blocks and 1 px `--line` borders. Confirmations
use an alert dialog, notifications are toasts at the top centre, and every
animation uses `transform` and `opacity` and stops under
`prefers-reduced-motion`. Colour tokens and the full rules are in
[`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) §8.
