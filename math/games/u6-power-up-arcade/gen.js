// Seeded expression generator for Power Up! Builds a random operation tree, renders it with
// only the parentheses the order of operations needs, then keeps it only if solving it step by
// step stays in the whole numbers and inside the stage's size cap.

import { LP, num, op, RANK, RP, solve } from "./expr.js";

/** A problem plan: ops = operations to evaluate, pow/paren = [min,max] exponents and parenthesis groups. */
const P = (ops, pow = [1, 1], paren = [0, 1]) => ({ ops, pow, paren });

/**
 * Each cabinet is three worlds of five battles; the fifth is the world boss. A battle is one or more
 * problems. World 1 is the warm-up (pick each step); Worlds 2 and 3 are full problems.
 */
export const WORLDS = {
  regular: [
    {
      name: "Warm-Up Arena",
      mode: "steps",
      battles: [[P(2, [1, 1], [0, 0])], [P(2, [1, 1], [0, 0])], [P(3, [1, 1], [0, 0])], [P(3, [1, 1], [0, 1])], [P(3, [1, 1], [1, 1]), P(4, [1, 2], [0, 1])]],
    },
    {
      name: "Exponent Volcano",
      mode: "full",
      battles: [[P(2), P(2)], [P(2), P(3, [1, 1], [0, 0])], [P(3), P(3, [1, 1], [1, 1])], [P(3, [1, 2]), P(3, [1, 1], [1, 1])], [P(3, [1, 2], [1, 1]), P(4, [1, 2]), P(4, [1, 2], [1, 1])]],
    },
    {
      name: "Parenthesis Peaks",
      mode: "full",
      battles: [[P(3, [1, 1], [1, 1]), P(3, [1, 2], [1, 1])], [P(4, [1, 2], [1, 1]), P(4, [1, 2])], [P(4, [2, 2]), P(4, [1, 2], [1, 1])], [P(4, [2, 2], [1, 1]), P(5, [1, 2], [1, 1])], [P(5, [1, 2], [1, 1]), P(5, [2, 2], [1, 1]), P(5, [1, 2], [1, 1])]],
    },
  ],
  challenging: [
    {
      name: "Warm-Up Arena",
      mode: "steps",
      battles: [[P(3, [1, 1], [1, 1])], [P(4, [1, 2], [1, 1])], [P(4, [1, 2], [1, 2])], [P(5, [1, 2], [1, 2])], [P(5, [2, 3], [1, 2]), P(6, [2, 3], [1, 2])]],
    },
    {
      name: "Exponent Volcano",
      mode: "full",
      battles: [[P(3, [1, 1], [1, 1]), P(4, [1, 2], [1, 1])], [P(4, [1, 2], [1, 1]), P(4, [1, 2], [1, 2])], [P(4, [2, 2], [1, 2]), P(5, [1, 2], [1, 2])], [P(5, [1, 2], [1, 2]), P(5, [2, 2], [1, 2])], [P(5, [2, 3], [1, 2]), P(6, [2, 3], [1, 2]), P(6, [2, 3], [1, 2])]],
    },
    {
      name: "Parenthesis Peaks",
      mode: "full",
      battles: [[P(5, [1, 2], [1, 2]), P(5, [2, 2], [1, 2])], [P(5, [2, 3], [1, 2]), P(6, [2, 3], [1, 2])], [P(6, [2, 3], [2, 3]), P(6, [2, 3], [1, 2])], [P(6, [2, 3], [2, 3]), P(6, [2, 3], [2, 3])], [P(6, [2, 3], [2, 3]), P(7, [2, 3], [2, 3]), P(7, [2, 3], [2, 3])]],
    },
  ],
};

const RULES = {
  regular: { cap: 500, leaf: [2, 9], bases: [2, 6], paren: false },
  challenging: { cap: 3000, leaf: [2, 12], bases: [2, 12], paren: true },
};

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (r, list) => list[Math.floor(r() * list.length)];
const between = (r, [lo, hi]) => lo + Math.floor(r() * (hi - lo + 1));

function exponentFor(r, base, level) {
  const options = [2];
  if (base <= (level === "regular" ? 4 : 5)) options.push(3, 2);
  if (level === "challenging" && base <= 3) options.push(4);
  if (level === "challenging" && base === 10) options.push(3);
  return pick(r, options);
}

