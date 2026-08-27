// long-division-steps.js — the pure half of the Long Division Lab.
//
// No DOM, no dependencies: given a dividend and a divisor it returns the
// STANDARD algorithm as an explicit list of Divide → Multiply → Subtract →
// Bring Down steps, plus everything the notation grid needs to draw itself in
// place-value alignment. Keeping it separate is what makes the algorithm
// testable — tools/long-division-builder.test.mjs drives this file directly.
//
// Everything is integer arithmetic over a digit array, so decimals never touch
// floating point: the decimal path shifts the point (the classroom move) and
// then runs the identical whole-number cycle.

/** @typedef {"divide"|"multiply"|"subtract"|"bringdown"} LDStepType */

/**
 * @typedef {Object} LDCycle
 * @property {number} index          Dividend-digit column this cycle works at.
 * @property {number} current        The working number before dividing.
 * @property {number} quotientDigit  Digit written above column `index`.
 * @property {number} product        quotientDigit × divisor.
 * @property {number} difference     current − product (always < divisor).
 * @property {{digit:number,index:number}|null} bringDown Next digit, or null on the last cycle.
 */

/**
 * @typedef {Object} LDStep
 * @property {LDStepType} type
 * @property {string} label
 * @property {number} cycle     Zero-based cycle index.
 * @property {number} index     Dividend-digit column.
 * @property {number} expected  The number the student must enter.
 * @property {string} prompt
 * @property {string} hint
 */

/** The four step names, in the order they repeat. */
export const CYCLE_LABELS = Object.freeze(["Divide", "Multiply", "Subtract", "Bring Down"]);

/**
 * The DMSB mnemonic letter and the operator symbol for each cycle position, so
 * the live step strip can carry the same badges as the DMSB banner above the
 * board. Same order and same index as CYCLE_LABELS — one list, one numbering.
 */
export const CYCLE_BADGES = Object.freeze([
  Object.freeze({ letter: "D", op: "÷" }),
  Object.freeze({ letter: "M", op: "×" }),
  Object.freeze({ letter: "S", op: "−" }),
  Object.freeze({ letter: "B", op: "↓" }),
]);

/** The step types, in the order they repeat — the index IS the position. */
const CYCLE_TYPES = Object.freeze(["divide", "multiply", "subtract", "bringdown"]);

/**
 * Where a step sits inside the four-name cycle, 0–3 (−1 if it is not a step
 * type). Single source of truth for the strip, the "Step 2 — MULTIPLY" heading
 * and the narration, so those three can never number the cycle differently.
 * @param {string} type
 * @returns {number}
 */
export function stepPosition(type) {
  return CYCLE_TYPES.indexOf(String(type));
}

const LABEL_OF = Object.freeze({
  divide: "Divide",
  multiply: "Multiply",
  subtract: "Subtract",
  bringdown: "Bring Down",
});

const MAX_DIGITS = 24;

/**
 * Render a number as a plain decimal string (never exponent notation).
 * @param {unknown} value
 * @returns {string|null} null when the value is not a finite number.
 */
function plainString(value) {
  const clean = typeof value === "string" ? value.replace(/,/g, "").trim() : value;
  const n = typeof clean === "number" ? clean : Number(String(clean ?? "").trim());
  if (!Number.isFinite(n)) return null;
  let s = String(n);
  if (s.includes("e") || s.includes("E")) s = n.toFixed(12);
  if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s;
}

/**
 * Split "12.34" into its digit array and the index the decimal point sits before.
 * @param {string} text
 * @returns {{digits:number[], pointAt:number}}
 */
function splitParts(text) {
  const cleaned = String(text ?? "")
    .replace(/,/g, "")
    .trim();
  const dot = cleaned.indexOf(".");
  const rawInt = dot === -1 ? cleaned : cleaned.slice(0, dot);
  const rawFrac = dot === -1 ? "" : cleaned.slice(dot + 1);
  let intPart = rawInt.replace(/^0+(?=\d)/, "");
  if (intPart === "") intPart = "0";
  return {
    digits: (intPart + rawFrac).split("").map(Number),
    pointAt: intPart.length,
  };
}

/**
 * Join a digit array back into a decimal string with the point at `pointAt`.
 * @param {(number|null)[]} digits
 * @param {number} pointAt
 * @param {string} blank Character used for columns with no digit.
 */
