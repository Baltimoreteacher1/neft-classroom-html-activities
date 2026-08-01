#!/usr/bin/env node
/* ==========================================================================
 * generated-pages-fresh.test.mjs — a committed lesson page must still match
 * the config.json it was generated from.
 *
 * WHY THIS EXISTS
 *
 * lessons/<id>/*.html are a SECOND copy of the lesson's content. Editing a
 * config changes the interactive lesson immediately and changes these pages
 * NEVER, so they rot silently: the page renders, looks right, and quietly
 * teaches something the curriculum no longer says.
 *
 * On 2026-08-01 the first clean full-fleet regeneration found 287 pages that
 * had rotted exactly this way — 215 worksheets whose word banks were missing
 * the lesson-title vocabulary term and whose error-analysis notes were missing
 * the diagnostic half of the correction, and 72 handouts whose vocabulary
 * tables omitted the title term outright.
 *
 * WHY IT COMPARES OUTPUT, NOT TEXT
 *
 * The obvious check — grep the page for a field's text from config.json — is
 * NOT a sound invariant here, and I built it first and threw it away:
 *   - slides.html renders `commonMistake` REWORDED, not verbatim;
 *   - learn.html renders Notice & Wonder CONDITIONALLY (present in 1-4,
 *     absent in 1-1);
 *   - a naive presence check flagged 74 lessons that were perfectly in sync.
 * Comparing against the generator's own output has none of that ambiguity, and
 * it covers every field at once instead of a hand-listed few. Injected sentinel
 * blocks are excluded by construction, because `isGeneratedFresh` re-splices
 * the ones already on disk before comparing.
 *
 * SCOPE. Wired for the two generators where this actually bit. The remaining
 * lesson-page generators can be added the same way (a `--check` flag delegating
 * to `isGeneratedFresh`) once each is confirmed idempotent across the fleet.
 * ========================================================================== */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const GENERATORS = [
  ["worksheet.html", "../scripts/generate-worksheets.mjs"],
  ["handout.html", "../scripts/generate-handout-html.mjs"],
];

const stale = [];
for (const [page, rel] of GENERATORS) {
  const script = fileURLToPath(new URL(rel, import.meta.url));
  try {
    execFileSync(process.execPath, [script, "--check"], { stdio: "pipe" });
  } catch (err) {
    const detail = `${err.stderr ?? ""}`.trim() || `${err.stdout ?? ""}`.trim();
    stale.push(`${page}:\n${detail}`);
  }
}

assert.deepEqual(
  stale,
  [],
  `Generated lesson page(s) no longer match their config.json:\n\n${stale.join("\n\n")}`,
);

console.log(`Generated pages fresh: ${GENERATORS.map(([p]) => p).join(", ")} match their configs.`);
