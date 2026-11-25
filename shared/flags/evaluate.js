/**
 * Feature-flag evaluator. Pure and dependency-free so the same code runs in the
 * Pages Function, in Node tests and in the browser.
 *
 * PRECEDENCE (first match wins), then `requires` is applied on top:
 *   1. signed override   a verified { flagKey: boolean } map (see verifyOverrides)
 *   2. cohort            the caller's teacherId / classId / demo id is listed on the flag
 *   3. environment       flag.environments[env] when it is true or false (null = inherit)
 *   4. default           flag.default
 *   `requires`: a flag is on only if every flag it requires is also on for the same
 *   caller. Nothing, including an override, can turn a flag on while a required flag is off.
 *
 * Unknown flag: false. With { strict: true } (tests) it throws instead, so a typo in a
 * flag key fails a test rather than silently shipping a feature that is always off.
 *
 * KILL SWITCH: a flag with killSwitch true can be turned OFF by a signed override, but a
 * signed override can never turn it ON. Turning it on is a reviewed change to registry.js.
 *
 * UNVERIFIED IDS: teacherId / classId arriving over the public /api/flags endpoint are
 * caller-asserted. With ctx.trustedIds === false the cohort layer is skipped for the
 * egress master flag, so nobody enables egress for themselves by claiming a class id.
 * Server code that has verified the ids itself leaves trustedIds unset.
 *
 * SIGNED OVERRIDES: payload { overrides, expires } is canonicalised (sorted keys, no
 * whitespace) and signed with HMAC-SHA256; sig is lowercase hex. The key comes from the
 * FLAGS_SIGNING_KEY environment binding and is never committed. With no usable key every
 * override is ignored.
 */

export const ENVIRONMENTS = Object.freeze(["production", "staging", "preview", "local"]);
export const EGRESS_FLAG = "student_content_egress";
export const MIN_KEY_LENGTH = 32;
export const MAX_OVERRIDE_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_SIGNED_BYTES = 4096;

export class FlagError extends Error {
  constructor(message) {
    super(message);
    this.name = "FlagError";
  }
}

const indexCache = new WeakMap();

/** Map of key -> flag for a registry; cached per registry object. */
export function indexRegistry(registry) {
  let index = indexCache.get(registry);
  if (!index) {
    index = new Map((registry?.flags ?? []).map((flag) => [flag.key, flag]));
    indexCache.set(registry, index);
  }
  return index;
}

function inCohort(flag, ctx) {
  if (ctx.trustedIds === false && flag.key === EGRESS_FLAG) return false;
  const cohorts = flag.cohorts ?? {};
  if (ctx.teacherId && cohorts.teacher?.includes(ctx.teacherId)) return true;
  if (ctx.classId && cohorts.class?.includes(ctx.classId)) return true;
  return typeof ctx.demo === "string" && !!ctx.demo && !!cohorts.demo?.includes(ctx.demo);
}

/** The flag's own value before `requires`: override > cohort > environment > default. */
function ownValue(flag, ctx, overrides) {
  if (overrides && Object.hasOwn(overrides, flag.key) && typeof overrides[flag.key] === "boolean") {
    const wanted = overrides[flag.key];
    if (!(flag.killSwitch && wanted === true)) return wanted;
  }
  if (inCohort(flag, ctx)) return true;
  const fromEnv = flag.environments?.[ctx.env];
  if (typeof fromEnv === "boolean") return fromEnv;
  return flag.default === true;
}

function evaluate(index, key, ctx, overrides, strict, visiting) {
  const flag = index.get(key);
  if (!flag) {
    if (strict) throw new FlagError(`unknown flag "${key}"`);
    return false;
  }
  if (visiting.has(key)) throw new FlagError(`requires cycle through "${key}"`);
  if (strict && ctx.env !== undefined && !ENVIRONMENTS.includes(ctx.env)) {
    throw new FlagError(`unknown environment "${ctx.env}"`);
  }
  if (!ownValue(flag, ctx, overrides)) return false;
  visiting.add(key);
  try {
    return (flag.requires ?? []).every((req) =>
      evaluate(index, req, ctx, overrides, strict, visiting),
    );
  } finally {
    visiting.delete(key);
  }
}

