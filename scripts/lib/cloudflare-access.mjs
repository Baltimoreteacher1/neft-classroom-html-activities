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
  CANONICAL: "CANONICAL REDIRECT",
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
  // www → apex is middleware, not Pages content. Count it separately so a 308
  // cannot be mistaken for a student lesson that actually loaded.
  if (status >= 300 && status < 400 && /^https:\/\/eduwonderlab\.com\//i.test(loc)) {
    return ACCESS_CLASS.CANONICAL;
  }
  if (status >= 200 && status < 400) return ACCESS_CLASS.PUBLIC;
  if (!status) return ACCESS_CLASS.NETWORK;
  return ACCESS_CLASS.UNEXPECTED;
}

/**
 * Harmless GET (redirect: manual, no cookies written). Used by the production
 * Access diagnostics so a 302 to Cloudflare Access is visible instead of
 * followed into a login HTML 200.
 */
export async function probeGet(url, { timeoutMs = 15000, accept } = {}) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: ac.signal,
      headers: { Accept: accept || "text/html,application/json,text/css,*/*" },
    });
    const body = await res.text();
    const headers = {};
    res.headers.forEach((v, k) => {
      headers[k] = v;
    });
    return {
      url,
      status: res.status,
      class: classifyResponse({ status: res.status, headers, body }),
      bytes: body.length,
      location: headers.location || "",
      contentType: headers["content-type"] || "",
    };
  } catch (error) {
    return {
      url,
      status: 0,
      class: classifyResponse({ error }),
      bytes: 0,
      location: "",
      contentType: "",
      error: error.name === "AbortError" ? "timeout" : error.message,
    };
  } finally {
    clearTimeout(timer);
  }
}
