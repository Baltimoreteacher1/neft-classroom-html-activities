// biome-ignore-all format: dense one-line assertions keep this suite readable and inside the file-size cap
// Math suite for Family Math Duel (game 10). Everything is re-derived HERE with BigInt rationals and an expression
// parser written in this file: a seat's value is read from the expression the learner SEES (cards substituted into the
// printed layout) and evaluated by the parser, never by the game's evaluator. The oracle then enumerates every legal
// arrangement, re-derives Orbit's documented strategy (including its first move), replays every move for legality and
// turn order, and checks that check() agrees on every legal play it can enumerate and rejects each catalogued mistake
// with its own named feedback. Hints are tested for leaks and for the truth of their strategy claims.
// @fm2 FM-016 FM-017 FM-019 FM-020 FM-027 FM-032 FM-033 FM-050 FM-051 FM-052 FM-053 FM-054 FM-055 FM-056 FM-057 FM-058 FM-059 FM-060 FM-061 FM-062 FM-063 FM-065 FM-079
import assert from "node:assert/strict";
import * as coach from "../../math/fluency-lab/family/fm2/coach.js";
import { GRADES, validateGame } from "../../math/fluency-lab/family/fm2/contract.js";
import { pickArrangement, pickMove, replay } from "../../math/fluency-lab/family/fm2/games/family-math-duel/engine.js";
import { FEEDBACK } from "../../math/fluency-lab/family/fm2/games/family-math-duel/feedback.js";
import game from "../../math/fluency-lab/family/fm2/games/family-math-duel/index.js";
import { scoreOf } from "../../math/fluency-lab/family/fm2/games/family-math-duel/logic.js";
import { fillLayout, slotKinds } from "../../math/fluency-lab/family/fm2/games/family-math-duel/templates.js";
import { makeRng, seedFrom } from "../../math/fluency-lab/family/fm2/rng.js";

const started = Date.now();
let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks += 1; };
const same = (a, b, m) => { assert.deepEqual(a, b, m); checks += 1; };

// ---- exact rationals on BigInt -----------------------------------------------------------------------------------
const gcdB = (a, b) => { let x = a < 0n ? -a : a; let y = b < 0n ? -b : b; while (y) [x, y] = [y, x % y]; return x || 1n; };
const Q = (n, d = 1n) => { let t = BigInt(n); let b = BigInt(d); assert.ok(b !== 0n, "zero denominator"); if (b < 0n) [t, b] = [-t, -b]; const g = gcdB(t, b); return { n: t / g, d: b / g }; };
const qadd = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d);
const qsub = (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d);
const qmul = (a, b) => Q(a.n * b.n, a.d * b.d);
const qdiv = (a, b) => Q(a.n * b.d, a.d * b.n);
const qeq = (a, b) => a.n === b.n && a.d === b.d;
const qcmp = (a, b) => { const x = a.n * b.d; const y = b.n * a.d; return x < y ? -1 : x > y ? 1 : 0; };
const qabs = (a) => Q(a.n < 0n ? -a.n : a.n, a.d);
const qneg = (a) => Q(-a.n, a.d);
const qstr = (a) => (a.d === 1n ? String(a.n) : `${a.n}/${a.d}`);
const qdisp = (a) => qstr(a).replace("-", "−");
const ZERO = Q(0n);
const fromGame = (q) => Q(q.n, q.d);
const parseNum = (text) => {
  const t = String(text).replaceAll("−", "-").trim();
  let m = /^(-?)(\d+) (\d+)\/(\d+)$/.exec(t);
  if (m) { const v = qadd(Q(BigInt(m[2])), Q(BigInt(m[3]), BigInt(m[4]))); return m[1] ? qneg(v) : v; }
  m = /^(-?\d+)\/(\d+)$/.exec(t);
  if (m) return Q(BigInt(m[1]), BigInt(m[2]));
  m = /^(-?)(\d*)(?:\.(\d+))?$/.exec(t);
  assert.ok(m && (m[2] || m[3]), `not a number: ${text}`);
  const frac = m[3] || "";
  const v = Q(BigInt(`${m[2] || "0"}${frac}`), 10n ** BigInt(frac.length));
  return m[1] ? qneg(v) : v;
};
const isqrt = (n) => { let x = BigInt(Math.floor(Math.sqrt(Number(n)))); while (x * x > n) x -= 1n; while ((x + 1n) * (x + 1n) <= n) x += 1n; return x; };
const qpow = (b, e) => { assert.ok(e.d === 1n, "integer exponent"); let out = Q(1n); for (let i = 0n; i < (e.n < 0n ? -e.n : e.n); i += 1n) out = qmul(out, b); return e.n < 0n ? qdiv(Q(1n), out) : out; };

// ---- the independent expression parser: evaluates the text a learner reads ----------------------------------------
function evalText(text) {
  const src = text.replaceAll("−", "-").replaceAll("×", "*").replaceAll("÷", "/");
  const pct = /^(.+?)% of (.+)$/.exec(src);
  if (pct) return qmul(qdiv(evalText(pct[1]), Q(100n)), evalText(pct[2]));
  const toks = src.match(/\d+(?:\.\d+)?|[()+\-*/^√|]/g);
  assert.equal(toks.join(""), src.replace(/\s+/g, ""), `unparsed text in "${text}"`);
  let i = 0;
  const peek = () => toks[i];
  const eat = (t) => { assert.equal(toks[i], t, `expected ${t} in ${text}`); i += 1; };
  function expr() { let v = term(); while (peek() === "+" || peek() === "-") { const op = toks[i++]; const r = term(); v = op === "+" ? qadd(v, r) : qsub(v, r); } return v; }
  function term() { let v = power(); while (peek() === "*" || peek() === "/") { const op = toks[i++]; const r = power(); v = op === "*" ? qmul(v, r) : qdiv(v, r); } return v; }
  function power() { const b = unary(); if (peek() === "^") { i += 1; return qpow(b, unary()); } return b; }
  function unary() {
    if (peek() === "-") { i += 1; return qneg(unary()); }
    if (peek() === "√") { i += 1; const v = unary(); assert.ok(v.d === 1n && v.n >= 0n && isqrt(v.n) ** 2n === v.n, "perfect square"); return Q(isqrt(v.n)); }
    return atom();
  }
  function atom() {
    if (peek() === "(") { i += 1; const v = expr(); eat(")"); return v; }
    if (peek() === "|") { i += 1; const v = expr(); eat("|"); return qabs(v); }
    return parseNum(toks[i++]);
  }
  const value = expr();
  assert.equal(i, toks.length, `trailing tokens in ${text}`);
  return value;
}

