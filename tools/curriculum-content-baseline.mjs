#!/usr/bin/env node
/**
 * Content-preservation baseline for the core interactive lessons.
 *
 * WHY THIS EXISTS
 * ---------------
 * The gates in this repo each protect one thing well — `validate:math` proves
 * answers are arithmetically right, `validate:ccss` proves standards resolve,
 * `generated-pages-fresh` proves HTML matches its config. None of them notices
 * a presentation change that QUIETLY DROPS content: a renderer refactor that
 * stops emitting a hint, a generator run that strips `choicesEs`, a bulk edit
 * that shifts `choiceFeedback` by one. This repo has already shipped two of
 * those three.
 *
 * So this records a per-lesson fingerprint of the things that must not change
 * by accident, grouped by category. A presentation project can then prove it
 * altered nothing instructional, and any change that IS intentional has to be
 * recorded on purpose with `--update`.
 *
 * It deliberately fingerprints VALUES, not formatting: the config is
 * re-serialised by several generators, so whitespace and key order must not
 * register as drift.
 *
 * Usage:
 *   node tools/curriculum-content-baseline.mjs            # write the baseline
 *   node tools/curriculum-content-baseline.mjs --check    # report drift, exit 1
 *   node tools/curriculum-content-baseline.mjs --update   # accept current state
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE = join(ROOT, "data/curriculum-content-baseline.json");
const CHECK = process.argv.includes("--check");
const UPDATE = process.argv.includes("--update");

const manifest = JSON.parse(readFileSync(join(ROOT, "data/curriculum-manifest.json"), "utf8"));
const lessons = manifest.lessons.map((l) => l.lessonId || l.id);

const hash = (value) =>
  createHash("sha256")
    .update(JSON.stringify(value ?? null))
    .digest("hex")
    .slice(0, 16);

/** Every practice item, in a stable order, flattened across tiers. */
function items(config) {
  const out = [];
  const p = config.practice || {};
  for (const tier of ["approaching", "onLevel", "extending", "optional"]) {
    for (const [i, item] of (p[tier] || []).entries()) out.push({ tier, i, item });
  }
  return out;
}

/** The fields whose loss or mutation would be an instructional regression. */
function fingerprint(id) {
  const config = JSON.parse(readFileSync(join(ROOT, "lessons", id, "config.json"), "utf8"));
  const its = items(config);
  const warmupQs = config.warmup?.questions || [];
  const ci = (item) => (typeof item.correctIndex === "number" ? item.correctIndex : item.answer);

  return {
    // ── identity: a change here moves a lesson, which breaks bookmarks and keys
    identity: hash([config.lessonId, config.unit, config.lesson, config.standard]),
    title: config.title,
    objective: hash(config.contentObjective),

    // ── the graded contract
    itemCount: its.length,
    itemTypes: hash(its.map(({ item }) => item.type)),
    answers: hash(its.map(({ item }) => [ci(item), item.answer ?? null])),
    grading: hash(
      its.map(({ item }) => [
        item.minLength ?? null,
        item.keywords ?? null,
        item.acceptable ?? null,
      ]),
    ),

    // ── authored support that a renderer change must never silently drop
    explanations: hash(its.map(({ item }) => item.explanation ?? null)),
    choiceFeedback: hash(its.map(({ item }) => item.choiceFeedback ?? null)),
    hints: hash(its.map(({ item }) => item.hints ?? item.hint ?? null)),
    sentenceSupport: hash(
      its.map(({ item }) => [item.sentenceStems ?? null, item.sentenceFrame ?? null]),
    ),
    misconceptionTags: hash(its.map(({ item }) => item.misconceptionTags ?? null)),

    // ── authored Spanish. Two generators have stripped this before.
    spanish: hash(
      its.map(({ item }) => [
        item.stemEs ?? null,
        item.choicesEs ?? null,
        item.hintsEs ?? null,
        item.explanationEs ?? null,
      ]),
    ),
    vocabularySpanish: hash(
      (config.vocabulary || []).map((v) => [v.termEs ?? null, v.definitionEs ?? null]),
    ),

    // ── warmup contract, including the sequencing metadata this project fixed
    warmup: hash([
      config.warmup?.kind ?? null,
      config.warmup?.prevLessonId ?? null,
      config.warmup?.spiralFrom ?? null,
      warmupQs.length,
      warmupQs.map((q) => [q.correctIndex, q.explanation ?? null]),
    ]),

    // ── instructional spine
    workedExample: hash(config.launch?.conceptIntro ?? null),
    vocabulary: hash((config.vocabulary || []).map((v) => [v.term, v.definition])),
    visuals: hash(JSON.stringify(config).match(/"kind":\s*"[a-z0-9-]+"/g) ?? []),
    reflect: hash(config.reflect ?? null),
    completion: hash([config.readiness ?? null, config.smallGroupPractice ?? null]),
  };
}

const current = {};
for (const id of lessons) {
  if (!existsSync(join(ROOT, "lessons", id, "config.json"))) continue;
  current[id] = fingerprint(id);
}

if (!CHECK || UPDATE || !existsSync(BASELINE)) {
  writeFileSync(
    BASELINE,
    `${JSON.stringify({ generatedBy: "tools/curriculum-content-baseline.mjs", lessons: current }, null, 2)}\n`,
  );
  console.log(
    `content baseline: recorded ${Object.keys(current).length} core lessons → data/curriculum-content-baseline.json`,
  );
  process.exit(0);
}

const prior = JSON.parse(readFileSync(BASELINE, "utf8")).lessons;
const drift = [];
for (const id of new Set([...Object.keys(prior), ...Object.keys(current)])) {
  if (!current[id]) {
    drift.push(`${id}: LESSON DISAPPEARED from the manifest`);
    continue;
  }
  if (!prior[id]) {
    drift.push(`${id}: new lesson (not in baseline)`);
    continue;
  }
  for (const key of Object.keys(prior[id])) {
    if (JSON.stringify(prior[id][key]) !== JSON.stringify(current[id][key])) {
      drift.push(
        `${id}.${key}: ${JSON.stringify(prior[id][key])} → ${JSON.stringify(current[id][key])}`,
      );
    }
  }
}

if (!drift.length) {
  console.log(`content baseline: ${Object.keys(current).length} lessons unchanged ✓`);
  process.exit(0);
}
console.error(
  `content baseline drift — ${drift.length} field(s) changed:\n  ${drift.join("\n  ")}`,
);
console.error(
  "\nIf every change above is intentional, record it: node tools/curriculum-content-baseline.mjs --update",
);
process.exit(1);
