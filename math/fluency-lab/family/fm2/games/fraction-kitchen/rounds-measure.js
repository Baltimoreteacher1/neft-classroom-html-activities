// Round generators for the cup and number-line tasks. Pure functions of (level, rng, grade); fractions are exact
// { n, d } objects. @fm2 FM-053 FM-055 FM-057 FM-060 FM-061
import { int, pick } from "../../rng.js";
import { add, cmp, frac, lcm, mul, sub, toNumber } from "../../rational.js";
import { POOL, ingredient, reducedNumerator, tickOptions } from "./rounds-util.js";

// ---- number-line and cup tasks ------------------------------------------------------------------------------

export function lineMarker(level, rng, grade) {
  const high = grade >= 4;
  const hi = high ? (level === 3 ? 3 : 2) : level === 3 ? 2 : 1;
  const dens = high
    ? level === 1
      ? [2, 3, 4, 5, 6, 8]
      : [3, 4, 5, 6, 8, 10, 12]
    : level === 1
      ? [2, 3, 4]
      : level === 2
        ? [2, 3, 4, 6]
        : [3, 4, 6, 8];
  const b = pick(rng, dens);
  const whole = hi > 1 && (level === 3 || high) ? int(rng, 0, hi - 1) : 0;
  const target = frac(whole * b + reducedNumerator(rng, b), b);
  const count = level === 1 ? 2 : level === 2 ? 3 : high ? 5 : 4;
  return {
    kind: "line",
    skill: "mark",
    lo: 0,
    hi,
    ticksOptions: tickOptions(rng, [b], count),
    start: frac(0),
    target,
    hidden: false,
  };
}

export function pourCup(level, rng, grade) {
  const high = grade >= 4;
  const cap = high ? 2 : 1;
  const dens = grade <= 3 ? [2, 3, 4, 6, 8] : grade === 4 ? [2, 3, 4, 5, 6, 8] : [5, 6, 8, 10, 12];
  const b = pick(rng, dens);
  const part = level === 1 ? 1 : reducedNumerator(rng, b);
  const whole = high && level >= 2 ? (level === 3 ? 1 : int(rng, 0, 1)) : 0;
  const target = frac(whole * b + part, b);
  const count = level === 1 ? 2 : level === 2 ? 3 : 4;
  return {
    kind: "cup",
    skill: "pour",
    cap,
    lo: 0,
    hi: cap,
    ticksOptions: tickOptions(rng, [b], count),
    start: frac(0),
    target,
    hidden: false,
    blind: level === 3,
    ingredient: ingredient(rng),
  };
}

const representable = (target) => POOL.some((m) => m % target.d === 0);

export function percentAmount(level, rng, grade) {
  for (;;) {
    let p;
    let whole;
    if (grade <= 6) {
      whole = level === 1 ? frac(1) : frac(pick(rng, [2, 3, 4, 5]));
      p =
        level === 1
          ? pick(rng, [10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90])
          : level === 2
            ? pick(rng, [10, 20, 25, 40, 50, 60, 75, 80])
            : pick(rng, [15, 35, 45, 55, 65, 85]);
    } else {
      whole =
        level === 1
          ? frac(pick(rng, [2, 3, 4]))
          : level === 2
            ? pick(rng, [frac(1, 2), frac(3, 4), frac(2, 3), frac(1, 3), frac(3, 2), frac(5, 4)])
            : pick(rng, [frac(3, 2), frac(5, 4), frac(7, 4), frac(5, 3), frac(5, 6), frac(3, 8)]);
      p = pick(
        rng,
        level === 1
          ? [10, 20, 25, 30, 40, 50, 60, 75]
          : [10, 20, 25, 30, 40, 50, 60, 75, 80, 90, 15, 35, 45],
      );
    }
    const target = mul(frac(p, 100), whole);
    if (!representable(target) || toNumber(target) > 2 || toNumber(target) <= 0) continue;
    const must = POOL.find((m) => m % target.d === 0);
    const cap = toNumber(whole) <= 1 && toNumber(target) <= 1 ? 1 : 2;
    return {
      kind: "cup",
      skill: "percent",
      cap,
      lo: 0,
      hi: cap,
      ticksOptions: tickOptions(rng, [must], level === 1 ? 4 : 5),
      start: frac(0),
      target,
      hidden: true,
      percent: p,
      of: whole,
      ingredient: ingredient(rng),
    };
  }
}

