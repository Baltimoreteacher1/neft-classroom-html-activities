#!/usr/bin/env node
/**
 * Practice Studio coverage matrix: what every lesson's Practice and Challenge studio actually asks of a student, read from
 * the BUILT pages (the #studio-data each page ships), not from the authoring files, so it reports what students get.
 *
 *   node tools/report-practice-studio-coverage.mjs            writes docs/audits/practice-studio/coverage-matrix.{md,json}
 *   node tools/report-practice-studio-coverage.mjs --check    fails if the committed matrix is stale
 *
 * Per lesson and version: standard, objective, the five stages (required or optional, item count), item kinds, the
 * fresh-number generators (skills), the hands-on manipulatives, the lab model, named misconceptions, and how much of the
 * page carries Spanish, a hint ladder and choice-specific feedback. Unit 4's hand-built studios keep their tasks in page
 * script; their rows carry the stage names and lab bench, and the browser ledger counts their items.
 * Report only: it prints gaps (no manipulative in a version, Spanish or hint coverage under 90%) but never fails on them.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const OUT = "docs/audits/practice-studio";
const read = (/** @type {string} */ rel) => readFileSync(join(REPO_ROOT, rel), "utf8");
const UNIT4 = [
  ["4-1", "percent-practice-studio", "percent-practice-studio-challenging"],
  ["4-2", "4-2-practice-studio", "4-2-practice-studio-challenging"],
  ["4-3", "4-3-practice-studio", "4-3-practice-studio-challenging"],
  ["4-4", "4-4-practice-studio", "4-4-practice-studio-challenging"],
  ["4-5", "4-5-practice-studio", "4-5-practice-studio-challenging"],
];
const byId = (/** @type {string} */ a, /** @type {string} */ b) =>
  a.localeCompare(b, undefined, { numeric: true });

