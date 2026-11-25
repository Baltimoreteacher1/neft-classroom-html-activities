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

import { logError, logRequest, requestIdFrom } from "./security/log.js";
import { ANON_TOKEN_HEADER, ANON_TOKEN_RE } from "./security/schema.js";

/** Header block every JSON endpoint here already used, in one place. */
export const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": `Content-Type, ${ANON_TOKEN_HEADER}, X-Request-Id`,
  "Access-Control-Expose-Headers": "X-Request-Id",
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

/** Body size cap: refuse absurd payloads before parsing them. Endpoints pass a tighter `maxBodyBytes`. */
const DEFAULT_MAX_BODY_BYTES = 5_000_000;

const tooLarge = () => json({ ok: false, error: "payload too large" }, 413);

/**
 * Read a request body with a hard byte cap. Rejects early on a declared Content-Length, and
 * again while streaming, so a chunked or lying client cannot buffer more than `max` bytes.
 * Returns `{ raw }` or `{ response }`.
 */
export async function readBodyCapped(request, max) {
  const declared = request.headers.get("Content-Length");
  if (declared !== null) {
    const n = Number(declared);
    if (!Number.isFinite(n) || n < 0) return { response: badRequest("invalid Content-Length") };
    if (n > max) return { response: tooLarge() };
  }
  if (!request.body) return { raw: "" };
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel();
      return { response: tooLarge() };
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.byteLength;
  }
  return { raw: new TextDecoder().decode(bytes) };
}

/** A well-formed anonymous token, or "" (a malformed one is ignored, never trusted or logged). */
function anonToken(request) {
  const t = request.headers.get(ANON_TOKEN_HEADER) || "";
  return ANON_TOKEN_RE.test(t) ? t : "";
}

/**
 * Wrap a handler with the guards every endpoint should have had:
 * OPTIONS preflight, method allow-list, body cap + JSON parse, optional rate
 * limit, request-id propagation, one structured log line per request, and a
 * catch-all that returns JSON instead of an HTML 500 and never echoes the
 * internal message to the caller.
 *
 * `rateLimit: { max, windowMs, ipMax? }` limits per IP + anonymous token (header
 * X-Anon-Token, ignored when malformed). `ipMax` additionally caps the IP as a whole so
 * rotating tokens does not escape the limit. Without a token the key is the IP alone.
 * `requireObjectBody` rejects a body that parses to anything but a JSON object (400).
 */
export function handler({
  methods = ["GET", "POST"],
  rateLimit = null,
  maxBodyBytes = DEFAULT_MAX_BODY_BYTES,
  requireObjectBody = false,
  handle,
}) {
  const allowed = new Set(methods.map((m) => m.toUpperCase()));
  const limiter = rateLimit ? createRateLimiter(rateLimit) : null;
  const ipLimiter = rateLimit?.ipMax
    ? createRateLimiter({ max: rateLimit.ipMax, windowMs: rateLimit.windowMs })
    : null;
  const allowHeader = [...allowed, "OPTIONS"].join(", ");

  async function respond(context, requestId) {
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

    if (limiter) {
      const ip = clientIp(request);
      const token = anonToken(request);
      if (ipLimiter?.(ip) || limiter(token ? `${ip}|${token}` : ip)) return tooManyRequests();
    }

    let body = null;
    if (method !== "GET" && method !== "HEAD") {
      const read = await readBodyCapped(request, maxBodyBytes);
      if (read.response) return read.response;
      if (read.raw) {
        try {
          body = JSON.parse(read.raw);
        } catch {
          return badRequest("body must be valid JSON");
        }
      }
      if (requireObjectBody && (body === null || typeof body !== "object" || Array.isArray(body))) {
        return badRequest("body must be a JSON object");
      }
    }

    try {
      const result = await handle({ ...context, body, requestId });
      return result instanceof Response ? result : json(result ?? { ok: true });
    } catch (err) {
      // The caller gets a stable JSON error; the log gets the error class and first frame only,
      // because an error message can echo request text.
      logError({ request, params: context.params, requestId, err });
      return json({ ok: false, error: "internal error" }, 500);
    }
  }

  return async function onRequest(context) {
    const startedAt = Date.now();
    const requestId = requestIdFrom(context.request);
    let response = await respond(context, requestId);
    try {
      response.headers.set("X-Request-Id", requestId);
    } catch {
      // Immutable headers (a proxied fetch Response): rebuild with the id attached.
      response = new Response(response.body, response);
      response.headers.set("X-Request-Id", requestId);
    }
    logRequest({
      request: context.request,
      params: context.params,
      requestId,
      status: response.status,
      startedAt,
    });
    return response;
  };
}
