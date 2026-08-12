#!/usr/bin/env node
/* =============================================================================
 * validate-surface-numbers.mjs — a generated lesson page must state the numbers
 * the lesson states.
 * -----------------------------------------------------------------------------
 *   node tools/validate-surface-numbers.mjs
 *
 * WHY THIS EXISTS, AND WHY IT IS NOT THE FRESHNESS TEST
 *
 * generated-pages-fresh.test.mjs proves a committed page matches what its
 * generator would write today. That is a strong invariant and it cannot see one
 * whole class of bug: a generator that faithfully writes the WRONG thing. If a
 * builder reads the wrong field, drops a step, or reformats a quantity into a
 * different number, the page is perfectly "fresh" and quietly teaches
 * arithmetic the lesson never authored.
 *
 * This checks the other direction: every number the canonical worked example
 * states must appear on the surfaces that render it.
 *
 * WHY ONLY NUMBERS, AND ONLY THESE THREE SURFACES
 *
 * The 2026-08-12 alignment audit tried four semantic comparisons across all
 * 672 generated lesson files and measured each one's false-positive rate:
 *
 *   text-anchor matching     17 flags, 100% false — learn.html splices glossary
 *                            markers mid-sentence ("The dividend ⓘ is 1,344"),
 *                            so the authored string is never contiguous.
 *   cross-surface answers    99 of 164 flags false (~60%) — handout.html caps
 *                            practice at 4 items and notes-teacher.html keys
 *                            its OWN packet items, not the config's pool.
 *   vocabulary terms         16 flags, all false — generate-handout-html.mjs
 *                            does `.slice(0, 6)` by design.
 *   NUMBER SETS              252 comparisons, ZERO false positives.
 *
 * Only the last one earned a place here. The other three are documented so the
 * next person does not re-derive them: a check with a 60% false-positive rate
 * is not a stricter gate, it is an ignored one.
 *
 * Scope is learn.html, slides.html and printable.html — the three surfaces that
 * actually render the worked example. worksheet/handout/notes/vocab/homework
 * are different artifacts by construction and are deliberately out of scope.
 *
 * WHAT COUNTS AS THE SAME NUMBER
 *
 * Comparison is by VALUE, not by string, so legitimate rendering differences
 * pass: thousands separators (1,344 = 1344), decimal formatting (78.50 = 78.5),
 * percentages (50% = 50), fractions against their decimal form (1/2 = 0.5), and
 * any unit attached to a number (8 in. = 8). A surface that prints 1334 where
 * the lesson says 1,344 fails, because the canonical value is then absent.
 * ========================================================================== */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");
const SURFACES = ["learn.html", "slides.html", "printable.html"];
const EPS = 1e-9;

/** Visible text only — scripts and styles carry numbers no student ever reads. */
function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#039;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/\s+/g, " ");
}

/**
 * Every numeric VALUE in a string.
 *
 * Fractions are read first and as a whole, so "3/4" yields 0.75 rather than a
 * stray 3 and 4 — otherwise a lesson about fractions would demand that its
 * surfaces print the numerator and denominator as separate numbers, which is
 * exactly the kind of noise that makes a gate useless.
 */
export function numberValues(text) {
  const s = String(text ?? "").replace(/(\d),(?=\d{3}\b)/g, "$1");
  const out = new Set();
  const fraction = /(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/g;
  let m;
  const spans = [];
  while ((m = fraction.exec(s))) {
    const d = Number(m[2]);
    if (d !== 0) out.add(Number(m[1]) / d);
    spans.push([m.index, m.index + m[0].length]);
  }
  const plain = /-?\d+(?:\.\d+)?/g;
  while ((m = plain.exec(s))) {
    if (spans.some(([a, b]) => m.index >= a && m.index < b)) continue;
    out.add(Number(m[0]));
  }
  return out;
}

const has = (set, v) => {
  for (const x of set) if (Math.abs(x - v) < EPS) return true;
  return false;
};

/** Canonical values the surface must state, and which of them are absent. */
export function missingValues(canonicalText, surfaceText) {
  const want = numberValues(canonicalText);
  const have = numberValues(surfaceText);
  return [...want].filter((v) => !has(have, v)).sort((a, b) => a - b);
}

/* ----------------------------------------------------------------- selftest */

const selftests = [
  ["exact match", "I want 1344 ÷ 12.", "The page says I want 1344 ÷ 12.", 0],
  ["thousands separator", "I want 1,344 ÷ 12.", "1344 divided by 12", 0],
  ["decimal formatting", "About 78.5 people.", "About 78.50 people.", 0],
  ["percent sign", "25% of 60 is 15.", "25 percent of 60 is 15", 0],
  ["fraction vs decimal", "Half of it is 1/2.", "Half of it is 0.5", 0],
  ["unit attached", "My box is 8 in. long.", "My box is 8 inches long.", 0],
  ["missing canonical number", "12 × 8 = 96.", "12 × 8 = ", 1],
  ["transformed number", "1,344 ÷ 12 = 112.", "1334 ÷ 12 = 112.", 1],
  ["extra numbers on the surface are fine", "8 × 5 = 40.", "8 × 5 = 40, page 3 of 7", 0],
];
let selfFailed = 0;
for (const [why, canonical, surface, want] of selftests) {
  const got = missingValues(canonical, surface).length;
  if (got !== want) {
    console.error(`SELFTEST FAIL (${why}): expected ${want} missing, got ${got}`);
    selfFailed += 1;
  }
}
if (selfFailed) {
  console.error(
    `\nvalidate:surface-numbers — ${selfFailed} self-test(s) failed; the gate is not trustworthy.`,
  );
  process.exit(1);
}

/* -------------------------------------------------------------------- sweep */

const ids = readdirSync(LESSONS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^\d+-\d+$/.test(d.name))
  .map((d) => d.name)
  .filter((id) => existsSync(join(LESSONS, id, "config.json")))
  .sort();

const failures = [];
let lessons = 0;
let comparisons = 0;
for (const id of ids) {
  let config;
  try {
    config = JSON.parse(readFileSync(join(LESSONS, id, "config.json"), "utf8"));
  } catch {
    continue;
  }
  const lines = config.launch?.conceptIntro?.iDo?.lines;
  if (!Array.isArray(lines) || !lines.length) continue;
  lessons += 1;
  const canonical = lines.join(" ");
  for (const surface of SURFACES) {
    const file = join(LESSONS, id, surface);
    if (!existsSync(file)) continue;
    comparisons += 1;
    const missing = missingValues(canonical, visibleText(readFileSync(file, "utf8")));
    if (missing.length) {
      failures.push(
        `${id}/${surface} — worked example states ${missing.join(", ")}, page does not`,
      );
    }
  }
}

if (failures.length) {
  console.error(`validate:surface-numbers FAILED (${failures.length} surface(s)):\n`);
  for (const f of failures.slice(0, 20)) console.error(`  ✗ ${f}`);
  if (failures.length > 20) console.error(`  …and ${failures.length - 20} more`);
  console.error(
    `\nA number the canonical worked example states is missing from a page that` +
      ` renders it. Regenerate the surface, or check whether its builder is reading` +
      ` the field the lesson actually authored.`,
  );
  process.exit(1);
}

console.log(
  `validate:surface-numbers PASS ✅ (${comparisons} comparisons across ${lessons} lessons × ${SURFACES.length} surfaces; ${selftests.length} self-tests green)`,
);
