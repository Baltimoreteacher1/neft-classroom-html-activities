#!/usr/bin/env node
/**
 * Seeded, stratified editorial sample for Vocabulary Academy (docs/vocab-academy/content-qa.md section 3).
 *
 *   node tools/vocab-academy-editorial-sample.mjs                 write the review sheet + sample.json
 *   node tools/vocab-academy-editorial-sample.mjs --report        also print per-grade totals as JSON
 *   --seed <text>   draw seed (default "va-2026-11")     --out <dir>   output folder
 *
 * Output (default /private/tmp/claude-501/va-editorial/): review-sheet.md, sample.json, report.json.
 * The sample is a way to FIND defects and measure them, never a way to declare the rest correct:
 * units outside it stay "auto-checked". The draw is reproducible from the seed.
 *
 * Always in the full-review sample: unit 1 of every grade; every unit with a non-empty needsReview;
 * every informational/science/history/biography passage; every morphology-strand unit; the reference
 * unit when present. The rest is drawn with the seed up to the band target (K-2 30% min 4, 3-8 25% min 5).
 * Every unit not fully reviewed gets a 2-3 word spot check.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SHIPPED_GRADES } from "../access-practice-lab/src/vocab-academy/contract.js";
import { rngFor } from "../access-practice-lab/src/vocab-academy/rng.js";
import { corpusStats } from "./lib/vocab-academy-run.mjs";
import { loadCorpus } from "./lib/vocab-academy-scope.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FACT_GENRES = new Set(["informational", "science", "history", "biography"]);

/** Full-review target for a grade with `n` units: 30% (K-2, min 4), 25% (3-8, min 5), rounded up. */
export const sampleTarget = (g, n) => {
  const early = ["K", "1", "2"].includes(g);
  return Math.min(n, Math.max(early ? 4 : 5, Math.ceil(n * (early ? 0.3 : 0.25))));
};

/** Why a unit is always sampled, or [] when it is only eligible for the random draw. */
export function mandatoryReasons(d) {
  const r = [];
  if (d.n === 1) r.push("unit 1 of the grade");
  if ((d.editorial?.needsReview ?? []).length) r.push("non-empty editorial.needsReview");
  if (FACT_GENRES.has(d.passage?.genre)) r.push(`${d.passage.genre} passage (fact claims)`);
  if (d.strand === "morphology") r.push("morphology strand (word-part claims)");
  return r;
}

/**
 * Pure: units = [{ g, data }] -> { grades: { G: { units, target, full:[{id, why[]}], spot:[{id, words:[hw]}] } } }.
 * Deterministic for a given seed and corpus.
 */
export function drawSample(units, seed) {
  const grades = {};
  for (const g of SHIPPED_GRADES) {
    const mine = units
      .filter((u) => u.g === g && u.data)
      .map((u) => u.data)
      .sort((a, b) => a.n - b.n);
    if (!mine.length) continue;
    const rng = rngFor(`${seed}:${g}`);
    const target = sampleTarget(g, mine.length);
    const full = new Map();
    for (const d of mine) {
      const why = mandatoryReasons(d);
      if (why.length) full.set(d.id, why);
    }
    const rest = rng.shuffle(mine.filter((d) => !full.has(d.id)));
    for (const d of rest) {
      if (full.size >= target) break;
      full.set(d.id, ["random draw"]);
    }
    const spotN = ["K", "1", "2"].includes(g) ? 2 : 3;
    const spot = mine
      .filter((d) => !full.has(d.id))
      .map((d) => ({
        id: d.id,
        words: rng
          .shuffle(d.words ?? [])
          .slice(0, spotN)
          .map((w) => w.hw),
      }));
    grades[g] = {
      units: mine.length,
      target,
      full: mine.filter((d) => full.has(d.id)).map((d) => ({ id: d.id, why: full.get(d.id) })),
      spot,
    };
  }
  return { seed, grades };
}

