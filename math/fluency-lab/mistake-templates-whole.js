// Whole-number worked solutions with one flawed step (carrying, borrowing, partial products, chunk division).
import { int, pick, near, split, wholeSize } from "./mistake-kit.js";

function addRegroup(rng, { grade, config }) {
  const { lo, hi, cap } = wholeSize(grade, config);
  for (let tries = 0; tries < 500; tries += 1) {
    const [a, b] = [int(rng, lo, hi), int(rng, lo, hi)];
    const [a0, b0] = [a % 10, b % 10];
    if (a0 + b0 < 10 || a + b > cap) continue;
    const tens = a - a0 + (b - b0);
    const ones = a0 + b0;
    const place = rng() < 0.4;
    const flawed = place ? `${tens / 10} + ${ones}` : `${tens} + ${ones - 10}`;
    const flawedValue = place ? tens / 10 + ones : tens + ones - 10;
    return {
      start: `${a} + ${b}`,
      mode: "expr",
      steps: [`(${a - a0} + ${b - b0}) + (${a0} + ${b0})`, flawed, String(flawedValue)],
      bad: 1,
      slip: place ? "place-value" : "no-regroup",
      decoys: place ? ["both-up", "one-part"] : ["small-from-big", "one-part"],
      fix: `${tens} + ${ones}`,
      near: near(
        [
          [`${tens + 10} + ${ones}`, a + b + 10],
          [`${tens} + ${ones + 1}`, a + b + 1],
          [`${tens - 10} + ${ones}`, a + b - 10],
          [`${tens} + ${a0}`, tens + a0],
        ],
        a + b,
        flawedValue,
      ),
      answer: String(a + b),
    };
  }
  throw new Error("addRegroup: no numbers");
}

function shiftAdd(rng) {
  const [a, b] = [int(rng, 2, 9), int(rng, 3, 9)];
  const sum = a + b;
  return {
    start: `${a} + ${b}`,
    mode: "expr",
    steps: [`(${a} + 1) + (${b} − 1)`, `${a + 1} + ${b + 1}`, String(sum + 2)],
    bad: 1,
    slip: "both-up",
    decoys: ["kept-whole", "one-part"],
    fix: `${a + 1} + ${b - 1}`,
    near: near(
      [
        [`${a - 1} + ${b - 1}`, sum - 2],
        [`${a + 1} + ${b}`, sum + 1],
        [`${a} + ${b + 1}`, sum + 1],
        [`${a + 2} + ${b - 1}`, sum + 1],
      ],
      sum,
      sum + 2,
    ),
    answer: String(sum),
  };
}

function makeTen(rng) {
  const a = int(rng, 6, 9);
  const b = int(rng, 11 - a, 9);
  const [up, rest] = [10 - a, b - (10 - a)];
  return {
    start: `${a} + ${b}`,
    mode: "expr",
    steps: [`${a} + ${up} + ${rest}`, `10 + ${b}`, String(10 + b)],
    bad: 1,
    slip: "kept-whole",
    decoys: ["both-up", "small-from-big"],
    fix: `10 + ${rest}`,
    near: near(
      [
        [`10 + ${rest + 1}`, 11 + rest],
        [`9 + ${rest}`, 9 + rest],
        [`10 + ${rest - 1}`, 9 + rest],
        [`${up} + ${rest}`, up + rest],
      ],
      10 + rest,
      10 + b,
    ),
    answer: String(a + b),
  };
}

function subTen(rng) {
  const a = int(rng, 12, 18);
  const a0 = a - 10;
  const b = int(rng, a0 + 1, 9);
  const rest = b - a0;
  return {
    start: `${a} − ${b}`,
    mode: "expr",
    steps: [`${a} − ${a0} − ${rest}`, `10 − ${b}`, String(10 - b)],
    bad: 1,
    slip: "kept-whole",
    decoys: ["opposite", "small-from-big"],
    fix: `10 − ${rest}`,
    near: near(
      [
        [`10 − ${rest + 1}`, 9 - rest],
        [`${a0} − ${rest}`, a0 - rest],
        [`10 + ${rest}`, 10 + rest],
        [`10 − ${rest + 2}`, 8 - rest],
      ],
      10 - rest,
      10 - b,
    ),
    answer: String(a - b),
  };
}

function shiftSub(rng) {
  const b = int(rng, 2, 8);
  const a = int(rng, b + 1, 10);
  return {
    start: `${a} − ${b}`,
    mode: "expr",
    steps: [`(${a} − 1) − (${b} − 1)`, `${a - 1} − ${b + 1}`, String(a - b - 2)],
    bad: 1,
    slip: "opposite",
    decoys: ["kept-whole", "both-up"],
    fix: `${a - 1} − ${b - 1}`,
    near: near(
      [
        [`${a + 1} − ${b - 1}`, a - b + 2],
        [`${a - 1} − ${b}`, a - b - 1],
        [`${a} − ${b - 1}`, a - b + 1],
        [`${a - 2} − ${b - 1}`, a - b - 1],
      ],
      a - b,
      a - b - 2,
    ),
    answer: String(a - b),
  };
}

