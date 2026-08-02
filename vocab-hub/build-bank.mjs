#!/usr/bin/env node
/**
 * Neft Teacher - Vocabulary Study Hub bank builder.
 *
 * READ-ONLY over lessons/<id>/config.json (skips _template and any non-config
 * directory). Emits vocab-hub/vocab-bank.json with every vocabulary item across
 * all lessons, de-duplicated by term.
 *
 * Image paths mirror engine/core/vocab-images.js resolveVocabImage(): a
 * dedicated slug SVG when one exists, else a synonym SVG, else a category
 * fallback SVG. Every term therefore resolves to a real file under
 * /assets/vocab-images/.
 *
 * Usage: node vocab-hub/build-bank.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveVocabImage } from "../engine/core/vocab-images.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const LESSONS_DIR = path.join(REPO_ROOT, "lessons");
const OUT_FILE = path.join(__dirname, "vocab-bank.json");

/* ----------------------------------------------------------------------------
 * Mirror of engine/core/vocab-images.js (READ-ONLY copy of its logic).
 * Kept in sync so every generated term has a guaranteed working image path.
 * ------------------------------------------------------------------------- */
const BASE = "/assets/vocab-images";

function slugify(term) {
  return String(term || "")
    .toLowerCase()
    .trim()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const DEDICATED = new Set([
  "ratio", "unit-rate", "rate", "proportion", "percent", "fraction",
  "numerator", "decimal", "integer", "absolute-value", "opposite",
  "number-line", "negative", "positive", "area", "volume",
  "composite-figure", "square-unit", "perimeter", "triangle", "parallelogram",
  "trapezoid", "rectangular-prism", "net", "surface-area", "mean", "median",
  "mode", "range", "histogram", "box-plot", "data", "coordinate-plane",
  "ordered-pair", "quadrant", "origin", "axis", "expression", "variable",
  "coefficient", "equation", "inequality", "exponent", "factor", "multiple",
  "prime-number", "distributive-property", "reciprocal", "scale-factor",
  "discount",
]);

const SYNONYMS = {
  "unit-rate": "unit-rate", "per-unit": "unit-rate", per: "unit-rate",
  "equivalent-ratio": "ratio", "equivalent-ratios": "ratio",
  "ratio-table": "ratio", "colon-notation": "ratio", "part-to-part": "ratio",
  "part-to-whole": "ratio", comparison: "ratio", compare: "inequality",
  part: "fraction", proportional: "proportion", "cross-multiply": "proportion",
  scale: "scale-factor", "better-buy": "unit-rate", markup: "percent",
  tax: "percent", tip: "percent", "greater-than-100": "percent",
  "less-than-1": "percent",
  "improper-fraction": "fraction", "mixed-number": "fraction",
  "unit-fraction": "fraction", "common-denominator": "fraction",
  "keep-change-flip": "reciprocal", "decimal-point": "decimal",
  "decimal-places": "decimal", "decimal-division": "decimal",
  tenths: "decimal", hundredths: "decimal", "place-value": "decimal",
  "rational-number": "number-line",
  "negative-integer": "negative", "negative-coordinate": "negative",
  "whole-number": "integer",
  "base-area": "area", "square-units": "square-unit", "cubic-units": "volume",
  base: "area", height: "dimensions", "slant-height": "dimensions",
  dimensions: "dimensions", "length-width-height": "dimensions",
  "lateral-area": "surface-area", "lateral-face": "surface-area",
  face: "rectangular-prism", edge: "rectangular-prism", apex: "pyramid",
  pyramid: "pyramid", "triangular-prism": "rectangular-prism",
  "regular-polygon": "regular-polygon", "two-dimensional": "square-unit",
  composite: "composite-figure", perpendicular: "triangle",
  "base-1-b1": "trapezoid", "base-2-b2": "trapezoid",
  "mean-absolute-deviation": "mean", deviation: "mean", variability: "spread",
  spread: "spread", distribution: "histogram", "data-distribution": "histogram",
  frequency: "histogram", interval: "histogram", quartile: "box-plot",
  "interquartile-range": "box-plot", outlier: "box-plot", cluster: "histogram",
  gap: "histogram", skewed: "histogram", symmetric: "histogram",
  symmetry: "histogram", "statistical-question": "data", survey: "data",
  graph: "histogram",
  "x-axis": "axis", "y-axis": "axis", "coordinate-plane": "coordinate-plane",
  reflection: "coordinate-plane", "horizontal-distance": "coordinate-plane",
  "vertical-distance": "coordinate-plane", distance: "number-line",
  "closed-circle": "inequality", "open-circle": "inequality",
  "greater-than": "inequality", "less-than": "inequality",
  "at-least-at-most": "inequality", "solution-set": "inequality",
  "algebraic-expression": "expression", evaluate: "expression",
  substitute: "variable", "like-terms": "coefficient", constant: "coefficient",
  term: "expression", expand: "distributive-property", power: "exponent",
  "equal-sign": "equation", solution: "equation", solve: "equation",
  isolate: "equation", "inverse-operation": "equation",
  "inverse-operations": "equation", "additive-pattern": "pattern",
  "linear-pattern": "pattern", pattern: "pattern",
  product: "multiply", multiply: "multiply", divide: "divide",
  dividend: "divide", divisor: "divide", divisible: "divide",
  quotient: "divide", remainder: "divide", "partial-quotients": "divide",
  "equivalent-division": "divide", add: "operation", subtract: "operation",
  combine: "operation", decompose: "decompose",
  "greatest-common-factor": "factor", "common-factor": "factor",
  "common-multiple": "multiple", "least-common-multiple": "multiple",
  "factor-tree": "factor", "prime-factorization": "factor",
  "composite-number": "factor", "skip-counting": "multiple",
  unit: "measurement", "customary-units": "measurement",
  "metric-units": "measurement", convert: "measurement",
  "conversion-factor": "measurement", estimate: "number", benchmark: "number",
  "annex-zeros": "decimal", order: "number-line", model: "bar-model",
  "bar-model": "bar-model", formula: "expression", property: "operation",
  "associative-property": "operation", "commutative-property": "operation",
  "identity-property": "operation", simplify: "fraction",
  equivalent: "fraction", reasonableness: "number",
  "problem-solving": "number",
};

const CATEGORY = {
  number: "cat-number", shape: "cat-shape", operation: "cat-operation",
  data: "cat-data", measurement: "cat-measurement",
};

const CATEGORY_KEYWORDS = [
  [/prism|pyramid|polygon|triangle|trapezoid|parallelogram|net|face|edge|apex|figure|dimension|perpendicular|two-dimensional|shape/, "shape"],
  [/data|graph|plot|histogram|mean|median|mode|quartile|outlier|deviation|distribution|frequency|spread|skew|symmetr|cluster|survey|statistic|variability|interquartile/, "data"],
  [/unit|metric|customary|convert|conversion|measure|length|width|height|distance|scale/, "measurement"],
  [/add|subtract|multiply|divide|product|quotient|sum|factor|multiple|operation|property|combine|decompose|expand|simplify/, "operation"],
  [/.*/, "number"],
];

function categoryFor(slug, term) {
  const text = `${slug} ${String(term || "").toLowerCase()}`;
  for (const [re, cat] of CATEGORY_KEYWORDS) {
    if (re.test(text)) return cat;
  }
  return "number";
}

const EXTRA_DEDICATED = new Set([
  "regular-polygon",
  "area-of-regular-polygons",
  "decompose",
  "dimensions", "pyramid", "spread", "pattern", "multiply", "divide",
  "operation", "measurement", "number", "bar-model",
]);

/* Image resolution is NOT reimplemented here — it is imported from
 * engine/core/vocab-images.js, the same function the lessons render with.
 *
 * This file used to carry its own copy, and the copy drifted in two ways that
 * both put a WRONG picture in the study hub:
 *   1. it ignored a vocab entry's per-lesson `image` override entirely, so every
 *      one of the ~200 concept cards fell through to the generic "#" tile; and
 *   2. its slug tables aged out of sync — "Dividend" resolved to divide.svg here
 *      while the lesson showed dividend.svg.
 * A second implementation of a mapping is a second thing to keep correct, and
 * nothing was checking that these two agreed. */

/* ----------------------------------------------------------------------------
 * Build
 * ------------------------------------------------------------------------- */
function normKey(term) {
  return String(term || "").trim().toLowerCase();
}

function main() {
  const dirs = fs
    .readdirSync(LESSONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name)
    .filter((name) => fs.existsSync(path.join(LESSONS_DIR, name, "config.json")))
    .sort();

  const byTerm = new Map();
  let rawCount = 0;
  let lessonsWithVocab = 0;

  for (const dir of dirs) {
    const cfgPath = path.join(LESSONS_DIR, dir, "config.json");
    let cfg;
    try {
      cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
    } catch (e) {
      console.error(`[skip] ${dir}/config.json: ${e.message}`);
      continue;
    }
    const vocab = Array.isArray(cfg.vocabulary) ? cfg.vocabulary : [];
    if (vocab.length) lessonsWithVocab++;

    const lessonId = cfg.lessonId || dir;
    const unit = cfg.unit ?? null;
    const lessonTitle = cfg.title || lessonId;
    const standard = cfg.standard || "";

    for (const v of vocab) {
      if (!v || !v.term) continue;
      rawCount++;
      const key = normKey(v.term);
      const usage = { unit, lessonId, lessonTitle, standard };

      if (byTerm.has(key)) {
        const entry = byTerm.get(key);
        // Track every unit/lesson that uses this term.
        if (!entry.usedBy.some((u) => u.lessonId === lessonId)) {
          entry.usedBy.push(usage);
        }
        if (unit != null && !entry.units.includes(unit)) entry.units.push(unit);
        if (standard && !entry.standards.includes(standard)) {
          entry.standards.push(standard);
        }
        // Backfill any richer fields if the first occurrence lacked them.
        if (!entry.examples && Array.isArray(v.examples)) entry.examples = v.examples;
        if (!entry.sentences && Array.isArray(v.sentences)) entry.sentences = v.sentences;
        if (!entry.cloze && v.cloze) entry.cloze = v.cloze;
        continue;
      }

      // Pass the entry's own override: a lesson that pins `image` is saying the
      // generic term picture shows the wrong example for THIS lesson.
      const image = resolveVocabImage(v.term, v.image);
      const entry = {
        term: v.term,
        termEs: v.termEs || "",
        definition: v.definition || "",
        definitionEs: v.definitionEs || "",
        visual: v.visual || "",
        image,
        imageSlug: slugify(v.term),
        unit,
        lessonId,
        lessonTitle,
        standard,
        units: unit != null ? [unit] : [],
        standards: standard ? [standard] : [],
        usedBy: [usage],
      };
      if (Array.isArray(v.examples) && v.examples.length) entry.examples = v.examples;
      if (Array.isArray(v.sentences) && v.sentences.length) entry.sentences = v.sentences;
      if (v.cloze) entry.cloze = v.cloze;
      byTerm.set(key, entry);
    }
  }

  const items = [...byTerm.values()].sort((a, b) =>
    a.term.localeCompare(b.term, "en", { sensitivity: "base" })
  );

  // Per-unit counts for the bank header.
  const byUnit = {};
  for (const it of items) {
    for (const u of it.units.length ? it.units : ["?"]) {
      byUnit[u] = (byUnit[u] || 0) + 1;
    }
  }

  const bank = {
    meta: {
      generatedAt: new Date().toISOString(),
      generator: "vocab-hub/build-bank.mjs",
      lessonsScanned: dirs.length,
      lessonsWithVocab,
      rawVocabEntries: rawCount,
      uniqueTerms: items.length,
      byUnit,
      imageBase: BASE,
    },
    items,
  };

  const current = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, "utf8") : "";

  // `generatedAt` is a clock reading, not content. Comparing it would make the
  // file differ from itself on every run — which would both defeat --check and
  // put a spurious one-line diff in every commit that runs the builder.
  const withoutClock = (text) => {
    try {
      const parsed = JSON.parse(text);
      if (parsed?.meta) parsed.meta = { ...parsed.meta, generatedAt: null };
      return JSON.stringify(parsed);
    } catch {
      return null;
    }
  };
  const unchanged = withoutClock(current) === withoutClock(`${JSON.stringify(bank, null, 2)}\n`);

  // Keep the existing timestamp when nothing else moved, so re-running the
  // builder is a true no-op on disk.
  if (unchanged && current) {
    const prevStamp = JSON.parse(current)?.meta?.generatedAt;
    if (prevStamp) bank.meta.generatedAt = prevStamp;
  }
  const next = `${JSON.stringify(bank, null, 2)}\n`;

  // --check: fail instead of writing when the committed bank is stale. The
  // Vocabulary Study Hub is a SECOND copy of every lesson's vocabulary, so it
  // goes wrong silently — it renders fine while showing an old definition or a
  // picture the lesson no longer uses.
  if (process.argv.includes("--check")) {
    if (!unchanged) {
      console.error(
        `vocab-hub/vocab-bank.json is stale — run: node vocab-hub/build-bank.mjs\n` +
          `  committed: ${JSON.parse(current || "{}")?.items?.length ?? 0} terms\n` +
          `  from configs: ${items.length} terms`,
      );
      process.exit(1);
    }
    console.log(`vocab bank is up to date (${items.length} terms).`);
    return;
  }

  fs.writeFileSync(OUT_FILE, next, "utf8");

  console.log(`Wrote ${OUT_FILE}`);
  console.log(
    `lessons=${dirs.length} withVocab=${lessonsWithVocab} raw=${rawCount} unique=${items.length}`
  );
  console.log("byUnit:", JSON.stringify(byUnit));
}

main();
