// K–5 authored explanations: every skill in Grades K–5 is authored, bilingual, numerically true, and its misconception
// detectors fire on the slip they name and never on a right answer. Nothing here trusts the authored module's own
// arithmetic: wrong answers and transfer answers are recomputed from the question text by independent code below.
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { GRADES, generateProblem, seededRandom, validateAnswer } from "../../problem-bank.js";
import { hasBuild, lessonFor } from "../../studio/engines.js";
import { adaptiveProblem } from "../../tutor-engine.js";
import { revealsAnswer } from "../content.js";
import { AUTHORED } from "./index.js";

const failures = [];
const fail = (msg) => failures.push(msg);
const N = (s) => (String(s).replaceAll("−", "-").replace(/(\d),(?=\d{3}\b)/g, "$1").match(/\d+(?:\.\d+)?/g) || []).map(Number);
const Q = (item) => String(item.question).replaceAll("−", "-").replace(/(\d),(?=\d{3}\b)/g, "$1");
const TEXT_FIELDS = ["title", "concept", "misconception"];

// --- Independent wrong-answer producers: "grade:skill:detectorId" → (item) => wrong answer string | null -----------------
const op = (item) => {
  const m = Q(item).match(/^\s*(\d+(?:\.\d+)?)\s*([+\-×÷])\s*(\d+(?:\.\d+)?)\s*=\s*\?/);
  return m ? { a: Number(m[1]), o: m[2], b: Number(m[3]) } : null;
};
const ans = (item) => String(item.answers[0]);
const col = (x, y, f) => {
  const a = [...String(x)].reverse().map(Number);
  const b = [...String(y)].reverse().map(Number);
  let out = 0;
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) out += f(a[i] || 0, b[i] || 0) * 10 ** i;
  return out;
};
const sym = (a, b) => (a < b ? "<" : a > b ? ">" : "=");
const flipSym = (s) => ({ "<": ">", ">": "<" })[s] || null;
const timeQ = (item) => Q(item).match(/(\d+) minutes after (\d+):(\d+)/)?.slice(1).map(Number);
const placeQ = (item) => {
  const m = Q(item).match(/in the ([a-z-]+) place of (\d+)\?/);
  const p = m && { ones: 1, tens: 10, hundreds: 100, thousands: 1000, "ten-thousands": 1e4, "hundred-thousands": 1e5 }[m[1]];
  return p ? { n: Number(m[2]), p, value: /value of/.test(Q(item)) } : null;
};
const dig = (n, p) => Math.floor(n / p) % 10;
const scale = (x, p) => Math.round(x * 10 ** p);
const dp = (x) => (String(x).split(".")[1] || "").length;
const frac2 = (item) => Q(item).match(/^(\d+)\/(\d+)\s*([+\-×])\s*(\d+)\/(\d+)/)?.slice(1);
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const fstr = (n, d) => {
  const g = gcd(Math.abs(n), d);
  return `${n / g}/${d / g}`;
};
const add = {
  "counted-start": (i) => (op(i)?.o === "+" && op(i).b > 0 ? String(op(i).a + op(i).b - 1) : null),
  "ones-only": (i) => (op(i)?.o === "+" && op(i).a + op(i).b > 10 ? String((op(i).a + op(i).b) % 10) : null),
  subtracted: (i) => (op(i)?.o === "+" && op(i).a > op(i).b ? String(op(i).a - op(i).b) : null),
};
const sub = {
  added: (i) => (op(i)?.o === "-" ? String(op(i).a + op(i).b) : null),
  "smaller-from-larger": (i) => {
    const p = op(i);
    return p?.o === "-" && p.a >= 10 && p.a < 20 && p.b < 10 && p.a % 10 < p.b ? String(10 + p.b - (p.a % 10)) : null;
  },
  "counted-start": (i) => (op(i)?.o === "-" && op(i).b > 0 ? String(op(i).a - op(i).b + 1) : null),
};
const place = {
  "digit-for-value": (i) => (placeQ(i)?.value ? String(dig(placeQ(i).n, placeQ(i).p)) : null),
  "value-for-digit": (i) => (placeQ(i) && !placeQ(i).value ? String(dig(placeQ(i).n, placeQ(i).p) * placeQ(i).p) : null),
  "wrong-place": (i) => {
    const p = placeQ(i);
    if (!p) return null;
    const nb = p.p * 10 <= p.n ? p.p * 10 : p.p / 10;
    return nb >= 1 && dig(p.n, nb) !== dig(p.n, p.p) ? String(p.value ? dig(p.n, nb) * nb : dig(p.n, nb)) : null;
  },
};
const compare = {
  reversed: (i) => flipSym(ans(i)),
  "said-equal": (i) => (ans(i) !== "=" ? "=" : null),
};
const time = {
  "minutes-over-60": (i) => (timeQ(i) ? `${timeQ(i)[1]}:${timeQ(i)[2] + timeQ(i)[0]}` : null),
  "hour-stuck": (i) => (timeQ(i) ? `${timeQ(i)[1]}:${String((timeQ(i)[2] + timeQ(i)[0]) % 60).padStart(2, "0")}` : null),
};
const offByOne = { "counted-twice": (i) => String(Number(ans(i)) + 1), "skipped-one": (i) => String(Number(ans(i)) - 1) };
const missingPart = {
  "added-both": (i) => (/□/.test(Q(i)) ? String(N(Q(i))[0] + N(Q(i))[1]) : null),
  "wrote-total": (i) => (/□/.test(Q(i)) ? String(N(Q(i))[1]) : null),
};
const make10 = { added: (i) => String(N(Q(i))[0] + 10), "wrote-total": () => "10" };
const roundQ = (i) => {
  const m = Q(i).match(/Round (\d+) to the nearest (ten|hundred|thousand)/);
  return m && { n: Number(m[1]), to: { ten: 10, hundred: 100, thousand: 1000 }[m[2]] };
};
const rounding = {
  "wrong-direction": (i) => {
    const r = roundQ(i);
    if (!r || r.n % r.to === 0) return null;
    const down = Math.floor(r.n / r.to) * r.to;
    return String(Number(ans(i)) === down ? down + r.to : down);
  },
  "wrong-place": (i) => {
    const r = roundQ(i);
    return r ? String(Math.round(r.n / (r.to * 10)) * r.to * 10) : null;
  },
};
const equivQ = (i) => Q(i).match(/^(\d+)\/(\d+)\s*=\s*(\d+|□)\/(\d+|□)$/)?.slice(1);
const equiv = {
  additive: (i) => {
    const m = equivQ(i);
    if (!m) return null;
    const [a, b] = [Number(m[0]), Number(m[1])];
    return m[2] === "□" ? String(a + Number(m[3]) - b) : String(b + Number(m[2]) - a);
  },
  factor: (i) => {
    const m = equivQ(i);
    if (!m) return null;
    const f = m[2] === "□" ? Number(m[3]) / Number(m[1]) : Number(m[2]) / Number(m[0]);
    return Number.isInteger(f) && f > 1 ? String(f) : null;
  },
};
const fcompare = {
  "bigger-denominator": (i) => {
    const m = Q(i).match(/^(\d+)\/(\d+) ___ (\d+)\/(\d+)$/)?.slice(1).map(Number);
    return m && m[1] !== m[3] ? sym(m[1], m[3]) : null;
  },
  "numerators-only": (i) => {
    const m = Q(i).match(/^(\d+)\/(\d+) ___ (\d+)\/(\d+)$/)?.slice(1).map(Number);
    return m && m[1] !== m[3] ? sym(m[0], m[2]) : null;
  },
};
const mulBasic = {
  added: (i) => (op(i)?.o === "×" && op(i).a > 1 && op(i).b > 1 ? String(op(i).a + op(i).b) : null),
  "one-group-off": (i) => (op(i)?.o === "×" && op(i).a > 0 && op(i).b > 0 ? String(op(i).a * op(i).b + op(i).b) : null),
};
const remainderQ = (i) => {
  const m = Q(i).match(/^(\d+) ÷ (\d+) has a remainder/);
  return m && { a: Number(m[1]), b: Number(m[2]) };
};
const remainder = {
  "gave-remainder": (i) => (remainderQ(i) ? String(remainderQ(i).a % remainderQ(i).b) : null),
  "rounded-up": (i) => (remainderQ(i) ? String(Math.floor(remainderQ(i).a / remainderQ(i).b) + 1) : null),
};
const factorCount = (n) => [...Array(n).keys()].filter((k) => n % (k + 1) === 0).length;
const shapeN = { triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6, octagon: 8 };
const decQ = (i, o) => {
  const p = op(i);
  return p?.o === o ? p : null;
};
const decRight = (i, o) => {
  const p = decQ(i, o);
  if (!p || dp(p.a) === dp(p.b)) return null;
  const P = Math.max(dp(p.a), dp(p.b));
  const v = o === "+" ? scale(p.a, dp(p.a)) + scale(p.b, dp(p.b)) : scale(p.a, dp(p.a)) - scale(p.b, dp(p.b));
  return String(v / 10 ** P);
};
const evalLR = (e) => {
  // strictly left to right, parentheses respected
  const t = e.replaceAll("−", "-").match(/\d+|[()+\-×]/g);
  let k = 0;
  const atom = () => (t[k] === "(" ? (k++, (() => { const v = seq(); k++; return v; })()) : Number(t[k++]));
  const seq = () => {
    let v = atom();
    while (k < t.length && t[k] !== ")") {
      const o = t[k++];
      const w = atom();
      v = o === "+" ? v + w : o === "-" ? v - w : v * w;
    }
    return v;
  };
  return seq();
};
const evalStd = (e) => Function(`return (${e.replaceAll("−", "-").replaceAll("×", "*")})`)();