function joinDigits(digits, pointAt, blank = "0") {
  const chars = digits.map((d) => (d === null ? blank : String(d)));
  let head = chars
    .slice(0, pointAt)
    .join("")
    .replace(/^0+(?=\d)/, "");
  if (head === "") head = "0";
  const tail = chars.slice(pointAt).join("");
  return tail ? `${head}.${tail}` : head;
}

/**
 * Show an integer scaled down by 10^places, e.g. (200, 3) -> "0.2".
 * @param {number} value
 * @param {number} places
 */
function scaleDown(value, places) {
  if (places <= 0) return String(value);
  const padded = String(value).padStart(places + 1, "0");
  const cut = padded.length - places;
  return `${padded.slice(0, cut)}.${padded.slice(cut)}`.replace(/0+$/, "").replace(/\.$/, "");
}

/**
 * Build the whole standard-algorithm walkthrough for one division.
 *
 * @param {{dividend?:unknown, divisor?:unknown, decimal?:boolean, maxPlaces?:number}} options
 * @returns {{
 *   decimal:boolean, shift:number, divisor:number,
 *   dividendText:string, divisorText:string,
 *   workingDividendText:string, workingDivisorText:string,
 *   digits:number[], pointAt:number,
 *   quotientDigits:(number|null)[], firstIndex:number,
 *   quotientText:string, remainder:number, remainderText:string,
 *   exact:boolean, cycles:LDCycle[], steps:LDStep[], checkText:string,
 * }}
 * @throws {RangeError} on a zero, negative, or non-numeric divisor.
 */
export function buildLongDivision(options = {}) {
  const decimal = options.decimal === true;
  let dividendText = plainString(options.dividend);
  let divisorText = plainString(options.divisor);
  if (dividendText === null) throw new RangeError("long division needs a finite dividend");
  if (divisorText === null) throw new RangeError("long division needs a finite divisor");
  if (!decimal) {
    dividendText = String(Math.floor(Number(dividendText)));
    divisorText = String(Math.floor(Number(divisorText)));
  }
  if (Number(dividendText) < 0 || Number(divisorText) < 0) {
    throw new RangeError("long division needs non-negative numbers");
  }
  if (Number(divisorText) === 0) throw new RangeError("cannot divide by zero");

  // 1. Move the point so the divisor is a whole number (the classroom move).
  const dv = splitParts(divisorText);
  const shift = dv.digits.length - dv.pointAt;
  const divisor = Number(dv.digits.join(""));
  if (!Number.isFinite(divisor) || divisor <= 0) throw new RangeError("cannot divide by zero");

  const dd = splitParts(dividendText);
  const digits = dd.digits.slice();
  let pointAt = dd.pointAt + shift;
  while (digits.length < pointAt) digits.push(0);
  while (digits.length > 1 && digits[0] === 0 && pointAt > 1) {
    digits.shift();
    pointAt -= 1;
  }

  // 2. Keep annexing zeros while the division has not ended, up to maxPlaces.
  const maxPlaces = decimal
    ? Math.max(0, Math.min(6, Math.floor(Number(options.maxPlaces ?? 3)) || 0))
    : 0;
  let rem = 0;
  // Count the zeros ANNEXED here, as distinct from the zeros that belong to the
  // shifted number itself. 9 ÷ 0.4 becomes 90 ÷ 4 — that zero is part of the
  // dividend. The zeros after it exist only because the division has a
  // remainder, and by hand a student writes them one at a time as they are
  // needed. Rendering them up front turned the dividend into "90.00", which
  // announces how many decimal places the answer will have before any dividing
  // has happened (Joel, 2026-08-27: "too many zeros at the end").
  let annexed = 0;
  for (let i = 0; ; i += 1) {
    if (i >= digits.length) {
      if (rem === 0) break;
      if (digits.length - pointAt >= maxPlaces || digits.length >= MAX_DIGITS) break;
      digits.push(0);
      annexed += 1;
    }
    rem = (rem * 10 + digits[i]) % divisor;
  }

  // 3. Run the cycle. Leading columns whose prefix is smaller than the divisor
  //    get no quotient digit — exactly as nothing is written above them by hand.
  const cycles = /** @type {LDCycle[]} */ ([]);
  let idx = 0;
  let current = 0;
  while (idx < digits.length - 1 && current * 10 + digits[idx] < divisor) {
    current = current * 10 + digits[idx];
    idx += 1;
  }
  current = current * 10 + digits[idx];
  const firstIndex = idx;
  let remainder = 0;
  for (;;) {
    const quotientDigit = Math.floor(current / divisor);
    const product = quotientDigit * divisor;
    const difference = current - product;
    const next = idx + 1;
    const hasNext = next < digits.length;
    cycles.push({
      index: idx,
      current,
      quotientDigit,
      product,
      difference,
      bringDown: hasNext ? { digit: digits[next], index: next } : null,
    });
    if (!hasNext) {
      remainder = difference;
      break;
    }
    current = difference * 10 + digits[next];
    idx = next;
  }

  const quotientDigits = /** @type {(number|null)[]} */ (digits.map(() => null));
  for (const c of cycles) quotientDigits[c.index] = c.quotientDigit;

  const places = digits.length - pointAt;
  const quotientText = joinDigits(quotientDigits, pointAt);
  // The dividend as it is WRITTEN when the problem is set up: the shifted
  // number, without the zeros the cycle will annex later. Trailing "." is
  // trimmed, since nobody writes "90." on the board.
  const writtenDigits = annexed ? digits.slice(0, digits.length - annexed) : digits;
  const workingDividendText = joinDigits(
    writtenDigits,
    Math.min(pointAt, writtenDigits.length),
  ).replace(/\.$/, "");
  // The full shifted dividend, annexed zeros included — what the check line and
  // the completed tableau legitimately refer to.
  const fullDividendText = joinDigits(digits, pointAt);
  const remainderText = scaleDown(remainder, places);
  // When a decimal division comes out even, the honest check is against the
  // numbers the student was HANDED, not the shifted ones: 0.4 × 31.5 = 12.6.
  const checkText =
    decimal && remainder === 0
      ? `${divisorText} × ${quotientText} = ${dividendText}`
      : `${divisor} × ${quotientText}${remainder ? ` + ${remainderText}` : ""} = ${fullDividendText}`;

  return {
    decimal,
    shift,
    divisor,
    dividendText,
    divisorText,
    workingDividendText,
    fullDividendText,
    annexed,
    workingDivisorText: String(divisor),
    digits,
    pointAt,
    quotientDigits,
    firstIndex,
    quotientText,
    remainder,
    remainderText,
    exact: remainder === 0,
    cycles,
    steps: buildSteps(cycles, divisor),
    checkText,
  };
}

