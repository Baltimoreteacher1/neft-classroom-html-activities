// Circuit Breaker rounds: add/subtract decimals by aligning place values
// (6.NOS.3), divide by partial quotients (6.NOS.2, 6.NOS.3) and multiply
// decimals by counting decimal places (6.NOS.3, lesson 2-12). Pure, no DOM.
//
// Every quantity is an integer number of HUNDREDTHS, so the arithmetic is exact.
// Place index 0..5 = 1000, 100, 10, 1, 0.1, 0.01; the decimal point (the
// grounding bar) sits between index 3 and index 4.

import { pick, randInt } from "../core/math.js";

export const PLACES = [100000, 10000, 1000, 100, 10, 1]; // place values in hundredths
export const PLACE_COUNT = 6;
export const ONES = 3;
export const LIMIT = 1000000; // everything stays below 10,000
export const MODES = ["align", "divide", "multiply"];

/** Round 1, 2, 3, 4… → align, divide, multiply, align… */
export function modeForRound(roundIndex) {
  return MODES[(roundIndex - 1) % MODES.length];
}

/** Digit of a hundredths value at place index p. */
export function digitAt(h, p) {
  return Math.floor(h / PLACES[p]) % 10;
}

/** Place index of the leading digit (the ones place for values under 1). */
export function leadIndex(h) {
  for (let p = 0; p < ONES; p++) if (h >= PLACES[p]) return p;
  return ONES;
}

/** Hundredths → decimal text without trailing zeros ("12.5", "3.47", "8"). */
export function hText(h) {
  const whole = Math.floor(h / 100);
  const frac = h % 100;
  if (frac === 0) return String(whole);
  return frac % 10 === 0 ? `${whole}.${frac / 10}` : `${whole}.${frac < 10 ? "0" : ""}${frac}`;
}

/** A decimal with exactly `dp` decimal places (last digit non-zero). */
function decimalNumber(next, dp, lo, hi) {
  const whole = randInt(next, lo, hi);
  if (dp === 0) return whole * 100;
  if (dp === 1) return whole * 100 + randInt(next, 1, 9) * 10;
  return whole * 100 + randInt(next, 0, 9) * 10 + randInt(next, 1, 9);
}

const ALIGN_WHOLE = [null, [1, 60], [1, 300], [1, 999], [10, 2500]];

/**
 * An align round: a ± b with different decimal lengths, so lining up the last
 * digits (the classic error) is NOT lining up the decimal points.
 * @param {number} level @param {() => number} next
 */
export function makeAlign(level, next) {
  const op = level === 1 ? "+" : level === 2 ? pick(next, ["+", "-"]) : pick(next, ["+", "-", "-"]);
  const [lo, hi] = ALIGN_WHOLE[level];
  for (;;) {
    const aDp = randInt(next, 0, 2);
    let bDp = randInt(next, 0, 2);
    if (bDp === aDp && (level === 1 || next() < 0.75)) bDp = (aDp + randInt(next, 1, 2)) % 3;
    let a = decimalNumber(next, aDp, lo, hi);
    let b = decimalNumber(next, bDp, 0, Math.max(1, Math.floor(hi / (op === "-" ? 1 : 2))));
    let dpA = aDp;
    let dpB = bDp;
    if (op === "-" && b > a) {
      [a, b] = [b, a];
      [dpA, dpB] = [dpB, dpA];
    }
    if (a === b || b === 0) continue;
    const result = op === "+" ? a + b : a - b;
    if (result <= 0 || result >= LIMIT) continue;
    const park = dpA !== dpB ? dpA - dpB : 1;
    return { mode: "align", op, a, b, aDp: dpA, bDp: dpB, result, park };
  }
}

/** Column-by-column digits with no carrying or borrowing (the no-regroup error). */
export function noRegroupDigits(r) {
  const out = [];
  for (let p = 0; p < PLACE_COUNT; p++) {
    const x = digitAt(r.a, p);
    const y = digitAt(r.b, p);
    out.push(r.op === "+" ? (x + y) % 10 : Math.abs(x - y));
  }
  return out;
}

/**
 * Judge an align attempt: alignment first, then the output wheels.
 * @param {{op: string, a: number, b: number, result: number}} r
 * @param {number} shift columns the lower conduit sits right (+) of aligned
 * @param {number[]} wheels digit per place index 0..5
 * @returns {{verdict: "ok"|"misaligned"|"high"|"low", place?: number, slideLeft?: boolean, noRegroup?: boolean}}
 */