/**
 * @param {object} registry the registry object (registry.js)
 * @param {string} flagKey
 * @param {{env?: string, teacherId?: string, classId?: string, demo?: string, trustedIds?: boolean}} [ctx]
 * @param {Record<string, boolean>} [overrides] VERIFIED overrides only (see verifyOverrides)
 * @param {{strict?: boolean}} [opts]
 */
export function isEnabled(registry, flagKey, ctx = {}, overrides = {}, opts = {}) {
  return evaluate(
    indexRegistry(registry),
    flagKey,
    ctx,
    overrides,
    opts.strict === true,
    new Set(),
  );
}

/** Every flag in the registry as { key: boolean } for one caller. */
export function evaluateAll(registry, ctx = {}, overrides = {}, opts = {}) {
  const index = indexRegistry(registry);
  const strict = opts.strict === true;
  return Object.fromEntries(
    [...index.keys()].map((key) => [key, evaluate(index, key, ctx, overrides, strict, new Set())]),
  );
}

/* ---------------------------------------------------------------- signing */

/** JSON with sorted object keys and no whitespace; rejects values JSON cannot carry exactly. */
export function canonicalJson(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new FlagError("canonicalJson: non-finite number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(",")}}`;
  }
  throw new FlagError(`canonicalJson: unsupported ${typeof value}`);
}

const encoder = new TextEncoder();

function usableKey(secret) {
  return typeof secret === "string" && secret.length >= MIN_KEY_LENGTH;
}

function hmacKey(secret, usage) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage],
  );
}

const toHex = (bytes) =>
  [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");

function fromHex(hex) {
  if (typeof hex !== "string" || hex.length !== 64 || !/^[0-9a-f]+$/.test(hex)) return null;
  return Uint8Array.from(hex.match(/../g), (pair) => Number.parseInt(pair, 16));
}

/**
 * Sign { overrides: {flag: boolean}, expires: ISO-8601 } -> { payload, sig }.
 * Used by tools/flags-sign.mjs and tests; the running service only verifies.
 */
export async function signOverrides(payload, secret) {
  if (!usableKey(secret))
    throw new FlagError(`signing key must be at least ${MIN_KEY_LENGTH} characters`);
  const key = await hmacKey(secret, "sign");
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(canonicalJson(payload)));
  return { payload, sig: toHex(sig) };
}

/** Parse the transport form (a JSON string) into { payload, sig } or null. Never throws. */
export function parseSigned(text) {
  if (typeof text !== "string" || text.length === 0 || text.length > MAX_SIGNED_BYTES) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Verify a signed override and return only the flags it may set.
 * Never throws. Returns { overrides, reason }: reason is null when the overrides were accepted
 * and a short code ("no-key", "bad-signature", "expired", ...) when they were ignored.
 */
export async function verifyOverrides(signed, secret, { now = Date.now(), registry } = {}) {
  const ignore = (reason) => ({ overrides: {}, reason });
  if (!usableKey(secret)) return ignore("no-key");
  if (!signed || typeof signed !== "object") return ignore("malformed");
  const { payload, sig } = signed;
  const sigBytes = fromHex(sig);
  if (!sigBytes || !payload || typeof payload !== "object") return ignore("malformed");

  let data;
  try {
    data = encoder.encode(canonicalJson(payload));
  } catch {
    return ignore("malformed");
  }
  const ok = await crypto.subtle.verify("HMAC", await hmacKey(secret, "verify"), sigBytes, data);
  if (!ok) return ignore("bad-signature");

  const expires = typeof payload.expires === "string" ? Date.parse(payload.expires) : Number.NaN;
  if (Number.isNaN(expires)) return ignore("no-expiry");
  if (expires <= now) return ignore("expired");
  if (expires - now > MAX_OVERRIDE_LIFETIME_MS) return ignore("expiry-too-far");
  if (!payload.overrides || typeof payload.overrides !== "object") return ignore("malformed");

  const index = registry ? indexRegistry(registry) : null;
  const overrides = {};
  for (const [key, value] of Object.entries(payload.overrides)) {
    if (typeof value !== "boolean") continue;
    if (index && !index.has(key)) continue;
    overrides[key] = value;
  }
  return { overrides, reason: null };
}
