// Independent oracle for the Number Builder suites: scaled-integer arithmetic, exhaustive search, number-word parsers
// and the declared difficulty proxy. It never calls the game's generator, solver or checker to produce an expected
// value. @fm2 FM-050 FM-051 FM-054 FM-055 FM-059 FM-060
import assert from "node:assert/strict";

const ok = (c, m) => assert.ok(c, m);
const same = (a, b, m) => assert.deepEqual(a, b, m);

// Every wrong-answer type the game names; the catalog suite provokes each one, the property suite may meet only these.
export const CATALOGUED = [
  "empty",
  "tooMuch",
  "tooLittle",
  "swapped",
  "countedPieces",
  "tenTimes",
  "tenth",
  "signFlip",
  "notZero",
  "rule",
  "invalid",
  "sameBuild",
  "needTwo",
  "notAllTiles",
  "leadingZero",
  "reversed",
  "notLargest",
  "notSmallest",
  "odd",
  "farther",
  "notNormalized",
  "expRule",
  "keptCoef",
  "expSign",
  "expOff",
  "sciMore",
  "sciLess",
  "sciEmpty",
];

// ---------- independent oracle ----------
export const places = (s) => (s.split(".")[1] || "").length;
// "-12.345" at 3 places -> -12345 (integer arithmetic, no floats)
export const scaled = (s, p) => {
  const neg = s.startsWith("-");
  const [w, f = ""] = s.replace("-", "").split(".");
  const n = Number(w + f.padEnd(p, "0"));
  return neg ? -n : n;
};
const okOp = (have, op, n) =>
  ({ eq: have === n, ge: have >= n, le: have <= n, ne: have !== n })[op];
function rulesOk(round, counts) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (round.cap && total > round.cap) return false;
  return round.constraints.every((c) => {
    if (c.t === "count")
      return okOp(
        c.of.reduce((a, id) => a + counts[id], 0),
        c.op,
        c.n,
      );
    if (c.t === "pieces") return okOp(total, c.op, c.n);
    if (c.t === "kinds") return okOp(Object.values(counts).filter((n) => n > 0).length, c.op, c.n);
    throw new Error(`unknown rule ${c.t}`);
  });
}
const valueOf = (round, counts, p) =>
  round.pieces.reduce((a, piece) => a + counts[piece.id] * scaled(piece.value, p), 0);
const placesOf = (round) =>
  Math.max(places(round.target), ...round.pieces.map((p) => places(p.value)));
export function oracleBuildOk(round, counts) {
  const p = placesOf(round);
  if (
    round.pieces.some(
      (piece) =>
        !Number.isInteger(counts[piece.id]) || counts[piece.id] < 0 || counts[piece.id] > piece.max,
    )
  )
    return false;
  return valueOf(round, counts, p) === scaled(round.target, p) && rulesOk(round, counts);
}
// All (or the first `limit`) count vectors that equal the target and obey the rules, by exhaustive recursion.
export function oracleSolutions(round, limit = Infinity) {
  const p = placesOf(round);
  const vals = round.pieces.map((piece) => scaled(piece.value, p));
  const maxima = round.pieces.map((piece) => piece.max);
  const goal = scaled(round.target, p);
  const totalCap = Math.min(
    round.cap ?? Infinity,
    ...round.constraints.filter((c) => c.t === "pieces" && c.op !== "ge").map((c) => c.n),
  );
  const upper = Array(vals.length + 1).fill(0);
  const lower = Array(vals.length + 1).fill(0);
  for (let i = vals.length - 1; i >= 0; i -= 1) {
    upper[i] = upper[i + 1] + Math.max(0, vals[i]) * maxima[i];
    lower[i] = lower[i + 1] + Math.min(0, vals[i]) * maxima[i];
  }
  const found = [];
  const counts = Array(vals.length).fill(0);
  const walk = (i, sum, used) => {
    if (found.length >= limit) return;
    if (i === vals.length) {
      if (sum === goal) {
        const byId = Object.fromEntries(round.pieces.map((piece, k) => [piece.id, counts[k]]));
        if (rulesOk(round, byId)) found.push(byId);
      }
      return;
    }
    if (goal - sum > upper[i] || goal - sum < lower[i]) return;
    for (let c = 0; c <= Math.min(maxima[i], totalCap - used); c += 1) {
      counts[i] = c;
      walk(i + 1, sum + c * vals[i], used + c);
    }
    counts[i] = 0;
  };
  walk(0, 0, 0);
  return found;
}
export function permutations(items) {
  if (items.length <= 1) return [items];
  const out = new Set();
  const seen = new Set();
  items.forEach((d, i) => {
    if (seen.has(d)) return;
    seen.add(d);
    for (const rest of permutations([...items.slice(0, i), ...items.slice(i + 1)]))
      out.add([d, ...rest].join(","));
  });
  return [...out].map((s) => s.split(",").map(Number));
}
export function chartOracle(round, slots) {
  if (
    slots.some((s) => s === null) ||
    [...slots].sort().join() !== [...round.tiles].sort().join() ||
    slots[0] === 0
  )
    return false;
  const value = Number(slots.join(""));
  const all = permutations(round.tiles)
    .filter((perm) => perm[0] !== 0)
    .map((perm) => Number(perm.join("")));
  const pool = round.goal === "largestEven" ? all.filter((v) => v % 2 === 0) : all;
  if (round.goal === "largest" || round.goal === "largestEven")
    return value === Math.max(...pool) && pool.includes(value);
  if (round.goal === "smallest") return value === Math.min(...pool);
  const T = Number(round.target);
  return Math.abs(value - T) === Math.min(...all.map((v) => Math.abs(v - T)));
}
export const SCALE = 30;
export const sciScaled = (digits, exp) =>
  BigInt(digits[0] * 10000 + digits[1] * 1000 + digits[2] * 100 + digits[3] * 10 + digits[4]) *
  10n ** BigInt(SCALE + exp - 2);
