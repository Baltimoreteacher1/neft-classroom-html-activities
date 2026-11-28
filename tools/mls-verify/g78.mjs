// Independent solvers for the grade 7-8 Math Literacy Studio families (docs/math-literacy/architecture.md "Verifier").
// Each solver reads ONLY `spec` and recomputes the canonical answer with exact rational (BigInt) arithmetic.
// It never imports a generator or the kit. Canonical text forms: pairs "(x,y)", bool "true"/"false".
import { Rat } from "../../scripts/lib/rational.mjs";

const R = (v) => {
  if (v instanceof Rat) return v;
  const s = String(v).trim();
  const m = /^(-?\d+)\/(\d+)$/.exec(s);
  if (m) return new Rat(BigInt(m[1]), BigInt(m[2]));
  const r = Rat.fromDecimal(s);
  if (!r) throw new Error(`bad number: ${s}`);
  return r;
};
const ZERO = new Rat(0n);
const ONE = new Rat(1n);
const sign = (r) => (r.n < 0n ? -1 : r.n > 0n ? 1 : 0);
const cmp = (a, b) => sign(a.sub(b));
const eq = (a, b) => cmp(a, b) === 0;
const abs = (r) => (r.n < 0n ? r.neg() : r);
const I = (n) => new Rat(BigInt(n));
const fmt = (r) => (r.d === 1n ? String(r.n) : `${r.n}/${r.d}`);
const sum = (arr) => arr.reduce((a, b) => a.add(b), ZERO);
const need = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
/** Exact minimal decimal when the rational terminates, else "n/d". */
function dtext(r) {
  if (r.d === 1n) return String(r.n);
  let d = r.d;
  let a = 0;
  let b = 0;
  while (d % 2n === 0n) {
    d /= 2n;
    a++;
  }
  while (d % 5n === 0n) {
    d /= 5n;
    b++;
  }
  if (d !== 1n) return fmt(r);
  const places = Math.max(a, b);
  const scaled = ((r.n < 0n ? -r.n : r.n) * 10n ** BigInt(places)) / r.d;
  const digits = scaled.toString().padStart(places + 1, "0");
  let s = `${digits.slice(0, -places)}.${digits.slice(-places)}`;
  s = s.replace(/0+$/, "");
  return (r.n < 0n ? "-" : "") + s;
}
function isqrt(n) {
  need(n >= 0n, "isqrt of a negative");
  if (n < 2n) return n;
  let x = BigInt(Math.floor(Math.sqrt(Number(n))));
  while (x * x > n) x--;
  while ((x + 1n) * (x + 1n) <= n) x++;
  return x;
}
function icbrt(n) {
  const neg = n < 0n;
  const m = neg ? -n : n;
  let x = BigInt(Math.round(Math.cbrt(Number(m))));
  while (x * x * x > m) x--;
  while ((x + 1n) * (x + 1n) * (x + 1n) <= m) x++;
  return neg ? -x : x;
}
/** Exact root of a rational when it is a perfect power of the given index (2 or 3), else null. */
function exactRoot(v, idx) {
  const root = idx === 2 ? isqrt : icbrt;
  if (idx === 2 && v.n < 0n) return null;
  const n = root(v.n);
  const d = root(v.d);
  const pow = (x) => (idx === 2 ? x * x : x * x * x);
  return pow(n) === v.n && pow(d) === v.d ? new Rat(n, d) : null;
}
const pairOf = (x, y) => `(${fmt(x)},${fmt(y)})`;
const med = (arr) => {
  const s = arr.map(R).sort((a, b) => cmp(a, b));
  const h = s.length >> 1;
  return s.length % 2 ? s[h] : s[h - 1].add(s[h]).div(I(2));
};
const mean = (arr) => sum(arr.map(R)).div(I(arr.length));
const mad = (arr) => {
  const m = mean(arr);
  return sum(arr.map((v) => abs(R(v).sub(m)))).div(I(arr.length));
};
const LEN = { cm: I(1), m: I(100), km: I(100000), in: I(1), ft: I(12), mi: I(63360) };

export const SOLVERS = {};

