// Single source of truth for the Lab's semantic design tokens (Enterprise 8).
// `tools/build-fluency-e8-tokens.mjs` compiles this file to tokens.generated.css, and
// `tools/fluency-e8-grade-system.test.mjs` computes the WCAG contrast of every declared pair.

export const TOKENS = Object.freeze({
  light: {
    surface: "#ffffff",
    "surface-2": "#f6f8fa",
    "surface-sunk": "#eaeff4",
    ink: "#17324d",
    "ink-soft": "#46586a",
    line: "#c4cfda",
    focus: "#1d5fa8",
    correct: "#14673f",
    "correct-tint": "#e4f4ea",
    incorrect: "#9f1f14",
    "incorrect-tint": "#fde8e7",
    hint: "#7a4306",
    "hint-tint": "#fff4e0",
    info: "#1e4f86",
    "info-tint": "#e3eef8",
    // Mathematics domains: an ink for text and strokes, a tint for fills behind that ink.
    "domain-number": "#8a3b1f",
    "domain-number-tint": "#fbece5",
    "domain-operations": "#1d5a85",
    "domain-operations-tint": "#e4f0f9",
    "domain-fractions": "#6b4b00",
    "domain-fractions-tint": "#fdf1d2",
    "domain-ratio": "#12625f",
    "domain-ratio-tint": "#dff3f1",
    "domain-algebra": "#8a2f52",
    "domain-algebra-tint": "#fbe8ef",
    "domain-geometry": "#3d6b1f",
    "domain-geometry-tint": "#e9f4df",
    "domain-data": "#2f4f8f",
    "domain-data-tint": "#e6ecfa",
    "domain-measurement": "#7a4a14",
    "domain-measurement-tint": "#f7eddc",
    // Model colours: fills used inside manipulatives; always paired with a pattern or label, never colour alone.
    "model-a": "#1fa6a2",
    "model-b": "#f2c15b",
    "model-c": "#d8613c",
    "model-d": "#5b7fc7",
    // Graph surfaces.
    "graph-axis": "#17324d",
    "graph-grid": "#d6dee6",
    "graph-series": "#1d5fa8",
    "graph-series-2": "#a23b18",
    // Mastery indicators (text colour on its tint).
    "mastery-new": "#46586a",
    "mastery-new-tint": "#eaeff4",
    "mastery-developing": "#7a4306",
    "mastery-developing-tint": "#fff4e0",
    "mastery-practicing": "#1e4f86",
    "mastery-practicing-tint": "#e3eef8",
    "mastery-demonstrated": "#14673f",
    "mastery-demonstrated-tint": "#e4f4ea",
    "mastery-review": "#0b5d57",
    "mastery-review-tint": "#dcf3ef",
  },
  dark: {
    surface: "#0f1c2a",
    "surface-2": "#16283a",
    "surface-sunk": "#0a1520",
    ink: "#eaf1f7",
    "ink-soft": "#b4c3d1",
    line: "#35506a",
    focus: "#8cc2ff",
    correct: "#8be8b4",
    "correct-tint": "#12382a",
    incorrect: "#ffb4ab",
    "incorrect-tint": "#4a1b17",
    hint: "#ffd48a",
    "hint-tint": "#3d2c0b",
    info: "#a9cdf5",
    "info-tint": "#17314f",
    "domain-number": "#ffb89a",
    "domain-number-tint": "#4a2314",
    "domain-operations": "#a6d3f5",
    "domain-operations-tint": "#14364f",
    "domain-fractions": "#ffe08a",
    "domain-fractions-tint": "#40340a",
    "domain-ratio": "#8de3df",
    "domain-ratio-tint": "#0f3a38",
    "domain-algebra": "#ffb3cd",
    "domain-algebra-tint": "#4a1730",
    "domain-geometry": "#bde89a",
    "domain-geometry-tint": "#24400f",
    "domain-data": "#b7c9f5",
    "domain-data-tint": "#1b2c55",
    "domain-measurement": "#f2c98d",
    "domain-measurement-tint": "#42290a",
    "model-a": "#3cc4bf",
    "model-b": "#f2c15b",
    "model-c": "#ef8a66",
    "model-d": "#8fa9ea",
    "graph-axis": "#eaf1f7",
    "graph-grid": "#2c4259",
    "graph-series": "#8cc2ff",
    "graph-series-2": "#ffb089",
    "mastery-new": "#b4c3d1",
    "mastery-new-tint": "#0a1520",
    "mastery-developing": "#ffd48a",
    "mastery-developing-tint": "#3d2c0b",
    "mastery-practicing": "#a9cdf5",
    "mastery-practicing-tint": "#17314f",
    "mastery-demonstrated": "#8be8b4",
    "mastery-demonstrated-tint": "#12382a",
    "mastery-review": "#8de3df",
    "mastery-review-tint": "#0f3a38",
  },
});

