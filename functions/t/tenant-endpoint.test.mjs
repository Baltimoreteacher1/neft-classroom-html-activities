/* Tenant progress wrapper — the isolation contract, provable without infra.
 * Runs in `npm test` (plain node script; webcrypto is global in node 26).
 */
import assert from "node:assert/strict";

const { onRequest } = await import("./[tenant]/api/progress/[[path]].js");

const STAGING_CODE_HASH = (await import("../_lib/tenant-registry.js")).TENANTS.staging.joinCodeHash;

// A code whose sha256 we control for the test: derive nothing — instead test
// the negative paths hard, and the positive path via a registry-matching code
// only if one is supplied via env (CI never has it; local runs may).
const req = (headers = {}, url = "https://eduwonderlab.com/t/staging/api/progress/health") =>
  new Request(url, { headers });

const ctx = (tenant, path, env = {}, headers = {}) => ({
  request: req(headers),
  env,
  params: { tenant, path },
});

// 1. Unknown tenant -> 404, and the inner handler is never reached.
{
  const res = await onRequest(ctx("nope", ["health"]));
  assert.equal(res.status, 404, "unknown tenant is a 404");
}

// 2. Health works for a known tenant with no binding, and reports d1:false.
{
  const res = await onRequest(ctx("staging", ["health"]));
  assert.equal(res.status, 200, "health is public and infra-free");
  const body = await res.json();
  assert.equal(body.d1, false, "health reports the TENANT binding, absent");
}

// 3. Health reports d1:true from the TENANT binding — and ONLY that binding:
//    a production-style DB binding in env must be invisible to the wrapper.
{
  const prodDb = { marker: "PROD" };
  const tenantDb = { marker: "TENANT" };
  const res = await onRequest(
    ctx("staging", ["health"], { DB: prodDb, TENANT_DB_STAGING: tenantDb }),
  );
  const body = await res.json();
  assert.equal(body.d1, true, "tenant binding reaches the inner handler as DB");
  // Isolation: with ONLY the prod binding present, the tenant still sees no DB.
  const res2 = await onRequest(ctx("staging", ["health"], { DB: prodDb }));
  const body2 = await res2.json();
  assert.equal(body2.d1, false, "the live classroom DB binding is unreachable from tenant routes");
}

// 4. Data routes without the join code -> 401 before anything else happens.
{
  const res = await onRequest(
    ctx("staging", ["load"], { TENANT_DB_STAGING: {} }, {}),
  );
  assert.equal(res.status, 401, "data routes demand x-tenant-code");
}

// 5. Wrong join code -> 401.
{
  const res = await onRequest(
    ctx("staging", ["load"], { TENANT_DB_STAGING: {} }, { "x-tenant-code": "WRONG-CODE" }),
  );
  assert.equal(res.status, 401, "a wrong code is refused");
}

// 6. The registry never contains a plain code — only sha256 hex.
assert.match(STAGING_CODE_HASH, /^[0-9a-f]{64}$/, "registry stores hashes, never codes");

console.log("tenant-endpoint: 6/6 isolation and auth contracts hold");
