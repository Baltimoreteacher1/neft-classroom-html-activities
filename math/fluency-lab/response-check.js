// Graded interactive answers: the pure half. A practice item may carry `response` (plot a point, place a value or an
// inequality on a number line, build a dot plot or a box plot, shade a fraction, fill a ten-frame, build with base-ten
// blocks). The widget in response-widgets.js turns what the learner built into one short text value; this module
// reads that value back and grades it. It never needs the DOM, so practice, tests and reports share one rule.
//
// Value formats (also what item.answers holds):
//   work         learner lines after the given one, joined by ";" (line-work.js checks each against the line above)
//   point        "(x, y)"                 numberLine  "n" or "n/d"
//   inequality   ">= 3" (op, space, value) dotPlot     "count,count,…" one count per tick from min to max
//   boxPlot      "min,q1,median,q3,max"    fractionShade "shaded/parts"
//   tenFrame     "n"                       baseTen     "hundreds,tens,ones"

import { checkWork, splitLines } from "./line-work.js";

export const RESPONSE_TYPES = ["point", "numberLine", "inequality", "dotPlot", "boxPlot", "fractionShade", "tenFrame", "baseTen", "work"];
export const WORK_MODES = ["equation", "expression", "numeric"];
export const INEQUALITY_OPS = ["<", "<=", ">", ">="];
const EPS = 1e-9;

const gcd = (a, b) => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x || 1;
};
const clean = (value) =>
  String(value ?? "")
    .trim()
    .replaceAll("−", "-")
    .replaceAll("≤", "<=")
    .replaceAll("≥", ">=");

// "3", "-2.5", "3/4", "-1 1/2" -> number (NaN when unreadable).
export function readNumber(text) {
  const value = clean(text).replaceAll(",", "");
  const mixed = /^([+-]?)(\d+)\s+(\d+)\/(\d+)$/.exec(value);
  if (mixed)
    return (mixed[1] === "-" ? -1 : 1) * (Number(mixed[2]) + Number(mixed[3]) / Number(mixed[4]));
  const frac = /^([+-]?\d+)\/(\d+)$/.exec(value);
  if (frac) return Number(frac[2]) ? Number(frac[1]) / Number(frac[2]) : Number.NaN;
  return /^[+-]?(\d+\.?\d*|\.\d+)$/.test(value) ? Number(value) : Number.NaN;
}

// A tick on a line cut into `den` parts per whole, written the way the item shows it: whole numbers plain,
// other values as a fraction (or mixed number when `mixed`).
export function tickText(value, den = 1, { mixed = false } = {}) {
  const n = Math.round(value * den);
  if (n % den === 0) return String(n / den).replace("-", "−");
  const g = gcd(n, den);
  const [rn, rd] = [n / g, den / g];
  const sign = rn < 0 ? "−" : "";
  const abs = Math.abs(rn);
  if (mixed && abs > rd) return `${sign}${Math.floor(abs / rd)} ${abs % rd}/${rd}`;
  return `${sign}${abs}/${rd}`;
}

export const pointText = (x, y) =>
  `(${String(x).replace("-", "−")}, ${String(y).replace("-", "−")})`;
export const inequalityText = (op, value, variable = "x") =>
  `${variable} ${{ "<": "<", "<=": "≤", ">": ">", ">=": "≥" }[op]} ${String(value).replace("-", "−")}`;

export function readPoint(text) {
  const match = /^\(?\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*\)?$/.exec(clean(text));
  return match ? [Number(match[1]), Number(match[2])] : null;
}
export function readInequality(text) {
  const match = /^(?:x\s*)?(<=|>=|<|>)\s*(.+)$/.exec(clean(text));
  if (!match) return null;
  const value = readNumber(match[2]);
  return Number.isFinite(value) ? { op: match[1], value } : null;
}
const readList = (text) => {
  const parts = clean(text)
    .split(",")
    .map((part) => part.trim());
  if (!parts.length || parts.some((part) => part === "")) return null;
  const values = parts.map(readNumber);
  return values.every(Number.isFinite) ? values : null;
};

// Five-number summary with the median-of-halves quartiles Grade 6 uses (the middle value is left out of both halves
// when the count is odd).
export function fiveNumber(values) {
  const data = [...values].sort((a, b) => a - b);
  const median = (list) => {
    const mid = Math.floor(list.length / 2);
    return list.length % 2 ? list[mid] : (list[mid - 1] + list[mid]) / 2;
  };
  const half = Math.floor(data.length / 2);
  return [
    data[0],
    median(data.slice(0, half)),
    median(data),
    median(data.slice(data.length - half)),
    data.at(-1),
  ];
}

// Dot-plot counts for a data list on ticks min..max (step 1).
export function dotCounts(values, min, max) {
  const counts = Array.from({ length: max - min + 1 }, () => 0);
  for (const value of values) counts[value - min] += 1;
  return counts;
}

