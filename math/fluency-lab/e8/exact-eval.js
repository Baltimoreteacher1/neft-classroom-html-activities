// Exact rational expression evaluator shared by the item-bank validator (tools) and the learner-facing answer checker.
// One implementation, so the proof an item was accepted with and the check a student's answer gets can never disagree.
import { Rational, R } from "./rational.js";

// Grammar: expr := term (('+'|'-') term)* ; term := power (('*'|'/') power)* ; power := unary ('^' unary)* ;
// unary := '-' unary | postfix ; postfix := atom ('%')? ; atom := number | name | name '(' args ')' | '(' expr ')'.
const FUNCS = {
  sqrt: ([x]) => {
    const n = Math.round(Math.sqrt(Number(x.n)));
    const d = Math.round(Math.sqrt(Number(x.d)));
    const r = R(n, d);
    if (!r.mul(r).eq(x)) throw new Error(`sqrt(${x}) is not exact`);
    return r;
  },
  abs: ([x]) => x.abs(),
  floor: ([x]) => R(x.floor()),
  ceil: ([x]) => R(-R(x).neg().floor()),
  min: (a) => a.reduce((m, x) => (x.lt(m) ? x : m)),
  max: (a) => a.reduce((m, x) => (x.gt(m) ? x : m)),
  gcd: ([a, b]) => { let x = a.abs(); let y = b.abs(); while (!y.isZero()) [x, y] = [y, R(x.n % y.n)]; return x; },
  lcm: ([a, b]) => { const g = FUNCS.gcd([a, b]); return a.mul(b).abs().div(g); },
  round: ([x, p = R(0)]) => R(x.mul(R(10).pow(Number(p.n))).add(R(1, 2)).floor()).div(R(10).pow(Number(p.n))),
  mean: (a) => a.reduce((s, x) => s.add(x), R(0)).div(a.length),
  pct: ([x]) => x.div(100),
};
export function evaluate(text, env = {}) {
  const src = String(text).replace(/[×·]/g, "*").replace(/÷/g, "/").replace(/[−–]/g, "-").replace(/\s+/g, "");
  let i = 0;
  const peek = () => src[i];
  const fail = (m) => { throw new Error(`${m} in "${text}"`); };
  function number() {
    const m = /^\d+(?:\.\d+)?/.exec(src.slice(i));
    if (!m) fail("number expected");
    i += m[0].length;
    return Rational.of(m[0]);
  }
  function atom() {
    if (peek() === "(") { i += 1; const v = expr(); if (peek() !== ")") fail("missing )"); i += 1; return v; }
    if (/\d/.test(peek() || "")) return number();
    const m = /^[a-zA-Z_][a-zA-Z_0-9]*/.exec(src.slice(i));
    if (!m) fail("unexpected symbol");
    i += m[0].length;
    if (peek() === "(") {
      i += 1;
      const args = [];
      if (peek() !== ")") { args.push(expr()); while (peek() === ",") { i += 1; args.push(expr()); } }
      if (peek() !== ")") fail("missing )");
      i += 1;
      if (!FUNCS[m[0]]) fail(`unknown function ${m[0]}`);
      return FUNCS[m[0]](args);
    }
    if (!(m[0] in env)) fail(`unknown variable ${m[0]}`);
    return Rational.of(env[m[0]]);
  }
  function postfix() { let v = atom(); while (peek() === "%") { i += 1; v = v.div(100); } return v; }
  function unary() { if (peek() === "-") { i += 1; return unary().neg(); } if (peek() === "+") { i += 1; return unary(); } return postfix(); }
  function power() {
    const base = unary();
    if (peek() === "^") { i += 1; const e = unary(); if (!e.isInteger()) fail("exponent must be an integer"); return base.pow(Number(e.n)); }
    return base;
  }
  function term() {
    let v = power();
    while (peek() === "*" || peek() === "/") {
      const op = src[i]; i += 1;
      const r = power();
      if (op === "/" && r.isZero()) fail("division by zero");
      v = op === "*" ? v.mul(r) : v.div(r);
    }
    return v;
  }
  function expr() {
    let v = term();
    while (peek() === "+" || peek() === "-") { const op = src[i]; i += 1; const r = term(); v = op === "+" ? v.add(r) : v.sub(r); }
    return v;
  }
  const out = expr();
  if (i !== src.length) fail("trailing characters");
  return out;
}
