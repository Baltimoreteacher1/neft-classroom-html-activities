# Feature flags

One committed registry, one pure evaluator, one read endpoint.

| Piece | Path |
| --- | --- |
| Registry (single source of truth) | `shared/flags/registry.js` |
| Evaluator + signing (pure, no deps) | `shared/flags/evaluate.js` |
| Bound API (`isEnabled`, `evaluateAll`) | `shared/flags/index.js` |
| Environment + header glue | `functions/_lib/flags.js` |
| `GET /api/flags` | `functions/api/flags.js` |
| Mint a signed override | `tools/flags-sign.mjs` |
| Hygiene gate G-39 | `tools/flags-hygiene.mjs` (`npm run validate:flags`) |

## Registry fields

Each flag: `key`, `description`, `owner` (a team handle, never an email), `default`, `removalDate`
(`YYYY-MM-DD`, required), `environments` (`production|staging|preview|local`, each `true`, `false` or
`null` = inherit `default`), `cohorts` (`teacher`, `class`, `demo` id lists that turn the flag on),
`killSwitch`, `sendsStudentContent`, `requires` (flag keys).

## Evaluation

Precedence, first match wins: **signed override > cohort > environment > default**. Then `requires`
is applied: a flag is on only if every required flag is on for the same caller, and nothing, an
override included, can turn a flag on while a required flag is off.

- Unknown flag: `false`. With `FLAGS_STRICT=1` (or `{ strict: true }`) it throws, so a typo fails a test.
- `killSwitch: true`: a signed override can turn it **off** but never **on**. Turning it on is a reviewed change to `registry.js`.
- `student_content_egress` is the master switch for anything that sends student content off the device. It defaults off, and every flag with `sendsStudentContent: true` must `require` it (the hygiene gate enforces this transitively).
- `/api/flags` receives caller-asserted `teacherId`/`classId`/`demo`, so the egress master flag ignores cohorts on that path (`trustedIds: false`). Server code that has verified ids itself calls `evaluateAll` or `isEnabled` directly without that field. A UI that hides a feature because `/api/flags` says off is failing closed; server-side code must never trust the endpoint's answer to allow egress.
- Environment: `FLAGS_ENV` binding if set, else `localhost` is local, `staging.*` is staging, `*.pages.dev` is preview, anything else is production.

## Signed overrides

Header `X-Flags-Overrides` carries JSON `{ "payload": { "overrides": { "<flag>": true|false }, "expires": "<ISO>" }, "sig": "<hex>" }`.
`sig` is HMAC-SHA256 over the canonical JSON of `payload` (sorted keys, no whitespace) with the secret in
the `FLAGS_SIGNING_KEY` binding (at least 32 characters). The key is never committed; with no usable key
every override is ignored. Overrides must expire, within 30 days. Unknown flags and non-boolean values are dropped.

```sh
FLAGS_SIGNING_KEY=... node tools/flags-sign.mjs --hours=2 experiments=on
```

Setting the Cloudflare binding is a deployment-settings change: ask Joel first.

## Endpoint

`GET /api/flags[?teacherId=&classId=&demo=]` returns `{ ok: true, flags: { key: boolean } }`. Booleans
only: no owners, descriptions, cohorts or dates. Ids must match `[A-Za-z0-9_-]{1,64}`.

## Hygiene (G-39)

`npm run validate:flags` fails when a flag lacks owner, default, description or removal date, is past its
removal date, has a bad `environments`/`cohorts` block, a dangling or cyclic `requires`, an email as
owner, an egress master that defaults on, or sends student content without requiring egress. It first runs
`shared/flags/negative/bad-registry.json`, which must trip every expected code, or the gate exits 3.
Exit codes: 0 pass, 1 findings, 3 error. `--now=YYYY-MM-DD` injects the clock.

## Adding or removing a flag

Add an entry with a real `removalDate`; when the date arrives, delete the flag and its call sites, or
re-date it in a reviewed change. The gate is red on the day it expires on purpose.