const PRODUCERS = {
  "0:count-forward": { "repeat-last": (i) => String(N(Q(i)).at(-1)), "count-back": (i) => String(N(Q(i)).at(-1) - 1) },
  "0:count-cardinality": offByOne,
  "0:subitize": offByOne,
  "0:compare-20": compare,
  "0:compose-10": make10,
  "0:add-sub-5": {
    "counted-start": (i) => (op(i) && op(i).b > 0 ? String(op(i).o === "+" ? op(i).a + op(i).b - 1 : op(i).a - op(i).b + 1) : null),
    "wrong-sign": (i) => (op(i)?.o === "-" && op(i).b > 0 ? String(op(i).a + op(i).b) : null),
  },
  "0:story-add-sub-10": missingPart,
  "0:patterns": {
    "repeat-last": (i) => ({ "●": "circle", "▲": "triangle", "■": "square" })[Q(i).match(/[●▲■]/g).at(-1)],
    "went-backward": (i) => ({ "●": "circle", "▲": "triangle", "■": "square" })[Q(i).match(/[●▲■]/g).at(-2)],
  },
  "0:hidden-parts": { showing: (i) => String(N(Q(i))[1]), total: (i) => String(N(Q(i))[0]), added: (i) => String(N(Q(i))[0] + N(Q(i))[1]) },
  "1:count-patterns": {
    "by-ones": (i) => (N(Q(i)).at(-1) - N(Q(i)).at(-2) !== 1 ? String(N(Q(i)).at(-1) + 1) : null),
    "repeat-last": (i) => String(N(Q(i)).at(-1)),
  },
  "1:tens-ones": place,
  "1:compare-100": compare,
  "1:add-10": add,
  "1:subtract-10": sub,
  "1:make-10": make10,
  "1:add-20": add,
  "1:missing-addend": missingPart,
  "1:subtract-20": sub,
  "1:time": time,
  "1:measure-length": {
    "read-end": (i) => (N(Q(i))[0] > 0 ? String(N(Q(i))[1]) : null),
    "counted-marks": (i) => String(N(Q(i))[1] - N(Q(i))[0] + 1),
  },
  "1:shapes-2d3d": {
    "visible-only": (i) => {
      const m = Q(i).match(/How many (corners|edges|flat faces) does an? (cube|rectangular prism)/);
      return m ? String({ corners: 7, edges: 9, "flat faces": 3 }[m[1]]) : null;
    },
    "one-face": (i) => (/How many (corners|edges) does an? (cube|rectangular prism)/.test(Q(i)) ? "4" : null),
    "counted-start-twice": (i) => {
      const m = Q(i).match(/How many (corners|sides) does an? (\w+) have/);
      return m && shapeN[m[2]] ? String(shapeN[m[2]] + 1) : null;
    },
  },
  "1:equal-shares": {
    eaten: (i) => (/eaten/.test(Q(i)) ? String(N(Q(i))[1]) : null),
    added: (i) => (/Each piece/.test(Q(i)) ? String(N(Q(i))[0] + N(Q(i))[1]) : null),
    "one-piece": (i) => (/Each piece/.test(Q(i)) ? String(N(Q(i))[1]) : null),
  },
  "2:facts-20": add,
  "2:sub-facts-20": sub,
  "2:place-1000": place,
  "2:compare-1000": compare,
  "2:skip-count": {
    "by-ones": (i) => (N(Q(i)).at(-1) - N(Q(i)).at(-2) !== 1 ? String(N(Q(i)).at(-1) + 1) : null),
    "wrong-place": (i) => {
      const step = N(Q(i)).at(-1) - N(Q(i)).at(-2);
      return step === 10 || step === 100 ? String(N(Q(i)).at(-1) + (step === 10 ? 100 : 10)) : null;
    },
  },
  "2:add-100": {
    "no-regroup": (i) => (op(i)?.o === "+" ? String(col(op(i).a, op(i).b, (x, y) => (x + y) % 10)) : null),
    "wrote-both": (i) => {
      const p = op(i);
      if (p?.o !== "+") return null;
      const o = (p.a % 10) + (p.b % 10);
      return o >= 10 ? `${Math.floor(p.a / 10) + Math.floor(p.b / 10)}${o}` : null;
    },
  },
  "2:subtract-100": {
    "smaller-from-larger": (i) => (op(i)?.o === "-" ? String(col(op(i).a, op(i).b, (x, y) => Math.abs(x - y))) : null),
    added: (i) => (op(i)?.o === "-" ? String(op(i).a + op(i).b) : null),
  },
  "2:add-1000": {
    "no-regroup": (i) => (op(i)?.o === "+" ? String(col(op(i).a, op(i).b, (x, y) => (x + y) % 10)) : null),
    "lost-one-carry": (i) => {
      const p = op(i);
      if (p?.o !== "+") return null;
      const nc = col(p.a, p.b, (x, y) => (x + y) % 10);
      const w = [p.a + p.b - 10, p.a + p.b - 100].find((x) => x !== nc && x > 0 && (p.a % 10) + (p.b % 10) >= 10 === (x === p.a + p.b - 10));
      return w === undefined ? null : String(w);
    },
  },
  "2:even-odd": {
    "first-digit": (i) => {
      const n = Q(i).match(/Is (\d+)/)[1];
      return n.length > 1 ? (Number(n[0]) % 2 ? "odd" : "even") : null;
    },
    "any-odd-digit": (i) => (/[13579]/.test(Q(i).match(/Is (\d+)/)[1].slice(0, -1)) ? "odd" : null),
  },
  "2:coins": {
    "counted-coins": (i) => String(N(Q(i)).reduce((a, b) => a + b, 0)),
    "dime-nickel": (i) => {
      const [qq, d, n, p] = N(Q(i));
      return String(25 * qq + 5 * d + 10 * n + p);
    },
  },
  "2:interpret-data": {
    fewest: (i) => [...Q(i).matchAll(/([a-z]+): (\d+)/g)].sort((a, b) => a[2] - b[2])[0][1],
    "second-most": (i) => {
      const s = [...Q(i).matchAll(/([a-z]+): (\d+)/g)].sort((a, b) => b[2] - a[2]);
      return s.length > 2 && Number(s[1][2]) < Number(s[0][2]) ? s[1][1] : null;
    },
  },
  "2:doubles-near": {
    "forgot-one": (i) => {
      const [a, b] = N(Q(i));
      return Math.abs(a - b) === 1 ? String(2 * Math.min(a, b)) : null;
    },
    "doubled-bigger": (i) => {
      const [a, b] = N(Q(i));
      return Math.abs(a - b) === 1 ? String(2 * Math.max(a, b)) : null;
    },
  },
  "2:arrays": {
    added: (i) => (/rows with/.test(Q(i)) ? String(N(Q(i))[0] + N(Q(i))[1]) : null),
    "took-away": (i) => (/equal rows/.test(Q(i)) ? String(N(Q(i))[0] - N(Q(i))[1]) : null),
  },
  "2:time-five": {
    "hand-number": (i) => (/points to/.test(Q(i)) ? String(N(Q(i))[0]) : null),
    "counted-jumps": (i) => {
      const n = N(Q(i));
      return /from/.test(Q(i)) ? String((n[2] * 60 + n[3] - n[0] * 60 - n[1]) / 5) : null;
    },
  },
  "2:mental-tens": {
    "wrong-place": (i) => {
      const [k, n] = N(Q(i));
      const s = /more/.test(Q(i)) ? 1 : -1;
      return String(n + s * (k === 10 ? 1 : 10));
    },
    "wrong-way": (i) => {
      const [k, n] = N(Q(i));
      return String(/more/.test(Q(i)) ? n - k : n + k);
    },
  },
  "3:mul-0-5": { ...mulBasic, "times-zero": (i) => (op(i) && (op(i).a === 0 || op(i).b === 0) ? String(op(i).a + op(i).b) : null) },
  "3:mul-6-9": mulBasic,
  "3:mul-10-12": {
    "dropped-zero": (i) => (op(i) ? String((op(i).a * op(i).b) / 10) : null),
    "extra-zero": (i) => (op(i) ? String(op(i).a * op(i).b * 10) : null),
  },
  "3:division-facts": {
    subtracted: (i) => (op(i) ? String(op(i).a - op(i).b) : null),
    multiplied: (i) => (op(i) ? String(op(i).a * op(i).b) : null),
    "one-group-off": (i) => (op(i) ? String(op(i).a / op(i).b + 1) : null),
  },
  "3:add-sub-1000": {
    "no-regroup": (i) => (op(i)?.o === "+" ? String(col(op(i).a, op(i).b, (x, y) => (x + y) % 10)) : null),
    "smaller-from-larger": (i) => (op(i)?.o === "-" ? String(col(op(i).a, op(i).b, (x, y) => Math.abs(x - y))) : null),
    "kept-the-ten": (i) => (op(i)?.o === "-" ? String(col(op(i).a, op(i).b, (x, y) => (x < y ? x + 10 - y : x - y))) : null),
  },
  "3:round": rounding,
  "3:fraction-equivalence": equiv,
  "3:fraction-compare": fcompare,
  "3:area": {
    perimeter: (i) => String(2 * (N(Q(i))[0] + N(Q(i))[1])),
    added: (i) => String(N(Q(i))[0] + N(Q(i))[1]),
  },
  "3:perimeter": { area: (i) => String(N(Q(i))[0] * N(Q(i))[1]), "two-sides": (i) => String(N(Q(i))[0] + N(Q(i))[1]) },
  "3:elapsed-time": time,
  "3:fraction-line": {
    "counted-marks": (i) => (/Point P is at mark/.test(Q(i)) ? `${N(Q(i))[3]}/${N(Q(i))[2] + 1}` : null),
    "zero-as-one": (i) => (/At which mark/.test(Q(i)) ? String(N(Q(i))[3] + 1) : null),
  },
  "3:scaled-graphs": {
    unscaled: (i) => {
      const n = N(Q(i));
      if (n[0] === 1) return null;
      return /Class B/.test(Q(i)) ? String(n[1] - n[2]) : String(n[1]);
    },
    "whole-bar": (i) => (/Class B/.test(Q(i)) ? String(N(Q(i))[0] * N(Q(i))[1]) : null),
  },
  "4:place-million": place,
  "4:round-large": rounding,
  "4:add-large": {
    "no-regroup": (i) => (op(i)?.o === "+" ? String(col(op(i).a, op(i).b, (x, y) => (x + y) % 10)) : null),
    "lost-one-carry": (i) => (op(i)?.o === "+" ? String(op(i).a + op(i).b - 10) : null),
  },
  "4:subtract-large": {
    "smaller-from-larger": (i) => (op(i)?.o === "-" ? String(col(op(i).a, op(i).b, (x, y) => Math.abs(x - y))) : null),
    "kept-the-ten": (i) => (op(i)?.o === "-" ? String(col(op(i).a, op(i).b, (x, y) => (x < y ? x + 10 - y : x - y))) : null),
  },
  "4:multiply-1digit": {
    "no-carry": (i) => (op(i)?.o === "×" ? String(col(op(i).a, 0, (x) => (x * op(i).b) % 10)) : null),
    "lost-place-value": (i) => (op(i)?.o === "×" ? String([...String(op(i).a)].reduce((s, x) => s + Number(x) * op(i).b, 0)) : null),
  },
  "4:multiply-2digit": {
    "no-zero": (i) => (op(i)?.o === "×" && op(i).b >= 10 ? String(op(i).a * (op(i).b % 10) + op(i).a * Math.floor(op(i).b / 10)) : null),
    "two-parts-only": (i) => {
      const p = op(i);
      return p?.o === "×" && p.a >= 10 && p.b >= 10 ? String(Math.floor(p.a / 10) * Math.floor(p.b / 10) * 100 + (p.a % 10) * (p.b % 10)) : null;
    },
  },
  "4:division": { ...remainder, "one-group-off": (i) => (op(i)?.o === "÷" ? String(op(i).a / op(i).b - 1) : null) },
  "4:factors": {
    "missed-ends": (i) => (/How many factors does (\d+)/.test(Q(i)) ? String(factorCount(N(Q(i))[0]) - 2) : null),
    "factor-multiple-swap": (i) => {
      const f = Q(i).match(/Is (\d+) a factor of (\d+)/);
      const m = Q(i).match(/Is (\d+) a multiple of (\d+)/);
      if (f) return Number(f[1]) % Number(f[2]) === 0 ? "yes" : "no";
      if (m) return Number(m[2]) % Number(m[1]) === 0 ? "yes" : "no";
      return null;
    },
    "odd-means-prime": (i) => (/prime or composite/.test(Q(i)) && N(Q(i))[0] % 2 === 1 ? "prime" : null),
  },
  "4:fraction-equiv": equiv,
  "4:fraction-compare": fcompare,
  "4:unit-conversion": {
    "wrong-factor": (i) => {
      const n = N(Q(i))[0];
      return String(n * (/hours/.test(Q(i)) ? 100 : /meters/.test(Q(i)) && !/milli/.test(Q(i)) ? 1000 : 100));
    },
    divided: (i) => {
      const n = N(Q(i))[0];
      const f = /hours/.test(Q(i)) ? 60 : /^\d+ meters/.test(Q(i)) ? 100 : 1000;
      return String(n / f);
    },
  },
  "4:mul-11-12": {
    "added-the-two": (i) => {
      const p = op(i);
      if (!p) return null;
      const [a, b] = p.b === 11 || p.b === 12 ? [p.a, p.b] : [p.b, p.a];
      return b === 11 || b === 12 ? String(a * 10 + (b - 10)) : null;
    },
    "wrote-side-by-side": (i) => {
      const p = op(i);
      if (!p) return null;
      const [a, b] = p.b === 11 || p.b === 12 ? [p.a, p.b] : [p.b, p.a];
      return b === 11 || b === 12 ? `${a}${a * (b - 10)}` : null;
    },
  },
  "4:line-plots": {
    "included-the-quarter": (i) => (/longer than 1\/4/.test(Q(i)) ? String(N(Q(i))[2] + N(Q(i))[5] + N(Q(i))[8]) : null),
    "counted-lengths": (i) => (/were measured/.test(Q(i)) ? "3" : null),
    "longest-only": (i) => (/inches longer/.test(Q(i)) ? "3/4" : null),
  },
  "4:mixed-numbers": {
    "added-whole": (i) => {
      const m = Q(i).match(/Write (\d+) (\d+)\/(\d+) as an improper/);
      return m ? `${Number(m[1]) + Number(m[2])}/${m[3]}` : null;
    },
    "forgot-parts": (i) => {
      const m = Q(i).match(/Write (\d+) (\d+)\/(\d+) as an improper/);
      return m ? `${Number(m[1]) * Number(m[3])}/${m[3]}` : null;
    },
    swapped: (i) => {
      const m = Q(i).match(/Write (\d+)\/(\d+) as a mixed/);
      if (!m) return null;
      const [n, d] = [Number(m[1]), Number(m[2])];
      return n % d ? `${n % d} ${Math.floor(n / d)}/${d}` : null;
    },
  },
  "4:angle-measure": {
    "wrong-whole": (i) => {
      const m = Q(i).match(/A (right|straight) angle .* One angle measures (\d+)°/);
      if (!m) return null;
      return m[1] === "right" ? String(180 - Number(m[2])) : String(360 - Number(m[2]));
    },
    subtracted: (i) => {
      const m = Q(i).match(/They measure (\d+)° and (\d+)°/);
      return m ? String(Math.abs(Number(m[1]) - Number(m[2]))) : null;
    },
  },
  "5:multiply-whole": {
    "no-zero": (i) => (op(i)?.o === "×" && op(i).b >= 10 && op(i).b < 100 ? String(op(i).a * (op(i).b % 10) + op(i).a * Math.floor(op(i).b / 10)) : null),
    "one-row": (i) => (op(i)?.o === "×" && op(i).b >= 10 && op(i).b < 100 && op(i).b % 10 ? String(op(i).a * (op(i).b % 10)) : null),
  },
  "5:divide-whole": {
    ...remainder,
    "dropped-zero": (i) => {
      const p = op(i);
      if (p?.o !== "÷") return null;
      const s = String(p.a / p.b);
      return s.includes("0") && s.replaceAll("0", "") ? s.replaceAll("0", "") : null;
    },
  },
  "5:decimal-place": {
    "neighbour-place": (i) => {
      const m = Q(i).match(/in the (tenths|hundredths|thousandths) place of (\d+)\.(\d+)/);
      const k = { tenths: 1, hundredths: 2, thousandths: 3 }[m[1]];
      return m[3][k] ?? m[3][k - 2] ?? null;
    },
    "last-digit": (i) => {
      const m = Q(i).match(/in the (tenths|hundredths|thousandths) place of (\d+)\.(\d+)/);
      const k = { tenths: 1, hundredths: 2, thousandths: 3 }[m[1]];
      return k !== m[3].length ? m[3].at(-1) : null;
    },
  },
  "5:decimal-add": {
    "right-aligned": (i) => decRight(i, "+"),
    "no-regroup": (i) => {
      const p = decQ(i, "+");
      if (!p) return null;
      const P = Math.max(dp(p.a), dp(p.b));
      return String(col(scale(p.a, P), scale(p.b, P), (x, y) => (x + y) % 10) / 10 ** P);
    },
  },
  "5:decimal-sub": {
    "right-aligned": (i) => decRight(i, "-"),
    "smaller-from-larger": (i) => {
      const p = decQ(i, "-");
      if (!p) return null;
      const P = Math.max(dp(p.a), dp(p.b));
      return String(col(scale(p.a, P), scale(p.b, P), (x, y) => Math.abs(x - y)) / 10 ** P);
    },
  },
  "5:decimal-mul": {
    "point-misplaced": (i) => {
      const p = decQ(i, "×");
      if (!p || !dp(p.a) || !dp(p.b)) return null;
      return String((scale(p.a, dp(p.a)) * scale(p.b, dp(p.b))) / 10 ** Math.max(dp(p.a), dp(p.b)));
    },
    "split-parts": (i) => {
      const p = decQ(i, "×");
      if (!p || !dp(p.a) || !dp(p.b)) return null;
      const fa = scale(p.a, 1) % 10;
      const fb = scale(p.b, 1) % 10;
      return String(Math.trunc(p.a) * Math.trunc(p.b) + (fa * fb) / 100);
    },
  },
  "5:fraction-add": {
    across: (i) => {
      const f = frac2(i)?.map((x, k) => (k === 2 ? x : Number(x)));
      if (!f || f[2] === "×") return null;
      const top = f[2] === "+" ? f[0] + f[3] : f[0] - f[3];
      const bot = f[2] === "+" ? f[1] + f[4] : f[1] - f[4];
      return bot > 0 && top >= 0 ? `${top}/${bot}` : null;
    },
    "numerators-not-scaled": (i) => {
      const f = frac2(i)?.map((x, k) => (k === 2 ? x : Number(x)));
      if (!f || f[2] === "×" || f[1] === f[4]) return null;
      const top = f[2] === "+" ? f[0] + f[3] : f[0] - f[3];
      return top >= 0 ? `${top}/${(f[1] * f[4]) / gcd(f[1], f[4])}` : null;
    },
  },
  "5:fraction-mul": {
    cross: (i) => {
      const f = frac2(i).map(Number);
      return fstr(f[0] * f[4], f[1] * f[3]);
    },
    added: (i) => {
      const f = frac2(i).map(Number);
      return fstr(f[0] * f[4] + f[3] * f[1], f[1] * f[4]);
    },
  },
  "5:fraction-of": {
    "one-part": (i) => (N(Q(i))[0] > 1 ? String(N(Q(i))[2] / N(Q(i))[1]) : null),
    "forgot-divide": (i) => String(N(Q(i))[0] * N(Q(i))[2]),
  },
  "5:unit-fraction-division": {
    "divided-whole": (i) => (/servings/.test(Q(i)) ? `${N(Q(i))[0]}/${N(Q(i))[2]}` : null),
    "multiplied-share": (i) => (/shared equally/.test(Q(i)) ? `${N(Q(i))[2]}/${N(Q(i))[1]}` : null),
  },
  "5:volume": {
    added: (i) => String(N(Q(i)).reduce((a, b) => a + b, 0)),
    "one-layer": (i) => String(N(Q(i))[0] * N(Q(i))[1]),
  },
  "5:coordinate-plane": {
    swapped: (i) => {
      const n = N(Q(i));
      if (/origin/.test(Q(i))) return `(${n[3]},${n[2]})`;
      if (/A point is at/.test(Q(i))) return `(${n[1] + n[3]},${n[0] + n[2]})`;
      return null;
    },
    "moved-wrong-way": (i) => {
      const n = N(Q(i));
      return /A point is at/.test(Q(i)) ? `(${n[0] + n[3]},${n[1] + n[2]})` : null;
    },
    "counted-points": (i) => (/units apart/.test(Q(i)) ? String(Math.abs(N(Q(i))[2] - N(Q(i))[0]) + 1) : null),
  },
  "5:order-ops": {
    "left-to-right": (i) => String(evalLR(Q(i).match(/^Evaluate: (.+)\.$/)[1])),
    "ignored-parentheses": (i) => {
      const e = Q(i).match(/^Evaluate: (.+)\.$/)[1];
      return e.includes("(") ? String(evalStd(e.replace(/[()]/g, ""))) : null;
    },
  },
};

