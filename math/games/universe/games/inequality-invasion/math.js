// Inequality Invasion — the mathematics. Pure functions, no DOM.
// Lessons 8-4 (write and represent inequalities), 8-5 (solutions of an
// inequality), 8-6 (solve and graph), 8-7 (problem solving).
// A gate rule is { sym, k }: sym one of "<", "≤", ">", "≥"; k an integer.

export const SYMBOLS = ["<", "≤", ">", "≥"];

export function satisfies(rule, v) {
  switch (rule.sym) {
    case "<":
      return v < rule.k;
    case "≤":
      return v <= rule.k;
    case ">":
      return v > rule.k;
    case "≥":
      return v >= rule.k;
  }
  return false;
}

/** Every rule in a list must hold (gates in a row). */
export const passesAll = (rules, v) => rules.every((r) => satisfies(r, v));

export const ruleText = (r, name = "x") => `${name} ${r.sym} ${r.k}`;

export const sameRule = (a, b) => a.sym === b.sym && a.k === b.k;

/** Two rules accept exactly the same integers in [lo, hi]. */
export function sameOn(a, b, lo, hi) {
  for (let v = lo; v <= hi; v++) if (satisfies(a, v) !== satisfies(b, v)) return false;
  return true;
}

const upward = (sym) => sym === ">" || sym === "≥";
const closed = (sym) => sym === "≤" || sym === "≥";

/** Which slip a wrong rule is, against the rule required. Site taxonomy tags. */
export function slipOf(want, got) {
  if (
    got.k === want.k &&
    upward(got.sym) === upward(want.sym) &&
    closed(got.sym) !== closed(want.sym)
  )
    return "inequality-boundary-inclusion";
  if (got.k === want.k && upward(got.sym) !== upward(want.sym))
    return "inequality-direction-flipped";
  return undefined;
}

/**
 * A two-step inequality a·x + b SYM c, solved for x. a > 0 here (lesson 8-6
 * keeps the coefficient positive), so the symbol does not turn over. The
 * boundary is exact; problems are authored so it is an integer.
 */
export function solveLinear(p) {
  const k = (p.c - p.b) / p.a;
  return { sym: p.sym, k };
}

export function linearText(p) {
  const ax = p.a === 1 ? "x" : `${p.a}x`;
  const b = p.b === 0 ? "" : p.b > 0 ? ` + ${p.b}` : ` − ${-p.b}`;
  return `${ax}${b} ${p.sym} ${p.c}`;
}
