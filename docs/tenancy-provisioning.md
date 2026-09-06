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

## 4. Cloudflare Access (milestone 2, not needed for the staging data path)

When tenant teacher surfaces exist: Zero Trust → Access → Applications → add a
self-hosted app for `eduwonderlab.com/t/*/teach*`, policy = allow the tenant
teacher's Google identity. The existing Basic-auth model is untouched.

## Join code

The staging join code is held by Joel (delivered privately at milestone-1
handoff; the repo carries only its sha256 in `data/tenants.json`). Rotate by
writing a new hash and regenerating: `node scripts/generate-tenant-registry.mjs`.

## Offboarding a tenant

Set `status: "offboarded"` in `data/tenants.json`, regenerate, ship (routes go
404), then delete the D1 database — per-tenant isolation makes deletion complete
by construction.
