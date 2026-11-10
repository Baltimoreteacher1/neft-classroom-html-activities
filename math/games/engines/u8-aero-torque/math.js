// Aero-Torque rounds: one-step equations (6.AT.8) and inequalities (6.AT.9).
// Pure functions, no DOM: the game and tools/engines-math.test.mjs share them.

import { pick, randInt } from "../core/math.js";

/**
 * An equation round. kind "add": x + a = b. kind "mul": a·x = b.
 * Levels: 1 add, 2 mul (whole x), 3 add with bigger numbers or mul with a
 * half-unit x, 4 any of those.
 * @param {number} level @param {() => number} next
 */
export function makeEquation(level, next) {
  const kind = level === 1 ? "add" : level === 2 ? "mul" : pick(next, ["add", "mul"]);
  if (kind === "add") {
    const x = level >= 3 ? randInt(next, 6, 18) : randInt(next, 2, 12);
    const a = randInt(next, 2, level >= 3 ? 12 : 9);
    return { kind, a, b: x + a, x };
  }
  const a = randInt(next, 2, 5);
  if (level >= 3 && a % 2 === 0 && next() < 0.5) {
    // Half-unit answer: a even, b odd, so x = b/a ends in .5.
    const half = randInt(next, 2, 8) * 2 + 1; // odd count of halves
    return { kind, a, b: (a * half) / 2, x: half / 2 };
  }
  const x = randInt(next, 2, 9);
  return { kind, a, b: a * x, x };
}

/** Text of an equation: "x + 5 = 12" or "3x = 12". */
export function equationText(eq) {
  return eq.kind === "add" ? `x + ${eq.a} = ${eq.b}` : `${eq.a}x = ${eq.b}`;
}

const FLIP = { "<": ">", ">": "<", "<=": ">=", ">=": "<=" };
export const OP_GLYPH = { "<": "<", ">": ">", "<=": "≤", ">=": "≥" };

/**
 * An inequality round. form "plain" (x op c, or c op x reversed), "add"
 * (x + a op b), "mul" (a·x op b). The solution is x op' boundary.
 * @param {number} level @param {() => number} next
 */
export function makeInequality(level, next) {
  const op = pick(next, ["<", ">", "<=", ">="]);
  const forms = level === 1 ? ["plain"] : level === 2 ? ["plain", "add"] : ["plain", "add", "mul"];
  const form = pick(next, forms);
  const boundary = randInt(next, 3, 15);
  if (form === "plain") {
    const reversed = level >= 2 && next() < 0.5;
    // "c op x" means x FLIP(op) c.
    return { form, op, a: 0, b: boundary, reversed, boundary, solOp: reversed ? FLIP[op] : op };
  }
  if (form === "add") {
    const a = randInt(next, 2, 5);
    return { form, op, a, b: boundary + a, reversed: false, boundary, solOp: op };
  }
  const a = randInt(next, 2, 4);
  const small = randInt(next, 2, 5);
  return { form, op, a, b: a * small, reversed: false, boundary: small, solOp: op };
}

export function inequalityText(q) {
  const g = OP_GLYPH[q.op];
  if (q.form === "plain") return q.reversed ? `${q.b} ${g} x` : `x ${g} ${q.b}`;
  if (q.form === "add") return `x + ${q.a} ${g} ${q.b}`;
  return `${q.a}x ${g} ${q.b}`;
}

/** Does value v satisfy the ORIGINAL inequality? Independent of `solOp`. */
export function satisfies(q, v) {
  const left = q.form === "plain" ? (q.reversed ? q.b : v) : q.form === "add" ? v + q.a : q.a * v;
  const right = q.form === "plain" ? (q.reversed ? v : q.b) : q.b;
  switch (q.op) {
    case "<":
      return left < right;
    case ">":
      return left > right;
    case "<=":
      return left <= right;
    default:
      return left >= right;
  }
}

/**
 * Judge a containment field: boundary, sweeps right?, closed node?
 * @returns {"ok" | "boundaryHigh" | "boundaryLow" | "direction" | "node"}
 */
export function judgeField(q, boundary, right, closed) {
  if (boundary > q.boundary) return "boundaryHigh";
  if (boundary < q.boundary) return "boundaryLow";
  const wantRight = q.solOp === ">" || q.solOp === ">=";
  if (right !== wantRight) return "direction";
  const wantClosed = q.solOp === "<=" || q.solOp === ">=";
  if (closed !== wantClosed) return "node";
  return "ok";
}
