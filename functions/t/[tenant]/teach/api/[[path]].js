/* Tenant TEACHER API — Phase 3 milestone 2.
 * (spec: docs/superpowers/specs/2026-09-06-phase3-staging-tenant-design.md,
 *  Decisions 2, 4, 5)
 *
 * Routes (all Cloudflare-Access-gated; the app never trusts the edge alone —
 * the Access JWT is verified against the team's public keys on every call):
 *
 *   /t/<id>/teach/api/progress/<...>  -> the shared progress handler
 *   /t/<id>/teach/api/pacing/<...>    -> the shared pacing handler
 *
 * Both inner handlers gate their teacher routes on env.TEACHER_KEY matching an
 * x-teacher-key header. The trust hand-off works by construction: after the
 * Access JWT verifies, this wrapper mints a per-request nonce, sets it as BOTH
 * the inner env.TEACHER_KEY and the forwarded x-teacher-key header. Only this
 * wrapper can set the inner env, so the inner teacher gates open exactly when
 * Access authenticated the caller — Joel's real TEACHER_KEY never crosses, and
 * the tenant's DB binding is the only storage the inner handlers can see.
 *
 * Unconfigured Access -> 503 (inert until the Zero Trust app + vars exist,
 * the same contract as an unprovisioned D1 binding).
 */

import { verifyAccessJwt } from "../../../../_lib/access-jwt.js";
import { resolveTenant } from "../../../../_lib/tenant-registry.js";
import { onRequest as pacingHandler } from "../../../../api/pacing/[[path]].js";
import { onRequest as progressHandler } from "../../../../api/progress/[[path]].js";

const JSON_HEADERS = { "Content-Type": "application/json" };
const json = (obj, status) => new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });

export async function onRequest(context) {
  const { request, env, params } = context;
  const tenant = resolveTenant(params.tenant);
  if (!tenant || tenant.status === "offboarded") {
    return json({ ok: false, error: "unknown tenant" }, 404);
  }

  const auth = await verifyAccessJwt(request, env);
  if (!auth.ok) {
    return auth.reason === "not-configured"
      ? json({ ok: false, error: "teacher access not configured for this deployment" }, 503)
      : json({ ok: false, error: "unauthorized" }, 401);
  }

  const db = env[tenant.dbBinding];
  if (!db) {
    return json({ ok: false, error: "tenant storage not provisioned", tenant: tenant.id }, 503);
  }

  const [surface, ...rest] = params.path || [];
  const handler =
    surface === "progress" ? progressHandler : surface === "pacing" ? pacingHandler : null;
  if (!handler) return json({ ok: false, error: "unknown teacher surface" }, 404);

  // Per-request trust nonce: inner teacher gates open iff Access verified.
  const nonce = crypto.randomUUID();
  const forwarded = new Request(request, {
    headers: new Headers([...request.headers, ["x-teacher-key", nonce]]),
  });

  return handler({
    ...context,
    request: forwarded,
    env: { DB: db, TEACHER_KEY: nonce },
    params: { path: rest },
  });
}
