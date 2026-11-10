// Flux Foundry rounds: relationships between two variables (Unit 9, 6.AT.11).
// Pure functions, no DOM: the game and tools/engines/u9-flux-plotter.test.mjs share them.
//
// A rule gear turns the crank's input x into the piston's output y, either
// y = k·x (multiply gear) or y = x + k (add gear). Constants are whole 1-12 at
// levels 1-2; from level 3 a constant may end in .5. Every value is a multiple
// of 0.5, so all arithmetic is exact in binary.

import { pick, randInt } from "../core/math.js";

export const X_MAX = 10;
export const K_MAX = 12;
export const MODES = ["decode", "predict", "wire"];

/** Round modes cycle so all three appear in rounds 1-3. */
export function modeFor(roundIndex) {
  return MODES[(roundIndex - 1) % MODES.length];
}

/** Constant / output dial step: whole numbers at levels 1-2, halves from level 3. */
export function stepFor(level) {
  return level >= 3 ? 0.5 : 1;
}

/** y for input x under rule {op, k}. */
export function apply(rule, x) {
  return rule.op === "mul" ? rule.k * x : x + rule.k;
}

export function ruleText(rule) {
  return rule.op === "mul" ? `y = ${rule.k}x` : `y = x + ${rule.k}`;
}

/** A rule constant for this level and gear. */
function constant(next, level, op, halvesOk) {
  if (level >= 3 && halvesOk && next() < 0.4) {
    // 1.5 .. 9.5 (multiply) or 1.5 .. 11.5 (add)
    return (randInt(next, 1, op === "mul" ? 9 : 11) * 2 + 1) / 2;
  }
  if (op === "mul") return randInt(next, 2, level === 1 ? 6 : K_MAX);
  return randInt(next, 1, level === 1 ? 9 : K_MAX);
}

/** Round the top of the y-axis up to a multiple of 10 (at least 10). */
export function niceTop(v) {
  return Math.max(10, Math.ceil(v / 10) * 10);
}

// ---------- DECODE (9-1, 9-3): find the rule from a sensor log ----------

export function makeDecode(level, next) {
  const op = pick(next, ["mul", "add"]);
  const rule = { op, k: constant(next, level, op, true) };
  const count = level >= 3 ? 4 : 3;
  const xs = new Set();
  while (xs.size < count) xs.add(randInt(next, 1, X_MAX));
  const pairs = [...xs].sort((a, b) => a - b).map((x) => ({ x, y: apply(rule, x) }));
  const top = niceTop(Math.max(...pairs.map((p) => p.y)) * 1.25);
  // The tier-1 table shows an empty row for an input the log does not cover.
  let nextX = pairs[pairs.length - 1].x + 1;
  if (nextX > X_MAX) for (nextX = 0; xs.has(nextX); nextX++);
  return { rule, pairs, top, nextX };
}

/**
 * @param {"mul" | "add" | null} op chosen gear
 * @returns {{verdict: "ok" | "noGear" | "wrongGear" | "high" | "low"}}
 */
export function judgeDecode(q, op, k) {
  if (!op) return { verdict: "noGear" };
  const cand = { op, k };
  if (q.pairs.every((p) => apply(cand, p.x) === p.y)) return { verdict: "ok" };
  if (op !== q.rule.op) return { verdict: "wrongGear" };
  return { verdict: k > q.rule.k ? "high" : "low" };
}

// ---------- contexts (shared by PREDICT word problems and WIRE) ----------

/** Each context: which gear it uses and whether its constant may be a half. */
export const CONTEXTS = [
  { id: "cans", op: "mul", halves: false },
  { id: "wage", op: "mul", halves: true },
  { id: "tickets", op: "mul", halves: true },
  { id: "pages", op: "mul", halves: false },
  { id: "age", op: "add", halves: false },
  { id: "bus", op: "add", halves: false },
  { id: "score", op: "add", halves: false },
];

// ---------- PREDICT (9-2, 9-4): run a known rule to an input ----------

export function makePredict(level, next) {
  const useContext = next() < 0.5;
  const ctx = useContext ? pick(next, CONTEXTS) : null;
  const op = ctx ? ctx.op : pick(next, ["mul", "add"]);
  const rule = { op, k: constant(next, level, op, ctx ? ctx.halves : true) };
  // Input 5..10, so the tier-1 table rows (x = 1, 2, 3) never include it.
  const x = randInt(next, 5, X_MAX);
  const y = apply(rule, x);
  const top = niceTop(apply(rule, X_MAX));
  return { rule, ctx: ctx ? ctx.id : null, x, y, top };
}

/** @returns {{verdict: "ok" | "inverse" | "otherOp" | "high" | "low"}} */
export function judgePredict(q, dial) {
  if (dial === q.y) return { verdict: "ok" };
  const { op, k } = q.rule;
  // Treating the input as an output and undoing the gear.
  const inverse = op === "mul" ? q.x / k : q.x - k;
  if (dial === inverse) return { verdict: "inverse" };
  const other = op === "mul" ? q.x + k : q.x * k;
  if (dial === other) return { verdict: "otherOp" };
  return { verdict: dial > q.y ? "high" : "low" };
}

// ---------- WIRE (9-1): independent vs dependent, then the constant ----------

export function makeWire(level, next) {
  const ctx = pick(next, CONTEXTS);
  const rule = { op: ctx.op, k: constant(next, level, ctx.op, ctx.halves) };
  const sx = randInt(next, 2, 8);
  const sy = apply(rule, sx);
  const inputFirst = next() < 0.5; // which wiring button comes first on the deck
  const top = ctx.op === "mul" ? 120 : 30;
  return { rule, ctx: ctx.id, sx, sy, inputFirst, top };
}

/**
 * @param {"in" | "out" | null} crank which quantity the student put on the crank
 * @returns {{verdict: "ok" | "noWire" | "swapped" | "high" | "low"}}
 */
export function judgeWire(q, crank, k) {
  if (!crank) return { verdict: "noWire" };
  if (crank === "out") return { verdict: "swapped" };
  const y = apply({ op: q.rule.op, k }, q.sx);
  if (y === q.sy) return { verdict: "ok" };
  return { verdict: y > q.sy ? "high" : "low" };
}

/** Number text for labels (no binary noise; values are multiples of 0.5). */
export function numText(v) {
  return String(v);
}
