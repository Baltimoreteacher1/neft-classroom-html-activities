// Number Builder, the two tile modes: digit tiles in a place-value chart (grade 4) and a scientific-notation
// builder (grade 8). Pure: every function takes a round and a build and returns plain data. @fm2 FM-007 FM-060
import { div, eq, frac, fromDecimal, isInt, mul, toDecimalString } from "../../rational.js";

export const SCI_PLACES = 5; // hundreds, tens, ones . tenths, hundredths
export const SCI_EXP = [-9, 9];
const isDigit = (d) => Number.isInteger(d) && d >= 0 && d <= 9;
export const pow10 = (n) => (n >= 0 ? frac(10 ** n) : frac(1, 10 ** -n));

// ---------- digit tiles in a chart ----------
function arrangements(tiles) {
  const out = new Set();
  const used = tiles.map(() => false);
  const cur = [];
  const go = () => {
    if (cur.length === tiles.length) {
      out.add(cur.join(""));
      return;
    }
    const seen = new Set();
    tiles.forEach((d, i) => {
      if (used[i] || seen.has(d)) return;
      seen.add(d);
      used[i] = true;
      cur.push(d);
      go();
      cur.pop();
      used[i] = false;
    });
  };
  go();
  return [...out].filter((s) => !(s[0] === "0" && s.length > 1)).map(Number);
}

export function chartBest(round) {
  const all = arrangements(round.tiles);
  const pool = round.goal === "largestEven" ? all.filter((v) => v % 2 === 0) : all;
  const target = Number(round.target);
  const dist = (v) => Math.abs(v - target);
  const value = {
    largest: Math.max(...all),
    largestEven: Math.max(...pool),
    smallest: Math.min(...all),
    nearest: all.reduce((a, b) => (dist(b) < dist(a) ? b : a)),
  }[round.goal];
  return {
    value,
    all,
    max: Math.max(...all),
    min: Math.min(...all),
    minDist: Math.min(...all.map(dist)),
  };
}

export function evalChart(round, build) {
  const slots = build?.slots;
  const n = round.tiles.length;
  if (!Array.isArray(slots) || slots.length !== n) return { ok: false, key: "invalid", vars: {} };
  if (slots.some((s) => s !== null && !isDigit(s))) return { ok: false, key: "invalid", vars: {} };
  const left = slots.filter((s) => s === null).length;
  if (left) return { ok: false, key: "notAllTiles", vars: { left } };
  if ([...slots].sort().join() !== [...round.tiles].sort().join())
    return { ok: false, key: "invalid", vars: {} };
  if (slots[0] === 0) return { ok: false, key: "leadingZero", vars: {} };
  const value = Number(slots.join(""));
  const best = chartBest(round);
  const vars = { value: String(value) };
  if (round.goal === "nearest") {
    const dist = Math.abs(value - Number(round.target));
    return dist === best.minDist
      ? { ok: true, key: null, vars, value: String(value) }
      : { ok: false, key: "farther", vars: { ...vars, dist }, value: String(value) };
  }
  if (value === best.value) return { ok: true, key: null, vars, value: String(value) };
  const key =
    (round.goal === "largest" && value === best.min) ||
    (round.goal === "smallest" && value === best.max)
      ? "reversed"
      : round.goal === "largestEven"
        ? value % 2
          ? "odd"
          : "notLargest"
        : round.goal === "largest"
          ? "notLargest"
          : "notSmallest";
  return { ok: false, key, vars, value: String(value) };
}

export function solveChart(round) {
  const target = chartBest(round).value;
  return { slots: String(target).split("").map(Number) };
}

// ---------- scientific notation ----------
export const sciCoef = (digits) =>
  frac(digits[0] * 10000 + digits[1] * 1000 + digits[2] * 100 + digits[3] * 10 + digits[4], 100);
export const sciValue = (build) => mul(sciCoef(build.digits), pow10(build.exp));
export const sciCoefText = (digits) => toDecimalString(sciCoef(digits));
const validSci = (b) =>
  b &&
  Array.isArray(b.digits) &&
  b.digits.length === SCI_PLACES &&
  b.digits.every(isDigit) &&
  Number.isInteger(b.exp) &&
  b.exp >= SCI_EXP[0] &&
  b.exp <= SCI_EXP[1];

export function sciRules(round, build) {
  const coef = sciCoef(build.digits);
  return round.constraints.map((c) => {
    if (c.t === "normalized")
      return { c, ok: coef.n >= coef.d && coef.n < 10 * coef.d, have: sciCoefText(build.digits) };
    const ok = c.op === "eq" ? build.exp === c.n : build.exp !== c.n;
    return { c, ok, have: String(build.exp) };
  });
}

const powerOfTen = (r) => {
  for (let k = 1; k <= 18; k += 1) {
    if (r.d === 1 && r.n === 10 ** k) return k;
    if (r.n === 1 && r.d === 10 ** k) return -k;
  }
  return 0;
};

export function evalSci(round, build) {
  if (!validSci(build)) return { ok: false, key: "invalid", vars: {} };
  const value = sciValue(build);
  const target = fromDecimal(round.target);
  const coef = sciCoef(build.digits);
  const text = toDecimalString(value, 9) ?? "?";
  const vars = { value: text, coef: sciCoefText(build.digits), exp: build.exp };
  const failed = sciRules(round, build).find((r) => !r.ok);
  if (eq(value, target))
    return failed
      ? {
          ok: false,
          key: failed.c.t === "normalized" ? "notNormalized" : "expRule",
          vars: { ...vars, rule: failed.c },
          value: text,
        }
      : { ok: true, key: null, vars, value: text };
  if (coef.n === 0) return { ok: false, key: "sciEmpty", vars, value: text };
  if (round.expr && eq(coef, fromDecimal(round.expr.c)) && build.exp !== round.expr.e)
    return {
      ok: false,
      key: "keptCoef",
      vars: { ...vars, shift: round.expr.e - build.exp },
      value: text,
    };
  if (build.exp !== 0 && eq(mul(coef, pow10(-build.exp)), target))
    return { ok: false, key: "expSign", vars, value: text };
  const k = powerOfTen(div(value, target));
  if (k) return { ok: false, key: "expOff", vars: { ...vars, k }, value: text };
  const cmpValue = value.n * target.d - target.n * value.d;
  return { ok: false, key: cmpValue > 0 ? "sciMore" : "sciLess", vars, value: text };
}

// Every (digits, exponent) pair that equals the target and obeys the rules, normalized form first.
export function sciSolutions(round) {
  const target = fromDecimal(round.target);
  const found = [];
  for (let exp = SCI_EXP[0]; exp <= SCI_EXP[1]; exp += 1) {
    let scaled;
    try {
      scaled = div(mul(target, frac(100)), pow10(exp));
    } catch {
      continue; // magnitude far outside five digit places
    }
    if (!isInt(scaled) || scaled.n < 0 || scaled.n > 99999) continue;
    const digits = String(scaled.n).padStart(SCI_PLACES, "0").split("").map(Number);
    const build = { digits, exp };
    if (sciRules(round, build).every((r) => r.ok)) found.push(build);
  }
  const home = found.find(
    (b) =>
      sciCoef(b.digits).n >= sciCoef(b.digits).d && sciCoef(b.digits).n < 10 * sciCoef(b.digits).d,
  );
  const anchor = home ? home.exp : 0;
  return found.sort((a, b) => Math.abs(a.exp - anchor) - Math.abs(b.exp - anchor) || a.exp - b.exp);
}
