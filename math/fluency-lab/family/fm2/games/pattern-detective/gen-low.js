// Round generators for kindergarten to grade 4: repeating shape patterns, counting machines, skip counting,
// growing shapes, tables and rule-made number patterns. Each returns the pieces makeBase() turns into a round.
// @fm2 FM-051 FM-061
import { pick, sample, shuffle } from "../../rng.js";
import { evalSpec, P } from "./rules.js";
import { fitFar, geo, lin, makeBase, NAMES, R, SYMBOLS, skip } from "./gen-kit.js";

const termRow = (spec, x, m = 0) => ({ m, x, y: P(evalSpec(spec, x)) });
const termAt = (s, d, n) => s + d * (n - 1);

export function kCore(level, rng, grade) {
  const syms = sample(rng, SYMBOLS, level === 3 ? 3 : 2);
  const [a, b, c] = syms;
  const core =
    level === 1
      ? [a, b]
      : level === 2
        ? pick(rng, [
            [a, a, b],
            [a, b, b],
          ])
        : [a, b, c];
  const far = level === 1 ? R(rng, 11, 14) : level === 2 ? R(rng, 12, 18) : R(rng, 14, 24);
  const seed = [1, 2].map((x) => ({ m: 0, x, y: core[(x - 1) % core.length] }));
  return makeBase("k-core", level, grade, {
    form: "cycle",
    show: "strip",
    machines: [{ id: "A", spec: { t: "cyc", core } }],
    dom: { lo: 1, hi: 10, mult: 1 },
    seed,
    far: far + (grade >= 1 ? 1 : 0),
    plan: [3, 4, 5].slice(0, level === 3 ? 3 : 3).map((x) => ({ m: 0, x })),
    alpha: shuffle(rng, syms),
    say: { maxCore: level === 1 ? 2 : 3 },
    names: NAMES.term,
  });
}

export function kCountOn(level, rng, grade) {
  const add = level === 1 ? R(rng, 1, 3) : level === 2 ? R(rng, 3, 6) : R(rng, 6, 10);
  const far = level === 1 ? R(rng, 11, 25) : level === 2 ? R(rng, 12, 30) : R(rng, 15, 40);
  const spec = lin(1, add);
  return makeBase("k-count-on", level, grade, {
    form: "expr",
    machines: [{ id: "A", spec }],
    dom: { lo: 0, hi: 10, mult: 1 },
    seed: level === 1 ? [termRow(spec, 2)] : [],
    far: far + (grade >= 1 ? 2 : 0),
    ops: { first: ["+"], second: null },
    names: NAMES.machine,
  });
}

const skipRound = (skillId, level, grade, s, d, extra) =>
  makeBase(skillId, level, grade, {
    form: "seq",
    show: extra.show || "terms",
    x0: 1,
    machines: [{ id: "A", spec: skip(s, d) }],
    dom: extra.dom,
    seed: extra.seed || [],
    far: extra.far,
    say: { op: "add", x0: 1 },
    names: extra.names || NAMES.term,
    fig: extra.fig || null,
    cls: extra.cls || null,
  });

export function g1CountPattern(level, rng, grade) {
  const d =
    level === 1 ? pick(rng, [1, 2]) : level === 2 ? pick(rng, [5, 10]) : pick(rng, [2, 5, 10]);
  const s = level === 1 ? R(rng, 0, 10) : level === 2 ? R(rng, 0, 20) : R(rng, 1, 20);
  const hi = level === 1 ? 6 : 8;
  const far = fitFar(rng, hi + 1, level === 1 ? 12 : 13, (n) => termAt(s, d, n), 120);
  const seed = level === 1 ? [termRow(skip(s, d), 1)] : [];
  return skipRound("g1-count-pattern", level, grade, s, d, {
    dom: { lo: 1, hi, mult: 1 },
    far,
    seed,
  });
}

export function g1GrowShape(level, rng, grade) {
  const d = level === 1 ? 1 : level === 2 ? 2 : R(rng, 2, grade >= 2 ? 4 : 3);
  const base = level === 1 ? R(rng, 1, 6) : level === 2 ? R(rng, 0, 5) : R(rng, 1, 6);
  const s = d + base;
  const far = R(rng, 8, grade >= 2 ? 16 : 14);
  const seed = level === 1 ? [termRow(skip(s, d), 1)] : [];
  return skipRound("g1-grow-shape", level, grade, s, d, {
    show: "figure",
    names: NAMES.figure,
    dom: { lo: 1, hi: 6, mult: 1 },
    far,
    seed,
    fig: { a: d, b: base },
  });
}

export function g2Skip(level, rng, grade) {
  const steps =
    grade <= 2
      ? [
          [2, 5, 10],
          [2, 5, 10],
          [3, 4, 6],
        ]
      : [
          [2, 5, 10],
          [3, 4, 6],
          [7, 8, 9],
        ];
  const d = pick(rng, steps[level - 1]);
  const s = level === 1 ? d * R(rng, 0, 4) : level === 2 ? R(rng, 1, 20) : R(rng, 1, 40);
  const far = R(rng, level === 3 ? 12 : 10, level === 3 ? 16 : 14);
  return skipRound("g2-skip", level, grade, s, d, { dom: { lo: 1, hi: 8, mult: 1 }, far });
}

