// Tiny exact-arithmetic checker for worked solutions: BigInt fractions, linear expressions in one variable
// (x, or π), equations and inequalities. It shares no code with the generator it checks.
import assert from "node:assert/strict";

// ---------- exact arithmetic ----------
const abs = (n) => (n < 0n ? -n : n);
const gcd = (a, b) => (b === 0n ? abs(a) : gcd(b, a % b));
export class Q {
  constructor(n, d = 1n) {
    if (d === 0n) throw new Error("division by zero");
    const g = gcd(n, d) || 1n;
    const sign = d < 0n ? -1n : 1n;
    this.n = (sign * n) / g;
    this.d = (sign * d) / g;
  }
  add(o) {
    return new Q(this.n * o.d + o.n * this.d, this.d * o.d);
  }
  sub(o) {
    return new Q(this.n * o.d - o.n * this.d, this.d * o.d);
  }
  mul(o) {
    return new Q(this.n * o.n, this.d * o.d);
  }
  div(o) {
    return new Q(this.n * o.d, this.d * o.n);
  }
  neg() {
    return new Q(-this.n, this.d);
  }
  eq(o) {
    return this.n === o.n && this.d === o.d;
  }
  zero() {
    return this.n === 0n;
  }
  cmp(o) {
    const x = this.n * o.d - o.n * this.d;
    return x < 0n ? -1 : x > 0n ? 1 : 0;
  }
  str() {
    return this.d === 1n ? String(this.n) : `${this.n}/${this.d}`;
  }
}
export const ZERO = new Q(0n);
export const ONE = new Q(1n);
function literal(text) {
  const [whole, frac = ""] = text.split(".");
  return new Q(BigInt(whole + frac), 10n ** BigInt(frac.length));
}
// A linear expression a*v + b in a single variable v (x, or π when a circle's area is left in terms of π).
export const konst = (q) => ({ a: ZERO, b: q, v: null });
const sameVar = (p, q) => {
  if (p.v && q.v && p.v !== q.v) throw new Error("two variables");
  return p.v || q.v;
};
export const polyEq = (p, q) => p.a.eq(q.a) && p.b.eq(q.b);

function tokenize(source) {
  const s = source.replaceAll("-", "−");
  const raw = [];
  for (let i = 0; i < s.length; ) {
    const rest = s.slice(i);
    let m;
    if (s[i] === " ") i += 1;
    else if ((m = /^\d+(?:\.\d+)?\/\d+(?:\.\d+)?/.exec(rest))) {
      raw.push({ k: "frac", v: m[0] });
      i += m[0].length;
    } else if ((m = /^\d+(?:\.\d+)?/.exec(rest))) {
      raw.push({ k: "num", v: m[0] });
      i += m[0].length;
    } else if (s[i] === "x" || s[i] === "π") {
      raw.push({ k: "var", v: s[i] });
      i += 1;
    } else if (rest.startsWith("of")) {
      raw.push({ k: "×" });
      i += 2;
    } else if ("+−×÷/:^()%".includes(s[i])) {
      raw.push({ k: s[i] });
      i += 1;
    } else if ("=<>≤≥".includes(s[i])) {
      raw.push({ k: "rel", v: s[i] });
      i += 1;
    } else throw new Error(`Cannot read "${s[i]}" in "${source}"`);
  }
  const out = [];
  for (const tok of raw) {
    const prev = out.at(-1);
    if (
      prev &&
      ["num", "frac", "var", ")", "%"].includes(prev.k) &&
      (tok.k === "var" || tok.k === "(")
    )
      out.push({ k: "×" });
    out.push(tok);
  }
  return out;
}

