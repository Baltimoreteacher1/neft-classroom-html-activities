// HOP generators: a start, a goal, and hop buttons. The minimum number of hops is found by breadth-first search over exact
// positions, and the cap shown to the learner is that minimum plus a slack that shrinks with the level. @fm2 FM-012 FM-050 FM-060
import { cmp, frac, lcm, neg } from "../../rational.js";
import { int, pick } from "../../rng.js";
import { makePrompt } from "./copy.js";
import { showNum } from "./format.js";
import { F, labelsBy } from "./place-round.js";

// Shortest list of hops from start to target that never leaves [min, max]; null when the goal cannot be reached.
export function shortestPlan(min, max, start, target, hops) {
  const unit = [min, max, start, target, ...hops].reduce((a, v) => lcm(a, v.d), 1);
  const scaled = (v) => v.n * (unit / v.d);
  const [lo, hi, from, to] = [min, max, start, target].map(scaled);
  const steps = hops.map(scaled);
  const prev = new Map([[from, null]]);
  const queue = [from];
  for (let i = 0; i < queue.length && !prev.has(to); i += 1) {
    steps.forEach((step, j) => {
      const next = queue[i] + step;
      if (next >= lo && next <= hi && !prev.has(next)) {
        prev.set(next, [queue[i], j]);
        queue.push(next);
      }
    });
  }
  if (!prev.has(to)) return null;
  const plan = [];
  for (let at = to; prev.get(at); at = prev.get(at)[0]) plan.push(hops[prev.get(at)[1]]);
  return plan.reverse();
}

function hopRound(o) {
  const plan = shortestPlan(o.line.min, o.line.max, o.start, o.target, o.hops);
  if (!plan || plan.length < (o.minHops ?? 2) || plan.length > 12 || cmp(o.start, o.target) === 0)
    return null;
  const cap = plan.length + o.slack;
  const step = o.hops.map((h) => (h.n < 0 ? neg(h) : h)).reduce((a, b) => (cmp(a, b) <= 0 ? a : b));
  return {
    skill: o.skill,
    level: o.level,
    kind: "hop",
    family: o.family,
    line: { ...o.line, step },
    mode: o.mode,
    hops: o.hops,
    start: o.start,
    target: o.target,
    plan,
    minHops: plan.length,
    cap,
    detail: o.detail,
    marks: [],
    traps: [],
    prompt: makePrompt(o.promptKey, { ...o.vars, c: String(cap) }),
  };
}

function first(make) {
  for (let tries = 0; tries < 300; tries += 1) {
    const round = make();
    if (round) return round;
  }
  throw new RangeError("hop round: no valid start and goal found");
}

export function kHop(rng, level, grade) {
  const max = grade === 0 ? (level === 1 ? 10 : 20) : [20, 30, 40][level - 1];
  const hops = [[1], [1, -1], [1, -1, 2, -2]][level - 1].map((n) => F(n));
  return first(() => {
    const s = int(rng, 0, max);
    const size = int(rng, level === 1 ? 2 : 3, level === 1 ? 5 : 8);
    const t = level === 1 || pick(rng, [true, false]) ? s + size : s - size;
    if (t < 0 || t > max) return null;
    return hopRound({
      rng,
      skill: "k-hop-count",
      family: "hop-count",
      level,
      line: { min: F(0), max: F(max), ticks: F(1), labels: labelsBy(0, max, max > 20 ? 10 : 5) },
      mode: "int",
      hops,
      start: F(s),
      target: F(t),
      slack: [0, 1, 1][level - 1],
      minHops: 2,
      detail: { kind: "count" },
      promptKey: "hop",
      vars: { s: String(s), t: String(t) },
    });
  });
}

export function g1Hops(rng, level, grade) {
  const big = grade === 2;
  const max = big ? 1000 : 100;
  const unit = big ? 100 : 10;
  const sets = big
    ? [
        [100, 10, 1],
        [100, 10, 1, -100, -10, -1],
        [100, 50, 10, 1, -100, -50, -10, -1],
      ]
    : [
        [10, 1],
        [10, 1, -10, -1],
        [10, 5, 1, -10, -5, -1],
      ];
  const hops = sets[level - 1].map((n) => F(n));
  return first(() => {
    const s = int(rng, 0, max);
    const size = (big ? 100 * int(rng, 1, 5) : 0) + 10 * int(rng, big ? 0 : 1, 6) + int(rng, 0, level === 1 ? 5 : 8);
    const t = level === 1 || pick(rng, [true, false]) ? s + size : s - size;
    if (t < 0 || t > max || size < 12) return null;
    return hopRound({
      rng,
      skill: "g1-hop-tens-ones",
      family: "hop-tens",
      level,
      line: { min: F(0), max: F(max), ticks: F(unit), labels: labelsBy(0, max, unit) },
      mode: "int",
      hops,
      start: F(s),
      target: F(t),
      slack: [3, 2, 1][level - 1],
      detail: { kind: "tens", big },
      promptKey: "hop",
      vars: { s: String(s), t: String(t) },
    });
  });
}

export function g2Skip(rng, level) {
  const k = pick(
    rng,
    [
      [5, 10],
      [2, 5, 10],
      [5, 10, 100],
    ][level - 1],
  );
  const max = level === 3 ? 1000 : 100;
  const m = int(rng, 3, 8);
  const hops = [k, 1].map((n) => F(n));
  return first(() => {
    const s =
      level === 3 ? int(rng, 0, max - k * m) : k * int(rng, 0, Math.floor((max - k * m) / k));
    if (s + k * m > max || s < 0) return null;
    return hopRound({
      rng,
      skill: "g2-skip-hops",
      family: "hop-skip",
      level,
      line: { min: F(0), max: F(max), ticks: F(max / 10), labels: labelsBy(0, max, max / 10) },
      mode: "int",
      hops,
      start: F(s),
      target: F(s + k * m),
      slack: 0,
      detail: { kind: "skip", k, m },
      promptKey: "hopSkip",
      vars: { k: String(k), s: String(s), t: String(s + k * m) },
    });
  });
}

const RATIONAL_HOPS = [
  { r: 15, unit: 1, mode: "int", hops: [5, 1, -5, -1], tick: F(1), by: 5, slack: 2 },
  { r: 6, unit: 2, mode: "dec", hops: [2, 1, -2, -1], tick: F(1, 2), by: 2, slack: 1 },
  { r: 4, unit: 4, mode: "frac", hops: [4, 2, 1, -4, -2, -1], tick: F(1, 4), by: 1, slack: 1 },
];

export function g7Hops(rng, level) {
  const { r, unit, mode, hops, tick, by, slack } = RATIONAL_HOPS[level - 1];
    const show = (v) => showNum(v, mode);
  return first(() => {
    const crossing = pick(rng, [true, true, false]);
    let s = int(rng, -r * unit, r * unit);
    let t = int(rng, -r * unit, r * unit);
    if (crossing && s < 0 === t < 0) t = -t;
    if (s === t) return null;
    s = frac(s, unit);
    t = frac(t, unit);
    return hopRound({
      rng,
      skill: "g7-hop-rationals",
      family: "hop-rational",
      level,
      line: { min: F(-r), max: F(r), ticks: tick, labels: labelsBy(-r, r, by) },
      mode,
      hops: hops.map((h) => frac(h, unit)),
      start: s,
      target: t,
      slack,
      detail: { kind: "rational" },
      promptKey: "hop",
      vars: { s: show(s), t: show(t) },
    });
  });
}