// ---- the independent layout table and a second, closed-form evaluator ---------------------------------------------------
const LAYOUT = { single: "{0}", sum2: "{0} + {1}", sum3: "{0} + {1} + {2}", sum4: "{0} + {1} + {2} + {3}", num2: "{0}{1}", num3: "{0}{1}{2}", num4: "{0}{1}{2}{3}", dsum2: "{0}{1} + {2}{3}", ddiff2: "|{0}{1} − {2}{3}|", prod2: "{0} × {1}", prodsum: "{0} × {1} + {2}", paren: "({0} + {1}) × {2}", ops3: "{0} {1} {2} {3} {4}", frac2: "{0} / {1}", fracdiv: "({0} / {1}) ÷ ({2} / {3})", pct: "{0}% of {1}", pow: "{0}^{1}", powsum: "{0}^{1} + {2}^{3}", sci: "{0} × 10^{1}", root2: "√{0} + √{1}", root3: "√{0} + √{1} + √{2}" };
const KINDS = { single: ["num"], sum2: ["num", "num"], sum3: ["num", "num", "num"], sum4: ["num", "num", "num", "num"], num2: ["num", "num"], num3: ["num", "num", "num"], num4: ["num", "num", "num", "num"], dsum2: ["num", "num", "num", "num"], ddiff2: ["num", "num", "num", "num"], prod2: ["num", "num"], prodsum: ["num", "num", "num"], paren: ["num", "num", "num"], ops3: ["num", "op", "num", "op", "num"], frac2: ["num", "num"], fracdiv: ["num", "num", "num", "num"], pct: ["num", "num"], pow: ["num", "exp"], powsum: ["num", "exp", "num", "exp"], sci: ["num", "exp"], root2: ["num", "num"], root3: ["num", "num", "num"] };
const DIGITS = new Set(["num2", "num3", "num4", "dsum2", "ddiff2"]);
const cardVal = (c) => (c.kind === "op" ? c.op : parseNum(c.text));
const wrap = (text) => { if (/^\d+ \d+\/\d+$/.test(text)) { const q = parseNum(text); return `(${q.n}/${q.d})`; } return /[/−]/.test(text) ? `(${text})` : text; };
const textOf = (round, slots) => LAYOUT[round.tpl].replace(/\{(\d)\}/g, (_, i) => (DIGITS.has(round.tpl) ? round.cards[slots[i]].text : round.cards[slots[i]].kind === "op" ? round.cards[slots[i]].op : wrap(round.cards[slots[i]].text)));
const shownText = (round, slots) => LAYOUT[round.tpl].replace(/\{(\d)\}/g, (_, i) => (round.cards[slots[i]].kind === "op" ? round.cards[slots[i]].op : round.cards[slots[i]].text));
const slowValue = (round, slots) => evalText(textOf(round, slots));
function fastValue(round, slots) {
  const v = slots.map((id) => cardVal(round.cards[id]));
  const dg = (...d) => d.reduce((a, x) => qadd(qmul(a, Q(10n)), x), ZERO);
  const ap = (x, o, y) => (o === "+" ? qadd(x, y) : o === "−" ? qsub(x, y) : qmul(x, y));
  switch (round.tpl) {
    case "single": return v[0];
    case "sum2": case "sum3": case "sum4": case "root2": case "root3": if (round.tpl.startsWith("root")) return v.map((x) => Q(isqrt(x.n))).reduce(qadd); return v.reduce(qadd);
    case "num2": case "num3": case "num4": return dg(...v);
    case "dsum2": return qadd(dg(v[0], v[1]), dg(v[2], v[3]));
    case "ddiff2": return qabs(qsub(dg(v[0], v[1]), dg(v[2], v[3])));
    case "prod2": return qmul(v[0], v[1]);
    case "prodsum": return qadd(qmul(v[0], v[1]), v[2]);
    case "paren": return qmul(qadd(v[0], v[1]), v[2]);
    case "ops3": return v[3] === "×" && v[1] !== "×" ? ap(v[0], v[1], ap(v[2], v[3], v[4])) : ap(ap(v[0], v[1], v[2]), v[3], v[4]);
    case "frac2": return qdiv(v[0], v[1]);
    case "fracdiv": return qdiv(qmul(v[0], v[3]), qmul(v[1], v[2]));
    case "pct": return qmul(qdiv(v[0], Q(100n)), v[1]);
    case "pow": return qpow(v[0], v[1]);
    case "powsum": return qadd(qpow(v[0], v[1]), qpow(v[2], v[3]));
    case "sci": return qmul(v[0], qpow(Q(10n), v[1]));
    default: throw new Error(`no oracle for ${round.tpl}`);
  }
}
const dist = (goal, v) => (goal.type === "max" ? qneg(v) : goal.type === "min" ? v : qabs(qsub(v, fromGame(goal.target))));
const winner = (goal, a, b) => { const c = qcmp(dist(goal, a), dist(goal, b)); return c < 0 ? 0 : c > 0 ? 1 : 2; };

// every injective way of putting the given cards into a template's slots
function arrangements(round, ids) {
  const kinds = KINDS[round.tpl];
  const out = [];
  const work = Array(kinds.length).fill(null);
  const used = new Set();
  (function go(k) {
    if (k === kinds.length) { out.push(work.slice()); return; }
    for (const id of ids) {
      if (used.has(id) || round.cards[id].kind !== kinds[k]) continue;
      used.add(id); work[k] = id; go(k + 1); used.delete(id);
    }
  })(0);
  return out;
}
const withValues = (round, ids, fast = true) => arrangements(round, ids).map((slots) => { const v = (fast ? fastValue : slowValue)(round, slots); return { slots, v, d: dist(round.goal, v) }; });

