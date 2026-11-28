// Independent solvers for the grade 4-7 families (tools/mls-verify.mjs). Each reads `spec` only and uses exact rational arithmetic.
// Nothing here imports the generators or the kit.
import { Rat, evaluateExpression } from "../../scripts/lib/rational.mjs";

export const SOLVERS = {};

const MINUS = "−";
const TIMES = "×";
const DIVIDE = "÷";

/** Exact rational from a number or a string ("3/4", "-2.5", "1 1/2", "1,344"). */
function R(x) {
  if (x instanceof Rat) return x;
  if (typeof x === "number") return Rat.fromDecimal(String(x));
  const t = String(x).trim().replace(/−/g, "-").replace(/,/g, "");
  let m = /^(-?)(\d+)\s+(\d+)\/(\d+)$/.exec(t);
  if (m) return new Rat((m[1] ? -1n : 1n) * (BigInt(m[2]) * BigInt(m[4]) + BigInt(m[3])), BigInt(m[4]));
  m = /^(-?\d+)\/(\d+)$/.exec(t);
  if (m) return new Rat(BigInt(m[1]), BigInt(m[2]));
  const r = Rat.fromDecimal(t);
  if (!r) throw new Error(`bad number ${x}`);
  return r;
}
const ZERO = new Rat(0n);
const ONE = new Rat(1n);
const I = (n) => new Rat(BigInt(n));
const cmp = (a, b) => {
  const d = a.sub(b);
  return d.n === 0n ? 0 : d.n > 0n ? 1 : -1;
};
const abs = (a) => (a.n < 0n ? a.neg() : a);
const sumR = (xs) => xs.reduce((a, b) => a.add(b), ZERO);
/** Floor of a rational as a Rat. */
const floorR = (a) => {
  let q = a.n / a.d;
  if (a.n < 0n && q * a.d !== a.n) q -= 1n;
  return new Rat(q);
};
const ceilR = (a) => floorR(a.neg()).neg();
/** Round half up to a multiple of `place` (nonnegative values). */
const roundTo = (a, place) => floorR(a.div(R(place)).add(new Rat(1n, 2n))).mul(R(place));
const out = (r) => r.toString();
/** Integer thousands commas, as the displayed text writes them. */
const commas = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
/** Plain decimal string of a Rat with exactly `p` places (the Rat must fit). */
function decStr(r, p) {
  const scaled = r.mul(I(10 ** p));
  if (scaled.d !== 1n) throw new Error(`${r} does not fit ${p} places`);
  const neg = scaled.n < 0n;
  const s = String(neg ? -scaled.n : scaled.n).padStart(p + 1, "0");
  return (neg ? "-" : "") + (p ? `${s.slice(0, -p)}.${s.slice(-p)}` : s);
}
const pairOf = (a, b) => `(${out(a)},${out(b)})`;

// ------------------------------------------------------------------------------------------------ multistep
function runProg(prog, outName) {
  const env = {};
  const val = (x) => (typeof x === "string" && /^[a-z]\w*$/i.test(x) ? (x in env ? env[x] : (() => { throw new Error(`unset ${x}`); })()) : R(x));
  for (const [dest, op, x, y] of prog) {
    const a = val(x);
    const b = val(y);
    let r;
    if (op === "add") r = a.add(b);
    else if (op === "sub") r = a.sub(b);
    else if (op === "mul") r = a.mul(b);
    else if (op === "div") r = a.div(b);
    else if (op === "cdiv") r = ceilR(a.div(b));
    else if (op === "fdiv") r = floorR(a.div(b));
    else if (op === "rem") r = a.sub(floorR(a.div(b)).mul(b));
    else throw new Error(`unknown op ${op}`);
    if (r === null) throw new Error("division by zero");
    env[dest] = r;
  }
  return env[outName];
}
SOLVERS.multistep = (s) => {
  if (s.kind === "prog") return out(runProg(s.prog, s.out));
  if (s.kind === "eqpick") {
    const want = runProg(s.prog, s.out);
    const hits = s.options.filter((o) => {
      const v = evaluateExpression(o);
      return v && v.eq(want);
    });
    if (hits.length !== 1) throw new Error(`${hits.length} options match ${want}`);
    return `${s.letter} = ${hits[0]}`;
  }
  if (s.kind === "estimate") {
    const a = roundTo(R(s.a), s.place);
    const b = roundTo(R(s.b), s.place);
    return out(s.op === "mul" ? a.mul(b) : s.op === "add" ? a.add(b) : a.sub(b));
  }
  throw new Error(`multistep: unknown kind ${s.kind}`);
};

