# EduPulse Gradebook

A production-grade score-ingestion + gradebook system for no-login classroom
games. Games POST scored events to a **Cloudflare Worker**, which stores them in
**Cloudflare D1** (SQLite). A **zero-dependency dashboard** on **Cloudflare
Pages** reads aggregates for standards mastery, student progress, misconception
signal, CSV export, and a paste-ready "Momentum Brief".

```
  HTML/JS game ──(x-ingest-key, write-only)──▶  Worker  ──▶  D1 (scores)
                                                   ▲
  Dashboard (Pages) ──(x-admin-key, read/export)──┘
```

## Architecture

| Layer        | Tech                         | Purpose                                       |
|--------------|------------------------------|-----------------------------------------------|
| Ingestion/API| Cloudflare Worker (ESM)      | Validate, dedupe, store, aggregate, export    |
| Store        | Cloudflare D1 (SQLite)       | `scores` table, indexed on standard/student/period/ts |
| Dashboard    | Static site on Pages         | Pure HTML/CSS/SVG/JS — **no CDNs, no deps**   |
| Client       | `EWLScoreBridge` v2.0        | Offline-safe queue + confirmed delivery       |
| CI/CD        | GitHub Actions               | Auto-deploy Worker + Pages on push to `main`  |

### Data model (`scores`)

`event_id` (PK), `ts`, `received_at`, `device_id`, `student_id`, `student_name`,
`class_period`, `activity_id`, `activity_title`, `standard`, `score`,
`max_score`, `percent`, `stars`, `problems_correct`, `problems_attempted`,
`misconceptions` (pipe-delimited), `duration_sec`. Clients send **camelCase**;
the Worker stores **snake_case**. `event_id` PRIMARY KEY + `INSERT OR IGNORE`
gives idempotent dedupe.

### API

| Method | Path              | Auth          | Returns                                  |
|--------|-------------------|---------------|------------------------------------------|
| OPTIONS| `*`               | —             | 204 CORS preflight                       |
| GET    | `/api/health`     | —             | `{ ok, service, time }`                  |
| POST   | `/api/scores`     | `x-ingest-key`| `{ ok, written, skipped }`               |
| GET    | `/api/scores`     | `x-admin-key` | `{ ok, count, rows }` (filters below)    |
| GET    | `/api/summary`    | `x-admin-key` | per-standard, per-student, misconceptions, overall |
| GET    | `/api/export.csv` | `x-admin-key` | CSV (UTF-8 BOM, escaped, attachment)     |

`GET /api/scores` filters (all parameterized): `standard`, `classPeriod`,
`studentId`, `since` (ISO), `limit`. Every response carries CORS headers
(`Access-Control-Allow-Origin` from `env.ALLOWED_ORIGINS`, default `*`). All
handlers are wrapped in try/catch → 500 JSON. No secrets in source.

## 🔐 Two-key security model

This is a **no-login** game, so *some* credential has to live in client source.
We split write from read so that unavoidable exposure is harmless:

- **`INGEST_KEY` — write-only.** Ships in the game/client (unavoidable). It can
  **only append rows** — it cannot read, list, or export anything. Worst case if
  leaked: someone injects junk rows, which are easily purged. No student data is
  exposed.
- **`ADMIN_KEY` — read/export.** **Never ships to clients.** Entered in the
  dashboard (kept in `sessionStorage`/memory only, cleared on sign-out) or used
  from `curl`. This is the key that can read and export student data.

Both are stored as **Wrangler secrets** (`wrangler secret put …`) — never in
`wrangler.toml`, never committed.

## Local development

```bash
npm install
npm run db:migrate:local          # apply migrations to local D1
# create .dev.vars (gitignored) with:
#   INGEST_KEY="dev-ingest"
#   ADMIN_KEY="dev-admin"
npm run dev                       # wrangler dev — Worker at http://localhost:8787

# run the logic tests (real SQLite via node:sqlite, no network)
node --experimental-sqlite test/worker.test.mjs
```

Serve the dashboard locally by opening `public/index.html` and pointing it at
your `wrangler dev` URL, or `npm run pages:deploy` to publish.

## Deploy pipeline

### One-time setup (local, authenticated wrangler + gh)

```bash
# 1) Create the D1 database, then paste its database_id into wrangler.toml
wrangler d1 create edupulse-gradebook

# 2) Apply migrations to the remote DB
wrangler d1 migrations apply edupulse-gradebook --remote

# 3) Set the two secrets (use your generated keys)
wrangler secret put INGEST_KEY
wrangler secret put ADMIN_KEY

# 4) Deploy the Worker, then the dashboard
wrangler deploy
wrangler pages deploy public --project-name edupulse-gradebook
```

### CI/CD (GitHub Actions → Cloudflare)

`.github/workflows/deploy.yml` deploys the Worker + Pages on every push to
`main` via `cloudflare/wrangler-action@v3`. Add these repo secrets:

```bash
# A Cloudflare API token with: Workers Scripts:Edit, D1:Edit, Pages:Edit
gh secret set CLOUDFLARE_API_TOKEN  --body "<your-cloudflare-api-token>"
gh secret set CLOUDFLARE_ACCOUNT_ID --body "<your-cloudflare-account-id>"
```

> The two app secrets (`INGEST_KEY`, `ADMIN_KEY`) live in Cloudflare (Wrangler
> secrets), **not** in GitHub — CI never needs them.

> If `edupulse-gradebook/` is a subdirectory of a larger repo rather than its own
> repo root, uncomment the `workingDirectory:` lines in `deploy.yml`.

## npm scripts

| script             | does                                            |
|--------------------|-------------------------------------------------|
| `dev`              | `wrangler dev`                                  |
| `deploy`           | `wrangler deploy` (Worker)                       |
| `db:migrate`       | apply D1 migrations `--remote`                   |
| `db:migrate:local` | apply D1 migrations `--local`                    |
| `pages:deploy`     | deploy `public/` to Pages project               |
| `test`             | run worker logic tests (`node:sqlite`)          |

## Repository layout

```
edupulse-gradebook/
├─ README.md  LICENSE  .gitignore  package.json  wrangler.toml
├─ migrations/0001_init.sql        # D1 schema + indexes
├─ src/worker.js                   # ingestion + query API
├─ public/index.html               # dashboard (single file, no deps)
├─ public/ewl-score-bridge.js      # client module (served + reusable)
├─ test/worker.test.mjs            # logic tests against real SQLite
├─ .github/workflows/deploy.yml    # CI/CD
└─ docs/INTEGRATION.md             # game wire-up guide
```

See **[docs/INTEGRATION.md](docs/INTEGRATION.md)** for the game wire-up and curl recipes.