// ---- Orbit, re-derived from its documented strategy ------------------------------------------------------------------------
const lexCmp = (a, b) => { for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return a[i] - b[i]; return 0; };
const firstWorse = (list) => list.find((c) => qcmp(c.d, list[0].d) > 0) || list[0];
function oracleOpenPick(round, ARR, seatSlots, avail, lax) {
  const kinds = KINDS[round.tpl];
  const list = [];
  for (const card of [...avail].sort((a, b) => a - b)) {
    for (let slot = 0; slot < kinds.length; slot += 1) {
      if (seatSlots[slot] !== null || kinds[slot] !== round.cards[card].kind) continue;
      const rest = new Set(avail.filter((x) => x !== card));
      let best = null;
      for (const a of ARR) {
        if (a.slots[slot] !== card) continue;
        if (!a.slots.every((id, i) => (seatSlots[i] !== null ? id === seatSlots[i] : i === slot || rest.has(id)))) continue;
        if (best === null || qcmp(a.d, best) < 0) best = a.d;
      }
      list.push({ card, slot, d: best });
    }
  }
  list.sort((a, b) => qcmp(a.d, b.d) || a.card - b.card || a.slot - b.slot);
  const pick = lax ? firstWorse(list) : list[0];
  return [pick.card, pick.slot];
}
function oraclePrivatePick(round, ARR, hand, lax) {
  const list = ARR.filter((a) => a.slots.every((id) => hand.includes(id))).sort((a, b) => qcmp(a.d, b.d) || lexCmp(a.slots, b.slots));
  return (lax ? firstWorse(list) : list[0]).slots;
}
// Replays a record's moves (no Fair play) and says what Orbit should have done at each of its turns.
function verifyOrbit(round, ARR, moves) {
  const slotsOf = [Array(KINDS[round.tpl].length).fill(null), Array(KINDS[round.tpl].length).fill(null)];
  const taken = new Set();
  let orbitPicks = 0;
  let turn = round.first;
  const firstMoves = [];
  if (round.variant === "private") {
    const seat1 = moves.filter((m) => m[0] === 1);
    const expected = oraclePrivatePick(round, ARR, round.deal[1], Boolean(round.orbit.lax[0]));
    same(seat1.sort((a, b) => a[2] - b[2]).map((m) => m[1]), expected, "Orbit's private arrangement matches the oracle");
    return { first: expected };
  }
  for (const [seat, card, slot] of moves) {
    if (slotsOf[turn].every((c) => c !== null)) turn = 1 - turn;
    ok(seat === turn, "moves alternate, starting with round.first");
    if (seat === 1) {
      const avail = round.pool.filter((id) => !taken.has(id));
      const [c, s] = oracleOpenPick(round, ARR, slotsOf[1], avail, Boolean(round.orbit.lax[orbitPicks]));
      same([card, slot], [c, s], `Orbit pick ${orbitPicks + 1} matches the oracle`);
      if (orbitPicks === 0) firstMoves.push([c, s]);
      orbitPicks += 1;
    }
    slotsOf[seat][slot] = card;
    taken.add(card);
    turn = 1 - seat;
  }
  return { first: firstMoves[0] };
}

// ---- oracle replay of a full record: legality, turn order, values, outcome ------------------------------------------------
function oracleOutcome(round, rec) {
  const n = KINDS[round.tpl].length;
  const slotsOf = [Array(n).fill(null), Array(n).fill(null)];
  const used = new Set();
  const usedSeat = [new Set(), new Set()];
  let turn = round.first;
  for (const [seat, card, slot] of rec.moves) {
    const expected = round.variant === "private" ? (slotsOf[round.first].every((c) => c !== null) ? 1 - round.first : round.first) : slotsOf[turn].every((c) => c !== null) ? 1 - turn : turn;
    ok(seat === expected, `turn order at move ${JSON.stringify([seat, card, slot])}`);
    ok(round.cards[card].kind === KINDS[round.tpl][slot], "card kind fits its slot");
    ok(slotsOf[seat][slot] === null, "slot was empty");
    ok(round.variant === "private" ? round.deal[seat].includes(card) && !usedSeat[seat].has(card) : round.pool.includes(card) && !used.has(card), "card allowed and not yet used");
    slotsOf[seat][slot] = card; used.add(card); usedSeat[seat].add(card); turn = 1 - seat;
  }
  ok(slotsOf.every((s) => s.every((c) => c !== null)), "both expressions are complete");
  const v = slotsOf.map((s) => slowValue(round, s));
  return { slotsOf, v, truth: winner(round.goal, v[0], v[1]) };
}
function slipClaim(round, v1) {
  const s = round.orbit.slip;
  if (!s) return v1;
  const a = Q(s.n, s.d);
  const up = qadd(v1, a); const down = qsub(v1, a);
  if (!round.negatives && qcmp(down, ZERO) < 0) return up;
  if (!round.negatives && qcmp(up, ZERO) < 0) return down;
  return s.plus ? up : down;
}
function goodRecord(round, moves, claim1 = null) {
  const o = oracleOutcome(round, { moves });
  const c1 = claim1 || slipClaim(round, o.v[1]);
  return { o, rec: { moves, fair: false, claims: [qdisp(o.v[0]), qdisp(c1)], call: round.rights.challenge ? (qeq(c1, o.v[1]) ? { challenge: false } : { challenge: true, counter: qdisp(o.v[1]) }) : null, verdict: o.truth, theirs: null } };
}

// ---- tables declared by this suite ---------------------------------------------------------------------------------------------
// per-grade limits: [largest |card|, largest |value|, fractions/decimals allowed, negatives allowed]
const LIMITS = { 0: [10, 20, false, false], 1: [20, 40, false, false], 2: [25, 1000, false, false], 3: [25, 1000, false, false], 4: [90, 10000, true, false], 5: [90, 10000, true, false], 6: [90, 10000, true, true], 7: [200, 10000, true, true], 8: [225, 10000000, true, true] };
const WEIGHT = { single: 0, sum2: 1, sum3: 1, sum4: 1, num2: 1, num3: 1, num4: 1, dsum2: 2, ddiff2: 3, prod2: 2, prodsum: 3, paren: 3, ops3: 4, frac2: 2, fracdiv: 4, pct: 3, pow: 3, powsum: 4, sci: 3, root2: 2, root3: 2 };
const digitsOf = (q) => String(q.n < 0n ? -q.n : q.n).length;
const proxy = (round) => KINDS[round.tpl].length + WEIGHT[round.tpl] + (round.goal.type === "closest" ? 1 : 0) + Math.max(...round.cards.filter((c) => c.kind !== "op").map((c) => digitsOf(parseNum(c.text)))) + (round.cards.some((c) => c.kind !== "op" && parseNum(c.text).d !== 1n) ? 1 : 0);
const STANDARD = /^(K|[1-8])\.[A-Z]{1,4}\.[A-Z]\.\d+[a-z]?$/;
const rngFor = (skill, level, grade, seed) => makeRng(seedFrom("duel-math-suite", skill, level, grade, seed));
const leakRe = (answer) => new RegExp(`(?<![\\d./])${String(answer).replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}(?![\\d./])`);
const SEEDS = 40;
const DEEP = 8;

