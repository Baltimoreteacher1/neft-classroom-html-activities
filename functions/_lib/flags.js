/**
 * Request-side glue for the flag service: which environment is this, and which
 * signed overrides (if any) did the caller present. Evaluation itself lives in
 * shared/flags/ so there is one implementation.
 */
import { evaluateAll, parseSigned, registry, verifyOverrides } from "../../shared/flags/index.js";

export const OVERRIDE_HEADER = "x-flags-overrides";

/**
 * FLAGS_ENV (an environment binding) wins. Otherwise the hostname decides, and anything
 * unrecognised is production, the most restrictive reading.
 */
export function resolveEnv(request, env = {}) {
  const forced = env.FLAGS_ENV;
  if (["production", "staging", "preview", "local"].includes(forced)) return forced;
  const host = new URL(request.url).hostname;
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return "local";
  if (host.startsWith("staging.")) return "staging";
  if (host.endsWith(".pages.dev")) return "preview";
  return "production";
}

/** Verified overrides from the request header; {} when absent, unsigned, expired or no key. */
export async function overridesFromRequest(request, env = {}, now = Date.now()) {
  const signed = parseSigned(request.headers.get(OVERRIDE_HEADER));
  if (!signed) return {};
  const { overrides } = await verifyOverrides(signed, env.FLAGS_SIGNING_KEY, { now, registry });
  return overrides;
}

/**
 * Evaluated booleans for one caller. Ids are caller-asserted here, so trustedIds is false:
 * the egress master flag ignores cohorts on this path (see shared/flags/evaluate.js).
 */
export async function flagsForRequest(request, env = {}, ids = {}, now = Date.now()) {
  const ctx = { env: resolveEnv(request, env), trustedIds: false, ...ids };
  return evaluateAll(ctx, await overridesFromRequest(request, env, now));
}
