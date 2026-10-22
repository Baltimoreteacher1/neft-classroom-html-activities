// Percent, ratio, rate, unit and integer worked solutions with one flawed step.
import { int, pick, neg, gcd, round, near, fraction } from "./mistake-kit.js";

function percentOf(rng) {
  const p = pick(rng, [10, 20, 25, 30, 40, 50, 60, 75]);
  const n = pick(rng, [20, 40, 60, 80, 120, 200, 240]);
  const shift = rng() < 0.5;
  const good = round((p / 100) * n);
  const flawedValue = shift ? round((p / 1000) * n) : p * n;
  return {
    start: `${p}% of ${n}`,
    mode: "expr",
    steps: [`${p}/100 × ${n}`, shift ? `${p / 1000} × ${n}` : `${p} × ${n}`, String(flawedValue)],
    bad: 1,
    slip: shift ? "pct-shift" : "no-hundred",
    decoys: shift ? ["no-hundred", "change-only"] : ["pct-shift", "change-only"],
    fix: `${p / 100} × ${n}`,
    near: near(
      [
        [`${p / 10} × ${n}`, (p / 10) * n],
        [`${p / 1000} × ${n}`, (p / 1000) * n],
        [`${p} × ${n}`, p * n],
        [`${p / 100} × ${n + p}`, (p / 100) * (n + p)],
      ],
      good,
      flawedValue,
    ),
    answer: String(good),
    meta: { kind: "percent", p, n },
  };
}

function percentChange(rng) {
  const p = pick(rng, [10, 20, 25, 50]);
  const n = pick(rng, [40, 60, 80, 120, 200]);
  const up = rng() < 0.6;
  const [sign, change] = [up ? "+" : "−", (p / 100) * n];
  const good = up ? n + change : n - change;
  return {
    start: `${n} ${sign} ${p}% of ${n}`,
    mode: "expr",
    steps: [`${n} ${sign} ${p / 100} × ${n}`, `${n} ${sign} ${change}`, String(change)],
    bad: 2,
    slip: "change-only",
    decoys: ["pct-shift", "no-hundred"],
    fix: String(good),
    near: near(
      [
        [String(up ? n - change : n + change), up ? n - change : n + change],
        [String(n + p), n + p],
        [String(change * 2), change * 2],
        [String(n - p), n - p],
      ],
      good,
      change,
    ),
    answer: String(good),
    meta: { kind: "pctChange", p, n, up },
  };
}

function ratioEq(rng, { config }) {
  const [a, b] = [
    int(rng, 1, Math.min(9, config.maxPart ?? 9)),
    int(rng, 2, Math.min(9, config.maxPart ?? 9)),
  ];
  if (a === b) return ratioEq(rng, { config });
  const f = int(rng, 2, 6);
  return {
    start: `${a} : ${b}`,
    mode: "expr",
    steps: [`${a}/${b}`, `(${a} + ${f})/(${b} + ${f})`, `${a + f}/${b + f}`],
    bad: 1,
    slip: "add-not-mult",
    decoys: ["flip-ratio", "diff-factor"],
    fix: `(${a} × ${f})/(${b} × ${f})`,
    near: near(
      [
        [`(${a} × ${f})/(${b} + ${f})`, fraction(a * f, b + f)],
        [`(${a} + ${f})/(${b} × ${f})`, fraction(a + f, b * f)],
        [`${b}/${a}`, fraction(b, a)],
        [`(${a} × ${f})/${b}`, fraction(a * f, b)],
      ],
      fraction(a, b),
      fraction(a + f, b + f),
    ),
    answer: `${a * f}/${b * f}`,
    meta: { kind: "ratio", a, b, f },
  };
}

function unitRate(rng) {
  for (let tries = 0; tries < 300; tries += 1) {
    const [u, v, g] = [int(rng, 2, 7), int(rng, 3, 11), int(rng, 2, 5)];
    if (v <= u || gcd(u, v) !== 1) continue;
    return {
      start: `${g * v} ÷ ${g * u}`,
      mode: "expr",
      steps: [`${g * v}/${g * u}`, `${u}/${v}`, `${u}/${v}`],
      bad: 1,
      slip: "flip-ratio",
      decoys: ["add-not-mult", "diff-factor"],
      fix: `${v}/${u}`,
      near: near(
        [
          [`${v}/${u + 1}`, fraction(v, u + 1)],
          [`${v - u}/${u}`, fraction(v - u, u)],
          [`${v + 1}/${u}`, fraction(v + 1, u)],
          [`${g * v}/${u}`, fraction(g * v, u)],
        ],
        fraction(v, u),
        fraction(u, v),
      ),
      answer: `${v}/${u}`,
      meta: { kind: "rate", c: g * v, q: g * u },
    };
  }
  throw new Error("unitRate: no numbers");
}

