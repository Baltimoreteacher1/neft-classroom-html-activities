/**
 * teacher-session.js — the 24-hour receipt for a successful teacher sign-in.
 *
 * WHAT THIS IS NOT. It is not a fourth gate, and it is not a new credential.
 * `SITE_PASSWORD` over HTTP Basic remains the ONLY way to authenticate a
 * teacher surface (AUTH_CONTRACT.md section 2). This module issues a signed
 * receipt *after* that check has already passed, so the browser stops
 * re-challenging for the next 24 hours — including across a browser restart,
 * which is the one thing a cached Basic credential does not survive.
 *
 * WHY IT IS SAFE TO ADD. The 2026-08-16 rollback removed a session system that
 * *replaced* Basic Auth with per-teacher key slots, a sign-in page, and a
 * request heuristic. Nothing here replaces anything: delete this file and every
 * teacher surface still authenticates exactly as it did, one challenge at a
 * time. That is the property to preserve if this is ever edited.
 *
 * KEY MATERIAL. The HMAC key is derived from `SITE_PASSWORD` itself, so there
 * is no second secret to configure and no second secret to forget to rotate:
 * changing the password invalidates every outstanding receipt for free. The
 * receipt carries an expiry and a signature and nothing else — no identity, no
 * role, no key prefix, nothing that would be worth stealing.
 */

export const SESSION_COOKIE = "nt_teacher_day";

/** 24 hours, in milliseconds. The literal the whole feature is named for. */
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

const encoder = new TextEncoder();

function base64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(password, payload) {
  // The domain separator keeps this signature from ever being confused with
  // some other future use of the same password as key material.
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`nt-teacher-day-v1 ${password}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return base64url(new Uint8Array(sig));
}

/**
 * Compare without leaking where two strings first differ. Lengths are folded
 * into the accumulator and the loop always runs to the end of the longer one.
 */
function timingSafeEqual(a, b) {
  const left = String(a);
  const right = String(b);
  let diff = left.length ^ right.length;
  const max = Math.max(left.length, right.length);
  for (let i = 0; i < max; i++) {
    diff |= (left.charCodeAt(i) || 0) ^ (right.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/** Read one cookie out of a raw Cookie header. Returns "" when absent. */
export function readCookie(header, name) {
  const raw = String(header || "");
  if (!raw) return "";
  for (const part of raw.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    return part.slice(eq + 1).trim();
  }
  return "";
}

/** `<expiryMs>.<signature>` — the entire contents of the receipt. */
export async function mintToken(password, now = Date.now()) {
  const payload = String(now + SESSION_TTL_MS);
  return `${payload}.${await sign(password, payload)}`;
}

/**
 * Set-Cookie value for a fresh 24-hour receipt.
 *
 * HttpOnly so page scripts cannot read or forge it; SameSite=Lax so it still
 * travels on a top-level navigation from Canvas or a bookmark; Path=/ because
 * teacher surfaces are scattered across the site.
 */
export async function mintSessionCookie(password, now = Date.now()) {
  const token = await mintToken(password, now);
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  return `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

/** Set-Cookie value that removes the receipt. */
export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

/** True when `token` is a receipt this password signed and it has not expired. */
export async function verifyToken(token, password, now = Date.now()) {
  if (!token || !password) return false;
  const raw = String(token);
  const dot = raw.indexOf(".");
  if (dot <= 0) return false;
  const payload = raw.slice(0, dot);
  const supplied = raw.slice(dot + 1);
  // Reject anything that is not a plain positive integer before doing crypto:
  // "1e999", "0x10" and " 12 " all coerce to numbers, and only the exact string
  // that was signed can be re-signed to the same value anyway.
  if (!/^[0-9]{1,15}$/.test(payload)) return false;
  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return false;
  return timingSafeEqual(supplied, await sign(password, payload));
}

/** True when the request carries a valid, unexpired receipt. */
export async function hasValidSession(request, password, now = Date.now()) {
  const token = readCookie(request.headers.get("Cookie"), SESSION_COOKIE);
  return verifyToken(token, password, now);
}
