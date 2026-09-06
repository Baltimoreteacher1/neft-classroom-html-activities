/* Tenant-scoped Save/Resume — Phase 3 milestone 1.
 * (spec: docs/superpowers/specs/2026-09-06-phase3-staging-tenant-design.md)
 *
 * Wraps the live /api/progress handler rather than duplicating it: the same
 * 1,885-line implementation serves every tenant, with the env PROXIED so the
 * inner handler sees exactly two things — DB (the tenant's own D1 binding)
 * and nothing else. In particular:
 *   - the live classroom's DB binding is never reachable from a tenant route
 *     (isolation by construction, Decision 5);
 *   - TEACHER_KEY is not forwarded, so every teacher-gated route inside the
 *     shared handler answers "not-configured" for tenants until milestone 2
 *     puts Cloudflare Access in front of tenant teacher surfaces (Decision 4).
 *
 * Every data route requires the tenant's class join code in x-tenant-code
 * (sha256 checked against the registry — Decision 3's class-code model).
 * Unknown tenant -> 404. Known tenant with no D1 binding provisioned -> 503,
 * mirroring the graceful-degradation contract of the wrapped handler.
 */

import { resolveTenant } from "../../../../_lib/tenant-registry.js";
import { onRequest as progressHandler } from "../../../../api/progress/[[path]].js";

const JSON_HEADERS = { "Content-Type": "application/json" };
const json = (obj, status) => new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const tenant = resolveTenant(params.tenant);
  if (!tenant || tenant.status === "offboarded") {
    return json({ ok: false, error: "unknown tenant" }, 404);
  }

  const seg = (params.path && params.path[0]) || "";
  if (seg !== "health") {
    const code = request.headers.get("x-tenant-code") || "";
    if (!code || (await sha256Hex(code)) !== tenant.joinCodeHash) {
      return json({ ok: false, error: "tenant join code required" }, 401);
    }
  }

  const db = env[tenant.dbBinding];
  if (!db && seg !== "health") {
    return json({ ok: false, error: "tenant storage not provisioned", tenant: tenant.id }, 503);
  }

  // The proxied env is allowlist-only: DB and nothing else.
  return progressHandler({
    ...context,
    env: db ? { DB: db } : {},
    params: { path: params.path },
  });
}
