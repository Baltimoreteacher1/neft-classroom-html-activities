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
  "regular-polygon": "triangle", "two-dimensional": "square-unit",
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
  combine: "operation", decompose: "operation",
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
  "dimensions", "pyramid", "spread", "pattern", "multiply", "divide",
  "operation", "measurement", "number", "bar-model",
]);

function resolveVocabImage(term) {
  const slug = slugify(term);
  if (!slug) return `${BASE}/${CATEGORY.number}.svg`;
  if (DEDICATED.has(slug) || EXTRA_DEDICATED.has(slug)) {
    return `${BASE}/${slug}.svg`;
  }
  const syn = SYNONYMS[slug];
  if (syn && (DEDICATED.has(syn) || EXTRA_DEDICATED.has(syn))) {
    return `${BASE}/${syn}.svg`;
  }
  const cat = categoryFor(slug, term);
  return `${BASE}/${CATEGORY[cat]}.svg`;
}

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

      const image = resolveVocabImage(v.term);
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

  fs.writeFileSync(OUT_FILE, `${JSON.stringify(bank, null, 2)}\n`, "utf8");

  console.log(`Wrote ${OUT_FILE}`);
  console.log(
    `lessons=${dirs.length} withVocab=${lessonsWithVocab} raw=${rawCount} unique=${items.length}`
  );
  console.log("byUnit:", JSON.stringify(byUnit));
}

main();