// ---------------------------------------------------------------------------------------------------------------- proportional
function tableRate(rows) {
  const rs = rows.map(([x, y]) => {
    need(!eq(R(x), ZERO), "x must not be zero");
    return R(y).div(R(x));
  });
  need(rs.every((r) => eq(r, rs[0])), "table is not proportional");
  return rs[0];
}
const repRate = (rep) => {
  if (rep.kind === "table") return tableRate(rep.rows);
  if (rep.kind === "eq") return R(rep.k);
  if (rep.kind === "graph") return R(rep.pt[1]).div(R(rep.pt[0]));
  if (rep.kind === "verbal") return R(rep.y).div(R(rep.x));
  throw new Error(`unknown representation ${rep.kind}`);
};
const ratiosOf = (rows) => rows.map(([x, y]) => R(y).div(R(x)));
SOLVERS.proportional = (spec) => {
  switch (spec.type) {
    case "table-k":
      return fmt(tableRate(spec.rows));
    case "table-missing":
      return fmt(tableRate(spec.rows).mul(R(spec.x)));
    case "eq-solve": {
      const k = R(spec.k);
      const g = R(spec.given);
      return fmt(spec.find === "y" ? k.mul(g) : g.div(k));
    }
    case "graph-unit":
      return fmt(R(spec.pt[1]).div(R(spec.pt[0])));
    case "verbal-k":
      return fmt(R(spec.y).div(R(spec.x)));
    case "meaning": {
      const [x, y] = spec.pt.map(R);
      if (spec.which === "origin") {
        need(eq(x, ZERO) && eq(y, ZERO), "origin point expected");
        return `With 0 ${spec.x[1]}, there are 0 ${spec.y[1]}.`;
      }
      need(eq(x, ONE), "unit point expected");
      return `${dtext(y.div(x))} ${spec.y[1]} for every 1 ${spec.x[0]}`;
    }
    case "cmp-which": {
      const [k1, k2] = spec.reps.map(repRate);
      need(!eq(k1, k2), "rates are equal");
      return cmp(k1, k2) > 0 ? spec.people[0] : spec.people[1];
    }
    case "cmp-same": {
      const [k1, k2] = spec.reps.map(repRate);
      return eq(k1, k2) ? "true" : "false";
    }
    case "cmp-diff": {
      const [k1, k2] = spec.reps.map(repRate);
      return fmt(abs(k1.sub(k2)));
    }
    case "arg-table": {
      const rs = ratiosOf(spec.rows);
      return rs.every((r) => eq(r, rs[0])) ? "true" : "false";
    }
    case "arg-which": {
      const rs = ratiosOf(spec.rows);
      const idx = rs.findIndex((r) => rs.filter((o) => eq(o, r)).length === 1);
      need(idx >= 0 && rs.filter((r) => eq(r, rs[idx])).length === 1 && rs.filter((r) => !eq(r, rs[idx])).every((r, _i, arr) => eq(r, arr[0])), "no single odd row");
      return fmt(R(spec.rows[idx][0]));
    }
    case "arg-line":
      return eq(R(spec.b), ZERO) ? "true" : "false";
    case "arg-eq":
      if (spec.form === "lin") return eq(R(spec.b), ZERO) ? "true" : "false";
      if (spec.form === "inv") return "false";
      return "true";
    default:
      throw new Error(`unknown proportional type ${spec.type}`);
  }
};

// ---------------------------------------------------------------------------------------------------------------- scale
SOLVERS.scale = (spec) => {
  switch (spec.type) {
    case "actual": {
      const [a, b] = spec.sc.map(R);
      return fmt(R(spec.d).mul(b).div(a));
    }
    case "drawing": {
      const [a, b] = spec.sc.map(R);
      return fmt(R(spec.actual).mul(a).div(b));
    }
    case "factor":
      return fmt(R(spec.ac).mul(LEN[spec.au]).div(R(spec.dr).mul(LEN[spec.du])));
    case "area": {
      const k = R(spec.k);
      return fmt(R(spec.w).mul(k).mul(R(spec.h).mul(k)));
    }
    case "redraw": {
      const [a1, b1] = spec.s1.map(R);
      const [a2, b2] = spec.s2.map(R);
      const real = R(spec.d).mul(b1).div(a1);
      return fmt(real.mul(a2).div(b2));
    }
    default:
      throw new Error(`unknown scale type ${spec.type}`);
  }
};

