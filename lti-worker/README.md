# neft-lti — Canvas LTI 1.3 tool (Cloudflare Worker)

One IMS-standard integration that replaces the pile of Canvas workarounds:
**SSO launch**, **Deep Linking** (place any lesson as an assignment from inside
Canvas), and **AGS grade passback** (a finished lesson posts its own score to
the gradebook). Deploys **separately** from the Pages site and never touches
`eduwonderlab.com`.

## Status: dormant until IT approves

SCORM already auto-grades in BCPS Canvas today (see
`docs/superpowers/specs/2026-07-01-canvas-enterprise-upgrade-design.md`), so this
Worker is the **future upgrade**, not the current grade path. It is built,
tested, and deploy-ready but **fails closed** until:

1. the tool keypair secret (`LTI_PRIVATE_JWK`) is set, and
2. IT returns a Developer Key → `LTI_CLIENT_ID` + `LTI_DEPLOYMENT_ID`.

With those unset, launches return `503` and no Canvas course points here — zero
student impact. `GET /health` reports `"dormant"` vs `"active"`.

## Endpoints

| Route                | Purpose                                                  |
| -------------------- | -------------------------------------------------------- |
| `GET /health`        | Liveness + dormant/active status (no secrets leaked)     |
| `GET /lti/jwks`      | Tool public JWKS (Canvas verifies our signed JWTs)       |
| `* /lti/login`       | OIDC third-party login → redirect to Canvas auth         |
| `POST /lti/launch`   | Verify `id_token`; branch ResourceLink vs DeepLinking    |
| `POST /lti/deeplink` | Signed Deep Linking response placing the chosen lessons  |
| `POST /lti/score`    | Lesson-completion hook → mint AGS token → post the score |

The lesson engine calls `/lti/score` from `engine/core/grade-emit.js` only when a
lesson was launched through this Worker (`?lms=lti&ltik=…`). The launch redirect
also carries `sn`/`si`, so LTI launches auto-identify the student (same hook the
SCORM path uses).

## Deploy

```bash
npm run lti:keygen                       # generate the RS256 keypair (run once)
cd lti-worker
npx wrangler secret put LTI_PRIVATE_JWK  # paste the private JWK
npx wrangler d1 create neft-lti          # paste id into wrangler.toml
npx wrangler kv namespace create LTI_KV  # paste id into wrangler.toml
npx wrangler d1 migrations apply neft-lti
npx wrangler deploy                      # /health + /lti/jwks come up (dormant)
```

Then send `docs/canvas/it-lti-developer-key-email.md` to BCPS IT (URLs are
already real). On approval:

```bash
npx wrangler secret put LTI_CLIENT_ID
npx wrangler secret put LTI_DEPLOYMENT_ID
# confirm the PLATFORM_* vars in wrangler.toml match the Developer Key screen
npx wrangler deploy
```

## Test

```bash
npm run lti:test
```

Drives the Worker against a **mock Canvas** (local RSA keypair, stubbed JWKS +
token endpoint): full ResourceLink launch → `ltik` mint → AGS Score POST,
nonce single-use/replay rejection, tampered-`ltik` rejection, and the
dormant-fail-closed guard. 16 assertions, no network.

## Security

- Platform `id_token` verified: signature via cached platform JWKS, `iss`,
  `aud == client_id`, `exp`/`iat`, single-use `nonce` (replay → 401).
- `ltik` is tool-signed (RS256) and re-verified on `/lti/score`; it carries only
  the AGS line-item URL + `sub` — **no platform secret reaches the browser**.
- AGS access token: short-lived client-credentials JWT grant, cached, never
  logged.
- No new PII: only the `sub` + name already in the Canvas roster.
