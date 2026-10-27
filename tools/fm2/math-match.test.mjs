// biome-ignore-all format: one-line assertions keep this suite readable and inside the file-size cap
// Math suite for Math Match (game 2). Every card's value is re-derived HERE, from the words on the card, with BigInt
// rationals and parsers written in this file: nothing below calls the game's own value, check or classify code to produce
// an expected value. The oracle then proves each board has exactly one perfect matching, that check() agrees, that
// wrong groupings are rejected with the right named mix-up, that hints never leak and that the pictures match their words.
// @fm2 FM-008 FM-017 FM-019 FM-020 FM-032 FM-033 FM-050 FM-051 FM-052 FM-053 FM-054 FM-055 FM-056 FM-057 FM-058 FM-059 FM-060 FM-061 FM-062 FM-063 FM-065
import assert from "node:assert/strict";
import { drawFace } from "../../math/fluency-lab/family/fm2/art/representations.js";
import { validateGame } from "../../math/fluency-lab/family/fm2/contract.js";
import game from "../../math/fluency-lab/family/fm2/games/math-match/index.js";
import { RATIO_CTX, repLabel } from "../../math/fluency-lab/family/fm2/games/math-match/reps.js";
import { wordsEn, wordsEs } from "../../math/fluency-lab/family/fm2/games/math-match/words.js";
import { makeRng, seedFrom } from "../../math/fluency-lab/family/fm2/rng.js";

let checks = 0;
const ok = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};
const same = (a, b, message) => {
  assert.deepEqual(a, b, message);
  checks += 1;
};

// ---- exact rationals on BigInt (independent of fm2/rational.js) ----------------------------------------------------
const gcdB = (a, b) => {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y) [x, y] = [y, x % y];
  return x || 1n;
};
const Q = (n, d = 1n) => {
  let top = BigInt(n);
  let bottom = BigInt(d);
  if (bottom < 0n) [top, bottom] = [-top, -bottom];
  const g = gcdB(top, bottom);
  return { n: top / g, d: bottom / g };
};
const qadd = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d);
const qsub = (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d);
const qmul = (a, b) => Q(a.n * b.n, a.d * b.d);
const qdiv = (a, b) => Q(a.n * b.d, a.d * b.n);
const qeq = (a, b) => a.n === b.n && a.d === b.d;
const qabs = (a) => Q(a.n < 0n ? -a.n : a.n, a.d);
const qle = (a, b) => a.n * b.d <= b.n * a.d;
const clean = (text) => String(text).replaceAll("−", "-").replaceAll(",", "");
const dec = (text) => {
  const m = /^(-?)(\d*)(?:\.(\d+))?$/.exec(clean(text));
  assert.ok(m && (m[2] || m[3]), `not a number: ${text}`);
  const frac = m[3] || "";
  return Q(BigInt(`${m[1]}${m[2] || "0"}${frac}`), 10n ** BigInt(frac.length));
};
const numText = (text) =>
  text.includes("/") ? qdiv(dec(text.split("/")[0]), dec(text.split("/")[1])) : dec(text);
const pow10 = (k) => (k >= 0 ? Q(10n ** BigInt(k)) : Q(1n, 10n ** BigInt(-k)));
const key = (value) => value.map((q) => `${q.n}/${q.d}`).join(";");

// ---- number words, parsed back to numbers (English and Spanish) -----------------------------------------------------
const EN_VAL = {};
"zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen"
  .split(" ")
  .forEach((w, i) => (EN_VAL[w] = i));
"twenty thirty forty fifty sixty seventy eighty ninety"
  .split(" ")
  .forEach((w, i) => (EN_VAL[w] = 20 + 10 * i));
function enNumber(text) {
  let total = 0;
  let current = 0;
  for (const word of text.split(/[\s-]+/)) {
    if (word === "hundred") current *= 100;
    else if (word === "thousand") {
      total += current * 1000;
      current = 0;
    } else {
      assert.ok(word in EN_VAL, `unknown English number word: ${word}`);
      current += EN_VAL[word];
    }
  }
  return total + current;
}
const ES_VAL = { un: 1, veintiún: 21, ciento: 100, cien: 100 };
"cero uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciséis diecisiete dieciocho diecinueve veinte veintiuno veintidós veintitrés veinticuatro veinticinco veintiséis veintisiete veintiocho veintinueve"
  .split(" ")
  .forEach((w, i) => (ES_VAL[w] = i));
"treinta cuarenta cincuenta sesenta setenta ochenta noventa"
  .split(" ")
  .forEach((w, i) => (ES_VAL[w] = 30 + 10 * i));
"doscientos trescientos cuatrocientos quinientos seiscientos setecientos ochocientos novecientos"
  .split(" ")
  .forEach((w, i) => (ES_VAL[w] = 200 + 100 * i));
