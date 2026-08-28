#!/usr/bin/env node
/**
 * Build the spaced-retrieval item bank from the lessons that already exist.
 *
 * The bank is NOT new content. Every item in it is a multiple-choice question
 * already authored in a lesson config and already checked by `validate:math`,
 * copied out and re-keyed by standard so the scheduler can ask a student about
 * 6.NOS.1 three weeks after they last saw it without knowing which lesson that
 * was. Writing fresh review items instead would have meant a second, unvalidated
 * copy of the curriculum's mathematics — the one thing this repo has been bitten
 * by before.
 *
 * Selection rules, in order:
 *   - multiple-choice only, 3+ choices, a valid correctIndex, and a stem
 *   - the stem must stand alone: items that say "the table above" or "this
 *     diagram" are unanswerable once lifted out of their lesson
 *   - deduplicated by stem, so a standard taught across four lessons does not
 *     fill its slots with the same question
 *   - capped per standard (BANK_PER_STANDARD), preferring items with an
 *     explanation, so the review can always say WHY
 *
 * Deterministic: same configs in, byte-identical bank out. tools/retrieval.test.mjs
 * fails if the committed artifact is stale.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildInstructionalSequence } from "../shared/curriculum/instructional-sequence.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const OUTPUT = resolve(ROOT, "data/retrieval-bank.json");

const BANK_PER_STANDARD = 8;
const MAX_STEM_CHARS = 220;

// Stems that only make sense next to something on the lesson page. Lifting one
// of these into a review card produces a question with no answerable content —
// the single worst failure this bank can have, because the student is not wrong,
// the question is.
const CONTEXT_DEPENDENT =
  /\b(above|below|shown|this (?:table|graph|diagram|figure|model|number line|plot)|the (?:table|graph|diagram|figure|model|plot) (?:above|below|shown)|following (?:table|graph|diagram))\b/i;

// 128 stems open with the lesson they were written for — "(Lesson 4.4) A student
// scored 72 out of 90…". Inside its own lesson that prefix is orientation; on a
// review card three weeks later it is a distraction pointing at the wrong place.
const LESSON_PREFIX = /^\(Lesson\s+[\d.]+\)\s*/;

/** The stem as a review card should ask it. */
export function reviewStem(raw) {
  return String(raw ?? "")
    .trim()
    .replace(LESSON_PREFIX, "")
    .trim();
}

function walk(node, visit) {
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit);
    return;
  }
  if (node && typeof node === "object") {
    if (typeof node.type === "string") visit(node);
    for (const value of Object.values(node)) walk(value, visit);
  }
}

/** Is this item answerable on its own, away from the lesson that authored it? */
export function isPortable(item) {
  if (item.type !== "multiple-choice") return false;
  if (!Array.isArray(item.choices) || item.choices.length < 3) return false;
  if (!Number.isInteger(item.correctIndex)) return false;
  if (item.correctIndex < 0 || item.correctIndex >= item.choices.length) return false;
  const stem = reviewStem(item.stem);
  if (stem.length < 10 || stem.length > MAX_STEM_CHARS) return false;
  if (CONTEXT_DEPENDENT.test(stem)) return false;
  // An item whose choices are not all distinct strings has more than one
  // "correct" button and cannot be scored.
  const choices = item.choices.map((c) => String(c).trim());
  if (choices.some((c) => !c)) return false;
  if (new Set(choices).size !== choices.length) return false;
  // A per-item figure cannot come along, so an item that needs one is out.
  if (item.diagram) return false;
  return true;
}

/**
 * The lessons a class has ALREADY MET, in the order the district teaches them —
 * the same instructional sequence the warmups use, read from the same three
 * data files (see shared/curriculum/instructional-sequence.js), never from a
 * lesson number. "Remember When" reviews only lessons that sit BEFORE today's
 * in this list: the curriculum numbers 6-1 after 5-10, but the district
 * teaches 6-1 in the Pre-Unit, so on that day the only things a student can
 * remember are 1-1, 2-6 and 2-7 (Joel, 2026-08-28: "use a previous lesson …
 * following the updated scope and sequence and lesson scope").
 *
 * Paced lessons only: an unpaced lesson is never taught, so it can be neither
 * remembered nor a position to count back from.
 */
export function buildTaughtSequence() {
  const read = (rel) => JSON.parse(readFileSync(resolve(ROOT, rel), "utf8"));
  const manifest = read("data/curriculum-launch-manifest.json");
  const sequence = buildInstructionalSequence({
    ranges: read("data/pacing-unit-ranges.json"),
    authored: read("data/pacing-unit-lessons.json"),
    manifest,
  });
  const meta = new Map((manifest.lessons || []).map((l) => [l.id, l]));
  const out = [];
  for (const id of sequence.order) {
    const entry = sequence.entries.get(id);
    if (!entry || !entry.paced) continue;
    const m = meta.get(id) || {};
    out.push({
      id,
      standard: String(m.standard || ""),
      title: String(m.title || ""),
      unit: entry.unitKey || String(m.unit || ""),
    });
  }
  return out;
}

export function buildBank() {
  const lessonsDir = resolve(ROOT, "lessons");
  const byStandard = new Map();

  for (const slug of readdirSync(lessonsDir).sort()) {
    let config;
    try {
      config = JSON.parse(readFileSync(resolve(lessonsDir, slug, "config.json"), "utf8"));
    } catch {
      continue;
    }
    const standard = config.standard;
    if (!standard) continue;

    walk(config, (item) => {
      if (!isPortable(item)) return;
      if (!byStandard.has(standard)) byStandard.set(standard, new Map());
      const bucket = byStandard.get(standard);
      const key = reviewStem(item.stem);
      if (bucket.has(key)) return;
      bucket.set(key, {
        lesson: config.lessonId || slug,
        stem: key,
        choices: item.choices.map((c) => String(c).trim()),
        correctIndex: item.correctIndex,
        ...(item.explanation ? { explanation: String(item.explanation).trim() } : {}),
      });
    });
  }

  const standards = {};
  for (const standard of [...byStandard.keys()].sort()) {
    const items = [...byStandard.get(standard).values()]
      // Prefer items that can explain themselves, then keep authoring order
      // stable by stem so the output does not churn between runs.
      .sort((a, b) => {
        const explained = Number(Boolean(b.explanation)) - Number(Boolean(a.explanation));
        return explained || a.stem.localeCompare(b.stem);
      })
      .slice(0, BANK_PER_STANDARD);
    if (items.length) standards[standard] = items;
  }

  const total = Object.values(standards).reduce((n, items) => n + items.length, 0);
  const sequence = buildTaughtSequence();
  return {
    _generated: "scripts/generate-retrieval-bank.mjs — do not hand-edit",
    _source:
      "lessons/*/config.json (multiple-choice items already gated by validate:math); " +
      "sequence from data/pacing-unit-ranges.json + pacing-unit-lessons.json + curriculum-launch-manifest.json",
    standards: Object.keys(standards).length,
    items: total,
    taught: sequence.length,
    bank: standards,
    sequence,
  };
}

export function serialize(bank) {
  return `${JSON.stringify(bank, null, 2)}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const bank = buildBank();
  writeFileSync(OUTPUT, serialize(bank));
  console.log(
    `retrieval bank: ${bank.items} items across ${bank.standards} standards -> data/retrieval-bank.json`,
  );
}
