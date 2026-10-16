// The Step Lab's math engine: a tokenizer + shunting-yard parser (handles
// decimals, fractions as division, MIXED NUMBERS like "2 1/2", unicode × ÷ ·,
// superscripts ², implicit multiplication like 3x and 2(x+1)) plus numeric
// equivalence testing — expressions are compared at sampled variable values;
// equations are compared by their root sets found on a grid and refined by
// bisection.
//
// It lives here, not inside the component, because two callers need the SAME
// engine and must never disagree about what a line means:
//   - engine/components/step-solver.js  decides whether a typed line is still
//     equivalent to the one above it;
//   - engine/core/step-diagnosis.js     asks, for a line that is NOT, which
//     named mistake would have produced it.
// A diagnosis built on a second parser could "explain" a line the solver reads
// differently — a mislabelled student, which is worse than no label.
//
// Pure functions, no DOM, no dependencies.

const SUPS = { "⁰": 0, "¹": 1, "²": 2, "³": 3, "⁴": 4, "⁵": 5, "⁶": 6, "⁷": 7, "⁸": 8, "⁹": 9 };

// --- Tokenizer -------------------------------------------------------------
// Normalizes student-friendly notation, then emits { num | var | op | paren }.
// "2 1/2" (number, space, fraction) becomes a single mixed-number value token.
export function tokenize(src) {
  let s = String(src);
  for (const [ch, d] of Object.entries(SUPS)) s = s.split(ch).join(`^${d}`);
  s = s.replace(/[×·]/g, "*").replace(/−/g, "-");
  const out = [];
  let i = 0;
  const isDigit = (c) => c >= "0" && c <= "9";
  while (i < s.length) {
    const c = s[i];
    if (c === " " || c === "\t") {
      i++;
      continue;
    }
    if (isDigit(c) || (c === "." && isDigit(s[i + 1]))) {
      let j = i;
      while (j < s.length && (isDigit(s[j]) || s[j] === ".")) j++;
      const whole = s.slice(i, j);
      if ((whole.match(/\./g) || []).length > 1) throw new Error("number");
      // Mixed number: "2 1/2" → integer, spaces, fraction. Only when the first
      // part is an integer and a "a/b" follows the gap.
      const m = /^ +(\d+) *\/ *(\d+)/.exec(s.slice(j));
      if (m && !whole.includes(".")) {
        const den = Number(m[2]);
        if (den === 0) throw new Error("divzero");
        out.push({ t: "num", v: Number(whole) + Number(m[1]) / den });
        i = j + m[0].length;
        continue;
      }
      out.push({ t: "num", v: Number(whole) });
      i = j;
      continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      out.push({ t: "var", v: c.toLowerCase() });
      i++;
      continue;
    }
    if ("+-*/^÷".includes(c)) {
      out.push({ t: "op", v: c });
      i++;
      continue;
    }
    if (c === "(" || c === ")") {
      out.push({ t: c });
      i++;
      continue;
    }
    throw new Error("symbol");
  }
  // Two number tokens in a row means a space-separated "3 4" — almost always a
  // mixed-number typo; refuse with a specific hint rather than guessing.
  for (let k = 1; k < out.length; k++) {
    if (out[k].t === "num" && out[k - 1].t === "num") throw new Error("mixed");
  }
  return out;
}

// --- Parser (shunting-yard → RPN) ------------------------------------------
// The fraction slash "/" binds tighter than the ÷ operation so a line like
// "3/4 ÷ 1/8" reads the way a student writes it: (3/4) ÷ (1/8), not 3/4/1/8.
export const PREC = { "u-": 3, "^": 4, "*": 2, "÷": 2, "/": 2.5, "+": 1, "-": 1 };
const RIGHT = { "^": true, "u-": true };

/**
 * Convert tokens to reverse Polish notation. The returned array also carries
 * `groups`: the RPN indices whose value the student wrote inside parentheses.
 * evalRPN never looks at it; the diagnosis uses it to tell "2 + (3 × 4)" (the
 * student grouped it) from "2 + 3 × 4" (precedence decides) after the
 * parentheses themselves are gone.
 */