function esNumber(text) {
  let total = 0;
  let current = 0;
  for (const word of text.split(" ")) {
    if (word === "y") continue;
    if (word === "mil") {
      total += (current || 1) * 1000;
      current = 0;
    } else {
      assert.ok(word in ES_VAL, `unknown Spanish number word: ${word}`);
      current += ES_VAL[word];
    }
  }
  return total + current;
}
for (const [n, en, es] of [
  [0, "zero", "cero"], [7, "seven", "siete"], [16, "sixteen", "dieciséis"],
  [21, "twenty-one", "veintiuno"], [22, "twenty-two", "veintidós"], [31, "thirty-one", "treinta y uno"],
  [100, "one hundred", "cien"], [101, "one hundred one", "ciento uno"], [115, "one hundred fifteen", "ciento quince"],
  [500, "five hundred", "quinientos"], [999, "nine hundred ninety-nine", "novecientos noventa y nueve"], [1000, "one thousand", "mil"],
  [1001, "one thousand one", "mil uno"], [2000, "two thousand", "dos mil"], [21000, "twenty-one thousand", "veintiún mil"],
  [31000, "thirty-one thousand", "treinta y un mil"], [100000, "one hundred thousand", "cien mil"], [101000, "one hundred one thousand", "ciento un mil"],
  [4206, "four thousand two hundred six", "cuatro mil doscientos seis"], [87250, "eighty-seven thousand two hundred fifty", "ochenta y siete mil doscientos cincuenta"],
]) {
  same([wordsEn(n), wordsEs(n)], [en, es], `known number words for ${n}`);
  ok(enNumber(en) === n && esNumber(es) === n, `the oracle word parsers agree with the known words for ${n}`);
}
same([wordsEs(1, true), wordsEs(21, true), wordsEs(31, true)], ["un", "veintiún", "treinta y un"], "Spanish shortens uno before a noun");
for (let n = 0; n < 1000; n += 7)
  ok(enNumber(wordsEn(n)) === n && esNumber(wordsEs(n)) === n, `words round-trip ${n}`);