export function g2HundredChart(level, rng, grade) {
  const steps = [
    [10, 5, 2],
    [3, 4, 6, 9],
    [7, 8, 9, 11],
  ][level - 1];
  const d = pick(rng, steps);
  const far = R(rng, 8, 10);
  const room = 100 - d * (far - 1);
  const s = R(rng, 1, Math.max(1, Math.min(level === 3 ? 20 : 10, room)));
  return skipRound("g2-hundred-chart", level, grade, s, d, {
    show: "chart",
    names: NAMES.chart,
    dom: { lo: 1, hi: 6, mult: 1 },
    far,
  });
}

export function g2EvenOdd(level, rng, grade) {
  const d =
    level === 1 ? 2 : level === 2 ? pick(rng, [1, 3, 5]) : pick(rng, [2, 4, 10, 1, 3, 5, 7]);
  const s = level === 3 ? R(rng, 1, 60) : R(rng, 1, 20);
  const answer = d % 2 === 0 ? (s % 2 === 0 ? "even" : "odd") : "alt";
  const far = R(rng, 10, 16);
  return skipRound("g2-even-odd", level, grade, s, d, {
    dom: { lo: 1, hi: 8, mult: 1 },
    far,
    cls: { id: "parity", answer, options: ["even", "odd", "alt"] },
  });
}

export function g3TimesTable(level, rng, grade) {
  const k = level === 1 ? R(rng, 1, 9) : level === 2 ? R(rng, 2, 6) : R(rng, 7, 12);
  const spec = level === 1 ? lin(1, k) : lin(k, 0);
  const far = level === 1 ? R(rng, 12, 20) : R(rng, 11, 20);
  return makeBase("g3-times-table", level, grade, {
    form: "expr",
    machines: [{ id: "A", spec }],
    dom: { lo: 1, hi: 10, mult: 1 },
    seed: level === 1 ? [termRow(spec, 1)] : [],
    far,
    ops: { first: level === 1 ? ["+"] : ["+", "×"], second: null },
    names: NAMES.row,
  });
}

export function g3ArithRule(level, rng, grade) {
  if (level === 1) {
    const d = R(rng, 3, 9);
    const s = R(rng, 1, 20);
    return skipRound("g3-arith-rule", level, grade, s, d, {
      dom: { lo: 1, hi: 8, mult: 1 },
      far: R(rng, 10, 15),
    });
  }
  const a = level === 2 ? R(rng, 2, 5) : R(rng, 3, 9);
  const minus = level === 3 && rng() < 0.5;
  const b = level === 2 ? R(rng, 1, 5) : minus ? R(rng, 1, a) : R(rng, 1, 9);
  const far = level === 2 ? R(rng, 10, 20) : R(rng, 12, 25) + (grade >= 4 ? 5 : 0);
  return makeBase("g3-arith-rule", level, grade, {
    form: "expr",
    machines: [{ id: "A", spec: lin(a, minus ? -b : b) }],
    dom: { lo: 1, hi: 8, mult: 1 },
    far,
    ops: { first: ["×", "+"], second: ["+", "−"] },
    names: NAMES.term,
  });
}

export function g4RulePattern(level, rng, grade) {
  const useGeo = level > 1 && rng() < 0.5;
  const dom = { lo: 1, hi: level === 1 ? 6 : 5, mult: 1 };
  let spec;
  let far;
  if (useGeo) {
    const r = level === 2 ? R(rng, 2, 3) : R(rng, 2, 5);
    const s = R(rng, 1, r <= 3 ? (level === 2 ? 5 : 6) : 3);
    spec = geo(s, r, 1);
    far = R(rng, 6, r <= 3 ? 8 : 6);
  } else {
    const d = level === 1 ? R(rng, 3, 12) : level === 2 ? R(rng, 2, 9) : R(rng, 5, 25);
    const s = level === 3 ? R(rng, 1, 30) : R(rng, 1, level === 1 ? 20 : 12);
    spec = skip(s, d);
    far = R(rng, dom.hi + 1, level === 1 ? 12 : 12 + (level === 3 ? 3 : 0));
  }
  return makeBase("g4-rule-pattern", level, grade, {
    form: "seq",
    show: "terms",
    x0: 1,
    machines: [{ id: "A", spec }],
    dom,
    far,
    say: { op: level === 1 ? "add" : "both", x0: 1 },
    names: NAMES.term,
  });
}

export function g4ShapeNth(level, rng, grade) {
  const a = level === 1 ? R(rng, 2, 4) : level === 2 ? R(rng, 2, 5) : R(rng, 3, 6);
  const b = level === 1 ? R(rng, 1, 4) : level === 2 ? R(rng, 1, 6) : R(rng, 1, 8);
  const far = level === 1 ? R(rng, 8, 14) : level === 2 ? R(rng, 10, 20) : R(rng, 20, 40);
  const spec = lin(a, b);
  return makeBase("g4-shape-nth", level, grade, {
    form: "expr",
    show: "figure",
    machines: [{ id: "A", spec }],
    dom: { lo: 1, hi: 6, mult: 1 },
    seed: level === 1 ? [termRow(spec, 1)] : [],
    far,
    ops: { first: ["×"], second: level === 3 ? ["+", "−"] : ["+"] },
    names: NAMES.figure,
    fig: { a, b },
  });
}
