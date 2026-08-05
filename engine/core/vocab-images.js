import { attachImageZoom } from "./image-zoom.js";

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
  "place-value",
  "tenths",
  "hundredths",
  "thousandths",
  "decimal-point",
  "greater-than",
  "less-than",
  "symmetric",
  "skewed",
  "part-to-part",
  "part-to-whole",
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
  "rectangle",
  "rhombus",
  "square",
  // "parallel" and "perpendicular" are taught words in their own right, not
  // decoration on another term's picture. "perpendicular" used to resolve to
  // triangle.svg and "parallel" fell all the way through to cat-shape.svg, so
  // the two ideas a student must tell apart were illustrated by a triangle and
  // a placeholder. Each now has its own diagram.
  "parallel",
  "perpendicular",
  // "slanted side" used to resolve to parallelogram.svg, which highlights the
  // HEIGHT — the exact thing the term exists to contrast against.
  "slanted-side",
  // Compound terms ("area of a ___") carry the formula in their own picture;
  // they used to borrow the plain shape image, which shows no formula at all.
  "area-of-parallelograms",
  "area-of-trapezoids",
  "area-of-triangles",
  "area-of-composite-figures",
  "volume-of-rectangular-prisms",
  "surface-area-of-prisms",
  "surface-area-of-pyramids",
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
  "open-circle",
  "closed-circle",
  "boundary-point",
  "solution-set",
  "exponent",
  "factor",
  "multiple",
  "prime-number",
  "distributive-property",
  "commutative-property",
  "associative-property",
  "identity-property",
  "reciprocal",
  "scale-factor",
  "discount",
  "markup",
  "tax",
  "tip",
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
  comparison: "ratio",
  compare: "inequality",
  part: "fraction",
  proportional: "proportion",
  "cross-multiply": "proportion",
  scale: "scale-factor",
  "better-buy": "unit-rate",
  // markup / tax / tip used to resolve to percent.svg — a plain "50 out of 100"
  // grid. That picture says what a percent IS, not what these three words DO
  // (each adds an amount on top of a starting price), so the word wall showed
  // the same generic grid for three distinct terms. Each now has its own
  // before → added amount → total diagram that matches its `visual` example.
  markup: "markup",
  "sales-tax": "tax",
  tax: "tax",
  tip: "tip",
  gratuity: "tip",
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
  // "place value" used to resolve to decimal.svg — a shaded hundredths grid for
  // 0.37. That picture is about what a decimal *is*, not about a digit's value
  // depending on its column, so the word wall illustrated the term with a
  // diagram that never shows a place. It now has its own chart (place-value.svg);
  // the plural is mapped because lessons author both spellings.
  "place-values": "place-value",
  "rational-number": "number-line",

  "negative-integer": "negative",
  "negative-coordinate": "negative",
  "whole-number": "integer",

  "base-area": "base-area-prism",
  "square-units": "square-unit",
  "cubic-unit": "cubic-units",
  // `base` and `height` are PARTS of a shape, so the generic picture is only
  // ever right by accident. Each lesson that teaches them pins a shape-matched
  // image (`base-parallelogram`, `height-triangle`, …) on the vocabulary entry
  // itself; these slugs stay as the safe default for anywhere that does not.
  base: "base",
  height: "height",
  "slant-height": "slant-height-pyramid",
  slant: "slanted-side",
  slanted: "slanted-side",
  "area-of-regular-polygons": "area-of-regular-polygons",
  // These two compounds state a formula, so they get the formula picture
  // rather than the plain shape/net image, which shows no formula at all.
  "volume-with-whole-number-edges": "volume-of-rectangular-prisms",
  "surface-area-using-nets": "surface-area-of-prisms",
  dimensions: "dimensions",
  "length-width-height": "dimensions",
  "lateral-area": "surface-area",
  "lateral-face": "surface-area",
  face: "rectangular-prism",
  edges: "edge",
  apex: "pyramid",
  pyramid: "pyramid",
  "triangular-prism": "rectangular-prism",
  "regular-polygon": "regular-polygon",
  "two-dimensional": "square-unit",
  composite: "composite-figure",
  parallel: "parallel",
  "parallel-side": "parallel",
  "parallel-sides": "parallel",
  "parallel-lines": "parallel",
  perpendicular: "perpendicular",
  "perpendicular-lines": "perpendicular",
  "perpendicular-height": "perpendicular",
  "right-angle": "perpendicular",
  "base-1-b1": "base-1-trapezoid",
  "base-2-b2": "base-2-trapezoid",
  rectangle: "rectangle",
  rhombus: "rhombus",
  square: "square",
  quadrilateral: "parallelogram",

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
  symmetry: "symmetric",
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
  "at-least-at-most": "inequality",
  "no-more-than": "inequality",
  "at-most": "inequality",
  "at-least": "inequality",
  constraint: "inequality",
  boundary: "boundary-point",

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
  "one-step-equation": "equation",
  "two-step-equation": "equation",
  balance: "equation",
  unknown: "variable",
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
  decompose: "decompose",
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

