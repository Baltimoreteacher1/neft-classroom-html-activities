// Multi-line work (Mathspace-style), checked line by line on the device. The learner rewrites an expression or an
// equation one line at a time; each line is compared with the line before it by exact evaluation at several values
// of the variable (e8/exact-eval.js, so 1/3 stays 1/3), which means ANY correct rewrite is accepted, not only the
// expected path. A line that changes the value (an expression) or the solution (an equation) is named; the answer
// itself is never shown. Typed only: implicit multiplication (3x, 2(x + 1), (x + 1)(x − 2)) is read as written.
import { evaluate } from "./e8/exact-eval.js";
import { R } from "./e8/rational.js";

export const LINE_SEPARATOR = ";";
// Values the variable is tested at: whole, negative and fractional, so a coincidence at one value cannot pass.
const PROBES = [R(-7, 3), R(-2), R(0), R(1), R(5, 2), R(4), R(11)];

// Learner text -> the evaluator's syntax: unicode signs, superscripts, and the multiplication a learner leaves out.
export function normalize(text) {
  let src = String(text ?? "")
    .replace(/[−–]/g, "-")
    .replace(/[×·]/g, "*")
    .replace(/÷/g, "/")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/\s+/g, "");
  // 3x, 3(…), x(…), )(…), )x, )3, xy: a product written side by side.
  src = src
    .replace(/(\d|\))(?=[a-z(])/gi, "$1*")
    .replace(/([a-z])(?=[a-z(\d])/gi, "$1*")
    .replace(/\)(?=\d)/g, ")*");
  return src;
}

// A line's variables (single letters only, the way Grades 5-8 write them).
const variablesOf = (src) => [...new Set(src.match(/[a-z]/gi) || [])];

// Parse one side into a function of the variable, or null when it is not readable math.
function compile(text, variable) {
  const src = normalize(text);
  if (!src || /[^0-9a-z+\-*/^().]/i.test(src)) return null;
  const vars = variablesOf(src);
  if (vars.some((v) => v !== variable)) return null;
  const at = (value) => {
    try {
      return evaluate(src, { [variable]: value });
    } catch {
      return null;
    }
  };
  // Readable if it evaluates at most probe values (a probe may divide by zero).
  return PROBES.filter((p) => at(p) !== null).length >= 4 ? at : null;
}

// "lhs = rhs" -> g(x) = lhs − rhs, or null.
function compileEquation(text, variable) {
  const parts = String(text).split("=");
  if (parts.length !== 2) return null;
  const [l, r] = parts.map((side) => compile(side, variable));
  if (!l || !r) return null;
  return (value) => {
    const a = l(value);
    const b = r(value);
    return a && b ? a.sub(b) : null;
  };
}

// A linear g(x) = a·x + b read from three probes, or null when g is not linear.
function linear(g) {
  const [y0, y1, y2] = [g(R(0)), g(R(1)), g(R(2))];
  if (!y0 || !y1 || !y2) return null;
  const a = y1.sub(y0);
  if (!y2.sub(y1).eq(a)) return null;
  return { a, b: y0 };
}

// Same solution set? Linear equations compare roots exactly; anything else falls back to agreeing on which probes
// make each equation true.
function sameSolutions(g1, g2) {
  const p = linear(g1);
  const q = linear(g2);
  if (p && q) {
    if (p.a.isZero() || q.a.isZero())
      return p.a.isZero() && q.a.isZero() && p.b.isZero() === q.b.isZero();
    return p.b.neg().div(p.a).eq(q.b.neg().div(q.a));
  }
  return PROBES.every((x) => {
    const [u, v] = [g1(x), g2(x)];
    return u && v && u.isZero() === v.isZero();
  });
}

const sameValue = (f1, f2) =>
  PROBES.every((x) => {
    const [u, v] = [f1(x), f2(x)];
    return (u === null && v === null) || (u && v && u.eq(v));
  });

// Is the last line finished? equation: "x = number" (either side); expression: like terms combined and no
// parentheses ("5x + 12", "12 + 5x", "-x"); numeric: a single number.
export function isFinished(text, mode, variable = "x") {
  const src = normalize(text);
  const number = String.raw`-?\d+(?:\.\d+)?(?:/\d+)?`;
  if (mode === "numeric") return new RegExp(`^${number}$`).test(src);
  if (mode === "equation")
    return new RegExp(`^(${variable}=${number}|${number}=${variable})$`).test(src);
  if (/[()^]/.test(src)) return false;
  const terms = src
    .replace(/(?!^)-/g, "+-")
    .split("+")
    .filter(Boolean);
  let variableTerms = 0;
  let constants = 0;
  for (const term of terms) {
    if (new RegExp(`^${number}$`).test(term)) constants += 1;
    else if (
      new RegExp(`^(-?(\\d+(?:\\.\\d+)?(?:/\\d+)?\\*?)?|-)${variable}$`).test(term.replace("*", ""))
    )
      variableTerms += 1;
    else return false;
  }
  return variableTerms <= 1 && constants <= 1;
}

// Check the whole piece of work. `lines` includes the given first line. Returns { ok, lines: [true|false|null…],
// nudge, vars } where lines[i] says whether line i follows from line i − 1 (null for the given line).
export function checkWork(lines, { mode, variable = "x" }) {
  const marks = [null];
  const compileLine = (text) =>
    mode === "equation" ? compileEquation(text, variable) : compile(text, variable);
  const first = compileLine(lines[0]);
  if (!first) return { ok: false, lines: marks, nudge: "Build an answer first." };
  if (lines.length < 2)
    return { ok: false, lines: marks, nudge: "Write your next line under the given one." };
  let previous = first;
  for (let i = 1; i < lines.length; i += 1) {
    const current = compileLine(lines[i]);
    if (!current) {
      marks.push(false);
      return {
        ok: false,
        lines: marks,
        nudge:
          mode === "equation"
            ? "Line {n} cannot be read as an equation. Use one = sign."
            : "Line {n} cannot be read. Check the symbols.",
        vars: { n: i + 1 },
      };
    }
    const follows =
      mode === "equation" ? sameSolutions(previous, current) : sameValue(previous, current);
    marks.push(follows);
    if (!follows)
      return {
        ok: false,
        lines: marks,
        nudge:
          mode === "equation"
            ? "Line {n} changes the solution. Check the step from the line above."
            : "Line {n} changes the value. Check the step from the line above.",
        vars: { n: i + 1 },
      };
    previous = current;
  }
  if (!isFinished(lines.at(-1), mode, variable))
    return {
      ok: false,
      lines: marks,
      nudge:
        mode === "equation"
          ? "Every line is correct. Keep going until the variable is alone on one side."
          : mode === "numeric"
            ? "Every line is correct. Keep going until one number is left."
            : "Every line is correct. Keep going until like terms are combined and no parentheses are left.",
    };
  return { ok: true, lines: marks };
}

export const splitLines = (value) =>
  String(value ?? "")
    .split(LINE_SEPARATOR)
    .map((line) => line.trim())
    .filter(Boolean);

// Typed (single-line) expression answers: equivalent to the given expression and in the asked-for form.
// `work.factored` = g asks for g(…) with g the greatest common factor.
export function checkExpressionAnswer(value, work) {
  const variable = work.variable || "x";
  const given = compile(work.start, variable);
  const typed = compile(value, variable);
  if (!given || !typed || !sameValue(given, typed)) return false;
  if (!work.factored) return isFinished(value, "expression", variable);
  const match = /^(\d+)\*?\((.+)\)$/.exec(normalize(value));
  return Boolean(match) && Number(match[1]) === work.factored && isFinished(match[2], "expression", variable);
}
