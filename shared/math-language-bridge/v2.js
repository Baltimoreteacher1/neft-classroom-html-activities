import {
  MATH_LANGUAGE_BRIDGE_PATH,
  readMathLanguageBridge as readV1,
  MATH_LANGUAGE_BRIDGE_SCHEMA as V1_SCHEMA,
} from "./v1.js";

export const MATH_LANGUAGE_BRIDGE_SCHEMA = "edu-wonderlab.math-language/2";
const ALLOWED = new Set([
  "schema",
  "task",
  "grade",
  "percent",
  "whole",
  "numerator",
  "denominator",
]);
const inRangeInt = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

/** Find a nearby whole that makes the percent transfer an exact integer part. */
export function percentTransfer(percent, whole) {
  for (let candidate = whole + 1; candidate <= 1000; candidate += 1) {
    const numerator = percent * candidate;
    if (numerator % 100 === 0) return { whole: candidate, part: numerator / 100 };
  }
  return null;
}

/** Find a fresh whole for a fraction-of-whole transfer with an exact integer part. */
export function fractionTransfer(numerator, denominator, whole) {
  for (let candidate = whole + 1; candidate <= 1000; candidate += 1) {
    const product = numerator * candidate;
    if (product % denominator === 0) return { whole: candidate, part: product / denominator };
  }
  return null;
}

function validPercentTask(percent, whole) {
  return (
    inRangeInt(percent, 1, 100) &&
    inRangeInt(whole, 1, 1000) &&
    Number.isInteger((percent * whole) / 100) &&
    Boolean(percentTransfer(percent, whole))
  );
}

/** The URL contains only a validated math prompt; no learner identity, response, or progress. */
export function createPercentExplanationUrl({ percent, whole, grade = 6 } = {}) {
  if (!inRangeInt(grade, 4, 8))
    throw new RangeError("Percent explanation grade must be from 4 to 8.");
  if (!validPercentTask(percent, whole))
    throw new RangeError(
      "Percent and whole must produce exact integer parts and a valid transfer problem.",
    );
  const params = new URLSearchParams({
    schema: MATH_LANGUAGE_BRIDGE_SCHEMA,
    task: "percent-part-whole",
    grade: String(grade),
    percent: String(percent),
    whole: String(whole),
  });
  return `https://thelanguagepage.com${MATH_LANGUAGE_BRIDGE_PATH}?${params}`;
}

function validFractionTask(numerator, denominator, whole) {
  return (
    inRangeInt(numerator, 1, 12) &&
    inRangeInt(denominator, numerator + 1, 12) &&
    inRangeInt(whole, 1, 1000) &&
    Number.isInteger((numerator * whole) / denominator) &&
    Boolean(fractionTransfer(numerator, denominator, whole))
  );
}

/** The link carries a validated fraction task only; learner work remains on its own origin. */
export function createFractionExplanationUrl({ numerator, denominator, whole, grade = 5 } = {}) {
  if (!inRangeInt(grade, 3, 8))
    throw new RangeError("Fraction explanation grade must be from 3 to 8.");
  if (!validFractionTask(numerator, denominator, whole))
    throw new RangeError(
      "Fraction and whole must produce an exact integer part and transfer problem.",
    );
  const params = new URLSearchParams({
    schema: MATH_LANGUAGE_BRIDGE_SCHEMA,
    task: "fraction-of-whole",
    grade: String(grade),
    numerator: String(numerator),
    denominator: String(denominator),
    whole: String(whole),
  });
  return `https://thelanguagepage.com${MATH_LANGUAGE_BRIDGE_PATH}?${params}`;
}

/** Read v1 ratio links unchanged and accept only documented v2 math task contracts. */
export function readMathLanguageBridge(search = "") {
  const params =
    search instanceof URLSearchParams
      ? search
      : new URLSearchParams(String(search).replace(/^\?/, ""));
  if (params.get("schema") === V1_SCHEMA) return readV1(params);
  if (params.get("schema") !== MATH_LANGUAGE_BRIDGE_SCHEMA) return null;
  const task = params.get("task");
  const taskFields =
    task === "fraction-of-whole"
      ? new Set(["schema", "task", "grade", "numerator", "denominator", "whole"])
      : task === "percent-part-whole"
        ? new Set(["schema", "task", "grade", "percent", "whole"])
        : null;
  if (!taskFields || [...params.keys()].some((key) => !ALLOWED.has(key) || !taskFields.has(key)))
    return null;
  const grade = Number(params.get("grade"));
  if (task === "fraction-of-whole") {
    const numerator = Number(params.get("numerator"));
    const denominator = Number(params.get("denominator"));
    const whole = Number(params.get("whole"));
    if (!inRangeInt(grade, 3, 8) || !validFractionTask(numerator, denominator, whole)) return null;
    const transfer = fractionTransfer(numerator, denominator, whole);
    return Object.freeze({
      schema: MATH_LANGUAGE_BRIDGE_SCHEMA,
      task: "fraction-of-whole",
      grade,
      numerator,
      denominator,
      whole,
      part: (numerator * whole) / denominator,
      transferWhole: transfer.whole,
      transferPart: transfer.part,
    });
  }
  if (task !== "percent-part-whole") return null;
  const percent = Number(params.get("percent"));
  const whole = Number(params.get("whole"));
  if (!inRangeInt(grade, 4, 8) || !validPercentTask(percent, whole)) return null;
  const transfer = percentTransfer(percent, whole);
  return Object.freeze({
    schema: MATH_LANGUAGE_BRIDGE_SCHEMA,
    task: "percent-part-whole",
    grade,
    percent,
    whole,
    part: (percent * whole) / 100,
    transferWhole: transfer.whole,
    transferPart: transfer.part,
  });
}