// ------------------------------------------------------------------------------------------------ exprs
SOLVERS.exprs = (s) => {
  if (s.kind === "eval") {
    const v = evaluateExpression(s.expr);
    if (!v || v.d !== 1n) throw new Error(`not a whole number: ${s.expr}`);
    return out(v);
  }
  if (s.kind === "write") {
    const { a, b, c, k } = s;
    const f = {
      sumTimes: `${k} ${TIMES} (${a} + ${b})`,
      diffTimes: `${k} ${TIMES} (${a} ${MINUS} ${b})`,
      prodPlus: `${a} ${TIMES} ${b} + ${c}`,
      sumDiv: `(${a} + ${b}) ${DIVIDE} ${c}`,
      plusProd: `${a} + ${b} ${TIMES} ${c}`,
      minusSum: `${a} ${MINUS} (${b} + ${c})`,
    }[s.form];
    if (!f) throw new Error(`unknown form ${s.form}`);
    return f;
  }
  if (s.kind === "interp") {
    const part = s.sign === "+" ? "sum" : "difference";
    return `${s.k} times as large as the ${part} ${commas(s.a)} ${s.sign} ${commas(s.b)}`;
  }
  throw new Error(`exprs: unknown kind ${s.kind}`);
};

// ------------------------------------------------------------------------------------------------ patterns
const termOf = (r, n) => {
  let t = R(r.start);
  for (let i = 1; i < n; i++) t = r.op === "add" ? t.add(R(r.by)) : t.mul(R(r.by));
  return t;
};
function inferRule(seq) {
  const v = seq.map(R);
  const diffs = v.slice(1).map((x, i) => x.sub(v[i]));
  if (diffs.every((d) => d.eq(diffs[0]))) return { op: "add", by: diffs[0] };
  if (v[0].n !== 0n) {
    const ratios = v.slice(1).map((x, i) => x.div(v[i]));
    if (ratios.every((q) => q && q.eq(ratios[0]))) return { op: "mul", by: ratios[0] };
  }
  throw new Error(`no rule for ${seq}`);
}
SOLVERS.patterns = (s) => {
  if (s.kind === "term") return out(termOf(s.rule, s.n));
  if (s.kind === "pair") return pairOf(termOf(s.a, s.n), termOf(s.b, s.n));
  if (s.kind === "relation") {
    const diffs = [];
    for (let i = 1; i <= 6; i++) {
      const a = termOf(s.a, i);
      const b = termOf(s.b, i);
      if (s.how === "times") {
        if (a.n !== 0n) diffs.push(b.div(a));
      } else diffs.push(b.sub(a));
    }
    if (!diffs.length || !diffs.every((d) => d.eq(diffs[0]))) throw new Error("relation is not constant");
    return out(diffs[0]);
  }
  if (s.kind === "rule") {
    const r = inferRule(s.seq);
    return `Start at ${s.seq[0]}, ${r.op === "add" ? "add" : "multiply by"} ${out(r.by)}`;
  }
  if (s.kind === "extend") {
    const r = inferRule(s.seq);
    let t = R(s.seq[s.seq.length - 1]);
    for (let i = 0; i < s.ahead; i++) t = r.op === "add" ? t.add(r.by) : t.mul(r.by);
    return out(t);
  }
  throw new Error(`patterns: unknown kind ${s.kind}`);
};

// ------------------------------------------------------------------------------------------------ volume
SOLVERS.volume = (s) => {
  if (s.kind === "count" || s.kind === "formula") return out(R(s.l).mul(R(s.w)).mul(R(s.h)));
  if (s.kind === "base") return out(R(s.B).mul(R(s.h)));
  if (s.kind === "composite") return out(sumR(s.parts.map((p) => R(p.l).mul(R(p.w)).mul(R(p.h)))));
  if (s.kind === "missing") return out(R(s.V).div(R(s.dims[0]).mul(R(s.dims[1]))));
  throw new Error(`volume: unknown kind ${s.kind}`);
};

