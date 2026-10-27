// Math Market (game 4) math suite. Every round is re-derived by an ORACLE written here from the round's own inputs
// (`params`), never by calling the game's generator or checker to produce the expected value. Money is integer cents or
// exact rationals; percent rounding rule: nearest cent, half a cent rounds UP, re-implemented below by integer remainder.
// @fm2 FM-010 FM-017 FM-019 FM-020 FM-032 FM-033 FM-050 FM-051 FM-052 FM-053 FM-054 FM-055 FM-056 FM-057 FM-058 FM-059
// @fm2 FM-060 FM-061 FM-062 FM-063 FM-065
import assert from "node:assert/strict";
import fs from "node:fs";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html lang=en><body><div id=root></div></body></html>", {
  url: "https://example.test/",
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  CustomEvent: dom.window.CustomEvent,
});
const base = "../../math/fluency-lab/family/fm2";
const { default: game } = await import(`${base}/games/math-market/index.js`);
const { validateGame } = await import(`${base}/contract.js`);
const { makeRng, seedFrom } = await import(`${base}/rng.js`);
const { frac, eq, mul, div, sub, add } = await import(`${base}/rational.js`);
const { RECHECK, MISTAKES } = await import(`${base}/games/math-market/copy.js`);
const { parseTyped, roundHalfUp, fewestPieces } = await import(
  `${base}/games/math-market/money.js`
);
const { mount } = await import(`${base}/games/math-market/ui.js`);
const { startActivity } = await import(`${base}/shell.js`);
const { createStore } = await import(`${base}/store.js`);

let checks = 0;
const ok = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};

