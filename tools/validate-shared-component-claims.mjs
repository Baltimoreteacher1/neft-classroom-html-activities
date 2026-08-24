#!/usr/bin/env node
/**
 * validate-shared-component-claims.mjs — shared code may not teach one lesson's
 * mathematics to every lesson.
 *
 * WHY THIS EXISTS. Every other gate here asks whether LESSON DATA belongs to the
 * lesson it appears on. A string hardcoded inside a shared component is not
 * lesson data, so all of them are blind to it — and the failure has now shipped
 * twice:
 *
 *   1. `engine/components/data-live.js` printed, under every bar chart on every
 *      lesson: "These are categories, so a mean or median has no meaning — that
 *      is what makes this a bar chart, not a histogram." That is unit 2's
 *      distinction. On 3-8, "Solve Problems with Unit Rates", the bar chart
 *      compares prices and the sentence is about mathematics 3-8 never teaches.
 *   2. `assets/math-notes/math-notes-model.svg` drew a sample notebook page
 *      headed "Lesson 1-1 · Sept. 3" showing "Area = base × height" and the
 *      words variable / expression / evaluate. It was rendered in the Math Notes
 *      dialog of all 84 lessons, so 83 of them showed a student another lesson's
 *      worked mathematics under a fabricated lesson number.
 *
 * TWO DETECTORS, both deliberately narrow. A gate that flags every sentence
 * mentioning mathematics inside `engine/components` reports ~240 findings,
 * nearly all correct — a box-plot builder SHOULD explain quartiles — and a gate
 * that needs a 240-line allowlist on its first run is a formality. These two
 * fire on the shape of the observed defects and nothing else:
 *
 *   CROSS-REPRESENTATION CLAIM — a contrastive sentence ("not a", "instead of",
 *     "is what makes", "has no meaning") naming two or more distinct
 *     representations or measures. Explaining the thing you are drawing needs no
 *     contrast with the thing you are not.
 *   FABRICATED LESSON IDENTITY — shared code or a shared asset printing a
 *     literal "Lesson 4-2"-style identifier that no lesson supplied.
 *
 * Legitimate cases are recorded in data/shared-component-claims-review.json with
 * a written reason. Reasons under 40 characters fail: that is how an audit gets
 * gamed.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCAN_ROOTS = ["engine/components", "engine/core", "assets/math-notes", "shared"];
const REVIEW = join(ROOT, "data", "shared-component-claims-review.json");

/** Prose ABOUT the code is not shipped to a student. Comments are stripped so a
 *  file may explain the very defect it was written to fix. */
export function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
}

const REPRESENTATIONS = [
  "mean",
  "median",
  "mode",
  "range",
  "histogram",
  "bar chart",
  "bar graph",
  "box plot",
  "dot plot",
  "line plot",
  "quartile",
  "outlier",
  "reciprocal",
  "numerator",
  "denominator",
  "quotient",
  "percent",
  "ratio",
  "unit rate",
  "area",
  "perimeter",
  "volume",
  "surface area",
  "absolute value",
  "integer",
  "coefficient",
  "exponent",
  "inequality",
  "quadrant",
  "symmetry",
  "prime factor",
  "multiple",
  "decimal",
  "fraction",
  "net",
  "prism",
];

const CONTRAST =
  /\bnot a\b|\bnot an\b|\brather than\b|\bis what makes\b|\bthat is what makes\b|\bhas no meaning\b|\binstead of\b|\bunlike\b|\bis not the same as\b/i;

const FAKE_LESSON = /\bLesson\s+\d+-\d+\b/;

export function crossRepresentationClaim(text) {
  const t = String(text).replace(/\s+/g, " ").trim();
  if (t.split(" ").length < 6) return null;
  if (!CONTRAST.test(t)) return null;
  const named = REPRESENTATIONS.filter((c) => new RegExp(`\\b${c}\\b`, "i").test(t));
  if (named.length < 2) return null;
  return named;
}

export function fabricatedLessonIdentity(line) {
  const t = String(line);
  if (t.includes("${")) return null; // rendered from real lesson data
  const m = t.match(FAKE_LESSON);
  return m ? m[0] : null;
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(js|mjs|svg|css)$/.test(p)) out.push(p);
  }
  return out;
}

export function scanFile(file, src) {
  const findings = [];
  const isCode = /\.(js|mjs)$/.test(file);
  const body = isCode ? stripComments(src) : src;

  for (const raw of body.match(/'[^'\n]{25,300}'|"[^"\n]{25,300}"|`[^`]{25,300}`/g) || []) {
    const text = raw.slice(1, -1).replace(/\s+/g, " ").trim();
    const named = crossRepresentationClaim(text);
    if (named) {
      findings.push({
        file,
        kind: "cross-representation-claim",
        detail: `names ${named.join(" + ")}`,
        text: text.slice(0, 160),
      });
    }
  }
  for (const line of body.split("\n")) {
    const id = fabricatedLessonIdentity(line);
    if (id) {
      findings.push({
        file,
        kind: "fabricated-lesson-identity",
        detail: id,
        text: line.trim().slice(0, 160),
      });
    }
  }
  return findings;
}