// ---- the oracle: a card's exact value, read from its English words ---------------------------------------------------
const must = (regex, text, type) => {
  const m = regex.exec(text);
  assert.ok(m, `cannot read ${type} card: "${text}"`);
  return m;
};
const lineFrom = (xs, ys) => {
  const [x1, x2] = xs.map(dec);
  const [y1, y2] = ys.map(dec);
  const a = qdiv(qsub(y2, y1), qsub(x2, x1));
  const b = qsub(y1, qmul(a, x1));
  xs.forEach((x, i) =>
    assert.ok(qeq(qadd(qmul(a, dec(x)), b), dec(ys[i])), "table rows are not on one line"),
  );
  return [a, b];
};
const listOf = (text) => text.split(", ");
const TABLE = /^Table: (?:x|n) is (.*) and (?:y|the output) is (.*)$/;
const SLOPE = /^y = (−?)(?:(\d*)x(?:\/(\d+))?|\((\d+)\/(\d+)\)x)(?: ([+−]) (\d+))?$/;
const N = Number;
const sgn = (m) => (m === "−" ? -1 : 1);
const neg1 = (q) => qmul(q, Q(-1));
const tenPow = (s) => pow10(N(s.replace("−", "-")));
const VERBAL = [
  [/^(\d+) more than a number n$/, (m) => [Q(1), dec(m[1])]],
  [/^(\d+) less than a number n$/, (m) => [Q(1), neg1(dec(m[1]))]],
  [/^(\d+) times a number n$/, (m) => [dec(m[1]), Q(0)]],
  [/^(\d+) more than (\d+) times a number n$/, (m) => [dec(m[2]), dec(m[1])]],
  [/^(\d+) less than (\d+) times a number n$/, (m) => [dec(m[2]), neg1(dec(m[1]))]],
  [/^(\d+) minus a number n$/, (m) => [Q(-1), dec(m[1])]],
  [/^A number n divided by 2$/, () => [Q(1, 2), Q(0)]],
];
// biome-ignore format: a dense table keeps the oracle readable as one list
const ORACLE = {
  numeral: (l) => [dec(l)],
  word: (l) => [Q(enNumber(must(/^(.*?)(?: cents?)?$/, l, "word")[1]))],
  dots: (l) => [Q(must(/^(\d+) dots?$/, l)[1])],
  tenframe: (l) => {
    const m = must(/^(Ten-frames|Ten-frame) with (\d+) counters?$/, l, "tenframe");
    assert.equal(m[1] === "Ten-frames", N(m[2]) > 10, "two frames exactly when more than ten");
    return [Q(m[2])];
  },
  sum: (l) => [l.split(" + ").map(dec).reduce(qadd)],
  skiplist: (l) => {
    const t = listOf(l).map(N);
    t.forEach((x, i) => assert.equal(x, t[0] * (i + 1), "skip count steps are equal"));
    return [Q(t.at(-1))];
  },
  groups: (l) => { const m = must(/^(\d+) circles? and (\d+) squares?$/, l, "groups"); return [Q(N(m[1]) + N(m[2]))]; },
  array: (l) => { const m = must(/^Array: (\d+) rows? of (\d+)$/, l, "array"); return [Q(N(m[1]) * N(m[2]))]; },
  prod: (l) => { const m = must(/^(\d+) × (\d+)$/, l, "prod"); return [Q(N(m[1]) * N(m[2]))]; },
  blocks: (l) => { const m = must(/^Base-ten blocks: (\d+) rods? and (\d+) cubes?$/, l, "blocks"); return [Q(10 * N(m[1]) + N(m[2]))]; },
  tens: (l) => { const m = must(/^(\d+) tens? \+ (\d+) ones?$/, l, "tens"); return [Q(10 * N(m[1]) + N(m[2]))]; },
  coins: (l) => {
    const worth = { quarter: 25, dime: 10, nickel: 5, penny: 1 };
    const total = must(/^Coins: (.*)$/, l, "coins")[1].split(", ").reduce((sum, item) => {
      const m = must(/^(\d+) (quarter|dime|nickel|penn)(?:s|y|ies)? \((\d+)¢\)$/, item, "coin");
      const each = worth[m[2] === "penn" ? "penny" : m[2]];
      assert.equal(N(m[3]), each, "the coin's printed value matches its name");
      return sum + N(m[1]) * each;
    }, 0);
    return [Q(total)];
  },
  cents: (l) => [Q(must(/^(\d+)¢$/, l)[1])],
  clock: (l) => {
    let m = /^Clock: short hand points to (\d+), long hand points to 12$/.exec(l);
    if (m) return [Q(N(m[1]) * 60, 60)];
    m = must(/^Clock: short hand halfway between (\d+) and (\d+), long hand points to 6$/, l, "clock");
    assert.equal(N(m[2]), (N(m[1]) % 12) + 1, "the hour hand sits between consecutive hours");
    return [Q(N(m[1]) * 60 + 30, 60)];
  },
  digital: (l) => { const m = must(/^(\d+):(00|30)$/, l, "digital"); return [Q(N(m[1]) * 60 + N(m[2]), 60)]; },
  timeword: (l) => {
    const m = /^(\d+) o'clock$/.exec(l);
    return m ? [Q(N(m[1]) * 60, 60)] : [Q(N(must(/^half past (\d+)$/, l, "timeword")[1]) * 60 + 30, 60)];
  },
  fracbar: (l) => {
    const one = /^Bar cut into (\d+) equal parts, (\d+) shaded$/.exec(l);
    if (one) return [Q(one[2], one[1])];
    const m = must(/^(\d+) bars, each cut into (\d+) equal parts, (\d+) parts shaded$/, l, "fracbar");
    assert.equal(N(m[1]), Math.ceil(N(m[3]) / N(m[2])), "enough bars for the shaded parts");
    return [Q(m[3], m[2])];
  },
  frac: (l) => [Q(...must(/^(\d+)\/(\d+)$/, l, "frac").slice(1))],
  fracline: (l) => { const m = must(/^Number line from 0 to (\d+), each whole cut into (\d+) equal parts, point (\d+) parts? from 0$/, l, "fracline"); return [Q(m[3], m[2])]; },
  decimal: (l) => [dec(l)],
  percent: (l) => [qdiv(dec(must(/^([\d.]+)%$/, l, "percent")[1]), Q(100))],
  hgrid: (l) => [Q(must(/^Hundred grid with (\d+) of 100 squares shaded$/, l, "hgrid")[1], 100)],
  expanded: (l) => [l.split(" + ").map(dec).reduce(qadd)],
  calc: (l) => {
    const value = Function(`"use strict"; return (${l.replaceAll("×", "*").replaceAll("÷", "/").replaceAll("−", "-")});`)();
    assert.ok(Number.isInteger(value) && value > 0, `expression ${l} is a positive whole number`);
    return [Q(value)];
  },
  ratiotable: (l) => {
    const rows = [...l.matchAll(/(\d+) [a-zé]+, (\d+) [a-zé]+/g)].map((m) => Q(m[2], m[1]));
    assert.ok(rows.length >= 3 && rows.every((r) => qeq(r, rows[0])), `ratio table rows are equivalent: ${l}`);
    return [rows[0]];
  },
  ratiostmt: (l) => { const m = must(/^(\d+) \w+ (?:in|for) (\d+) \w+$/, l, "ratiostmt"); return [Q(m[1], m[2])]; },
  unitrate: (l) => [numText(must(/^([\d./]+) \w+ per \w+$/, l, "unitrate")[1])],
  verbal: (l) => {
    for (const [regex, build] of VERBAL) { const m = regex.exec(l); if (m) return build(m); }
    throw new Error(`cannot read verbal card: ${l}`);
  },
  alg: (l) => {
    const m = must(/^(?:(\d+) − n|(−?)(\d*)n(?:\/(\d+))?(?: ([+−]) (\d+))?)$/, l, "alg");
    if (m[1]) return [Q(-1), dec(m[1])];
    return [qdiv(Q((m[2] ? -1 : 1) * N(m[3] || 1)), Q(m[4] || 1)), m[6] ? qmul(dec(m[6]), Q(sgn(m[5]))) : Q(0)];
  },
  vtable: (l) => lineFrom(...listsFrom(l)),
  ptable: (l) => {
    const [a, b] = lineFrom(...listsFrom(l));
    assert.ok(b.n === 0n, "a proportional table passes through the origin");
    return [a];
  },
  ltable: (l) => lineFrom(...listsFrom(l)),
  peq: (l) => {
    const m = must(/^y = (?:(\d+(?:\.\d+)?)x|x\/(\d+)|\((\d+)\/(\d+)\)x)$/, l, "peq");
    return [m[1] ? dec(m[1]) : m[2] ? Q(1, m[2]) : Q(m[3], m[4])];
  },
  pverbal: (l) => {
    const times = /^y is ([\d./]+) times x$/.exec(l);
    return times ? [numText(times[1])] : [Q(...must(/^y is (\d+)\/(\d+) of x$/, l, "pverbal").slice(1))];
  },
  intexpr: (l) => {
    const m = must(/^(−?\d+) ([+−]) \(?(−?\d+)\)?$/, l, "intexpr");
    return [m[2] === "+" ? qadd(dec(m[1]), dec(m[3])) : qsub(dec(m[1]), dec(m[3]))];
  },
  move: (l) => {
    const m = must(/^Number line: start at (−?\d+), arrow (\d+) steps? (right|left)$/, l, "move");
    return [qadd(dec(m[1]), Q((m[3] === "right" ? 1 : -1) * N(m[2])))];
  },
  leq: (l) => {
    const m = must(SLOPE, l, "leq");
    const size = m[4] ? Q(m[4], m[5]) : qdiv(Q(m[2] || 1), Q(m[3] || 1));
    return [m[1] ? neg1(size) : size, m[7] ? qmul(Q(m[7]), Q(sgn(m[6]))) : Q(0)];
  },
  lgraph: (l) => {
    const m = must(/^Line graph: crosses the y-axis at (−?\d+), goes (up|down) (\d+) for every (\d+) right$/, l, "lgraph");
    return [Q((m[2] === "up" ? 1 : -1) * N(m[3]), m[4]), dec(m[1])];
  },
  product10: (l) => {
    const m = must(/^\((\d+) × 10 to the power (−?\d+)\) × \((\d+) × 10 to the power (−?\d+)\)$/, l, "product10");
    return [qmul(Q(N(m[1]) * N(m[3])), qmul(tenPow(m[2]), tenPow(m[4])))];
  },
  plain: (l) => [dec(l)],
  sci: (l) => { const m = must(/^([\d.]+) × 10 to the power (−?\d+)$/, l, "sci"); return [qmul(dec(m[1]), tenPow(m[2]))]; },
};
function listsFrom(label) {
  const m = must(TABLE, label, "table");
  return [listOf(m[1]).map(clean), listOf(m[2]).map(clean)];
}
// The words on a card are what a learner (and a screen reader) gets; the oracle turns those words back into a value.
const label = (card, lang) => repLabel(card.rep, lang);
const valueOf = (card) => ORACLE[card.rep.t](label(card, "en"));

