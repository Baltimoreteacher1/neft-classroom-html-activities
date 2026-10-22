// Expression, equation, inequality, exponent and geometry worked solutions with one flawed step.
import { int, pick, gcd, round, repeat, near, fraction } from "./mistake-kit.js";

function orderOps(rng, _ctx, fn = false) {
  const [b, c, d] = [int(rng, 2, 5), int(rng, 1, 5), int(rng, 1, 4)];
  const inner = c + d;
  const a = b * inner + int(rng, 3, 12);
  const good = a - b * inner;
  const flawed = (a - b) * inner;
  const start = `${a} − ${b} × (${c} + ${d})`;
  return {
    start,
    mode: "expr",
    steps: [`${a} − ${b} × ${inner}`, `${a - b} × ${inner}`, String(flawed)],
    bad: 1,
    slip: "order-ops",
    decoys: ["one-part", "lost-sign"],
    fix: `${a} − ${b * inner}`,
    near: near(
      [
        [`${a} − ${b + inner}`, a - b - inner],
        [`${a} − ${b * inner + 1}`, good - 1],
        [`${a} + ${b * inner}`, a + b * inner],
        [`${a} − ${b * inner - 1}`, good + 1],
      ],
      good,
      flawed,
    ),
    answer: String(good),
    meta: fn ? { kind: "function", a, b, c, d } : undefined,
  };
}

function solveLinear(rng, { config }) {
  const maxA = Math.min(12, Math.max(3, config.maxCoefficient ?? 9));
  const [lo, hi] = [config.minX ?? 1, config.maxX ?? 12];
  for (let tries = 0; tries < 300; tries += 1) {
    const [a, x, b] = [int(rng, 2, maxA), int(rng, lo, hi), int(rng, 1, 12)];
    const c = a * x + b;
    if (x === 0 || c - b - a === x) continue;
    const oneSide = rng() < 0.5;
    const start = `${a}x + ${b} = ${c}`;
    const both = `${a}x + ${b} − ${b} = ${c} − ${b}`;
    if (oneSide) {
      return {
        start,
        mode: "eq",
        steps: [both, `${a}x = ${c}`, `x = ${c}/${a}`],
        bad: 1,
        slip: "one-side",
        decoys: ["wrong-undo", "one-part"],
        fix: `${a}x = ${c - b}`,
        near: near(
          [
            [`${a}x = ${c + b}`, (c + b) / a],
            [`${a}x = ${c - b - 1}`, (c - b - 1) / a],
            [`${a}x = ${b - c}`, (b - c) / a],
            [`x = ${c - b}`, c - b],
          ],
          x,
          c / a,
        ),
        answer: String(x),
      };
    }
    return {
      start,
      mode: "eq",
      steps: [both, `${a}x = ${c - b}`, `x = ${c - b - a}`],
      bad: 2,
      slip: "wrong-undo",
      decoys: ["one-side", "order-ops"],
      fix: `x = ${x}`,
      near: near(
        [
          [`x = ${x + 1}`, x + 1],
          [`x = ${(c - b) * a}`, (c - b) * a],
          [`x = ${x - 1}`, x - 1],
          [`x = ${c - b + a}`, c - b + a],
        ],
        x,
        c - b - a,
      ),
      answer: String(x),
    };
  }
  throw new Error("solveLinear: no numbers");
}

function solveDistribute(rng, { config }) {
  const [m, p, x] = [
    int(rng, 2, 6),
    int(rng, 1, 6),
    int(rng, config.minX ?? 1, Math.min(9, config.maxX ?? 9)),
  ];
  const q = m * (x + p);
  return {
    start: `${m}(x + ${p}) = ${q}`,
    mode: "eq",
    steps: [`${m}x + ${p} = ${q}`, `${m}x = ${q - p}`, `x = ${q - p}/${m}`],
    bad: 0,
    slip: "one-part",
    decoys: ["wrong-undo", "one-side"],
    fix: `${m}x + ${m * p} = ${q}`,
    near: near(
      [
        [`${m}x + ${m + p} = ${q}`, (q - m - p) / m],
        [`${m}x + ${p * p} = ${q}`, (q - p * p) / m],
        [`x + ${m * p} = ${q}`, q - m * p],
        [`${m}x − ${m * p} = ${q}`, (q + m * p) / m],
      ],
      x,
      (q - p) / m,
    ),
    answer: String(x),
  };
}