// --- Independent transfer answers, recomputed from the English prompt's own numbers --------------------------------------
const T = {
  "0:count-forward": (n) => n.at(-1) + 1,
  "0:count-cardinality": (n) => n[0],
  "0:subitize": (n) => n[0] + n[1],
  "0:compare-20": (n) => (n[1] > n[0] ? "Ana" : "Sam"),
  "0:compose-10": (n) => n[0] - n[1],
  "0:add-sub-5": (n) => n[0] - n[1],
  "0:story-add-sub-10": (n) => n[1] - n[0],
  "0:patterns": () => "blue",
  "0:hidden-parts": (n) => n[0] - n[1],
  "1:count-patterns": (n) => n.at(-2) + n[0],
  "1:tens-ones": (n) => n[1] * n[0] + n[2],
  "1:compare-100": (n) => (n[1] > n[0] ? "blue" : "red"),
  "1:add-10": (n) => n[0] + n[1],
  "1:subtract-10": (n) => n[0] - n[1],
  "1:make-10": (n) => n[0] - n[1],
  "1:add-20": (n) => n[0] + n[1],
  "1:missing-addend": (n) => n[0] - n[1],
  "1:subtract-20": (n) => n[0] - n[1],
  "1:time": (n) => `${n[0] + Math.floor((n[1] + n[2]) / 60)}:${String((n[1] + n[2]) % 60).padStart(2, "0")}`,
  "1:measure-length": (n) => n[1] - n[0],
  "1:shapes-2d3d": (n) => n[0],
  "1:equal-shares": (n) => n[0] * n[1],
  "2:facts-20": (n) => n[0] + n[1],
  "2:sub-facts-20": (n) => n[0] - n[1],
  "2:place-1000": (n) => n[2] * n[0] + n[3] * n[1] + n[4],
  "2:compare-1000": (n) => (n[1] > n[0] ? "B" : "A"),
  "2:skip-count": (n) => n.at(-1) + (n.at(-1) - n.at(-2)),
  "2:add-100": (n) => n[0] + n[1],
  "2:subtract-100": (n) => n[0] - n[1],
  "2:add-1000": (n) => n[0] + n[1],
  "2:even-odd": (n) => (n[0] % 2 ? "no" : "yes"),
  "2:coins": (n) => 25 * n[0] + 10 * n[1] + n[2],
  "2:interpret-data": (n) => n[1] - n[2],
  "2:doubles-near": (n) => n[0] + n[1],
  "2:arrays": (n) => n[0] * n[1],
  "2:time-five": (n) => n[2] * 60 + n[3] - n[0] * 60 - n[1],
  "2:mental-tens": (n) => n[0] + n[1],
  "3:mul-0-5": (n) => n[0] * n[1],
  "3:mul-6-9": (n) => n[0] * n[1],
  "3:mul-10-12": (n) => n[0] * n[1],
  "3:division-facts": (n) => n[0] / n[1],
  "3:add-sub-1000": (n) => n[0] - n[1],
  "3:round": (n) => Math.round(n[0] / 100) * 100,
  "3:fraction-equivalence": (n) => (n[0] / n[1]) * n[3],
  "3:fraction-compare": (n) => (n[0] / n[1] > n[2] / n[3] ? "Ana" : "Ben"),
  "3:area": (n) => n[0] * n[1],
  "3:perimeter": (n) => 2 * (n[0] + n[1]),
  "3:elapsed-time": (n) => `${n[0] + Math.floor((n[1] + n[2]) / 60)}:${String((n[1] + n[2]) % 60).padStart(2, "0")}`,
  "3:fraction-line": (n) => `${n[2]}/${n[1]}`,
  "3:scaled-graphs": (n) => n[0] * n[1],
  "4:place-million": (n) => n[0] * n[1] + n[2] * n[3] + n[4],
  "4:round-large": (n) => Math.round(n[0] / 10000) * 10000,
  "4:add-large": (n) => n[0] + n[1],
  "4:subtract-large": (n) => n[0] - n[1],
  "4:multiply-1digit": (n) => n[0] * n[1],
  "4:multiply-2digit": (n) => n[0] * n[1],
  "4:division": (n) => n[0] / n[1],
  "4:factors": (n) => [...Array(n[0]).keys()].map((k) => k + 1).filter((k) => n[0] % k === 0 && k > 1 && k < n[0]).length,
  "4:fraction-equiv": (n) => (n[0] * 8) / n[1],
  "4:fraction-compare": (n) => (n[0] / n[1] > n[2] / n[3] ? "A" : "B"),
  "4:unit-conversion": (n) => n[0] * 60,
  "4:mul-11-12": (n) => n[0] * n[1],
  "4:line-plots": (n) => n[5] + n[7],
  "4:mixed-numbers": (n) => Math.round((n[2] + n[3] / n[4]) / (n[0] / n[1])),
  "4:angle-measure": (n) => 360 / n[0],
  "5:multiply-whole": (n) => n[0] * n[1],
  "5:divide-whole": (n) => n[0] / n[1],
  "5:decimal-place": (n) => Math.floor(Math.round(n[0] * 1000) / 10) % 10,
  "5:decimal-add": (n) => Math.round((n[0] + n[1]) * 100) / 100,
  "5:decimal-sub": (n) => Math.round((n[0] - n[1]) * 100) / 100,
  "5:decimal-mul": (n) => Math.round(n[0] * n[1] * 100) / 100,
  "5:fraction-add": (n) => fstr(n[0] * n[3] + n[2] * n[1], n[1] * n[3]),
  "5:fraction-mul": (n) => fstr(n[0] * n[2], n[1] * n[3]),
  "5:fraction-of": (n) => (n[0] / n[2]) * n[1],
  "5:unit-fraction-division": (n) => fstr(n[0], n[1] * n[2]),
  "5:volume": (n) => n[0] * n[1] * n[2],
  "5:coordinate-plane": (n) => n[2] - n[0],
  "5:order-ops": (n) => n[2] + n[1] * n[0],
};

