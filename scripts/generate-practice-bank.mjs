#!/usr/bin/env node
// ── Public practice bank export ─────────────────────────────────────────────
// Writes the item bank consumed by the Math Ready site (separate repo,
// ~/math-ready). Lesson configs stay the single source of truth: every item in
// the bank exists because a core lesson authored it. Nothing is invented.
//
//   node scripts/generate-practice-bank.mjs --out <path>           write
//   node scripts/generate-practice-bank.mjs --out <path> --check   verify fresh
//
// Exported types: ebsr, multi-select, written-error (from mstarPractice);
// multiple-choice, find-error, open-response (from practice tiers). Widget
// types (number-line, fill-table, drag-sort, …) are deferred until the site
// has renderers for them. Spanish fields are stripped.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { listLessonDirs, loadLessonConfig } from "../tools/lib/curriculum-source.mjs";
import { HONESTY, itemProblems, lessonMstarItems } from "./lib/mstar-items.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const SCHEMA = 1;
export const FOUNDATIONS = "FOUND";
const CORE_LESSON_RE = /^\d+-\d+$/;
const PRACTICE_TIERS = ["approaching", "onLevel", "extending"];

function fail(msg) {
  throw new Error(`generate-practice-bank: ${msg}`);
}
const clean = (s) => (typeof s === "string" ? s.trim() : "");
const strings = (arr) => (Array.isArray(arr) ? arr.map(clean) : []);
const inRange = (i, len) => Number.isInteger(i) && i >= 0 && i < len;

/** "6.AT.A.3.a" (crosswalk form) -> "6.AT.3a" (lesson-config form). */
export function normalizeCode(id) {
  const m = /^(\d\.[A-Z]+)\.[A-Z]\.(\d+)(?:\.([a-z]))?$/.exec(id);
  return m ? `${m[1]}.${m[2]}${m[3] || ""}` : id;
}

export function domainOf(code) {
  const m = /^6\.([A-Z]+)\./.exec(code);
  return m ? m[1] : FOUNDATIONS;
}

function loadStandards() {
  const x = JSON.parse(readFileSync(join(ROOT, "data/standards-crosswalk-2025.json"), "utf8"));
  const domains = { ...x.domains, [FOUNDATIONS]: "Foundations and Math Practices" };
  const labels = new Map();
  for (const e of x.entries) {
    const code = normalizeCode(e.newId);
    if (!labels.has(code)) labels.set(code, clean(e.oldLabel));
  }
  return { domains, labels };
}

function unitTitles() {
  const ranges = JSON.parse(readFileSync(join(ROOT, "data/pacing-unit-ranges.json"), "utf8"));
  const names = {};
  for (const u of ranges.units) {
    if (!u.curriculumUnit || names[u.curriculumUnit]) continue;
    const label = String(u.districtLabel || "").replace(/^[^:]*:\s*/, "");
    names[u.curriculumUnit] = label || `Unit ${u.curriculumUnit}`;
  }
  return names;
}

/* ── item normalizers ─────────────────────────────────────────────────────── */

function ebsrPart(p) {
  return {
    stem: clean(p.stem),
    choices: strings(p.choices),
    correctIndex: p.correctIndex,
    explanation: clean(p.explanation),
    choiceFeedback: strings(p.choiceFeedback),
  };
}

function fromMstar(item, ctx, n) {
  const where = `${ctx.lessonId} mstarPractice[${n}]`;
  const problem = itemProblems(item, where);
  if (problem) fail(problem);
  const standard = clean(item.standard) || ctx.standard;
  const base = { id: `${ctx.lessonId}:mstar:${n}`, lesson: ctx.lessonId, tier: "mstar", standard };
  if (item.type === "ebsr") {
    return { ...base, type: "ebsr", partA: ebsrPart(item.partA), partB: ebsrPart(item.partB) };
  }
  if (item.type === "multi-select") {
    return {
      ...base,
      type: "multi-select",
      stem: clean(item.stem),
      options: strings(item.options),
      correctIndices: [...new Set(item.correctIndices)].sort((a, b) => a - b),
      explanation: clean(item.explanation),
    };
  }
  const rubric = item.rubric || {};
  return {
    ...base,
    type: "written-error",
    title: clean(item.title) || "Explain the mistake",
    scenario: clean(item.scenario),
    prompt: clean(item.prompt),
    modelAnswer: clean(item.correctAnswer),
    rubric: {
      score2: clean(rubric.score2),
      score1: clean(rubric.score1),
      score0: clean(rubric.score0),
    },
  };
}

function fromMultipleChoice(item, base, where) {
  const stem = clean(item.stem);
  const choices = strings(item.choices);
  if (!stem || choices.length < 2) fail(`${where}: multiple-choice missing stem/choices`);
  if (!inRange(item.correctIndex, choices.length)) fail(`${where}: correctIndex out of range`);
  return {
    ...base,
    type: "multiple-choice",
    stem,
    choices,
    correctIndex: item.correctIndex,
    explanation: clean(item.explanation),
    choiceFeedback: strings(item.choiceFeedback),
    hints: strings(item.hints),
  };
}

function fromFindError(item, base, where) {
  const steps = Array.isArray(item.workedExample)
    ? item.workedExample.map((s) => ({ label: clean(s.label), work: clean(s.work) }))
    : [];
  if (steps.length < 2) fail(`${where}: error-analysis needs ≥2 worked steps`);
  if (!inRange(item.errorStep, steps.length)) fail(`${where}: errorStep out of range`);
  const correctWork = clean(item.correctWork);
  if (!correctWork) fail(`${where}: error-analysis missing correctWork`);
  return {
    ...base,
    type: "find-error",
    title: clean(item.title) || "Find the mistake",
    steps,
    errorStep: item.errorStep,
    correctWork,
    explanation: clean(item.explanation),
    hints: strings(item.hints),
  };
}