// ---- how two values relate, re-implemented from the spec (priority order matters) --------------------------------------
const digitsOf = (q) => String(q.n).split("").sort().join("");
function oracleRelation(a, b) {
  if (a.length === 2) {
    const [p, q] = a;
    const [r, s] = b;
    if (qeq(p, r) && qeq(q, s)) return "same";
    if (p.n !== 0n && qeq(p, qmul(r, Q(-1))) && qeq(q, s)) return "sign-first";
    if (qeq(p, r)) return "same-first";
    if (qeq(q, s)) return "same-second";
    if (qeq(p, s) && qeq(q, r)) return "swapped";
    return "different";
  }
  const [x, y] = [a[0], b[0]];
  if (qeq(x, y)) return "same";
  if (x.n !== 0n && qeq(x, qmul(y, Q(-1)))) return "opposite";
  if (qeq(qmul(x, y), Q(1))) return "reciprocal";
  const both = x.n !== 0n && y.n !== 0n;
  const ratio = both ? qdiv(x, y) : null;
  if (both && [Q(10), Q(100), Q(1, 10), Q(1, 100)].some((r) => qeq(r, ratio))) return "tenfold";
  if (x.d > 1n && y.d > 1n) {
    if (x.n === y.n) return "same-numerator";
    if (x.d === y.d) return "same-denominator";
  }
  if (both) {
    if (x.d === 1n && y.d === 1n && x.n > 0n && y.n > 0n && digitsOf(x) === digitsOf(y))
      return "digits";
    if (qeq(ratio, Q(2)) || qeq(ratio, Q(1, 2))) return "scale";
  }
  const gap = qmul(qabs(qsub(x, y)), Q(4));
  return qle(gap, qabs(x)) || qle(gap, qabs(y)) ? "close" : "different";
}

// ---- per-grade limits, declared up front ---------------------------------------------------------------------------------
// maxAbs: largest |value| on any card; maxDen: largest reduced denominator; neg: negative values allowed.
const LIMITS = {
  0: { maxAbs: 20, maxDen: 1, neg: false },
  1: { maxAbs: 20, maxDen: 2, neg: false },
  2: { maxAbs: 99, maxDen: 1, neg: false },
  3: { maxAbs: 64, maxDen: 8, neg: false },
  4: { maxAbs: 99999, maxDen: 100, neg: false },
  5: { maxAbs: 99, maxDen: 100, neg: false },
  6: { maxAbs: 99, maxDen: 200, neg: true },
  7: { maxAbs: 12, maxDen: 5, neg: true },
  8: { maxAbs: 1e9, maxDen: 1e7, neg: true },
};
const toNumber = (q) => Number(q.n) / Number(q.d);

// ---- the board checks ------------------------------------------------------------------------------------------------------
const ids = (round) => round.cards.map((c) => c.id);
function countMatchings(values, size) {
  const eqAll = (group) => group.every((i) => key(values[i]) === key(values[group[0]]));
  const open = new Set(values.keys());
  const walk = () => {
    if (!open.size) return 1;
    const first = Math.min(...open);
    open.delete(first);
    let total = 0;
    const others = [...open];
    const choose = (start, picked) => {
      if (picked.length === size - 1) {
        if (!eqAll([first, ...picked])) return;
        picked.forEach((i) => open.delete(i));
        total += walk();
        picked.forEach((i) => open.add(i));
        return;
      }
      for (let k = start; k < others.length; k += 1) choose(k + 1, [...picked, others[k]]);
    };
    choose(0, []);
    open.add(first);
    return total;
  };
  return walk();
}

