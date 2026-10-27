// Round generators for grades 5 to 8: two related rules, two-step machines, input-output tables, proportional
// and non-proportional tables, y = mx + b, linear versus nonlinear, and exponential growth.
// @fm2 FM-051 FM-056 FM-061
import { pick } from "../../rng.js";
import { CONTEXTS, geo, lin, makeBase, NAMES, PROBES_TWO, R, sq } from "./gen-kit.js";
import { evalSpec, P } from "./rules.js";

const row = (spec, x, m = 0) => ({ m, x, y: P(evalSpec(spec, x)) });
const RATES = [
  [1, 2],
  [3, 2],
  [5, 2],
  [1, 4],
  [3, 4],
  [5, 4],
  [1, 3],
  [2, 3],
  [4, 3],
  [1, 5],
  [2, 5],
  [3, 5],
];
const fractionRate = (rng) => pick(rng, RATES);

export function g5TwoRules(level, rng, grade) {
  const dA = R(rng, 2, 6);
  const k = level === 1 ? 2 : level === 2 ? R(rng, 2, 4) : R(rng, 2, 5);
  const sA = level === 3 ? R(rng, 1, 4) : 0;
  const specs = [lin(dA, sA), lin(k * dA, k * sA)];
  return makeBase("g5-two-rules", level, grade, {
    form: "two",
    show: "graph",
    x0: 0,
    machines: [
      { id: "A", spec: specs[0] },
      { id: "B", spec: specs[1] },
    ],
    dom: { lo: 0, hi: 8, mult: 1 },
    probes: PROBES_TWO[level],
    far: R(rng, 12, 20),
    farM: 1,
    plan: [0, 1].flatMap((x) => [0, 1].map((m) => ({ m, x }))),
    say: { op: "add", x0: 0 },
    cls: { id: "times", answer: String(k), options: ["2", "3", "4", "5"] },
    names: NAMES.step,
  });
}

export function g5Numerical(level, rng, grade) {
  let spec;
  let ops;
  let dom = { lo: 1, hi: 8, mult: 1 };
  if (level === 1) {
    spec = lin(R(rng, 2, 5), R(rng, 1, 9));
    ops = { first: ["×", "+"], second: ["+", "−"] };
  } else if (level === 2) {
    const a = R(rng, 1, 6);
    const b = R(rng, 2, 5);
    spec = lin(b, a * b);
    ops = { first: ["+", "−", "×"], second: ["×", "+", "−"] };
  } else {
    spec = lin(R(rng, 4, 9), -R(rng, 1, 8));
    ops = { first: ["×", "+", "−"], second: ["−", "+", "×"] };
    dom = { lo: 2, hi: 10, mult: 1 };
  }
  return makeBase("g5-numerical-pattern", level, grade, {
    form: "expr",
    machines: [{ id: "A", spec }],
    dom,
    seed: level === 1 ? [row(spec, 1)] : [],
    far: level === 1 ? R(rng, 10, 20) : R(rng, 15, 30),
    ops,
    names: NAMES.machine,
  });
}

export function g6IoTable(level, rng, grade) {
  let spec;
  let ops;
  let dom = { lo: 0, hi: 10, mult: 1 };
  let far = R(rng, 12, 25);
  if (level === 1) {
    spec = lin(1, R(rng, 2, 20));
    ops = { first: ["+", "×"], second: null };
  } else if (level === 2) {
    spec = lin(R(rng, 2, 12), 0);
    ops = { first: ["+", "−", "×", "÷"], second: null };
  } else {
    const [p, q] = fractionRate(rng);
    spec = lin([p, q], 0);
    ops = { first: ["×", "÷", "+", "−"], second: ["÷", "×"] };
    dom = { lo: 0, hi: 8 * q, mult: q };
    far = q * R(rng, 10, 16);
  }
  return makeBase("g6-io-table", level, grade, {
    form: "expr",
    show: "graph",
    vars: "x",
    showVars: true,
    machines: [{ id: "A", spec }],
    dom,
    seed: level === 1 ? [row(spec, 1)] : [],
    far,
    ops,
    names: NAMES.machine,
  });
}

