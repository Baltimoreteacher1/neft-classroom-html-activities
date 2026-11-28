// Independent solvers for the grade 3-4 problem families (and the fraction, decimal, measurement and line-plot families that
// grades 5-6 reuse). Each solver reads ONLY `spec`, never imports a generator or the kit, and uses exact rational arithmetic.
// A solver returns the canonical answer string: an integer, "n/d", a decimal literal, or the exact text for text/set answers.
import { Rat } from "../../scripts/lib/rational.mjs";

const R = (n, d = 1) => new Rat(BigInt(n), BigInt(d));
/** "3", "-2", "3/4", "1.25" (exact decimal) or "7/12" -> Rat. */
const P = (x) => {
  const t = String(x).trim();
  const m = /^(-?\d+)\/(\d+)$/.exec(t);
  if (m) return new Rat(BigInt(m[1]), BigInt(m[2]));
  const r = Rat.fromDecimal(t);
  if (!r) throw new Error(`cannot parse ${x}`);
  return r;
};
const S = (r) => r.toString();
const sum = (xs) => xs.reduce((t, x) => t.add(x), R(0));
const prod = (xs) => xs.reduce((t, x) => t.mul(x), R(1));
const lt = (a, b) => a.sub(b).n < 0n;
/** Exact quotient and remainder of non-negative integers. */
const divmod = (a, b) => {
  const A = BigInt(a);
  const B = BigInt(b);
  return [A / B, A % B];
};