// --- Arithmetic truth: every "a op b (op c)… = r" chain in authored English text is true ----------------------------------
const TERM = String.raw`\(?\d[\d.]*(?![\d/])\)?`;
const EXPR = String.raw`${TERM}(?:\s*[+\-×÷]\s*${TERM})*`;
const CHAIN = new RegExp(String.raw`(?<![\d/.])(${TERM}(?:\s*[+\-×÷]\s*${TERM})+|${TERM})\s*=\s*(?=(${EXPR})(?![\d/]|\s*R\b|\s*(?:tenths|hundredths|thousandths|tens|hundreds|thousands|ones|fourths|thirds|eighths|sixths)\b))`, "g");
const calc = (e) => Function(`return (${e.replaceAll("×", "*").replaceAll("÷", "/")})`)();
function falseEquations(text) {
  const t = String(text).replaceAll("−", "-").replaceAll("°", "").replace(/(\d),(?=\d{3}\b)/g, "$1");
  const bad = [];
  for (const m of t.matchAll(CHAIN)) {
    const bal = (x) => (x.match(/\(/g) || []).length === (x.match(/\)/g) || []).length;
    const lhs = m[1].replace(/^\(([^()]*)$/, "$1");
    const rhs = m[2].replace(/^([^()]*)\)$/, "$1");
    if (!bal(lhs) || !bal(rhs) || !/[+\-×÷]/.test(lhs + rhs)) continue;
    const [l, r] = [calc(lhs), calc(rhs)];
    if (Math.abs(l - r) > 1e-9) bad.push(`${lhs} = ${rhs} (${l} ≠ ${r})`);
  }
  return bad;
}