// ------------------------------------------------------------------------------------------------ coordinate
SOLVERS.coordinate = (s) => {
  if (s.kind === "name") {
    const p = s.points.find((q) => q.label === s.target);
    if (!p) throw new Error("target point missing");
    return pairOf(R(p.x), R(p.y));
  }
  if (s.kind === "axisdist") return out(abs(R(s.from === "y-axis" ? s.x : s.y)));
  if (s.kind === "dist") {
    const dx = abs(R(s.p[0]).sub(R(s.q[0])));
    const dy = abs(R(s.p[1]).sub(R(s.q[1])));
    if (dx.n !== 0n && dy.n !== 0n) throw new Error("points are not on a horizontal or vertical line");
    return out(dx.add(dy));
  }
  if (s.kind === "rule") return out(s.op === "add" ? R(s.x).add(R(s.by)) : R(s.x).mul(R(s.by)));
  if (s.kind === "ctxpoint") return out(R(s.ask === "x" ? s.x : s.y));
  throw new Error(`coordinate: unknown kind ${s.kind}`);
};

// ------------------------------------------------------------------------------------------------ ratio
const H = new Rat(1n, 100n);
SOLVERS.ratio = (s) => {
  if (s.kind === "write") {
    const v = { a: s.a, b: s.b, total: s.a + s.b };
    return `${v[s.num]}:${v[s.den]}`;
  }
  if (s.kind === "equiv") {
    const x = R(s.given.value);
    return out(s.given.pos === "first" ? x.mul(R(s.b)).div(R(s.a)) : x.mul(R(s.a)).div(R(s.b)));
  }
  if (s.kind === "table") {
    const full = s.rows.find((r) => r.every((c) => c !== null));
    const miss = s.rows.find((r) => r.some((c) => c === null));
    if (!full || !miss) throw new Error("table needs a complete row and an empty cell");
    const [fx, fy] = full.map(R);
    return out(miss[0] === null ? R(miss[1]).mul(fx).div(fy) : R(miss[0]).mul(fy).div(fx));
  }
  if (s.kind === "tape") {
    const unit = R(s.total).div(R(s.a).add(R(s.b)));
    return out(unit.mul(R(s.find === "a" ? s.a : s.b)));
  }
  if (s.kind === "dnl") {
    const top = s.top.values;
    const bot = s.bottom.values;
    const idx = top.findIndex((t, i) => t !== null && bot[i] !== null);
    const miss = top.findIndex((t, i) => t === null || bot[i] === null);
    if (idx < 0 || miss < 0) throw new Error("double number line needs a complete pair and a missing number");
    return out(top[miss] === null ? R(bot[miss]).mul(R(top[idx])).div(R(bot[idx])) : R(top[miss]).mul(R(bot[idx])).div(R(top[idx])));
  }
  if (s.kind === "compare") {
    const c = cmp(R(s.m1[0]).div(R(s.m1[1])), R(s.m2[0]).div(R(s.m2[1])));
    if (c === 0) throw new Error("equal ratios");
    return `${s.noun} ${c > 0 ? 1 : 2}`;
  }
  throw new Error(`ratio: unknown kind ${s.kind}`);
};

// ------------------------------------------------------------------------------------------------ unitrate
SOLVERS.unitrate = (s) => {
  if (s.kind === "unit") return out(R(s.qty).div(R(s.per)));
  if (s.kind === "better") {
    const [x, y] = s.offers.map((o) => ({ label: o.label, unit: R(o.cost).div(R(o.qty)) }));
    const c = cmp(x.unit, y.unit);
    if (c === 0) throw new Error("equal unit prices");
    return `Offer ${c < 0 ? x.label : y.label}`;
  }
  if (s.kind === "solve") {
    const rate = R(s.qty).div(R(s.per));
    return out(s.find === "qty" ? rate.mul(R(s.given)) : R(s.given).div(rate));
  }
  throw new Error(`unitrate: unknown kind ${s.kind}`);
};

// ------------------------------------------------------------------------------------------------ percent
SOLVERS.percent = (s) => {
  if (s.kind === "part") return out(R(s.pct).mul(R(s.whole)).mul(H));
  if (s.kind === "whole") return out(R(s.part).div(R(s.pct).mul(H)));
  if (s.kind === "pct") return out(R(s.part).div(R(s.whole)).mul(I(100)));
  if (s.kind === "app") {
    if (s.app === "change") return out(abs(R(s.to).sub(R(s.from))).div(R(s.from)).mul(I(100)));
    const rate = R(s.rate).mul(H);
    if (s.app === "tax" || s.app === "tip" || s.app === "markup") return out(s.ask === "total" ? R(s.price).mul(ONE.add(rate)) : R(s.price).mul(rate));
    if (s.app === "discount") return out(s.ask === "total" ? R(s.price).mul(ONE.sub(rate)) : R(s.price).mul(rate));
    if (s.app === "change") return out(abs(R(s.to).sub(R(s.from))).div(R(s.from)).mul(I(100)));
    if (s.app === "interest") {
      const i = R(s.P).mul(rate).mul(R(s.t));
      return out(s.ask === "interest" ? i : i.add(R(s.P)));
    }
    if (s.app === "orig") return out(R(s.price).div(s.dir === "off" ? ONE.sub(rate) : ONE.add(rate)));
  }
  throw new Error(`percent: unknown kind ${s.kind}`);
};