// Grade a value. Returns { ok, nudge } where nudge is an English key for t(): it names what to look at again and
// never states the answer.
export function checkResponse(value, item) {
  const response = item?.response;
  const fail = (nudge) => ({ ok: false, nudge });
  if (!response) return fail("Build an answer first.");
  const target = response.target;
  switch (response.type) {
    case "point": {
      const got = readPoint(value);
      if (!got) return fail("Place a point on the grid first.");
      const [x, y] = got;
      if (x === target[0] && y === target[1]) return { ok: true };
      if (x === target[1] && y === target[0] && x !== y)
        return fail(
          "The x-coordinate tells how far to move left or right; the y-coordinate tells up or down.",
        );
      if (x !== target[0])
        return fail("Check the x-coordinate: count left or right from the origin.");
      return fail("Check the y-coordinate: count up or down from the x-axis.");
    }
    case "numberLine": {
      const got = readNumber(value);
      if (!Number.isFinite(got)) return fail("Place a point on the number line first.");
      if (Math.abs(got - target) < EPS) return { ok: true };
      return fail(
        got < target
          ? "Your point is too far left. Count the equal parts again."
          : "Your point is too far right. Count the equal parts again.",
      );
    }
    case "inequality": {
      const got = readInequality(value);
      if (!got) return fail("Place the circle, then choose a direction.");
      const sameValue = Math.abs(got.value - target.value) < EPS;
      const sameDirection = got.op[0] === target.op[0];
      const sameEnd = got.op.length === target.op.length;
      if (sameValue && sameDirection && sameEnd) return { ok: true };
      if (!sameValue) return fail("Check where the circle sits: it marks the boundary number.");
      if (!sameDirection)
        return fail("Check the direction: which side holds the numbers that make it true?");
      return fail(
        "Check the circle: closed means the boundary number is included, open means it is not.",
      );
    }
    case "dotPlot": {
      const got = readList(value);
      if (!got || got.length !== target.length)
        return fail("Add dots above the number line first.");
      const total = got.reduce((sum, n) => sum + n, 0);
      const want = target.reduce((sum, n) => sum + n, 0);
      if (got.every((n, i) => n === target[i])) return { ok: true };
      if (total !== want) return fail("Count your dots: each data value gets exactly one dot.");
      return fail("Every data value needs its dot above its own number. Check each column.");
    }
    case "boxPlot": {
      const got = readList(value);
      if (!got || got.length !== 5) return fail("Set all five parts of the box plot.");
      if (got.some((n, i) => i && n < got[i - 1]))
        return fail("The five parts go in order: minimum, Q1, median, Q3, maximum.");
      const wrong = got.findIndex((n, i) => Math.abs(n - target[i]) > EPS);
      if (wrong < 0) return { ok: true };
      return fail(
        [
          "Check the minimum: the least data value.",
          "Check Q1: the middle of the lower half.",
          "Check the median: the middle of all the data.",
          "Check Q3: the middle of the upper half.",
          "Check the maximum: the greatest data value.",
        ][wrong],
      );
    }
    case "fractionShade": {
      const match = /^(\d+)\/(\d+)$/.exec(clean(value));
      if (!match || Number(match[1]) === 0) return fail("Tap parts of the bar to shade them.");
      const got = Number(match[1]) / Number(match[2]);
      if (Math.abs(got - target[0] / target[1]) < EPS) return { ok: true };
      return fail(
        got < target[0] / target[1]
          ? "Too few parts are shaded. What fraction does each part show?"
          : "Too many parts are shaded. What fraction does each part show?",
      );
    }
    case "tenFrame": {
      const got = readNumber(value);
      if (!Number.isFinite(got) || got === 0) return fail("Tap the boxes to fill the ten-frame.");
      if (got === target) return { ok: true };
      return fail(got < target ? "Count again. You need more." : "Count again. You have too many.");
    }
    case "baseTen": {
      const got = readList(value);
      if (!got || got.length !== 3 || got.every((n) => n === 0))
        return fail("Add blocks to build the number.");
      const [h, t, o] = got;
      if (h * 100 + t * 10 + o === target) return { ok: true };
      return fail(
        h * 100 + t * 10 + o < target
          ? "Your blocks show less than the number. Count by hundreds, tens, then ones."
          : "Your blocks show more than the number. Count by hundreds, tens, then ones.",
      );
    }
    case "work": {
      const lines = splitLines(value);
      if (!lines.length) return fail("Write your next line under the given one.");
      const verdict = checkWork([response.start, ...lines], response);
      return verdict.ok ? { ok: true, lines: verdict.lines } : { ok: false, nudge: verdict.nudge, vars: verdict.vars, lines: verdict.lines };
    }
    default:
      return fail("Build an answer first.");
  }
}

