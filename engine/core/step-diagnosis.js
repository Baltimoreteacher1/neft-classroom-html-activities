// Name the mistake in a typed step.
//
// The Step Lab (engine/components/step-solver.js) can say a typed line is "not
// equivalent" to the line above it, but never WHY. The misconception engine can
// name why — until now only from multiple-choice distractors and typed final
// answers. A typed line is a far richer input: the student chose every symbol.
//
// How: we never guess from the wrong line alone (same rule as misconceptions.js
// — a label is a claim a teacher will act on, so we stay silent rather than
// guess). Instead we run the mistake FORWARD. Starting from the previous line we
// apply, one at a time, each named error — distribute to the first term only,
// do the addition before the multiplication, add the denominators, undo the
// operation with the same operation — and ask the solver's own equivalence
// engine whether the result is the line the student typed. A tag is returned
// only when the matches agree on exactly one.
//
//   - Candidates equivalent to the previous line can never match (the student's
//     line is known NOT to be equivalent to it), so a transform that yields the
//     right answer is harmless, never a false label.
//   - Specific beats generic, as in misconceptions.js (where "divided without
//     inverting" and "multiplied instead of dividing" are the same arithmetic and
//     the fraction-specific name wins): transforms carry a `rank`, and only the
//     most specific rank that matched is consulted. Two different tags at that
//     rank is ambiguity, and ambiguity is silence.
//   - Pure, deterministic, no network, no AI. Malformed input returns null.
//
// Errors with no taxonomy tag yet (changing only one side of an equation,
// combining unlike terms, sign slips when adding) are NOT detected on purpose:
// a made-up tag would not reach the heatmap, the class pulse or the routing.

import {
  astToRpn,
  evalRPN,
  exprEquivalent,
  isEquivalent,
  normalizeSides,
  PREC,
  parseLine,
  rootsOf,
  rpnToAst,
  sameRoots,
} from "./step-diagnosis-engine.js";

const num = (v) => ({ k: "num", v });
const bin = (op, a, b) => ({ k: "bin", op, a, b });
const neg = (a) => ({ k: "neg", a });
const VAR = { k: "var" };

const hasVar = (n) =>
  n.k === "var" ||
  (n.k === "neg" && hasVar(n.a)) ||
  (n.k === "bin" && (hasVar(n.a) || hasVar(n.b)));
const value = (n) => evalRPN(astToRpn(n), 0);
const isSum = (n) => n.k === "bin" && (n.op === "+" || n.op === "-");
const isLiteralFraction = (n) =>
  n.k === "bin" && n.op === "/" && n.a.k === "num" && n.b.k === "num";
// "3/4" is a number; "x/3" and "12 ÷ 4" are operations the student can get wrong.
const isDivision = (n) =>
  n.k === "bin" && (n.op === "÷" || (n.op === "/" && !isLiteralFraction(n)));
const hasDecimal = (n) =>
  n.k === "num"
    ? !Number.isInteger(n.v)
    : n.k === "neg"
      ? hasDecimal(n.a)
      : n.k === "bin" && (hasDecimal(n.a) || hasDecimal(n.b));

// Every tree that differs from `node` by rewriting exactly ONE of its nodes.
// `gen(node, chainRoot)` lists the rewrites of a single node; chainRoot is true
// for the whole line and for any parenthesized group (where a left-to-right
// reader would start a fresh chain).
function* rewrites(node, gen, chainRoot = true) {
  yield* gen(node, chainRoot || Boolean(node.p));
  if (node.k === "neg") {
    for (const a of rewrites(node.a, gen, false)) yield { ...node, a };
  } else if (node.k === "bin") {
    for (const a of rewrites(node.a, gen, false)) yield { ...node, a };
    for (const b of rewrites(node.b, gen, false)) yield { ...node, b };
  }
}

// --- Individual errors -------------------------------------------------------

// a(b + c) → ab + c, (b + c)a → ba + c, −(b + c) → −b + c, a − (b + c) → a − b + c
function distributivePartial(n) {
  if (n.k === "bin" && n.op === "*") {
    const out = [];
    if (isSum(n.b)) out.push(bin(n.b.op, bin("*", n.a, n.b.a), n.b.b));
    if (isSum(n.a)) out.push(bin(n.a.op, bin("*", n.a.a, n.b), n.a.b));
    return out;
  }
  if (n.k === "neg" && isSum(n.a) && n.a.p) return [bin(n.a.op, neg(n.a.a), n.a.b)];
  if (n.k === "bin" && n.op === "-" && isSum(n.b) && n.b.p) {
    return [bin(n.b.op, bin("-", n.a, n.b.a), n.b.b)];
  }
  return [];
}