function build(r, ops, level, rule) {
  if (ops === 0) return { leaf: between(r, rule.leaf) };
  const kind = pick(r, ["+", "-", "*", "*", "/", "^", "^"]);
  if (kind !== "^") {
    const left = Math.floor(r() * ops);
    return { op: kind, l: build(r, left, level, rule), r: build(r, ops - 1 - left, level, rule) };
  }
  // A power costs one operation, or two when its base is a parenthesized sum or difference.
  const grouped = rule.paren && ops >= 2 && r() < 0.35;
  const base = grouped ? sumGroup(r) : { leaf: between(r, rule.bases) };
  const baseValue = grouped ? 6 : base.leaf;
  const power = { op: "^", l: base, r: { leaf: exponentFor(r, baseValue, level) } };
  const rest = ops - (grouped ? 2 : 1);
  if (rest === 0) return power;
  const sibling = build(r, rest - 1, level, rule);
  const joiner = pick(r, ["+", "-", "*", "/"]);
  return r() < 0.5
    ? { op: joiner, l: power, r: sibling }
    : { op: joiner, l: sibling, r: power };
}

/** A plus/minus pair used as an exponent base; render() always parenthesizes it. */
function sumGroup(r) {
  return {
    op: pick(r, ["+", "+", "-"]),
    l: { leaf: between(r, [1, 6]) },
    r: { leaf: between(r, [1, 4]) },
  };
}

function countOps(n) {
  if (n.leaf !== undefined) return 0;
  return 1 + countOps(n.l) + countOps(n.r);
}

/** Make division and subtraction come out whole by adjusting a leaf right operand. */
function repair(n, r) {
  if (n.leaf !== undefined) return n.leaf;
  const L = repair(n.l, r);
  const R = repair(n.r, r);
  const rightLeaf = n.r.leaf !== undefined;
  if (n.op === "/" && rightLeaf && !(R > 1 && L % R === 0)) {
    const divs = [];
    for (let d = 2; d <= 12; d++) if (L % d === 0 && d <= L) divs.push(d);
    if (!divs.length) return null;
    n.r.leaf = pick(r, divs);
    return L / n.r.leaf;
  }
  if (n.op === "-" && rightLeaf && L < R) {
    if (L < 1) return null;
    n.r.leaf = 1 + Math.floor(r() * L);
    return L - n.r.leaf;
  }
  if (L === null || R === null) return null;
  if (n.op === "+") return L + R;
  if (n.op === "-") return L >= R ? L - R : null;
  if (n.op === "*") return L * R;
  if (n.op === "/") return R > 0 && L % R === 0 ? L / R : null;
  return L ** R;
}

function render(n, prec = 0, rightOfSame = false) {
  if (n.leaf !== undefined) return [num(n.leaf)];
  const mine = RANK[n.op];
  if (n.op === "^") {
    const base = n.l.leaf !== undefined ? [num(n.l.leaf)] : [LP, ...render(n.l), RP];
    return [...base, op("^"), num(n.r.leaf)];
  }
  const left = render(n.l, mine, false);
  const right = render(n.r, mine, true);
  const body = [...left, op(n.op), ...right];
  const needs = mine < prec || (mine === prec && rightOfSame && (n.op === "-" || n.op === "/"));
  return needs ? [LP, ...body, RP] : body;
}

/** An operation on 0 or 1 (x1, 1 raised to a power, 0 times anything) teaches nothing. */
function trivial(s) {
  return ((s.o === "*" || s.o === "/" || s.o === "^") && (s.a <= 1 || s.b <= 1)) || (s.o === "/" && s.a === s.b);
}

function parenCount(t) {
  return t.filter((x) => x.k === "(").length;
}
function powCount(t) {
  return t.filter((x) => x.v === "^").length;
}

/** One expression for a plan; returns {tokens, steps, answer}. Seeded and deterministic. */
export function makeExpression(level, plan, seed, seen = new Set()) {
  const rule = RULES[level];
  const r = rng(seed * 7919 + plan.ops * 104729 + plan.paren[0] * 31 + plan.pow[0] * 7);
  for (let attempt = 0; attempt < 60000; attempt++) {
    const tree = build(r, plan.ops, level, rule);
    if (countOps(tree) !== plan.ops) continue;
    if (repair(tree, r) === null) continue;
    const tokens = render(tree);
    if (powCount(tokens) < plan.pow[0] || powCount(tokens) > plan.pow[1]) continue;
    const pc = parenCount(tokens);
    if (pc < plan.paren[0] || pc > plan.paren[1]) continue;
    const solved = solve(tokens, rule.cap);
    if (!solved.ok || solved.steps.length !== plan.ops || solved.steps.some(trivial)) continue;
    const key = tokens.map((x) => x.v ?? x.k).join("");
    if (seen.has(key)) continue;
    seen.add(key);
    return { tokens, steps: solved.steps, answer: solved.final };
  }
  throw new Error(`no expression for ${level} ${JSON.stringify(plan)}`);
}

/** One world: an array of battles, each an array of expressions; no repeats inside the world. */
export function makeWorld(level, world, seed) {
  const seen = new Set();
  return WORLDS[level][world].battles.map((battle, b) =>
    battle.map((plan, k) => makeExpression(level, plan, seed + b * 101 + k * 13, seen)),
  );
}