const SA = {
  // ------------------------------------------------------------------------------------------------ muldiv
  muldiv(s) {
    if (s.type === "eq") {
      const [a, b, c] = [s.a, s.b, s.c].map((v) => (v == null ? null : R(v)));
      if (s.op === "mul") return S(s.unknown === "c" ? a.mul(b) : s.unknown === "a" ? c.div(b) : c.div(a));
      return S(s.unknown === "c" ? a.div(b) : s.unknown === "a" ? c.mul(b) : a.div(c));
    }
    if (s.type === "groups") {
      const [g, e, t] = [s.g, s.e, s.t].map((v) => (v == null ? null : R(v)));
      return S(s.unknown === "t" ? g.mul(e) : s.unknown === "e" ? t.div(g) : t.div(e));
    }
    if (s.type === "two") {
      const [a, b, c] = [R(s.a), R(s.b), R(s.c)];
      if (s.shape === "mul-add") return S(a.mul(b).add(c));
      if (s.shape === "mul-sub") return S(a.mul(b).sub(c));
      if (s.shape === "add-div") return S(a.add(b).div(c));
      if (s.shape === "sub-div") return S(a.sub(b).div(c));
    }
    if (s.type === "fam") {
      const [x, y, z] = [R(s.x), R(s.y), R(s.z)];
      if (s.find === "z÷x") return S(z.div(x));
      if (s.find === "z÷y") return S(z.div(y));
      if (s.find === "x×y") return S(x.mul(y));
    }
    throw new Error("unknown muldiv spec");
  },

  // ------------------------------------------------------------------------------------------------ properties
  properties(s) {
    if (s.type === "name") {
      let m = /^(\d+) × (\d+) = (\d+) × (\d+)$/.exec(s.eq);
      if (m && R(m[1]).mul(R(m[2])).eq(R(m[3]).mul(R(m[4]))) && m[1] === m[4] && m[2] === m[3]) return "commutative property";
      m = /^\((\d+) × (\d+)\) × (\d+) = (\d+) × \((\d+) × (\d+)\)$/.exec(s.eq);
      if (m && m[1] === m[4] && m[2] === m[5] && m[3] === m[6]) return "associative property";
      m = /^(\d+) × \((\d+) \+ (\d+)\) = (\d+) × (\d+) \+ (\d+) × (\d+)$/.exec(s.eq);
      if (m && m[1] === m[4] && m[1] === m[6] && m[2] === m[5] && m[3] === m[7]) return "distributive property";
      if (/^\d+ × 1 = \d+$/.test(s.eq)) return "identity property";
      throw new Error(`unrecognised property equation ${s.eq}`);
    }
    if (s.type === "commute") return S(s.form === "?×a" ? R(s.b) : R(s.a));
    if (s.type === "assoc") {
      if (s.form === "both") return S(prod([R(s.a), R(s.b), R(s.c)]));
      return S(s.form === "a×(b×?)" ? R(s.c) : R(s.a));
    }
    if (s.type === "product3") return S(prod([R(s.a), R(s.b), R(s.c)]));
    if (s.type === "dmiss") return S(s.side === "b" ? R(s.b - s.s) : R(s.a - s.s));
    if (s.type === "dprod") return S(R(s.a).mul(R(s.b1).add(R(s.b2))));
    if (s.type === "tens") return S(R(s.a).mul(R(s.t)).mul(R(10)));
    if (s.type === "compare") {
      const target = R(s.a).mul(R(s.b));
      const value = (st) => R(st.k).mul(sum(st.terms.map((term) => prod(term.map((v) => R(v)))))).add(R(st.add));
      const ok = s.strategies.map((st) => value(st).eq(target));
      if (ok[0] && ok[1]) return "Both strategies work";
      if (ok[0]) return `Only ${s.names[0]}'s strategy works`;
      if (ok[1]) return `Only ${s.names[1]}'s strategy works`;
      return "Neither strategy works";
    }
    throw new Error("unknown properties spec");
  },

  // ------------------------------------------------------------------------------------------------ fracid
  fracid(s) {
    if (s.type === "shaded") return S(R(s.n, s.d));
    if (s.type === "unit") return S(R(1, s.d));
    if (s.type === "meaning") return String(s.ask === "den" ? s.d : s.n);
    if (s.type === "count") return S(R(s.n, s.d).div(R(1, s.d)));
    if (s.type === "whole") return `${s.d}/${s.d}`;
    if (s.type === "build") return `${s.d} parts, ${s.n} shaded`;
    throw new Error("unknown fracid spec");
  },

  // ------------------------------------------------------------------------------------------------ fracline
  fracline(s) {
    if (s.type === "locate") return S(R(s.n, s.d));
    if (s.type === "cmp") {
      let best = s.fracs[0];
      for (const f of s.fracs) {
        const better = s.pick === "max" ? lt(R(best[0], best[1]), R(f[0], f[1])) : lt(R(f[0], f[1]), R(best[0], best[1]));
        if (better) best = f;
      }
      return `${best[0]}/${best[1]}`;
    }
    if (s.type === "wholefrac") return `${R(s.w).mul(R(s.d))}/${s.d}`;
    if (s.type === "jumps") return S(R(s.n, s.d).div(R(1, s.d)));
    throw new Error("unknown fracline spec");
  },

  // ------------------------------------------------------------------------------------------------ areaperim
  areaperim(s) {
    if (s.type === "area") return S(R(s.w).mul(R(s.h)));
    if (s.type === "perim") return S(R(2).mul(R(s.w).add(R(s.h))));
    if (s.type === "missing") return S(s.kind === "area" ? R(s.total).div(R(s.known)) : R(s.total).div(R(2)).sub(R(s.known)));
    if (s.type === "samearea") {
      const area = R(s.w1).mul(R(s.h1));
      const h2 = area.div(R(s.w2));
      return S(R(2).mul(R(s.w2).add(h2)));
    }
    if (s.type === "composite") return S(sum(s.rects.map(([w, h]) => R(w).mul(R(h)))));
    throw new Error("unknown areaperim spec");
  },

  // ------------------------------------------------------------------------------------------------ elapsed
  elapsed(s) {
    if (s.type === "meas") {
      const [a, b] = [R(s.a), R(s.b)];
      return S(s.op === "add" ? a.add(b) : s.op === "sub" ? a.sub(b) : s.op === "mul" ? a.mul(b) : a.div(b));
    }
    if (s.type === "time") {
      const minutes = ([h, m]) => (h % 12) * 60 + m;
      const text = (t) => {
        const x = ((t % 720) + 720) % 720;
        return `${Math.floor(x / 60) || 12}:${String(x % 60).padStart(2, "0")}`;
      };
      if (s.find === "end") return text(minutes(s.start) + s.mins);
      if (s.find === "start") return text(minutes(s.end) - s.mins);
      return String((((minutes(s.end) - minutes(s.start)) % 720) + 720) % 720);
    }
    throw new Error("unknown elapsed spec");
  },
};


