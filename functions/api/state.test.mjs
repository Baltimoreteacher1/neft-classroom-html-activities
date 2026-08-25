#!/usr/bin/env node
/**
 * Pairing codes are the only secret in front of a Noam planner blob.
 * Math.random() is not acceptable for that, and pair_resolve must be
 * rate-limited or a GET loop enumerates the 6-digit space.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "state.js"), "utf8");

assert.match(src, /crypto\.getRandomValues/, "pair codes must use crypto.getRandomValues");
assert.doesNotMatch(src, /Math\.random\s*\(/, "pair codes must not use Math.random");
assert.match(
  src,
  /createRateLimiter/,
  "pair_resolve / pair_generate must share the http.js limiter",
);
assert.match(src, /pair_resolve/, "pair_resolve handler is missing");
assert.match(src, /pairLimiter|rateLimited/, "pair endpoints must consult a limiter");

console.log("state.js: pairing codes are CSPRNG and rate-limited.");