function subBorrow(rng, { grade, config }) {
  const { lo, hi, cap } = wholeSize(grade, config);
  for (let tries = 0; tries < 500; tries += 1) {
    const [b, c] = [int(rng, lo, hi), int(rng, lo, hi)];
    const a = b + c;
    const [a0, b0] = [a % 10, b % 10];
    const [A, B] = [a - a0, b - b0];
    if (b0 <= a0 || A - B < 10 || a > cap) continue;
    const d = b0 - a0;
    return {
      start: `${a} − ${b}`,
      mode: "expr",
      steps: [`(${A} − ${B}) + (${a0} − ${b0})`, `${A - B} + ${d}`, String(A - B + d)],
      bad: 1,
      slip: "small-from-big",
      decoys: ["no-regroup", "opposite"],
      fix: `${A - B} − ${d}`,
      near: near(
        [
          [`${A - B} − ${d + 1}`, c - 1],
          [`${A - B} − ${a0 + b0}`, A - B - a0 - b0],
          [`${A - B + 10} − ${d}`, c + 10],
          [`${A - B} − ${d + 2}`, c - 2],
        ],
        c,
        A - B + d,
      ),
      answer: String(c),
    };
  }
  throw new Error("subBorrow: no numbers");
}

// Distribute a factor to only one part: 7 × 24 = 7 × 20 + 4.
function mulPartial(rng, { config }, area = false) {
  const factors = (config.factors || []).filter((f) => f >= 2);
  let k = factors.length
    ? pick(rng, factors)
    : int(rng, Math.max(2, config.minA ?? config.min ?? 2), config.maxA ?? config.max ?? 9);
  let n = int(rng, config.minB ?? 5, Math.max(config.minB ?? 5, config.maxB ?? 12));
  if (config.tens) n *= 10;
  if (n < 5) [k, n] = k >= 5 ? [n < 2 ? 2 : n, k] : [k, 5 + int(rng, 0, 4)];
  const [p, q] = split(rng, n);
  const [good, flawed] = [k * n, k * p + q];
  return {
    start: `${k} × ${n}`,
    mode: "expr",
    steps: [`${k} × (${p} + ${q})`, `${k} × ${p} + ${q}`, String(flawed)],
    bad: 1,
    slip: "one-part",
    decoys: ["no-regroup", "kept-whole"],
    fix: `${k} × ${p} + ${k} × ${q}`,
    near: near(
      [
        [`${k} × ${p} + ${k * q + 1}`, good + 1],
        [`${k} × ${p + 1} + ${k} × ${q}`, good + k],
        [`${k} + ${p} × ${q}`, k + p * q],
        [`${k} × ${p} + ${k} + ${q}`, k * p + k + q],
      ],
      good,
      flawed,
    ),
    answer: String(good),
    meta: area ? { kind: "area", k, n } : undefined,
  };
}

function divChunk(rng, { config }) {
  const d = int(rng, Math.max(2, config.minDivisor ?? 2), Math.min(9, config.maxDivisor ?? 9));
  const Q = int(rng, Math.max(5, config.minQuotient ?? 5), Math.max(9, config.maxQuotient ?? 12));
  const [qa, qb] = split(rng, Q);
  const flawed = qa + d * qb;
  return {
    start: `${d * Q} ÷ ${d}`,
    mode: "expr",
    steps: [`(${d * qa} + ${d * qb}) ÷ ${d}`, `${qa} + ${d * qb}`, String(flawed)],
    bad: 1,
    slip: "one-part",
    decoys: ["kept-whole", "small-from-big"],
    fix: `${qa} + ${qb}`,
    near: near(
      [
        [`${qa} + ${qb + 1}`, Q + 1],
        [`${qa + 1} + ${qb}`, Q + 1],
        [`${qa} + ${qb + 2}`, Q + 2],
        [`${qa} × ${qb}`, qa * qb],
      ],
      Q,
      flawed,
    ),
    answer: String(Q),
  };
}

export const WHOLE = {
  addRegroup: { family: "whole", run: addRegroup },
  shiftAdd: { family: "whole", run: shiftAdd },
  makeTen: { family: "whole", run: makeTen },
  subTen: { family: "whole", run: subTen },
  shiftSub: { family: "whole", run: shiftSub },
  subBorrow: { family: "whole", run: subBorrow },
  mulPartial: { family: "whole", run: mulPartial },
  area: { family: "geometry", run: (rng, ctx) => mulPartial(rng, ctx, true) },
  divChunk: { family: "whole", run: divChunk },
};