export function toRPN(tokens) {
  const outQ = /** @type {any[] & { groups?: Set<number> }} */ ([]);
  const groups = new Set();
  const ops = [];
  let prev = null; // previous significant token, for unary minus + implicit ×
  const IMPLICIT_LEFT = (t) => t && (t.t === "num" || t.t === "var" || t.t === ")");
  for (const raw of tokens) {
    let tok = raw;
    if (IMPLICIT_LEFT(prev) && (tok.t === "var" || tok.t === "(" || tok.t === "num")) {
      // 3x, 2(x+1), (x+1)(x+2), x(4) — inject the multiplication.
      pushOp({ t: "op", v: "*" });
    }
    if (tok.t === "op" && tok.v === "-" && !IMPLICIT_LEFT(prev)) tok = { t: "op", v: "u-" };
    if (tok.t === "op" && tok.v === "+" && !IMPLICIT_LEFT(prev)) {
      prev = null;
      continue; // unary plus is a no-op
    }
    if (tok.t === "num" || tok.t === "var") outQ.push(tok);
    else if (tok.t === "op") pushOp(tok);
    else if (tok.t === "(") ops.push(tok);
    else if (tok.t === ")") {
      while (ops.length && ops[ops.length - 1].t !== "(") outQ.push(ops.pop());
      if (!ops.length) throw new Error("paren");
      ops.pop();
      if (outQ.length) groups.add(outQ.length - 1);
    }
    prev = tok.t === "op" ? { t: "op" } : tok;
  }
  while (ops.length) {
    const o = ops.pop();
    if (o.t === "(") throw new Error("paren");
    outQ.push(o);
  }
  if (!outQ.length) throw new Error("empty");
  outQ.groups = groups;
  return outQ;

  function pushOp(tok) {
    while (ops.length) {
      const top = ops[ops.length - 1];
      if (top.t !== "op") break;
      const pT = PREC[top.v];
      const pN = PREC[tok.v];
      if (pT > pN || (pT === pN && !RIGHT[tok.v])) outQ.push(ops.pop());
      else break;
    }
    ops.push(tok);
  }
}

export function evalRPN(rpn, x) {
  const st = [];
  for (const tok of rpn) {
    if (tok.t === "num") st.push(tok.v);
    else if (tok.t === "var") st.push(x);
    else {
      if (tok.v === "u-") {
        if (!st.length) return NaN;
        st.push(-st.pop());
        continue;
      }
      const b = st.pop();
      const a = st.pop();
      if (a === undefined || b === undefined) return NaN;
      if (tok.v === "+") st.push(a + b);
      else if (tok.v === "-") st.push(a - b);
      else if (tok.v === "*") st.push(a * b);
      else if (tok.v === "/" || tok.v === "÷") st.push(b === 0 ? NaN : a / b);
      else if (tok.v === "^") st.push(a ** b);
    }
  }
  if (st.length !== 1) return NaN;
  return st[0];
}

// Parse one full line. Returns { sides: [rpn] (1 or 2), vars:Set, tokenCount }.
export function parseLine(src) {
  const parts = String(src).split("=");
  if (parts.length > 2) throw new Error("equals");
  const sides = [];
  const vars = new Set();
  let tokenCount = 0;
  for (const part of parts) {
    const toks = tokenize(part);
    tokenCount += toks.length;
    for (const t of toks) if (t.t === "var") vars.add(t.v);
    sides.push(toRPN(toks));
  }
  if (vars.size > 1) throw new Error("vars");
  return { sides, vars, tokenCount };
}

// --- Syntax trees ----------------------------------------------------------
// The diagnosis rewrites a line the way a mistaken student would, so it needs
// the structure RPN flattens away. Trees are built FROM the solver's own RPN
// (never from a second parse) and turned back into RPN to be judged by the
// solver's own equivalence functions below.
//   { k:"num", v } | { k:"var" } | { k:"neg", a } | { k:"bin", op, a, b }
// A node written inside parentheses carries `p: true`.

/** @returns {any|null} the root node, or null for a malformed RPN stream */
export function rpnToAst(rpn) {
  const groups = /** @type {Set<number>|undefined} */ (/** @type {any} */ (rpn).groups);
  const st = [];
  for (let i = 0; i < rpn.length; i++) {
    const tok = rpn[i];
    let node;
    if (tok.t === "num") node = { k: "num", v: tok.v };
    else if (tok.t === "var") node = { k: "var" };
    else if (tok.v === "u-") {
      const a = st.pop();
      if (!a) return null;
      node = { k: "neg", a };
    } else {
      const b = st.pop();
      const a = st.pop();
      if (!a || !b) return null;
      node = { k: "bin", op: tok.v, a, b };
    }
    if (groups?.has(i)) node.p = true;
    st.push(node);
  }
  return st.length === 1 ? st[0] : null;
}

/** Post-order flatten of a tree back into the RPN the evaluators read. */
export function astToRpn(node, out = []) {
  if (node.k === "num") out.push({ t: "num", v: node.v });
  else if (node.k === "var") out.push({ t: "var", v: "x" });
  else if (node.k === "neg") {
    astToRpn(node.a, out);
    out.push({ t: "op", v: "u-" });
  } else {
    astToRpn(node.a, out);
    astToRpn(node.b, out);
    out.push({ t: "op", v: node.op });
  }
  return out;
}