/**
 * Turn the cycles into the student-facing step list.
 * @param {LDCycle[]} cycles
 * @param {number} divisor
 * @returns {LDStep[]}
 */
function buildSteps(cycles, divisor) {
  const steps = /** @type {LDStep[]} */ ([]);
  cycles.forEach((c, cycle) => {
    const at = { cycle, index: c.index };
    steps.push({
      ...at,
      type: "divide",
      label: LABEL_OF.divide,
      expected: c.quotientDigit,
      prompt: `How many ${divisor}s fit into ${c.current}?`,
      hint:
        c.current < divisor
          ? `${divisor} is bigger than ${c.current}, so no whole ${divisor} fits yet. Write 0 here and keep going.`
          : `Skip-count: ${divisor}, ${divisor * 2}, ${divisor * 3}, … Take the biggest one that is still ` +
            `${c.current} or less. The answer is one digit (0–9).`,
    });
    steps.push({
      ...at,
      type: "multiply",
      label: LABEL_OF.multiply,
      expected: c.product,
      prompt: `Multiply: ${c.quotientDigit} × ${divisor} = ?`,
      hint: `Multiply the digit you just wrote, ${c.quotientDigit}, by the divisor ${divisor}. Write the product under ${c.current}.`,
    });
    steps.push({
      ...at,
      type: "subtract",
      label: LABEL_OF.subtract,
      expected: c.difference,
      prompt: `Subtract: ${c.current} − ${c.product} = ?`,
      hint: `Take ${c.product} away from ${c.current}. The difference must be smaller than the divisor ${divisor} — if it is not, the digit you chose was too small.`,
    });
    if (c.bringDown) {
      steps.push({
        ...at,
        type: "bringdown",
        label: LABEL_OF.bringdown,
        expected: c.bringDown.digit,
        prompt: `Bring down the next digit: ${c.bringDown.digit}.`,
        hint: `Pull the ${c.bringDown.digit} straight down next to ${c.difference} to make the new number to divide.`,
      });
    }
  });
  return steps;
}