const UNITS = [
  ["in", "ft", 12],
  ["ft", "yd", 3],
  ["min", "h", 60],
  ["cm", "m", 100],
  ["oz", "lb", 16],
  ["qt", "gal", 4],
  ["mm", "cm", 10],
];
function convert(rng) {
  const [small, big, F] = pick(rng, UNITS);
  const down = rng() < 0.5;
  const q = down ? int(rng, 2, 9) : F * int(rng, 2, 9);
  const [from, to] = down ? [big, small] : [small, big];
  const good = down ? q * F : q / F;
  const flawed = down ? q / F : q * F;
  const [setupGood, setupBad] = down
    ? [`${q} × ${F}/1`, `${q} × 1/${F}`]
    : [`${q} × 1/${F}`, `${q} × ${F}/1`];
    const g = gcd(q, F);
  const stepBad = down ? [`${q}/${F}`, F / g === 1 ? String(q / g) : `${q / g}/${F / g}`] : [`${q} × ${F}`, String(q * F)];
  return {
    start: down ? `${q} × ${F}` : `${q} ÷ ${F}`,
    mode: "expr",
    steps: [setupBad, ...stepBad],
    bad: 0,
    slip: "wrong-unit-op",
    decoys: ["place-value", "one-part"],
    fix: setupGood,
    near: near(
      [
        [`${q} + ${F}`, q + F],
        [`${q} − ${F}`, q - F],
        [`${q} × ${F}/${F}`, q],
        [`${q} × ${F * 10}`, q * F * 10],
      ],
      good,
      flawed,
    ),
    answer: String(good),
    meta: { kind: "convert", q, from, to, small, big, F },
  };
}

function intAddSub(rng) {
  const [a, b, c] = [int(rng, 3, 9), int(rng, 2, 9), int(rng, 2, 9)];
  const lost = rng() < 0.5;
  const start = `${a} − (${neg(-b)}) + (${neg(-c)})`;
  const good = a + b - c;
  const answer = String(good);
  if (lost) {
    return {
      start,
      mode: "expr",
      steps: [`${a} + ${b} + (${neg(-c)})`, `${a + b} + ${c}`, String(a + b + c)],
      bad: 1,
      slip: "lost-sign",
      decoys: ["sub-neg", "neg-neg"],
      fix: `${a + b} − ${c}`,
      near: near(
        [
          [`${a + b} − ${c + 1}`, good - 1],
          [`${a - b} − ${c}`, a - b - c],
          [`${a + b} − ${c + 2}`, good - 2],
          [`${a + b + 1} − ${c}`, good + 1],
        ],
        good,
        a + b + c,
      ),
      answer,
    };
  }
  const flawed = a - b - c;
  return {
    start,
    mode: "expr",
    steps: [`${a} − ${b} + (${neg(-c)})`, `${a - b} + (${neg(-c)})`, neg(flawed)],
    bad: 0,
    slip: "sub-neg",
    decoys: ["lost-sign", "neg-neg"],
    fix: `${a} + ${b} + (${neg(-c)})`,
    near: near(
      [
        [`${a} − ${b} − (${neg(-c)})`, a - b + c],
        [`${a} + ${b} − (${neg(-c)})`, a + b + c],
        [`${a} + ${b} + ${c}`, a + b + c],
        [`${a} − ${b} + ${c}`, a - b + c],
      ],
      good,
      flawed,
    ),
    answer,
  };
}

function intMul(rng) {
  const [a, b, c] = [int(rng, 2, 9), int(rng, 2, 9), int(rng, 2, 6)];
  const good = a * b * c;
  return {
    start: `(${neg(-a)}) × (${neg(-b)}) × ${c}`,
    mode: "expr",
    steps: [`((${neg(-a)}) × (${neg(-b)})) × ${c}`, `(${neg(-a * b)}) × ${c}`, neg(-good)],
    bad: 1,
    slip: "neg-neg",
    decoys: ["lost-sign", "sub-neg"],
    fix: `${a * b} × ${c}`,
    near: near(
      [
        [`${a * b} × ${c + 1}`, a * b * (c + 1)],
        [`${a * b + 1} × ${c}`, (a * b + 1) * c],
        [`${a * b} + ${c}`, a * b + c],
        [`${a * b} − ${c}`, a * b - c],
      ],
      good,
      -good,
    ),
    answer: String(good),
  };
}

export const RATIO = {
  percentOf: { family: "percent", run: percentOf },
  percentChange: { family: "percent", run: percentChange },
  ratioEq: { family: "percent", run: ratioEq },
  unitRate: { family: "percent", run: unitRate },
  convert: { family: "percent", run: convert },
  intAddSub: { family: "integers", run: intAddSub },
  intMul: { family: "integers", run: intMul },
};