export function judgeAlign(r, shift, wheels) {
  if (shift !== 0) return { verdict: "misaligned", slideLeft: shift > 0 };
  let value = 0;
  for (let p = 0; p < PLACE_COUNT; p++) value += wheels[p] * PLACES[p];
  if (value === r.result) return { verdict: "ok" };
  let place = 0;
  while (place < PLACE_COUNT && wheels[place] === digitAt(r.result, place)) place++;
  const naive = noRegroupDigits(r);
  let noRegroup = true;
  for (let p = 0; p < PLACE_COUNT; p++) if (wheels[p] !== naive[p]) noRegroup = false;
  return { verdict: value > r.result ? "high" : "low", place, noRegroup };
}

/**
 * A divide round. dividend and divisor are in hundredths.
 * Level 1: 3-digit ÷ 1-digit with a remainder. Level 2: 4-digit ÷ 1- or 2-digit.
 * Level 3: decimal ÷ whole number, exact to hundredths. Level 4: decimal ÷ a
 * tenths divisor (scale both by 10 once) or a hundredths divisor (scale twice), exact.
 * @param {number} level @param {() => number} next
 */
export function makeDivide(level, next) {
  for (;;) {
    if (level <= 2) {
      const d =
        level === 1
          ? randInt(next, 2, 9)
          : next() < 0.5
            ? randInt(next, 3, 9)
            : randInt(next, 11, 25);
      const lo = level === 1 ? 100 : 1000;
      const hi = level === 1 ? 999 : 9999;
      const D = randInt(next, lo, hi);
      if (Math.floor(D / d) < 10) continue;
      return {
        mode: "divide",
        dividend: D * 100,
        divisor: d * 100,
        decimal: false,
        q: Math.floor(D / d) * 100,
        r: (D % d) * 100,
      };
    }
    if (level === 3) {
      const d = randInt(next, 2, 9);
      const q = randInt(next, 101, 9999); // hundredths: 1.01 .. 99.99
      const D = q * d;
      if (D % 100 === 0 || D >= 100000 || q % 100 === 0) continue;
      return { mode: "divide", dividend: D, divisor: d * 100, decimal: true, q, r: 0 };
    }
    if (next() < 0.5) {
      // Hundredths divisor (0.04 … 1.25): scale both by 10 twice. The quotient
      // is exact to tenths and the dividend stays under 100 so ×100 fits the grid.
      const dH = pick(next, [4, 5, 8, 12, 15, 25, 35, 45, 75, 125]);
      const qT = randInt(next, 11, 399);
      if (qT % 10 === 0 || (qT * dH) % 10 !== 0) continue;
      const D = (qT * dH) / 10;
      if (D >= 10000 || D % 100 === 0) continue;
      return { mode: "divide", dividend: D, divisor: dH, decimal: true, q: qT * 10, r: 0 };
    }
    const dT = pick(next, [2, 3, 4, 5, 6, 8, 12, 15, 25]); // divisor in tenths
    const qT = randInt(next, 11, 499); // quotient in tenths
    const D = qT * dT; // hundredths: (qT/10)·(dT/10)
    if (D >= 100000 || qT % 10 === 0 || D % 10 === 0) continue;
    return { mode: "divide", dividend: D, divisor: dT * 10, decimal: true, q: qT * 10, r: 0 };
  }
}

/** Highest place index a chunk may use in this round (whole rounds stop at ones). */
export function lowestPlace(r) {
  return r.decimal ? PLACE_COUNT - 1 : ONES;
}

/** Fresh machine state for a divide round. */
export function divideState(r) {
  return { remaining: r.dividend, divisor: r.divisor, bank: 0, scaled: 0 };
}

/** Multiply dividend charge and divisor by 10 (the divisor-to-whole move). */
export function scaleTen(s) {
  if (s.divisor % 100 === 0) return null;
  return {
    remaining: s.remaining * 10,
    divisor: s.divisor * 10,
    bank: s.bank,
    scaled: s.scaled + 1,
  };
}

/**
 * Divert a partial-quotient chunk (digit × place) through the divisor.
 * @returns {{state?: object, error?: "notWhole"|"overdraw", peel: number}}
 */