const SB = {
  // ------------------------------------------------------------------------------------------------ multidigit
  multidigit(s) {
    const [a, b] = [R(s.a), R(s.b)];
    if (s.type === "add") return S(a.add(b));
    if (s.type === "sub") return S(a.sub(b));
    if (s.type === "mul") return S(a.mul(b));
    if (s.type === "div") {
      const [q, r] = divmod(s.a, s.b);
      return r === 0n ? String(q) : `${q} r ${r}`;
    }
    throw new Error("unknown multidigit spec");
  },

  // ------------------------------------------------------------------------------------------------ multcompare
  multcompare(s) {
    if (s.type === "big") return S(R(s.s).mul(R(s.k)));
    if (s.type === "small") return S(R(s.b).div(R(s.k)));
    if (s.type === "factor") return S(R(s.b).div(R(s.s)));
    if (s.type === "more") return S(R(s.s).add(R(s.n)));
    if (s.type === "eq") return `${s.k} × ${s.s} = ${R(s.s).mul(R(s.k))}`;
    if (s.type === "contrast") return S(R(s.s).mul(R(s.k)).sub(R(s.s).add(R(s.n))));
    throw new Error("unknown multcompare spec");
  },

  // ------------------------------------------------------------------------------------------------ factors
  factors(s) {
    const divs = (n) => {
      const out = [];
      for (let i = 1; i <= n; i++) if (n % i === 0) out.push(i);
      return out;
    };
    const prime = (n) => n > 1 && divs(n).length === 2;
    if (s.type === "pairs") return String(Math.ceil(divs(s.n).length / 2));
    if (s.type === "allfactors") return divs(s.n).join(",");
    if (s.type === "nextmult") return String((Math.floor(s.above / s.k) + 1) * s.k);
    if (s.type === "countmult") return String(Math.floor(s.upto / s.k));
    if (s.type === "pick") {
      const test = { factor: (x) => s.n % x === 0, multiple: (x) => x % s.n === 0, prime, composite: (x) => x > 1 && !prime(x) }[s.prop];
      const hits = s.options.filter(test);
      if (hits.length !== 1) throw new Error(`${hits.length} options satisfy ${s.prop}`);
      return String(hits[0]);
    }
    throw new Error("unknown factors spec");
  },

  // ------------------------------------------------------------------------------------------------ fracequiv
  fracequiv(s) {
    if (s.type === "eqm") return s.x == null ? S(R(s.n).mul(R(s.y)).div(R(s.d))) : S(R(s.d).mul(R(s.x)).div(R(s.n)));
    if (s.type === "eqw") {
      const x = R(s.n).mul(R(s.D)).div(R(s.d));
      if (x.d !== 1n) throw new Error("equivalent fraction is not whole-numbered");
      return `${x}/${s.D}`;
    }
    if (s.type === "equivpick") {
      const target = R(s.n, s.d);
      const hits = s.opts.filter(([a, b]) => R(a, b).eq(target));
      if (hits.length !== 1) throw new Error(`${hits.length} equivalent options`);
      return `${hits[0][0]}/${hits[0][1]}`;
    }
    if (s.type === "cmp") {
      let best = s.fracs[0];
      for (const f of s.fracs) {
        const better = s.pick === "max" ? lt(R(best[0], best[1]), R(f[0], f[1])) : lt(R(f[0], f[1]), R(best[0], best[1]));
        if (better) best = f;
      }
      return `${best[0]}/${best[1]}`;
    }
    if (s.type === "bench") {
      const diff = R(s.n, s.d).sub(R(1, 2));
      return diff.n > 0n ? "greater than 1/2" : diff.n < 0n ? "less than 1/2" : "equal to 1/2";
    }
    throw new Error("unknown fracequiv spec");
  },
};

export const SOLVERS = { ...SA, ...SB };
