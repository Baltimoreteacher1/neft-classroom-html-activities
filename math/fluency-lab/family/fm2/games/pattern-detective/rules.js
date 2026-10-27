// The hidden rules of Pattern Detective. A rule is a small JSON spec evaluated with exact fractions:
//   lin  y = a·x + b          (adding, multiplying, two-step machines, skip counting, growing shapes)
//   geo  y = c·r^(x − x0)     (multiplying patterns, exponential growth; x0 = index of the first term)
//   sq   y = a·x² + b         (a nonlinear machine)
//   cyc  repeating core of symbol ids (position 1 is the first symbol)
// Fractions are stored as [numerator, denominator]. @fm2 FM-058 FM-052 FM-060
import { add, eq, frac, mul, toString } from "../../rational.js";
import { evalExpr, parseExpr } from "./expr.js";

export const F = (pair) => frac(pair[0], pair[1]);
export const P = (value) => [value.n, value.d];
export const fr = (n, d = 1) => [frac(n, d).n, frac(n, d).d];
const asFrac = (x) => (typeof x === "number" ? frac(x) : x);

export function evalSpec(spec, x) {
  const at = asFrac(x);
  if (spec.t === "lin") return add(mul(F(spec.a), at), F(spec.b));
  if (spec.t === "sq") return add(mul(F(spec.a), mul(at, at)), F(spec.b));
  if (spec.t === "geo") {
    const steps = at.n - spec.x0;
    if (at.d !== 1 || steps < 0) throw new RangeError("geometric rules start at their first term");
    let out = F(spec.c);
    for (let i = 0; i < steps; i += 1) out = mul(out, F(spec.r));
    return out;
  }
  throw new RangeError(`not a numeric rule: ${spec.t}`);
}

export const cycAt = (core, position) => core[(position - 1) % core.length];

export const numText = (value) => toString(F(value));
const wrapFrac = (pair) => (pair[1] === 1 ? String(pair[0]) : `(${pair[0]}/${pair[1]})`);

// Plain-text rule for the worked answer and the hint checks, e.g. "2 × n + 1" or "3 × 2^n".
export function specText(spec, v = "n") {
  if (spec.t === "lin") {
    const [an, ad] = spec.a;
    const [bn] = spec.b;
    const bd = spec.b[1];
    const lead =
      an === 0 ? "" : an === ad ? v : an === -ad ? `−${v}` : `${wrapFrac(spec.a)} × ${v}`;
    if (bn === 0) return lead || "0";
    const tail = `${bd === 1 ? Math.abs(bn) : `${Math.abs(bn)}/${bd}`}`;
    if (!lead) return bn < 0 ? `−${tail}` : tail;
    return `${lead} ${bn < 0 ? "−" : "+"} ${tail}`;
  }
  if (spec.t === "sq") {
    const lead = spec.a[0] === spec.a[1] ? `${v}²` : `${wrapFrac(spec.a)} × ${v}²`;
    const bn = spec.b[0];
    return bn === 0 ? lead : `${lead} ${bn < 0 ? "−" : "+"} ${Math.abs(bn)}`;
  }
  if (spec.t === "geo") {
    const exp = spec.x0 === 0 ? v : `${v} − ${spec.x0}`;
    return `${wrapFrac(spec.c)} × ${wrapFrac(spec.r)}^${spec.x0 === 0 ? exp : `(${exp})`}`;
  }
  return spec.core.join(" ");
}

// Inputs on which a learner's expression and the hidden rule are compared, exactly.
export function testInputs(spec) {
  const from = spec.t === "geo" ? spec.x0 : 0;
  const near = Array.from({ length: 15 }, (_, i) => from + i);
  return spec.t === "geo" ? near : [...near, 20, 25, 31, 40];
}

// Is the learner's expression (a parsed tree) the same function as the hidden numeric spec?
export function equivalent(spec, tree) {
  for (const x of testInputs(spec)) {
    let want;
    try {
      want = evalSpec(spec, x);
    } catch {
      continue;
    }
    const got = evalExpr(tree, frac(x));
    if (!got || !eq(got, want)) return false;
  }
  return true;
}

export const sameCore = (core, other) => {
  if (!Array.isArray(other) || !other.length) return false;
  for (let p = 1; p <= 60; p += 1) if (cycAt(core, p) !== cycAt(other, p)) return false;
  return true;
};

// Parse a learner expression once; returns { tree } or { error }.
export function readRule(text) {
  const parsed = parseExpr(text);
  if (!parsed.ok) return { error: parsed.error };
  if (parsed.constant) return { error: "constant" };
  return { tree: parsed.tree };
}

// The first clue (smallest input) on which the learner's expression disagrees with the machine, or null.
export function firstContradiction(tree, rows) {
  const sorted = [...rows].sort((p, q) => p.x - q.x);
  for (const row of sorted) {
    const got = evalExpr(tree, frac(row.x));
    const want = row.y;
    if (!got || !eq(got, want)) return { row, got };
  }
  return null;
}

// The prediction's true answer: a fraction for numeric rules, a symbol id for repeating patterns.
export function farAnswer(round) {
  const spec = round.machines[round.farM || 0].spec;
  return spec.t === "cyc" ? cycAt(spec.core, round.far) : evalSpec(spec, round.far);
}
export const answerString = (round) => {
  const value = farAnswer(round);
  return typeof value === "string" ? value : toString(value);
};
