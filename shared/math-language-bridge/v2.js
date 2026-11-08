import {
  MATH_LANGUAGE_BRIDGE_PATH,
  readMathLanguageBridge as readV1,
  MATH_LANGUAGE_BRIDGE_SCHEMA as V1_SCHEMA,
} from "./v1.js";

export const MATH_LANGUAGE_BRIDGE_SCHEMA = "edu-wonderlab.math-language/2";
const ALLOWED = new Set(["schema", "task", "grade", "percent", "whole"]);
const inRangeInt = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

/** Find a nearby whole that makes the percent transfer an exact integer part. */
export function percentTransfer(percent, whole) {
  for (let candidate = whole + 1; candidate <= 1000; candidate += 1) {
    const numerator = percent * candidate;
    if (numerator % 100 === 0) return { whole: candidate, part: numerator / 100 };
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

/** Read v1 ratio links unchanged and accept only the explicit v2 percent contract. */
export function readMathLanguageBridge(search = "") {
  const params =
    search instanceof URLSearchParams
      ? search
      : new URLSearchParams(String(search).replace(/^\?/, ""));
  if (params.get("schema") === V1_SCHEMA) return readV1(params);
  if (
    [...params.keys()].some((key) => !ALLOWED.has(key)) ||
    params.get("schema") !== MATH_LANGUAGE_BRIDGE_SCHEMA
  )
    return null;
  if (params.get("task") !== "percent-part-whole") return null;
  const grade = Number(params.get("grade"));
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
