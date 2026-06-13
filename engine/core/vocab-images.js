const BASE = "/assets/vocab-images";

export function slugify(term) {
  return String(term || "")
    .toLowerCase()
    .trim()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const DEDICATED = new Set([
  "ratio",
  "unit-rate",
  "rate",
  "proportion",
  "percent",
  "fraction",
  "numerator",
  "decimal",
  "integer",
  "absolute-value",
  "opposite",
  "number-line",
  "negative",
  "positive",
  "area",
  "volume",
  "cubic-units",
  "composite-figure",
  "square-unit",
  "perimeter",
  "triangle",
  "parallelogram",
  "trapezoid",
  "rectangular-prism",
  "net",
  "edge",
  "surface-area",
  "mean",
  "median",
  "mode",
  "range",
  "histogram",
  "box-plot",
  "data",
  "coordinate-plane",
  "ordered-pair",
  "quadrant",
  "origin",
  "axis",
  "expression",
  "variable",
  "coefficient",
  "equation",
  "inequality",
  "exponent",
  "factor",
  "multiple",
  "prime-number",
  "distributive-property",
  "reciprocal",
  "scale-factor",
  "discount",
  "add",
  "subtract",
  "dividend",
  "divisor",
  "quotient",
  "distribution",
  "frequency",
  "outlier",
  "cluster",
  "denominator",
  "constant",
  "term",
  "greatest-common-factor",
  "least-common-multiple",
  "mixed-number",
  "improper-fraction",
  "sum",
  "difference",
  "product",
  "quartile",
  "interquartile-range",
  "mean-absolute-deviation",
  "reflection",
  "estimate",
  "remainder",
  "composite-number",
  "distance",
  "prime-factorization",
  "equivalent-ratio",
  "base",
  "height",
  "substitute",
  "like-terms",
]);

const SYNONYMS = {
  "unit-rate": "unit-rate",
  "per-unit": "unit-rate",
  per: "unit-rate",
  "equivalent-ratio": "equivalent-ratio",
  "equivalent-ratios": "equivalent-ratio",
  "ratio-table": "ratio",
  "colon-notation": "ratio",
  "part-to-part": "ratio",
  "part-to-whole": "ratio",
  comparison: "ratio",
  compare: "inequality",
  part: "fraction",
  proportional: "proportion",
  "cross-multiply": "proportion",
  scale: "scale-factor",
  "better-buy": "unit-rate",
  markup: "percent",
  tax: "percent",
  tip: "percent",
  "greater-than-100": "percent",
  "less-than-1": "percent",

  "improper-fraction": "improper-fraction",
  "mixed-number": "mixed-number",
  denominator: "denominator",
  "unit-fraction": "fraction",
  "common-denominator": "fraction",
  "keep-change-flip": "reciprocal",
  "decimal-point": "decimal",
  "decimal-places": "decimal",
  "decimal-division": "decimal",
  tenths: "decimal",
  hundredths: "decimal",
  "place-value": "decimal",
  "rational-number": "number-line",

  "negative-integer": "negative",
  "negative-coordinate": "negative",
  "whole-number": "integer",

  "base-area": "area",
  "square-units": "square-unit",
  "cubic-unit": "cubic-units",
  base: "base",
  height: "height",
  "slant-height": "height",
  dimensions: "dimensions",
  "length-width-height": "dimensions",
  "lateral-area": "surface-area",
  "lateral-face": "surface-area",
  face: "rectangular-prism",
  edges: "edge",
  apex: "pyramid",
  pyramid: "pyramid",
  "triangular-prism": "rectangular-prism",
  "regular-polygon": "triangle",
  "two-dimensional": "square-unit",
  composite: "composite-figure",
  perpendicular: "triangle",
  "base-1-b1": "trapezoid",
  "base-2-b2": "trapezoid",

  "mean-absolute-deviation": "mean-absolute-deviation",
  mad: "mean-absolute-deviation",
  deviation: "mean-absolute-deviation",
  variability: "spread",
  spread: "spread",
  distribution: "distribution",
  "data-distribution": "distribution",
  frequency: "frequency",
  interval: "histogram",
  quartile: "quartile",
  "interquartile-range": "interquartile-range",
  iqr: "interquartile-range",
  outlier: "outlier",
  cluster: "cluster",
  gap: "histogram",
  skewed: "histogram",
  symmetric: "histogram",
  symmetry: "histogram",
  "statistical-question": "data",
  survey: "data",
  graph: "histogram",

  "x-axis": "axis",
  "y-axis": "axis",
  "coordinate-plane": "coordinate-plane",
  reflection: "reflection",
  reflect: "reflection",
  "horizontal-distance": "distance",
  "vertical-distance": "distance",
  distance: "distance",
  "closed-circle": "inequality",
  "open-circle": "inequality",
  "greater-than": "inequality",
  "less-than": "inequality",
  "at-least-at-most": "inequality",
  "solution-set": "inequality",

  "algebraic-expression": "expression",
  evaluate: "expression",
  substitute: "substitute",
  "like-terms": "like-terms",
  "combine-like-terms": "like-terms",
  constant: "constant",
  "constant-term": "constant",
  term: "term",
  expand: "distributive-property",
  power: "exponent",
  "equal-sign": "equation",
  solution: "equation",
  solve: "equation",
  isolate: "equation",
  "inverse-operation": "equation",
  "inverse-operations": "equation",
  "additive-pattern": "pattern",
  "linear-pattern": "pattern",
  pattern: "pattern",

  product: "product",
  multiply: "multiply",
  divide: "divide",
  dividend: "dividend",
  divisor: "divisor",
  divisible: "divide",
  quotient: "quotient",
  remainder: "remainder",
  "partial-quotients": "quotient",
  "equivalent-division": "divide",
  add: "add",
  subtract: "subtract",
  sum: "sum",
  difference: "difference",
  combine: "add",
  decompose: "subtract",
  "greatest-common-factor": "greatest-common-factor",
  gcf: "greatest-common-factor",
  "common-factor": "greatest-common-factor",
  "common-multiple": "least-common-multiple",
  "least-common-multiple": "least-common-multiple",
  lcm: "least-common-multiple",
  "factor-tree": "prime-factorization",
  "prime-factorization": "prime-factorization",
  "composite-number": "composite-number",
  "skip-counting": "multiple",

  unit: "measurement",
  "customary-units": "measurement",
  "metric-units": "measurement",
  convert: "measurement",
  "conversion-factor": "measurement",
  estimate: "estimate",
  estimation: "estimate",
  round: "estimate",
  benchmark: "number",
  "annex-zeros": "decimal",
  order: "number-line",
  model: "bar-model",
  "bar-model": "bar-model",
  formula: "expression",
  property: "operation",
  "associative-property": "operation",
  "commutative-property": "operation",
  "identity-property": "operation",
  simplify: "fraction",
  equivalent: "fraction",
  reasonableness: "number",
  "problem-solving": "number",
};

const CATEGORY = {
  number: "cat-number",
  shape: "cat-shape",
  operation: "cat-operation",
  data: "cat-data",
  measurement: "cat-measurement",
};

const CATEGORY_KEYWORDS = [
  [
    /prism|pyramid|polygon|triangle|trapezoid|parallelogram|net|face|edge|apex|figure|dimension|perpendicular|two-dimensional|shape/,
    "shape",
  ],
  [
    /data|graph|plot|histogram|mean|median|mode|quartile|outlier|deviation|distribution|frequency|spread|skew|symmetr|cluster|survey|statistic|variability|interquartile/,
    "data",
  ],
  [
    /unit|metric|customary|convert|conversion|measure|length|width|height|distance|scale/,
    "measurement",
  ],
  [
    /add|subtract|multiply|divide|product|quotient|sum|factor|multiple|operation|property|combine|decompose|expand|simplify/,
    "operation",
  ],
  [/.*/, "number"],
];

function categoryFor(slug, term) {
  const text = `${slug} ${String(term || "").toLowerCase()}`;
  for (const [re, cat] of CATEGORY_KEYWORDS) {
    if (re.test(text)) return cat;
  }
  return "number";
}

// Slugs that have dedicated SVGs but are referenced only via the synonym map.
const EXTRA_DEDICATED = new Set([
  "dimensions",
  "pyramid",
  "spread",
  "pattern",
  "multiply",
  "divide",
  "operation",
  "measurement",
  "number",
  "bar-model",
]);

export function resolveVocabImage(term, override) {
  // A vocab entry may pin an explicit image (e.g. when the generic term image
  // would show the wrong example for this lesson). Honor it before any slug
  // resolution. Accepts a path string as the 2nd arg.
  if (override && typeof override === "string") return override;
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

export function vocabImageAlt(term, definition) {
  const t = String(term || "").trim();
  const d = String(definition || "").trim();
  if (t && d) return `Illustration of ${t}: ${d}`;
  if (t) return `Illustration of the math term ${t}`;
  return "Math vocabulary illustration";
}

export default resolveVocabImage;
