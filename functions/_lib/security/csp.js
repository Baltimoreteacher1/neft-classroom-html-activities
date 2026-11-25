/**
 * Content-Security-Policy for the /bcpss-teachers/ pages.
 *
 * Served from the Pages middleware (not `_headers`): a per-response nonce cannot be written in a
 * static header file, and `_headers` rules combine across matching paths instead of overriding.
 *
 * Mode (default REPORT-ONLY): `env.BCPSS_CSP_MODE` = "off" | "report-only" | "enforce". When the
 * flag registry lands, its `csp_enforce` flag maps onto "enforce"; until then this env var or the
 * constant below is the single switch. Path to enforcement: docs/security/csp.md.
 *
 * Policy summary: everything same-origin (connect-src 'self' means no third-party calls from these
 * pages), scripts only from this origin or carrying the response nonce, no plugins, no foreign
 * <base> or form targets. style-src keeps 'unsafe-inline' because the pages style through inline
 * style attributes; that is documented debt, not an oversight.
 */

export const CSP_MODES = Object.freeze(["off", "report-only", "enforce"]);
export const DEFAULT_CSP_MODE = "report-only";
export const CSP_REPORT_PATH = "/api/csp-report";
const SCOPE_PREFIX = "/bcpss-teachers";

export function cspModeFor(env) {
  const mode = env?.BCPSS_CSP_MODE;
  return CSP_MODES.includes(mode) ? mode : DEFAULT_CSP_MODE;
}

export function newNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export function buildCsp(nonce) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self' blob:",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `report-uri ${CSP_REPORT_PATH}`,
  ].join("; ");
}

export function isBcpssPage(url) {
  const p = url.pathname;
  return p === SCOPE_PREFIX || p.startsWith(`${SCOPE_PREFIX}/`);
}

/**
 * Attach the CSP to a /bcpss-teachers/ HTML response. Anything else is returned untouched.
 * Inline <script> tags get the nonce when the Workers HTMLRewriter is available (it is not in Node tests).
 * In enforce mode a nonce is only valid for the response that carries it, so validators are dropped
 * and the page is not cached; report-only leaves caching alone.
 */
export function applyBcpssCsp(response, url, env) {
  const mode = cspModeFor(env);
  if (mode === "off" || !isBcpssPage(url)) return response;
  if (response.status !== 200) return response;
  if (!(response.headers.get("content-type") || "").includes("text/html")) return response;

  const nonce = newNonce();
  const headers = new Headers(response.headers);
  headers.set(
    mode === "enforce" ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only",
    buildCsp(nonce),
  );
  let out = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
  if (mode === "enforce") {
    out.headers.delete("etag");
    out.headers.delete("last-modified");
    out.headers.set("Cache-Control", "no-store");
  }
  const Rewriter = globalThis.HTMLRewriter;
  if (Rewriter) {
    out = new Rewriter()
      .on("script", { element: (el) => el.setAttribute("nonce", nonce) })
      .transform(out);
  }
  return out;
}