function parseExpr(tokens) {
  let at = 0;
  const peek = () => tokens[at]?.k;
  const take = (k) => {
    assert.equal(peek(), k, `expected ${k}`);
    at += 1;
  };
  const times = (p, q) => {
    if (!p.a.zero() && !q.a.zero()) throw new Error("not linear");
    return { a: p.a.mul(q.b).add(q.a.mul(p.b)), b: p.b.mul(q.b), v: sameVar(p, q) };
  };
  const over = (p, q) => {
    if (!q.a.zero()) throw new Error("divide by a variable");
    return { a: p.a.div(q.b), b: p.b.div(q.b), v: p.v };
  };
  function atom() {
    const tok = tokens[at];
    if (tok.k === "num") {
      at += 1;
      return konst(literal(tok.v));
    }
    if (tok.k === "frac") {
      at += 1;
      const [n, d] = tok.v.split("/");
      return konst(literal(n).div(literal(d)));
    }
    if (tok.k === "var") {
      at += 1;
      return { a: ONE, b: ZERO, v: tok.v };
    }
    take("(");
    const inner = ratio();
    take(")");
    return inner;
  }
  function power() {
    let base = atom();
    if (peek() === "%") {
      at += 1;
      base = over(base, konst(literal("100")));
    }
    if (peek() === "^") {
      at += 1;
      const exp = Number(tokens[at].v);
      at += 1;
      assert.ok(Number.isInteger(exp) && exp >= 0, "whole-number exponent");
      let result = konst(ONE);
      for (let i = 0; i < exp; i += 1) result = times(result, base);
      base = result;
    }
    return base;
  }
  function unary() {
    if (peek() === "−") {
      at += 1;
      const p = unary();
      return { a: p.a.neg(), b: p.b.neg(), v: p.v };
    }
    return power();
  }
  function mul() {
    let p = unary();
    while (["×", "÷", "/"].includes(peek())) {
      const op = peek();
      at += 1;
      const q = unary();
      p = op === "×" ? times(p, q) : over(p, q);
    }
    return p;
  }
  function add() {
    let p = mul();
    while (["+", "−"].includes(peek())) {
      const op = peek();
      at += 1;
      const q = mul();
      const sign = op === "+" ? 1 : -1;
      p = {
        a: sign > 0 ? p.a.add(q.a) : p.a.sub(q.a),
        b: sign > 0 ? p.b.add(q.b) : p.b.sub(q.b),
        v: sameVar(p, q),
      };
    }
    return p;
  }
  function ratio() {
    const p = add();
    if (peek() !== ":") return p;
    at += 1;
    return over(p, add());
  }
  const result = ratio();
  assert.equal(at, tokens.length, `unread input after position ${at}`);
  return result;
}

export function parse(text) {
  const tokens = tokenize(text);
  const rels = tokens.filter((t) => t.k === "rel");
  assert.ok(rels.length <= 1, `one relation at most in "${text}"`);
  if (!rels.length) return { rel: null, left: parseExpr(tokens) };
  const cut = tokens.findIndex((t) => t.k === "rel");
  return {
    rel: rels[0].v,
    left: parseExpr(tokens.slice(0, cut)),
    right: parseExpr(tokens.slice(cut + 1)),
  };
}
const FLIP = { "<": ">", ">": "<", "≤": "≥", "≥": "≤", "=": "=" };
// A relation reduced to "variable REL number" (or a truth value when the variable cancels).
export function solution(p) {
  const a = p.left.a.sub(p.right.a);
  const b = p.right.b.sub(p.left.b);
  if (a.zero()) return `const:${p.rel}:${p.left.b.cmp(p.right.b)}`;
  const k = b.div(a);
  return `${a.cmp(ZERO) < 0 ? FLIP[p.rel] : p.rel} ${k.str()}`;
}
export function equivalent(from, to) {
  const [p, q] = [parse(from), parse(to)];
  if (!p.rel && !q.rel) return polyEq(p.left, q.left);
  if (p.rel && q.rel) return solution(p) === solution(q);
  return false;
}
export const value = (text) => {
  const p = parse(text);
  assert.ok(!p.rel, `${text} is not an expression`);
  return p.left;
};
export const isNumber = (p) => p.a.zero();
