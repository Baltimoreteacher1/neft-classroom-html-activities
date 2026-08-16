/**
 * teacher-auth.js — the ONE answer to "is this request an authorized teacher?".
 *
 * WHY THIS EXISTS. Before this file the platform had two unrelated credentials
 * for one human workflow:
 *
 *   1. HTTP Basic Auth on teacher *pages*, checking env.SITE_PASSWORD
 *      (functions/_middleware.js).
 *   2. A teacher *key* on the /api/* write endpoints, checking env.TEACHER_KEY,
 *      supplied as ?key= or x-teacher-key and re-implemented, identically, in
 *      fifteen separate endpoint files.
 *
 * A third thing — the classroom PIN hardcoded in engine/core/teacher-mode.js
 * — is a client-side PIN that only toggles UI chrome. It is not a credential and
 * it never reached a server. The Live Pacing Planner therefore had a defect that
 * looked like a bug and was really an architecture problem: the teacher typed the
 * only "teacher key" they had ever been given (the PIN), the planner sent it to
 * /api/pacing as x-teacher-key, and the endpoint compared it against a completely
 * different secret and returned 401. Every edit failed with "Teacher key required"
 * on a surface the teacher had already passed a password gate to reach.
 *
 * THE MODEL NOW. One credential set, one session, both gates.
 *
 *   - Accepted keys live ONLY in the Pages environment: TEACHER_KEY_NEFT,
 *     TEACHER_KEY_ALBA (and legacy TEACHER_KEY, still honoured so existing
 *     tooling and cron jobs keep working). No key is ever shipped to a browser.
 *   - POST /api/teacher-auth/login exchanges a key for an HttpOnly, Secure,
 *     SameSite=Lax cookie holding a signed, expiring token. The key itself is
 *     never stored client-side, never put in a URL, never logged.
 *   - functions/_middleware.js verifies that cookie ONCE per request and stashes
 *     the identity on context.data.teacher, so every downstream endpoint can
 *     authorize synchronously without re-doing crypto.
 *   - teacherAuthorized() accepts the session OR a raw key. Raw-key access is
 *     retained deliberately: scripts, cron jobs and the SCORM builders are not
 *     browsers and cannot hold a cookie. The browser path no longer uses it.
 *
 * The token is signed, not encrypted: it carries an identity and an expiry and
 * nothing secret. Signing prevents forgery, which is the whole requirement.
 */

const COOKIE_NAME = "nt_teacher";
const DEFAULT_TTL_SECONDS = 12 * 60 * 60; // one school day, plus the evening.
const TOKEN_VERSION = 1;

/**
 * The keys this deployment accepts, mapped to the teacher identity they mean.
 *
 * Identity is a label ("Neft", "Alba"), never the key. It exists so a future
 * per-teacher preference has something safe to hang on; it is not a user record
 * and there is no profile store behind it.
 */
export function acceptedKeys(env) {
  const map = new Map();
  const add = (value, identity) => {
    const key = String(value ?? "").trim();
    if (key) map.set(key, identity);
  };
  add(env?.TEACHER_KEY_NEFT, "Neft");
  add(env?.TEACHER_KEY_ALBA, "Alba");
  // Legacy single key. Kept so non-browser callers that already hold it are not
  // broken by this change; it authenticates as an unnamed teacher.
  add(env?.TEACHER_KEY, "Teacher");
  return map;
}

/** Constant-time-ish string compare. Not a defence against a local attacker,
 *  but it removes the trivial early-exit signal from a remote one. */
