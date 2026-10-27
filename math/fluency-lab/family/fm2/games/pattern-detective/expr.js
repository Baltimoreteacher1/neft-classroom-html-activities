// A small, safe expression parser for the rules learners type: digits, decimals, the variable n (or x), + - * / and
// the signs × ÷ −, parentheses, implicit multiplication ("2n", "3(n+1)") and a whole-number power ("2^n", "n^2").
// There is no eval and no Function: the text becomes a tiny tree that is evaluated with exact fractions.
// @fm2 FM-058 FM-052
import { div, frac, fromDecimal, mul, neg, add, sub } from "../../rational.js";

const MAX_LENGTH = 60;
const MAX_TOKENS = 40;
const MAX_DEPTH = 6;
const MAX_POWER = 30;

const clean = (text) =>
  String(text)
    .replaceAll("−", "-")
    .replaceAll("–", "-")
    .replaceAll("×", "*")
    .replaceAll("·", "*")
    .replaceAll("÷", "/")
    .replaceAll("＾", "^")
    .replace(/\s+/g, "");

function tokenize(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (/[0-9.]/.test(ch)) {
      const start = i;
      while (i < text.length && /[0-9.]/.test(text[i])) i += 1;
      const value = fromDecimal(text.slice(start, i));
      if (!value) throw new SyntaxError("number");
      tokens.push({ t: "num", v: value });
    } else if (/[nxNX]/.test(ch)) {
      tokens.push({ t: "var" });
      i += 1;
    } else if ("+-*/^()".includes(ch)) {
      tokens.push({ t: ch });
      i += 1;
    } else throw new SyntaxError("symbol");
    if (tokens.length > MAX_TOKENS) throw new SyntaxError("long");
  }
  return tokens;
}

// Recursive descent: sum > product (with implicit multiplication) > sign > power > atom.
export function parseExpr(text) {
  const source = clean(text);
  if (!source) return { ok: false, error: "empty" };
  if (source.length > MAX_LENGTH) return { ok: false, error: "long" };
  try {
    const tokens = tokenize(source);
    let at = 0;
    const peek = () => tokens[at]?.t;
    const take = () => tokens[at++];
    const need = (kind) => {
      if (peek() !== kind) throw new SyntaxError(kind === ")" ? "paren" : "shape");
      return take();
    };
    const sum = (depth) => {
      let left = product(depth);
      while (peek() === "+" || peek() === "-") {
        const op = take().t;
        left = { k: "bin", op, a: left, b: product(depth) };
      }
      return left;
    };
    const product = (depth) => {
      let left = sign(depth);
      for (;;) {
        const next = peek();
        if (next === "*" || next === "/") {
          take();
          left = { k: "bin", op: next, a: left, b: sign(depth) };
        } else if (next === "var" || next === "(") {
          left = { k: "bin", op: "*", a: left, b: power(depth) };
        } else return left;
      }
    };
    const sign = (depth) => {
      if (peek() === "-") {
        take();
        return { k: "neg", a: sign(depth) };
      }
      if (peek() === "+") {
        take();
        return sign(depth);
      }
      return power(depth);
    };
    const power = (depth) => {
      const base = atom(depth);
      if (peek() !== "^") return base;
      take();
      return { k: "pow", a: base, b: sign(depth) };
    };
    const atom = (depth) => {
      const token = take();
      if (!token) throw new SyntaxError("shape");
      if (token.t === "num") return { k: "num", v: token.v };
      if (token.t === "var") return { k: "var" };
      if (token.t === "(") {
        if (depth >= MAX_DEPTH) throw new SyntaxError("deep");
        const inside = sum(depth + 1);
        need(")");
        return inside;
      }
      throw new SyntaxError("shape");
    };
    const tree = sum(0);
    if (at !== tokens.length) throw new SyntaxError(peek() === ")" ? "paren" : "shape");
    if (!hasVar(tree)) return { ok: true, tree, constant: true };
    return { ok: true, tree };
  } catch (error) {
    return { ok: false, error: error instanceof SyntaxError ? error.message : "shape" };
  }
}

const hasVar = (node) =>
  node.k === "var" || (node.a && hasVar(node.a)) || (node.b && hasVar(node.b));

// Exact value of the tree at x (a fraction), or null if it is undefined (divide by zero, huge or fractional power).
export function evalExpr(tree, x) {
  try {
    return walk(tree, x);
  } catch {
    return null;
  }
}

function walk(node, x) {
  switch (node.k) {
    case "num":
      return node.v;
    case "var":
      return x;
    case "neg":
      return neg(walk(node.a, x));
    case "pow": {
      const base = walk(node.a, x);
      const power = walk(node.b, x);
      if (power.d !== 1 || power.n < 0 || power.n > MAX_POWER) throw new RangeError("power");
      let out = frac(1);
      for (let i = 0; i < power.n; i += 1) out = mul(out, base);
      return out;
    }
    default: {
      const a = walk(node.a, x);
      const b = walk(node.b, x);
      return node.op === "+"
        ? add(a, b)
        : node.op === "-"
          ? sub(a, b)
          : node.op === "*"
            ? mul(a, b)
            : div(a, b);
    }
  }
}

// Builder helpers: every statement form is turned into expression text, so one parser judges them all.
export const wrap = (text) => `(${String(text).trim()})`;
export const OPS = ["+", "−", "×", "÷"];
export const twoStep = ({ op1, a, op2, b }) => {
  const first = `n${op1 || "+"}${wrap(a || "0")}`;
  return op2 && op2 !== "none" ? `(${first})${op2}${wrap(b || "0")}` : first;
};
export const sequence = ({ op, start, step, x0 = 1 }) => {
  const index = x0 === 0 ? "n" : "(n-1)";
  return op === "mul"
    ? `${wrap(start || "0")}*${wrap(step || "0")}^${index}`
    : `${wrap(start || "0")}+${wrap(step || "0")}*${index}`;
};
export const lineForm = ({ m, b }) => `${wrap(m || "0")}*n+${wrap(b || "0")}`;