// True when an item asks for a built answer the typed keypad cannot give.
export const isResponseItem = (item) =>
  Boolean(item?.response && RESPONSE_TYPES.includes(item.response.type));

// A saved or imported `response` (a missed problem kept for repair) is rebuilt from known fields only, so a backup
// file cannot inject markup or an oversized control. Returns null when it is not a usable response.
export function cleanResponse(response) {
  if (!response || typeof response !== "object" || !RESPONSE_TYPES.includes(response.type)) return null;
  const num = (value, lo = -1000, hi = 1000) => (typeof value === "number" && Number.isFinite(value) && value >= lo && value <= hi ? value : null);
  const out = { type: response.type };
  for (const key of ["min", "max", "den", "labelEvery", "parts", "frames"]) {
    if (response[key] === undefined) continue;
    if (num(response[key]) === null) return null;
    out[key] = response[key];
  }
  if (Array.isArray(response.places)) out.places = response.places.filter((place) => ["hundreds", "tens", "ones"].includes(place));
  if (typeof response.variable === "string" && /^[a-z]$/.test(response.variable)) out.variable = response.variable;
  if (typeof response.mixed === "boolean") out.mixed = response.mixed;
  if (response.type === "work") {
    if (!WORK_MODES.includes(response.mode) || typeof response.start !== "string" || response.start.length > 120 || !/^[0-9a-z+\-−*×·÷/^()=.,\s]+$/i.test(response.start)) return null;
    return { type: "work", mode: response.mode, start: response.start, variable: out.variable || "x" };
  }
  const target = response.target;
  if (Array.isArray(target) && target.length <= 40 && target.every((n) => num(n) !== null)) out.target = [...target];
  else if (num(target) !== null) out.target = target;
  else if (target && typeof target === "object" && INEQUALITY_OPS.includes(target.op) && num(target.value) !== null) out.target = { op: target.op, value: target.value };
  else return null;
  if (out.min !== undefined && out.max !== undefined && !(out.max > out.min && out.max - out.min <= 40)) return null;
  if (out.parts !== undefined && !(Number.isInteger(out.parts) && out.parts >= 2 && out.parts <= 24)) return null;
  return out;
}

// Strings passed to t() by variable (nudges from this module and line-work.js, and the widget part names), so the
// Spanish coverage test can see them. tools/fluency-response-items.test.mjs proves every nudge produced is listed.
export const RESPONSE_I18N_KEYS = [
  "Minimum",
  "Q1",
  "Median",
  "Q3",
  "Maximum",
  "Hundreds",
  "Tens",
  "Ones",
  "Build an answer first.",
  "Place a point on the grid first.",
  "The x-coordinate tells how far to move left or right; the y-coordinate tells up or down.",
  "Check the x-coordinate: count left or right from the origin.",
  "Check the y-coordinate: count up or down from the x-axis.",
  "Place a point on the number line first.",
  "Your point is too far left. Count the equal parts again.",
  "Your point is too far right. Count the equal parts again.",
  "Place the circle, then choose a direction.",
  "Check where the circle sits: it marks the boundary number.",
  "Check the direction: which side holds the numbers that make it true?",
  "Check the circle: closed means the boundary number is included, open means it is not.",
  "Add dots above the number line first.",
  "Count your dots: each data value gets exactly one dot.",
  "Every data value needs its dot above its own number. Check each column.",
  "Set all five parts of the box plot.",
  "The five parts go in order: minimum, Q1, median, Q3, maximum.",
  "Check the minimum: the least data value.",
  "Check Q1: the middle of the lower half.",
  "Check the median: the middle of all the data.",
  "Check Q3: the middle of the upper half.",
  "Check the maximum: the greatest data value.",
  "Tap parts of the bar to shade them.",
  "Too few parts are shaded. What fraction does each part show?",
  "Too many parts are shaded. What fraction does each part show?",
  "Tap the boxes to fill the ten-frame.",
  "Count again. You need more.",
  "Count again. You have too many.",
  "Add blocks to build the number.",
  "Your blocks show less than the number. Count by hundreds, tens, then ones.",
  "Your blocks show more than the number. Count by hundreds, tens, then ones.",
  "Solve. Write one step per line.",
  "Rewrite. Write one step per line.",
  "Simplify. Write one step per line.",
  "Write your next line under the given one.",
  "Line {n} cannot be read as an equation. Use one = sign.",
  "Line {n} cannot be read. Check the symbols.",
  "Line {n} changes the solution. Check the step from the line above.",
  "Line {n} changes the value. Check the step from the line above.",
  "Every line is correct. Keep going until the variable is alone on one side.",
  "Every line is correct. Keep going until one number is left.",
  "Every line is correct. Keep going until like terms are combined and no parentheses are left.",
];