function sameString(a, b) {
  const x = String(a ?? "");
  const y = String(b ?? "");
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

/** The identity a raw key authenticates as, or null. */
export function identityForKey(env, supplied) {
  const key = String(supplied ?? "").trim();
  if (!key) return null;
  for (const [accepted, identity] of acceptedKeys(env)) {
    if (sameString(accepted, key)) return identity;
  }
  return null;
}

/* ── Cookies ───────────────────────────────────────────────────────────────── */

export function readCookie(request, name = COOKIE_NAME) {
  const header = request?.headers?.get?.("Cookie") || "";
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return "";
}

/**
 * Secure is unconditional: this site is HTTPS everywhere, and a cookie that
 * silently downgrades on a plain-HTTP dev origin is worse than one that simply
 * is not set there (wrangler dev serves https via --local-protocol=https).
 * SameSite=Lax keeps the session out of cross-site POSTs while still surviving
 * an ordinary link from the hub into the planner.
 */
export function sessionCookie(token, { maxAge = DEFAULT_TTL_SECONDS } = {}) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearedSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

/* ── Signed session tokens ─────────────────────────────────────────────────── */

const b64url = (bytes) => {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const unb64url = (text) => {
  const padded = String(text).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
};

const encoder = new TextEncoder();

/**
 * The signing secret. TEACHER_SESSION_SECRET when configured; otherwise derived
 * from the accepted keys themselves.
 *
 * The derivation is not a shortcut for its own sake — it means the session
 * feature works the moment the teacher keys are configured, with no second
 * secret to forget, and rotating a teacher key invalidates every session signed
 * under the old one. That is the correct behaviour for a credential rotation.
 */
async function signingKey(env) {
  const explicit = String(env?.TEACHER_SESSION_SECRET ?? "").trim();
  const material =
    explicit || `nt-teacher-session|${[...acceptedKeys(env).keys()].sort().join("|")}`;
  if (!explicit && acceptedKeys(env).size === 0) return null;
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(material));
  return crypto.subtle.importKey("raw", digest, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

/** Mint a signed session token for an identity. Returns "" when unconfigured. */
export async function mintSession(env, identity, { ttlSeconds = DEFAULT_TTL_SECONDS } = {}) {
  const key = await signingKey(env);
  if (!key) return "";
  const payload = b64url(
    encoder.encode(
      JSON.stringify({
        v: TOKEN_VERSION,
        t: String(identity || "Teacher"),
        e: Math.floor(Date.now() / 1000) + ttlSeconds,
      }),
    ),
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
  return `${payload}.${b64url(sig)}`;
}

/**
 * Verify a token. Returns the identity string, or null for anything that is
 * missing, malformed, wrongly signed, the wrong version, or expired.
 * It never throws and never distinguishes those cases to the caller — a caller
 * that could tell "expired" from "forged" would leak signal to an attacker.
 */
export async function verifySession(env, token) {
  const raw = String(token ?? "");
  const dot = raw.indexOf(".");
  if (dot <= 0) return null;
  const key = await signingKey(env);
  if (!key) return null;
  const payload = raw.slice(0, dot);
  let signature;
  try {
    signature = unb64url(raw.slice(dot + 1));
  } catch {
    return null;
  }
  let valid = false;
  try {
    valid = await crypto.subtle.verify("HMAC", key, signature, encoder.encode(payload));
  } catch {
    return null;
  }
  if (!valid) return null;
  let claims;
  try {
    claims = JSON.parse(new TextDecoder().decode(unb64url(payload)));
  } catch {
    return null;
  }
  if (claims?.v !== TOKEN_VERSION) return null;
  if (!Number.isFinite(claims?.e) || claims.e <= Math.floor(Date.now() / 1000)) return null;
  return typeof claims.t === "string" && claims.t ? claims.t : null;
}

/** The identity carried by this request's session cookie, or null. */
export async function resolveTeacherSession(env, request) {
  const token = readCookie(request);
  if (!token) return null;
  return verifySession(env, token);
}

/* ── The endpoint-facing predicate ─────────────────────────────────────────── */

/**
 * Drop-in replacement for the fifteen hand-copied `teacherAuthorized(env,
 * request, url)` functions, plus a fourth argument.
 *
 * `data` is Pages' per-request context.data, on which the middleware has
 * already recorded a verified session identity. Passing it is what makes the
 * cookie work; an endpoint that forgets it still authorizes raw keys, so the
 * failure mode of a missed call site is "the browser has to log in again",
 * never "an unauthenticated write succeeds".
 *
 * Returns "not-configured" | "ok" | "unauthorized". The three-state shape is
 * load-bearing: a missing binding must read as 503 (an ops problem) and never
 * as 401 (a teacher problem), which is what the original copies did too.
 */
export function teacherAuthorized(env, request, url, data = null) {
  if (acceptedKeys(env).size === 0) return "not-configured";
  if (data?.teacher) return "ok";
  const supplied =
    url?.searchParams?.get?.("key") || request?.headers?.get?.("x-teacher-key") || "";
  return identityForKey(env, supplied) ? "ok" : "unauthorized";
}

/** The identity behind an authorized request, for endpoints that want to label
 *  a change with who made it. Never returns the key. */
export function teacherIdentity(env, request, url, data = null) {
  if (data?.teacher) return data.teacher;
  const supplied =
    url?.searchParams?.get?.("key") || request?.headers?.get?.("x-teacher-key") || "";
  return identityForKey(env, supplied);
}

export const TEACHER_COOKIE_NAME = COOKIE_NAME;
export const TEACHER_SESSION_TTL_SECONDS = DEFAULT_TTL_SECONDS;