export const bigTarget = (s) => {
  const neg = s.startsWith("-");
  const [w, f = ""] = s.replace("-", "").split(".");
  const n = BigInt(w + f) * 10n ** BigInt(SCALE - f.length);
  return neg ? -n : n;
};
export function sciOracle(round, build) {
  if (!Array.isArray(build?.digits) || build.digits.length !== 5 || !Number.isInteger(build.exp))
    return false;
  if (sciScaled(build.digits, build.exp) !== bigTarget(round.target)) return false;
  const coef =
    build.digits[0] * 10000 +
    build.digits[1] * 1000 +
    build.digits[2] * 100 +
    build.digits[3] * 10 +
    build.digits[4];
  return round.constraints.every((c) =>
    c.t === "normalized"
      ? coef >= 100 && coef < 1000
      : c.op === "eq"
        ? build.exp === c.n
        : build.exp !== c.n,
  );
}
export const oracleSci = (round) => {
  const out = [];
  for (let exp = -9; exp <= 9; exp += 1) {
    const num = bigTarget(round.target);
    const per = 10n ** BigInt(SCALE + exp - 2);
    if (num % per !== 0n) continue;
    const q = num / per;
    if (q < 0n || q > 99999n) continue;
    const digits = String(q).padStart(5, "0").split("").map(Number);
    if (sciOracle(round, { digits, exp })) out.push({ digits, exp });
  }
  return out;
};