export function g6Variables(level, rng, grade) {
  const ctx = pick(rng, CONTEXTS);
  const spec =
    level === 1
      ? lin(R(rng, 2, 9), 0)
      : level === 2
        ? lin(1, R(rng, 2, 20))
        : lin(R(rng, 2, 6), R(rng, 1, 12));
  const order = rng() < 0.5 ? ["in", "out"] : ["out", "in"];
  return makeBase("g6-variables", level, grade, {
    form: "expr",
    show: "graph",
    vars: "x",
    showVars: true,
    machines: [{ id: "A", spec }],
    dom: { lo: 0, hi: 10, mult: 1 },
    seed: level === 1 ? [row(spec, 1)] : [],
    far: R(rng, 12, 25),
    ops:
      level === 3 ? { first: ["×", "+"], second: ["+", "−"] } : { first: ["+", "×"], second: null },
    names: ctx,
    ctx,
    cls: { id: "dep", answer: "out", options: order },
  });
}

// Proportional skills share the line form y = m·x + b; `lockB` fixes b at 0 for the constant-of-proportionality skill.
function proportionalRate(level, rng) {
  if (level === 1) return { m: [R(rng, 2, 9), 1], mult: 1 };
  if (level === 2) return { m: [2 * R(rng, 1, 9) + 1, 2], mult: 2 };
  const q = pick(rng, [3, 4, 5]);
  let p = R(rng, 1, 3 * q);
  if (p % q === 0) p += 1;
  return { m: [p, q], mult: q };
}
const lineDomain = (mult, level) => ({
  lo: 0,
  hi: mult === 1 ? 10 : level === 2 ? 20 : 6 * mult,
  mult,
});

export function g7Proportional(level, rng, grade) {
  const { m, mult } = proportionalRate(level, rng);
  const isProp = rng() < 0.5;
  const b = isProp
    ? 0
    : level === 3 && rng() < 0.5
      ? -R(rng, 1, 8)
      : R(rng, 1, level === 1 ? 5 : 8);
  return makeBase("g7-proportional", level, grade, {
    form: "line",
    show: "graph",
    vars: "x",
    showVars: true,
    machines: [{ id: "A", spec: lin(m, b) }],
    dom: lineDomain(mult, level),
    far: mult * R(rng, mult === 1 ? 12 : 11, mult === 1 ? 25 : 16),
    cls: { id: "prop", answer: isProp ? "yes" : "no", options: ["yes", "no"] },
    names: NAMES.machine,
  });
}

export function g7ConstantK(level, rng, grade) {
  const { m, mult } = proportionalRate(level, rng);
  return makeBase("g7-constant-k", level, grade, {
    form: "line",
    show: "graph",
    vars: "x",
    showVars: true,
    machines: [{ id: "A", spec: lin(m, 0) }],
    dom: lineDomain(mult, level),
    far: mult * R(rng, mult === 1 ? 12 : 11, mult === 1 ? 25 : 16),
    say: { lockB: true },
    names: NAMES.machine,
  });
}

export function g7LinearEq(level, rng, grade) {
  let m;
  let b;
  let mult = 1;
  if (level === 1) {
    m = [R(rng, 1, 9), 1];
    b = R(rng, 1, 9);
  } else if (level === 2) {
    m = rng() < 0.5 ? [R(rng, 2, 9), 1] : [2 * R(rng, 1, 5) + 1, 2];
    mult = m[1];
    b = (rng() < 0.5 ? -1 : 1) * R(rng, 1, 9);
  } else if (grade >= 8) {
    const half = rng() < 0.5;
    m = half ? [-(2 * R(rng, 0, 4) + 1), 2] : [-R(rng, 1, 5), 1];
    mult = m[1];
    b = R(rng, -9, 9) || 4;
  } else {
    const q = R(rng, 2, 4);
    m = [q * R(rng, 1, 3) + 1, q];
    mult = q;
    b = -R(rng, 1, 8);
  }
  return makeBase("g7-linear-eq", level, grade, {
    form: "line",
    show: "graph",
    vars: "x",
    showVars: true,
    machines: [{ id: "A", spec: lin(m, b) }],
    dom: { lo: 0, hi: mult === 1 ? 10 : 6 * mult, mult },
    far: mult * R(rng, mult === 1 ? 12 : 8, mult === 1 ? 25 : 14),
    names: NAMES.machine,
  });
}

