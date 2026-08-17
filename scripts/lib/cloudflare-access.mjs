/**
 * Detect a Cloudflare Access login interstitial.
 *
 * smoke:live used to classify that 200 HTML as "Basic Auth gate is OFF" and
 * "assets served HTML instead of the asset" — eleven false production-degraded
 * findings, plus rollback advice, when this client never reached Pages at all.
 * The student site is supposed to be open; Access wrapping `/` is either an
 * IP/policy restriction on *this* client or an operational accident. Either
 * way it is NOT a Basic Auth regression.
 */
export function isCloudflareAccess(body) {
  if (typeof body !== "string" || !body) return false;
  if (/<title>\s*Sign in\s*[^<]*Cloudflare Access/i.test(body)) return true;
  return /Cloudflare Access/i.test(body) && /<title>\s*Sign in/i.test(body);
}

/** Classifications `diagnose:student-access` is allowed to print. */
export const ACCESS_CLASS = Object.freeze({
  PUBLIC: "PUBLIC / PAGES REACHED",
  ACCESS: "CLOUDFLARE ACCESS INTERCEPT",
  APP_AUTH: "APP AUTH INTERCEPT",
  UNEXPECTED: "UNEXPECTED RESPONSE",
  NETWORK: "NETWORK FAILURE",
});

function header(headers, name) {
  if (!headers) return "";
  if (typeof headers.get === "function") return headers.get(name) || "";
  const want = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (String(k).toLowerCase() === want) return String(v || "");
  }
  return "";
}

/**
 * Classify one HTTP result. A 200 whose body is the Access sign-in page is
 * ACCESS, never PUBLIC — that is the defect smoke:live used to make.
 */
export function classifyResponse({ status = 0, headers = {}, body = "", error = null } = {}) {
  if (error && !status) return ACCESS_CLASS.NETWORK;
  const loc = header(headers, "location");
  const www = header(headers, "www-authenticate");
  if (isCloudflareAccess(body) || /cloudflareaccess\.com|\/cdn-cgi\/access\//i.test(loc)) {
    return ACCESS_CLASS.ACCESS;
  }
  if (status === 401 || /(?:^|\s)basic(?=\s|$)/i.test(www)) return ACCESS_CLASS.APP_AUTH;
  if (status >= 200 && status < 400) return ACCESS_CLASS.PUBLIC;
  if (!status) return ACCESS_CLASS.NETWORK;
  return ACCESS_CLASS.UNEXPECTED;
}
