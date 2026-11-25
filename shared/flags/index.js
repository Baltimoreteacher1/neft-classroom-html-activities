/**
 * Bound flag API: the committed registry (registry.js) plus the pure evaluator.
 * This is the one import for app code; tools and tests that need another registry
 * (negative controls) call evaluate.js directly.
 */
import * as evaluator from "./evaluate.js";
import registry from "./registry.js";

export {
  canonicalJson,
  EGRESS_FLAG,
  ENVIRONMENTS,
  FlagError,
  MAX_OVERRIDE_LIFETIME_MS,
  MIN_KEY_LENGTH,
  parseSigned,
  signOverrides,
  verifyOverrides,
} from "./evaluate.js";
export { registry };

/** Strict mode: unknown flags throw. Tests set FLAGS_STRICT=1 (or pass { strict: true }). */
function strictByDefault() {
  return typeof process !== "undefined" && process.env?.FLAGS_STRICT === "1";
}

export function isEnabled(flagKey, ctx = {}, overrides = {}, opts = {}) {
  return evaluator.isEnabled(registry, flagKey, ctx, overrides, {
    strict: opts.strict ?? strictByDefault(),
  });
}

export function evaluateAll(ctx = {}, overrides = {}, opts = {}) {
  return evaluator.evaluateAll(registry, ctx, overrides, {
    strict: opts.strict ?? strictByDefault(),
  });
}
