export const MATH_LANGUAGE_BRIDGE_SCHEMA = "edu-wonderlab.math-language/1";
export const MATH_LANGUAGE_BRIDGE_PATH = "/access-practice-lab/language-studios";

const ALLOWED = new Set(["schema", "task", "grade", "first", "second"]);
const inRangeInt = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

/** The bridge carries a math task only. It never carries a student name, response, profile, or progress record. */
export function createRatioExplanationUrl({ first, second, grade = 6 } = {}) {
  if (!inRangeInt(grade, 6, 8))
    throw new RangeError("Ratio explanation grade must be from 6 to 8.");
  if (!inRangeInt(first, 1, 12) || !inRangeInt(second, 1, 12)) {
    throw new RangeError("Ratio quantities must be whole numbers from 1 to 12.");
  }
  const params = new URLSearchParams({
    schema: MATH_LANGUAGE_BRIDGE_SCHEMA,
    task: "ratio-equivalence",
    grade: String(grade),
    first: String(first),
    second: String(second),
  });
  return `https://thelanguagepage.com${MATH_LANGUAGE_BRIDGE_PATH}?${params}`;
}

/** Parse only the documented v1 fields; unknown fields are rejected to prevent accidental profile transfer. */
export function readMathLanguageBridge(search = "") {
  const params =
    search instanceof URLSearchParams
      ? search
      : new URLSearchParams(String(search).replace(/^\?/, ""));
  if ([...params.keys()].some((key) => !ALLOWED.has(key))) return null;
  if (
    params.get("schema") !== MATH_LANGUAGE_BRIDGE_SCHEMA ||
    params.get("task") !== "ratio-equivalence"
  )
    return null;
  const grade = Number(params.get("grade"));
  const first = Number(params.get("first"));
  const second = Number(params.get("second"));
  if (!inRangeInt(grade, 6, 8) || !inRangeInt(first, 1, 12) || !inRangeInt(second, 1, 12))
    return null;
  return Object.freeze({
    schema: MATH_LANGUAGE_BRIDGE_SCHEMA,
    task: "ratio-equivalence",
    grade,
    first,
    second,
  });
}