export function g8LinearNonlinear(level, rng, grade) {
  const kind =
    level === 1
      ? pick(rng, ["lin", "sq"])
      : pick(rng, level === 2 ? ["lin", "sq"] : ["lin", "sq", "geo"]);
  let spec;
  if (kind === "lin") {
    const m = level === 1 ? R(rng, 1, 5) : (rng() < 0.3 ? -1 : 1) * R(rng, 1, 6);
    spec = lin(m, R(rng, -5, 5));
  } else if (kind === "sq") spec = sq(level === 1 ? 1 : R(rng, 1, 3), R(rng, -3, 6));
  else spec = geo(R(rng, 1, 5), pick(rng, [2, 3]), 0);
  const cap = kind === "geo" && spec.r[0] === 3 ? 10 : 12;
  return makeBase("g8-linear-nonlinear", level, grade, {
    form: "typed",
    show: "graph",
    vars: "x",
    showVars: true,
    machines: [{ id: "A", spec }],
    dom: { lo: 0, hi: 8, mult: 1 },
    far: R(rng, 9, cap),
    plan: [1, 2, 3].map((x) => ({ m: 0, x })),
    cls: { id: "linear", answer: kind === "lin" ? "lin" : "non", options: ["lin", "non"] },
    names: NAMES.machine,
  });
}

export function g8Slope(level, rng, grade) {
  let m;
  let b = R(rng, -9, 9);
  let dom = { lo: 0, hi: 8, mult: 1 };
  let mult = 1;
  if (level === 1) {
    m = [R(rng, 1, 5), 1];
    b = R(rng, 0, 9);
  } else if (level === 2) {
    m = [(rng() < 0.5 ? -1 : 1) * R(rng, 1, 5), 1];
    dom = { lo: -5, hi: 5, mult: 1 };
  } else {
    const q = R(rng, 2, 4);
    let p = R(rng, 1, 3 * q);
    if (p % q === 0) p += 1;
    m = [(rng() < 0.5 ? -1 : 1) * p, q];
    mult = q;
    dom = { lo: -6, hi: 6, mult: q };
  }
  return makeBase("g8-slope", level, grade, {
    form: "line",
    show: "graph",
    vars: "x",
    showVars: true,
    machines: [{ id: "A", spec: lin(m, b) }],
    dom,
    far: mult * R(rng, mult === 1 ? 9 : 7, mult === 1 ? 20 : 12),
    names: NAMES.machine,
  });
}

export function g8Exponential(level, rng, grade) {
  const useAdd = level === 3 && rng() < 0.5;
  const r = level === 1 ? 2 : pick(rng, [2, 3]);
  const c = level === 1 ? R(rng, 1, 12) : R(rng, 1, 9);
  const spec = useAdd ? lin(R(rng, 2, 9), c) : geo(c, r, 0);
  return makeBase("g8-exponential", level, grade, {
    form: "seq",
    show: "terms",
    x0: 0,
    machines: [{ id: "A", spec }],
    dom: { lo: 0, hi: 6, mult: 1 },
    far: R(rng, 7, 10),
    plan: [0, 1, 2].map((x) => ({ m: 0, x })),
    say: { op: level === 3 ? "both" : "mul", x0: 0 },
    names: NAMES.step,
    vars: "x",
    showVars: true,
  });
}
