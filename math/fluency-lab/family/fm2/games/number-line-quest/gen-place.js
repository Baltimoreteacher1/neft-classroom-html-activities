// PLACE generators for kindergarten through grade 4. Each returns a finished round through buildPlace. Levels change the
// range, how many marks are labelled, the tolerance and the representation, not only the numbers. @fm2 FM-012 FM-051 FM-053 FM-054
import { gcd } from "../../rational.js";
import { int, pick } from "../../rng.js";
import { WORD } from "./copy.js";
import { showNum } from "./format.js";
import { buildPlace, F, labelsBy } from "./place-round.js";

const trap = (key, v, extra = {}) => ({ key, x: typeof v === "number" ? F(v) : v, ...extra });
const numeral = (n) => String(n);

export function kNext(rng, level) {
  const max = level === 1 ? 10 : 20;
  const labels = level === 1 ? labelsBy(0, 10, 1) : labelsBy(0, 20, level === 2 ? 5 : 10);
  const form = pick(rng, level === 3 ? ["after", "before", "more", "less"] : ["after", "before"]);
  const d = form === "more" || form === "less" ? 2 : 1;
  const up = form === "after" || form === "more";
  const s = up ? int(rng, 0, max - d) : int(rng, d, max);
  const t = up ? s + d : s - d;
  return buildPlace({
    rng,
    skill: "k-next-on-line",
    family: "next",
    level,
    line: { min: F(0), max: F(max), ticks: F(1), labels },
    mode: "int",
    step: F(1),
    target: F(t),
    start: F(s),
    detail: { s, d, up },
    traps: [
      trap("stayed", s),
      trap("wrong-way", up ? s - d : s + d),
      trap(
        d === 1 ? "overshot" : "stopped-early",
        d === 1 ? (up ? s + 2 : s - 2) : up ? s + 1 : s - 1,
      ),
    ],
    promptKey: form,
    vars: { s: numeral(s), d: numeral(d) },
  });
}

export function kPlace(rng, level) {
  const max = level === 1 ? 10 : 20;
  const labels = level === 1 ? labelsBy(0, 10, 1) : labelsBy(0, 20, level === 2 ? 5 : 20);
  const t = int(rng, 1, max);
  return buildPlace({
    rng,
    skill: "k-place-to-20",
    family: "count",
    level,
    line: { min: F(0), max: F(max), ticks: F(1), labels },
    mode: "int",
    step: F(1),
    target: F(t),
    detail: { t },
    traps: [trap("counted-zero", t - 1), trap("one-too-many", t + 1)],
    promptKey: "to",
    vars: { v: numeral(t) },
  });
}

const swapDigits = (t) => Number(String(t).split("").reverse().join(""));

export function g1Place(rng, level) {
  const t = int(rng, 1, 99);
  const tens = Math.floor(t / 10);
  return buildPlace({
    rng,
    skill: "g1-place-100",
    family: "whole",
    level,
    line: {
      min: F(0),
      max: F(100),
      ticks: F(level === 3 ? 10 : 5),
      labels: level === 3 ? [F(0), F(50), F(100)] : labelsBy(0, 100, 10),
    },
    mode: "int",
    step: F(1),
    tol: F([5, 2, 1][level - 1]),
    target: F(t),
    detail: { t, tens },
    traps: [trap("digit-swap", t >= 10 ? swapDigits(t) : t), trap("leading-digit-only", tens * 10)],
    promptKey: "to",
    vars: { v: numeral(t) },
  });
}

export function g2Place(rng, level) {
  const w = level === 2 ? pick(rng, [0, 500]) : level === 3 ? 100 * int(rng, 0, 9) : 0;
  const width = level === 1 ? 1000 : level === 2 ? 500 : 100;
  const t = int(rng, w + 1, w + width - 1);
  const hundreds = Math.floor(t / 100);
  const mid = level === 3 ? [F(w), F(w + 50), F(w + 100)] : labelsBy(w, w + width, 100);
  const swap = hundreds * 100 + (t % 10) * 10 + (Math.floor(t / 10) % 10);
  return buildPlace({
    rng,
    skill: "g2-place-1000",
    family: "whole",
    level,
    line: {
      min: F(w),
      max: F(w + width),
      ticks: F(level === 1 ? 50 : level === 2 ? 25 : 10),
      labels: mid,
    },
    mode: "int",
    step: F([10, 5, 1][level - 1]),
    tol: F([50, 20, 3][level - 1]),
    target: F(t),
    detail: { t, hundreds },
    traps: [
      trap("digit-swap", swap, { snap: true }),
      trap("leading-digit-only", hundreds * 100, { snap: true }),
    ],
    promptKey: "to",
    vars: { v: numeral(t) },
  });
}

export function g2EvenOdd(rng, level) {
  const max = [20, 40, 100][level - 1];
  const kind = pick(rng, ["even", "odd"]);
  const after = pick(rng, [true, false]);
  const parityOf = (n) => (n % 2 === 0 ? "even" : "odd");
  const s = after ? int(rng, 0, max - 2) : int(rng, 2, max);
  const near = after ? s + 1 : s - 1;
  const t = parityOf(near) === kind ? near : after ? s + 2 : s - 2;
  const wrongParity = t === near ? (after ? s + 2 : s - 2) : near;
  const other =
    parityOf(after ? s - 1 : s + 1) === kind ? (after ? s - 1 : s + 1) : after ? s - 2 : s + 2;
  return buildPlace({
    rng,
    skill: "g2-even-odd",
    family: "parity",
    level,
    line: {
      min: F(0),
      max: F(max),
      ticks: F(level === 3 ? 5 : 1),
      labels: labelsBy(0, max, level === 1 ? 5 : 10),
    },
    mode: "int",
    step: F(1),
    target: F(t),
    start: F(s),
    detail: { s, kind, after },
    traps: [trap("wrong-parity", wrongParity), trap("wrong-way", other), trap("stayed", s)],
    promptKey: "parity",
    vars: { s: numeral(s), kind: WORD[kind], where: after ? WORD.after : WORD.before },
  });
}

