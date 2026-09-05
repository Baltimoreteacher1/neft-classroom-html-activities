#!/usr/bin/env node
/**
 * The Groups-from-Evidence data files must match reality.
 *
 * Both are generated projections (see scripts/generate-evidence-group-data.mjs),
 * and each has a distinct way of going quietly wrong:
 *
 *   small-group-variants.json — the teacher tool turns this into the "Run this
 *   lesson" button it puts in front of a live class. A stale entry is a 404 at
 *   the worst possible moment, and because the naming convention is regular
 *   (`3-2-group1`) a wrong entry looks perfectly plausible in review. So every
 *   listed variant is resolved on disk here, and every variant ON disk must be
 *   listed — a lesson that gains a catch-up should not stay invisible.
 *
 *   misconception-taxonomy.json — drifts the other way. The taxonomy in
 *   engine/core/misconceptions.js keeps being extended; a projection that
 *   silently lags shows a student-facing page raw tag ids like
 *   `op-reversed-division` where a sentence belongs.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { MISCONCEPTIONS } from "@eduwonderlab/engine/core/misconceptions.js";

const read = (name) =>
  JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), "utf8"));

// ── 1. Generated files are in sync with their sources. ────────────────────
execFileSync(
  process.execPath,
  [
    fileURLToPath(new URL("../scripts/generate-evidence-group-data.mjs", import.meta.url)),
    "--check",
  ],
  { stdio: "pipe" },
);

// ── 2. Taxonomy covers every misconception, with usable text. ─────────────
const { taxonomy } = read("misconception-taxonomy.json");
const ids = Object.keys(MISCONCEPTIONS);
assert.ok(ids.length >= 20, `expected the taxonomy to be populated, found ${ids.length}`);
assert.deepEqual(
  Object.keys(taxonomy).sort(),
  [...ids].sort(),
  "the projection and engine/core/misconceptions.js disagree on which ids exist",
);
for (const [id, entry] of Object.entries(taxonomy)) {
  assert.ok(entry.label, `${id}: needs a label — the teacher card shows this as the group title`);
  assert.ok(entry.labelEs, `${id}: needs labelEs (falls back to English, never blank)`);
  assert.ok(entry.student, `${id}: needs the student-facing explanation`);
  assert.ok(entry.studentEs, `${id}: needs studentEs (falls back to English, never blank)`);
}

// ── 3. Every variant link the tool can emit actually exists. ──────────────
const { bases, suffixes } = read("small-group-variants.json");
let listed = 0;
for (const [base, info] of Object.entries(bases)) {
  assert.match(base, /^\d{1,2}-\d{1,2}$/, `${base}: base ids must be bare unit-lesson`);
  for (const suffix of info.variants) {
    assert.ok(suffixes.includes(suffix), `${base}: unknown variant suffix "${suffix}"`);
    const dir = new URL(`../lessons/${base}-${suffix}/index.html`, import.meta.url);
    assert.ok(
      existsSync(dir),
      `${base}-${suffix} is listed but has no lessons/${base}-${suffix}/index.html — ` +
        "the teacher tool would link a class to a 404",
    );
    listed += 1;
  }
}

// ── 4. …and nothing on disk is missing from the index. ────────────────────
const onDisk = execFileSync("git", ["ls-files", "lessons"], {
  cwd: fileURLToPath(new URL("..", import.meta.url)),
  encoding: "utf8",
})
  .split("\n")
  .map((p) => p.match(/^lessons\/(\d{1,2}-\d{1,2})-(group1|group2|catchup)\/index\.html$/))
  .filter(Boolean);

const missing = onDisk
  .filter(([, base, suffix]) => !bases[base]?.variants.includes(suffix))
  .map(([, base, suffix]) => `${base}-${suffix}`);
assert.deepEqual(
  missing,
  [],
  `${missing.length} small-group lesson(s) exist on disk but are absent from the index — ` +
    "regenerate with: node scripts/generate-evidence-group-data.mjs",
);

assert.equal(
  listed,
  onDisk.length,
  `index lists ${listed} variants, disk has ${onDisk.length} — these must agree exactly`,
);

console.log(
  `Evidence-group data fresh: ${ids.length} misconceptions (EN+ES), ` +
    `${listed} small-group variants across ${Object.keys(bases).length} base lessons, all resolving on disk.`,
);
