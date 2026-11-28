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
      if (s.op === "mul")
        return S(s.unknown === "c" ? a.mul(b) : s.unknown === "a" ? c.div(b) : c.div(a));
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
      if (
        m &&
        R(m[1])
          .mul(R(m[2]))
          .eq(R(m[3]).mul(R(m[4]))) &&
        m[1] === m[4] &&
        m[2] === m[3]
      )
        return "commutative property";
      m = /^\((\d+) × (\d+)\) × (\d+) = (\d+) × \((\d+) × (\d+)\)$/.exec(s.eq);
      if (m && m[1] === m[4] && m[2] === m[5] && m[3] === m[6]) return "associative property";
      m = /^(\d+) × \((\d+) \+ (\d+)\) = (\d+) × (\d+) \+ (\d+) × (\d+)$/.exec(s.eq);
      if (m && m[1] === m[4] && m[1] === m[6] && m[2] === m[5] && m[3] === m[7])
        return "distributive property";
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
      const value = (st) =>
        R(st.k)
          .mul(sum(st.terms.map((term) => prod(term.map((v) => R(v))))))
          .add(R(st.add));
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
        const better =
          s.pick === "max"
            ? lt(R(best[0], best[1]), R(f[0], f[1]))
            : lt(R(f[0], f[1]), R(best[0], best[1]));
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
    if (s.type === "missing")
      return S(
        s.kind === "area" ? R(s.total).div(R(s.known)) : R(s.total).div(R(2)).sub(R(s.known)),
      );
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
      return S(
        s.op === "add"
          ? a.add(b)
          : s.op === "sub"
            ? a.sub(b)
            : s.op === "mul"
              ? a.mul(b)
              : a.div(b),
      );
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
    if (s.type === "contrast")
      return S(
        R(s.s)
          .mul(R(s.k))
          .sub(R(s.s).add(R(s.n))),
      );
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
      const test = {
        factor: (x) => s.n % x === 0,
        multiple: (x) => x % s.n === 0,
        prime,
        composite: (x) => x > 1 && !prime(x),
      }[s.prop];
      const hits = s.options.filter(test);
      if (hits.length !== 1) throw new Error(`${hits.length} options satisfy ${s.prop}`);
      return String(hits[0]);
    }
    throw new Error("unknown factors spec");
  },

  // ------------------------------------------------------------------------------------------------ fracequiv
  fracequiv(s) {
    if (s.type === "eqm")
      return s.x == null ? S(R(s.n).mul(R(s.y)).div(R(s.d))) : S(R(s.d).mul(R(s.x)).div(R(s.n)));
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
        const better =
          s.pick === "max"
            ? lt(R(best[0], best[1]), R(f[0], f[1]))
            : lt(R(f[0], f[1]), R(best[0], best[1]));
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

const UN = {
  km: ["len", 1000000],
  m: ["len", 1000],
  cm: ["len", 10],
  mm: ["len", 1],
  in: ["clen", 1],
  ft: ["clen", 12],
  yd: ["clen", 36],
  g: ["mass", 1],
  kg: ["mass", 1000],
  oz: ["cmass", 1],
  lb: ["cmass", 16],
  mL: ["cap", 1],
  L: ["cap", 1000],
  c: ["ccap", 1],
  pt: ["ccap", 2],
  qt: ["ccap", 4],
  gal: ["ccap", 16],
  s: ["time", 1],
  min: ["time", 60],
  hr: ["time", 3600],
};
const unitRatio = (from, to) => {
  const [fa, fs] = UN[from];
  const [ta, ts] = UN[to];
  if (fa !== ta) throw new Error(`units ${from} and ${to} are not in one system`);
  return R(fs).div(R(ts));
};
const floorDiv = (n, d) => (n >= 0n ? n / d : -((-n + d - 1n) / d));
const roundHalfUp = (x) => {
  const t = x.add(R(1, 2));
  return R(floorDiv(t.n, t.d));
};

const SC = {
  // ------------------------------------------------------------------------------------------------ fracops
  fracops(s) {
    if (s.type === "calc") {
      const X = R(s.x[0], s.x[1]);
      const Y = R(s.y[0], s.y[1]);
      return S(
        s.op === "add"
          ? X.add(Y)
          : s.op === "sub"
            ? X.sub(Y)
            : s.op === "mul"
              ? X.mul(Y)
              : X.div(Y),
      );
    }
    if (s.type === "scalecmp") {
      const diff = R(s.m[0], s.m[1]).sub(R(1));
      const rel = diff.n > 0n ? "greater than" : diff.n < 0n ? "less than" : "equal to";
      return `${rel} ${s.baseText}`;
    }
    if (s.type === "ratio") return S(R(s.to, s.from));
    if (s.type === "scale2") {
      const [a, b] = [P(s.m1), P(s.m2)];
      const first = s.pick === "greater" ? lt(b, a) : lt(a, b);
      return `${s.base} × ${first ? s.m1 : s.m2}`;
    }
    throw new Error("unknown fracops spec");
  },

  // ------------------------------------------------------------------------------------------------ decimals
  decimals(s) {
    const placeIndex = { tenths: 1, hundredths: 2, thousandths: 3 };
    if (s.type === "placename") return s.x.split(".")[1][placeIndex[s.place] - 1];
    if (s.type === "placevalue") {
      const [whole, frac] = s.x.split(".");
      if (s.digitPlace === "tens") return S(R(whole[whole.length - 2]).mul(R(10)));
      if (s.digitPlace === "ones") return whole[whole.length - 1];
      const k = placeIndex[s.digitPlace];
      return S(R(frac[k - 1]).div(R(10n ** BigInt(k))));
    }
    if (s.type === "cmp") {
      let best = s.vals[0];
      for (const v of s.vals)
        if (s.pick === "max" ? lt(P(best), P(v)) : lt(P(v), P(best))) best = v;
      return best;
    }
    if (s.type === "round") {
      const k = { ones: 0, tenths: 1, hundredths: 2 }[s.place];
      const scale = R(10n ** BigInt(k));
      return S(roundHalfUp(P(s.x).mul(scale)).div(scale));
    }
    if (s.type === "f2d") return S(R(s.n, s.d));
    if (s.type === "d2f") return `${S(P(s.x).mul(R(s.d)))}/${s.d}`;
    if (s.type === "fsum") return S(R(s.n1, s.d1).add(R(s.n2, s.d2)));
    if (s.type === "op") {
      const [x, y] = [P(s.x), P(s.y)];
      return S(
        s.op === "add"
          ? x.add(y)
          : s.op === "sub"
            ? x.sub(y)
            : s.op === "mul"
              ? x.mul(y)
              : x.div(y),
      );
    }
    if (s.type === "scale10") {
      const m = R(10n ** BigInt(s.p));
      return S(s.dir === "mul" ? P(s.x).mul(m) : P(s.x).div(m));
    }
    throw new Error("unknown decimals spec");
  },

  // ------------------------------------------------------------------------------------------------ convert
  convert(s) {
    if (s.type === "conv") return S(P(s.x).mul(unitRatio(s.from, s.to)));
    if (s.type === "mixed") return S(R(s.a).mul(unitRatio(s.big, s.small)).add(R(s.b)));
    throw new Error("unknown convert spec");
  },

  // ------------------------------------------------------------------------------------------------ angles
  angles(s) {
    if (s.type === "classify")
      return s.deg < 90 ? "acute" : s.deg === 90 ? "right" : s.deg < 180 ? "obtuse" : "straight";
    if (s.type === "measure") return String(s.deg);
    if (s.type === "line") return S(R(180).sub(R(s.a)));
    if (s.type === "around") return S(R(360).sub(sum(s.known.map((v) => R(v)))));
    if (s.type === "adjacent")
      return S(s.find === "whole" ? R(s.p1).add(R(s.p2)) : R(s.whole).sub(R(s.p1)));
    if (s.type === "circfrac") return S(R(360).mul(R(s.n, s.d)));
    throw new Error("unknown angles spec");
  },

  // ------------------------------------------------------------------------------------------------ lineplot
  lineplot(s) {
    const vals = s.values.map(P);
    const distinct = [];
    for (const v of vals) if (!distinct.some((d) => d.eq(v))) distinct.push(v);
    const count = (t) => vals.filter((v) => v.eq(t)).length;
    if (s.type === "howmany") return String(count(P(s.t)));
    if (s.type === "more") return String(vals.filter((v) => lt(P(s.t), v)).length);
    if (s.type === "diffcount") return String(count(P(s.t)) - count(P(s.t2)));
    if (s.type === "most") {
      const top = Math.max(...distinct.map(count));
      const hits = distinct.filter((d) => count(d) === top);
      if (hits.length !== 1) throw new Error("the most common value is not unique");
      return S(hits[0]);
    }
    const lo = vals.reduce((m, v) => (lt(v, m) ? v : m), vals[0]);
    const hi = vals.reduce((m, v) => (lt(m, v) ? v : m), vals[0]);
    if (s.type === "range") return S(hi.sub(lo));
    if (s.type === "total") return S(sum(vals));
    if (s.type === "mean") return S(sum(vals).div(R(vals.length)));
    throw new Error("unknown lineplot spec");
  },
};

export const SOLVERS = { ...SA, ...SB, ...SC };