// number words, parsed back by independent inverse tables
const EN = Object.fromEntries(
  "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen"
    .split(" ")
    .map((w, i) => [w, i]),
);
Object.assign(EN, {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
});
export function parseEn(text) {
  let total = 0;
  let cur = 0;
  for (const word of text.split(/[ -]/)) {
    if (word === "hundred") cur *= 100;
    else if (word === "thousand") {
      total += cur * 1000;
      cur = 0;
    } else {
      ok(word in EN, `unknown English number word ${word}`);
      cur += EN[word];
    }
  }
  return total + cur;
}
const ES = Object.fromEntries(
  "cero uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciséis diecisiete dieciocho diecinueve veinte veintiuno veintidós veintitrés veinticuatro veinticinco veintiséis veintisiete veintiocho veintinueve"
    .split(" ")
    .map((w, i) => [w, i]),
);
Object.assign(ES, {
  un: 1,
  veintiún: 21,
  treinta: 30,
  cuarenta: 40,
  cincuenta: 50,
  sesenta: 60,
  setenta: 70,
  ochenta: 80,
  noventa: 90,
  cien: 100,
  ciento: 100,
  doscientos: 200,
  trescientos: 300,
  cuatrocientos: 400,
  quinientos: 500,
  seiscientos: 600,
  setecientos: 700,
  ochocientos: 800,
  novecientos: 900,
});
export function parseEs(text) {
  let total = 0;
  let cur = 0;
  for (const word of text.split(" ")) {
    if (word === "y") continue;
    if (word === "mil") {
      total += (cur || 1) * 1000;
      cur = 0;
    } else {
      ok(word in ES, `unknown Spanish number word ${word}`);
      cur += ES[word];
    }
  }
  return total + cur;
}
const placeWord = {
  tenth: 1,
  tenths: 1,
  hundredth: 2,
  hundredths: 2,
  thousandth: 3,
  thousandths: 3,
  décima: 1,
  décimas: 1,
  centésima: 2,
  centésimas: 2,
  milésima: 3,
  milésimas: 3,
};
export function parseDecimalWords(text, lang) {
  const neg = text.startsWith(lang === "en" ? "negative " : "menos ");
  const body = neg ? text.slice(text.indexOf(" ") + 1) : text;
  const words = body.split(" ");
  const last = words.pop();
  const p = placeWord[last];
  ok(p, `decimal place word ${last}`);
  const fix = (s) =>
    s
      .replace(/veintiuna$/, "veintiuno")
      .replace(/ una$/, " uno")
      .replace(/^una$/, "uno")
      .replace(/ientas$/, "ientos");
  const sep = words.indexOf(lang === "en" ? "and" : "con");
  const wholeWords = sep >= 0 ? words.slice(0, sep).join(" ") : "";
  const fracWords = words.slice(sep + 1).join(" ");
  const whole = wholeWords ? (lang === "en" ? parseEn(wholeWords) : parseEs(wholeWords)) : 0;
  const frac = lang === "en" ? parseEn(fracWords) : parseEs(fix(fracWords));
  return (neg ? "-" : "") + `${whole}.${String(frac).padStart(p, "0")}`;
}
// ---------- per-grade limits (declared here, not read from the game) ----------
export const LIMIT = {
  0: [20, 0],
  1: [99, 0],
  2: [999, 0],
  3: [9999, 0],
  4: [999999, 0],
  5: [7, 3],
  6: [999999, 0],
  7: [999999.999, 3],
  8: [1e9, 9],
};
export const SKILL_LIMIT = {
  "g6-chips": [12, 0],
  "g6-zero-pairs": [9, 0],
  "g7-signed-chips": [9, 2],
  "g7-zero-sum": [0, 0],
};
export const KIT_VALUES = {
  counters: { counter: ["1"] },
  base10: { unit: ["1"], rod: ["10"], flat: ["100"] },
  decimal: { flat: ["1"], rod: ["0.1"], unit: ["0.01"], mini: ["0.001"] },
  discs: { disc: ["1", "10", "100", "1000", "10000", "100000"] },
};
// Difficulty proxy (declared here): pieces/steps the cheapest correct build(s) need, plus a representation demand
// (how far the stated goal is from the build), plus two per rule, plus two per piece kind beyond three to coordinate. Level 3 must average higher than level 1.
export const REP = { numeral: 0, expanded: 3, words: 4, unit: 8 };
const sig = (t) => t.replace(/[-.]/g, "").replace(/^0+/, "").replace(/0+$/, "").length;
const magnitude = (t) => {
  const [w, f = ""] = t.replace("-", "").split(".");
  return Number(w) > 0
    ? w.replace(/^0+/, "").length - 1
    : -(f.length - f.replace(/^0+/, "").length + 1);
};
export function proxy(r, cheapest) {
  if (r.mode === "chart")
    return 2 * r.tiles.length + { largest: 0, smallest: 0, largestEven: 2, nearest: 3 }[r.goal];
  if (r.mode === "sci")
    return (
      2 * sig(r.target) +
      (magnitude(r.target) < 0 ? 2 : 0) +
      Math.abs(magnitude(r.target)) / 2 +
      r.constraints.length +
      (r.expr ? 4 : 0) +
      3 * (r.ways - 1)
    );
  const shuffled =
    r.form.type === "expanded" &&
    r.form.terms.some((t, i, all) => i && Number(t) > Number(all[i - 1]));
  const kinds =
    2 * Math.max(0, r.pieces.length - 3) + (r.kit === "chips" && r.target !== "0" ? 3 : 0);
  return cheapest + REP[r.form.type] + (shuffled ? 3 : 0) + kinds + 2 * r.constraints.length;
}
export const fingerprint = (r) =>
  JSON.stringify([
    r.target,
    r.constraints,
    r.ways,
    r.form,
    r.start,
    r.tiles,
    r.goal,
    r.pieces?.map((p) => p.id),
  ]);