// ==== 1. the contract and the catalogue ===========================================================================================
same(validateGame(game), [], "the game honors the module contract");
ok(game.mechanic === "two-player-challenge-duel" && game.order === 10 && game.id === "family-math-duel", "id, order and mechanic tag");
ok(game.skills.length >= 14, `at least 14 skills (${game.skills.length})`);
for (const g of GRADES) ok(game.skills.filter((s) => s.grades[0] <= g && g <= s.grades[1]).length >= 2, `grade ${g} has at least two skills`);
for (const s of game.skills) {
  ok(STANDARD.test(s.standard), `${s.id}: standard code ${s.standard}`);
  ok(s.title.en !== s.title.es && s.strand.en !== s.strand.es && s.title.en && s.strand.en, `${s.id}: bilingual title and strand`);
}
ok(new Set(game.skills.map((s) => s.id)).size === game.skills.length, "skill ids are unique");
ok(game.howTo.en.every((t, i) => t !== game.howTo.es[i]) && game.together.en !== game.together.es, "howTo and together differ by language");
ok(/Fair play/.test(game.together.en) && /Juego justo/.test(game.together.es), "the together text explains Fair play in both languages");
// the caregiver coach has a duel-specific turn for this game, in both languages
const turn0 = coach.turn({ index: 0, game, skill: game.skills[0], grade: 3 });
ok(/Both of you play/.test(turn0.prompt.en) && turn0.prompt.es && turn0.prompt.es !== turn0.prompt.en, "coach.turn gives the duel text to both players");
console.log("PASS contract, catalogue and standards");

// ==== 2. layouts and the two evaluators agree ==========================================================================================
{
  const seen = new Set();
  for (const s of game.skills) for (const level of [1, 2, 3]) {
    const round = game.makeRound(s.id, level, rngFor(s.id, level, s.grades[0], 1), s.grades[0]);
    if (seen.has(round.tpl)) continue;
    seen.add(round.tpl);
    same(slotKinds(round.tpl), KINDS[round.tpl], `${round.tpl}: slot kinds`);
    const rng = makeRng(77);
    for (let k = 0; k < 6; k += 1) {
      const slots = arrangements(round, round.cards.map((c) => c.id));
      const pick = slots[Math.floor(rng() * slots.length)];
      same([fillLayout(round.tpl, pick.map((id) => round.cards[id].text), "en"), qstr(slowValue(round, pick))], [shownText(round, pick), qstr(fastValue(round, pick))], `${round.tpl}: printed text and values agree across both evaluators`);
    }
  }
  ok(seen.size === Object.keys(LAYOUT).length, `every template is exercised (${seen.size})`);
  for (const [text, value] of [["3 + 4 × 5", "23"], ["(3 + 4) × 5", "35"], ["|12 − 45|", "33"], ["15% of 80", "12"], ["3 × 10^−2", "3/100"], ["√49 + √16", "11"], ["2^−3", "1/8"], ["(−3) × (−4)", "12"], ["(3/4) + (1/2)", "5/4"], ["10 − 2 × 3", "4"]]) same(qstr(evalText(text)), value, `the oracle parser reads ${text}`);
}
console.log("PASS layouts match the printed expressions; two independent evaluators agree");

