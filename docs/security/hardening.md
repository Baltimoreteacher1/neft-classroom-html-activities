# Write-endpoint hardening, secrets and dependency audit

## Public write endpoints (BCPSS)

| Endpoint | Rate limit per IP + anon token / min | IP cap / min | Body cap | Notes |
| --- | --- | --- | --- | --- |
| `POST /api/bcpss/telemetry` | 120 | 600 | 2 KB | enum fields only, unit_id checked against the registry, grade derived server-side, unknown fields refused |
| `POST /api/bcpss/plans` | 10 | 60 | 4 KB | enum tier, registry unit, `rejectIfPII(teacher_note)`, unknown fields refused |
| `POST /api/bcpss/deconstruct` | 20 | 120 | 16 KB | passage 1-1500 chars, enum L1 |
| `POST /api/csp-report` | 30 | 300 | 8 KB | logs directive and blocked origin only |

Limits live in `functions/_lib/security/schema.js` (`LIMITS`), the shared enums in the same file. `functions/_lib/http.js` `handler()` enforces them.

- Key: IP plus the optional `X-Anon-Token` header (16-64 URL-safe chars; malformed is ignored). The IP cap stops token rotation. Without a token the key is the IP alone. A school shares one NAT address, so the front end sends a random per-browser token (`shared/anon-token/anon-token.js`, stored as `ewl_anon_token`, never derived from student data). The BCPSS front end sends it on its write calls (telemetry, plans, deconstruct, export); other front ends do not yet, and a class behind one IP shares the per-key limit there.
- Limits are per isolate and best effort. They stop runaway clients, not a determined attacker. A real quota needs a durable store.
- Body: rejected early on `Content-Length` (413, 400 if unparseable), and again while streaming so chunked or lying clients cannot buffer past the cap. Bad JSON is 400, a non-object body is 400 (`requireObjectBody`).
- Server-derived values: the client sends a unit id only. Grade comes from the seed registry (`functions/_lib/security/unit-registry.js`). `wida_tier` is a teacher-chosen scaffold band, validated against `WIDA_TIERS`; it is not derivable and is never a student attribute.
- Abuse tests: `node tools/abuse-endpoints.test.mjs` (status plus "nothing stored" for each hostile input).

Other `/api` write endpoints (class, progress, scores, tutor, and the rest) are outside the BCPSS scope of this work and are not covered by this table. They are listed as migration debt in `functions/api-contract.test.mjs`.

## Secrets

`node tools/secret-scan.mjs [paths]` scans tracked files for key shapes and for high-entropy values assigned to secret-named variables. Exit 0 clean, 1 findings, 3 could not run. Output shows file, line, rule and four characters. Mark a documented placeholder with `secret-scan:allow` and a reason on the same line. It complements `npm run validate:secrets`. It is not wired into hooks or `qa:fast`; run it before a release or add it to CI deliberately.

## Dependency audit

```sh
npm audit --omit=dev --audit-level=high
```

Run before releases and after dependency changes. Needs network. Exits non-zero at high or critical severity. Not part of hooks. `tools/audit-allowlist.mjs` (`npm run audit:deps`) is the CI variant with time-boxed acceptances.