// ---------------------------------------------------------------------------------------------------------------- circle / geometry
const PI3 = R("3.14");
const CROSS_TABLE = {
  prism: { parallel: (d) => (d[0] === d[1] ? "square" : "rectangle"), vertical: () => "rectangle" },
  cube: { parallel: () => "square", vertical: () => "square" },
  cylinder: { parallel: () => "circle", vertical: () => "rectangle" },
  cone: { parallel: () => "circle", vertical: () => "triangle" },
  sphere: { any: () => "circle" },
  pyramid: { parallel: () => "square", vertical: () => "triangle" },
};
SOLVERS.circle = (spec) => {
  switch (spec.type) {
    case "circ": {
      const r = spec.given === "r" ? R(spec.n) : R(spec.n).div(I(2));
      const coef = spec.what === "circumference" ? r.mul(I(2)) : r.mul(r);
      if (spec.pi === "3.14") return fmt(PI3.mul(coef));
      need(coef.d === 1n, "coefficient of pi should be whole");
      return `${coef.n}π`;
    }
    case "circ-inv": {
      const v = R(spec.v);
      if (spec.from === "circumference") return fmt(v.div(PI3.mul(I(2))));
      const r2 = v.div(PI3);
      const r = exactRoot(r2, 2);
      need(r, "area does not give a whole radius");
      return fmt(r);
    }
    case "comp": {
      if (spec.shape === "hole") return fmt(I(spec.W).mul(I(spec.H)).sub(I(spec.s).mul(I(spec.s))));
      if (spec.shape === "l") return fmt(I(spec.w1).mul(I(spec.h1)).add(I(spec.w2).mul(I(spec.h2))));
      if (spec.shape === "semi") {
        const r = I(spec.w).div(I(2));
        return fmt(I(spec.w).mul(I(spec.h)).add(PI3.mul(r).mul(r).div(I(2))));
      }
      throw new Error("unknown composite shape");
    }
    case "comp-perim":
      need(spec.cw < spec.W && spec.ch < spec.H, "cut-out must fit inside the rectangle");
      return fmt(I(2).mul(I(spec.W).add(I(spec.H))));
    case "angle": {
      const a = I(spec.a);
      if (spec.rel === "complementary") return fmt(I(90).sub(a));
      if (spec.rel === "supplementary" || spec.rel === "straight") return fmt(I(180).sub(a));
      if (spec.rel === "vertical") return fmt(a);
      throw new Error("unknown angle relation");
    }
    case "angle-alg": {
      const x = I(spec.total).sub(I(spec.c1)).sub(I(spec.c2)).div(I(spec.a1).add(I(spec.a2)));
      if (spec.ask === "x") return fmt(x);
      const A1 = I(spec.a1).mul(x).add(I(spec.c1));
      const A2 = I(spec.a2).mul(x).add(I(spec.c2));
      return fmt(cmp(A1, A2) > 0 ? A1 : A2);
    }
    case "cross": {
      const row = CROSS_TABLE[spec.solid];
      const f = row[spec.cut] || row.any;
      need(f, `no cross-section rule for ${spec.solid}/${spec.cut}`);
      return f(spec.dims);
    }
    default:
      throw new Error(`unknown circle type ${spec.type}`);
  }
};