export const SPACING = Object.freeze({
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "24px",
  6: "32px",
  7: "48px",
});
export const ELEVATION = Object.freeze({
  0: "none",
  1: "0 1px 2px rgb(23 50 77 / .10)",
  2: "0 4px 14px rgb(23 50 77 / .12)",
  3: "0 12px 32px rgb(23 50 77 / .16)",
});
// Documented breakpoints (CSS media queries cannot read custom properties, so the CSS repeats these numbers).
export const BREAKPOINTS = Object.freeze({ phone: 480, tablet: 768, desktop: 1100, wide: 1440 });

// Every foreground / background pair that must meet WCAG 2.2 AA (4.5:1 for text, 3:1 for graphics).
export const CONTRAST_PAIRS = Object.freeze([
  ["ink", "surface", 4.5],
  ["ink", "surface-2", 4.5],
  ["ink-soft", "surface", 4.5],
  ["ink-soft", "surface-2", 4.5],
  ["correct", "correct-tint", 4.5],
  ["incorrect", "incorrect-tint", 4.5],
  ["hint", "hint-tint", 4.5],
  ["info", "info-tint", 4.5],
  ["focus", "surface", 3],
  ["graph-axis", "surface", 3],
  ["graph-series", "surface", 3],
  ["graph-series-2", "surface", 3],
  ...[
    "number",
    "operations",
    "fractions",
    "ratio",
    "algebra",
    "geometry",
    "data",
    "measurement",
  ].flatMap((d) => [
    [`domain-${d}`, `domain-${d}-tint`, 4.5],
    [`domain-${d}`, "surface", 4.5],
  ]),
  ...["new", "developing", "practicing", "demonstrated", "review"].map((m) => [
    `mastery-${m}`,
    `mastery-${m}-tint`,
    4.5,
  ]),
]);

const luminance = (hex) => {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export function contrastRatio(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// Strand names in the skill library map to one of the eight semantic domains.
const DOMAIN_BY_STRAND = {
  "Number sense": "number",
  Counting: "number",
  "Number relationships": "number",
  "Place value": "number",
  Patterns: "number",
  "Number theory": "number",
  "Number system": "number",
  "Real numbers": "number",
  Exponents: "number",
  "Scientific notation": "number",
  Operations: "operations",
  Addition: "operations",
  Subtraction: "operations",
  Multiplication: "operations",
  Division: "operations",
  Fluency: "operations",
  Fractions: "fractions",
  Decimals: "fractions",
  "Rational numbers": "fractions",
  Ratios: "ratio",
  Proportions: "ratio",
  Percents: "ratio",
  Expressions: "algebra",
  Equations: "algebra",
  "Linear relationships": "algebra",
  Functions: "algebra",
  Systems: "algebra",
  Geometry: "geometry",
  "Geometry extension": "geometry",
  Data: "data",
  Statistics: "data",
  Measurement: "measurement",
  Money: "measurement",
};
export const DOMAINS = Object.freeze([
  "number",
  "operations",
  "fractions",
  "ratio",
  "algebra",
  "geometry",
  "data",
  "measurement",
]);
export const domainForStrand = (strand) => DOMAIN_BY_STRAND[strand] || "number";