/** @type {[RegExp, string][]} */
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

export function resolveVocabFallback(term) {
  const slug = slugify(term);
  return `${BASE}/${CATEGORY[categoryFor(slug, term)]}.svg`;
}

// Slugs that have dedicated SVGs but are referenced only via the synonym map.
const EXTRA_DEDICATED = new Set([
  "regular-polygon",
  "area-of-regular-polygons",
  "decompose",
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
  // Shape-qualified part terms. A lesson pins one of these on the vocabulary
  // entry's `image` field so "base"/"height" show the shape THAT lesson is
  // about; they are also listed here so a slug or synonym can reach them.
  "base-parallelogram",
  "base-triangle",
  "base-1-trapezoid",
  "base-2-trapezoid",
  "base-area-prism",
  "height-parallelogram",
  "height-triangle",
  "height-trapezoid",
  "slant-height-pyramid",
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

  return resolveVocabFallback(term);
}

// True only when `term` maps to a real, term-specific illustration — an authored
// override, a dedicated SVG, or a synonym that resolves to one. False means the
// only thing resolveVocabImage() could return is a generic category placeholder
// (e.g. cat-number.svg, the literal "#" tile), which reads as an unrelated image
// for descriptive words like "corner", "leans", or "slanted side". Callers use
// this to suppress the placeholder rather than show a misleading picture.
export function hasRealVocabImage(term, override) {
  if (override && typeof override === "string") return true;
  const slug = slugify(term);
  if (!slug) return false;
  if (DEDICATED.has(slug) || EXTRA_DEDICATED.has(slug)) return true;
  const syn = SYNONYMS[slug];
  return !!(syn && (DEDICATED.has(syn) || EXTRA_DEDICATED.has(syn)));
}

export function vocabImageAlt(term, definition) {
  const t = String(term || "").trim();
  const d = String(definition || "").trim();
  if (t && d) return `Illustration of ${t}: ${d}`;
  if (t) return `Illustration of the math term ${t}`;
  return "Math vocabulary illustration";
}

export function configureVocabImage(image, word, { eager = false } = {}) {
  const term = word?.term || "";
  const definition = word?.definition || word?.visual || "";
  const primary = resolveVocabImage(term, typeof word?.image === "string" ? word.image : undefined);
  const fallback = resolveVocabFallback(term);
  image.width = 320;
  image.height = 220;
  image.loading = eager ? "eager" : "lazy";
  image.decoding = "async";
  image.alt = vocabImageAlt(term, definition);
  image.dataset.imageState = "loading";
  image.onload = () => {
    image.dataset.imageState = "ready";
  };
  image.onerror = () => {
    if (image.getAttribute("src") !== fallback) {
      image.dataset.imageState = "fallback";
      image.src = fallback;
    } else {
      image.dataset.imageState = "unavailable";
      image.removeAttribute("src");
    }
  };
  image.src = primary;
  // Every vocabulary picture a student can see enlarges on click / Enter / Space.
  // Doing it here rather than at each call site is what makes the small-group
  // word wall AND its <dialog> pop-up behave like the glossary picture in the
  // interactive lesson. The lightbox is a top-layer <dialog>, so it paints above
  // the small-group pop-up instead of behind it.
  attachImageZoom(image);
  return image;
}

export default resolveVocabImage;