// ==== 3. every skill x level x grade x seed ======================================================================================================
let rounds = 0;
const fingerprints = {};
for (const skill of game.skills) {
  const means = {};
  for (let grade = skill.grades[0]; grade <= skill.grades[1]; grade += 1) {
    for (const level of [1, 2, 3]) {
      const [maxCard, maxValue, fractions, negatives] = LIMITS[grade];
      const proxies = [];
      for (let seed = 0; seed < SEEDS; seed += 1) {
        const round = game.makeRound(skill.id, level, rngFor(skill.id, level, grade, seed), grade);
        rounds += 1;
        const label = `${skill.id} g${grade} L${level} #${seed}`;
        same(JSON.parse(JSON.stringify(round)), round, `${label}: round is JSON-serializable`);
        same(game.makeRound(skill.id, level, rngFor(skill.id, level, grade, seed), grade), round, `${label}: round is a pure function of its inputs`);
        ok(round.prompt.en && round.prompt.es && round.prompt.en !== round.prompt.es, `${label}: bilingual prompt`);
        ok(round.cards.length === (round.variant === "private" ? round.deal[0].length + round.deal[1].length : round.pool.length), `${label}: every card is dealt once`);
        for (const c of round.cards) if (c.kind !== "op") {
          const q = parseNum(c.text);
          ok(qcmp(qabs(q), Q(BigInt(maxCard))) <= 0, `${label}: card ${c.text} within the grade ${grade} limit`);
          ok(fractions || q.d === 1n, `${label}: no fractions or decimals before grade 4 (${c.text})`);
          ok(negatives || q.n >= 0n, `${label}: no negative cards below grade 6 (${c.text})`);
          ok(qeq(q, fromGame(c.v)), `${label}: card value matches its printed text`);
        }
        // the reference play: legal, exactly valued, correctly judged
        const sol = game.solve(round);
        const { o, rec } = goodRecord(round, sol.moves);
        ok(sol.claims.every((c, i) => qeq(parseNum(c), parseNum(rec.claims[i]))), `${label}: solve() claims the exact values`);
        ok(sol.verdict === rec.verdict && Boolean(sol.call) === Boolean(rec.call) && (!sol.call || (sol.call.challenge === rec.call.challenge && (!rec.call.challenge || qeq(parseNum(sol.call.counter), parseNum(rec.call.counter))))), `${label}: solve() makes the right call and verdict`);
        ok(o.v.every((v) => qcmp(qabs(v), Q(BigInt(maxValue))) <= 0), `${label}: values within the grade limit (${o.v.map(qstr)})`);
        ok(negatives || o.v.every((v) => v.n >= 0n), `${label}: no negative values below grade 6`);
        ok(fractions || o.v.every((v) => v.d === 1n), `${label}: whole-number values before grade 4`);
        const result = game.check(round, sol);
        ok(result.correct === true && result.feedback.en && result.feedback.es, `${label}: check() accepts solve()`);
        const answer = game.answerText(round);
        ok(qeq(parseNum(answer), o.v[0]) && !answer.includes(","), `${label}: answerText is the oracle's exact value (${answer})`);
        if (round.goal.type === "closest") ok(round.goal.target && round.targetText && qeq(parseNum(round.targetText), fromGame(round.goal.target)), `${label}: target text matches its value`);
        // Orbit's slip is always a real error, and never negative before grade 6
        const claim1 = slipClaim(round, o.v[1]);
        ok(round.orbit.slip ? !qeq(claim1, o.v[1]) : qeq(claim1, o.v[1]), `${label}: Orbit's slip changes the value exactly when it carries one`);
        ok(negatives || qcmp(claim1, ZERO) >= 0, `${label}: Orbit never announces a negative value below grade 6`);
        ok(level !== 1 || (!round.orbit.slip && !round.rights.challenge), `${label}: level 1 has no challenge and no slips`);
        ok(level === 1 || round.rights.challenge, `${label}: levels 2 and 3 carry the challenge`);
        ok(round.rights.theirs === (level === 3), `${label}: only level 3 lets the other player challenge too`);
        // hints: tiers 0-2 never state the answer, tiers 0-1 use no digits, tier 3 states it
        const hints = [0, 1, 2, 3].map((t) => game.hint(round, t, null));
        for (const [t, h] of hints.entries()) {
          ok(h.en.trim() && h.es.trim(), `${label}: hint tier ${t} in both languages`);
          if (t < 3) ok(!leakRe(answer).test(h.en) && !leakRe(answer).test(h.es), `${label}: hint tier ${t} does not state ${answer}`);
          if (t < 2) ok(!/\d/.test(h.en) && !/\d/.test(h.es), `${label}: hint tier ${t} uses no digits`);
        }
        ok(hints[3].en.includes(answer) && new Set(hints.map((h) => h.en)).size === 4, `${label}: tier 3 states the answer and the tiers differ`);
        ok(hints.every((h) => h.en !== h.es), `${label}: hints differ by language`);
        proxies.push(proxy(round));
        // mistakes: named, specific, never the value itself
        const wrongs = [];
        const v0 = o.v[0];
        wrongs.push([qstr(qadd(v0, Q(1n))), /^value-/]);
        wrongs.push(["abc", /^unreadable$/]);
        if (v0.n !== 0n) wrongs.push([qstr(qneg(v0)), /^value-negated$/]);
        if (v0.n !== 0n && round.tpl === "ops3") { const v = o.slotsOf[0].map((id) => cardVal(round.cards[id])); const ap = (x, op, y) => (op === "+" ? qadd(x, y) : op === "−" ? qsub(x, y) : qmul(x, y)); const ltr = ap(ap(v[0], v[1], v[2]), v[3], v[4]); if (!qeq(ltr, v0)) wrongs.push([qstr(ltr), /^value-ltr$/]); }
        if (["num2", "num3", "num4"].includes(round.tpl)) { const digits = o.slotsOf[0].map((id) => parseNum(round.cards[id].text)).reduce(qadd); if (!qeq(digits, v0) && !qeq(digits, qneg(v0))) wrongs.push([qstr(digits), /^value-digits$/]); }
        if (round.tpl === "frac2" && !qeq(qdiv(Q(1n), v0), v0)) wrongs.push([qstr(qdiv(Q(1n), v0)), /^value-flip$/]);
        if (round.tpl === "pct") { const [a, b] = o.slotsOf[0].map((id) => parseNum(round.cards[id].text)); wrongs.push([qstr(qmul(a, b)), /^value-percent$/]); }
        if (round.tpl === "pow" || round.tpl === "sci") { const [a, b] = o.slotsOf[0].map((id) => parseNum(round.cards[id].text)); if (!qeq(qmul(a, b), v0)) wrongs.push([qstr(qmul(a, b)), /^value-expmul$/]); }
        for (const [typed, mistakeRe] of wrongs) {
          const r = game.check(round, { ...sol, claims: [typed, sol.claims[1]] });
          ok(!r.correct && mistakeRe.test(r.mistake), `${label}: typing ${typed} is rejected as ${mistakeRe} (got ${r.mistake})`);
          ok(r.feedback.en && r.feedback.es && !leakRe(answer).test(r.feedback.en), `${label}: the feedback for ${r.mistake} does not print the value`);
        }
        // the three verdicts: the right one passes, each wrong one is named
        for (const verdict of [0, 1, 2]) {
          const r = game.check(round, { ...sol, verdict });
          if (verdict === o.truth) ok(r.correct, `${label}: the true verdict ${verdict} passes`);
          else {
            ok(!r.correct && /^compare-/.test(r.mistake), `${label}: a wrong verdict is named (${r.mistake})`);
            if (o.truth === 2) ok(r.mistake === "compare-tie-missed", `${label}: a missed tie is named`);
            else if (verdict === 2) ok(r.mistake === "compare-false-tie", `${label}: a false tie is named`);
            else if (round.goal.type === "closest" && !o.v.some((x) => x.n < 0n)) ok(["compare-closest-raw", "compare-generic"].includes(r.mistake), `${label}: closest goal names distance (${r.mistake})`);
          }
        }
        // the challenge rights
        if (round.rights.challenge) {
          const wrongClaim = !qeq(claim1, o.v[1]);
          const accept = game.check(round, { ...sol, call: { challenge: false } });
          const counterRight = game.check(round, { ...sol, call: { challenge: true, counter: qstr(o.v[1]) } });
          const counterWrong = game.check(round, { ...sol, call: { challenge: true, counter: qstr(qadd(o.v[1], Q(3n))) } });
          if (wrongClaim) { ok(accept.mistake === "missed-error" && counterRight.correct && counterWrong.mistake === "wrong-counter", `${label}: a wrong claim must be challenged, with the right correction`); }
          else { ok(accept.correct && counterRight.mistake === "bad-challenge", `${label}: challenging a right claim is a named mistake`); }
        }
        // the referee's rules on moves
        if (seed < 6) {
          const m = sol.moves;
          const dup = sol.moves.map((x) => x.slice());
          const mine = dup.findIndex((x) => x[0] === 0);
          const other = dup.find((x) => x[0] === 1);
          if (round.variant === "open" && other) { dup[mine][1] = other[1]; const r = game.check(round, { ...sol, moves: dup }); ok(!r.correct && ["reuse", "kind"].includes(r.mistake), `${label}: taking a card already taken is named (${r.mistake})`); }
          ok(game.check(round, { ...sol, moves: m.slice(0, -1) }).mistake === "incomplete", `${label}: an unfinished duel is incomplete`);
          ok(game.check(round, { ...sol, claims: ["", ""] }).mistake === "incomplete", `${label}: no claim yet is incomplete`);
          if (round.variant === "open") {
            const probeTaken = game.check(round, { attempt: { seat: 1 - m[0][0], card: m[0][1], slot: KINDS[round.tpl].indexOf(round.cards[m[0][1]].kind) }, moves: m.slice(0, 1) });
            ok(probeTaken.neutral === true && !probeTaken.correct && probeTaken.mistake === "reuse", `${label}: taking a card the other player holds is a neutral, named probe (${probeTaken.mistake})`);
          }
          const wrongKind = KINDS[round.tpl].findIndex((k) => k !== round.cards[m[0][1]].kind);
          if (wrongKind >= 0) ok(game.check(round, { attempt: { seat: m[0][0], card: m[0][1], slot: wrongKind }, moves: [] }).mistake === "kind", `${label}: a card in the wrong kind of slot is named`);
        }
        // deep oracle checks on a few seeds: every arrangement, Orbit's first move, small-hand exhaustive play
        if (seed < DEEP) {
          const ids = round.cards.map((c) => c.id);
          const ARR = withValues(round, ids);
          const probeAll = ARR.slice(0, 4);
          for (const a of probeAll) same(qstr(a.v), qstr(slowValue(round, a.slots)), `${label}: fast and slow values agree`);
          ok(ARR.every((a) => qcmp(qabs(a.v), Q(BigInt(maxValue))) <= 0 && (negatives || a.v.n >= 0n) && (fractions || a.v.d === 1n)), `${label}: every possible value is within the grade's limits`);
          ok(round.goal.type !== "closest" || (qcmp(fromGame(round.goal.target), ARR.map((a) => a.v).reduce((m, v) => (qcmp(v, m) < 0 ? v : m))) >= 0 && qcmp(fromGame(round.goal.target), ARR.map((a) => a.v).reduce((m, v) => (qcmp(v, m) > 0 ? v : m))) <= 0), `${label}: the target is reachable in range`);
          const info = verifyOrbit(round, ARR, sol.moves);
          if (round.variant === "open") {
            // Orbit's FIRST move derived from scratch by the oracle (before any reply to the learner when Orbit starts)
            const st = replay(round, [], false);
            const lax0 = Boolean(round.orbit.lax[0]);
            if (round.first === 1) { const exp = oracleOpenPick(round, ARR, Array(KINDS[round.tpl].length).fill(null), round.pool, lax0); same(pickMove(round, st, 1, lax0).slice(1), exp, `${label}: Orbit's opening move matches the oracle`); same(sol.moves[0].slice(1), exp, `${label}: solve() records Orbit's opening move`); }
            ok(info.first || round.orbit.lax.length > 0, `${label}: Orbit has a first move`);
          } else { const exp = oraclePrivatePick(round, ARR, round.deal[1], Boolean(round.orbit.lax[0])); const st = replay(round, round.first === 1 ? [] : sol.moves.filter((m) => m[0] === 0), false); same(pickArrangement(round, st, 1, Boolean(round.orbit.lax[0])).map((m) => m[1]), exp, `${label}: Orbit's private arrangement matches the oracle`); }
          // random legal learner play against Orbit, checked move by move against the oracle
          const rng = makeRng(seed * 977 + level);
          for (let play = 0; play < 3 && round.variant === "open"; play += 1) {
            const moves = [];
            let orbitPicks = 0;
            for (let guard = 0; guard < 40; guard += 1) {
              const st = replay(round, moves, false);
              ok(st.ok, `${label}: random play stays legal`);
              if (st.complete) break;
              if (st.turn === 1) {
                const avail = round.pool.filter((id) => !st.taken(1, id));
                const exp = oracleOpenPick(round, ARR, st.seats[1], avail, Boolean(round.orbit.lax[orbitPicks]));
                const got = pickMove(round, st, 1, Boolean(round.orbit.lax[orbitPicks]));
                same(got.slice(1), exp, `${label}: Orbit's reply matches the oracle after random play`);
                moves.push(got); orbitPicks += 1;
              } else {
                const avail = round.pool.filter((id) => !st.taken(0, id));
                const opts = [];
                for (const c of avail) for (let s = 0; s < KINDS[round.tpl].length; s += 1) if (st.seats[0][s] === null && KINDS[round.tpl][s] === round.cards[c].kind) opts.push([0, c, s]);
                moves.push(opts[Math.floor(rng() * opts.length)]);
              }
            }
            const g = goodRecord(round, moves);
            ok(game.check(round, g.rec).correct, `${label}: check() accepts a random legal play (${JSON.stringify(moves)})`);
            const flip = game.check(round, { ...g.rec, verdict: (g.rec.verdict + 1) % 3 });
            ok(!flip.correct, `${label}: and rejects a wrong verdict on it`);
          }
          // every legal learner play on small open hands
          if (round.variant === "open" && round.pool.length <= 6) {
            let plays = 0;
            const walk = (moves, orbitPicks) => {
              if (plays > 300) return;
              const st = replay(round, moves, false);
              if (st.complete) { plays += 1; const g = goodRecord(round, moves); ok(game.check(round, g.rec).correct, `${label}: every legal play is accepted (${JSON.stringify(moves)})`); return; }
              if (st.turn === 1) { const avail = round.pool.filter((id) => !st.taken(1, id)); const [c, s] = oracleOpenPick(round, ARR, st.seats[1], avail, Boolean(round.orbit.lax[orbitPicks])); walk([...moves, [1, c, s]], orbitPicks + 1); return; }
              for (const c of round.pool.filter((id) => !st.taken(0, id))) for (let s = 0; s < KINDS[round.tpl].length; s += 1) if (st.seats[0][s] === null && KINDS[round.tpl][s] === round.cards[c].kind) walk([...moves, [0, c, s]], orbitPicks);
            };
            walk([], 0);
            ok(plays >= 1, `${label}: enumerated ${plays} legal plays`);
          }
          // strategy claims used in tier 1 are true for this hand
          const best = (cmpFn) => ARR.reduce((m, a) => (cmpFn(a, m) ? a : m));
          const top = (ids, k) => ids.map((id) => parseNum(round.cards[id].text)).sort((a, b) => qcmp(b, a)).slice(0, k);
          const numIds = ids.filter((id) => round.cards[id].kind === "num");
          const nonneg = round.cards.every((c) => c.kind === "op" || parseNum(c.text).n >= 0n);
          if (round.goal.type === "max" && nonneg && ["sum2", "sum3", "sum4", "single"].includes(round.tpl) && round.variant === "open") ok(qeq(best((a, m) => qcmp(a.v, m.v) > 0).v, top(numIds, KINDS[round.tpl].length).reduce(qadd)), `${label}: for a sum the biggest cards make the biggest sum`);
          if (round.goal.type === "max" && round.tpl.startsWith("num")) { const t = numIds.map((id) => parseNum(round.cards[id].text)).sort((a, b) => qcmp(b, a)).slice(0, KINDS[round.tpl].length); ok(qeq(best((a, m) => qcmp(a.v, m.v) > 0).v, t.reduce((acc, x) => qadd(qmul(acc, Q(10n)), x), ZERO)), `${label}: the biggest digit in the highest place makes the biggest number`); }
          if (round.goal.type === "max" && round.tpl === "paren" && nonneg) { const win = best((a, m) => qcmp(a.v, m.v) > 0); const cs = win.slots.map((id) => parseNum(round.cards[id].text)); ok(qeq(cs[2], top(numIds, 1)[0]), `${label}: the biggest card belongs outside the parentheses`); }
          if (round.goal.type === "min" && round.tpl === "frac2") { const sorted = numIds.map((id) => parseNum(round.cards[id].text)).sort(qcmp); ok(qeq(best((a, m) => qcmp(a.v, m.v) < 0).v, qdiv(sorted[0], sorted.at(-1))), `${label}: smallest numerator over biggest denominator is the smallest fraction`); }
          if (round.goal.type === "min" && round.tpl === "fracdiv") { const s = numIds.map((id) => parseNum(round.cards[id].text)).sort(qcmp); const half = s.length / 2; ok(qeq(best((a, m) => qcmp(a.v, m.v) < 0).v, qdiv(qmul(s[0], s[1]), qmul(s[s.length - 1], s[s.length - 2]))), `${label}: small parts on top and big parts underneath give the smallest quotient (${half})`); }
          if (round.tpl === "sci" && round.goal.type !== "closest") { const exps = ids.filter((id) => round.cards[id].kind === "exp").map((id) => parseNum(round.cards[id].text)).sort(qcmp); const win = best((a, m) => (round.goal.type === "max" ? qcmp(a.v, m.v) > 0 : qcmp(a.v, m.v) < 0)); ok(qeq(parseNum(round.cards[win.slots[1]].text), round.goal.type === "max" ? exps.at(-1) : exps[0]), `${label}: the exponent of ten decides the size of a scientific-notation number`); }
          if (round.tpl === "prod2" && round.cards.some((c) => c.kind === "num" && parseNum(c.text).n < 0n) && round.goal.type === "min") ok(best((a, m) => qcmp(a.v, m.v) < 0).v.n <= 0n, `${label}: the smallest product is not positive when negatives are dealt`);
        }
      }
      means[`${grade}:${level}`] = proxies.reduce((a, b) => a + b, 0) / proxies.length;
    }
    ok(means[`${grade}:1`] <= means[`${grade}:2`] + 1e-9 && means[`${grade}:2`] <= means[`${grade}:3`] + 1e-9 && means[`${grade}:3`] > means[`${grade}:1`], `${skill.id} grade ${grade}: difficulty proxy rises with level (${[1, 2, 3].map((l) => means[`${grade}:${l}`].toFixed(1))})`);
  }
  // variety: at least 30 distinct hands over 100 seeds
  for (const level of [1, 2, 3]) {
    const prints = new Set();
    for (let seed = 0; seed < 100; seed += 1) { const r = game.makeRound(skill.id, level, rngFor(skill.id, level, skill.grades[0], 1000 + seed), skill.grades[0]); prints.add(JSON.stringify([r.cards.map((c) => c.text), r.goal.target, r.variant, r.first, r.orbit])); }
    fingerprints[`${skill.id}:${level}`] = prints.size;
    ok(prints.size >= 30, `${skill.id} L${level}: ${prints.size} distinct hands in 100 seeds`);
  }
}
console.log(`PASS ${rounds} rounds across ${game.skills.length} skills x 3 levels x grades x ${SEEDS} seeds: serializable, exact, judged, hinted`);