const FLIP = { ">": "<", "<": ">", "≥": "≤", "≤": "≥" };
function inequality(rng) {
  const [a, k, b] = [int(rng, 2, 6), int(rng, -8, 8), int(rng, 1, 12)];
  const rel = pick(rng, [">", "<", "≥", "≤"]);
  if (k === 0) return inequality(rng);
  const c = b - a * k;
  return {
    start: `−${a}x + ${b} ${rel} ${c}`,
    mode: "eq",
    steps: [`−${a}x + ${b} − ${b} ${rel} ${c} − ${b}`, `−${a}x ${rel} ${c - b}`, `x ${rel} ${k}`],
    bad: 2,
    slip: "no-flip-ineq",
    decoys: ["wrong-undo", "one-side"],
    fix: `x ${FLIP[rel]} ${k}`,
    near: near(
      [
        [`x ${rel} ${-k}`, `${rel}${-k}`],
        [`x ${FLIP[rel]} ${-k}`, `${FLIP[rel]}${-k}`],
        [`x ${FLIP[rel]} ${k + 1}`, `${FLIP[rel]}${k + 1}`],
        [`x ${rel} ${c - b + a}`, `${rel}${c - b + a}`],
      ],
      `${FLIP[rel]}${k}`,
      `${rel}${k}`,
    ),
    answer: `x ${FLIP[rel]} ${k}`,
  };
}

function power(rng, ctx) {
  const maxB = Math.min(9, ctx.config.maxBase ?? 6);
  for (let tries = 0; tries < 100; tries += 1) {
    const [k, b, e] = [
      int(rng, 2, 5),
      int(rng, 2, maxB),
      int(rng, 2, Math.min(4, ctx.config.maxExponent ?? 3)),
    ];
    if (b === 2 && e === 2) continue;
    return {
      start: `${k} × ${b}^${e}`,
      mode: "expr",
      steps: [`${k} × (${repeat(b, e)})`, `${k} × ${b * e}`, String(k * b * e)],
      bad: 1,
      slip: "exp-slip",
      decoys: ["order-ops", "sq-sum"],
      fix: `${k} × ${b ** e}`,
      near: near(
        [
          [`${k * b} × ${b ** (e - 1)}`, k * b * b ** (e - 1)],
          [`${k} × ${b ** e + 1}`, k * (b ** e + 1)],
          [`${k} × ${b ** (e - 1)}`, k * b ** (e - 1)],
          [`${k + b ** e}`, k + b ** e],
        ],
        k * b ** e,
        k * b * e,
      ),
      answer: String(k * b ** e),
    };
  }
  throw new Error("power: no numbers");
}

function powerTen(rng) {
  const [d, p] = [pick(rng, [1.5, 2.4, 3.7, 4.5, 6.2, 7.8]), int(rng, 2, 5)];
  const good = round(d * 10 ** p);
  return {
    start: `${d} × 10^${p}`,
    mode: "expr",
    steps: [`${d} × (${repeat(10, p)})`, `${d} × ${10 * p}`, String(round(d * 10 * p))],
    bad: 1,
    slip: "exp-slip",
    decoys: ["place-value", "order-ops"],
    fix: `${d} × ${10 ** p}`,
    near: near(
      [
        [`${d} × ${10 ** (p - 1)}`, d * 10 ** (p - 1)],
        [`${d} × ${10 ** (p + 1)}`, d * 10 ** (p + 1)],
        [`${d} × ${p * p}`, d * p * p],
        [`${d} + ${10 ** p}`, d + 10 ** p],
      ],
      good,
      d * 10 * p,
    ),
    answer: String(good),
  };
}

const TRIPLES = [
  [3, 4],
  [6, 8],
  [5, 12],
  [8, 15],
  [9, 12],
  [7, 24],
  [9, 40],
];
function pythagoras(rng) {
  const [a, b] = pick(rng, TRIPLES);
  const [good, flawed] = [a * a + b * b, (a + b) ** 2];
  return {
    start: `${a}^2 + ${b}^2`,
    mode: "expr",
    steps: [`(${a} + ${b})^2`, `${a + b}^2`, String(flawed)],
    bad: 0,
    slip: "sq-sum",
    decoys: ["exp-slip", "order-ops"],
    fix: `${a} × ${a} + ${b} × ${b}`,
    near: near(
      [
        [`${a} × ${b} + ${a} × ${b}`, 2 * a * b],
        [`${a} + ${b} + ${a} + ${b}`, 2 * (a + b)],
        [`${a} × ${a} + ${b}`, a * a + b],
        [`${a * a} × ${b * b}`, a * a * b * b],
      ],
      good,
      flawed,
    ),
    answer: String(good),
    meta: { kind: "pyth", a, b },
  };
}

