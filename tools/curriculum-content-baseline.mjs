#!/usr/bin/env node
/**
 * Content-preservation baseline for the core interactive lessons.
 *
 * WHY THIS EXISTS
 * ---------------
 * The gates in this repo each protect one thing well: `validate:math` proves
 * answers are arithmetically right, `validate:ccss` proves standards resolve,
 * `generated-pages-fresh` proves HTML matches its config. None of them notices a
 * presentation change that QUIETLY DROPS content. This repo has already shipped
 * two such regressions — a generator run stripped `choicesEs`/`hintsEs` from
 * small-group configs, and a bulk edit left lessons/2-3 with `choiceFeedback`
 * shifted by one, so the "5.2" choice was told "7 is not the middle value".
 *
 * WHAT IS PROTECTED HERE
 *   • student-facing item text: stems, prompts, choices, directions
 *   • the graded contract: item count, types, correct answers, grading rules
 *   • authored support: explanations, choiceFeedback, hints, sentence support
 *   • misconception tags
 *   • authored Spanish, on items and on vocabulary
 *   • the warmup contract: kind, anchor, question text, choices, answers,
 *     explanations
 *   • worked examples, vocabulary terms and definitions
 *   • MATHEMATICS INSIDE VISUALS — the values a model draws, not its styling
 *   • student-facing resource links
 *   • completion / readiness rules
 *
 * WHAT IS DELIBERATELY NOT DUPLICATED HERE
 *   • save/resume keys — no config carries one; they are derived from lessonId
 *     at runtime (`rma_<lessonId>_<student>`), so the `identity` fingerprint
 *     below already fails if a lessonId moves. `validate:save-resume` owns the
 *     wiring itself.
 *   • SCORM eligibility — not a config field. `validate:scorm` and
 *     `validate:canvas-coverage` own it, and both assert far more than a hash.
 *   • strategy-choice configuration — lives in the engine, not in lesson
 *     configs (the string only appears in prose here), so there is nothing
 *     per-lesson to pin.
 *
 * FORM
 * Compact, high-signal fields (counts, types, correct answers) are stored as
 * VALUES so drift reads as a real before → after. Bulky text is stored as
 * per-item hashes so drift localises to `3-1 onLevel[2].stems` instead of
 * reporting that "something in this lesson changed". That keeps the file
 * reviewable without turning it into a full snapshot of the curriculum.
 *
 * Formatting is never fingerprinted: several generators re-serialise these
 * files, so key order and whitespace must not read as drift.
 *
 * Usage:
 *   npm run curriculum:baseline:check     # read-only verification (default)
 *   npm run curriculum:baseline:update    # accept current content, on purpose
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE = join(ROOT, "data/curriculum-content-baseline.json");
const UPDATE = process.argv.includes("--update");

const manifest = JSON.parse(readFileSync(join(ROOT, "data/curriculum-manifest.json"), "utf8"));
const lessons = manifest.lessons.map((l) => l.lessonId || l.id);

const h = (value) =>
  createHash("sha256")
    .update(JSON.stringify(value ?? null))
    .digest("hex")
    .slice(0, 12);

/** Collapse whitespace so a re-wrap is not mistaken for a rewrite. */
const norm = (s) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim() : (s ?? null));

/**
 * Keys on a visual object that carry MATHEMATICS. Everything else on those
 * objects — name, emoji, desc, docx, pdf, caption, intro, instructions, attrs,
 * presets, mode, figure — is presentational and is deliberately ignored, so
 * restyling a diagram is free while moving a plotted point is not.
 */
const MATH_KEYS = new Set([
  "min",
  "max",
  "step",
  "start",
  "startB",
  "axisMin",
  "axisMax",
  "binWidth",
  "points",
  "bars",
  "rows",
  "values",
  "data",
  "parts",
  "a",
  "b",
  "c",
  "d",
  "h",
  "w",
  "size",
  "base",
  "exponent",
  "dividend",
  "divisor",
  "percent",
  "whole",
  "value",
  "decimal",
  "answer",
  "q1",
  "median",
  "q3",
  "equation",
  "expr",
  "op",
  "shape",
  "solid",
  "unit",
  "unitA",
  "unitB",
  "kMin",
  "kMax",
  "kStep",
  "kDefault",
  "correct",
  "highlightIndex",
  // Axis and series labels name the quantities, so they are mathematical.
  "label",
  "labelA",
  "labelB",
  "xLabel",
  "yLabel",
  "xName",
  "yName",
]);

/** Every `kind`-bearing object in the config, reduced to its mathematics. */
function visualMath(config) {
  const found = [];
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const child of node) walk(child);
      return;
    }
    if (node.kind) {
      const math = { kind: node.kind };
      for (const [k, v] of Object.entries(node)) {
        if (k !== "kind" && MATH_KEYS.has(k)) math[k] = v;
      }
      found.push(math);
    }
    for (const child of Object.values(node)) walk(child);
  };
  walk(config);
  return found;
}

/** Student-facing links, which must not silently repoint or vanish. */
function links(config) {
  return (JSON.stringify(config).match(/"(?:href|url|student|teacher)":\s*"([^"]+)"/g) || [])
    .map((s) => s.replace(/\s+/g, ""))
    .sort();
}

function items(config) {
  const out = [];
  const p = config.practice || {};
  for (const tier of ["approaching", "onLevel", "extending", "optional"]) {
    for (const [i, item] of (p[tier] || []).entries()) out.push({ tier, i, item });
  }
  return out;
}