// ==== 4. the mistake catalogue: every entry named, bilingual, specific and distinct ============================================================
const KEYWORDS = { reuse: [/only once/i, /una sola vez/i], kind: [/kind of card/i, /tipo de carta/i], "slot-taken": [/already holds/i, /ya tiene/i], foreign: [/not in your hand/i, /no está en tu mano/i], turn: [/turn/i, /turno/i], incomplete: [/whole duel/i, /todo el duelo/i], unreadable: [/as a number/i, /como número/i], "value-ltr": [/left to right/i, /izquierda a derecha/i], "value-parens": [/parenthes/i, /paréntesis/i], "value-negated": [/sign/i, /signo/i], "value-digits": [/digits/i, /dígitos/i], "value-swapop": [/wrong operation/i, /operación equivocada/i], "value-across": [/denominator/i, /denominador/i], "value-flip": [/upside down/i, /al revés/i], "value-percent": [/one hundred/i, /cien/i], "value-expmul": [/exponent/i, /exponente/i], "value-noroot": [/root/i, /raíz|raíces/i], "value-point": [/decimal point/i, /punto decimal/i], "value-generic": [/exact value/i, /valor exacto/i], "bad-challenge": [/challenge/i, /desafío/i], "missed-error": [/not right/i, /no es correcto/i], "wrong-counter": [/correction/i, /corrección/i], "compare-tie-missed": [/tie/i, /empate/i], "compare-false-tie": [/not equal/i, /no son iguales/i], "compare-closest-raw": [/distance/i, /distancia/i], "compare-min-raw": [/smaller/i, /menor/i], "compare-max-raw": [/bigger/i, /mayor/i], "compare-magnitude": [/negative/i, /negativo/i], "compare-generic": [/compare again/i, /compara de nuevo/i] };
for (const [key, [en, es]] of Object.entries(KEYWORDS)) {
  const f = FEEDBACK[key];
  ok(f && f.en && f.es && f.en !== f.es, `feedback ${key} exists in both languages`);
  ok(en.test(f.en) && es.test(f.es), `feedback ${key} names its mix-up in both languages`);
}
ok(new Set(Object.values(FEEDBACK).map((f) => f.en)).size === Object.keys(FEEDBACK).length, "every feedback text is distinct");
// the wrong-value slips this suite can provoke through check() all reach a catalogued key
{
  const seen = new Set();
  for (const s of game.skills) for (const level of [2, 3]) for (let seed = 0; seed < 40; seed += 1) {
    const round = game.makeRound(s.id, level, rngFor(s.id, level, s.grades[0], 5000 + seed), s.grades[0]);
    const sol = game.solve(round);
    for (const typed of ["1/7", "9999", qstr(qadd(parseNum(sol.claims[0]), Q(10n)))]) { const r = game.check(round, { ...sol, claims: [typed, sol.claims[1]] }); if (!r.correct) { seen.add(r.mistake); ok(FEEDBACK[r.mistake], `mistake ${r.mistake} has feedback`); } }
  }
  ok(seen.has("value-generic"), "the generic wrong-value feedback is reachable");
}
for (const junk of [null, undefined, {}, { moves: "x" }, { moves: [[9, 9, 9]] }, { moves: [[0, 0, 0]], claims: [1, 2], verdict: "yes" }]) {
  const round = game.makeRound("g3-product-war", 2, rngFor("g3-product-war", 2, 3, 1), 3);
  const r = game.check(round, junk);
  ok(r.correct === false && r.feedback.en && r.feedback.es, `garbage response ${JSON.stringify(junk)} is rejected, not thrown`);
}
console.log("PASS the mistake catalogue is named, bilingual, specific and distinct; garbage never throws");