// Strictly left to right: a + b × c → (a + b) × c. One precedence slip at a
// time, plus the whole chain read left to right (the existing predictor's case).
const LOWER = new Set(["+", "-", "*", "÷"]);
const HIGHER = new Set(["*", "÷", "^"]);
function flatten(n, top, items = []) {
  if (n.k === "bin" && !isLiteralFraction(n) && (top || !n.p)) {
    flatten(n.a, false, items);
    items.push(n.op);
    flatten(n.b, false, items);
  } else items.push(n);
  return items;
}
function orderOfOperations(n, chainRoot) {
  const out = [];
  if (n.k === "bin" && LOWER.has(n.op)) {
    const r = n.b;
    if (r.k === "bin" && !r.p && HIGHER.has(r.op) && PREC[r.op] > PREC[n.op]) {
      out.push(bin(r.op, bin(n.op, n.a, r.a), r.b));
    }
  }
  if (chainRoot && n.k === "bin") {
    const items = flatten(n, true);
    if (items.length >= 5) {
      let acc = items[0];
      for (let i = 1; i + 1 < items.length; i += 2) acc = bin(items[i], acc, items[i + 1]);
      out.push(acc);
    }
  }
  return out;
}

// 3² → 3 × 2
const exponentAsMultiplication = (n) =>
  n.k === "bin" && n.op === "^" && n.b.k === "num" ? [bin("*", n.a, n.b)] : [];

// 1/3 + 1/4 → 2/7
const fractionAddedDenominators = (n) =>
  n.k === "bin" && n.op === "+" && isLiteralFraction(n.a) && isLiteralFraction(n.b)
    ? [bin("/", bin("+", n.a.a, n.b.a), bin("+", n.a.b, n.b.b))]
    : [];

// 3/4 ÷ 1/8 → 3/4 × 1/8 (the second fraction was never flipped)
const fractionNoReciprocal = (n) =>
  n.k === "bin" && n.op === "÷" && isLiteralFraction(n.a) && isLiteralFraction(n.b)
    ? [bin("*", n.a, n.b)]
    : [];

// The operation itself was changed or turned around.
const opError = (test, make) => (n) => (n.k === "bin" && test(n) ? [make(n)] : []);

// A computed piece lands a power of ten away (decimal point misplaced).
const POWERS = [-3, -2, -1, 1, 2, 3];
function decimalPlaceValue(n) {
  if (n.k !== "bin" || hasVar(n) || !hasDecimal(n)) return [];
  const v = value(n);
  if (!Number.isFinite(v) || v === 0) return [];
  return POWERS.map((p) => num(v * 10 ** p));
}

// A computed negative piece is written without its sign. Last resort: on
// 12 − 30 the reversed subtraction and the dropped sign are the same number,
// and the reversal is the more specific claim.
function signDropped(n) {
  if ((n.k !== "bin" && n.k !== "neg") || hasVar(n)) return [];
  const v = value(n);
  return Number.isFinite(v) && v < 0 ? [num(-v)] : [];
}

// --- Equation-level errors ---------------------------------------------------

// To undo "+ c" the student adds c again: x + 7 = 15 → x = 15 + 7. Same for
// −, ×, ÷: the operation on the variable's side is repeated on the other side
// instead of reversed. Only for an equation with the variable on ONE side.
function notInverse(L, R) {
  const out = [];
  for (const [S, O, flip] of [
    [L, R, false],
    [R, L, true],
  ]) {
    if (S.k !== "bin" || hasVar(O)) continue;
    const varOnLeft = hasVar(S.a) && !hasVar(S.b);
    const varOnRight = hasVar(S.b) && !hasVar(S.a);
    if (!varOnLeft && !varOnRight) continue;
    const A = varOnLeft ? S.a : S.b;
    const c = varOnLeft ? S.b : S.a;
    let moved = null;
    if (S.op === "+" || S.op === "*") moved = bin(S.op, O, c);
    else if (S.op === "-") moved = bin("-", O, c);
    else if ((S.op === "/" || S.op === "÷") && varOnLeft) moved = bin(S.op, O, c);
    if (moved) out.push(flip ? [moved, A] : [A, moved]);
  }
  return out;
}

// x + 7 = 15 → x = 15: a number that was already in the equation is offered as
// the solution.
function answeredWithGivenNumber(L, R) {
  if (!hasVar(L) && !hasVar(R)) return [];
  const seen = new Set();
  const collect = (n) => {
    if (n.k === "num") seen.add(n.v);
    else if (n.k === "neg") collect(n.a);
    else if (n.k === "bin") {
      collect(n.a);
      collect(n.b);
    }
  };
  collect(L);
  collect(R);
  return [...seen].map((v) => [VAR, num(v)]);
}

/**
 * Every named error, as a rewrite of the previous line. `expr` rewrites one node
 * of any expression (so it applies to a line, or to either side of an equation);
 * `eq` rewrites a whole equation. Lower `rank` = more specific claim.
 */