const coprimeParts = (rng, bs, whole) => {
  for (let tries = 0; tries < 50; tries += 1) {
    const b = pick(rng, bs);
    const a = int(rng, 1, whole * b - 1);
    if (a !== b && (whole === 2 || gcd(a, b) === 1)) return [a, b];
  }
  return [1, 2];
};

export function g3Fractions(rng, level) {
  const whole = level === 3 ? 2 : 1;
  const [a, b] = coprimeParts(
    rng,
    level === 1 ? [2, 3, 4] : level === 2 ? [2, 3, 4, 5, 6, 8] : [2, 3, 4, 6, 8],
    whole,
  );
  return buildPlace({
    rng,
    skill: "g3-fractions-line",
    family: "fraction",
    level,
    line: { min: F(0), max: F(whole), ticks: F(1, b), labels: labelsBy(0, whole, 1) },
    mode: "frac",
    step: F(1, b),
    target: F(a, b),
    detail: { a, b },
    traps: [
      trap("counted-zero", F(a - 1, b)),
      trap("one-too-many", F(a + 1, b)),
      trap("flipped", F(b, a)),
    ],
    promptKey: "to",
    vars: { v: `${a}/${b}` },
  });
}

function mixedRound(rng, level, skill, bs) {
  const b = pick(rng, bs);
  const w = int(rng, 0, 2);
  const a = coprimeParts(rng, [b], 1)[0];
  const t = F(w * b + a, b);
  return buildPlace({
    rng,
    skill,
    family: "mixed",
    level,
    line: { min: F(0), max: F(3), ticks: F(1, b), labels: labelsBy(0, 3, 1) },
    mode: "mixed",
    step: F(1, b),
    target: t,
    detail: { w, a, b },
    traps: [
      trap("forgot-whole", F(a, b)),
      trap("counted-zero", F(w * b + a - 1, b)),
      trap("one-too-many", F(w * b + a + 1, b)),
    ],
    promptKey: "to",
    vars: { v: showNum(t, "mixed") },
  });
}

const decimalPair = (k) => (k % 10) * 10 + Math.floor(k / 10);

export function g4FracDec(rng, level) {
  const variant =
    level === 1 ? "tenths" : pick(rng, level === 2 ? ["hundredths", "mixed"] : ["window", "mixed"]);
  if (variant === "mixed")
    return mixedRound(rng, level, "g4-frac-dec", level === 2 ? [2, 4, 5, 10] : [3, 6, 8, 12]);
  const spec = { rng, skill: "g4-frac-dec", level, mode: "dec" };
  if (variant === "tenths") {
    const k = int(rng, 1, 9);
    const t = F(k, 10);
    return buildPlace({
      ...spec,
      family: "decimal",
      line: { min: F(0), max: F(1), ticks: F(1, 10), labels: [F(0), F(1, 2), F(1)] },
      step: F(1, 10),
      target: t,
      detail: { digits: 1, k },
      traps: [trap("counted-zero", F(k - 1, 10)), trap("one-too-many", F(k + 1, 10))],
      promptKey: "to",
      vars: { v: pick(rng, [showNum(t, "dec", 1), `${k}/10`]) },
    });
  }
  const w = variant === "window" ? int(rng, 0, 2) : 0;
  let k = int(rng, 11, 99);
  if (variant === "window") while (k % 10 === 0) k = int(rng, 11, 99);
  const t = F(100 * w + k, 100);
  return buildPlace({
    ...spec,
    family: "decimal",
    line: { min: F(w), max: F(w + 1), ticks: F(1, 10), labels: [F(w), F(2 * w + 1, 2), F(w + 1)] },
    step: F(1, 100),
    tol: variant === "hundredths" ? F(1, 100) : F(0),
    target: t,
    detail: { digits: 2, k, w },
    traps: [
      trap("digit-swap", F(100 * w + decimalPair(k), 100)),
      trap("tenths-only", F(100 * w + Math.floor(k / 10) * 10, 100)),
    ],
    promptKey: "to",
    vars: {
      v:
        variant === "hundredths"
          ? pick(rng, [showNum(t, "dec", 2), `${k}/100`])
          : showNum(t, "dec", 2),
    },
  });
}

const EQUIV = {
  1: [
    [8, [2, 4]],
    [10, [2, 5]],
  ],
  2: [
    [12, [2, 3, 4, 6]],
    [10, [2, 5]],
    [6, [2, 3]],
  ],
  3: [
    [12, [2, 3, 4, 6]],
    [10, [2, 5]],
    [8, [2, 4]],
    [6, [2, 3]],
  ],
};

export function g4Equivalent(rng, level) {
  const [m, bs] = pick(rng, EQUIV[level]);
  const whole = level === 3 ? 2 : 1;
  const b = pick(rng, bs);
  let a = int(rng, 1, whole * b - 1);
  while (a === b || gcd(a, b) !== 1) a = int(rng, 1, whole * b - 1);
  const ticks = F(1, m);
  return buildPlace({
    rng,
    skill: "g4-equivalent-positions",
    family: "equiv",
    level,
    line: { min: F(0), max: F(whole), ticks, labels: labelsBy(0, whole, 1) },
    mode: "frac",
    step: ticks,
    target: F(a, b),
    detail: { a, b, m, per: m / b },
    traps: [trap("numerator-ticks", F(a, m)), trap("denominator-ticks", F(b, m))],
    promptKey: "equiv",
    vars: { m: numeral(m), v: `${a}/${b}` },
  });
}