function unitSheet(d, why) {
  let s = `\n### ${d.id} - ${d.title}  (${d.strand}, ${d.passage?.genre ?? "no passage"})\nSampled because: ${why.join("; ")}\n\n`;
  s += "Needs review (author's doubts):\n";
  for (const x of d.editorial?.needsReview ?? []) s += `- [ ] ${x}\n`;
  if (!(d.editorial?.needsReview ?? []).length) s += "- none listed\n";
  s +=
    "\n| word | def | ex | cloze (key) | misuse | morph | es | checked |\n|---|---|---|---|---|---|---|---|\n";
  const cell = (x) =>
    String(x ?? "")
      .replace(/\|/g, "/")
      .replace(/\n/g, " ");
  for (const w of d.words ?? [])
    s += `| ${cell(`${w.hw} (${w.pos})`)} | ${cell(w.def)} | ${cell(w.ex)} / ${cell(w.ex2)} | ${cell(w.cloze?.s)} (${cell(w.cloze?.f)}) / ${cell(w.cloze2?.s)} | ${cell(w.misuse?.s)} | ${cell((w.morph?.segs ?? []).map((x) => `${x.s}=${x.m}`).join(" + "))} | ${cell(w.es?.gloss)} | [ ] |\n`;
  const p = d.passage;
  if (p) {
    s += `\n**Passage "${p.title}"**\n\n${(p.paras ?? []).map((x) => `> ${x}`).join("\n>\n")}\n\n`;
    for (const q of p.qs ?? [])
      s += `- [ ] ${q.q}  ${(q.choices ?? []).map((c, i) => `${"ABCD"[i]}${i === q.a ? "*" : ""}. ${c}`).join("  ")}  (why: ${q.why})\n`;
  }
  s +=
    "\nChecklist: definition accuracy, sense boundaries, example grammar and sense, etymology/morphology, passage facts, key defensibility, distractor plausibility, grade fit.\n";
  return s;
}

/** The sheet text for a drawn sample (pure). */
export function renderSheet(sample, units, stats) {
  const byId = new Map(units.filter((u) => u.data).map((u) => [u.data.id, u.data]));
  let s = `# Vocabulary Academy - editorial review sheet\n\nSeed: \`${sample.seed}\`. Status of every unit here is **auto-checked**; this sheet exists so a person can change that for the fields they actually read (content-qa.md).\n\n`;
  s += `Written so far: ${stats.total.units} units, ${stats.total.words} words, ${stats.total.passages} passages, ${stats.total.questions} questions.\n`;
  for (const [g, gs] of Object.entries(sample.grades)) {
    s += `\n## Grade ${g}: ${gs.units} units written, full-review target ${gs.target}, drawn ${gs.full.length}\n`;
    for (const f of gs.full) s += unitSheet(byId.get(f.id), f.why);
    if (gs.spot.length) {
      s += `\n### Spot checks (grade ${g})\n`;
      for (const sp of gs.spot) {
        const d = byId.get(sp.id);
        s += `\n- **${sp.id}** ${d.title}: read ${sp.words.join(", ")} plus the passage${["K", "1", "2"].includes(g) ? "" : " facts and all keys"}.\n`;
      }
    }
  }
  return s;
}

export function buildReport(corpus, sample) {
  const stats = corpusStats(corpus);
  const flagged = {};
  for (const u of corpus.units)
    if (u.data && (u.data.editorial?.needsReview ?? []).length)
      flagged[u.g] = (flagged[u.g] ?? 0) + 1;
  const grades = {};
  for (const g of SHIPPED_GRADES) {
    const p = stats.per[g];
    grades[g] = {
      units: p.units,
      plannedUnits: p.planUnits,
      words: p.words,
      plannedWords: p.planWords,
      passages: p.passages,
      questions: p.questions,
      unitsFlaggedNeedsReview: flagged[g] ?? 0,
      fullReviewTarget: sample.grades[g]?.target ?? 0,
      fullReviewDrawn: sample.grades[g]?.full.length ?? 0,
    };
  }
  const total = { units: 0, words: 0, passages: 0, questions: 0, unitsFlaggedNeedsReview: 0 };
  for (const g of SHIPPED_GRADES) for (const k of Object.keys(total)) total[k] += grades[g][k];
  return {
    seed: sample.seed,
    status: "every unit is auto-checked; none is human-reviewed",
    grades,
    total,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const a = process.argv.slice(2);
  const opt = (n, d) => (a.includes(n) ? a[a.indexOf(n) + 1] : d);
  const seed = opt("--seed", "va-2026-11");
  const outDir = opt("--out", "/private/tmp/claude-501/va-editorial");
  const corpus = loadCorpus(opt("--root", ROOT));
  const units = corpus.units.filter((u) => u.data && SHIPPED_GRADES.includes(u.g));
  if (!units.length && !corpus.grades.size) {
    console.error(
      "vocab-academy-editorial-sample: found no grade or unit files; nothing to sample.",
    );
    process.exit(1);
  }
  const sample = drawSample(units, seed);
  const stats = corpusStats(corpus);
  const report = buildReport(corpus, sample);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "review-sheet.md"), renderSheet(sample, units, stats));
  writeFileSync(join(outDir, "sample.json"), `${JSON.stringify(sample, null, 1)}\n`);
  writeFileSync(join(outDir, "report.json"), `${JSON.stringify(report, null, 1)}\n`);
  if (a.includes("--report")) console.log(JSON.stringify(report, null, 1));
  else
    console.log(
      `vocab-academy-editorial-sample: ${units.length} units sampled from; sheet at ${join(outDir, "review-sheet.md")}`,
    );
}