// --- Leak test: does a sentence give away this item's answer? -------------------------------------------------------------
const TOK = (s) => (String(s).replaceAll("−", "-").replace(/(\d),(?=\d{3}\b)/g, "$1").match(/\d+\/\d+|\d+(?:\.\d+)?/g) || []);
const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function leakTest(item, answer) {
  const question = Q(item);
  const a = TOK(answer);
  if (!a.length) return null;
  const p = op(item);
  if (p) {
    const o = esc(p.o === "-" ? "-" : p.o);
    const minus = p.o === "-" ? "[-−]" : o;
    const exprs = [`${p.a}\\s*${minus}\\s*${p.b}`];
    if (p.o === "+" || p.o === "×") exprs.push(`${p.b}\\s*${o}\\s*${p.a}`);
    const re = new RegExp(`(?<![\\d./])(${exprs.join("|")})(?![\\d./])`);
    return (sentence) => re.test(sentence.replaceAll("−", "-").replace(/(\d),(?=\d{3}\b)/g, "$1")) && a.every((x) => TOK(sentence).includes(x));
  }
  const filled = /□|\?\s*=|= \?/.test(question) ? question.replace(/□/g, answer) : question;
  const given = TOK(filled);
  if (!given.length || a.every((x) => TOK(question).includes(x))) return null;
  const needs = [...given, ...a];
  return (sentence) => {
    const bag = TOK(sentence);
    return needs.every((x) => {
      const k = bag.indexOf(x);
      if (k < 0) return false;
      bag.splice(k, 1);
      return true;
    });
  };
}