// ---------------------------------------------------------------------------------------------------------------- probability
const DIE_FACES = [1, 2, 3, 4, 5, 6];
const diePass = (p, f) => (p.op === "gt" ? f > p.v : p.op === "lt" ? f < p.v : p.op === "even" ? f % 2 === 0 : p.op === "odd" ? f % 2 === 1 : p.op === "prime" ? [2, 3, 5].includes(f) : f % p.v === 0);
const fraction = (fav, total) => new Rat(BigInt(fav), BigInt(total));
SOLVERS.probability = (spec) => {
  switch (spec.type) {
    case "simple": {
      const entries = Object.entries(spec.counts);
      const total = entries.reduce((a, [, n]) => a + n, 0);
      const inSet = entries.filter(([c]) => spec.event.set.includes(c)).reduce((a, [, n]) => a + n, 0);
      const fav = spec.event.kind === "in" ? inSet : total - inSet;
      return fmt(fraction(fav, total));
    }
    case "compound": {
      let fav = 0;
      let tot = 0;
      if (spec.kind === "two-coins") {
        for (const a of "HT")
          for (const b of "HT") {
            const heads = (a === "H") + (b === "H");
            tot++;
            if (spec.event.kind === "heads-eq" ? heads === spec.event.n : heads >= spec.event.n) fav++;
          }
      } else if (spec.kind === "coin-die") {
        for (const c of "HT")
          for (const f of DIE_FACES) {
            tot++;
            if (c === spec.coin && diePass(spec.die, f)) fav++;
          }
      } else if (spec.kind === "two-dice") {
        for (const a of DIE_FACES)
          for (const b of DIE_FACES) {
            tot++;
            const ev = spec.event;
            if (ev.kind === "sum-eq" ? a + b === ev.v : ev.kind === "sum-ge" ? a + b >= ev.v : ev.kind === "sum-lt" ? a + b < ev.v : a === b) fav++;
          }
      } else if (spec.kind === "draws") {
        const items = Object.entries(spec.counts).flatMap(([c, n]) => Array.from({ length: n }, () => c));
        for (let i = 0; i < items.length; i++)
          for (let j = 0; j < items.length; j++) {
            if (!spec.replace && i === j) continue;
            tot++;
            const ev = spec.event;
            if (ev.kind === "both" ? items[i] === ev.color && items[j] === ev.color : ev.kind === "different" ? items[i] !== items[j] : items[i] === ev.first && items[j] === ev.second) fav++;
          }
      } else throw new Error(`unknown compound kind ${spec.kind}`);
      return fmt(fraction(fav, tot));
    }
    case "exp": {
      const e = fraction(spec.hits, spec.trials);
      if (spec.ask === "exp") return fmt(e);
      return fmt(abs(e.sub(fraction(1, spec.n))));
    }
    case "expected":
      return fmt(R(spec.p).mul(I(spec.N)));
    case "convert":
      return fmt(fraction(spec.pct, 100));
    default:
      throw new Error(`unknown probability type ${spec.type}`);
  }
};

// ---------------------------------------------------------------------------------------------------------------- sampling
SOLVERS.sampling = (spec) => {
  switch (spec.type) {
    case "estimate": {
      const share = spec.ask === "yes" ? fraction(spec.k, spec.n) : fraction(spec.n - spec.k, spec.n);
      return fmt(share.mul(I(spec.N)));
    }
    case "rep":
      return spec.random && spec.whole ? "representative" : "not representative";
    case "mean":
      return fmt(mean(spec.vals));
    case "mad":
      return fmt(mad(spec.vals));
    case "diffcent": {
      const f = spec.stat === "mean" ? mean : med;
      return fmt(f(spec.a).sub(f(spec.b)));
    }
    case "times-mad": {
      const ma = mad(spec.a);
      need(eq(ma, mad(spec.b)), "the two sets must have equal MAD");
      return fmt(mean(spec.a).sub(mean(spec.b)).div(ma));
    }
    default:
      throw new Error(`unknown sampling type ${spec.type}`);
  }
};

// ---------------------------------------------------------------------------------------------------------------- linear equations
const expandSide = (side) => side.reduce((a, t) => ({ m: a.m.add(R(t.k).mul(R(t.m))), c: a.c.add(R(t.k).mul(R(t.c))) }), { m: ZERO, c: ZERO });
/** Canonical text of y = mx + b: ASCII signs, a decimal when it terminates, (n/d)x otherwise. */
const eqString = (m, b) => {
  const t = dtext(m);
  const mp = eq(m, ONE) ? "x" : eq(m, ONE.neg()) ? "-x" : t.includes("/") ? `(${t})x` : `${t}x`;
  const bp = eq(b, ZERO) ? "" : ` ${sign(b) > 0 ? "+" : "-"} ${dtext(abs(b))}`;
  return `y = ${mp}${bp}`;
};
SOLVERS.linear = (spec) => {
  switch (spec.type) {
    case "solve": {
      const l = expandSide(spec.L);
      const r = expandSide(spec.R);
      need(!eq(l.m, r.m), "no unique solution");
      return fmt(r.c.sub(l.c).div(l.m.sub(r.m)));
    }
    case "count": {
      const l = expandSide(spec.L);
      const r = expandSide(spec.R);
      if (!eq(l.m, r.m)) return "one solution";
      return eq(l.c, r.c) ? "infinitely many solutions" : "no solution";
    }
    case "model": {
      const m = R(spec.m);
      const b = R(spec.b);
      if (spec.find === "y") return fmt(m.mul(R(spec.given)).add(b));
      if (spec.find === "x") return fmt(R(spec.given).sub(b).div(m));
      return eqString(m, b);
    }
    default:
      throw new Error(`unknown linear type ${spec.type}`);
  }
};