export const commas = (s) => {
  const [w, f] = s.split(".");
  return w.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (f === undefined ? "" : `.${f}`);
};

// ---------- the hint worked example is itself correct (parallel step, independent re-computation) ----------
export function hintMath(round, text, label) {
  const sums = (re) => [...text.matchAll(re)].map((m) => m[1].replace(/,/g, ""));
  if (["base10", "decimal", "discs", "expdiscs"].includes(round.kit)) {
    const claim = text.match(/to build ([\d,.]+):/);
    ok(claim, `${label}: parallel example states what it builds`);
    const parts = sums(/= ([\d,.]+)(?:,|\.)/g);
    const p = Math.max(places(claim[1].replace(/,/g, "")), ...parts.map(places));
    const total = parts.reduce((a, b) => a + scaled(b, p), 0);
    same(
      total,
      scaled(claim[1].replace(/,/g, ""), p),
      `${label}: the parallel example adds up (${text})`,
    );
    ok(claim[1].replace(/,/g, "") !== round.target, `${label}: the example is not this round`);
  }
  if (round.kit === "counters" && round.pieces.length > 1) {
    const m = text.match(
      /show (\d+) you could use (\d+) red and (\d+) yellow counters, because (\d+) \+ (\d+) = (\d+)/,
    );
    ok(
      m &&
        Number(m[2]) + Number(m[3]) === Number(m[1]) &&
        m[4] === m[2] &&
        m[5] === m[3] &&
        m[6] === m[1] &&
        m[1] !== round.target,
      `${label}: counter example adds up`,
    );
  }
  if (round.mode === "sci" && !round.expr) {
    const m = text.match(/([\d,.]+) = ([\d.]+) × 10(⁻?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)/);
    ok(m, `${label}: scientific example`);
    const exp = Number(
      m[3].replace("⁻", "-").replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => "⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c)),
    );
    ok(
      bigTarget(m[1].replace(/,/g, "")) ===
        BigInt(Math.round(Number(m[2]) * 100)) * 10n ** BigInt(SCALE + exp - 2),
      `${label}: ${m[0]} is true`,
    );
    ok(m[1].replace(/,/g, "") !== round.target, `${label}: example is not this round`);
  }
  if (round.expr) {
    const m = text.match(
      /([\d.]+) × 10([⁰¹²³⁴⁵⁶⁷⁸⁹]+) (?:is the same value as) ([\d.]+) × 10([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/,
    );
    ok(m, `${label}: equivalence example`);
    const e = (s) => Number([...s].map((c) => "⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c)).join(""));
    const lhs = BigInt(Math.round(Number(m[1]) * 100)) * 10n ** BigInt(SCALE + e(m[2]) - 2);
    const rhs = BigInt(Math.round(Number(m[3]) * 100)) * 10n ** BigInt(SCALE + e(m[4]) - 2);
    ok(lhs === rhs, `${label}: equivalence example is true`);
  }
  if (round.mode === "chart") {
    const facts = {
      largest: [[2, 7, 4], 742],
      smallest: [[0, 6, 3], 306],
      largestEven: [[5, 2, 9], 952],
      nearest: [[1, 8, 5], 581],
    };
    const [tiles, expected] = facts[round.goal];
    const all = permutations(tiles)
      .filter((p) => p[0] !== 0)
      .map((p) => Number(p.join("")));
    const best = {
      largest: Math.max(...all),
      smallest: Math.min(...all),
      largestEven: Math.max(...all.filter((v) => v % 2 === 0)),
      nearest: all.reduce((a, b) => (Math.abs(b - 600) < Math.abs(a - 600) ? b : a)),
    }[round.goal];
    same(best, expected, `${label}: chart example result`);
    ok(text.includes(String(expected)), `${label}: chart example states ${expected}`);
  }
}
