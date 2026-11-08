import {
  readMathLanguageBridge as readV1,
  MATH_LANGUAGE_BRIDGE_SCHEMA as V1_SCHEMA,
} from "./v1.js";

export const MATH_LANGUAGE_BRIDGE_SCHEMA = "edu-wonderlab.math-language/2";
// Route v2 tasks through the ACCESS Lab SPA shell. The legacy standalone
// /language-studios page remains available for existing v1 links.
export const MATH_LANGUAGE_BRIDGE_PATH = "/access-practice-lab/";
const ALLOWED = new Set([
  "schema",
  "task",
  "grade",
  "percent",
  "whole",
  "numerator",
  "denominator",
  "values",
  "length",
  "width",
  "height",
  "unit",
  "side",
  "triangleHeight",
  "lengthHalves",
  "widthHalves",
  "heightHalves",
  "dividendNumerator",
  "dividendDenominator",
  "divisorNumerator",
  "divisorDenominator",
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

function dataStats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length / 2;
  const median = sorted.length % 2 ? sorted[Math.floor(mid)] : (sorted[mid - 1] + sorted[mid]) / 2;
  const sum = values.reduce((total, value) => total + value, 0);
  return { mean: Math.round((sum / values.length) * 10) / 10, median };
}

function validDataTask(values) {
  return (
    Array.isArray(values) &&
    values.length >= 4 &&
    values.length <= 9 &&
    values.every((value) => inRangeInt(value, 0, 40))
  );
}

function makeDataTransfer(values) {
  return values.map((value, index) => (value + 7 + index * 3) % 31);
}

/** This task payload contains only a small, validated set of math values and grade. */
export function createDataExplanationUrl({ values, grade = 7 } = {}) {
  if (!inRangeInt(grade, 6, 8)) throw new RangeError("Data explanation grade must be from 6 to 8.");
  if (!validDataTask(values))
    throw new RangeError("Data values must contain 4–9 whole numbers from 0 to 40.");
  const params = new URLSearchParams({
    schema: MATH_LANGUAGE_BRIDGE_SCHEMA,
    task: "data-center",
    grade: String(grade),
    values: values.join(","),
  });
  return `https://thelanguagepage.com${MATH_LANGUAGE_BRIDGE_PATH}?${params}`;
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

/** Share only the Grade 3–8 fraction and partition for a number-line explanation task. */
export function createFractionNumberLineExplanationUrl({ numerator, denominator, grade = 3 } = {}) {
  if (!inRangeInt(grade, 3, 8))
    throw new RangeError("Fraction number-line grade must be from 3 to 8.");
  if (!inRangeInt(numerator, 1, 11) || !inRangeInt(denominator, numerator + 1, 12))
    throw new RangeError(
      "Fraction number-line values must be a proper fraction with denominator at most 12.",
    );
  const params = new URLSearchParams({
    schema: MATH_LANGUAGE_BRIDGE_SCHEMA,
    task: "fraction-number-line",
    grade: String(grade),
    numerator: String(numerator),
    denominator: String(denominator),
  });
  return `https://thelanguagepage.com${MATH_LANGUAGE_BRIDGE_PATH}?${params}`;
}

/** Share a bounded rectangular-prism surface-area investigation without learner data. */
export function createSurfaceAreaExplanationUrl({
  length,
  width,
  height,
  unit = "in",
  grade = 6,
} = {}) {
  if (!inRangeInt(grade, 4, 8)) throw new RangeError("Surface-area grade must be from 4 to 8.");
  if (
    ![length, width, height].every((value) => inRangeInt(value, 1, 20)) ||
    !["in", "cm"].includes(unit)
  ) {
    throw new RangeError(
      "Prism dimensions must be whole numbers from 1 to 20 with inches or centimeters.",
    );
  }
  const params = new URLSearchParams({
    schema: MATH_LANGUAGE_BRIDGE_SCHEMA,
    task: "surface-area-prism",
    grade: String(grade),
    length: String(length),
    width: String(width),
    height: String(height),
    unit,
  });
  return `https://thelanguagepage.com${MATH_LANGUAGE_BRIDGE_PATH}?${params}`;
}

/** Share a square-pyramid net prompt using its base side and triangle height only. */
export function createPyramidSurfaceAreaExplanationUrl({
  side,
  triangleHeight,
  grade = 6,
  unit = "cm",
} = {}) {
  if (!inRangeInt(grade, 4, 8)) throw new RangeError("Surface-area grade must be from 4 to 8.");
  if (
    !inRangeInt(side, 1, 20) ||
    !inRangeInt(triangleHeight, 1, 20) ||
    !["in", "cm"].includes(unit)
  ) {
    throw new RangeError(
      "Pyramid dimensions must be whole numbers from 1 to 20 with inches or centimeters.",
    );
  }
  const params = new URLSearchParams({
    schema: MATH_LANGUAGE_BRIDGE_SCHEMA,
    task: "surface-area-pyramid",
    grade: String(grade),
    side: String(side),
    triangleHeight: String(triangleHeight),
    unit,
  });
  return `https://thelanguagepage.com${MATH_LANGUAGE_BRIDGE_PATH}?${params}`;
}

/** Share a bounded fractional-edge prism using exact half-foot edge units. */
export function createFractionalVolumeExplanationUrl({
  lengthHalves,
  widthHalves,
  heightHalves,
  grade = 6,
} = {}) {
  if (!inRangeInt(grade, 5, 8))
    throw new RangeError("Fractional-volume grade must be from 5 to 8.");
  if (
    !inRangeInt(lengthHalves, 1, 19) ||
    !inRangeInt(widthHalves, 1, 12) ||
    !inRangeInt(heightHalves, 1, 14)
  ) {
    throw new RangeError(
      "Prism edge lengths must be positive half-foot units within the supported model bounds.",
    );
  }
  const params = new URLSearchParams({
    schema: MATH_LANGUAGE_BRIDGE_SCHEMA,
    task: "fractional-volume",
    grade: String(grade),
    lengthHalves: String(lengthHalves),
    widthHalves: String(widthHalves),
    heightHalves: String(heightHalves),
  });
  return `https://thelanguagepage.com${MATH_LANGUAGE_BRIDGE_PATH}?${params}`;
}

/** Share a bounded fraction-division problem with a fresh exact transfer item. */
export function createFractionDivisionExplanationUrl({
  dividendNumerator,
  dividendDenominator,
  divisorNumerator,
  divisorDenominator,
  grade = 6,
} = {}) {
  if (!inRangeInt(grade, 5, 8))
    throw new RangeError("Fraction-division grade must be from 5 to 8.");
  if (
    ![dividendNumerator, dividendDenominator, divisorNumerator, divisorDenominator].every((value) =>
      inRangeInt(value, 1, 12),
    )
  ) {
    throw new RangeError("Fraction-division terms must be positive integers from 1 to 12.");
  }
  const params = new URLSearchParams({
    schema: MATH_LANGUAGE_BRIDGE_SCHEMA,
    task: "fraction-division",
    grade: String(grade),
    dividendNumerator: String(dividendNumerator),
    dividendDenominator: String(dividendDenominator),
    divisorNumerator: String(divisorNumerator),
    divisorDenominator: String(divisorDenominator),
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
        : task === "data-center"
          ? new Set(["schema", "task", "grade", "values"])
          : task === "fraction-number-line"
            ? new Set(["schema", "task", "grade", "numerator", "denominator"])
            : task === "surface-area-prism"
              ? new Set(["schema", "task", "grade", "length", "width", "height", "unit"])
              : task === "surface-area-pyramid"
                ? new Set(["schema", "task", "grade", "side", "triangleHeight", "unit"])
                : task === "fractional-volume"
                  ? new Set([
                      "schema",
                      "task",
                      "grade",
                      "lengthHalves",
                      "widthHalves",
                      "heightHalves",
                    ])
                  : task === "fraction-division"
                    ? new Set([
                        "schema",
                        "task",
                        "grade",
                        "dividendNumerator",
                        "dividendDenominator",
                        "divisorNumerator",
                        "divisorDenominator",
                      ])
                    : null;
  if (!taskFields || [...params.keys()].some((key) => !ALLOWED.has(key) || !taskFields.has(key)))
    return null;
  const grade = Number(params.get("grade"));
  if (task === "surface-area-prism") {
    const length = Number(params.get("length"));
    const width = Number(params.get("width"));
    const height = Number(params.get("height"));
    const unit = params.get("unit");
    if (
      !inRangeInt(grade, 4, 8) ||
      ![length, width, height].every((value) => inRangeInt(value, 1, 20)) ||
      !["in", "cm"].includes(unit)
    )
      return null;
    const faceAreas = Object.freeze([length * width, length * height, width * height]);
    const transferDimensions = Object.freeze([length + 1, width + 1, height + 1]);
    return Object.freeze({
      schema: MATH_LANGUAGE_BRIDGE_SCHEMA,
      task,
      grade,
      length,
      width,
      height,
      unit,
      faceAreas,
      surfaceArea: 2 * faceAreas.reduce((sum, area) => sum + area, 0),
      transferDimensions,
      transferSurfaceArea:
        2 *
        (transferDimensions[0] * transferDimensions[1] +
          transferDimensions[0] * transferDimensions[2] +
          transferDimensions[1] * transferDimensions[2]),
    });
  }
  if (task === "surface-area-pyramid") {
    const side = Number(params.get("side"));
    const triangleHeight = Number(params.get("triangleHeight"));
    const unit = params.get("unit");
    if (
      !inRangeInt(grade, 4, 8) ||
      !inRangeInt(side, 1, 20) ||
      !inRangeInt(triangleHeight, 1, 20) ||
      !["in", "cm"].includes(unit)
    )
      return null;
    const triangleArea = (side * triangleHeight) / 2;
    const transferSide = side + 1;
    const transferTriangleHeight = triangleHeight + 1;
    return Object.freeze({
      schema: MATH_LANGUAGE_BRIDGE_SCHEMA,
      task,
      grade,
      side,
      triangleHeight,
      unit,
      baseArea: side * side,
      triangleArea,
      surfaceArea: side * side + 4 * triangleArea,
      transferSide,
      transferTriangleHeight,
      transferSurfaceArea: transferSide * transferSide + 2 * transferSide * transferTriangleHeight,
    });
  }
  if (task === "fractional-volume") {
    const lengthHalves = Number(params.get("lengthHalves"));
    const widthHalves = Number(params.get("widthHalves"));
    const heightHalves = Number(params.get("heightHalves"));
    if (
      !inRangeInt(grade, 5, 8) ||
      !inRangeInt(lengthHalves, 1, 19) ||
      !inRangeInt(widthHalves, 1, 12) ||
      !inRangeInt(heightHalves, 1, 14)
    )
      return null;
    const nextDimension = (value, max) => (value + 2 <= max ? value + 2 : value - 2);
    const transferDimensionsHalves = Object.freeze([
      nextDimension(lengthHalves, 19),
      nextDimension(widthHalves, 12),
      nextDimension(heightHalves, 14),
    ]);
    const volumeEighths = lengthHalves * widthHalves * heightHalves;
    const transferVolumeEighths = transferDimensionsHalves.reduce(
      (product, value) => product * value,
      1,
    );
    return Object.freeze({
      schema: MATH_LANGUAGE_BRIDGE_SCHEMA,
      task,
      grade,
      lengthHalves,
      widthHalves,
      heightHalves,
      volumeEighths,
      volumeCubicFeet: volumeEighths / 8,
      transferDimensionsHalves,
      transferVolumeEighths,
      transferCubicFeet: transferVolumeEighths / 8,
    });
  }
  if (task === "fraction-division") {
    const dividendNumerator = Number(params.get("dividendNumerator"));
    const dividendDenominator = Number(params.get("dividendDenominator"));
    const divisorNumerator = Number(params.get("divisorNumerator"));
    const divisorDenominator = Number(params.get("divisorDenominator"));
    if (
      !inRangeInt(grade, 5, 8) ||
      ![dividendNumerator, dividendDenominator, divisorNumerator, divisorDenominator].every(
        (value) => inRangeInt(value, 1, 12),
      )
    ) {
      return null;
    }
    const transferDividendNumerator = dividendNumerator + 1;
    const transferQuotientNumerator = transferDividendNumerator * divisorDenominator;
    const transferQuotientDenominator = dividendDenominator * divisorNumerator;
    const gcd = (a, b) => (b ? gcd(b, a % b) : a);
    const common = gcd(transferQuotientNumerator, transferQuotientDenominator);
    const quotientNumerator = dividendNumerator * divisorDenominator;
    const quotientDenominator = dividendDenominator * divisorNumerator;
    const quotientCommon = gcd(quotientNumerator, quotientDenominator);
    return Object.freeze({
      schema: MATH_LANGUAGE_BRIDGE_SCHEMA,
      task,
      grade,
      dividendNumerator,
      dividendDenominator,
      divisorNumerator,
      divisorDenominator,
      quotientNumerator: quotientNumerator / quotientCommon,
      quotientDenominator: quotientDenominator / quotientCommon,
      transferDividendNumerator,
      transferQuotientNumerator: transferQuotientNumerator / common,
      transferQuotientDenominator: transferQuotientDenominator / common,
    });
  }
  if (task === "data-center") {
    const values = String(params.get("values") || "")
      .split(",")
      .map(Number);
    if (!inRangeInt(grade, 6, 8) || !validDataTask(values)) return null;
    const transferValues = makeDataTransfer(values);
    const transfer = dataStats([...transferValues, 40]);
    return Object.freeze({
      schema: MATH_LANGUAGE_BRIDGE_SCHEMA,
      task,
      grade,
      values: Object.freeze(values),
      transferValues: Object.freeze(transferValues),
      selectedIndex: Math.floor((values.length - 1) / 2),
      transferMean: transfer.mean,
      transferMedian: transfer.median,
      transferOutlier: 40,
    });
  }
  if (task === "fraction-number-line") {
    const numerator = Number(params.get("numerator"));
    const denominator = Number(params.get("denominator"));
    if (
      !inRangeInt(grade, 3, 8) ||
      !inRangeInt(numerator, 1, 11) ||
      !inRangeInt(denominator, numerator + 1, 12)
    )
      return null;
    const transferDenominator = denominator === 12 ? 11 : denominator + 1;
    const transferNumerator = Math.min(transferDenominator - 1, numerator + 1);
    return Object.freeze({
      schema: MATH_LANGUAGE_BRIDGE_SCHEMA,
      task,
      grade,
      numerator,
      denominator,
      transferNumerator,
      transferDenominator,
    });
  }
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