// ---------------------------------------------------------------------------------------------------------------- systems
SOLVERS.systems = (spec) => {
  const [e1, e2] = spec.eqs.map((e) => ({ a: R(e.a), b: R(e.b), c: R(e.c) }));
  const det = e1.a.mul(e2.b).sub(e2.a.mul(e1.b));
  if (spec.type === "count") {
    if (!eq(det, ZERO)) return "one solution";
    const same = eq(e1.a.mul(e2.c), e2.a.mul(e1.c)) && eq(e1.b.mul(e2.c), e2.b.mul(e1.c));
    return same ? "infinitely many solutions" : "no solution";
  }
  need(!eq(det, ZERO), "the lines do not cross exactly once");
  const x = e1.c.mul(e2.b).sub(e2.c.mul(e1.b)).div(det);
  const y = e1.a.mul(e2.c).sub(e2.a.mul(e1.c)).div(det);
  if (spec.type === "word") return fmt(spec.ask === "x" ? x : y);
  return pairOf(x, y);
};

// ---------------------------------------------------------------------------------------------------------------- functions
/** The line through the first two rows; throws if another row is off it. */
function lineOfRows(rows) {
  const pts = rows.map(([x, y]) => [R(x), R(y)]);
  const [x1, y1] = pts[0];
  const [x2, y2] = pts[1];
  const m = y2.sub(y1).div(x2.sub(x1));
  const b = y1.sub(m.mul(x1));
  need(pts.every(([x, y]) => eq(y, m.mul(x).add(b))), "rows are not on one line");
  return { m, b };
}
SOLVERS.functions = (spec) => {
  switch (spec.type) {
    case "is-function": {
      const seen = new Map();
      for (const [x, y] of spec.pairs) {
        const k = fmt(R(x));
        const v = fmt(R(y));
        if (seen.has(k) && seen.get(k) !== v) return "false";
        seen.set(k, v);
      }
      return "true";
    }
    case "eval": {
      const x = R(spec.x);
      if (spec.form === "lin") return fmt(R(spec.m).mul(x).add(R(spec.b)));
      return fmt(R(spec.a).mul(x).mul(x).add(R(spec.b).mul(x)).add(R(spec.c)));
    }
    case "eval-inv":
      return fmt(R(spec.out).sub(R(spec.b)).div(R(spec.m)));
    case "compare": {
      const A = lineOfRows(spec.A.rows);
      const B = { m: R(spec.B.m), b: R(spec.B.b) };
      const key = spec.ask === "rate" ? "m" : "b";
      need(!eq(A[key], B[key]), "the two functions tie");
      return cmp(A[key], B[key]) > 0 ? spec.names[0] : spec.names[1];
    }
    case "linearity": {
      const pts = spec.rows.map(([x, y]) => [R(x), R(y)]);
      const slopes = pts.slice(1).map(([x, y], i) => y.sub(pts[i][1]).div(x.sub(pts[i][0])));
      return slopes.every((s) => eq(s, slopes[0])) ? "linear" : "non-linear";
    }
    default:
      throw new Error(`unknown functions type ${spec.type}`);
  }
};

// ---------------------------------------------------------------------------------------------------------------- slope
const slopeOf = (p1, p2) => R(p2[1]).sub(R(p1[1])).div(R(p2[0]).sub(R(p1[0])));
SOLVERS.slope = (spec) => {
  switch (spec.type) {
    case "two-points":
      return fmt(slopeOf(spec.p1, spec.p2));
    case "table-rate": {
      const { m } = lineOfRows(spec.rows);
      return fmt(m);
    }
    case "find-b": {
      const m = slopeOf(spec.p1, spec.p2);
      return fmt(R(spec.p1[1]).sub(m.mul(R(spec.p1[0]))));
    }
    case "graph-eq": {
      const m = slopeOf(spec.p1, spec.p2);
      return eqString(m, R(spec.p1[1]).sub(m.mul(R(spec.p1[0]))));
    }
    case "prop-line": {
      const m = slopeOf(spec.p1, spec.p2);
      const b = R(spec.p1[1]).sub(m.mul(R(spec.p1[0])));
      return eq(b, ZERO) ? "proportional" : "not proportional";
    }
    default:
      throw new Error(`unknown slope type ${spec.type}`);
  }
};
