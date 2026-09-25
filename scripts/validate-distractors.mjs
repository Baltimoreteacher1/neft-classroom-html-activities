#!/usr/bin/env node
/**
 * CI gate: verifies that multiple-choice DISTRACTORS are sound.
 *
 * validate-math.mjs proves the keyed answer is arithmetically right. Nothing
 * proved anything about the other three options. validate-lesson-quality.mjs
 * checks `correctIndex` is in range — and only for exit tickets. So an item
 * whose distractor equals its key, or whose feedback array is one short of its
 * choices, shipped silently.
 *
 * Two severities, because the defects differ in kind:
 *
 *   FAIL  key-duplicate     a distractor has the SAME VALUE as the key, so two
 *                           options are correct and the item is unanswerable.
 *   FAIL  key-range         correctIndex missing or outside the choice list.
 *   FAIL  feedback-arity    choiceFeedback exists but does not line up 1:1 with
 *                           choices, so a student sees another option's
 *                           correction.
 *   WARN  distractor-twin   two DISTRACTORS share a value. The key is still
 *                           uniquely right, so the item works, but the pair is
 *                           jointly eliminable and wastes a slot.
 *
 * WARN does not fail the build unless --strict is passed. Anything not
 * decidable is skipped, never failed (see scripts/lib/choice-value.mjs).
 *
 * Run:  npm run validate:distractors
 *       npm run validate:distractors -- --report   # list every warning
 *       npm run validate:distractors -- --strict   # warnings fail too
 *       npm run validate:distractors -- --json
 */
import { existsSync, writeFileSync } from "node:fs";
import { listLessonDirs, loadLessonConfig } from "../tools/lib/curriculum-source.mjs";
import { choiceValue, isFormSelection, keyIndexOf } from "./lib/choice-value.mjs";

const args = new Set(process.argv.slice(2));
const REPORT = args.has("--report");
const JSON_OUT = args.has("--json");
const STRICT = args.has("--strict");

/** Walk every node that looks like a multiple-choice item. */
export function validateConfig(config) {
  const failures = [];
  const warnings = [];
  const stats = { items: 0, decided: 0, skippedUndecidable: 0, skippedFormSelection: 0 };

  const visit = (node, path) => {
    if (Array.isArray(node)) {
      node.forEach((n, i) => visit(n, `${path}[${i}]`));
      return;
    }
    if (!node || typeof node !== "object") return;

    if (Array.isArray(node.choices) && node.choices.length > 1) {
      stats.items++;
      checkItem(node, path, failures, warnings, stats);
    }
    for (const k of Object.keys(node)) visit(node[k], `${path}.${k}`);
  };
  visit(config, "");
  return { failures, warnings, stats };
}

function checkItem(node, path, failures, warnings, stats) {
  const choices = node.choices;
  const key = keyIndexOf(node);

  // --- structural checks: decidable regardless of whether values parse -------
  if (key === null) {
    // Not every choices[] node is a scored item (some are picker options).
    // Only demand a key when the node also carries answer-ish siblings.
    if (node.choiceFeedback || node.explanation || node.misconceptionTags)
      failures.push({ rule: "key-range", path, detail: "item has choices but no correctIndex" });
  } else if (key < 0 || key >= choices.length) {
    failures.push({
      rule: "key-range",
      path,
      detail: `correctIndex ${key} outside ${choices.length} choices`,
    });
  }

  if (Array.isArray(node.choiceFeedback) && node.choiceFeedback.length !== choices.length) {
    failures.push({
      rule: "feedback-arity",
      path,
      detail: `${choices.length} choices but ${node.choiceFeedback.length} choiceFeedback entries`,
    });
  }
  if (Array.isArray(node.choicesEs) && node.choicesEs.length !== choices.length) {
    failures.push({
      rule: "feedback-arity",
      path,
      detail: `${choices.length} choices but ${node.choicesEs.length} choicesEs entries`,
    });
  }

  // --- value checks: only when every option is decidable --------------------
  const values = choices.map(choiceValue);
  if (values.some((v) => v === null)) {
    stats.skippedUndecidable++;
    return;
  }
  if (isFormSelection(node)) {
    // "Which shows the prime factorization of 36?" — equal values are intended.
    stats.skippedFormSelection++;
    return;
  }
  if (new Set(values).size === 1) {
    // Every option the same value cannot be a value-discrimination item; it is
    // a form-selection item whose stem this gate did not recognise.
    stats.skippedFormSelection++;
    return;
  }
  stats.decided++;

  for (let i = 0; i < values.length; i++) {
    for (let j = i + 1; j < values.length; j++) {
      if (values[i] !== values[j]) continue;
      const detail = `choice ${i} "${choices[i]}" and choice ${j} "${choices[j]}" are the same value`;
      if (key === i || key === j)
        failures.push({
          rule: "key-duplicate",
          path,
          detail: `${detail} — two options are correct`,
        });
      else warnings.push({ rule: "distractor-twin", path, detail });
    }
  }
}