function fromOpenResponse(item, base, where) {
  const stem = clean(item.stem || item.prompt);
  if (!stem) fail(`${where}: open-response missing stem`);
  const modelAnswer = clean(item.modelAnswer || item.sampleAnswer || item.explanation);
  if (!modelAnswer) return null; // nothing for the student to check against
  const stems = Array.isArray(item.sentenceStems)
    ? strings(item.sentenceStems)
    : item.sentenceFrame
      ? [clean(item.sentenceFrame)]
      : [];
  return {
    ...base,
    type: "open-response",
    stem,
    modelAnswer,
    sentenceStems: stems,
    keywords: strings(item.keywords),
    hints: strings(item.hints),
  };
}

function fromPractice(item, ctx, tier, n) {
  const where = `${ctx.lessonId} practice.${tier}[${n}]`;
  const base = {
    id: `${ctx.lessonId}:${tier}:${n}`,
    lesson: ctx.lessonId,
    tier,
    standard: ctx.standard,
  };
  switch (item?.type) {
    case "multiple-choice":
      return fromMultipleChoice(item, base, where);
    case "error-analysis":
      return fromFindError(item, base, where);
    case "open-response":
      return fromOpenResponse(item, base, where);
    default:
      return undefined; // widget type — deferred
  }
}

/* ── assembly ─────────────────────────────────────────────────────────────── */

function lessonSort(a, b) {
  const [au, al] = a.split("-").map(Number);
  const [bu, bl] = b.split("-").map(Number);
  return au - bu || al - bl;
}

function stemKey(item) {
  const text =
    item.type === "ebsr" ? item.partA.stem : item.stem || item.scenario || item.steps?.[0]?.work;
  return `${item.type}|${String(text).toLowerCase().replace(/\s+/g, " ")}`;
}

export function buildBank() {
  const { domains, labels } = loadStandards();
  const units = unitTitles();
  const lessons = {};
  const items = [];
  const seen = new Set();
  const skipped = { widget: 0, duplicate: 0, noModel: 0 };

  const dirs = listLessonDirs({ filter: CORE_LESSON_RE }).sort(lessonSort);
  for (const dir of dirs) {
    const cfg = loadLessonConfig(dir);
    const ctx = { lessonId: dir, standard: clean(cfg.standard) };
    if (!ctx.standard) fail(`${dir}: lesson config has no standard`);
    lessons[dir] = {
      unit: cfg.unit,
      lesson: cfg.lesson,
      title: clean(cfg.title),
      unitTitle: units[cfg.unit] || `Unit ${cfg.unit}`,
      standard: ctx.standard,
    };
    const push = (it) => {
      if (it === undefined) return skipped.widget++;
      if (it === null) return skipped.noModel++;
      const key = stemKey(it);
      if (seen.has(key)) return skipped.duplicate++;
      seen.add(key);
      items.push(it);
    };
    (lessonMstarItems(cfg) || []).forEach((it, n) => push(fromMstar(it, ctx, n)));
    for (const tier of PRACTICE_TIERS) {
      const arr = cfg.practice?.[tier];
      if (Array.isArray(arr)) arr.forEach((it, n) => push(fromPractice(it, ctx, tier, n)));
    }
  }
  if (!items.length) fail("no items exported");

  const standards = {};
  for (const it of items) {
    if (standards[it.standard]) continue;
    const domain = domainOf(it.standard);
    if (!domains[domain]) fail(`${it.id}: unknown domain for ${it.standard}`);
    standards[it.standard] = { domain, label: labels.get(it.standard) || lessons[it.lesson].title };
  }
  const sortedStandards = Object.fromEntries(
    Object.keys(standards)
      .sort()
      .map((k) => [k, standards[k]]),
  );

  const counts = { items: items.length, byType: {}, byTier: {}, byDomain: {}, skipped };
  for (const it of items) {
    counts.byType[it.type] = (counts.byType[it.type] || 0) + 1;
    counts.byTier[it.tier] = (counts.byTier[it.tier] || 0) + 1;
    const d = standards[it.standard].domain;
    counts.byDomain[d] = (counts.byDomain[d] || 0) + 1;
  }
  return {
    schema: SCHEMA,
    product: "Math Ready",
    grade: 6,
    disclaimer: HONESTY,
    domains,
    standards: sortedStandards,
    lessons,
    items,
    counts,
  };
}

export function serializeBank(bank) {
  return `${JSON.stringify(bank, null, 1)}\n`;
}

function main() {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf("--out");
  const out = outIdx >= 0 ? args[outIdx + 1] : null;
  const check = args.includes("--check");
  if (!out) {
    console.error("usage: generate-practice-bank.mjs --out <path> [--check]");
    process.exit(2);
  }
  const text = serializeBank(buildBank());
  const outPath = resolve(out);
  if (check) {
    const current = existsSync(outPath) ? readFileSync(outPath, "utf8") : null;
    if (current !== text) {
      console.error(
        `practice bank STALE: ${outPath} differs from lesson configs — rerun without --check`,
      );
      process.exit(1);
    }
    console.log(`practice bank fresh: ${outPath}`);
    return;
  }
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, text);
  const bank = JSON.parse(text);
  console.log(`wrote ${outPath}`);
  console.log(JSON.stringify(bank.counts));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
