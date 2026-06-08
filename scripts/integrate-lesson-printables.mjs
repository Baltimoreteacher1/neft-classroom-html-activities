#!/usr/bin/env node
/**
 * integrate-lesson-printables.mjs
 *
 * Wires four families of printable resources onto each lesson card by copying
 * them into lessons/<id>/downloads/printables/ and adding a `printables` array
 * to that lesson's config.json. The lesson renderer (engine/core/app.js,
 * printablesNavHtml + openPrintables) turns that array into a "Printables"
 * sidebar tab with preview + download buttons.
 *
 * Sources (absolute paths on Joel's machine — this is a one-shot import, not a
 * build step, so the source paths live here rather than in repo config):
 *   1. Color by Number      — classroom numbering, PDF + DOCX
 *   2. Vocabulary Word Search — REVEAL numbering, PDF + DOCX
 *   3. MCAP-Style Practice  — REVEAL numbering, DOCX only (Final_Flawless set)
 *   4. Paper Game / Activity — classroom numbering, PDF + DOCX, manifest-driven
 *
 * Word Search + MCAP follow the Reveal/Maryland lesson sequence, which is a
 * DIFFERENT order than the classroom lessons/ folders (the known unit-numbering
 * crossing). They are mapped to classroom lessons by CCSS standard + topic via
 * CLASSROOM_TO_REVEAL below — never by raw lesson number. Lessons with no
 * confident Reveal counterpart simply get no word search / MCAP (reported).
 *
 * Idempotent: clears lessons/<id>/downloads/printables/ and rebuilds it, and
 * replaces (not appends) the config `printables` key each run.
 */
