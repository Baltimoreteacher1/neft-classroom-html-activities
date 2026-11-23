// Step-by-step evaluation of whole-number expressions (+ - * / ^ and brackets) in the order students are taught, and in
// the wrong orders students actually use. Works on token lists so every worked line shows real arithmetic.

import { must } from "./kit.js";

const SHOW = { "*": "×", "/": "÷", "-": "−", "+": "+", "^": "^" };
const WORD = { "*": "Multiply", "/": "Divide", "+": "Add", "-": "Subtract", "^": "Power" };
const BINARY = new Set(["+", "-", "*", "/", "^"]);

export const tokenize = (expr) => expr.match(/\d+|[-+*/^()]/g);

/** Display text: "6 + 3 × 4", "(2 + 3) × 4", "2^3". */
export const textOf = (tokens) =>
  tokens
    .map((t) => SHOW[t] ?? t)
    .join(" ")
    .replace(/\( /g, "(")
    .replace(/ \)/g, ")")
    .replace(/ \^ /g, "^");

/** Index of the next operator to apply in a bracket-free token list. */
function nextIndex(tokens, mode) {
  const find = (ops) => tokens.findIndex((t) => ops.includes(t));
  if (mode === "ltr") return find(["+", "-", "*", "/", "^"]);
  if (mode === "rtl")
    return tokens.length - 1 - [...tokens].reverse().findIndex((t) => BINARY.has(t));
  const power = find(["^"]);
  if (power >= 0) return power;
  if (mode === "low") {
    const low = find(["+", "-"]);
    return low >= 0 ? low : find(["*", "/"]);
  }
  const high = find(["*", "/"]);
  return high >= 0 ? high : find(["+", "-"]);
}

function applyAt(tokens, i) {
  const a = Number(tokens[i - 1]);
  const b = Number(tokens[i + 1]);
  const op = tokens[i];
  must(Number.isInteger(a) && Number.isInteger(b), "operands must be whole numbers");
  let res;
  if (op === "+") res = a + b;
  else if (op === "-") res = a - b;
  else if (op === "*") res = a * b;
  else if (op === "^") res = a ** b;
  else {
    must(b !== 0 && a % b === 0, "division must be exact");
    res = a / b;
  }
  must(res >= 0 && res <= 100000, "result out of range");
  return {
    tokens: [...tokens.slice(0, i - 1), String(res), ...tokens.slice(i + 2)],
    a,
    b,
    op,
    res,
  };
}

/** One step: brackets first (innermost, leftmost), then the rest by `mode` ("correct", "ltr", "low", "rtl"). */
export function reduceOnce(tokens, mode = "correct") {
  const close = tokens.indexOf(")");
  if (close >= 0) {
    const open = tokens.lastIndexOf("(", close);
    const inner = tokens.slice(open + 1, close);
    const r = applyAt(inner, nextIndex(inner, mode));
    const next = r.tokens.length === 1 ? r.tokens : ["(", ...r.tokens, ")"];
    return {
      ...r,
      tokens: [...tokens.slice(0, open), ...next, ...tokens.slice(close + 1)],
      brackets: true,
    };
  }
  return { ...applyAt(tokens, nextIndex(tokens, mode)), brackets: false };
}

/** Every step from the expression to a single number. */
export function sequence(tokens, mode = "correct") {
  const steps = [];
  let cur = tokens;
  for (let i = 0; i < 20 && cur.length > 1; i++) {
    const s = reduceOnce(cur, mode);
    steps.push({ ...s, from: cur });
    cur = s.tokens;
  }
  must(cur.length === 1, "expression did not finish");
  return steps;
}

export const valueOf = (tokens, mode = "correct") => {
  const seq = sequence(tokens, mode);
  return seq.length ? seq[seq.length - 1].res : Number(tokens[0]);
};

/** The value in a given mode, or null when that (wrong) order cannot be carried out with whole numbers. */
export function tryValue(tokens, mode) {
  try {
    return valueOf(tokens, mode);
  } catch {
    return null;
  }
}

const line = (s) =>
  s.op === "^" ? `${s.a}^${s.b} = ${s.res}` : `${s.a} ${SHOW[s.op]} ${s.b} = ${s.res}`;
const label = (s) => (s.brackets ? "Brackets" : WORD[s.op]);

/** "Multiply first: 3 × 4 = 12. Then add: 6 + 12 = 18." */
export function explain(steps) {
  return steps
    .map((s, i) => {
      const w = label(s);
      return i === 0 ? `${w} first: ${line(s)}.` : `Then ${w.toLowerCase()}: ${line(s)}.`;
    })
    .join(" ");
}