export const ERROR_TRANSFORMS = Object.freeze([
  { tag: "algebra-distributive-partial", rank: 1, expr: distributivePartial },
  { tag: "order-of-operations-left-to-right", rank: 1, expr: orderOfOperations },
  { tag: "exponent-as-multiplication", rank: 1, expr: exponentAsMultiplication },
  { tag: "fraction-added-denominators", rank: 1, expr: fractionAddedDenominators },
  { tag: "fraction-no-reciprocal", rank: 1, expr: fractionNoReciprocal },
  { tag: "equation-not-inverse-operation", rank: 1, eq: notInverse },
  { tag: "equation-answered-with-given-number", rank: 1, eq: answeredWithGivenNumber },
  {
    tag: "op-added-instead-of-multiplied",
    rank: 2,
    expr: opError(
      (n) => n.op === "*",
      (n) => bin("+", n.a, n.b),
    ),
  },
  {
    tag: "op-divided-instead-of-multiplied",
    rank: 2,
    expr: opError(
      (n) => n.op === "*",
      (n) => bin("÷", n.a, n.b),
    ),
  },
  {
    tag: "op-multiplied-instead-of-added",
    rank: 2,
    expr: opError(
      (n) => n.op === "+",
      (n) => bin("*", n.a, n.b),
    ),
  },
  {
    tag: "op-reversed-subtraction",
    rank: 2,
    expr: opError(
      (n) => n.op === "-",
      (n) => bin("-", n.b, n.a),
    ),
  },
  {
    tag: "op-reversed-division",
    rank: 2,
    expr: opError(isDivision, (n) => bin(n.op, n.b, n.a)),
  },
  {
    tag: "op-multiplied-instead-of-divided",
    rank: 2,
    expr: opError(isDivision, (n) => bin("*", n.a, n.b)),
  },
  { tag: "decimal-place-value", rank: 3, expr: decimalPlaceValue },
  { tag: "sign-dropped", rank: 3, expr: signDropped },
]);

/** Every tag diagnoseStep can return. */
export const DIAGNOSABLE_TAGS = Object.freeze([...new Set(ERROR_TRANSFORMS.map((t) => t.tag))]);

// --- Candidates and matching -------------------------------------------------

/**
 * Candidate wrong lines for an already-parsed previous line.
 * @returns {{ tag: string, rank: number, sides: any[][] }[]}
 */
function candidatesOf(prev, mode, transforms) {
  const out = [];
  if (mode === "equation") {
    const L = rpnToAst(prev.sides[0]);
    const R = rpnToAst(prev.sides[1]);
    if (!L || !R) return out;
    const push = (t, l, r) =>
      out.push({ tag: t.tag, rank: t.rank, sides: [astToRpn(l), astToRpn(r)] });
    for (const t of transforms) {
      if (t.expr) {
        for (const l of rewrites(L, t.expr)) push(t, l, R);
        for (const r of rewrites(R, t.expr)) push(t, L, r);
      }
      if (t.eq) for (const [l, r] of t.eq(L, R)) push(t, l, r);
    }
    return out;
  }
  const E = rpnToAst(prev.sides[prev.sides.length - 1]);
  if (!E) return out;
  for (const t of transforms) {
    if (t.expr) {
      for (const e of rewrites(E, t.expr))
        out.push({ tag: t.tag, rank: t.rank, sides: [astToRpn(e)] });
    }
  }
  return out;
}

const modeOf = (mode) => (mode === "equation" ? "equation" : "expression");

/**
 * Candidate wrong lines for a previous line given as text (exported for the
 * dead-transform sweep: a transform that can only ever produce a line equivalent
 * to its input explains nothing and is invisible, exactly as in
 * misconceptions.deadprediction.test.mjs).
 * @returns {{ tag: string, rank: number, sides: any[][] }[]} [] for an unreadable line
 */
export function errorCandidates(previous, mode = "expression", transforms = ERROR_TRANSFORMS) {
  try {
    const m = modeOf(mode);
    const prev = parseLine(previous);
    if (!normalizeSides(prev, m)) return [];
    return candidatesOf(prev, m, transforms);
  } catch {
    return [];
  }
}

/**
 * Name the mistake behind a typed line that is NOT equivalent to the one above.
 *
 * @param {string} previous the last accepted line
 * @param {string} student  the line the solver rejected
 * @param {"expression"|"equation"} [mode]
 * @param {readonly any[]} [transforms] override for tests (mutation checks)
 * @returns {{ tag: string }|null} null when nothing — or more than one thing —
 *   explains the line, when the line is actually equivalent, or when either line
 *   cannot be read
 */
export function diagnoseStep(
  previous,
  student,
  mode = "expression",
  transforms = ERROR_TRANSFORMS,
) {
  try {
    const m = modeOf(mode);
    const prev = parseLine(previous);
    const next = parseLine(student);
    if (!normalizeSides(prev, m) || !normalizeSides(next, m)) return null;
    if (isEquivalent(prev, next, m)) return null;
    const nextRoots = m === "equation" ? rootsOf(next) : null;
    const matched = candidatesOf(prev, m, transforms).filter((c) =>
      nextRoots ? sameRoots(rootsOf(c), nextRoots) : exprEquivalent(c.sides[0], next.sides[0]),
    );
    if (!matched.length) return null;
    const best = Math.min(...matched.map((c) => c.rank));
    const tags = new Set(matched.filter((c) => c.rank === best).map((c) => c.tag));
    return tags.size === 1 ? { tag: [...tags][0] } : null;
  } catch {
    return null;
  }
}

export default diagnoseStep;