export function divert(s, digit, place) {
  const chunk = digit * PLACES[place]; // hundredths
  if (s.divisor % 100 !== 0) return { error: "notWhole", peel: 0 };
  const peel = chunk * (s.divisor / 100);
  if (peel > s.remaining) return { error: "overdraw", peel };
  return {
    state: {
      remaining: s.remaining - peel,
      divisor: s.divisor,
      bank: s.bank + chunk,
      scaled: s.scaled,
    },
    peel,
  };
}

/** @returns {"ok"|"scaleFirst"|"chargeLeft"|"decimalLeft"} */
export function judgeDivide(r, s) {
  if (s.divisor % 100 !== 0) return "scaleFirst";
  if (r.decimal)
    return s.remaining === 0 ? "ok" : s.remaining < s.divisor ? "decimalLeft" : "chargeLeft";
  return s.remaining < s.divisor ? "ok" : "chargeLeft";
}

/** Standard digit-by-digit chunks: [{digit, place}] that drain the charge. */
export function standardChunks(r) {
  let s = divideState(r);
  while (s.divisor % 100 !== 0) s = scaleTen(s);
  const out = [];
  for (let p = 0; p <= lowestPlace(r); p++) {
    const unit = PLACES[p] * (s.divisor / 100);
    const digit = Math.min(9, Math.floor(s.remaining / unit));
    if (digit > 0) {
      out.push({ digit, place: p });
      s = divert(s, digit, p).state;
    }
  }
  return out;
}

/** Base-ten tray counts for a value (one count per place). */
export function trayOf(h) {
  const t = [];
  for (let p = 0; p < PLACE_COUNT; p++) t.push(digitAt(h, p));
  return t;
}

/**
 * One regroup move on trays toward taking away `need` (per-place counts):
 * break one piece from the nearest higher place that has one into ten of the
 * place below it. Returns the place broken, or -1 when nothing is short.
 */
export function breakRod(tray, need) {
  let short = -1;
  for (let p = PLACE_COUNT - 1; p >= 0; p--)
    if (tray[p] < need[p]) {
      short = p;
      break;
    }
  if (short <= 0) return -1;
  let k = short - 1;
  while (k > 0 && tray[k] === 0) k--;
  if (tray[k] === 0) return -1;
  tray[k] -= 1;
  tray[k + 1] += 10;
  return k;
}

/** One bundle move: ten pieces in the lowest overfull place become one piece of the next. */
export function bundleTen(tray) {
  for (let p = PLACE_COUNT - 1; p > 0; p--)
    if (tray[p] >= 10) {
      tray[p] -= 10;
      tray[p - 1] += 1;
      return p;
    }
  return -1;
}

// ---------- multiply (lesson 2-12) ----------
// A factor is { w, dp }: its digits as written with the point removed, and the
// number of digits written after the point (12.60 → w 1260, dp 2). The machine
// multiplies the whole currents; the product has dpA + dpB decimal places.

export const REG = 8; // output register slots (the product always leaves a leading slot)
export const MAX_COUNT = 3; // place counter slider maximum
const POW10 = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000];

/** Digits w with exactly dp decimal places written ("12.60", "0.06", "4"). */
export function fixedText(w, dp) {
  if (dp === 0) return String(w);
  const s = String(w).padStart(dp + 1, "0");
  return `${s.slice(0, s.length - dp)}.${s.slice(s.length - dp)}`;
}

/** The same value with trailing decimal zeros dropped ("56.700" → "56.7"). */
export function trimText(w, dp) {
  let x = w;
  let d = dp;
  while (d > 0 && x % 10 === 0) {
    x /= 10;
    d--;
  }
  return fixedText(x, d);
}

/** Written trailing zeros after the point (12.60 → 1). */
export function trailingZeros(w, dp) {
  let n = 0;
  let x = w;
  while (n < dp && x % 10 === 0) {
    x /= 10;
    n++;
  }
  return n;
}

/** Digits w (not a multiple of 10) for a number with dp places between lo and hi. */
function factorDigits(next, lo, hi) {
  for (;;) {
    const w = randInt(next, lo, hi);
    if (w % 10 !== 0) return w;
  }
}

/**
 * A multiply round. Level 1: tenths × a whole number. Level 2: tenths × tenths.
 * Level 3: tenths × hundredths, or tens-and-tenths × tenths. Level 4: a factor
 * written with a final zero (12.60), or hundredths × hundredths.
 * @param {number} level @param {() => number} next
 */