export function pourSpill(level, rng) {
  const dens = level === 1 ? [2] : level === 2 ? [2, 3, 4] : [2, 3, 4, 6];
  for (;;) {
    const amount = () => frac(int(rng, 1, 7), pick(rng, dens));
    const signed = (x) => (rng() < 0.5 || x.n === 0 ? x : frac(-x.n, x.d));
    const start = signed(frac(int(rng, 0, 4), pick(rng, dens)));
    const count = level;
    const moves = Array.from({ length: count }, () => signed(amount()));
    if (count > 1 && (moves.every((m) => m.n > 0) || moves.every((m) => m.n < 0))) continue;
    if (moves.some((m) => Math.abs(toNumber(m)) > 2)) continue;
    const target = moves.reduce((sum, m) => add(sum, m), start);
    if (
      toNumber(target) < -2.5 ||
      toNumber(target) > 2.5 ||
      (toNumber(start) >= 0 && toNumber(target) >= 0 && rng() < 0.7)
    )
      continue;
    const must = [moves.reduce((m, x) => lcm(m, x.d), start.d)];
    if (must[0] > 12) continue;
    return {
      kind: "line",
      skill: "net",
      lo: -3,
      hi: 3,
      ticksOptions: tickOptions(rng, must, level + 1, [2, 3, 4, 6, 8, 12]),
      start,
      moves,
      target,
      hidden: true,
    };
  }
}

const TOLERANCES = [
  [frac(1, 20), frac(1, 25)],
  [frac(1, 100), frac(1, 80)],
  [frac(1, 500), frac(1, 400), frac(1, 300)],
];
const LATE = [frac(1, 200), frac(1, 150)];
export const IRRATIONALS = [
  { id: "pi", symbol: "π", value: frac(314159265, 100000000), digits: "3.14159265", lo: 3 },
  { id: "sqrt2", symbol: "√2", value: frac(141421356, 100000000), digits: "1.41421356", lo: 1, late: [frac(3, 1000), frac(1, 300)] },
  { id: "sqrt3", symbol: "√3", value: frac(173205081, 100000000), digits: "1.73205081", lo: 1, late: LATE },
  { id: "e", symbol: "e", value: frac(271828183, 100000000), digits: "2.71828183", lo: 2, late: LATE },
];

// Every fraction k/m (m <= maxDen) within tol of the constant, by brute force.
export function approximations(irr) {
  const out = [];
  for (let m = 2; m <= irr.maxDen; m += 1) {
    for (let k = irr.lo * m; k <= (irr.lo + 1) * m; k += 1) {
      const gap = sub(frac(k, m), irr.value);
      if (cmp(frac(Math.abs(gap.n), gap.d), irr.tol) <= 0) out.push([k, m]);
    }
  }
  return out;
}

export function rationalApprox(level, rng) {
  for (;;) {
    const constant = pick(rng, IRRATIONALS);
    const tolerances = level === 3 && constant.late ? constant.late : TOLERANCES[level - 1];
    const irr = { id: constant.id, symbol: constant.symbol, value: constant.value, digits: constant.digits, tol: pick(rng, tolerances), maxDen: pick(rng, [8, 10, 12]), lo: constant.lo };
    if (approximations(irr).length === 0) continue;
    const ticksOptions = Array.from({ length: irr.maxDen - 1 }, (_, i) => i + 2);
    return { kind: "line", skill: "approx", lo: irr.lo, hi: irr.lo + 1, ticksOptions, start: frac(irr.lo), target: null, hidden: true, irr };
  }
}