// ── What a student is allowed to type ──────────────────────────────────────
// The lab is a free-entry tool, so both numbers arrive as raw text from a sixth
// grader. Handing that straight to buildLongDivision has two bad endings: an
// empty box becomes 0 and the board silently redraws a problem nobody asked
// for, and anything unparseable surfaces the internal RangeError text ("long
// division needs a finite dividend"), which names no fix a student can make.
// checkInputs() answers first, in classroom English, and says which box to fix.

/** Longest numbers the notation grid can still show legibly on a phone. */
const MAX_DIVIDEND_DIGITS = 7;
const MAX_DIVISOR_DIGITS = 4;

/**
 * Significant digits in what was typed — the point and leading zeros do not count.
 * @param {string} text
 */
function digitCount(text) {
  return String(text)
    .replace(/[^0-9]/g, "")
    .replace(/^0+(?=\d)/, "").length;
}

/**
 * @typedef {Object} LDVerdict
 * @property {boolean} ok       false = do not build a plan at all.
 * @property {string} message   Empty when there is nothing worth saying.
 * @property {"bad"|"info"} tone
 * @property {"dividend"|"divisor"|null} field Which box should take focus.
 */

/**
 * Judge a typed dividend/divisor pair before any plan is built.
 *
 * `ok: true` with a message is a NOTICE, not a rejection: whole-number mode
 * truncating a typed decimal, and a divisor larger than the dividend, are both
 * legitimate problems that surprise students, so the lab says what it is about
 * to do instead of appearing to ignore them.
 *
 * @param {{dividend?:unknown, divisor?:unknown, decimal?:boolean}} input
 * @returns {LDVerdict}
 */
export function checkInputs(input = {}) {
  const decimal = input.decimal === true;
  const d = String(input.dividend ?? "").trim();
  const v = String(input.divisor ?? "").trim();
  /** @type {(message:string, field:"dividend"|"divisor") => LDVerdict} */
  const stop = (message, field) => ({ ok: false, message, tone: "bad", field });
  /** @type {(message?:string) => LDVerdict} */
  const go = (message = "") => ({ ok: true, message, tone: "info", field: null });

  if (d === "") return stop("Type a dividend first — the number being divided.", "dividend");
  if (v === "") return stop("Type a divisor first — the number you are dividing by.", "divisor");

  const cleanD = d.replace(/,/g, "");
  const cleanV = v.replace(/,/g, "");
  const dn = Number(cleanD);
  const vn = Number(cleanV);
  if (!Number.isFinite(dn)) {
    return stop(`“${d}” is not a number. Use digits only, like 754.`, "dividend");
  }
  if (!Number.isFinite(vn)) {
    return stop(`“${v}” is not a number. Use digits only, like 6.`, "divisor");
  }
  if (dn < 0) {
    return stop("Use a dividend of 0 or more — this lab divides positive numbers.", "dividend");
  }
  if (vn < 0) {
    return stop("Use a divisor of 1 or more — this lab divides positive numbers.", "divisor");
  }
  if (vn === 0) {
    return stop(
      "You cannot divide by 0 — no number of empty groups will ever fill a number. Try a divisor of 1 or more.",
      "divisor",
    );
  }
  if (!decimal && Math.floor(vn) === 0) {
    return stop(
      `This lab is set to whole numbers, so ${v} would become 0 — and nothing can be divided by 0. Type a divisor of 1 or more.`,
      "divisor",
    );
  }
  if (digitCount(d) > MAX_DIVIDEND_DIGITS) {
    return stop(
      `That dividend has ${digitCount(d)} digits. Use ${MAX_DIVIDEND_DIGITS} or fewer so the whole board still fits on the screen.`,
      "dividend",
    );
  }
  if (digitCount(v) > MAX_DIVISOR_DIGITS) {
    return stop(
      `That divisor has ${digitCount(v)} digits. Use ${MAX_DIVISOR_DIGITS} or fewer so the whole board still fits on the screen.`,
      "divisor",
    );
  }
  if (!decimal && (d.includes(".") || v.includes("."))) {
    return go(
      `Heads up: this lab is set to whole numbers, so ${d} ÷ ${v} is worked as ${Math.floor(dn)} ÷ ${Math.floor(vn)}.`,
    );
  }
  // Only in whole-number mode: with decimals the lab annexes zeros instead, so
  // 3 ÷ 4 is 0.75 and nothing is "left over".
  if (!decimal && dn > 0 && vn > dn) {
    return go(
      `${v} is bigger than ${d}, so the quotient starts with 0 and the whole ${d} is left over. That is a real answer — watch what the algorithm does with it.`,
    );
  }
  return go();
}

export default buildLongDivision;