export function makeMultiply(level, next) {
  for (;;) {
    let a;
    let b;
    if (level === 1) {
      a = { w: factorDigits(next, 2, 99), dp: 1 };
      b = { w: randInt(next, 2, 9), dp: 0 };
    } else if (level === 2) {
      a = { w: factorDigits(next, 2, 99), dp: 1 };
      b = { w: factorDigits(next, 2, 99), dp: 1 };
    } else if (level === 3) {
      if (next() < 0.5) {
        a = { w: factorDigits(next, 2, 99), dp: 1 };
        b = { w: factorDigits(next, 2, 999), dp: 2 };
      } else {
        a = { w: factorDigits(next, 101, 999), dp: 1 };
        b = { w: factorDigits(next, 2, 99), dp: 1 };
      }
    } else if (next() < 0.6) {
      a = { w: factorDigits(next, 2, 199), dp: 1 };
      b = { w: factorDigits(next, 11, 199) * 10, dp: 2 };
    } else {
      a = { w: factorDigits(next, 2, 999), dp: 2 };
      b = { w: factorDigits(next, 2, 499), dp: 2 };
    }
    if (level >= 3 && next() < 0.5) [a, b] = [b, a];
    const whole = a.w * b.w;
    const places = a.dp + b.dp;
    if (whole >= POW10[REG - 1] || places >= REG) continue;
    const park = 0; // counters and grounding bar start at 0: never the answer
    return { mode: "multiply", a, b, whole, places, park };
  }
}

/** Value of mant / 10^pos as an integer scaled by 10^(REG - 1) (exact, < 2^53). */
function scaled(mant, pos) {
  return mant * POW10[REG - 1 - pos];
}

/**
 * Rounded-factor estimate range: each factor between the whole numbers around
 * it (a whole factor is itself), so lo < product < hi (whole numbers).
 */
export function estimateRange(r) {
  const down = (f) => Math.floor(f.w / POW10[f.dp]);
  const up = (f) => Math.ceil(f.w / POW10[f.dp]);
  return { lo: down(r.a) * down(r.b), hi: up(r.a) * up(r.b) };
}

/**
 * Judge a multiply attempt. Counters first (the lesson's method), then the
 * product BY VALUE, so 56.700, 56.70 and 56.7 all pass.
 * @param {{a: {w:number,dp:number}, b: {w:number,dp:number}, whole: number, places: number}} r
 * @param {number} countA @param {number} countB counters for each factor
 * @param {number} pos digits to the right of the product's grounding bar
 * @param {number} [mant] the register's digits (the machine's whole product)
 * @returns {{verdict: "ok"|"countHigh"|"countLow"|"countZero"|"countOne"|"overload"|"brownout",
 *   factor?: "a"|"b", cause?: "aligned"|"oneFactor"|"droppedZero"|"misplaced"}}
 */
export function judgeMultiply(r, countA, countB, pos, mant = r.whole) {
  if (countA !== r.a.dp || countB !== r.b.dp) {
    const bad = countA !== r.a.dp ? "a" : "b";
    const f = r[bad];
    const c = bad === "a" ? countA : countB;
    const other = bad === "a" ? r.b : r.a;
    const otherOk = bad === "a" ? countB === r.b.dp : true;
    const tz = trailingZeros(f.w, f.dp);
    if (tz > 0 && c === f.dp - tz) return { verdict: "countZero", factor: bad };
    if (c === 0 && otherOk && other.dp > 0) return { verdict: "countOne", factor: bad };
    return { verdict: c > f.dp ? "countHigh" : "countLow", factor: bad };
  }
  const want = scaled(r.whole, r.places);
  const got = scaled(mant, pos);
  if (got === want) return { verdict: "ok" };
  let cause = "misplaced";
  if (mant === r.whole) {
    const hi = Math.max(r.a.dp, r.b.dp);
    const lo = Math.min(r.a.dp, r.b.dp);
    const tz = trailingZeros(r.a.w, r.a.dp) + trailingZeros(r.b.w, r.b.dp);
    if (pos === hi) cause = "aligned";
    else if (pos === lo) cause = "oneFactor";
    else if (tz > 0 && pos === r.places - tz) cause = "droppedZero";
  }
  return { verdict: got > want ? "overload" : "brownout", cause };
}