// --- Run --------------------------------------------------------------------------------------------------------------
// Spanish counts "by 5s" as "de 5 en 5", so the SET of numbers must match, not every repetition.
const numberSet = (a) => [...new Set(a)].sort((x, y) => x - y).join(",");
const hasWords = (t) => /\p{L}{2,}/u.test(String(t).replace(/\b[RV]\b/g, ""));
const k5 = GRADES.filter((g) => g.grade <= 5).flatMap((g) => g.skills.map((s) => ({ ...s, grade: g.grade })));
const noBuild = [];
let detectorChecks = 0;
let detectorHits = 0;
for (const skill of k5) {
  const key = `${skill.grade}:${skill.id}`;
  const e = AUTHORED[key];
  if (!e) {
    fail(`${key}: not authored`);
    continue;
  }
  // Fields and language.
  const texts = [...TEXT_FIELDS.filter((f) => e[f]).map((f) => [f, e[f]]), ...(e.reasons || []).map((r, i) => [`reasons[${i}]`, r])];
  for (const m of e.misconceptions || []) texts.push([`misconceptions.${m.id}`, m.feedback]);
  if (e.transfer) for (const f of ["prompt", "hint", "explanation", "unit"]) if (e.transfer[f]) texts.push([`transfer.${f}`, e.transfer[f]]);
  for (const f of ["concept", "misconception"]) if (!e[f]) fail(`${key}: missing ${f}`);
  if (!(e.reasons?.length >= 2 && e.reasons.length <= 4)) fail(`${key}: needs 2–4 reasons`);
  if (!(e.misconceptions?.length >= 2)) fail(`${key}: needs at least 2 misconception detectors`);
  if (!e.transfer) fail(`${key}: missing transfer`);
  for (const [f, v] of texts) {
    if (!v?.en?.trim() || !v?.es?.trim()) fail(`${key} ${f}: missing a language`);
    else if (v.en === v.es && f !== "transfer.unit" && hasWords(v.en)) fail(`${key} ${f}: Spanish is a copy of English`);
    else if (numberSet(N(v.en)) !== numberSet(N(v.es))) fail(`${key} ${f}: numbers differ EN [${N(v.en)}] / ES [${N(v.es)}]`);
    for (const b of falseEquations(v?.en || "")) fail(`${key} ${f}: false equation ${b}`);
  }
  // Every skill without an engine Build carries a living model.
  const lesson = lessonFor(generateProblem(skill, seededRandom(11 * 7919)));
  const built = Boolean(lesson?.modeled && hasBuild(lesson));
  if (!built) {
    noBuild.push(key);
    if (!e.living?.mount) fail(`${key}: no engine Build and no living model`);
  }
  // Transfer: recomputed answer, accepted by the real checker, stated in the explanation, not given away by the hint.
  if (e.transfer) {
    const t = e.transfer;
    const want = T[key]?.(N(t.prompt.en));
    if (want === undefined) fail(`${key}: no independent transfer formula`);
    else if (!validateAnswer(String(want), { answers: t.answers, kind: t.kind })) fail(`${key}: transfer answer ${t.answers[0]} ≠ recomputed ${want}`);
    const said = t.explanation.en.toLowerCase();
    if (!said.includes(String(t.answers[0]).toLowerCase().replace(/(\d)(?=(\d{3})+$)/g, "$1,")) && !said.includes(String(t.answers[0]).toLowerCase()))
      fail(`${key}: transfer explanation never states its answer ${t.answers[0]}`);
    for (const lang of ["en", "es"]) {
      const hint = String(t.hint?.[lang] || "");
      const a = String(t.answers[0]);
      const inPrompt = new RegExp(`(^|[^\\d/])${a}(?![\\d/])`).test(N(t.prompt[lang]).join(" ") + " " + t.prompt[lang]);
      if (!inPrompt && new RegExp(`(^|[^\\d/.])${a}(?![\\d/])`).test(hint.replace(/(\d),(?=\d{3})/g, "$1"))) fail(`${key}: transfer hint (${lang}) states the answer ${a}`);
    }
  }
  // Detectors: fire on their own slip, never on the right answer, never on a transfer item.
  const produce = PRODUCERS[key] || {};
  for (const m of e.misconceptions || []) {
    if (!produce[m.id]) {
      fail(`${key}: detector "${m.id}" has no independent producer in this test`);
      continue;
    }
    let hits = 0;
    for (let s = 0; s < 200; s += 1) {
      const rng = seededRandom(s * 977 + skill.grade * 31 + 5);
      const item = s % 4 === 3 ? generateProblem(skill, rng) : adaptiveProblem(skill, rng, s % 4);
      detectorChecks += 1;
      for (const right of item.answers) if (m.detect(item, right)) fail(`${key} ${m.id}: fires on the RIGHT answer ${right} for "${item.question}"`);
      let wrong = null;
      try {
        wrong = produce[m.id](item);
      } catch {
        wrong = null;
      }
      if (wrong == null || validateAnswer(wrong, item)) continue;
      hits += 1;
      if (!m.detect(item, wrong)) fail(`${key} ${m.id}: misses its own slip ${wrong} for "${item.question}" (right ${item.answers[0]})`);
    }
    detectorHits += hits;
    if (hits < 3) fail(`${key} ${m.id}: its slip occurred only ${hits} times in 200 generated items`);
    if (e.transfer && m.detect({ question: e.transfer.prompt.en, answers: e.transfer.answers, kind: e.transfer.kind, transfer: true }, "0"))
      fail(`${key} ${m.id}: fires on the transfer item`);
  }
  // Nothing shown before an answer states a practice item's answer. A sentence leaks when it carries the item's
  // own expression together with its answer ("7 + 2" … "9"), or, for worded items, every given number AND the answer.
  // Fractions are single tokens, and a box (□) is filled in with the answer first, so "2/3 = 4/6" leaks "2/3 = □/6".
  const before = [e.title, e.concept, e.misconception, ...(e.reasons || [])].filter(Boolean);
  for (let s = 0; s < 200; s += 1) {
    const rng = seededRandom(s * 389 + skill.grade);
    const item = s % 4 === 3 ? generateProblem(skill, rng) : adaptiveProblem(skill, rng, s % 4);
    for (const answer of item.answers) {
      const leak = leakTest(item, answer);
      if (!leak) continue;
      for (const v of before)
        for (const lang of ["en", "es"])
          for (const sentence of String(v[lang]).split(/(?<=[.!?;])\s+/))
            if (leak(sentence)) fail(`${key}: "${sentence}" (${lang}) states the answer ${answer} to "${item.question}"`);
    }
  }
}

