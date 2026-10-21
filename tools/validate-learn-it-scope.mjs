#!/usr/bin/env node
/**
 * validate-learn-it-scope.mjs — every lesson's Learn It, held to that lesson.
 *
 * The companion to validate:interactive-alignment. That gate asks whether the
 * right TOOL is mounted; this one asks whether the EXPLANATION stays inside the
 * lesson it belongs to. Lesson 5-10 needed both: it mounted an open-top
 * surface-area builder AND carried a full vocabulary entry for Net — lesson
 * 5-6's concept (6.GR.4) — while the method its own objective names, base area
 * × height, appeared nowhere in its worked example.
 *
 * Three detectors, all string facts, described in tools/lib/learn-it-scope.mjs.
 * Each is EVIDENCE. A human classifies, and the classification lives in
 * data/learn-it-scope-review.json. The build prints the number of findings
 * awaiting review; the target is 0.
 *
 * The detectors are self-tested against known-good and known-bad fixtures
 * BEFORE the sweep runs, because a detector that has quietly stopped firing
 * reports a perfectly scoped curriculum — which is exactly what every gate in
 * this repo reported about 5-10 the day it shipped.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadStandardTopics, readFleet } from "./lib/interactive-alignment.mjs";
import {
  foreignFormulas,
  orphanTerms,
  scopeFindings,
  untaughtObjectiveTerms,
} from "./lib/learn-it-scope.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REVIEW = join(ROOT, "data/learn-it-scope-review.json");
const MIN_REASON = 40; // a one-word reason is how an audit gets gamed

const fail = [];
const note = (m) => fail.push(m);

/* ── Self-test: prove each detector still fires ───────────────────────────── */

// The lesson 5-10 defect, verbatim: a full vocabulary entry for a concept the
// lesson never asks a student to use.
const SHIPPED_5_10 = {
  contentObjective:
    "I can find the volume of a rectangular prism, including ones with fractional edge lengths, using base area × height.",
  standard: "6.GR.2",
  launch: {
    conceptIntro: {
      heading: "How do we find volume when an edge is a fraction?",
      intro:
        "Volume is the space inside a box. The rule V = length × width × height stays the same.",
      iDo: { lines: ["V = 2 × 1.5 × 1 = 3 cubic feet."] },
    },
  },
  vocabulary: [
    { term: "Volume of Rectangular Prisms", role: "concept" },
    { term: "Net", definition: "A flat shape that folds up into a solid." },
    { term: "Base area", definition: "The area of the bottom of a solid." },
  ],
  explore: { instructions: "Calculate the volume of each capsule. Use V = l × w × h." },
};

const selfTests = [
  ["ORPHAN catches the Net entry 5-10 shipped", () => orphanTerms(SHIPPED_5_10).includes("Net")],
  [
    "UNTAUGHT catches base area, named in the objective and absent from Learn It",
    () => untaughtObjectiveTerms(SHIPPED_5_10).includes("Base area"),
  ],
  [
    "the concept term is exempt — naming the lesson is not scope drift",
    () => !orphanTerms(SHIPPED_5_10).includes("Volume of Rectangular Prisms"),
  ],
  [
    "a term the lesson genuinely uses is not an orphan",
    () =>
      !orphanTerms({
        vocabulary: [{ term: "Base area" }],
        explore: { instructions: "Find the base area first." },
      }).includes("Base area"),
  ],
  [
    "the evidence excludes the vocabulary block itself",
    () =>
      orphanTerms({ vocabulary: [{ term: "Net", definition: "A net folds into a solid." }] })
        .length === 1,
  ],
  [
    "inflection is not read as absence",
    () =>
      !orphanTerms({
        vocabulary: [{ term: "quantity" }],
        contentObjective: "Compare two quantities.",
      }).includes("quantity"),
  ],
  [
    "FOREIGN catches surface-area prose in a volume lesson",
    () =>
      foreignFormulas(
        { launch: { conceptIntro: { intro: "Now find the surface area of all six faces." } } },
        "volume",
      ).includes("surface area"),
  ],
  [
    "FOREIGN says nothing about surface-area prose in a surface-area lesson",
    () =>
      foreignFormulas(
        { launch: { conceptIntro: { intro: "Now find the surface area of all six faces." } } },
        "surface-area",
      ).length === 0,
  ],
  [
    "a lesson with no Learn It yields no opinion, never a false pass",
    () =>
      untaughtObjectiveTerms({ contentObjective: "x", vocabulary: [{ term: "y" }] }).length === 0,
  ],
  [
    "an unknown standard topic yields no FOREIGN opinion",
    () =>
      foreignFormulas({ launch: { conceptIntro: { intro: "surface area" } } }, undefined).length ===
      0,
  ],
];

for (const [name, fn] of selfTests) {
  let ok = false;
  try {
    ok = fn() === true;
  } catch (err) {
    note(`self-test threw: ${name} — ${err.message}`);
    continue;
  }
  if (!ok) note(`self-test FAILED, the detector has stopped firing: ${name}`);
}

if (fail.length) {
  console.error("✗ validate:learn-it-scope");
  for (const m of fail) console.error(`   - ${m}`);
  process.exit(1);
}

/* ── Sweep ────────────────────────────────────────────────────────────────── */

const topics = loadStandardTopics(ROOT);
// Canonical lessons only. Small-group and catch-up variants are GENERATED from
// their parent and inherit its vocabulary wholesale, so auditing them reports
// every parent finding three more times without adding a single new fact.
const fleet = readFleet(ROOT).filter((l) => /^\d+-\d+$/.test(l.id));

const review = JSON.parse(readFileSync(REVIEW, "utf8"));
const decisions = new Map(
  (review.reviewed || []).map((r) => [`${r.lessonId}|${r.detector}|${r.subject}`, r]),
);
const seen = new Set();

let findings = 0;
const unreviewed = [];
for (const lesson of fleet) {
  for (const f of scopeFindings(lesson.config, topics.get(lesson.config.standard))) {
    findings++;
    const id = `${lesson.id}|${f.detector}|${f.subject}`;
    seen.add(id);
    const decision = decisions.get(id);
    if (!decision) {
      unreviewed.push(`${lesson.id} ${f.detector} ${JSON.stringify(f.subject)}`);
      continue;
    }
    if (!review.classifications[decision.classification]) {
      note(`${id}: unknown classification ${JSON.stringify(decision.classification)}`);
    }
    if (String(decision.reason || "").length < MIN_REASON) {
      note(`${id}: reason is under ${MIN_REASON} characters, which is not a review`);
    }
  }
}

// Stale absolutions are worse than no file: a decision about a finding that no
// longer fires reads as coverage the audit does not have.
for (const key of decisions.keys()) {
  if (!seen.has(key)) note(`${key}: reviewed, but this finding no longer fires — delete the entry`);
}

for (const u of unreviewed) note(`${u} is flagged and has no reviewed decision`);

if (fail.length) {
  console.error("✗ validate:learn-it-scope");
  for (const m of fail) console.error(`   - ${m}`);
  console.error(`\n   Learn It scope awaiting review: ${unreviewed.length}`);
  process.exit(1);
}

console.log(
  `✓ Learn It scope holds — ${fleet.length} canonical lessons, ` +
    `${findings} flagged and ${findings} reviewed.`,
);
console.log("   Learn It scope awaiting review: 0");
console.log(
  "   Note: an unflagged Learn It is not individually human-reviewed. The three " +
    "detectors (orphan / untaught / foreign) are structural evidence, not a pedagogy judgement.",
);
