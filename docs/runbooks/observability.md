# Observability runbook

## Signals

| Signal | Source | What it shows |
| --- | --- | --- |
| `GET /api/health` | `functions/api/health.js` | build commit and time, D1 reachability, never cached, no secrets |
| Request log line | `functions/_lib/http.js` via `functions/_lib/security/log.js` | one JSON line per API request: `ts`, `request_id`, `route`, `method`, `status`, `duration_ms` |
| `api_error` log line | same | error class and first stack frame (never the message) |
| `csp_violation` log line | `functions/api/csp-report.js` | violated directive and blocked origin |
| `X-Request-Id` header | every handler response | correlates a user report with a log line; a safe incoming id is reused |

Logs are redacted by allowlist (`LOG_FIELDS` in `log.js`): unknown keys are dropped and any string with spaces is replaced by `[redacted]`, so free text cannot be logged. Routes are logged by pattern (`/api/bcpss/plans/:id`) and never with a query string. To log a new field, add it to `LOG_FIELDS` with a test.

Read logs: Cloudflare dashboard, Pages project, Functions, Real-time logs; or `wrangler pages deployment tail` (read-only).

## /api/health responses

200 `{ ok: true, build: { commit, built_at }, d1: "ok" | "absent" }`. 503 with `d1: "error"` when D1 is bound but a `SELECT 1` fails or takes over 1.5 s. `commit: "unknown"` means the public build stamp (`/access-practice-lab/config.json`) was unreadable.

## Alert thresholds

| Condition | Threshold | Action |
| --- | --- | --- |
| Health not 200 | 2 consecutive failures, 1 minute apart | check D1 status, last deploy, rollback if the commit is new |
| Health `d1: "error"` | any 503 | check D1 dashboard; telemetry and plans fall back to errors, read APIs use the seed |
| 5xx rate | over 1% of API requests for 5 min, or 10 events in 5 min | find `api_error` lines by `route`, use `error_at` to locate the fault |
| p95 `duration_ms` | over 1500 ms for 10 min on any read route | check D1 latency and the Neon backend |
| 429 rate | over 5% of requests on a write route for 10 min | a class behind one IP may be sharing a limit; confirm the front end sends `X-Anon-Token`, then raise the limit in `schema.js` |
| 413 / 422 spikes on plans | over 20 in 10 min | possible abuse or a confused UI; check `kinds` in the 422 responses (never the text) |
| `csp_violation` | any new directive or origin after a deploy | investigate before enabling enforcement (docs/security/csp.md) |
| Stale build | commit differs from `origin/main` 15 min after a push | `npm run ship -- --verify` (read-only) |

These are starting values. Tune after a week of real traffic.

## Synthetic check

```sh
node tools/synthetic-check.mjs https://<preview-host> --timeout-ms=5000
```

Hits `/api/health`, the units list and one unit detail. Exit 0 all pass, 1 a check failed, 3 could not run. Production hosts are refused unless `--allow-production` is passed on purpose. Run it against a preview deployment or a local `wrangler pages dev` server. Its tests use a local fake server only.

## Triage by request id

1. Get the `X-Request-Id` from the user's network panel or the response of a failed call.
2. Search the logs for that id: the request line shows route, status, duration.
3. If `status` is 500, the `api_error` line with the same id has `error_name` and `error_at`.