function main() {
  const failures = [];
  const warnings = [];
  const stats = {
    lessons: 0,
    items: 0,
    decided: 0,
    skippedUndecidable: 0,
    skippedFormSelection: 0,
  };

  // Curriculum content is reached ONLY through tools/lib/curriculum-source.mjs
  // (the multi-tenancy seam); curriculum-source-ratchet.test.mjs fails any new
  // direct lessons/ reader.
  const lessons = listLessonDirs();

  for (const lesson of lessons) {
    let config;
    try {
      config = loadLessonConfig(lesson);
    } catch (err) {
      failures.push({ lesson, path: "config.json", rule: "parse", detail: err.message });
      continue;
    }
    stats.lessons++;
    const r = validateConfig(config);
    for (const k of ["items", "decided", "skippedUndecidable", "skippedFormSelection"])
      stats[k] += r.stats[k];
    for (const f of r.failures) failures.push({ lesson, ...f });
    for (const w of r.warnings) warnings.push({ lesson, ...w });
  }

  if (JSON_OUT) {
    const out = { stats, failures, warnings };
    if (existsSync("reports"))
      writeFileSync("reports/distractor-validation.json", JSON.stringify(out, null, 2));
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.log(`\nDistractor validation — ${stats.lessons} lesson configs`);
    console.log(
      `  MC items ${stats.items}  value-checked ${stats.decided}  ` +
        `FAILED ${failures.length}  warnings ${warnings.length}\n` +
        `  skipped: ${stats.skippedUndecidable} undecidable, ` +
        `${stats.skippedFormSelection} form-selection\n`,
    );
    const group = (rows) => {
      const by = new Map();
      for (const r of rows) {
        if (!by.has(r.lesson)) by.set(r.lesson, []);
        by.get(r.lesson).push(r);
      }
      return [...by].sort();
    };
    for (const [lesson, rows] of group(failures)) {
      console.log(`✗ ${lesson}`);
      for (const f of rows) console.log(`    [${f.rule}] ${f.path}\n      ${f.detail}`);
    }
    if (warnings.length && (REPORT || STRICT)) {
      console.log("\nWarnings (item still answerable — jointly eliminable options):");
      for (const [lesson, rows] of group(warnings)) {
        console.log(`⚠ ${lesson}`);
        for (const w of rows) console.log(`    [${w.rule}] ${w.path}\n      ${w.detail}`);
      }
    } else if (warnings.length) {
      console.log(`⚠ ${warnings.length} warnings — run with --report to list them.`);
    }
    if (!failures.length) console.log("\n✓ No unanswerable multiple-choice items found.");
  }

  process.exit(failures.length || (STRICT && warnings.length) ? 1 : 0);
}

// Importing (the self-test) must not trigger the whole-curriculum sweep.
if (process.argv[1] && /validate-distractors\.mjs$/.test(process.argv[1])) main();