import {
  readdirSync,
  existsSync,
  rmSync,
  mkdirSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
  statSync,
} from "node:fs";
import { resolve, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(fileURLToPath(import.meta.url), "..", "..");
const LESSONS = join(REPO, "lessons");

const SRC = {
  cbn: "/Users/joelneft/Desktop/Lessons Color by Number",
  wordsearch:
    "/Users/joelneft/Desktop/Grade_6_Math_Lesson_Wordsearches_DOCX_PDF",
  mcap: "/Users/joelneft/Desktop/G6_MCAP_Practice_Sheets_CCSS_MCAP_Final_Flawless",
  activities:
    "/Users/joelneft/Library/Application Support/Claude/local-agent-mode-sessions/816c95b6-4b86-4805-8bd7-6d7e41fd062c/55e5804e-fbd7-4fca-817e-58d78b74217b/local_99fb6ba1-3e98-4e72-aa75-8e6a1e959c34/outputs/EduWonderLab lesson activities docx and pdf",
};

// Classroom lessonId -> Reveal "unit-lesson" key, matched by CCSS standard +
// topic (see extraction in the import session). Flagship variants inherit their
// base lesson's mapping. Classroom lessons absent here have no Reveal word
// search / MCAP counterpart by design.
const CLASSROOM_TO_REVEAL = {
  "1-2": "6-7", // GCF/LCM        <- Find Factors and Multiples
  "1-4": "2-6", // Divide Multi-Digit
  "1-7": "2-7", // Divide Decimals
  "2-2": "6-1", // Divide Whole # by Fractions <- Division Expr Frac & Whole
  "2-4": "6-2", // Divide Mixed Numbers        <- Division Expr Frac & Mixed
  "3-1": "3-1", // Understand Ratios
  "3-2": "3-3", // Ratio Tables   <- Equivalent Ratios Using Tables
  "3-3": "3-4", // Graph Ratio Tables <- Equivalent Ratios Using Graphs
  "3-5": "3-5", // Compare Ratios <- Compare Ratio Relationships
  "4-1": "3-2", // Rates and Unit Rates <- Understand Rates and Unit Rates
  "4-2": "4-2", // Relate Fractions, Decimals, Percents
  "4-4": "4-3", // Find the Percent of a Number <- Estimate the Percent
  "4-5": "4-4", // Use Percent to Solve <- Find and Compare with Percentages
  "4-6": "3-6", // Convert Measurement Units <- Convert Within Same System
  "5-1": "5-1", // Area of Parallelograms
  "5-2": "5-3", // Area of Trapezoids
  "5-3": "5-2", // Area of Triangles
  "5-5": "5-4", // Area of Composite Figures <- Apply Area Concepts
  "6-1": "6-3", // Powers and Exponents <- Numerical Expr with Exponents
  "6-2": "6-4", // Evaluate Expressions <- Write/Evaluate Numerical Expr
  "6-3": "6-5", // Write Algebraic Expressions <- Write/Evaluate Algebraic Expr
  "6-5": "6-8", // Distributive Property <- Generate Equivalent Expressions
  "6-6": "6-6", // Equivalent Expressions <- Identify Equivalent Algebraic Expr
  "7-1": "8-1", // Write Equations <- Understand Equations and Their Solutions
  "7-2": "8-2", // Solve One-Step Add/Sub Equations
  "7-3": "8-3", // Solve Mult/Div Equations
  "7-4": "8-4", // Write Inequalities <- Write and Represent Inequalities
  "7-5": "8-5", // Graph Inequalities <- Understand Inequalities & Solutions
  "8-1": "2-1", // Statistical Questions and Data
  "8-2": "2-8", // Mean, Median, Mode <- Describe Data Using the Mean
  "8-3": "2-9", // Mean Absolute Deviation
  "8-4": "2-10", // Appropriate Measures <- Choose Appropriate Measures
  "8-5": "2-4", // Display Data: Box Plots
  "8-6": "2-2", // Display Data: Histograms
  "8-7": "2-5", // Shape of Data Distributions <- Range and IQR (spread)
  "9-1": "7-5", // Graph on Coordinate Plane <- Represent Rational # on Plane
  "9-2": "7-1", // Integers and Absolute Value <- Explore Integers & Opposites
  "9-3": "7-4", // Compare and Order Integers
  "9-4": "7-2", // Rational Numbers on the Number Line
  "9-6": "7-6", // Distance on the Coordinate Plane
  "10-2": "5-5", // Volume of Rectangular Prisms
  "10-3": "5-6", // Surface Area Using Nets <- Represent 3D Figures in 2D
  "10-4": "5-7", // Surface Area of Prisms
  "10-5": "5-8", // Surface Area of Pyramids
};

const baseId = (id) => id.replace(/-flagship$/, "");

// ---- source indexes -------------------------------------------------------

// Recursively collect files under a dir.
function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

// Color by Number: filenames like `1-1_..._color_by_number.pdf` and
// `1-1-flagship_..._color_by_number.pdf`. Index by exact classroom id prefix.
function indexCbn() {
  const idx = {};
  for (const p of walk(SRC.cbn)) {
    const b = basename(p);
    const m = b.match(/^(\d+-\d+(?:-flagship)?)_/);
    if (!m) continue;
    const ext = b.endsWith(".pdf") ? "pdf" : b.endsWith(".docx") ? "docx" : null;
    if (!ext) continue;
    (idx[m[1]] ||= {})[ext] = p;
  }
  return idx;
}

// Word Search: filenames like `Unit_02_Lesson_2_1_Title.pdf`. Index by Reveal
// "unit-lesson" key, capturing a human title from the filename.
function indexWordsearch() {
  const idx = {};
  for (const sub of ["pdf", "docx"]) {
    for (const p of walk(join(SRC.wordsearch, sub))) {
      const b = basename(p);
      const m = b.match(/^Unit_\d+_Lesson_(\d+)_(\d+)_(.+)\.(pdf|docx)$/);
      if (!m) continue;
      const key = `${Number(m[1])}-${Number(m[2])}`;
      const title = m[3].replace(/_/g, " ").trim();
      (idx[key] ||= { title })[m[4]] = p;
    }
  }
  return idx;
}

// MCAP: filenames like `Lesson_2_1_MCAP_Practice.docx` (DOCX only). Index by
// Reveal "unit-lesson" key.
function indexMcap() {
  const idx = {};
  for (const p of walk(SRC.mcap)) {
    const b = basename(p);
    const m = b.match(/^Lesson_(\d+)_(\d+)_MCAP_Practice\.docx$/);
    if (!m) continue;
    idx[`${Number(m[1])}-${Number(m[2])}`] = { docx: p };
  }
  return idx;
}

// Paper activities: manifest-driven, classroom numbering. Index by classroom id.
function indexActivities() {
  const manifestPath = join(SRC.activities, "activities-manifest.json");
  const idx = {};
  if (!existsSync(manifestPath)) return idx;
  const { activities } = JSON.parse(readFileSync(manifestPath, "utf8"));
  for (const a of activities) {
    const id = a.flagship ? `${a.lessonNumber}-flagship` : a.lessonNumber;
    const strip = (rel) =>
      rel ? join(SRC.activities, rel.replace(/^printables\/reveal-math\//, "")) : null;
    idx[id] = {
      title: a.activityTitle,
      type: a.activityType,
      desc: a.shortCardDescription,
      standard: a.standard,
      pdf: strip(a.pdfPath),
      docx: strip(a.docxPath),
    };
  }
  return idx;
}

// ---- main -----------------------------------------------------------------

const cbn = indexCbn();
const ws = indexWordsearch();
const mcap = indexMcap();
const acts = indexActivities();

const lessonIds = readdirSync(LESSONS, { withFileTypes: true })
  .filter((e) => e.isDirectory() && /^\d+-\d+(-flagship)?$/.test(e.name))
  .map((e) => e.name)
  .sort();

const report = [];
let fileCount = 0;

for (const id of lessonIds) {
  const cfgPath = join(LESSONS, id, "config.json");
  if (!existsSync(cfgPath)) continue;
  const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
  const title = cfg.title || id;

  const outDir = join(LESSONS, id, "downloads", "printables");
  rmSync(outDir, { recursive: true, force: true });

  const printables = [];
  const place = (slug, srcPaths) => {
    const urls = {};
    for (const ext of ["pdf", "docx"]) {
      const src = srcPaths[ext];
      if (!src || !existsSync(src)) continue;
      mkdirSync(outDir, { recursive: true });
      const fname = `${id}-${slug}.${ext}`;
      copyFileSync(src, join(outDir, fname));
      urls[ext] = `/lessons/${id}/downloads/printables/${fname}`;
      fileCount++;
    }
    return urls;
  };

  // 1. Paper game / activity
  const a = acts[id];
  if (a && (a.pdf || a.docx)) {
    const u = place("activity", { pdf: a.pdf, docx: a.docx });
    if (u.pdf || u.docx)
      printables.push({
        kind: "activity",
        name: a.title || "Paper Activity",
        emoji: "🎲",
        type: a.type,
        desc: a.desc,
        standard: a.standard,
        ...u,
      });
  }

  // 2. Color by Number
  const c = cbn[id];
  if (c && (c.pdf || c.docx)) {
    const u = place("color-by-number", c);
    if (u.pdf || u.docx)
      printables.push({
        kind: "color-by-number",
        name: `${title} — Color by Number`,
        emoji: "🎨",
        desc: "Solve each problem, then color by the answer to reveal a picture.",
        ...u,
      });
  }

  // 3 + 4. Word Search and MCAP (Reveal-mapped via base lesson topic)
  const revKey = CLASSROOM_TO_REVEAL[baseId(id)];
  if (revKey) {
    const w = ws[revKey];
    if (w && (w.pdf || w.docx)) {
      const u = place("word-search", w);
      if (u.pdf || u.docx)
        printables.push({
          kind: "word-search",
          name: `${title} — Vocabulary Word Search`,
          emoji: "🔎",
          desc: "Find this lesson's key vocabulary terms in the puzzle.",
          ...u,
        });
    }
    const m = mcap[revKey];
    if (m && m.docx) {
      const u = place("mcap-practice", m);
      if (u.docx)
        printables.push({
          kind: "mcap",
          name: `${title} — MCAP-Style Practice`,
          emoji: "📝",
          desc: "MCAP-style selected- and constructed-response practice items.",
          standard: cfg.standard,
          ...u,
        });
    }
  }

  if (printables.length) cfg.printables = printables;
  else delete cfg.printables;
  writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + "\n");

  report.push({
    id,
    activity: !!printables.find((p) => p.kind === "activity"),
    cbn: !!printables.find((p) => p.kind === "color-by-number"),
    ws: !!printables.find((p) => p.kind === "word-search"),
    mcap: !!printables.find((p) => p.kind === "mcap"),
    n: printables.length,
  });
}

// ---- report ---------------------------------------------------------------
const tick = (b) => (b ? "✓" : "·");
console.log("\nlesson        act cbn  ws mcap   total");
console.log("---------------------------------------");
for (const r of report)
  console.log(
    `${r.id.padEnd(14)} ${tick(r.activity)}   ${tick(r.cbn)}   ${tick(r.ws)}  ${tick(r.mcap)}     ${r.n}`,
  );
const sum = (k) => report.filter((r) => r[k]).length;
console.log("---------------------------------------");
console.log(
  `${report.length} lessons | activity ${sum("activity")} | cbn ${sum("cbn")} | wordsearch ${sum("ws")} | mcap ${sum("mcap")} | ${fileCount} files copied`,
);
const noWs = report.filter((r) => !r.ws).map((r) => r.id);
console.log(`\nLessons with no Reveal word search/MCAP (${noWs.length}): ${noWs.join(", ")}`);
