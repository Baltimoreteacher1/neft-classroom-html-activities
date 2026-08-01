/* ==========================================================================
 * lesson-visuals-static.test.mjs — the always-on half of the lesson-visuals gate.
 *
 * scripts/validate-lesson-visuals.mjs runs two checks. The second boots every
 * lesson in a real browser and is far too slow for `npm test`, so it runs weekly
 * via Site Health. The FIRST is pure source analysis and takes milliseconds:
 *
 *   • every `kind` a lesson authors into a visual slot has a `buildVisual()`
 *     case, so it renders something at all; and
 *   • every kind that emits an interactive HOST is in the interactive-visual
 *     REGISTRY, so somebody actually mounts that host.
 *
 * Both directions ship silently. `net-folder` was in the REGISTRY with no
 * buildVisual case for as long as it existed: small-group labs mounted it
 * through figureBlock and looked fine, while a lesson that authored it as a
 * `diagram` rendered a blank gap under the full renderer. Nothing threw,
 * nothing 404'd, and the weekly probe was the only thing that could see it.
 *
 * Running just the static half on every push closes that window.
 * ========================================================================== */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const script = join(import.meta.dirname, "..", "scripts", "validate-lesson-visuals.mjs");

let out = "";
try {
  out = execFileSync(process.execPath, [script, "--static-only"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
} catch (err) {
  // Print the validator's own report — it names each offending lesson and kind.
  assert.fail(
    `lesson visuals static check failed:\n${err.stdout || ""}${err.stderr || ""}`.trimEnd(),
  );
}

assert.match(
  out,
  /Static: every declared visual kind is renderable and registered\./,
  "the static check must reach its success line",
);

// A validator that stops finding kinds would pass by reporting nothing. Pin the
// self-test and the counted registry so silence cannot masquerade as health.
assert.match(out, /self-test: \d+ passed, 0 failed/, "the validator's own self-test must run");
const counts = out.match(/Known kinds: (\d+) renderable, (\d+) in REGISTRY/);
assert.ok(counts, "the validator must report how many kinds it knows about");
assert.ok(Number(counts[1]) > 25, "renderable kinds should have been parsed");
assert.equal(
  counts[1],
  counts[2],
  "every registered interactive kind needs a buildVisual case, and vice versa",
);

console.log(
  `lesson visuals (static): ${counts[1]} kinds renderable and registered, no unrenderable slots.`,
);
