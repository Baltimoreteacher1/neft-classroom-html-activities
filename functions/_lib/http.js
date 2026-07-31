/**
 * Shared HTTP plumbing for the Pages Functions under /api.
 *
 * Every endpoint here re-implemented the same four things by hand, slightly
 * differently each time: the JSON/CORS header block, a per-IP rate limiter
 * (six near-identical copies), body parsing, and the error shape. The result
 * was that guards were applied unevenly — six of ~20 endpoints rate-limit at
 * all, and several have no try/catch, so an unexpected throw surfaces as
 * Cloudflare's own 500 page (HTML) to a caller that asked for JSON.
 *
 * This module is the single implementation. It is deliberately dependency-free
 * and side-effect-free at import time so it can be unit-tested off-Workers.
 *
 * Usage:
 *
 *   import { handler, badRequest } from "../_lib/http.js";
 *
 *   export const onRequest = handler({
 *     methods: ["GET", "POST"],
 *     rateLimit: { max: 30, windowMs: 60_000 },
 *     async handle({ request, env, body }) {
 *       if (!body?.id) return badRequest("id is required");
 *       return { ok: true };
 *     },
 *   });
 *
 * `handle` may return a plain object (serialized as JSON 200) or a Response
 * when it needs full control.
 */

/** Header block every JSON endpoint here already used, in one place. */
export const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

export function json(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

/** Errors carry a stable shape so clients can branch on it. */
export const badRequest = (error) => json({ ok: false, error }, 400);
export const unauthorized = (error = "unauthorized") => json({ ok: false, error }, 401);
export const notFound = (error = "not found") => json({ ok: false, error }, 404);
export const tooManyRequests = (retryAfterSecs = 60) =>
  json({ ok: false, error: "rate limited" }, 429, { "Retry-After": String(retryAfterSecs) });

export function clientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "anon"
  );
}

/**
 * Sliding-window per-IP limiter, lifted verbatim in behaviour from the copies
 * in tutor/grade/study-pack/manip-room/reasoning/screener-assist.
 *
 * Best-effort by nature: Pages Functions are per-isolate, so this bounds abuse
 * from one client hitting one isolate. It is not a security control — it is
 * there to stop a runaway loop or a stuck retry from burning an API budget.
 * Callers that need a real quota must use a durable store.
 */
export function createRateLimiter({ max = 30, windowMs = 60_000, maxTrackedIps = 5000 } = {}) {
  const hits = new Map();
  return function rateLimited(ip, now = Date.now()) {
    const cutoff = now - windowMs;
    let arr = hits.get(ip);
    if (!arr) {
      arr = [];
      hits.set(ip, arr);
    }
    while (arr.length && arr[0] < cutoff) arr.shift();
    if (arr.length >= max) return true;
    arr.push(now);
    // Opportunistic cleanup so the map cannot grow without bound.
    if (hits.size > maxTrackedIps) {
      for (const [k, v] of hits) {
        if (!v.length || v[v.length - 1] < cutoff) hits.delete(k);
      }
    }
    return false;
  };
}

/** Body size cap: refuse absurd payloads before parsing them. */
const DEFAULT_MAX_BODY_BYTES = 5_000_000;

/**
 * Wrap a handler with the guards every endpoint should have had:
 * OPTIONS preflight, method allow-list, body cap + JSON parse, optional rate
 * limit, and a catch-all that returns JSON instead of an HTML 500 and never
 * echoes the internal message to the caller.
 */
export function handler({
  methods = ["GET", "POST"],
  rateLimit = null,
  maxBodyBytes = DEFAULT_MAX_BODY_BYTES,
  handle,
}) {
  const allowed = new Set(methods.map((m) => m.toUpperCase()));
  const limiter = rateLimit ? createRateLimiter(rateLimit) : null;
  const allowHeader = [...allowed, "OPTIONS"].join(", ");

  return async function onRequest(context) {
    const { request } = context;
    const method = request.method.toUpperCase();

    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: { ...JSON_HEADERS, "Access-Control-Allow-Methods": allowHeader },
      });
    }

    if (!allowed.has(method)) {
      return json({ ok: false, error: "method not allowed" }, 405, { Allow: allowHeader });
    }

    if (limiter?.(clientIp(request))) return tooManyRequests();

    let body = null;
    if (method !== "GET" && method !== "HEAD") {
      const declared = Number(request.headers.get("Content-Length") || 0);
      if (declared > maxBodyBytes) return json({ ok: false, error: "payload too large" }, 413);
      const raw = await request.text();
      if (raw.length > maxBodyBytes) return json({ ok: false, error: "payload too large" }, 413);
      if (raw) {
        try {
          body = JSON.parse(raw);
        } catch {
          return badRequest("body must be valid JSON");
        }
      }
    }

    try {
      const result = await handle({ ...context, body });
      return result instanceof Response ? result : json(result ?? { ok: true });
    } catch (err) {
      // The caller gets a stable JSON error; the detail goes to the log only.
      console.error("api error", request.url, err?.stack || err);
      return json({ ok: false, error: "internal error" }, 500);
    }
  };
}
