// Bulk approval guard. Approving more than BULK_SAMPLE_THRESHOLD items at once needs the reviewer to read
// a random sample of BULK_SAMPLE_SIZE of them individually first. The server picks the sample and signs a
// token over (item set, sample, expiry); the bulk request must present that token, and the server then
// checks the log for an individual decision on every sampled item. Stateless: the key is derived from the
// site teacher key, so rotating it revokes every outstanding token.

import { BULK_SAMPLE_SIZE, SAMPLE_TTL_MS } from "../../../shared/content-schema/review-rules.js";
import { canonicalJson } from "../../../shared/content-schema/v2.mjs";
import { DecisionError } from "./decide.js";

const enc = new TextEncoder();
const b64u = (bytes) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const unb64u = (s) =>
  Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

/** An item is one decision target: { blockId, dimension, lang }. Its key is stable and order independent. */
export const itemKey = (i) => `${i.blockId}|${i.dimension}|${i.lang || ""}`;

export async function itemSetDigest(items) {
  const keys = items.map(itemKey).sort();
  const bytes = enc.encode(canonicalJson(keys));
  return b64u(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)));
}

/** Production RNG: uniform float in [0,1) from the platform CSPRNG. Tests pass a seeded createRng().next. */
export function cryptoRng() {
  const buf = new Uint32Array(1);
  return () => {
    crypto.getRandomValues(buf);
    return buf[0] / 4294967296;
  };
}

/** Pick `size` distinct items with a partial Fisher-Yates driven by `rng` (a function returning [0,1)). */
export function chooseSample(items, rng = cryptoRng(), size = BULK_SAMPLE_SIZE) {
  const pool = [...items];
  const n = Math.min(size, pool.length);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rng() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(`review-sample-v1 ${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Token = base64url(payload JSON) "." base64url(HMAC). Payload: { set, ids, iat, exp, who }. */
export async function issueSampleToken({ secret, items, sample, reviewerName, now }) {
  const payload = {
    set: await itemSetDigest(items),
    ids: sample.map(itemKey),
    who: reviewerName,
    iat: now,
    exp: now + SAMPLE_TTL_MS,
  };
  const body = b64u(enc.encode(JSON.stringify(payload)));
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(body)),
  );
  return { token: `${body}.${b64u(sig)}`, payload };
}

/** Verify a token against the items of this bulk request. Returns the payload or throws DecisionError. */
export async function verifySampleToken({ secret, token, items, reviewerName, now }) {
  const bad = (code, msg) => new DecisionError(code, msg, code === "sample-expired" ? 409 : 422);
  if (typeof token !== "string" || !token.includes("."))
    throw bad("sample-required", "a sample token is required");
  const [body, sig] = token.split(".");
  let ok = false;
  try {
    ok = await crypto.subtle.verify("HMAC", await hmacKey(secret), unb64u(sig), enc.encode(body));
  } catch {
    ok = false;
  }
  if (!ok) throw bad("sample-invalid", "sample token is not valid");
  const payload = JSON.parse(new TextDecoder().decode(unb64u(body)));
  if (now > payload.exp) throw bad("sample-expired", "sample token expired; request a new sample");
  if (payload.who !== reviewerName)
    throw bad("sample-invalid", "sample token was issued to a different reviewer");
  if (payload.set !== (await itemSetDigest(items)))
    throw bad("sample-invalid", "sample token does not match this set of items");
  return payload;
}