// --- Equivalence -----------------------------------------------------------
const SAMPLES = [-3.7, -1.4, 0.6, 1.9, 3.3, 5.8];
const close = (a, b, tol = 1e-7) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

// Expression (single side): equal at every sample where both are defined.
export function exprEquivalent(rpnA, rpnB) {
  let compared = 0;
  for (const x of SAMPLES) {
    const a = evalRPN(rpnA, x);
    const b = evalRPN(rpnB, x);
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    if (!close(a, b, 1e-6)) return false;
    compared++;
  }
  return compared > 0;
}

// Equation: root set of f(x) = L(x) − R(x) on a grid, refined by bisection.
export function rootsOf(parsed) {
  const [L, R] = parsed.sides;
  const f = (x) => {
    const a = evalRPN(L, x);
    const b = evalRPN(R, x);
    return Number.isFinite(a) && Number.isFinite(b) ? a - b : NaN;
  };
  const roots = [];
  const addRoot = (r) => {
    if (!roots.some((q) => Math.abs(q - r) < 1e-3)) roots.push(r);
  };
  let allZero = true;
  let prevX = null;
  let prevY = null;
  for (let x = -80; x <= 80.0001; x += 0.2) {
    const y = f(x);
    if (!Number.isFinite(y)) {
      prevX = null;
      continue;
    }
    if (Math.abs(y) > 1e-6) allZero = false;
    if (Math.abs(y) < 1e-9) addRoot(x);
    else if (prevY !== null && prevY * y < 0) {
      let lo = prevX;
      let hi = x;
      let flo = prevY;
      for (let k = 0; k < 60; k++) {
        const mid = (lo + hi) / 2;
        const fm = f(mid);
        if (!Number.isFinite(fm)) break;
        if (flo * fm <= 0) hi = mid;
        else {
          lo = mid;
          flo = fm;
        }
      }
      addRoot((lo + hi) / 2);
    }
    prevX = x;
    prevY = y;
  }
  return { roots: roots.sort((a, b) => a - b), identity: allZero };
}

/** Do two root sets (from rootsOf) describe the same equation? */
export function sameRoots(a, b) {
  if (a.identity || b.identity) return a.identity === b.identity;
  if (a.roots.length !== b.roots.length) return false;
  return a.roots.every((r, i) => Math.abs(r - b.roots[i]) < 1e-3);
}

export function eqEquivalent(pA, pB) {
  return sameRoots(rootsOf(pA), rootsOf(pB));
}

/**
 * Is a line that just parsed shaped for its mode? An equation line needs both
 * sides. An expression line that carries an "=" is read by its right-hand side
 * ("3 + 4 = 7" → 7), which is rewritten in place. Returns false only for an
 * equation line missing a side.
 */
export function normalizeSides(parsed, mode) {
  if (mode === "equation") return parsed.sides.length === 2;
  if (parsed.sides.length !== 1) parsed.sides = [parsed.sides[1]];
  return true;
}

/** Is `next` still equivalent to `prev` (both already side-normalized)? */
export function isEquivalent(prev, next, mode) {
  if (mode === "equation") return eqEquivalent(prev, next);
  return exprEquivalent(prev.sides[prev.sides.length - 1], next.sides[0]);
}

// Is this line a finished answer? "x = 4" (either order) for equations; a lone
// number for expressions; or matches the authored answer's compactness.
export function looksSolved(parsed, mode, answerTokens) {
  if (mode === "equation") {
    if (parsed.sides.length !== 2) return false;
    const bare = (rpn) => rpn.length === 1 || (rpn.length === 2 && rpn[1].v === "u-");
    const isVar = (rpn) => rpn[0].t === "var" && rpn.length === 1;
    const isNum = (rpn) => rpn.every((t) => t.t !== "var") && bare(rpn);
    return (
      (isVar(parsed.sides[0]) && isNum(parsed.sides[1])) ||
      (isVar(parsed.sides[1]) && isNum(parsed.sides[0]))
    );
  }
  if (parsed.sides.length !== 1) return false;
  if (parsed.vars.size === 0) {
    const rpn = parsed.sides[0];
    return (
      rpn.length === 1 ||
      (rpn.length === 2 && rpn[1].v === "u-") ||
      (rpn.length === 3 && rpn[2].v === "/")
    ); // simplified fraction counts
  }
  return answerTokens > 0 && parsed.tokenCount <= answerTokens;
}