// ==== 5. two humans: both seats play freely, Fair play locks a card, Orbit is not needed ==========================================================
{
  let plays = 0;
  for (const s of game.skills) for (const level of [1, 2, 3]) for (let seed = 0; seed < 6; seed += 1) {
    const grade = s.grades[0];
    const round = game.makeRound(s.id, level, rngFor(s.id, level, grade, 9000 + seed), grade);
    const rng = makeRng(seed + 31 * level);
    const label = `${s.id} L${level} #${seed}`;
    for (const fair of [false, true]) {
      // both seats pick at random, legally; with Fair play seat 1 starts with the weakest card locked in
      const moves = [];
      const lock = fair ? round.fair : null;
      for (let guard = 0; guard < 60; guard += 1) {
        const st = replay(round, moves, fair);
        ok(st.ok, `${label}: two-human play stays legal (fair=${fair})`);
        if (st.complete) break;
        const seat = st.turn;
        const pool = round.variant === "private" ? round.deal[seat] : round.pool;
        const opts = [];
        for (const c of pool) if (!st.taken(seat, c)) for (let k = 0; k < KINDS[round.tpl].length; k += 1) if (st.seats[seat][k] === null && KINDS[round.tpl][k] === round.cards[c].kind) opts.push([seat, c, k]);
        moves.push(opts[Math.floor(rng() * opts.length)]);
      }
      const o = (() => {
        const n = KINDS[round.tpl].length;
        const slots = [Array(n).fill(null), Array(n).fill(null)];
        if (lock) slots[1][lock.slot] = lock.card;
        for (const [seat, c, k] of moves) slots[seat][k] = c;
        ok(slots.every((x) => x.every((c) => c !== null)), `${label}: both expressions complete`);
        const v = slots.map((x) => slowValue(round, x));
        return { v, truth: winner(round.goal, v[0], v[1]) };
      })();
      const c1 = round.rights.challenge ? qadd(o.v[1], Q(1n)) : o.v[1]; // the caregiver may be wrong
      const rec = { moves, fair, claims: [qstr(o.v[0]), qstr(c1)], call: round.rights.challenge ? { challenge: true, counter: qstr(o.v[1]) } : null, verdict: o.truth, theirs: round.rights.theirs ? true : null };
      ok(game.check(round, rec).correct, `${label}: a two-human hand is accepted (fair=${fair})`);
      const sc = scoreOf(round, rec);
      ok(sc.points[0] + sc.points[1] >= 2, `${label}: the hand scores`);
      ok(o.truth === 2 ? sc.points[0] >= 1 && sc.points[1] >= 1 : sc.points[o.truth] >= 2, `${label}: the winner of the hand gets 2 (a tie gives 1 each)`);
      if (round.rights.challenge) ok(sc.points[0] >= (o.truth === 0 ? 3 : 1), `${label}: an upheld challenge adds a point for the challenger`);
      if (fair) {
        ok(round.cards[lock.card].kind === KINDS[round.tpl][lock.slot], `${label}: the locked card fits its slot`);
        ok(replay(round, [...moves, [1, lock.card, lock.slot]], true).problem !== undefined, `${label}: the locked card cannot be taken again`);
      }
      plays += 1;
    }
  }
  ok(plays > 300, `${plays} two-human hands checked, with and without Fair play`);
  // seat order and private hands
  const open = game.makeRound("g3-product-war", 2, rngFor("g3-product-war", 2, 3, 3), 3);
  const bad = game.check(open, { attempt: { seat: 1 - open.first, card: open.pool[0], slot: 0 }, moves: [] });
  ok(bad.neutral && bad.mistake === "turn", "moving out of turn is a neutral, named probe");
  let priv = null;
  for (let seed = 0; seed < 50 && !priv; seed += 1) { const r = game.makeRound("g2-place-number", 1, rngFor("g2-place-number", 1, 2, seed), 2); if (r.variant === "private") priv = r; }
  ok(priv, "a private-hand round exists");
  const theirCard = priv.deal[1 - priv.first][0];
  const foreign = game.check(priv, { attempt: { seat: priv.first, card: theirCard, slot: 0 }, moves: [] });
  ok(foreign.neutral && foreign.mistake === "foreign", "a card from the other hand is refused");
  ok(priv.deal[0].every((c) => !priv.deal[1].includes(c)) && priv.deal[0].length === priv.deal[1].length, "private hands are disjoint and the same size");
}
console.log("PASS two humans on one device: legal play, challenges, scoring and Fair play");

// ==== 6. the whole table: scores and levels ================================================================================================================
{
  const round = game.makeRound("g3-product-war", 3, rngFor("g3-product-war", 3, 3, 4), 3);
  const sol = game.solve(round);
  const sc = scoreOf(round, sol);
  const truth = oracleOutcome(round, sol).truth;
  ok(truth === 2 ? sc.points[0] === 1 && sc.points[1] === 1 : sc.points[truth] >= 2, "scoreOf gives the winner two points");
  ok(sc.lines.length >= 1, "scoreOf explains the points");
}
console.log(`PASS scoring. ${checks} checks in ${((Date.now() - started) / 1000).toFixed(0)}s`);