const catalogue = new Set();
const seenMistake = new Map();
function expectedMistake(groups, values) {
  for (const group of groups)
    for (let i = 0; i < group.length; i += 1)
      for (let j = i + 1; j < group.length; j += 1) {
        const kind = oracleRelation(values[group[i]], values[group[j]]);
        if (kind !== "same") return kind;
      }
  return null;
}

// Names of manipulatives contain number words (a ten-frame) without stating any value on the board.
const TOOL_NAMES = /ten-frames?|cuadros? de diez|base[- ](?:ten|diez)/gi;
const SIZE = { 1: 6, 2: 8, 3: 12 };
const rng = (skill, level, seed) => makeRng(seedFrom("mm-test", skill, level, seed));
const numberTokens = (text) => text.match(/\d+(?:\.\d+)?/g) || [];
const enWordsFor = (n) => (n >= 0 && n < 1000 ? wordsEn(n) : null);
const esWordsFor = (n) => (n >= 0 && n < 1000 ? wordsEs(n) : null);
const standalone = (text, token) =>
  new RegExp(
    `(?<![\\w.,/−-])${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w./]| [+−] \\d)`,
    "i",
  ).test(text);

function checkBoard(skill, level, grade, seed) {
  const round = game.makeRound(skill.id, level, rng(skill.id, level, seed), grade);
  const tag = `${skill.id} L${level} g${grade} #${seed}`;
  same(JSON.parse(JSON.stringify(round)), round, `${tag}: round is JSON-serializable`);
  same(game.makeRound(skill.id, level, rng(skill.id, level, seed), grade), round, `${tag}: same seed, same board`);
  ok(round.cards.length === SIZE[level], `${tag}: ${SIZE[level]} cards`);
  ok(round.setSize === (level === 3 ? 3 : 2), `${tag}: set size ${level === 3 ? 3 : 2}`);
  same(ids(round), [...round.cards.keys()], `${tag}: card ids are board positions`);
  const values = round.cards.map(valueOf);
  const keys = values.map(key);
  const bySet = new Map();
  round.cards.forEach((card, i) => bySet.set(card.set, [...(bySet.get(card.set) || []), i]));
  ok(bySet.size === round.cards.length / round.setSize, `${tag}: number of sets`);
  const setKeys = [];
  for (const [set, members] of bySet) {
    ok(members.length === round.setSize, `${tag}: set ${set} has ${round.setSize} cards`);
    ok(new Set(members.map((i) => keys[i])).size === 1, `${tag}: set ${set}: every card has the same exact value (oracle)`);
    ok(new Set(members.map((i) => round.cards[i].kind)).size === round.setSize, `${tag}: one card per representation in a set`);
    setKeys.push(keys[members[0]]);
  }
  ok(new Set(setKeys).size === bySet.size, `${tag}: no two sets share a value`);
  const labels = round.cards.map((c) => label(c, "en"));
  ok(new Set(labels).size === labels.length, `${tag}: no two cards read the same`);
  ok(countMatchings(values, round.setSize) === 1, `${tag}: exactly one perfect matching under the independent equivalence`);

  const limit = LIMITS[grade];
  for (const value of values.flat()) {
    ok(Math.abs(toNumber(value)) <= limit.maxAbs, `${tag}: |value| within ${limit.maxAbs}`);
    ok(Number(value.d) <= limit.maxDen, `${tag}: denominator within ${limit.maxDen}`);
    ok(limit.neg || value.n >= 0n, `${tag}: no negative values below grade 6`);
  }
  for (const card of round.cards) {
    const en = label(card, "en");
    const es = label(card, "es");
    ok(en.trim() && es.trim(), `${tag}: both languages have words for card ${card.id}`);
    same(numberTokens(es).sort(), numberTokens(en).sort(), `${tag}: Spanish card ${card.id} carries the same numbers`);
    if (/[a-z]{3}/i.test(en.replace(/\b(power|mile|dollar)\b/g, "")))
      ok(es !== en, `${tag}: Spanish differs from English for "${en}"`);
    if (card.rep.t === "word")
      ok(card.rep.unit ? true : enNumber(en) === esNumber(es), `${tag}: Spanish number word agrees with English`);
    if (card.rep.t === "vtable" && grade === 6)
      for (const y of listsFrom(en)[1])
        ok(!y.startsWith("-"), `${tag}: grade 6 tables have no negative outputs`);
  }
  ok(round.prompt.en && round.prompt.es && round.prompt.en !== round.prompt.es, `${tag}: bilingual prompt`);

  // check() accepts the game's solution and every other correct arrangement, in any order.
  const solved = game.solve(round);
  ok(game.check(round, solved).correct, `${tag}: solve() is accepted`);
  const reshuffled = [...solved.groups].reverse().map((g) => [...g].reverse());
  ok(game.check(round, { groups: reshuffled, turns: 9 }).correct, `${tag}: any order of correct groups is accepted`);
  ok(solved.groups.every((g) => new Set(g.map((i) => keys[i])).size === 1), `${tag}: the solution groups agree with the oracle`);
  same(round.keys.length, bySet.size, `${tag}: one answer key per set`);
  ok(game.answerText(round).length > 0, `${tag}: answerText`);

  // plausible wrong answers are rejected, and the feedback names the mix-up the oracle finds.
  const g0 = solved.groups[0];
  const g1 = solved.groups[1];
  const swapped = solved.groups.map((g) => [...g]);
  [swapped[0][0], swapped[1][0]] = [swapped[1][0], swapped[0][0]];
  const bad = game.check(round, { groups: swapped });
  ok(!bad.correct && bad.mistake === expectedMistake(swapped, values), `${tag}: swapping two cards is rejected as "${bad.mistake}"`);
  for (const response of [
    { groups: solved.groups.slice(0, -1) },
    { groups: solved.groups.map((g) => g.slice(0, -1)) },
    { groups: [...solved.groups, solved.groups[0]] },
    { groups: [[...g0, ...g1], ...solved.groups.slice(2)] },
    { groups: [] },
  ])
    ok(!game.check(round, response).correct, `${tag}: an incomplete or malformed arrangement is rejected`);
  for (const response of [
    null,
    undefined,
    "x",
    5,
    {},
    { groups: "x" },
    { groups: [[-1, 99]] },
    { groups: [[0, 0]] },
    { tried: [0] },
    { tried: "ab" },
  ]) {
    const result = game.check(round, response);
    ok(!result.correct && result.mistake === "malformed" && result.feedback.en && result.feedback.es, `${tag}: junk input is rejected as malformed`);
    catalogue.add(result.mistake);
  }
  const all = ids(round);
  for (let a = 0; a < all.length; a += 1)
    for (let b = a + 1; b < all.length; b += 1) {
      const result = game.check(round, { groups: [], tried: [a, b] });
      const expected = expectedMistake([[a, b]], values) || "incomplete";
      ok(!result.correct && result.mistake === expected, `${tag}: tried [${a},${b}] is "${expected}", got "${result.mistake}"`);
      ok(result.feedback.en?.trim() && result.feedback.es?.trim(), `${tag}: feedback in both languages`);
      catalogue.add(result.mistake);
      seenMistake.set(result.mistake, result.feedback);
    }

  // hints: tiers 0-2 never leak a value from the board; tier 3 states the whole solution; text differs by tier.
  const hints = [0, 1, 2, 3].map((tier) => game.hint(round, tier, null));
  hints.forEach((h, tier) =>
    ok(h.en?.trim() && h.es?.trim(), `${tag}: hint ${tier} in both languages`),
  );
  ok(new Set(hints.map((h) => h.en)).size === 4 && new Set(hints.map((h) => h.es)).size === 4, `${tag}: hints differ by tier`);
  const answer = game.answerText(round);
  for (const tier of [0, 1, 2]) {
    for (const lang of ["en", "es"]) {
      const text = hints[tier][lang];
      ok(!text.includes(answer), `${tag}: hint ${tier} (${lang}) does not state the answer`);
      for (const k of round.keys) {
        if (!/^\d+$/.test(k))
          ok(!standalone(text, k), `${tag}: hint ${tier} (${lang}) does not contain the value "${k}"`);
        for (const token of numberTokens(k))
          ok(!standalone(text, token), `${tag}: hint ${tier} (${lang}) has no standalone ${token} from "${k}"`);
        if (/^\d+$/.test(k) && Number(k) < 1000) {
          const prose = text.replace(TOOL_NAMES, " ");
          const word = (lang === "en" ? enWordsFor : esWordsFor)(Number(k));
          if (word)
            ok(!new RegExp(`(^|[^\\p{L}-])${word}([^\\p{L}-]|$)`, "iu").test(prose), `${tag}: hint ${tier} (${lang}) does not say "${word}"`);
        }
      }
    }
  }
  ok(hints[3].en.includes(answer) && hints[3].es.includes(answer), `${tag}: hint 3 states the solution`);
  round.cards.forEach((c) =>
    ok(hints[3].en.includes(label(c, "en")) && hints[3].es.includes(label(c, "es")), `${tag}: hint 3 lists card ${c.id}`, ));
  const practice = [...hints[2].en.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  if (practice.length) {
    ok(practice.length === round.setSize, `${tag}: the practice set has ${round.setSize} cards`);
    const types = round.kinds.map((kind) => round.cards.find((c) => c.kind === kind).rep.t);
    const practiceValues = practice.map((text, i) => ORACLE[types[i]](text));
    ok(practiceValues.every((v) => key(v) === key(practiceValues[0])), `${tag}: the practice set in hint 2 is itself a true set (oracle)`);
    ok(!keys.includes(key(practiceValues[0])), `${tag}: the practice set is not on the board`);
  }
  return { round, values, keys };
}

// ---- pictures agree with their words (FM-059) ------------------------------------------------------------------------------
const count = (html, cls) => (html.match(new RegExp(`class="[^"]*\\b${cls}\\b`, "g")) || []).length;
const attr = (html, cls, name) =>
  [...html.matchAll(new RegExp(`class="${cls}[^"]*"[^>]*?${name}="([^"]+)"`, "g"))].map(
    (m) => m[1],
  );
const svgNumbers = (html) =>
  [...html.matchAll(/<text[^>]*>([^<]*)<\/text>/g)]
    .map((m) => m[1])
    .filter((t) => /^[−\d.]+$/.test(t));
function checkPicture(card, value, lang = "en") {
  const rep = card.rep;
  const words = label(card, lang);
  const head =
    rep.t === "ratiotable"
      ? [RATIO_CTX[rep.ctx].den[lang][1], RATIO_CTX[rep.ctx].num[lang][1]]
      : [];
  const html = drawFace(rep, words, { uid: card.id, head });
  const tag = `${rep.t} "${label(card, "en")}"`;
  const v = Number(value[0].n) / Number(value[0].d);
  switch (rep.t) {
    case "dots":
      ok(count(html, "mm-dot") === v, `${tag}: dots drawn`);
      break;
    case "tenframe":
      ok(count(html, "mm-counter") === v && count(html, "mm-cell") === (v > 10 ? 20 : 10), `${tag}: counters and frames drawn`);
      break;
    case "groups":
      ok(count(html, "mm-circle") + count(html, "mm-square") === v, `${tag}: shapes drawn`);
      break;
    case "array":
      ok(count(html, "mm-array-dot") === v, `${tag}: array dots drawn`);
      break;
    case "blocks":
      ok(count(html, "mm-rod") * 10 + count(html, "mm-cube") === v, `${tag}: rods and cubes drawn`);
      break;
    case "coins":
      ok(attr(html, "mm-coin", "data-cents").reduce((s, c) => s + Number(c), 0) === v, `${tag}: coins drawn`);
      break;
    case "clock": {
      const [h, m] = [Math.floor(v), Math.round((v % 1) * 60)];
      ok(
        Number(attr(html, "mm-hour-hand", "data-angle")[0]) === (h % 12) * 30 + m * 0.5 &&
          Number(attr(html, "mm-min-hand", "data-angle")[0]) === m * 6,
        `${tag}: hand angles`,
      );
      break;
    }
    case "fracbar":
      ok(
        count(html, "mm-on") === Number(value[0].n * BigInt(rep.d)) / Number(value[0].d) &&
          count(html, "mm-part") === Math.ceil(rep.n / rep.d) * rep.d,
        `${tag}: parts drawn`,
      );
      break;
    case "fracline": {
      const cx = Number(/class="mm-point" cx="([\d.]+)"/.exec(html)[1]);
      ok(Math.abs(cx - (10 + (100 / rep.max) * v)) < 0.01, `${tag}: point position`);
      break;
    }
    case "hgrid":
      ok(count(html, "mm-on") === Math.round(v * 100), `${tag}: squares shaded`);
      break;
    case "move": {
      const m = /Number line: start at (−?\d+), arrow (\d+) steps? (right|left)/.exec(
        label(card, "en"),
      );
      const from = Number(m[1].replace("−", "-"));
      ok(
        Number(attr(html, "mm-arrow", "data-from")[0]) === from &&
          Number(attr(html, "mm-arrow", "data-to")[0]) === v,
        `${tag}: arrow runs from the start to the result`,
      );
      break;
    }
    case "lgraph": {
      const [slope] = attr(html, "mm-graph-line", "data-slope");
      const [b] = attr(html, "mm-graph-line", "data-b");
      const [mn, md] = slope.split("/");
      ok(qeq(Q(mn, md), value[0]) && qeq(dec(b), value[1]), `${tag}: slope and intercept drawn`);
      break;
    }
    case "vtable":
    case "ptable":
    case "ltable": {
      const shown = svgNumbers(html);
      const expected = numberTokens(words.replace(/−/g, "-")).length;
      const [xs, ys] = listsFrom(words);
      same(shown, [...xs, ...ys].map((t) => t.replace("-", "−")), `${tag}: table cells show the label's numbers`);
      ok(expected >= 6, `${tag}: table is complete`);
      break;
    }
    case "ratiotable":
      same(svgNumbers(html), [...words.matchAll(/(\d+) [a-zé]+, (\d+) [a-zé]+/g)].flatMap((m) => [m[1], m[2]]), `${tag}: ratio table cells`);
      break;
    default:
      ok(html.includes("mm-face"), `${tag}: text face`);
  }
}

// ---- run ----------------------------------------------------------------------------------------------------------------------
ok(validateGame(game).length === 0, `game honors the contract: ${validateGame(game)}`);
ok(game.mechanic === "representation-concentration" && game.order === 2 && game.id === "math-match", "identity");
ok(game.skills.length >= 14, "at least 14 skills");
for (let grade = 0; grade <= 8; grade += 1)
  ok(game.skills.filter((s) => s.grades[0] <= grade && grade <= s.grades[1]).length >= 2, `grade ${grade} has at least two skills`);
for (const skill of game.skills)
  ok(/^(K|[1-8])\.[A-Z]{1,3}\.[A-Z]\.\d+[a-z]?$/.test(skill.standard), `${skill.id}: standards code ${skill.standard}`);
ok(game.howTo.en.length >= 3 && game.howTo.es.length === game.howTo.en.length, "how to play in both languages");
ok(new URL(game.cssHref).pathname.endsWith("/math-match/game.css"), "css href");

const SEEDS = Number(process.env.MM_SEEDS || 40);
const proxies = new Map();
const fingerprints = new Map();
let rounds = 0;
for (const skill of game.skills) {
  for (let grade = skill.grades[0]; grade <= skill.grades[1]; grade += 1) {
    for (let level = 1; level <= 3; level += 1) {
      for (let seed = 1; seed <= SEEDS; seed += 1) {
        const { round, values } = checkBoard(skill, level, grade, seed);
        rounds += 1;
        if (seed <= 6) round.cards.forEach((card, i) => checkPicture(card, values[i]));
        // difficulty proxy: cards on the board times (1 + near-miss pairs the oracle can see between different sets)
        let near = 0;
        for (let a = 0; a < values.length; a += 1)
          for (let b = a + 1; b < values.length; b += 1)
            if (
              round.cards[a].set !== round.cards[b].set &&
              oracleRelation(values[a], values[b]) !== "different"
            )
              near += 1;
        const bucket = `${skill.id}:${level}`;
        proxies.set(bucket, [...(proxies.get(bucket) || []), round.cards.length * (1 + near)]);
      }
      for (let seed = 1; seed <= 100; seed += 1) {
        const round = game.makeRound(
          skill.id,
          level,
          rng(skill.id, level, 1000 + seed),
          skill.grades[0],
        );
        const fp = JSON.stringify([round.kinds, round.cards.map((c) => c.rep)]);
        fingerprints.set(
          `${skill.id}:${level}`,
          (fingerprints.get(`${skill.id}:${level}`) || new Set()).add(fp),
        );
      }
    }
  }
  const mean = (level) =>
    proxies.get(`${skill.id}:${level}`).reduce((a, b) => a + b, 0) /
    proxies.get(`${skill.id}:${level}`).length;
  ok(mean(1) < mean(2) && mean(2) < mean(3), `${skill.id}: difficulty proxy rises L1 ${mean(1).toFixed(1)} < L2 ${mean(2).toFixed(1)} < L3 ${mean(3).toFixed(1)}`);
  for (let level = 1; level <= 3; level += 1)
    ok(fingerprints.get(`${skill.id}:${level}`).size >= 30, `${skill.id} L${level}: at least 30 distinct boards in 100 seeds (${fingerprints.get(`${skill.id}:${level}`).size})`);
}

// ---- the named mix-ups, each proven on hand-picked cards ----------------------------------------------------------------------
const pair = (a, b) => ({
  v: 1,
  skillId: "g3-fraction",
  level: 1,
  grade: 3,
  setSize: 2,
  kinds: ["x", "y"],
  meta: {},
  keys: ["a"],
  cards: [
    { id: 0, set: 0, kind: "x", rep: a },
    { id: 1, set: 0, kind: "y", rep: b },
  ],
  prompt: { en: "p", es: "p" },
});
const frac = (n, d) => ({ t: "frac", n, d });
const KNOWN = [
  ["reciprocal", frac(3, 4), frac(4, 3)],
  ["same-numerator", frac(1, 2), frac(1, 3)],
  ["same-denominator", frac(3, 4), frac(5, 4)],
  ["tenfold", { t: "decimal", text: "0.75" }, { t: "decimal", text: "0.075" }],
  ["tenfold", { t: "percent", text: "7.5" }, { t: "percent", text: "75" }],
  ["digits", { t: "numeral", n: 34 }, { t: "numeral", n: 43 }],
  ["opposite", { t: "numeral", n: 3 }, { t: "numeral", n: -3 }],
  ["scale", { t: "numeral", n: 6 }, { t: "numeral", n: 12 }],
  ["close", { t: "numeral", n: 7 }, { t: "numeral", n: 8 }],
  ["different", { t: "numeral", n: 3 }, { t: "numeral", n: 40 }],
  ["sign-first", { t: "leq", mn: 2, md: 1, b: 1 }, { t: "leq", mn: -2, md: 1, b: 1 }],
  ["same-first", { t: "leq", mn: 2, md: 1, b: 1 }, { t: "leq", mn: 2, md: 1, b: 3 }],
  ["same-second", { t: "leq", mn: 2, md: 1, b: 1 }, { t: "leq", mn: 3, md: 1, b: 1 }],
  ["swapped", { t: "alg", a: 5, ad: 1, b: 2 }, { t: "alg", a: 2, ad: 1, b: 5 }],
  ["different", { t: "alg", a: 5, ad: 1, b: 2 }, { t: "alg", a: 3, ad: 1, b: 9 }],
];
for (const [mistake, a, b] of KNOWN) {
  const round = pair(a, b);
  const result = game.check(round, { groups: [], tried: [0, 1] });
  ok(!result.correct && result.mistake === mistake, `known pair is named "${mistake}" (got ${result.mistake})`);
  ok(oracleRelation(ORACLE[a.t](repLabel(a, "en")), ORACLE[b.t](repLabel(b, "en"))) === mistake, `the oracle names the same pair "${mistake}"`);
  catalogue.add(result.mistake);
  seenMistake.set(result.mistake, result.feedback);
}
ok(game.check(pair(frac(3, 4), frac(6, 8)), { groups: [], tried: [0, 1] }).mistake === "incomplete", "a matching tried set is reported as incomplete, not as an error");
same(
  [...catalogue].sort(),
  [
    "close",
    "different",
    "digits",
    "incomplete",
    "malformed",
    "opposite",
    "reciprocal",
    "same-denominator",
    "same-first",
    "same-numerator",
    "same-second",
    "scale",
    "sign-first",
    "swapped",
    "tenfold",
  ].sort(),
  "every catalogued mix-up was exercised",
);
seenMistake.set("malformed", game.check(pair(frac(1, 2), frac(1, 2)), null).feedback);
const specific = new Set([...seenMistake.values()].map((f) => f.en));
ok(specific.size === seenMistake.size, "each mix-up has its own feedback text");
for (const feedback of seenMistake.values()) {
  ok(feedback.es && feedback.es !== feedback.en, "feedback has its own Spanish");
  ok(!/\d/.test(feedback.en), "feedback names a mix-up without printing a value");
}

console.log(`PASS math-match: ${rounds} boards, ${checks} checks`);