function fingerprint(id) {
  const config = JSON.parse(readFileSync(join(ROOT, "lessons", id, "config.json"), "utf8"));
  const its = items(config);
  const wq = config.warmup?.questions || [];
  const ci = (it) => (typeof it.correctIndex === "number" ? it.correctIndex : (it.answer ?? null));

  // Per-item hashes: drift names the item, not just the lesson.
  const per = (fn) => its.map(({ tier, i, item }) => `${tier}[${i}]:${h(fn(item))}`);

  return {
    identity: [config.lessonId, config.unit, config.lesson, config.standard].join("|"),
    title: config.title,
    objective: h(norm(config.contentObjective)),

    // ── graded contract, as VALUES so a change is legible at a glance
    itemCount: its.length,
    itemTypes: its.map(({ item }) => item.type).join(","),
    correctAnswers: its.map(({ item }) => String(ci(item))).join(","),
    grading: h(its.map(({ item }) => [item.minLength ?? null, item.keywords ?? null])),

    // ── student-facing item text
    stems: per((it) => norm(it.stem ?? it.prompt ?? it.title)),
    choices: per((it) => (it.choices || []).map(norm)),
    directions: per((it) => norm(it.instructions ?? it.directions ?? null)),

    // ── authored support
    explanations: per((it) => norm(it.explanation)),
    choiceFeedback: per((it) => (it.choiceFeedback || []).map(norm)),
    hints: per((it) => (it.hints ?? (it.hint ? [it.hint] : [])).map(norm)),
    sentenceSupport: per((it) => [(it.sentenceStems || []).map(norm), norm(it.sentenceFrame)]),
    misconceptionTags: per((it) => it.misconceptionTags ?? null),

    // ── authored Spanish, item-level and vocabulary-level
    spanish: per((it) => [
      norm(it.stemEs),
      (it.choicesEs || []).map(norm),
      (it.hintsEs || []).map(norm),
      norm(it.explanationEs),
    ]),
    vocabularySpanish: h(
      (config.vocabulary || []).map((v) => [norm(v.termEs), norm(v.definitionEs)]),
    ),

    // ── warmup: metadata AND the questions themselves
    warmupKind: `${config.warmup?.kind ?? "previous"}|${config.warmup?.prevLessonId ?? ""}|${config.warmup?.spiralFrom ?? ""}`,
    warmupCount: wq.length,
    warmupAnswers: wq.map((q) => String(q.correctIndex)).join(","),
    warmupText: wq.map((q, i) => `[${i}]:${h([norm(q.stem), (q.choices || []).map(norm)])}`),
    warmupExplanations: wq.map((q, i) => `[${i}]:${h(norm(q.explanation))}`),

    // ── instructional spine
    workedExample: h(JSON.stringify(config.launch?.conceptIntro ?? null).replace(/\s+/g, " ")),
    vocabulary: h((config.vocabulary || []).map((v) => [v.term, norm(v.definition)])),
    visualMath: h(visualMath(config)),
    links: h(links(config)),
    reflect: h(JSON.stringify(config.reflect ?? null).replace(/\s+/g, " ")),
    completion: `${config.readiness ?? null}`,
  };
}

const current = {};
for (const id of lessons) {
  if (!existsSync(join(ROOT, "lessons", id, "config.json"))) continue;
  current[id] = fingerprint(id);
}

if (UPDATE) {
  writeFileSync(
    BASELINE,
    `${JSON.stringify({ generatedBy: "tools/curriculum-content-baseline.mjs", lessons: current }, null, 2)}\n`,
  );
  console.log(
    `content baseline UPDATED: ${Object.keys(current).length} core lessons accepted as the new baseline.`,
  );
  process.exit(0);
}

// Read-only from here down. A missing baseline is a hard error, never a silent
// write: routine QA must not be able to mint its own reference.
if (!existsSync(BASELINE)) {
  console.error(
    "content baseline missing: data/curriculum-content-baseline.json does not exist.\n" +
      "Create it deliberately with: npm run curriculum:baseline:update",
  );
  process.exit(1);
}

const prior = JSON.parse(readFileSync(BASELINE, "utf8")).lessons;
const drift = [];

/** Report an array-valued category by the ENTRY that changed. */
function diffList(id, key, before, after) {
  const b = new Map(before.map((s) => [s.split(":")[0], s]));
  const a = new Map(after.map((s) => [s.split(":")[0], s]));
  for (const slot of new Set([...b.keys(), ...a.keys()])) {
    if (b.get(slot) === a.get(slot)) continue;
    if (!a.has(slot)) drift.push(`${id}.${key} ${slot}: REMOVED`);
    else if (!b.has(slot)) drift.push(`${id}.${key} ${slot}: ADDED`);
    else drift.push(`${id}.${key} ${slot}: content changed`);
  }
}

for (const id of new Set([...Object.keys(prior), ...Object.keys(current)])) {
  if (!current[id]) {
    drift.push(`${id}: LESSON DISAPPEARED from the manifest`);
    continue;
  }
  if (!prior[id]) {
    drift.push(`${id}: NEW lesson (not in baseline)`);
    continue;
  }
  for (const key of Object.keys(prior[id])) {
    const before = prior[id][key];
    const after = current[id][key];
    if (JSON.stringify(before) === JSON.stringify(after)) continue;
    if (Array.isArray(before) && Array.isArray(after)) diffList(id, key, before, after);
    else drift.push(`${id}.${key}: ${JSON.stringify(before)} → ${JSON.stringify(after)}`);
  }
}

if (!drift.length) {
  console.log(`content baseline: ${Object.keys(current).length} lessons unchanged ✓`);
  process.exit(0);
}
console.error(`content baseline drift — ${drift.length} change(s):\n  ${drift.join("\n  ")}`);
console.error(
  "\nEach line names the lesson, the category and the item slot; `git diff` that item to read the change.\n" +
    "If every change above is intentional: npm run curriculum:baseline:update",
);
process.exit(1);