// biome-ignore format: a dense script, one assertion or formula per line, read top to bottom
async function main() {
  const D = (cents) => frac(cents, 100);
  const sum = (list) => list.reduce((a, b) => a + b, 0);
  const SEEDS = 40;
  const rngFor = (skill, grade, level, i) => makeRng(seedFrom("mm-test", skill, grade, level, i));

  // ---- independent arithmetic -------------------------------------------------------------------------------------
  // numerator/denominator is an amount of cents; nearest whole cent, a remainder of exactly half goes up.
  const nearestCent = (num, den) => { const whole = Math.floor(num / den); return 2 * (num - whole * den) >= den ? whole + 1 : whole; };
  const roundTo = (x, place) => Math.floor((x + place / 2) / place) * place; // integer arithmetic only
  // Text a learner would type for an exact rational (terminating decimals only).
  function decimalText(r) {
    for (let k = 0; k <= 6; k += 1) {
      const scaled = r.n * 10 ** k;
      if (scaled % r.d === 0) { const digits = String(Math.abs(scaled / r.d)).padStart(k + 1, "0"); return k ? `${digits.slice(0, -k)}.${digits.slice(-k)}` : digits; }
    }
    throw new Error(`not a terminating decimal: ${r.n}/${r.d}`);
  }
  const typable = (r) => { try { decimalText(r); return r.n >= 0; } catch { return false; } };
  // Fewest pieces by breadth-first search over running totals (a different algorithm from the game's DP).
  function minPieces(target, pool) {
    let level = new Set([0]);
    const seen = new Set([0]);
    for (let count = 0; level.size; count += 1) {
      if (level.has(target)) return count;
      const next = new Set();
      for (const amount of level) for (const piece of pool) { const total = amount + piece; if (total <= target && !seen.has(total)) { seen.add(total); next.add(total); } }
      level = next;
    }
    return null;
  }
  const greedy = (amount, pool) => { const out = []; for (const piece of [...pool].sort((a, b) => b - a)) while (amount >= piece) { out.push(piece); amount -= piece; } return out; };

  // ---- oracles: from round.params to { expect, wrongs: [[mistake, values]] } ---------------------------------------
  const wrongOf = (mistake, key, value) => [mistake, { [key]: value }];
  const one = (cents, wrongs = [], key = "answer") => ({ expect: { [key]: D(cents) }, wrongs: wrongs.map(([m, c]) => wrongOf(m, key, D(c))) });
  const ORACLE = {
    "penny-count": ({ n }) => ({ expect: { total: frac(n) }, wrongs: [wrongOf("off-by-one", "total", frac(n + 1)), wrongOf("off-by-one", "total", frac(n - 1))] }),
    "count-pnd": ({ coins }) => {
      const v = sum(coins), nick = coins.filter((c) => c === 5).length;
      const w = [wrongOf("counted-coins", "total", frac(coins.length))];
      if (nick) w.push(wrongOf("nickels-as-dimes", "total", frac(v + 5 * nick)), wrongOf("nickels-as-pennies", "total", frac(v - 4 * nick)));
      return { expect: { total: frac(v) }, wrongs: w };
    },
    "dollars-cents": ({ coins }) => {
      const w = [wrongOf("count-pieces", "total", frac(coins.length))];
      if (coins.some((c) => c >= 100)) w.push(wrongOf("forgot-bills", "total", D(sum(coins.filter((c) => c < 100)))));
      return { expect: { total: D(sum(coins)) }, wrongs: w };
    },
    "round-prices": ({ prices, place }) => ({
      expect: { total: frac(sum(prices.map((x) => roundTo(x, place)))) },
      wrongs: [wrongOf("truncated", "total", frac(sum(prices.map((x) => x - (x % place))))), wrongOf("not-rounded", "total", frac(sum(prices))),
        ...(place === 100 ? [wrongOf("rounded-wrong-place", "total", frac(sum(prices.map((x) => roundTo(x, 10)))))] : [])],
    }),
    "multi-step-money": ({ lines, coupon, paid, ask }) => {
      const gross = sum(lines.map(([q, c]) => q * c)), net = gross - coupon, once = sum(lines.map(([, c]) => c));
      if (ask === "total") return one(net, [["forgot-multiply", lines[0][1]]]);
      return one(paid - net, [["forgot-multiply", paid - (once - coupon)], ["gave-total", net], ...(coupon ? [["added-coupon", paid - gross - coupon]] : [])]);
    },
    "decimal-ops": (p) => {
      if (p.op === "add") return one(p.a + p.b, [["dollars-only", Math.floor((p.a + p.b) / 100) * 100]]);
      if (p.op === "sub") return one(p.paid - p.price, [["added-instead", p.paid + p.price]]);
      if (p.op === "times") return one(p.n * p.p);
      if (p.op === "split") { ok(p.total % p.n === 0, "split is exact"); return one(p.total / p.n); }
      if (p.op === "weight") { ok((p.p * p.tenths) % 10 === 0, "weight price is whole cents"); return one((p.p * p.tenths) / 10); }
      return one(nearestCent(p.total, p.n), [["truncated", Math.floor(p.total / p.n)]]);
    },
    "better-buy": ({ offers, rounding }) => {
      const [x, y] = offers, unit = (o) => nearestCent(o.cents, o.q);
      if (!rounding) ok(x.cents % x.q === 0 && y.cents % y.q === 0, "exact unit prices when no rounding is asked");
      const wrongs = [["swapped", { a: D(unit(y)), b: D(unit(x)) }]];
      if (rounding) wrongs.push(["truncated", { a: D(Math.floor(x.cents / x.q)), b: D(Math.floor(y.cents / y.q)) }]);
      return { expect: { a: D(unit(x)), b: D(unit(y)) }, wrongs };
    },
    "rate-table": ({ type, rows, n3, budget }) => {
      const [n, c] = rows[0];
      if (type === "cost") {
        ok(eq(frac(rows[1][1], rows[1][0]), frac(c, n)), "rate table rows are proportional");
        return one((n3 * c) / n, [["additive", rows[1][1] + (n3 - rows[1][0]) * 100], ["unit-price-only", c / n]], "total");
      }
      if (type === "unit") return { expect: { unit: D(c / n), total: D((n3 * c) / n) }, wrongs: [wrongOf("forgot-multiply", "total", D(c / n)), wrongOf("additive", "total", D(c + (n3 - n) * 100))] };
      return { expect: { count: div(frac(budget), frac(c, n)) }, wrongs: [wrongOf("groups-not-items", "count", frac(budget, c))] };
    },
    "percent-off": ({ price, steps, flat, ask }) => {
      const left = (p) => nearestCent(price * (100 - p), 100);
      let rat = frac(price * 100);
      for (const p of steps) rat = mul(rat, frac(100 - p, 100));
      const final = nearestCent(rat.n, rat.d * 100) - flat; // the price in cents is rat / 100
      if (ask === "saved") {
        ok((price * steps[0]) % 100 === 0, "discount is whole cents");
        const off = (price * steps[0]) / 100;
        return one(off, [["gave-sale-price", price - off], ["percent-as-dollars", steps[0] * 100]]);
      }
      const w = [["gave-discount", price - final], ["added-discount", 2 * price - final], ["percent-as-dollars", price - steps[0] * 100]];
      if (steps.length > 1) w.push(["first-only", left(steps[0])], ["percents-added", left(steps[0] + steps[1])]);
      if (flat) w.push(["first-only", left(steps[0])], ["added-coupon", left(steps[0]) + flat]);
      return one(final, w);
    },
    "tax-tip": ({ price, tax, tip }) => {
      const taxC = nearestCent(price * tax, 100), tipC = nearestCent(price * tip, 100), total = price + taxC + tipC;
      if (!tip) return one(total, [["amount-only", taxC], ["percent-as-dollars", price + tax * 100]]);
      const w = [["amount-only", tipC], ["percent-as-dollars", price + tip * 100], ["truncated", price + Math.floor((price * tax) / 100) + Math.floor((price * tip) / 100)]];
      if (tax) w.push(["tip-on-total", price + taxC + nearestCent((price + taxC) * tip, 100)], ["forgot-tax", price + tipC], ["forgot-tip", price + taxC]);
      return one(total, w);
    },
    "percent-change": (p) => {
      if (p.type) {
        ok((p.price * p.p) % 100 === 0, "markup amount is whole cents");
        const amount = (p.price * p.p) / 100, up = p.type === "markup";
        return one(up ? p.price + amount : p.price - amount, [["wrong-direction", up ? p.price - amount : p.price + amount], ["gave-amount", amount]]);
      }
      const diff = Math.abs(p.next - p.old), pct = frac(diff * 100, p.old);
      ok(p.next > p.old === (p.dir === "increase"), "direction words match the numbers");
      return { expect: { answer: pct }, wrongs: [wrongOf("wrong-base", "answer", frac(diff * 100, p.next)), wrongOf("difference-only", "answer", D(diff)), wrongOf("percent-as-decimal", "answer", div(pct, frac(100)))] };
    },
    "simple-interest": ({ principal, r, months, ask }) => {
      const interest = frac(principal * r * months, 1200);
      ok(interest.d === 1, "interest is whole cents");
      const I = interest.n, w = [["forgot-time", (principal * r) / 100], ask === "balance" ? ["interest-not-balance", I] : ["balance-not-interest", principal + I]];
      if (months % 12) w.push(["months-as-years", (principal * r * months) / 100]);
      return one(ask === "balance" ? principal + I : I, w);
    },
    "compare-plans": ({ plans: [a, b], n }) => {
      const [ta, tb] = [a.fee + a.rate * n, b.fee + b.rate * n];
      return { expect: { a: D(ta), b: D(tb) }, wrongs: [["forgot-fee", { a: D(a.rate * n), b: D(b.rate * n) }], ["fee-times-n", { a: D(n * (a.fee + a.rate)), b: D(n * (b.fee + b.rate)) }], ["swapped", { a: D(tb), b: D(ta) }]] };
    },
    "break-even": ({ plans: [a, b], level3 }) => {
      let found = null;
      for (let n = 1; n <= 3000 && found === null; n += 1) if (a.fee + a.rate * n === b.fee + b.rate * n) found = n;
      ok(found !== null, "plans meet at a whole number of uses");
      const [low, high] = [a, b].sort((x, y) => x.fee - y.fee);
      const wrongs = [wrongOf("added-rates", "n", frac(high.fee - low.fee, low.rate + high.rate))];
      if (low.fee > 0) wrongs.push(wrongOf("used-one-fee", "n", frac(high.fee, low.rate - high.rate)));
      return { expect: level3 ? { n: frac(found), cost: D(a.fee + a.rate * found) } : { n: frac(found) }, wrongs };
    },
    "slope-unit-cost": ({ rows, fee, both }) => {
      const slopes = rows.slice(1).map((row, i) => frac(row[1] - rows[i][1], 100 * (row[0] - rows[i][0])));
      ok(slopes.every((s) => eq(s, slopes[0])), "table is linear");
      const [[n1, c1], [n2, c2]] = rows, feeValue = sub(D(c1), mul(slopes[0], frac(n1)));
      ok(eq(feeValue, D(fee)), "intercept matches");
      const wrongs = [];
      if (fee) wrongs.push(wrongOf("first-row-ratio", "rate", frac(c1, 100 * n1)));
      if (n2 - n1 > 1) wrongs.push(wrongOf("cost-difference", "rate", D(c2 - c1)));
      return { expect: both ? { rate: slopes[0], fee: feeValue } : { rate: slopes[0] }, wrongs };
    },
  };


  // Money amounts a round shows, in cents, for the per-grade size limits.
  function moneyNumbers(round) {
    const out = [], s = round.scene || {};
    for (const tag of s.tags || []) out.push(tag.cents);
    for (const line of s.lines || []) if (line.cents !== undefined) out.push(line.cents);
    for (const row of s.rows || []) out.push(row[1] ?? 0);
    for (const plan of s.plans || []) out.push(plan.fee, plan.rate);
    out.push(sum(s.coins || []), round.target ?? 0, round.budget ?? 0, round.min ?? 0);
    for (const f of round.fields || []) if (f.unit === "$") out.push(Math.round((round.expect[f.key].n * 100) / round.expect[f.key].d));
    return out;
  }
  // Largest amount a grade meets in this game, in cents (K-1: under a dollar; grade 3 rounds prices up to $499).
  const LIMIT = [100, 100, 2000, 100000, 10000, 20000, 20000, 400000, 100000];
  const flatten = (value) => (value && typeof value === "object" ? Object.values(value).flatMap(flatten) : typeof value === "number" ? [value] : []);
  const digits = (n) => String(Math.abs(n)).length;
  const numberLoad = (r) => sum(flatten(r.params).map(digits)) + flatten(r.params).length;
  // Difficulty proxy: how many numbers a round carries plus how long they are; skills with another notion of demand override it.
  const PROXY = {
    "costs-more": (r) => 10 - Math.abs(r.params.cents[0] - r.params.cents[1]) + (r.params.ask === "less" ? 2 : 0),
    "make-change": (r) => minPieces(r.target, r.pool) + r.pool.length,
    "exact-pay": (r) => minPieces(r.target, r.pool) + r.pool.length,
    "decimal-ops": (r) => ({ add: 1, sub: 1, times: 2, split: 2, weight: 3, splitround: 3 })[r.params.op] * 3 + numberLoad(r),
    "simple-interest": (r) => numberLoad(r) + (r.params.months % 12 ? 4 : 0) + (r.params.ask === "balance" ? 3 : 0),
    "round-prices": (r) => r.params.place / 10 + r.params.prices.length * 3,
  };
  const demand = (r) => (PROXY[r.skillId] ? PROXY[r.skillId](r) : numberLoad(r));
  const mean = (list) => sum(list) / list.length;
  const typedForms = (r, unit) => {
    const t = decimalText(r);
    if (unit === "$") return [t, `$${t}`, ` $${t} `, ...(r.d === 1 ? [`${t}.00`] : []), `${decimalText(mul(r, frac(100)))}¢`];
    if (unit === "c") return [t, `${t}¢`, `$${decimalText(div(r, frac(100)))}`];
    return unit === "%" ? [t, `${t}%`] : [t];
  };

  // ---- hint leak detector -----------------------------------------------------------------------------------------
  const NUM_WORDS = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty".split(" ");
  const NUM_WORDS_ES = "cero uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciséis diecisiete dieciocho diecinueve veinte".split(" ");
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Does a tier 0-2 hint state the answer? Whole answer text, any multi-digit/decimal number of it, a lone number, a
  // name, or (for small plain counts) the number as a word. Looser matches than the game's own filter on purpose.
  function leaks(hint, answer, round, lang) {
    if (hint.includes(answer)) return true;
    const label = answer.replace(/^[AB]: /, ""), dollars = label.includes("$");
    const nums = [...label.matchAll(/\d+(?:\.\d+)?/g)].map((m) => m[0]), forms = new Set();
    for (const n of nums) {
      if (n.length >= 2 || (nums.length === 1 && !dollars)) forms.add(n);
      if (dollars && /\.00$/.test(n)) forms.add(`$${n.replace(/\.00$/, "")}`);
      if (dollars && /\.\d0$/.test(n)) forms.add(`$${n.slice(0, -1)}`);
    }
    if (/^\$0\.\d\d$/.test(label)) forms.add(`${Number(label.slice(3))}¢`);
    if (/^\d+¢$/.test(label) && Number(label.slice(0, -1)) < 100) forms.add(`$0.${label.slice(0, -1).padStart(2, "0")}`);
    for (const f of forms) if (new RegExp(`(?<![\\d.])${esc(f)}(?!\\d|\\.\\d)`).test(hint)) return true;
    const small = nums.length === 1 && !dollars && Number(nums[0]) <= 20 && !nums[0].includes(".");
    const word = (w) => new RegExp(`(?<![a-záéíóúñ])${esc(w)}(?![a-záéíóúñ])`, "i").test(hint);
    if (small && word((lang === "es" ? NUM_WORDS_ES : NUM_WORDS)[Number(nums[0])])) return true;
    return round.kind === "pick" && word(round.scene.tags[round.answer].name[lang]);
  }
  const moneyTokens = (text) => [...text.matchAll(/\$(\d+)(?:\.(\d\d))?/g)].map((m) => Number(m[1]) * 100 + Number(m[2] || 0));
  // Amounts the prompt itself must state, by skill.
  const REQUIRED = {
    "make-change": (p) => [p.price, p.paid], "exact-pay": (p) => [p.target], "fill-budget": (p) => [p.budget, p.min],
    "multi-step-money": (p) => [...p.lines.map((l) => l[1]), ...(p.coupon ? [p.coupon] : []), ...(p.paid ? [p.paid] : [])],
    "decimal-ops": (p) => ({ add: [p.a, p.b], sub: [p.price, p.paid], times: [p.p], split: [p.total], weight: [p.p], splitround: [p.total] })[p.op],
    "percent-off": (p) => [p.price, ...(p.flat ? [p.flat] : [])], "tax-tip": (p) => [p.price], "simple-interest": (p) => [p.principal],
    "percent-change": (p) => (p.type ? [p.price] : [p.old, p.next]),
    "rate-table": (p) => (p.type === "cost" ? [] : [p.rows[0][1], ...(p.budget ? [p.budget] : [])]),
  };

  // ---- submit wrapper: records every mistake key and its feedback --------------------------------------------------
  const seen = new Set(), feedbackByKey = new Map();
  function submit(round, response) {
    const result = game.check(round, response);
    if (!result.correct) {
      seen.add(result.mistake);
      ok(result.feedback.en?.trim() && result.feedback.es?.trim() && result.feedback.en !== result.feedback.es, `bilingual feedback for ${result.mistake}`);
      const key = result.mistake === "recheck" ? `recheck:${round.skillId}` : result.mistake;
      if (feedbackByKey.has(key)) assert.deepEqual(feedbackByKey.get(key), result.feedback);
      feedbackByKey.set(key, result.feedback);
    }
    return result;
  }
  const valuesFor = (round, overrides, form = 0) => Object.fromEntries(round.fields.map((f) => { const forms = typedForms(overrides[f.key] ?? round.expect[f.key], f.unit); return [f.key, forms[Math.min(form, forms.length - 1)]]; }));
  const sameValue = (round, v) => Object.entries(v).every(([k, x]) => eq(x, round.expect[k]));
  // What the game should say for typed values that are not the answer: catalogued mistakes first, else slips, else recheck.
  function allowedFor(round, o, typed) {
    const hits = o.wrongs.filter(([, v]) => !sameValue(round, v) && Object.entries(v).every(([k, x]) => typed[k] && eq(typed[k], x))).map(([m]) => m);
    if (hits.length) return new Set(hits);
    for (const f of round.fields) {
      const want = round.expect[f.key];
      if (eq(typed[f.key], want) || !want.n) continue;
      if (eq(typed[f.key], mul(want, frac(100))) || eq(typed[f.key], div(want, frac(100)))) return new Set(["unit-slip"]);
      if (eq(typed[f.key], mul(want, frac(10))) || eq(typed[f.key], div(want, frac(10)))) return new Set(["decimal-slip"]);
    }
    return new Set(["recheck"]);
  }

  // ---- 1. contract and skill inventory (FM-019 FM-020 FM-010) ------------------------------------------------------
  assert.deepEqual(validateGame(game), []);
  ok(game.id === "math-market" && game.order === 4 && game.mechanic === "transaction-register", "game identity");
  ok(game.skills.length >= 14, `at least 14 skills (${game.skills.length})`);
  for (let g = 0; g <= 8; g += 1) ok(game.skills.filter((s) => s.grades[0] <= g && g <= s.grades[1]).length >= 2, `grade ${g} has at least two skills`);
  for (const s of game.skills) ok(/^[K0-8]\.[A-Z]{1,3}\.[A-Z]\.\d+[a-z]?$/.test(s.standard), `standard code shape ${s.standard}`);
  ok(game.howTo.en.length >= 3 && game.together.es !== game.together.en, "how to play and together text in both languages");
  ok(game.cssHref.endsWith("game.css"), "css href");

  // ---- 2. money helpers against independent versions (FM-050 FM-052 FM-054 FM-057) ---------------------------------
  for (let den = 1; den <= 60; den += 1) for (let num = 0; num <= 600; num += 7) ok(roundHalfUp(num, den) === nearestCent(num, den), `roundHalfUp ${num}/${den}`);
  ok(roundHalfUp(1, 2) === 1 && roundHalfUp(3, 2) === 2 && roundHalfUp(5, 2) === 3 && roundHalfUp(49, 100) === 0 && roundHalfUp(50, 100) === 1, "ties round up");
  ok(eq(parseTyped("$1.50", "$"), frac(3, 2)) && eq(parseTyped("150¢", "$"), frac(3, 2)) && eq(parseTyped("1,5", "$"), frac(3, 2)), "typed dollars: $, ¢ and decimal comma");
  ok(eq(parseTyped("$0.35", "c"), frac(35)) && eq(parseTyped("35¢", "c"), frac(35)) && eq(parseTyped(" 35 ", "c"), frac(35)), "typed cents");
  ok(eq(parseTyped("25%", "%"), frac(25)) && eq(parseTyped("12.5", "%"), frac(25, 2)) && eq(parseTyped("1,250.50", "$"), frac(250100, 200)), "percent, decimal and thousands");
  ok(["abc", "", "1.2.3", "--"].every((t) => parseTyped(t, "$") === null), "junk is not a number");
  for (let target = 1; target <= 400; target += 1) {
    ok(fewestPieces(target, [1, 5, 10, 25]).length === minPieces(target, [1, 5, 10, 25]), `fewest coins for ${target}`);
    if (target % 7 === 0) ok(fewestPieces(target, [1, 5, 10, 25, 100, 500, 1000]).length === minPieces(target, [1, 5, 10, 25, 100, 500, 1000]), `fewest pieces for ${target}`);
  }

  // ---- 3. property sweep: skill x grade x level x seeds (FM-051 FM-052 FM-055 FM-059 FM-060 FM-062 FM-063 FM-065) ---
  function checkEnter(id, round, label) {
    const o = ORACLE[id](round.params);
    assert.deepEqual(round.fields.map((f) => f.key).sort(), Object.keys(o.expect).sort(), `${label} fields`);
    for (const [key, value] of Object.entries(o.expect)) ok(eq(round.expect[key], value), `${label} oracle ${key}: game ${round.expect[key].n}/${round.expect[key].d} vs ${value.n}/${value.d}`);
    for (const f of round.fields) if (f.unit === "$") ok((round.expect[f.key].n * 100) % round.expect[f.key].d === 0, `${label} whole cents`); // FM-054
    const reply = (values, pick = round.answer) => (round.kind === "pickEnter" ? { pick, values } : { values });
    for (let form = 0; form < 5; form += 1) ok(submit(round, reply(valuesFor(round, {}, form))).correct, `${label} accepts typed form ${form}`); // FM-052
    for (const [mistake, values] of o.wrongs) { // catalogued wrong answers are rejected with the named mistake (FM-063)
      if (!Object.values(values).every(typable) || sameValue(round, values)) continue;
      const typed = Object.fromEntries(round.fields.map((f) => [f.key, values[f.key] ?? round.expect[f.key]]));
      const res = submit(round, reply(valuesFor(round, values)));
      const allowed = allowedFor(round, o, typed);
      ok(!res.correct && allowed.has(res.mistake), `${label} ${mistake}: got ${res.mistake}, expected one of ${[...allowed]}`);
    }
    for (const f of round.fields) { // corrupted answers: one unit off, digit slips, junk (FM-065)
      const want = round.expect[f.key], step = f.unit === "$" ? frac(1, 100) : frac(1);
      const variants = [add(want, step), mul(want, frac(10)), mul(want, frac(100)), div(want, frac(10)), sub(want, step)];
      for (const v of variants) {
        if (!typable(v) || eq(v, want)) continue;
        const text = decimalText(v), typedOnly = Object.fromEntries(round.fields.map((g) => [g.key, g.key === f.key ? v : round.expect[g.key]]));
        const res = submit(round, reply({ ...valuesFor(round, {}), [f.key]: f.unit === "$" ? `$${text}` : text }));
        ok(!res.correct && allowedFor(round, o, typedOnly).has(res.mistake), `${label} corrupted ${f.key}=${text}: ${res.mistake}`);
      }
      for (const junk of ["abc", "", "1.2.3"]) { const res = submit(round, reply({ ...valuesFor(round, {}), [f.key]: junk })); ok(!res.correct && res.mistake === "not-a-number", `${label} junk ${JSON.stringify(junk)}`); }
    }
    if (round.kind !== "pickEnter") return;
    const p = round.params;
    let best, mistake;
    if (id === "better-buy") {
      const [x, y] = p.offers;
      ok(x.cents * y.q !== y.cents * x.q, `${label} unit prices differ`);
      best = x.cents * y.q < y.cents * x.q ? 0 : 1; // exact cross multiplication
      mistake = p.offers[1 - best].cents < p.offers[best].cents ? "compared-totals" : "bigger-pack";
    } else {
      const totals = p.plans.map((pl) => pl.fee + pl.rate * p.n);
      ok(totals[0] !== totals[1], `${label} plans differ at ${p.n}`);
      best = totals[0] < totals[1] ? 0 : 1;
      mistake = p.plans[1 - best].fee < p.plans[best].fee ? "lower-fee" : "lower-rate";
    }
    ok(round.answer === best, `${label} best option`);
    const res = submit(round, reply(valuesFor(round, {}), 1 - best));
    ok(!res.correct && res.mistake === mistake, `${label} wrong pick -> ${res.mistake} (wanted ${mistake})`);
    ok(!submit(round, { values: valuesFor(round, {}) }).correct, `${label} no pick is not enough`);
  }

  function checkPick(round, label) {
    const [a, b] = round.params.cents, best = round.params.ask === "more" ? (a > b ? 0 : 1) : a < b ? 0 : 1;
    ok(a !== b && round.answer === best, `${label} costs-more answer`);
    ok(round.scene.tags[0].cents === a && round.scene.tags[1].cents === b, `${label} tags show the prices`);
    const res = submit(round, { pick: 1 - best });
    ok(!res.correct && res.mistake === "picked-other" && !submit(round, {}).correct, `${label} other pick or none`);
  }

  function checkTray(id, round, label) {
    const { pool } = round, target = id === "make-change" ? round.params.paid - round.params.price : round.params.target;
    ok(round.target === target && round.scene.lines.length >= 1, `${label} tray target and receipt`);
    const fewest = minPieces(target, pool), best = greedy(target, pool); // greedy is optimal for US money, confirmed by the BFS count
    ok(best.length === fewest, `${label} greedy is optimal`);
    ok(submit(round, { tray: best }).correct && submit(round, { tray: [...best].reverse() }).correct, `${label} fewest tray, any order`);
    ok(submit(round, { tray: [] }).mistake === "short" && submit(round, { tray: [...best, 1] }).mistake === "over", `${label} empty is short, one cent over is over`);
    ok(submit(round, { tray: greedy(target - 1, pool) }).mistake === "short", `${label} one cent short`);
    ok(!submit(round, { tray: [...best, 2001] }).correct, `${label} piece outside the pool`);
    const index = best.findIndex((piece) => pool.some((q) => q < piece && piece % q === 0)); // splitting a piece keeps the total
    if (index >= 0) {
      const piece = best[index], q = Math.max(...pool.filter((x) => x < piece && piece % x === 0));
      const res = submit(round, { tray: [...best.slice(0, index), ...Array(piece / q).fill(q), ...best.slice(index + 1)] });
      if (id === "exact-pay") ok(res.mistake === "not-fewest", `${label} exact total but not fewest`);
      else ok(res.correct, `${label} any combination makes the change`);
    }
    if (id === "make-change") {
      const { price, paid } = round.params;
      ok(round.scene.lines.some((l) => l.cents === price) && round.scene.lines.some((l) => l.cents === paid) && paid > price, `${label} receipt shows price and payment`);
      ok(submit(round, { tray: greedy(paid, pool) }).mistake === "gave-paid", `${label} gave back the payment`);
      if (price !== target) ok(submit(round, { tray: greedy(price, pool) }).mistake === "gave-price", `${label} gave back the price`);
    } else ok(round.fewest === true && round.min === fewest, `${label} fewest count`);
  }

  function checkCart(round, label) { // every subset of the shelf is judged against the budget (FM-060: many solutions)
    const { prices, budget, min } = round.params;
    ok(round.scene.tags.map((t) => t.cents).join() === prices.join(), `${label} cart shows the prices`);
    let valid = 0;
    for (let mask = 0; mask < 1 << prices.length; mask += 1) {
      const cart = prices.map((_, i) => i).filter((i) => mask & (1 << i)), total = sum(cart.map((i) => prices[i]));
      const good = cart.length > 0 && total <= budget && total >= min, res = submit(round, { cart });
      ok(res.correct === good, `${label} cart ${cart} total ${total}`);
      if (good) valid += 1;
      else ok(res.mistake === (cart.length === 0 ? "empty-cart" : total > budget ? "over-budget" : "under-target"), `${label} cart mistake`);
    }
    ok(valid >= 1 && game.answerText(round).startsWith("$"), `${label} has a solution`);
  }

  function checkHints(round, label) { // FM-062
    const answer = game.answerText(round), tiers = [0, 1, 2, 3].map((tier) => game.hint(round, tier, null));
    for (const [tier, h] of tiers.entries()) {
      ok(h.en?.trim() && h.es?.trim() && h.en !== h.es, `${label} hint ${tier} in both languages`);
      if (tier < 3) ok(!leaks(h.en, answer, round, "en") && !leaks(h.es, answer, round, "es"), `${label} hint ${tier} leaks the answer ${answer}: ${h.en}`);
      else ok(h.en.includes(answer) && h.es.includes(answer), `${label} tier 3 states the answer ${answer}`);
    }
    ok(new Set(tiers.slice(0, 3).map((h) => h.en)).size === 3, `${label} hint tiers differ`);
  }

  let rounds = 0;
  const demandBySkill = new Map();
  for (const skill of game.skills) {
    for (let grade = skill.grades[0]; grade <= skill.grades[1]; grade += 1) {
      for (let level = 1; level <= 3; level += 1) {
        const demands = [];
        for (let i = 0; i < SEEDS; i += 1) {
          const round = game.makeRound(skill.id, level, rngFor(skill.id, grade, level, i), grade), label = `${skill.id} g${grade} L${level} #${i}`;
          rounds += 1;
          assert.deepEqual(JSON.parse(JSON.stringify(round)), round, `${label} JSON round trip`); // pure and serializable
          assert.deepEqual(game.makeRound(skill.id, level, rngFor(skill.id, grade, level, i), grade), round, `${label} deterministic`);
          ok(round.skillId === skill.id && round.level === level, `${label} identity`);
          ok(round.prompt.en.trim() && round.prompt.es.trim() && round.prompt.en !== round.prompt.es, `${label} prompt in both languages`);
          assert.deepEqual(moneyTokens(round.prompt.en), moneyTokens(round.prompt.es), `${label} same amounts in both languages`);
          const known = new Set([...flatten(round.params), (round.params.place || 0) * 100]);
          for (const cents of moneyTokens(round.prompt.en)) ok(known.has(cents), `${label} prompt amount ${cents} comes from params`);
          for (const cents of REQUIRED[skill.id]?.(round.params) || []) ok(moneyTokens(round.prompt.en).includes(cents), `${label} prompt states ${cents}`);
          ok(Math.max(...moneyNumbers(round)) <= LIMIT[grade], `${label} within the grade ${grade} limit (${Math.max(...moneyNumbers(round))})`); // FM-051
          for (const r of Object.values(round.expect || {})) ok(r.n >= 0 && r.d >= 1, `${label} non-negative exact answer`); // FM-055
          demands.push(demand(round));
          ok(submit(round, game.solve(round)).correct, `${label} solve() is accepted`);
          if (round.kind === "enter" || round.kind === "pickEnter") checkEnter(skill.id, round, label);
          else if (round.kind === "pick") checkPick(round, label);
          else if (round.kind === "tray") checkTray(skill.id, round, label);
          else checkCart(round, label);
          checkHints(round, label);
        }
        demandBySkill.set(`${skill.id}|${grade}`, { ...demandBySkill.get(`${skill.id}|${grade}`), [level]: mean(demands) });
      }
    }
  }

  // ---- 4. variety and difficulty (FM-061) --------------------------------------------------------------------------
  for (const skill of game.skills) {
    for (let level = 1; level <= 3; level += 1) {
      const prints = new Set();
      for (let i = 0; i < 100; i += 1) prints.add(JSON.stringify(game.makeRound(skill.id, level, rngFor(skill.id, skill.grades[0], level, 1000 + i), skill.grades[0])));
      ok(prints.size >= 30, `${skill.id} L${level}: ${prints.size} distinct rounds in 100 seeds`);
    }
  }
  const flat = [...demandBySkill].filter(([, d]) => !(d[3] > d[1])).map(([key, d]) => `${key}: ${d[1].toFixed(2)} -> ${d[3].toFixed(2)}`);
  ok(flat.length === 0, `level 3 must demand more than level 1; not rising: ${flat.join("; ")}`);

  // ---- 5. feedback catalogue (FM-063) ------------------------------------------------------------------------------
  for (const key of Object.keys(MISTAKES)) ok(seen.has(key), `mistake "${key}" was exercised by the sweep`);
  for (const key of seen) ok(key === "recheck" || MISTAKES[key], `feedback exists for ${key}`);
  const texts = [...feedbackByKey].filter(([key]) => !key.startsWith("recheck")).map(([, f]) => f.en);
  ok(new Set(texts).size === texts.length, "every named mistake has its own feedback");
  const generic = new Set(Object.values(RECHECK).map((x) => x.en));
  for (const t of texts) ok(!generic.has(t), "named feedback is not the generic text");
  for (const skill of game.skills) ok(RECHECK[skill.id]?.en && RECHECK[skill.id].es !== RECHECK[skill.id].en, `${skill.id} has its own fallback feedback`);

  // ---- 6. the register in jsdom: pieces, keyboard, language switch, shell hints (FM-032 FM-033 FM-020) -------------
  const root = document.querySelector("#root"), q = (selector) => root.querySelector(selector), qa = (selector) => [...root.querySelectorAll(selector)];
  const click = (el) => el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  const press = (el, key) => el.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  const typeInto = (value) => { const field = q("input[data-mm-field]"); field.value = value; field.dispatchEvent(new dom.window.Event("input", { bubbles: true })); };
  const context = (round) => { const calls = []; return { calls, round, lang: "en", announce: (text) => calls.push(["say", text]), locked: () => false, submit: (response) => { calls.push(["submit", response]); return game.check(round, response); } }; };

  const pay = game.makeRound("exact-pay", 1, makeRng(3), 3), ctx = context(pay), view = mount(root, ctx);
  ok(qa("[data-mm-add]").length === pay.pool.length && q("[data-mm-total]").textContent === "$0.00", "a key for every coin in the pool and an empty tray");
  for (const piece of [25, 25, 5]) click(q(`[data-mm-add='${piece}']`));
  ok(qa("[data-mm-out]").length === 3 && q("[data-mm-total]").textContent === "$0.55", "tapping coins fills the tray and shows the running total");
  ok(ctx.calls.some(([, text]) => /\$0\.55/.test(String(text))), "each change is announced with the total");
  press(q("[data-mm-add='5']"), "Backspace");
  ok(qa("[data-mm-out]").length === 2 && q("[data-mm-total]").textContent === "$0.50", "Backspace takes the last piece back out");
  click(q("[data-mm-out='0']"));
  ok(qa("[data-mm-out]").length === 1, "tapping a placed piece removes it");
  view.setLang("es");
  ok(qa("[data-mm-out]").length === 1 && /moneda|centavo/.test(q(".mm-key-name").textContent) && /Pagar/.test(q("[data-mm-submit]").textContent), "language switch keeps the tray and relabels the keys");
  view.setLang("en");
  click(q("[data-mm-clear]"));
  ok(qa("[data-mm-out]").length === 0, "clear empties the tray");
  for (const piece of game.solve(pay).tray) click(q(`[data-mm-add='${piece}']`));
  click(q("[data-mm-submit]"));
  ok(game.check(pay, ctx.calls.at(-1)[1]).correct && q("[data-mm-submit]").disabled, "the tray is submitted as the response and the controls lock");
  view.destroy();
  ok(root.innerHTML === "", "destroy empties the stage");

  const typed = game.makeRound("percent-off", 2, makeRng(4), 6), tctx = context(typed), tview = mount(root, tctx);
  ok(q("input[data-mm-field]").getAttribute("inputmode") === "decimal" && q("input[data-mm-field]").type === "text", "numeric entry is a real input with inputmode decimal");
  click(q("[data-mm-submit]"));
  ok(!tctx.calls.some(([kind]) => kind === "submit") && /number|número/.test(q("[data-mm-msg]").textContent), "empty entry asks for a number and is not an attempt");
  typeInto("1.25");
  tview.setLang("es");
  ok(q("input[data-mm-field]").value === "1.25", "typed text survives a language switch");
  press(q("input[data-mm-field]"), "Enter");
  ok(tctx.calls.at(-1)[0] === "submit" && tctx.calls.at(-1)[1].values.answer === "1.25", "Enter submits the typed value");
  tview.destroy();

  const store = createStore({ profile: 0, storage: { getItem: () => null, setItem: () => {} } });
  const session = startActivity({ root, game, store, grade: 0, skillId: "penny-count", level: 2, rounds: 2, seed: 77, lang: "en" });
  const shown = [];
  for (let i = 0; i < 3; i += 1) { click(q("[data-fm2-hint]")); shown.push(q("[data-fm2-hintbox]").textContent); }
  const live = window.__fm2.round, answer = game.answerText(live);
  ok(new Set(shown).size === 3 && !leaks(shown.join(" "), answer, live, "en"), "shell hint tiers 0-2 differ and do not leak");
  for (let i = 0; i < 3; i += 1) { typeInto("99"); click(q("[data-mm-submit]")); }
  ok(!q("[data-fm2-showme]").hidden, "Show me appears after three misses");
  click(q("[data-fm2-showme]"));
  ok(q("[data-fm2-hintbox]").textContent.includes(answer) && !q("[data-fm2-next]").hidden, "Show me states the answer and offers Next");
  await Promise.resolve(); // the register watches the shell with a MutationObserver, which runs as a microtask
  ok(q("[data-mm-submit]").disabled, "the register locks when the answer is shown");
  click(q("[data-fm2-lang]"));
  ok(/Solución/.test(q("[data-fm2-hintbox]").textContent), "the solution switches to Spanish");
  session.destroy();

  // ---- 7. repo rules for student games: no timers, links, external scripts or emoji; files stay small (FM-017) ------
  const folder = new URL(`${base}/games/math-market/`, import.meta.url);
  for (const [dir, name] of [...fs.readdirSync(folder).map((n) => [folder, n]), [new URL(`${base}/art/`, import.meta.url), "money.js"]]) {
    const source = fs.readFileSync(new URL(name, dir), "utf8");
    ok(source.split("\n").length <= 500, `${name} stays within 500 lines`);
    ok(!/\b(setInterval|setTimeout|requestAnimationFrame|Date\.now|countdown|timer)\b/i.test(source), `${name} has no timers or countdowns`);
    ok(!/<a\s|href=|https?:\/\//.test(source), `${name} has no links or external resources`);
    ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(source.replace(/[✓•→−×÷¢]/g, "")), `${name} uses no emoji`);
  }
  console.log(`math-market math suite: ${checks} checks, ${rounds} rounds (${game.skills.length} skills) passed.`);
}
await main();