/** The steps as separate "Label: a op b = c" lines (for ordering items). */
export const lines = (steps) => steps.map((s) => `${label(s)}: ${line(s)}`);

export const wordOf = (op) => WORD[op];

const hasParens = (shape) => shape.parens === true;

/**
 * Random whole-number expressions that stay whole and non-negative at every step. `parens: false` leaves out shapes
 * with brackets; `powers: false` leaves out exponents.
 */
export function randomExpression(rng, level, { parens = true, powers = true } = {}) {
  const n = (lo, hi) => rng.int(lo, hi);
  const hi = level === 1 ? 9 : 12;
  const shapes = [
    // level 1: two operations
    { l: 1, f: () => `${n(2, 9)}+${n(2, 9)}*${n(2, 9)}` },
    { l: 1, f: () => `${n(2, 9)}*${n(2, 9)}+${n(2, 9)}` },
    { l: 1, f: () => `${n(2, 9)}*${n(2, 9)}-${n(2, 9)}` },
    {
      l: 1,
      f: () => {
        const c = n(2, 5);
        return `${n(2, 9)}+${c * n(2, 9)}/${c}`;
      },
    },
    {
      l: 1,
      f: () => {
        const b = n(2, 6);
        const c = n(2, 6);
        return `${b * c + n(1, 9)}-${b}*${c}`;
      },
    },
    // level 2: three operations or brackets
    { l: 2, parens: true, f: () => `(${n(2, hi)}+${n(2, hi)})*${n(2, 9)}` },
    {
      l: 2,
      parens: true,
      f: () => {
        const c = n(2, 8);
        return `${n(2, 9)}*(${c + n(1, 9)}-${c})`;
      },
    },
    { l: 2, f: () => `${n(2, hi)}+${n(2, 9)}*${n(2, 9)}-${n(2, 9)}` },
    { l: 2, f: () => `${n(5, 12)}*${n(5, 12)}-${n(2, 9)}*${n(2, 9)}` },
    {
      l: 2,
      f: () => {
        const c = n(2, 6);
        return `${c * n(2, 9)}/${c}+${n(2, 9)}*${n(2, 9)}`;
      },
    },
    {
      l: 2,
      parens: true,
      f: () => {
        const c = n(2, 6);
        const a = n(2, 20);
        return `(${a}+${c * n(4, 9) - a})/${c}`;
      },
    },
    {
      l: 2,
      f: () => {
        const b = n(2, 6);
        return `${b * n(2, 9)}/${b}*${n(2, 9)}`;
      },
    },
    // level 3
    { l: 3, parens: true, f: () => `${n(2, 9)}*(${n(2, 9)}+${n(2, 9)})-${n(2, 9)}*${n(2, 5)}` },
    {
      l: 3,
      parens: true,
      f: () => {
        const c = n(2, 9);
        return `(${c + n(2, 9)}-${c})*(${n(2, 9)}+${n(2, 9)})`;
      },
    },
    {
      l: 3,
      f: () => {
        const e = n(2, 5);
        return `${n(2, 9)}+${e * n(2, 9)}/${e}*${n(2, 5)}-${n(1, 9)}`;
      },
    },
    { l: 3, powers: true, f: () => `${n(2, 20)}+${n(2, 5)}^2*${n(2, 4)}` },
    {
      l: 3,
      powers: true,
      parens: true,
      f: () => {
        const b = n(2, 6);
        return `(${b + n(2, 5)}-${b})^2+${n(2, 9)}*${n(2, 5)}`;
      },
    },
    {
      l: 3,
      powers: true,
      parens: true,
      f: () => `${n(2, 6)}*(${n(2, 6)}+${n(2, 6)})-${n(2, 5)}^2`,
    },
    { l: 3, powers: true, f: () => `${n(2, 4)}^3-${n(2, 6)}*${n(2, 5)}+${n(2, 9)}` },
  ];
  const pool = shapes.filter(
    (s) => s.l === level && (parens || !hasParens(s)) && (powers || !s.powers),
  );
  must(pool.length > 0, "no expression shape for this level");
  for (let i = 0; i < 80; i++) {
    const expr = rng.pick(pool).f();
    try {
      const tokens = tokenize(expr);
      const steps = sequence(tokens);
      const v = steps[steps.length - 1].res;
      if (v >= 2 && v <= (level === 3 ? 400 : 150)) return { tokens, expr, steps, value: v };
    } catch {
      // try another draw
    }
  }
  throw new Error("mathgen: no expression found");
}
