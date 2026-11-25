/**
 * Structured JSON request logger. One line per event, written with console.log so Workers
 * Logs / Logpush ingest it as-is.
 *
 * PRIVACY CONTRACT: free text can never be logged. Two layers enforce it.
 *   1. Allowlist of KEYS (LOG_FIELDS). Any other key is dropped, so a handler that passes
 *      `{ teacher_note }` by mistake logs nothing for it.
 *   2. Allowlist of VALUE SHAPE. A string value must be a short token (letters, digits and
 *      `_ . : / [ ] -`, at most 80 chars). A sentence contains spaces, so it is replaced by
 *      "[redacted]". Numbers and booleans pass; objects and arrays are dropped.
 * Query strings are never logged: routes are logged by pattern (params replaced by `:name`).
 */

export const LOG_FIELDS = Object.freeze([
  "event",
  "level",
  "request_id",
  "route",
  "method",
  "status",
  "duration_ms",
  "backend",
  "error_name",
  "error_at",
  "unit_id",
  "event_type",
  "directive",
  "blocked_origin",
  "d1",
]);

const TOKEN_RE = /^[A-Za-z0-9_.:/[\]-]{0,80}$/;
export const REQUEST_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;
const FRAME_RE = /\(?([^()\s]+:\d+:\d+)\)?\s*$/;

let sink = (line) => console.log(line);
/** Tests replace the sink; pass null to restore console output. */
export function setLogSink(fn) {
  sink = fn || ((line) => console.log(line));
}

/** Keep only allowlisted keys with token-shaped scalar values. */
export function redact(fields) {
  const out = {};
  for (const key of LOG_FIELDS) {
    if (!(key in fields)) continue;
    const v = fields[key];
    if (typeof v === "number" && Number.isFinite(v)) out[key] = v;
    else if (typeof v === "boolean") out[key] = v;
    else if (typeof v === "string") out[key] = TOKEN_RE.test(v) ? v : "[redacted]";
  }
  return out;
}

export function logEvent(fields) {
  const record = { ts: new Date().toISOString(), ...redact(fields) };
  try {
    sink(JSON.stringify(record));
  } catch {
    // Logging must never break a request.
  }
  return record;
}

export function newRequestId() {
  return crypto.randomUUID();
}

/** Accept a caller-supplied id only when it is a plain token, so it cannot carry free text or inject log lines. */
export function requestIdFrom(request) {
  const given = request.headers.get("X-Request-Id") || "";
  return REQUEST_ID_RE.test(given) ? given : newRequestId();
}

/** `/api/bcpss/plans/abc123` with params {id:"abc123"} -> `/api/bcpss/plans/:id`. */
export function routeOf(pathname, params = {}) {
  const byValue = new Map();
  for (const [name, value] of Object.entries(params || {})) {
    for (const part of Array.isArray(value) ? value : [value])
      if (part) byValue.set(String(part), name);
  }
  const decode = (seg) => {
    try {
      return decodeURIComponent(seg);
    } catch {
      return seg;
    }
  };
  const route = pathname
    .split("/")
    .map((seg) => (byValue.has(decode(seg)) ? `:${byValue.get(decode(seg))}` : seg))
    .join("/");
  return route.length > 80 ? `${route.slice(0, 77)}...` : route;
}

/** First stack frame as `file:line:col`, never the message (a message can echo user input). */
export function errorLocation(err) {
  const frame = String(err?.stack || "")
    .split("\n")
    .find((l) => /^\s+at /.test(l));
  return frame?.match(FRAME_RE)?.[1] ?? "unknown";
}

export function logRequest({ request, params, requestId, status, startedAt }) {
  const url = new URL(request.url);
  return logEvent({
    event: "request",
    level: status >= 500 ? "error" : status >= 400 ? "warn" : "info",
    request_id: requestId,
    route: routeOf(url.pathname, params),
    method: request.method,
    status,
    duration_ms: Date.now() - startedAt,
  });
}

export function logError({ request, params, requestId, err }) {
  const url = new URL(request.url);
  return logEvent({
    event: "api_error",
    level: "error",
    request_id: requestId,
    route: routeOf(url.pathname, params),
    method: request.method,
    error_name: err?.name || "Error",
    error_at: errorLocation(err),
  });
}