/** The lesson ids with a generated studio, in curriculum order. */
function generatedLessons() {
  const html = read("math/practice-studio/index.html");
  const ids = new Set([...html.matchAll(/\/math\/practice-studio\/(\d+-\d+)\//g)].map((m) => m[1]));
  return [...ids]
    .filter((id) => existsSync(join(REPO_ROOT, `math/practice-studio/${id}/index.html`)))
    .sort(byId);
}

function studioData(/** @type {string} */ rel) {
  const m = read(rel).match(/id="studio-data">([\s\S]*?)<\/script>/);
  if (!m) throw new Error(`${rel}: no #studio-data`);
  return JSON.parse(m[1]);
}

const pct = (/** @type {number} */ n, /** @type {number} */ d) =>
  d ? Math.round((100 * n) / d) : 100;

/** One generated page -> one matrix row. */
function rowFor(/** @type {string} */ id, /** @type {"practice"|"challenge"} */ mode) {
  const rel = `math/practice-studio/${id}/${mode === "challenge" ? "challenge/" : ""}index.html`;
  const d = studioData(rel);
  const cfg = JSON.parse(read(`lessons/${id}/config.json`));
  const kinds = /** @type {Record<string, number>} */ ({});
  const gens = new Set();
  const acts = new Set();
  const tags = new Set();
  let written = 0;
  let es = 0;
  let hinted = 0;
  let mc = 0;
  let mcFeedback = 0;
  let lab = "";
  for (const s of d.sections)
    for (const it of [...s.items, ...(s.pool || [])]) {
      kinds[it.k] = (kinds[it.k] || 0) + 1;
      if (it.k === "gen") gens.add(it.g);
      if (it.k === "act") acts.add(it.kind);
      if (it.k === "lab" && it.model?.kind)
        lab = `${it.model.kind}${it.model.mode ? `:${it.model.mode}` : ""}`;
      for (const t of Array.isArray(it.tag) ? it.tag : []) if (t) tags.add(t);
      // authored (non-generated) items: generators and activities carry their own Spanish and hints, proved by their tests
      if (["mc", "num", "err", "tbl", "wr", "sort", "match", "nline"].includes(it.k)) {
        written++;
        if (it.qEs || it.tEs || it.pEs) es++;
        if (Array.isArray(it.h) && it.h.length >= 2) hinted++;
        if (it.k === "mc") {
          mc++;
          if (Array.isArray(it.f) && it.f.filter(Boolean).length >= it.c.length - 1) mcFeedback++;
        }
      }
    }
  return {
    id,
    unit: Number(id.split("-")[0]),
    mode,
    title: cfg.title,
    standard: cfg.standard,
    objective: d.concept?.objective || cfg.contentObjective || "",
    stages: d.sections.map((/** @type {any} */ s) => ({
      name: s.name,
      optional: !!s.optional,
      items: s.items.length,
      pool: (s.pool || []).length,
    })),
    required: d.sections
      .filter((/** @type {any} */ s) => !s.optional)
      .reduce((a, s) => a + s.items.length, 0),
    kinds,
    generators: [...gens].sort(),
    manipulatives: [...acts].sort(),
    lab,
    misconceptions: tags.size,
    spanish: pct(es, written),
    hints: pct(hinted, written),
    choiceFeedback: pct(mcFeedback, mc),
  };
}

/** A hand-built Unit 4 page: stage names from the markup, the lab bench from its data file. */
function unit4Row(
  /** @type {string} */ id,
  /** @type {string} */ slug,
  /** @type {"practice"|"challenge"} */ mode,
) {
  const html = read(`math/unit-4/${slug}/index.html`);
  const cfg = JSON.parse(read(`lessons/${id}/config.json`));
  const names = [...html.matchAll(/<span class="tab-name">([^<]*)/g)].map((m) =>
    m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"),
  );
  const bench = existsSync(join(REPO_ROOT, `data/practice-studio-u4/${id}.json`))
    ? JSON.parse(read(`data/practice-studio-u4/${id}.json`)).bench
    : null;
  return {
    id,
    unit: 4,
    mode,
    title: cfg.title,
    standard: cfg.standard,
    objective: cfg.contentObjective || "",
    stages: names.map((n) => ({ name: n, optional: false, items: null, pool: 0 })),
    required: null,
    kinds: { "hand-built": 1 },
    generators: [],
    manipulatives: ["percent grid and tape (hand-built)"],
    lab: bench?.model?.kind
      ? `${bench.model.kind}${bench.model.mode ? `:${bench.model.mode}` : ""}`
      : "",
    misconceptions: null,
    spanish: null,
    hints: null,
    choiceFeedback: null,
    url: `/math/unit-4/${slug}/`,
  };
}

function build() {
  const rows = [];
  for (const id of generatedLessons())
    for (const mode of /** @type {const} */ (["practice", "challenge"]))
      rows.push(rowFor(id, mode));
  for (const [id, p, c] of UNIT4)
    rows.push(unit4Row(id, p, "practice"), unit4Row(id, c, "challenge"));
  rows.sort((a, b) => byId(a.id, b.id) || a.mode.localeCompare(b.mode) * -1);
  const gaps = [];
  for (const r of rows) {
    if (r.unit !== 4 && !r.manipulatives.length)
      gaps.push(`${r.id} ${r.mode}: no hands-on manipulative`);
    if (r.spanish !== null && r.spanish < 90)
      gaps.push(`${r.id} ${r.mode}: Spanish on ${r.spanish}% of written items`);
    if (r.hints !== null && r.hints < 90)
      gaps.push(`${r.id} ${r.mode}: hint ladder on ${r.hints}% of written items`);
    if (r.choiceFeedback !== null && r.choiceFeedback < 90)
      gaps.push(
        `${r.id} ${r.mode}: choice-specific feedback on ${r.choiceFeedback}% of multiple-choice items`,
      );
  }
  return { rows, gaps };
}

const cell = (/** @type {any} */ v) =>
  (v === null || v === undefined || v === "" ? "—" : String(v)).replace(/\|/g, "/");
function markdown(/** @type {{rows: any[], gaps: string[]}} */ { rows, gaps }) {
  const lessons = new Set(rows.map((r) => r.id)).size;
  const L = [
    "# Practice Studio coverage matrix",
    "",
    "Generated by `node tools/report-practice-studio-coverage.mjs` from the built pages. Do not edit by hand.",
    "",
    `${lessons} lessons × 2 versions = ${rows.length} studios (Units 2, 3, 5–9 generated; Unit 4 hand-built). Unit 1 and Unit 10 have no studio.`,
    "",
    "Columns: **Req** = items in required stages; **Stages** = items per stage (`o` marks the optional stage); **Skills** = fresh-number generators; **Manipulatives** = hands-on activities; **ES / Hints / Fb** = share of authored items with Spanish, a 2–3 step hint ladder, and feedback for each wrong choice (multiple choice).",
    "",
    "| Lesson | Ver | Standard | Title | Req | Stages | Skills | Manipulatives | Lab model | Misconceptions | ES | Hints | Fb |",
    "|---|---|---|---|---|---|---|---|---|---|---|---|---|",
  ];
  for (const r of rows)
    L.push(
      `| ${r.id} | ${r.mode === "practice" ? "P" : "C"} | ${cell(r.standard)} | ${cell(r.title)} | ${cell(r.required)} | ${r.stages.map((/** @type {any} */ s) => (s.items === null ? "·" : `${s.items}${s.optional ? "o" : ""}`)).join(" / ")} | ${cell(r.generators.join(", "))} | ${cell(r.manipulatives.join(", "))} | ${cell(r.lab)} | ${cell(r.misconceptions)} | ${r.spanish === null ? "—" : `${r.spanish}%`} | ${r.hints === null ? "—" : `${r.hints}%`} | ${r.choiceFeedback === null ? "—" : `${r.choiceFeedback}%`} |`,
    );
  L.push("", "## Stage names", "");
  const names = new Map();
  for (const r of rows) {
    const k = `${r.unit === 4 ? "Unit 4 " : ""}${r.mode}`;
    if (!names.has(k)) names.set(k, new Set());
    names.get(k).add(r.stages.map((/** @type {any} */ s) => s.name).join(" → "));
  }
  for (const [k, v] of names)
    L.push(
      `- **${k}**: ${[...v].slice(0, 3).join(" · ")}${v.size > 3 ? ` (+${v.size - 3} more)` : ""}`,
    );
  L.push(
    "",
    "## Gaps",
    "",
    gaps.length ? gaps.map((g) => `- ${g}`).join("\n") : "None at the thresholds above.",
    "",
  );
  return L.join("\n");
}

const result = build();
const md = markdown(result);
const json = `${JSON.stringify(result, null, 1)}\n`;
if (process.argv.includes("--check")) {
  const stale = [
    [`${OUT}/coverage-matrix.md`, md],
    [`${OUT}/coverage-matrix.json`, json],
  ].filter(([f, body]) => !existsSync(join(REPO_ROOT, f)) || read(f) !== body);
  if (stale.length) {
    console.error(
      `stale: ${stale.map(([f]) => f).join(", ")}; run node tools/report-practice-studio-coverage.mjs`,
    );
    process.exit(1);
  }
  console.log("practice-studio coverage matrix is current.");
} else {
  mkdirSync(join(REPO_ROOT, OUT), { recursive: true });
  writeFileSync(join(REPO_ROOT, OUT, "coverage-matrix.md"), md);
  writeFileSync(join(REPO_ROOT, OUT, "coverage-matrix.json"), json);
  console.log(
    `coverage matrix: ${result.rows.length} studios, ${result.gaps.length} gap(s) -> ${OUT}/coverage-matrix.md`,
  );
}
