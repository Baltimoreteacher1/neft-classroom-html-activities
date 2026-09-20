#!/usr/bin/env node
/**
 * reveal-lesson-map.test.mjs — a district Reveal sheet must land on the site
 * lesson that teaches the same mathematics.
 *
 * `Unit N/Lesson N.x` under `~/Desktop/Reveal Math by Unit and Lesson/` matches
 * `lessons/N-x` for 53 of the 54 district lessons, so the importers key on the
 * number. Lesson 2.6 is the exception and it is why this test exists: the
 * district's 2.6 is "Median and Outliers" while the site's 2-6 is "Divide
 * Multi-Digit Numbers Using an Algorithm", because the site interleaves Unit
 * 2's division lessons with its statistics lessons and the district does not.
 * Read by number, that put a median/outlier word wall and a median worked
 * example on a long-division worksheet, and it shipped live on 2026-09-19.
 *
 * The check is a topic-word overlap between the two titles, which is the same
 * evidence a human uses to spot the crossing. It is deliberately loose — the
 * district writes "Finding the MAD" where the site writes "Describe Data by
 * Mean Absolute Deviation" — so it fires on a DIFFERENT topic, not on different
 * wording. A pair that genuinely has no home on the site belongs in
 * `UNMAPPED_REVEAL_LESSONS`, with the reason written down beside it.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { revealFor, UNMAPPED_REVEAL_LESSONS } from "../scripts/lib/worksheet-reveal.mjs";
import { LESSONS_DIR } from "./lib/curriculum-source.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SESSION_1 = JSON.parse(
  readFileSync(join(ROOT, "data/reveal-session1-source.json"), "utf8"),
).lessons;

/* Words that say nothing about the topic: every title is "determine the area
   of…" or "describe data using…", so leaving them in would score any two
   titles as a match. */
const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "using",
  "use",
  "its",
  "from",
  "that",
  "this",
  "understand",
  "determine",
  "describe",
  "represent",
  "apply",
  "explore",
  "solve",
  "problems",
  "problem",
  "find",
  "finding",
  "identify",
  "generate",
  "write",
  "writing",
  "build",
  "building",
  "data",
  "math",
  "lesson",
  "between",
  "within",
  "more",
  "than",
  "less",
  "your",
  "you",
  "are",
  "how",
  "what",
]);

/* Synonym pairs the district and the site both use for one concept. Each is a
   naming difference we have read, not a topic difference. */
const SYNONYM = new Map([
  ["mad", "absolute"],
  ["net", "dimension"],
  ["nets", "dimension"],
  ["power", "exponent"],
  ["powers", "exponent"],
  ["repeated", "exponent"],
  ["factor", "multiple"],
  ["factors", "multiple"],
  ["gcf", "factor"],
  ["greatest", "factor"],
  ["equivalence", "equivalent"],
  ["simplifying", "equivalent"],
  ["properties", "equivalent"],
  ["rewrite", "equivalent"],
  ["customary", "measurement"],
  ["metric", "measurement"],
  ["conversion", "measurement"],
  ["conversions", "measurement"],
  ["unit", "measurement"],
  ["grid", "coordinate"],
  ["points", "distance"],
  ["independent", "variable"],
  ["dependent", "variable"],
  ["substitute", "variable"],
  ["polygons", "area"],
  ["common", "compare"],
  ["comparing", "compare"],
  ["terms", "compare"],
  ["numbers", "number"],
  ["dividing", "division"],
  ["divide", "division"],
  ["decimal", "decimals"],
  ["fraction", "fractions"],
  ["ratios", "ratio"],
  ["rates", "rate"],
  ["measures", "measure"],
  ["median", "measure"],
  ["mean", "measure"],
  ["expressions", "expression"],
  ["equations", "equation"],
  ["solutions", "equation"],
  ["variables", "variable"],
  ["whole", "number"],
  ["iqr", "interquartile"],
  ["range", "interquartile"],
  ["quartile", "interquartile"],
]);

function topicWords(title) {
  const words = String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map((w) => SYNONYM.get(w) || w.replace(/s$/, ""));
  return new Set(words);
}

function overlaps(a, b) {
  const left = topicWords(a);
  const right = topicWords(b);
  if (!right.size) return true;
  for (const w of right) {
    for (const x of left) {
      if (x === w || x.includes(w) || w.includes(x)) return true;
    }
  }
  return false;
}

/* ── The detector still fires on the crossing that shipped ─────────────────── */
assert.equal(
  overlaps("Divide Multi-Digit Numbers Using an Algorithm", "Median and Outliers"),
  false,
  "the 2-6 crossing must still be detectable — a detector that stopped firing reports a clean map",
);
assert.equal(
  overlaps("Describe Data by Mean Absolute Deviation", "Finding the MAD"),
  true,
  "different wording for one topic must NOT read as a crossing",
);

/* ── Every mapped district lesson lands on a site lesson about the same thing ─ */
const crossings = [];
let checked = 0;
for (const sheet of SESSION_1) {
  const id = `${sheet.unit}-${sheet.lesson}`;
  const mapped = revealFor(id);
  if (!mapped) {
    assert.ok(
      UNMAPPED_REVEAL_LESSONS.has(id),
      `${id}: the Reveal sheet resolved to nothing but is not listed as unmapped`,
    );
    continue;
  }
  let config;
  try {
    config = JSON.parse(readFileSync(join(LESSONS_DIR, id, "config.json"), "utf8"));
  } catch {
    continue;
  }
  checked += 1;
  if (!overlaps(config.title, sheet.sessionTitle)) {
    crossings.push(`${id}: site "${config.title}" vs Reveal "${sheet.sessionTitle}"`);
  }
}

assert.deepEqual(
  crossings,
  [],
  "a Reveal sheet is being read onto a site lesson about different mathematics",
);

/* ── An unmapped lesson really is unmapped, on every surface ───────────────── */
for (const id of UNMAPPED_REVEAL_LESSONS) {
  assert.equal(revealFor(id), null, `${id} is listed unmapped but still resolves a sheet`);
  assert.equal(revealFor(`${id}-part2`), null, `${id}-part2 still resolves a Session 2 sheet`);
  assert.equal(revealFor(`${id}-group1`), null, `${id}-group1 still resolves a sheet`);
}

console.log(
  `reveal-lesson-map: ${checked} district lesson(s) land on a site lesson about the same topic; ${UNMAPPED_REVEAL_LESSONS.size} deliberately unmapped.`,
);
