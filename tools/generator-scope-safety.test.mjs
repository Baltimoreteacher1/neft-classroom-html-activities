// A scoped generator run must never rewrite a fleet-level aggregate.
//
// WHY THIS GATE EXISTS
// --------------------
// tools/generate-small-group-lessons.mjs accumulated one entry per lesson it
// VISITED and then serialised that accumulator over the whole file. Run in full
// that is correct. Run as `--only 3-1` it wrote the module with 2 entries and
// silently destroyed facilitation for the other 166 lessons, whose teacher route
// then had nothing to serve. Nothing failed; the data was simply gone.
//
// The shape of the bug is general, so this pins the shape rather than the file:
// if a script BOTH accepts a scoping flag AND writes an aggregate outside
// lessons/, the aggregate write must be guarded by that flag (skip it, or merge
// into what is already on disk).
//
// An audit of all 63 scripts that write lesson configs found exactly one match,
// already fixed. This test exists so the next one fails immediately.

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const sources = [
  ...readdirSync(join(ROOT, "scripts"))
    .filter((f) => f.endsWith(".mjs"))
    .map((f) => join("scripts", f)),
  ...readdirSync(join(ROOT, "tools"))
    .filter((f) => f.endsWith(".mjs") && !f.endsWith(".test.mjs"))
    .map((f) => join("tools", f)),
];

/** A flag that makes the run process fewer lessons than the whole fleet. */
const SCOPE_FLAG = /"--only"|"--lesson"|"--unit"|"--single"/;

/** Writing one file assembled from an accumulator, outside lessons/. */
const AGGREGATE_WRITE =
  /writeFileSync\(\s*(?:new URL\(\s*"\.\/[\w-]+\.json"|[A-Z_]*(?:MODULE|ROWS|INDEX|MANIFEST|AGGREGATE)[A-Z_]*)/;

const offenders = [];
for (const rel of sources) {
  const src = readFileSync(join(ROOT, rel), "utf8");
  if (!SCOPE_FLAG.test(src)) continue;
  if (!AGGREGATE_WRITE.test(src)) continue;

  // Guarded when the aggregate write is conditioned on the scope flag, or the
  // accumulator is merged with what is already on disk before serialising.
  const guarded =
    /if\s*\(\s*!\s*ONLY|if\s*\(\s*!\w*ONLY\w*\s*&&|ONLY\s*\?|\.\.\.existing|\.\.\.prior|Object\.assign\(\s*existing/.test(
      src,
    );
  if (!guarded) offenders.push(rel);
}

assert.deepEqual(
  offenders,
  [],
  "these scripts accept a scoping flag AND write a fleet aggregate without guarding it — " +
    "a partial run would truncate data for every lesson it did not visit:\n  " +
    `${offenders.join("\n  ")}\n\n` +
    "Guard the aggregate write (skip it on a scoped run) or merge into the file already on disk.",
);

console.log(
  `PASS generator-scope-safety: ${sources.length} generator/script sources checked, ` +
    "no scoped run can truncate a fleet aggregate",
);