// ------------------------------------------------------------------------------------------------ integers
SOLVERS.integers = (s) => {
  if (s.kind === "ctx") return out(s.dir === "down" ? I(-s.mag) : I(s.mag));
  if (s.kind === "opp") return out(s.times % 2 === 1 ? R(s.n).neg() : R(s.n));
  if (s.kind === "abs") return out(abs(R(s.n)));
  if (s.kind === "farther") {
    const c = cmp(abs(R(s.a)), abs(R(s.b)));
    if (c === 0) throw new Error("tie");
    return out(c > 0 ? R(s.a) : R(s.b));
  }
  if (s.kind === "extreme") {
    const v = s.values.map(R).sort(cmp);
    return out(s.which === "least" ? v[0] : v[v.length - 1]);
  }
  if (s.kind === "read") return out(R(s.value));
  if (s.kind === "quad") {
    const x = R(s.x);
    const y = R(s.y);
    if (x.n === 0n || y.n === 0n) throw new Error("point on an axis");
    return x.n > 0n ? (y.n > 0n ? "Quadrant I" : "Quadrant IV") : y.n > 0n ? "Quadrant II" : "Quadrant III";
  }
  if (s.kind === "reflect") {
    const x = R(s.x);
    const y = R(s.y);
    return s.axis === "x" ? pairOf(x, y.neg()) : pairOf(x.neg(), y);
  }
  if (s.kind === "dist") {
    const dx = abs(R(s.p[0]).sub(R(s.q[0])));
    const dy = abs(R(s.p[1]).sub(R(s.q[1])));
    if (dx.n !== 0n && dy.n !== 0n) throw new Error("not axis-parallel");
    return out(dx.add(dy));
  }
  if (s.kind === "op") {
    const a = R(s.a);
    const b = R(s.b);
    const r = s.op === "+" ? a.add(b) : s.op === MINUS ? a.sub(b) : s.op === TIMES ? a.mul(b) : a.div(b);
    if (r === null) throw new Error("division by zero");
    return out(r);
  }
  throw new Error(`integers: unknown kind ${s.kind}`);
};

// ------------------------------------------------------------------------------------------------ algexpr
const linT = (a, b, v) => {
  const body = a === 1 ? v : `${a}${v}`;
  if (a === 0) return b < 0 ? `${MINUS}${-b}` : String(b);
  if (b === 0) return body;
  return `${body} ${b < 0 ? MINUS : "+"} ${Math.abs(b)}`;
};
const gcdN = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
};
const AWF = {
  moreTimes: (k, b, v) => `${k}${v} + ${b}`,
  lessTimes: (k, b, v) => `${k}${v} ${MINUS} ${b}`,
  sumTimes: (k, b, v) => `${k}(${v} + ${b})`,
  divPlus: (k, b, v) => `${v} ${DIVIDE} ${k} + ${b}`,
  lessFrom: (k, b, v) => `${b} ${MINUS} ${v}`,
  diffTimes: (k, b, v) => `${k}(${v} ${MINUS} ${b})`,
};
SOLVERS.algexpr = (s) => {
  if (s.kind === "eval") {
    let e = s.expr;
    for (const [name, value] of Object.entries(s.vars)) e = e.replaceAll(name, `(${value})`);
    const v = evaluateExpression(e);
    if (!v || v.d !== 1n) throw new Error(`not a whole number: ${e}`);
    return out(v);
  }
  if (s.kind === "write") return AWF[s.form](s.k, s.b, s.v);
  if (s.kind === "parts") {
    if (s.ask === "nterms") return String(s.terms.length);
    if (s.ask === "const") return out(sumR(s.terms.filter((t) => !t.v).map((t) => R(t.c))));
    const hit = s.terms.filter((t) => t.v === s.target);
    if (hit.length !== 1) throw new Error("coefficient target is not unique");
    return out(R(hit[0].c));
  }
  if (s.kind === "dist") return linT(s.k, s.k * s.b, s.v);
  if (s.kind === "factor") {
    const g = gcdN(s.c1, s.c2);
    return `${g}(${linT(s.c1 / g, s.c2 / g, s.v)})`;
  }
  if (s.kind === "combine") {
    const a = s.terms.filter((t) => t.v === s.v).reduce((x, t) => x + t.c, 0);
    const b = s.terms.filter((t) => !t.v).reduce((x, t) => x + t.c, 0);
    return linT(a, b, s.v);
  }
  throw new Error(`algexpr: unknown kind ${s.kind}`);
};