function slope(rng) {
  for (let tries = 0; tries < 300; tries += 1) {
    const [x1, y1, dx, dy] = [int(rng, 0, 4), int(rng, 0, 5), int(rng, 2, 9), int(rng, 2, 12)];
    const g = gcd(dx, dy);
    if (g < 2 || dx === dy) continue;
    return {
      start: `(${y1 + dy} − ${y1})/(${x1 + dx} − ${x1})`,
      mode: "expr",
      steps: [`${dy}/${dx}`, `${dx / g}/${dy / g}`, `${dx / g}/${dy / g}`],
      bad: 1,
      slip: "flip-ratio",
      decoys: ["add-not-mult", "diff-factor"],
      fix: `${dy / g}/${dx / g}`,
      near: near(
        [
          [`${dy / g}/${dx / g + 1}`, fraction(dy / g, dx / g + 1)],
          [`${dy / g + 1}/${dx / g}`, fraction(dy / g + 1, dx / g)],
          [`${dy - dx}/${g}`, (dy - dx) / g],
          [`${dy}/${dx}`, fraction(dy, dx)],
        ]
          .slice(0, 3)
          .concat([[`${dy / g}/${dx}`, fraction(dy / g, dx)]]),
        fraction(dy, dx),
        fraction(dx, dy),
      ),
      answer: `${dy / g}/${dx / g}`,
      meta: { kind: "slope", x1, y1, x2: x1 + dx, y2: y1 + dy },
    };
  }
  throw new Error("slope: no numbers");
}

function perimeter(rng, { config }) {
  const [l, w] = [int(rng, 3, config.max ?? 12), int(rng, 2, 9)];
  if (l === w) return perimeter(rng, { config });
  return {
    start: `2 × (${l} + ${w})`,
    mode: "expr",
    steps: [`${l} + ${l} + ${w} + ${w}`, `${2 * l} + ${w}`, String(2 * l + w)],
    bad: 1,
    slip: "dropped-side",
    decoys: ["add-not-mult", "one-part"],
    fix: `${2 * l} + ${2 * w}`,
    near: near(
      [
        [`${2 * l} + ${3 * w}`, 2 * l + 3 * w],
        [`${l} + ${w} + ${w}`, l + 2 * w],
        [`${2 * l + 2} + ${2 * w}`, 2 * l + 2 + 2 * w],
        [`${l * l} + ${w * w}`, l * l + w * w],
      ],
      2 * (l + w),
      2 * l + w,
    ),
    answer: String(2 * (l + w)),
    meta: { kind: "perimeter", l, w },
  };
}

function volume(rng, { config }) {
  const [l, w, h] = [int(rng, 2, Math.min(9, config.max ?? 9)), int(rng, 2, 8), int(rng, 2, 7)];
  const good = l * w * h;
  return {
    start: `${l} × ${w} × ${h}`,
    mode: "expr",
    steps: [`(${l} + ${w}) × ${h}`, `${l + w} × ${h}`, String((l + w) * h)],
    bad: 0,
    slip: "add-not-mult",
    decoys: ["dropped-side", "one-part"],
    fix: `(${l} × ${w}) × ${h}`,
    near: near(
      [
        [`(${l} × ${w}) + ${h}`, l * w + h],
        [`${l} × ${w} × ${h + 1}`, l * w * (h + 1)],
        [`(${l} + ${w}) × (${h} + 1)`, (l + w) * (h + 1)],
        [`${l} × ${w} × ${h} × ${h}`, good * h],
      ],
      good,
      (l + w) * h,
    ),
    answer: String(good),
    meta: { kind: "volume", l, w, h },
  };
}

function circleArea(rng) {
  const r = int(rng, 3, 12);
  return {
    start: `π × ${r}^2`,
    mode: "expr",
    steps: [`π × ${r} × ${r}`, `π × ${2 * r}`, `${2 * r}π`],
    bad: 1,
    slip: "r-doubled",
    decoys: ["sq-sum", "exp-slip"],
    fix: `π × ${r * r}`,
    near: near(
      [
        [`π × ${r * 4}`, r * 4],
        [`π × ${r * r + r}`, r * r + r],
        [`π × ${r * r * 2}`, r * r * 2],
        [`π × ${r + r + r}`, r * 3],
      ],
      r * r,
      2 * r,
    ),
    answer: `${r * r}π`,
    meta: { kind: "circle", r },
  };
}

export const ALGEBRA = {
  orderOps: { family: "algebra", run: orderOps },
  functionRule: { family: "algebra", run: (rng, ctx) => orderOps(rng, ctx, true) },
  solveLinear: { family: "algebra", run: solveLinear },
  solveDistribute: { family: "algebra", run: solveDistribute },
  inequality: { family: "algebra", run: inequality },
  power: { family: "algebra", run: power },
  powerTen: { family: "algebra", run: powerTen },
  pythagoras: { family: "geometry", run: pythagoras },
  slope: { family: "geometry", run: slope },
  perimeter: { family: "geometry", run: perimeter },
  volume: { family: "geometry", run: volume },
  circleArea: { family: "geometry", run: circleArea },
};