/* ── self-test: both detectors must fire on the strings that ACTUALLY SHIPPED,
      and must stay quiet on the component copy that is correct. ──────────── */

const SHIPPED_BAR_CHART_CLAIM =
  "These are categories, so a mean or median has no meaning — that is what makes this a bar chart, not a histogram.";

const NEGATIVE = [
  {
    name: "the bar-chart claim that shipped under every lesson",
    text: SHIPPED_BAR_CHART_CLAIM,
    fn: crossRepresentationClaim,
  },
  {
    name: "a component asserting a different representation",
    text: "A dot plot shows every value, unlike a histogram which only shows counts.",
    fn: crossRepresentationClaim,
  },
  {
    name: "the sample page's fabricated lesson number",
    text: '<text x="92">Lesson 1-1</text>',
    fn: fabricatedLessonIdentity,
  },
];

const POSITIVE = [
  {
    name: "a box-plot builder explaining its own quartiles",
    text: "Q1 is the median of the LOWER half (don't include the median itself when the count is odd).",
    fn: crossRepresentationClaim,
  },
  {
    name: "an imperative hint",
    text: "Tap a bar to read its value and compare categories.",
    fn: crossRepresentationClaim,
  },
  {
    name: "a decimal component explaining its own quotient",
    text: "Both decimals move the same way, so the quotient does not change.",
    fn: crossRepresentationClaim,
  },
  {
    name: "a lesson id rendered from real data",
    text: "`Lesson ${config.lessonId}`",
    fn: fabricatedLessonIdentity,
  },
  {
    name: "a blank layout placeholder",
    text: '<text x="92">Lesson ____</text>',
    fn: fabricatedLessonIdentity,
  },
];

function selfTest() {
  let ok = true;
  for (const c of NEGATIVE) {
    if (!c.fn(c.text)) {
      console.error(`  SELFTEST FAIL  detector did not fire on: ${c.name}`);
      ok = false;
    }
  }
  for (const c of POSITIVE) {
    if (c.fn(c.text)) {
      console.error(`  SELFTEST FAIL  false positive on: ${c.name}`);
      ok = false;
    }
  }
  return ok;
}

function main() {
  if (!selfTest()) {
    console.error(
      "\nFAIL validate:shared-claims — self-test failed; detectors are not trustworthy.",
    );
    process.exit(1);
  }
  console.log(
    `  PASS  self-test: ${NEGATIVE.length} negative and ${POSITIVE.length} positive controls`,
  );

  const review = existsSync(REVIEW) ? JSON.parse(readFileSync(REVIEW, "utf8")) : { reviewed: [] };
  const reviewed = new Map((review.reviewed || []).map((r) => [`${r.file}::${r.text}`, r]));
  const seen = new Set();

  const findings = [];
  for (const root of SCAN_ROOTS) {
    for (const file of walk(join(ROOT, root))) {
      const rel = relative(ROOT, file);
      findings.push(...scanFile(rel, readFileSync(file, "utf8")));
    }
  }

  const unreviewed = [];
  for (const f of findings) {
    const key = `${f.file}::${f.text}`;
    seen.add(key);
    const entry = reviewed.get(key);
    if (!entry) {
      unreviewed.push(f);
      continue;
    }
    if (String(entry.reason || "").trim().length < 40) {
      unreviewed.push({ ...f, detail: `${f.detail} — reviewed with a reason under 40 characters` });
    }
  }

  // A decision whose finding no longer fires is stale absolution.
  const stale = [...reviewed.keys()].filter((k) => !seen.has(k));

  console.log(
    `  Scanned ${SCAN_ROOTS.join(", ")} — ${findings.length} finding(s), ${reviewed.size} reviewed.`,
  );

  if (unreviewed.length === 0 && stale.length === 0) {
    console.log(
      "\nPASS validate:shared-claims — no shared component asserts a lesson's mathematics.",
    );
    return;
  }
  for (const f of unreviewed) {
    console.error(`  FAIL  ${f.file} [${f.kind}] ${f.detail}\n        "${f.text}"`);
  }
  for (const k of stale) {
    console.error(`  FAIL  stale review entry — this finding no longer fires: ${k}`);
  }
  console.error(
    `\nFAIL validate:shared-claims — ${unreviewed.length} unreviewed finding(s), ${stale.length} stale entr(y/ies).`,
  );
  process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
