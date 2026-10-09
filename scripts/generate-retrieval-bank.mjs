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
import { isPortableItem, reviewStem } from "@eduwonderlab/engine/core/retrieval-portable.js";
import { buildInstructionalSequence } from "../shared/curriculum/instructional-sequence.js";

export { reviewStem };

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const OUTPUT = resolve(ROOT, "data/retrieval-bank.json");

const BANK_PER_STANDARD = 8;
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

/** Is this item answerable on its own? (rule shared with the runtime spiral review) */
export const isPortable = isPortableItem;

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
  // The first date the original pacing plan teaches each lesson — what "two to
  // four weeks ago" is measured in by the spiral review (engine/core/spiral-review.js).
  const firstDate = new Map();
  for (const day of read("data/pacing-baseline-2026-27.json").days || []) {
    const id = day?.plan?.lessonId;
    if (id && !firstDate.has(id)) firstDate.set(id, day.date);
  }
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
      ...(firstDate.has(id) ? { date: firstDate.get(id) } : {}),
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