// ------------------------------------------------------------------------------------------------ equation
SOLVERS.equation = (s) => {
  const p = R(s.p);
  const q = R(s.q);
  if (s.kind === "eq1") {
    if (s.form === "add") return out(q.sub(p));
    if (s.form === "sub") return out(q.add(p));
    if (s.form === "mul") return out(q.div(p));
    if (s.form === "div") return out(q.mul(p));
  }
  if (s.kind === "eq2") {
    const r = R(s.r);
    if (s.form === "lin") return out(r.sub(q).div(p));
    if (s.form === "paren") return out(r.div(p).sub(q));
  }
  throw new Error(`equation: unknown spec ${s.kind}/${s.form}`);
};

// ------------------------------------------------------------------------------------------------ inequality
const GE = "≥";
const LE = "≤";
const FLIP = { ">": "<", "<": ">", [GE]: LE, [LE]: GE };
const holdsR = (x, op, c) => {
  const d = cmp(x, c);
  return op === ">" ? d > 0 : op === "<" ? d < 0 : op === GE ? d >= 0 : d <= 0;
};
const mm = (r) => out(r).replace("-", MINUS);
SOLVERS.inequality = (s) => {
  if (s.kind === "write" || s.kind === "graph") return `${s.v} ${s.op} ${mm(R(s.c))}`;
  if (s.kind === "which") {
    const hits = s.options.filter((o) => holdsR(R(o), s.op, R(s.c)));
    if (hits.length !== 1) throw new Error(`${hits.length} options satisfy the inequality`);
    return mm(R(hits[0]));
  }
  if (s.kind === "solve1") {
    const p = R(s.p);
    const q = R(s.q);
    const b = s.form === "add" ? q.sub(p) : s.form === "sub" ? q.add(p) : s.form === "mul" ? q.div(p) : q.mul(p);
    return `${s.v} ${s.op} ${mm(b)}`;
  }
  if (s.kind === "solve2") {
    const p = R(s.p);
    const q = R(s.q);
    const r = R(s.r);
    const b = s.form === "lin" ? r.sub(q).div(p) : r.div(p).sub(q);
    return `${s.v} ${p.n < 0n ? FLIP[s.op] : s.op} ${mm(b)}`;
  }
  throw new Error(`inequality: unknown kind ${s.kind}`);
};

// ------------------------------------------------------------------------------------------------ indepdep
function tableRule(rows) {
  const full = rows.filter((r) => r[0] !== null && r[1] !== null).map((r) => [R(r[0]), R(r[1])]);
  if (full.length < 2) throw new Error("need two complete rows");
  const k = full[0][1].div(full[0][0]);
  if (full.every(([x, y]) => y.div(x).eq(k)) && !k.eq(ONE)) return { mul: true, v: k };
  const c = full[0][1].sub(full[0][0]);
  if (full.every(([x, y]) => y.sub(x).eq(c))) return { mul: false, v: c };
  throw new Error("no rule fits the table");
}
SOLVERS.indepdep = (s) => {
  if (s.kind === "role") return s.ask === "dependent" ? s.dep : s.indep;
  if (s.kind === "role2") return s.target === "dep" ? "dependent" : "independent";
  if (s.kind === "eqtable") {
    const r = tableRule(s.rows);
    return r.mul ? `y = ${out(r.v)}x` : `y = x + ${out(r.v)}`;
  }
  if (s.kind === "missing") {
    const r = tableRule(s.rows);
    const row = s.rows.find((q) => q[0] === null || q[1] === null);
    if (row[1] === null) return out(r.mul ? R(row[0]).mul(r.v) : R(row[0]).add(r.v));
    return out(r.mul ? R(row[1]).div(r.v) : R(row[1]).sub(r.v));
  }
  if (s.kind === "sub") {
    const k = R(s.k);
    const v = R(s.value);
    if (s.find === "y") return out(s.form === "mul" ? v.mul(k) : v.add(k));
    return out(s.form === "mul" ? v.div(k) : v.sub(k));
  }
  throw new Error(`indepdep: unknown kind ${s.kind}`);
};