// "Another way": every K–5 skill carries one, in both languages, and the shell's own leak check never withholds it
// (a line that names an answer would be dropped silently, leaving Spanish learners with nothing).
let anotherChecks = 0;
for (const s of k5) {
  const key = `${s.grade}:${s.id}`;
  const text = AUTHORED[key]?.another?.text;
  if (!text?.en?.trim() || !text?.es?.trim()) {
    fail(`${key}: no "Another way" text in English and Spanish`);
    continue;
  }
  if (text.en === text.es) fail(`${key}: "Another way" Spanish is a copy of the English`);
  if (text.en.split(/\s+/).length > 32) fail(`${key}: "Another way" is longer than 32 words`);
  if (/\d/.test(text.en) || /\d/.test(text.es)) fail(`${key}: "Another way" names a number, which a problem could ask about`);
  for (let i = 0; i < 200; i += 1) {
    const item = adaptiveProblem(s, seededRandom(4243 + i), i % 3);
    anotherChecks += 1;
    if (revealsAnswer(text.en, item)) fail(`${key}: "Another way" reveals the answer to "${item.question}"`);
  }
}

// Living models: mount in a DOM, operate every control, and check labels, bounds and that something is observed.
const dom = new JSDOM("<!doctype html><body></body>");
globalThis.document = dom.window.document;
let models = 0;
for (const [key, e] of Object.entries(AUTHORED)) {
  if (!e.living || !k5.some((s) => `${s.grade}:${s.id}` === key)) continue;
  for (const lang of ["en", "es"]) {
    const host = dom.window.document.createElement("div");
    dom.window.document.body.append(host);
    const said = [];
    const api = e.living.mount(host, { lang: () => lang, say: (t) => said.push(t) });
    models += lang === "en" ? 1 : 0;
    const buttons = () => [...host.querySelectorAll("button")];
    for (const b of buttons()) if (!(b.textContent.trim() || b.getAttribute("aria-label"))) fail(`${key} (${lang}): unlabeled button`);
    for (const svg of host.querySelectorAll("svg")) if (!svg.getAttribute("aria-label")) fail(`${key} (${lang}): svg without aria-label`);
    // Press every enabled control up to 12 times (steppers hit their bounds and disable), then reset.
    for (let round = 0; round < 12; round += 1)
      for (const b of buttons()) if (!b.disabled && !b.hasAttribute("data-reset")) b.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    const html = host.innerHTML;
    if (/NaN|undefined|Infinity|\[object/.test(html)) fail(`${key} (${lang}): rendered NaN/undefined`);
    if (!api.observed()) fail(`${key} (${lang}): observed() never became true after operating every control`);
    if (!said.length || said.some((t) => !t.trim())) fail(`${key} (${lang}): no announcement of the model state`);
    for (const t of said) for (const b of falseEquations(t)) if (lang === "en") fail(`${key}: living model states a false equation ${b}`);
    const reset = host.querySelector("[data-reset]");
    reset?.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    host.remove();
  }
}

console.log(`K–5 skills ${k5.length}, authored ${k5.filter((s) => AUTHORED[`${s.grade}:${s.id}`]).length}, without engine Build ${noBuild.length} (${noBuild.join(" ")}), living models mounted ${models}`);
console.log(`detector checks ${detectorChecks}, slips exercised ${detectorHits}, "Another way" leak checks ${anotherChecks}`);
if (failures.length) {
  // One line per distinct defect: the same message with different generated numbers is one defect.
  const seen = new Map();
  for (const f of failures) {
    const k = f.replace(/"[^"]*"/g, "…").replace(/\d+/g, "#");
    if (!seen.has(k)) seen.set(k, [f, 0]);
    seen.get(k)[1] += 1;
  }
  console.log([...seen.values()].map(([f, n]) => `${n > 1 ? `[×${n}] ` : ""}${f}`).join("\n"));
}
assert.equal(failures.length, 0, `${failures.length} K–5 authoring failures`);
