// Independent solvers for the grade 1-2 families. Each reads ONLY `spec` (never the generator or the kit) and returns the canonical answer string.
import { evaluateExpression, Rat } from "../../scripts/lib/rational.mjs";

const R = (x) => Rat.from(x);
const int = (r) => {
  if (r === null || !r.isInt()) throw new Error(`not a whole number: ${r}`);
  return r.toString();
};

export const SOLVERS = {
  count(s) {
    if (s.mode === "show") return String(s.n);
    if (s.mode === "frames") return String(R(s.full).mul(R(10)).add(R(s.extra)));
    if (s.mode === "seq") return String(s.from + s.dir * s.step * s.blank);
    throw new Error(`count: unknown mode ${s.mode}`);
  },

  numrel(s) {
    let v = R(s.n);
    for (const st of s.steps) {
      const m = /^([+-])(\d+)$/.exec(st);
      v = m[1] === "+" ? v.add(R(Number(m[2]))) : v.sub(R(Number(m[2])));
    }
    return int(v);
  },

  addsub(s) {
    if (s.kind === "calc") {
      const sub = s.op === "-";
      if (s.unknown === "result") return int(sub ? R(s.a).sub(R(s.b)) : R(s.a).add(R(s.b)));
      if (s.unknown === "b") return int(sub ? R(s.a).sub(R(s.c)) : R(s.c).sub(R(s.a)));
      if (s.unknown === "a") return int(sub ? R(s.c).add(R(s.b)) : R(s.c).sub(R(s.b)));
    }
    if (s.kind === "story") {
      // a + b = c with exactly one unknown (null)
      const { a, b, c } = s.eq;
      const unknowns = [a, b, c].filter((x) => x === null).length;
      if (unknowns !== 1) throw new Error("story needs exactly one unknown");
      if (c === null) return int(R(a).add(R(b)));
      if (a === null) return int(R(c).sub(R(b)));
      return int(R(c).sub(R(a)));
    }
    if (s.kind === "cmptotal") {
      const other = s.dir === "more" ? R(s.a).add(R(s.d)) : R(s.a).sub(R(s.d));
      return int(R(s.a).add(other));
    }
    if (s.kind === "chain") {
      const signed = s.ops.map((o) => (o.op === "+" ? R(o.n) : R(o.n).neg()));
      const delta = signed.reduce((acc, x) => acc.add(x), R(0));
      return int(s.unknown === "end" ? R(s.start).add(delta) : R(s.end).sub(delta));
    }
    throw new Error(`addsub: unknown kind ${s.kind}`);
  },

  compare(s) {
    const val = (side) => side.parts.reduce((acc, x) => acc.add(R(x)), R(0));
    if (s.mode === "symbol") {
      const l = val(s.left);
      const r = val(s.right);
      const d = l.sub(r);
      return d.n > 0n ? ">" : d.n < 0n ? "<" : "=";
    }
    if (s.mode === "which") {
      const sorted = s.nums.slice().sort((x, y) => x - y);
      return String(s.dir === "greatest" ? sorted[sorted.length - 1] : sorted[0]);
    }
    if (s.mode === "order")
      return s.nums
        .slice()
        .sort((x, y) => x - y)
        .join(",");
    throw new Error(`compare: unknown mode ${s.mode}`);
  },

  equality(s) {
    const side = (str) => {
      // terms separated by " + " or " − "/" - "; "__" is the unknown
      const toks = String(str).trim().split(/\s+/);
      let known = R(0);
      let blankSign = 0;
      let sign = 1;
      for (const t of toks) {
        if (t === "+") sign = 1;
        else if (t === "-" || t === "\u2212") sign = -1;
        else if (t === "__") {
          blankSign = sign;
          sign = 1;
        } else {
          known = sign === 1 ? known.add(R(Number(t))) : known.sub(R(Number(t)));
          sign = 1;
        }
      }
      return { known, blankSign };
    };
    if (s.mode === "missing") {
      const l = side(s.left.join(" "));
      const r = side(s.right.join(" "));
      if ((l.blankSign !== 0) === (r.blankSign !== 0))
        throw new Error("equation needs exactly one blank");
      const [withBlank, other] = l.blankSign !== 0 ? [l, r] : [r, l];
      // withBlank.known + blankSign * x = other.known
      const x = other.known.sub(withBlank.known);
      return int(withBlank.blankSign === 1 ? x : x.neg());
    }
    if (s.mode === "which") {
      const truthy = s.eqs.filter((e) => {
        const [a, b] = e.split(" = ");
        return side(a).known.eq(side(b).known);
      });
      const falsy = s.eqs.filter((e) => !truthy.includes(e));
      const pool = s.want === "true" ? truthy : falsy;
      if (pool.length !== 1)
        throw new Error(`expected exactly one ${s.want} equation, found ${pool.length}`);
      return pool[0];
    }
    throw new Error(`equality: unknown mode ${s.mode}`);
  },

  length(s) {
    if (s.mode === "count" || s.mode === "read") return int(R(s.to).sub(R(s.from)));
    if (s.mode === "compare") {
      const sorted = s.items.slice().sort((a, b) => a.len - b.len);
      if (new Set(s.items.map((i) => i.len)).size !== s.items.length)
        throw new Error("tie in lengths");
      return s.which === "longest" ? sorted[sorted.length - 1].name : sorted[0].name;
    }
    if (s.mode === "diff") return int(R(s.long).sub(R(s.short)));
    if (s.mode === "estimate") {
      // the option closest to the real length
      let best = null;
      let bestD = null;
      for (const o of s.options) {
        const d = Math.abs(o - s.actual);
        if (bestD === null || d < bestD) {
          best = o;
          bestD = d;
        } else if (d === bestD) throw new Error("tie between estimates");
      }
      return String(best);
    }
    if (s.mode === "story") return int(s.op === "+" ? R(s.a).add(R(s.d)) : R(s.a).sub(R(s.d)));
    throw new Error(`length: unknown mode ${s.mode}`);
  },

  clock(s) {
    const pad = (n) => String(n).padStart(2, "0");
    if (s.mode === "read") return `${s.h}:${pad(s.m)}`;
    if (s.mode === "elapsed") return String(s.m2 - s.m1);
    if (s.mode === "shift") {
      // minutes after 12:00, on a 12 hour dial
      const total = ((((s.h % 12) * 60 + s.m + s.delta) % 720) + 720) % 720;
      const hours = Math.floor(total / 60);
      return `${hours === 0 ? 12 : hours}:${pad(total % 60)}`;
    }
    throw new Error(`clock: unknown mode ${s.mode}`);
  },

  shapes(s) {
    if (s.mode === "attr") {
      if (s.curved > 0) return ["circle", "half-circle", "quarter-circle"][s.straight];
      if (s.straight === 4) return s.equal ? "square" : "rectangle";
      return { 3: "triangle", 5: "pentagon", 6: "hexagon" }[s.straight];
    }
    if (s.mode === "count") {
      const sides = { triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6, circle: 0 };
      if (!(s.shape in sides)) throw new Error(`no count for ${s.shape}`);
      return String(sides[s.shape]);
    }
    if (s.mode === "compose") {
      const table = {
        "half-circle*2": "circle",
        "quarter-circle*4": "circle",
        "quarter-circle*2": "half-circle",
        "square*2": "rectangle",
      };
      if (s.pieces.length !== 1) throw new Error("one kind of piece expected");
      return table[`${s.pieces[0].shape}*${s.pieces[0].n}`];
    }
    if (s.mode === "cut") {
      const table = {
        "square|diagonal": "triangle",
        "circle|half": "half-circle",
        "half-circle|half": "quarter-circle",
        "circle|quarters": "quarter-circle",
      };
      return table[`${s.shape}|${s.cut}`];
    }
    throw new Error(`shapes: unknown mode ${s.mode}`);
  },

  maketen(s) {
    if (s.mode === "partner") return int(R(10).sub(R(s.a)));
    if (s.mode === "sum") return int(R(s.a).add(R(s.b)));
    if (s.mode === "three") return int(s.nums.reduce((acc, x) => acc.add(R(x)), R(0)));
    if (s.mode === "rest") return int(R(s.b).sub(R(10).sub(R(s.a))));
    throw new Error(`maketen: unknown mode ${s.mode}`);
  },

  expanded(s) {
    const ONES = [
      "zero",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
      "twelve",
      "thirteen",
      "fourteen",
      "fifteen",
      "sixteen",
      "seventeen",
      "eighteen",
      "nineteen",
    ];
    const TENS = {
      twenty: 20,
      thirty: 30,
      forty: 40,
      fifty: 50,
      sixty: 60,
      seventy: 70,
      eighty: 80,
      ninety: 90,
    };
    const wordsToNum = (text) => {
      let total = 0;
      let current = 0;
      for (const tok of String(text)
        .toLowerCase()
        .split(/[\s-]+/)) {
        if (tok === "hundred") current *= 100;
        else if (tok in TENS) current += TENS[tok];
        else if (ONES.includes(tok)) current += ONES.indexOf(tok);
        else throw new Error(`unknown number word ${tok}`);
      }
      total += current;
      return total;
    };
    const numToWords = (n) => {
      const out = [];
      const h = Math.floor(n / 100);
      const rest = n % 100;
      if (h) out.push(`${ONES[h]} hundred`);
      if (rest >= 20) {
        const tensWord = Object.keys(TENS).find((k) => TENS[k] === rest - (rest % 10));
        out.push(rest % 10 ? `${tensWord}-${ONES[rest % 10]}` : tensWord);
      } else if (rest > 0) out.push(ONES[rest]);
      return out.join(" ");
    };
    if (s.mode === "blocks")
      return int(
        R(s.h)
          .mul(R(100))
          .add(R(s.t).mul(R(10)))
          .add(R(s.o)),
      );
    if (s.mode === "digit") {
      const digits = String(s.n).split("").map(Number);
      const idx = { hundreds: 0, tens: 1, ones: 2 }[s.place];
      const value = { hundreds: 100, tens: 10, ones: 1 }[s.place];
      return int(R(digits[idx]).mul(R(value)));
    }
    if (s.mode === "expanded") {
      const digits = String(s.n).split("").map(Number);
      return [digits[0] * 100, digits[1] * 10, digits[2]].filter((v) => v > 0).join(" + ");
    }
    if (s.mode === "fromexp") return int(s.parts.reduce((acc, x) => acc.add(R(x)), R(0)));
    if (s.mode === "words2num") return String(wordsToNum(s.words));
    if (s.mode === "num2words") return numToWords(s.n);
    if (s.mode === "tens-in") return int(R(s.n).div(R(10)));
    throw new Error(`expanded: unknown mode ${s.mode}`);
  },

  groups(s) {
    if (s.mode === "groups") return int(R(s.groups).mul(R(s.per)));
    if (s.mode === "array-total") return int(R(s.rows).mul(R(s.cols)));
    if (s.mode === "array-div") return int(R(s.total).div(R(s.rows)));
    if (s.mode === "repadd") {
      let acc = R(0);
      for (let i = 0; i < s.times; i++) acc = acc.add(R(s.addend));
      return int(acc);
    }
    if (s.mode === "skip") return String(s.by * s.blank);
    if (s.mode === "groups-extra") {
      const base = R(s.groups).mul(R(s.per));
      return int(s.op === "+" ? base.add(R(s.extra)) : base.sub(R(s.extra)));
    }
    throw new Error(`groups: unknown mode ${s.mode}`);
  },

  money(s) {
    // coin values in cents; money answers are cents ("85") under a dollar and dollars ("1.35") from a dollar up
    const VALUE = { b: 100, q: 25, d: 10, n: 5, p: 1 };
    const fmtCents = (cents) => (cents < 100 ? String(cents) : (cents / 100).toFixed(2));
    const worth = (coins) =>
      Object.entries(coins).reduce((acc, [k, n]) => acc.add(R(VALUE[k]).mul(R(n))), R(0));
    if (s.mode === "count") return fmtCents(Number(worth(s.coins).toString()));
    if (s.mode === "need") return fmtCents(Number(R(s.cost).sub(R(s.have)).toString()));
    if (s.mode === "change") return fmtCents(Number(R(s.paid).sub(R(s.cost)).toString()));
    if (s.mode === "make") {
      const names = {
        b: ["dollar bill", "dollar bills"],
        q: ["quarter", "quarters"],
        d: ["dime", "dimes"],
        n: ["nickel", "nickels"],
        p: ["penny", "pennies"],
      };
      const hits = s.options.filter((o) => worth(o).eq(R(s.target)));
      if (hits.length !== 1)
        throw new Error(`expected one matching coin set, found ${hits.length}`);
      return ["b", "q", "d", "n", "p"]
        .filter((k) => hits[0][k] > 0)
        .map((k) => `${hits[0][k]} ${hits[0][k] === 1 ? names[k][0] : names[k][1]}`)
        .join(", ");
    }
    throw new Error(`money: unknown mode ${s.mode}`);
  },

  bargraph(s) {
    const at = (cat) => {
      const i = s.cats.indexOf(cat);
      if (i < 0 || s.cats.indexOf(cat, i + 1) >= 0)
        throw new Error(`category ${cat} not found exactly once`);
      return R(s.values[i]);
    };
    if (s.mode === "howmany") return int(at(s.cat));
    if (s.mode === "diff") return int(at(s.a).sub(at(s.b)));
    if (s.mode === "total") return int(s.values.reduce((acc, v) => acc.add(R(v)), R(0)));
    if (s.mode === "pair") return int(at(s.a).add(at(s.b)));
    if (s.mode === "diff2")
      return int(
        at(s.bigPair[0])
          .add(at(s.bigPair[1]))
          .sub(at(s.smallPair[0]).add(at(s.smallPair[1]))),
      );
    if (s.mode === "most" || s.mode === "least") {
      const target = s.mode === "most" ? Math.max(...s.values) : Math.min(...s.values);
      const hits = s.cats.filter((_, i) => s.values[i] === target);
      if (hits.length !== 1) throw new Error("no unique extreme");
      return hits[0];
    }
    throw new Error(`bargraph: unknown mode ${s.mode}`);
  },

  partition(s) {
    const NAME = { 2: "one half", 3: "one third", 4: "one fourth" };
    if (s.mode === "count" || s.mode === "whole-as") return String(s.parts);
    if (s.mode === "name") return NAME[s.parts];
    if (s.mode === "left") return int(R(s.parts).sub(R(s.eaten)));
    if (s.mode === "whichcut") {
      const hits = s.options.filter((o) => o.equal && o.parts === s.target);
      if (hits.length !== 1) throw new Error(`expected exactly one cut, found ${hits.length}`);
      return hits[0].desc;
    }
    throw new Error(`partition: unknown mode ${s.mode}`);
  },

  tensones(s) {
    if (s.mode === "total") return int(R(s.tens).mul(R(10)).add(R(s.ones)));
    if (s.mode === "tens-of") return String(Math.floor(s.n / 10));
    if (s.mode === "ones-of") return String(s.n % 10);
    if (s.mode === "regroup") return int(R(s.n).sub(R(s.tens).mul(R(10))));
    throw new Error(`tensones: unknown mode ${s.mode}`);
  },
};
