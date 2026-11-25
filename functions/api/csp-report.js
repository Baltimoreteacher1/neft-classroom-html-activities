/**
 * POST /api/csp-report: receives CSP violation reports (report-uri) for the /bcpss-teachers/ pages.
 * Only the violated directive and the blocked ORIGIN are logged. Document URLs, sample text and
 * source lines are dropped: they can carry page state or user input.
 */
import { handler } from "../_lib/http.js";
import { logEvent } from "../_lib/security/log.js";
import { LIMITS } from "../_lib/security/schema.js";

const DIRECTIVE_RE = /^[a-z-]{3,40}$/;
const KEYWORD_SOURCES = new Set(["inline", "eval", "data", "blob"]);

function originOf(uri) {
  if (typeof uri !== "string" || !uri) return "none";
  if (KEYWORD_SOURCES.has(uri)) return uri;
  try {
    return new URL(uri).origin;
  } catch {
    return "invalid";
  }
}

export const onRequest = handler({
  methods: ["POST"],
  requireObjectBody: true,
  ...LIMITS.cspReport,
  handle({ body, requestId }) {
    const inner = body["csp-report"];
    const report = inner && typeof inner === "object" ? inner : {};
    const raw = String(report["effective-directive"] || report["violated-directive"] || "");
    const directive = raw.split(" ")[0];
    logEvent({
      event: "csp_violation",
      level: "warn",
      request_id: requestId,
      directive: DIRECTIVE_RE.test(directive) ? directive : "unknown",
      blocked_origin: originOf(report["blocked-uri"]),
    });
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  },
});
