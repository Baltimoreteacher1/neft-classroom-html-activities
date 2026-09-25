// Homework pages are standalone HTML with a classic (non-module) inline
// script, so they cannot `import` the site-wide answer matcher — but they must
// not carry a second, divergent copy of the grading rules either. This inlines
// `engine/core/answer-match.js` verbatim at generate time, wrapped in an IIFE
// so its helper names (`norm`, `numberOf`, …) cannot collide with the other
// inline scripts on the page.
//
// Consumers call `NTAnswerMatch.isRight(studentValue, correctValue)`.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const ANSWER_MATCH_SOURCE_PATH = join(HERE, "..", "engine", "core", "answer-match.js");

const EXPORTED = ["norm", "numberOf", "stripLabel", "numericValue", "isRight", "fullerFormHint"];

const source = readFileSync(ANSWER_MATCH_SOURCE_PATH, "utf8").replace(/^export\s+/gm, "");

// Homework tables may show both equivalent numeric forms (5/2 = 2 1/2)
// or ask for an inequality. Preserve the shared matcher's other contracts,
// including refusing an incomplete bare number for an inequality.
const HOMEWORK_EQUIVALENCES = String.raw`
const sharedIsRight = isRight;
const comparisonSymbols = (value) => String(value ?? "")
  .replace(/>=/g, "≥").replace(/<=/g, "≤");
function simpleComparison(value) {
  const text = norm(comparisonSymbols(value));
  const parts = text.match(/^(.+?)([<>≤≥])(.+)$/);
  if (!parts) return null;
  const [, left, operator, right] = parts;
  const variable = /^[a-z][a-z0-9]?$/;
  const leftNumber = numericValue(left), rightNumber = numericValue(right);
  if (variable.test(left) && rightNumber != null) {
    return { variable: left, operator, boundary: rightNumber };
  }
  if (variable.test(right) && leftNumber != null) {
    return { variable: right, operator: {">":"<", "<":">", "≥":"≤", "≤":"≥"}[operator], boundary: leftNumber };
  }
  return null;
}
function equivalentHomeworkAnswer(input, answer) {
  const typed = comparisonSymbols(input), target = comparisonSymbols(answer);
  if (sharedIsRight(typed, target)) return true;
  const typedComparison = simpleComparison(typed), targetComparison = simpleComparison(target);
  if (typedComparison && targetComparison) {
    return typedComparison.variable === targetComparison.variable &&
      typedComparison.operator === targetComparison.operator &&
      Math.abs(typedComparison.boundary - targetComparison.boundary) < 1e-9;
  }
  // Only treat an authored equality as a numeric equivalence when every
  // side is numeric and equal. Never split or repair the student's input.
  if (!target.includes("=")) return false;
  const values = target.split("=").map((part) => numericValue(stripLabel(part.trim())));
  if (values.length < 2 || values.some((value) => value == null || Math.abs(value - values[0]) >= 1e-9)) return false;
  const studentValue = numericValue(stripLabel(typed));
  return studentValue != null && Math.abs(studentValue - values[0]) < 1e-9;
}
isRight = (input, answer) => {
  if (answer == null || !String(input ?? "").trim()) return false;
  return (Array.isArray(answer) ? answer : [answer]).some((value) =>
    value != null && equivalentHomeworkAnswer(input, value));
};
`;

// A backtick or "${" in the module would break the generator's template
// literals downstream; fail loudly rather than emit a corrupted page.
if (/[`]|\$\{/.test(source)) {
  throw new Error(
    "answer-match.js now contains a backtick or ${ — it can no longer be inlined verbatim into homework HTML.",
  );
}

// This text lands inside every homework page, where `audit:homework` decides
// which topic the page's visual explainer is about by grepping the whole
// document. A literal superscript power in a comment reads as "this page shows
// an exponents visual" and knocked all 8 Unit 7 equation/inequality lessons out
// of alignment. Keep the matcher's prose free of those signals.
const AUDIT_TOPIC_SIGNALS =
  /Base = \d · Exponent|introduction-to-exponents|2³|Multiply 2 three times/i;
if (AUDIT_TOPIC_SIGNALS.test(source)) {
  throw new Error(
    "answer-match.js contains text that audit:homework reads as an exponents visual. " +
      "Write powers as 2^3 rather than with a superscript glyph.",
  );
}

// `indent` is the column the block sits at in its host file. Homework pages
// drop it at the top level of an inline script (0); the Study Pack engine puts
// it inside an IIFE (2). Getting this right matters because the host file is
// then formatted by Biome, and a mis-indented generated block fails
// `npm run check`.
export function answerMatchBlock(indent = 0, includeHomework = true) {
  const pad = " ".repeat(indent);
  const body = (includeHomework ? source + "\n" + HOMEWORK_EQUIVALENCES : source)
    .split("\n")
    .map((line) => (line ? `${pad}  ${line}` : line))
    .join("\n");
  return [
    `${pad}// ── Shared answer matcher — generated from engine/core/answer-match.js.`,
    `${pad}// Do not edit here; edit that file and re-run the generator that emits it.`,
    `${pad}var NTAnswerMatch = (function () {`,
    body,
    `${pad}  return { ${EXPORTED.join(", ")} };`,
    `${pad}})();`,
  ].join("\n");
}

export const ANSWER_MATCH_JS = answerMatchBlock(0);

// Other consumers keep the shared engine contract without homework-only extensions.
export const CORE_ANSWER_MATCH_JS = answerMatchBlock(0, false);
