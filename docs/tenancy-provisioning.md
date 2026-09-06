# Tenant Provisioning — the infra sitting

One sitting, Joel present, ~10 minutes. Nothing here runs unattended; these are
account-level production changes (spec:
`docs/superpowers/specs/2026-09-06-phase3-staging-tenant-design.md`).

## 1. Create the staging tenant's D1 database

```bash
wrangler d1 create tenant-staging-progress
```

Then apply the same schema the live progress DB uses (the migration files under
`results-worker/migrations/` do NOT apply here — the progress schema is created
lazily by the handler on first use, so an empty database is correct).

## 2. Bind it to the Pages project

Cloudflare dashboard → Pages → `neft-classroom-html-activities` → Settings →
Functions → D1 bindings → add:

| Binding name        | Database                |
| ------------------- | ----------------------- |
| `TENANT_DB_STAGING` | tenant-staging-progress |

The binding NAME must match `data/tenants.json` exactly — the generator enforces
`TENANT_DB_<UPPERID>` so a registry entry can never reach an unrelated binding.

## 3. Verify from the terminal (read-only)

```bash
curl -s https://eduwonderlab.com/t/staging/api/progress/health
# before binding: {"ok":true,"backend":"cloudflare","d1":false}
# after binding:  {"ok":true,"backend":"cloudflare","d1":true}
```

## 4. Cloudflare Access — switching on tenant teacher surfaces (milestone 2)

The teacher surfaces exist and are inert (503) until this is done once, with
Joel present:

1. Zero Trust → Access → Applications → Add → Self-hosted:
   domain `eduwonderlab.com`, path `t/*/teach*`; session 24h.
2. Policy: Allow → Include → Emails → the tenant teacher's Google address
   (add Joel's too). Login method: Google.
3. Copy the application's **Audience (AUD) tag**, then set two Pages VARS
   (Settings → Environment variables, non-secret) or wrangler.toml `[vars]`:
   `ACCESS_TEAM_DOMAIN` = `<team>.cloudflareaccess.com`,
   `ACCESS_AUD_TEACH` = the AUD tag. Redeploy (any ship).
4. Verify: `/t/staging/teach/` now demands a Google login; the API verifies
   the Access JWT against the team keys on every call (defense in depth —
   the app never trusts the edge alone), and its teacher routes open via a
   per-request nonce, never Joel's real TEACHER_KEY.

## 5. Onboarding a real colleague (one command)

```bash
node scripts/onboard-tenant.mjs <id> "<Display Name>"
```

Creates their D1, adds the wrangler.toml binding, writes the registry entry,
and prints their join code ONCE (never saved). Review the diff, ship, add
their email to the Access policy, hand them the code and
`/t/<id>/teach/`. Done.

## Join code

The staging join code is held by Joel (delivered privately at milestone-1
handoff; the repo carries only its sha256 in `data/tenants.json`). Rotate by
writing a new hash and regenerating: `node scripts/generate-tenant-registry.mjs`.

## Offboarding a tenant

Set `status: "offboarded"` in `data/tenants.json`, regenerate, ship (routes go
404), then delete the D1 database — per-tenant isolation makes deletion complete
by construction.
