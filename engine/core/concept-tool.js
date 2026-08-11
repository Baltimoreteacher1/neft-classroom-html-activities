// concept-tool.js — pick the manipulative that fits a problem's stem.
//
// One detector, two callers: the full lesson renderer's problem card
// (problem-shell.js) and the small-group studio's question card
// (small-group-practice.js). They used to carry two hand-maintained copies of
// these rules, and the copies had already drifted: the lesson version learned
// that "base 12 and height 8" is geometry, not exponents, while the small-group
// version still offered the Powers & Exponents lab on every area problem.
//
// Matching rule: PHRASES are matched as substrings ("surface area"), but single
// words are matched on WORD BOUNDARIES. That is not pedantry — "net" is inside
// "cabinet", "mad" is inside "made", and both were opening the wrong lab on
// real lessons (the Surface Area Packer on Convert Measurement Units, the MAD
// Balance Lab on a composite-area problem).

const has = (str, word) => new RegExp(`\\b${word}\\b`).test(str);

// "base" and "power" are ambiguous by themselves: every geometry stem says
// "base 12 and height 8", and an arcade word problem can run a power cable.
const GEOMETRY_WORDS = /\b(height|area|triangle|parallelogram|trapezoid|prism|rectangle)\b/;
const POWER_AS_ELECTRICITY = /\bpower (cable|cord|strip|outlet|supply|bank|line|washer)\b/;

/**
 * @param {string} stemText the problem as the student reads it
 * @returns {{kind: string, icon: string, label: string, figure?: string}|null}
 */
export function detectConceptTool(stemText) {
  if (!stemText || typeof stemText !== "string") return null;
  const str = stemText.toLowerCase();
  const geometry = GEOMETRY_WORDS.test(str);
  const electricalPower = POWER_AS_ELECTRICITY.test(str);

  if (
    has(str, "exponent") ||
    has(str, "squared") ||
    has(str, "cubed") ||
    (has(str, "power") && !geometry && !electricalPower) ||
    (has(str, "base") && !geometry && has(str, "power") && !electricalPower)
  ) {
    return { kind: "power-builder", icon: "⚡", label: "Powers & Exponents" };
  }
  if (str.includes("factor tree") || str.includes("prime factor")) {
    return { kind: "factor-tree-lab", icon: "🌳", label: "Factor Tree Lab" };
  }
  if (has(str, "lcm") || str.includes("least common multiple")) {
    return { kind: "lcm-lab", icon: "🔢", label: "LCM Lab" };
  }
  if (
    has(str, "fraction") &&
    (has(str, "divide") || str.includes("÷") || has(str, "kcf") || has(str, "reciprocal"))
  ) {
    return { kind: "fraction-divide", icon: "🥞", label: "Divide Fractions Lab" };
  }
  if (has(str, "decimal") && (has(str, "multiply") || has(str, "product"))) {
    return { kind: "decimal-product", icon: "🔢", label: "Multiply Decimals Lab" };
  }
  if (has(str, "decimal") && (has(str, "divide") || has(str, "quotient"))) {
    return { kind: "decimal-quotient", icon: "🔢", label: "Divide Decimals Lab" };
  }
  if (has(str, "decimal") && (has(str, "add") || has(str, "subtract") || has(str, "column"))) {
    return { kind: "decimal-columns", icon: "🔢", label: "Decimal Column Lab" };
  }
  if (
    (has(str, "divide") || has(str, "quotient") || str.includes("long division")) &&
    has(str, "remainder")
  ) {
    return { kind: "long-division-builder", icon: "🧮", label: "Long Division Lab" };
  }
  if (has(str, "equation") || str.includes("balance scale")) {
    return { kind: "algebra-balance-scale", icon: "⚖️", label: "Balance Scale" };
  }
  if (
    has(str, "inequality") ||
    str.includes("greater than") ||
    str.includes("less than") ||
    str.includes("≤") ||
    str.includes("≥")
  ) {
    return { kind: "neon-inequality", icon: "📈", label: "Inequality Lab" };
  }
  if (str.includes("surface area") || has(str, "net") || has(str, "prism")) {
    return { kind: "surface-area-packer", icon: "📦", label: "Surface Area Packer" };
  }
  // "Find the area" of a named figure counts as much as "area of a triangle" —
  // the phrase-only rule missed the way most stems are actually written.
  const figureNamed = /\b(triangle|parallelogram|trapezoid|rectangle|composite figure)\b/.test(str);
  if (
    str.includes("area of") ||
    has(str, "parallelogram") ||
    has(str, "trapezoid") ||
    str.includes("composite figure") ||
    str.includes("l-shaped") ||
    (has(str, "area") && figureNamed)
  ) {
    // Name the figure the STEM is about; area-morph defaults to a parallelogram
    // otherwise, which would demonstrate the wrong formula for a triangle stem.
    const figure = has(str, "trapezoid")
      ? "trapezoid"
      : has(str, "triangle")
        ? "triangle"
        : has(str, "composite") || str.includes("l-shaped")
          ? "composite"
          : "parallelogram";
    return { kind: "area-morph", figure, icon: "📐", label: "Area Lab" };
  }
  if (
    has(str, "coordinate") ||
    has(str, "quadrant") ||
    str.includes("ordered pair") ||
    str.includes("x-axis")
  ) {
    return { kind: "coordinate-navigator", icon: "📍", label: "Coordinate Navigator" };
  }
  if (str.includes("box plot") || has(str, "quartile") || has(str, "interquartile")) {
    return { kind: "box-plot-detective", icon: "📊", label: "Box Plot Detective" };
  }
  if (has(str, "histogram") || str.includes("frequency table")) {
    return { kind: "histogram-master-lab", icon: "📊", label: "Histogram Lab" };
  }
  if (str.includes("mean absolute deviation") || has(str, "mad")) {
    return { kind: "mad-balance-sandbox", icon: "⚖️", label: "MAD Balance Lab" };
  }
  return null;
}

export default detectConceptTool;
