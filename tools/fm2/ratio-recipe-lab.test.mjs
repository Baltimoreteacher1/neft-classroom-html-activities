// Ratio Recipe Lab (game 8) math suite. Every round is re-derived by an ORACLE written in this file, from the round's own
// raw data (per-batch amounts, pinned amount, limits), with its own BigInt rationals; the game's generator, kit, checker and
// solver never produce an expected value. The "largest batch" constraint is brute-forced step by step. Wrong answers are
// built here and must be rejected with the specific mistake named; hints of tiers 0-2 are scanned for every answer token.
// @fm2 FM-014 FM-017 FM-019 FM-020 FM-032 FM-033 FM-050 FM-051 FM-052 FM-053 FM-054 FM-056 FM-057 FM-058 FM-059 FM-060
// @fm2 FM-061 FM-062 FM-063 FM-065 FM-077
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
const { default: game } = await import(`${base}/games/ratio-recipe-lab/index.js`);
const { validateGame } = await import(`${base}/contract.js`);
const { makeRng, seedFrom } = await import(`${base}/rng.js`);
const { missingLanguages } = await import(`${base}/lang.js`);
const { MISTAKES, UI, SKILL_COPY } = await import(`${base}/games/ratio-recipe-lab/copy.js`);
const { MISTAKE_CODES, feedbackFor } = await import(`${base}/games/ratio-recipe-lab/logic.js`);
const { mount } = await import(`${base}/games/ratio-recipe-lab/ui.js`);
const { fits } = await import(`${base}/games/ratio-recipe-lab/kit.js`);

let checks = 0;
const ok = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};

// ---- independent exact rationals (BigInt) -----------------------------------------------------------------------------------
const gcdB = (a, b) => {
  while (b) [a, b] = [b, a % b];
  return a < 0n ? -a : a || 1n;
};
const Q = (n, d = 1n) => {
  let N = BigInt(n);
  let D = BigInt(d);
  if (D < 0n) {
    N = -N;
    D = -D;
  }
  const g = gcdB(N, D);
  return { n: N / g, d: D / g };
};
const fromObj = (o) => Q(o.n, o.d);
const qadd = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d);
const qsub = (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d);
const qmul = (a, b) => Q(a.n * b.n, a.d * b.d);
const qdiv = (a, b) => Q(a.n * b.d, a.d * b.n);
const qcmp = (a, b) => {
  const x = a.n * b.d;
  const y = b.n * a.d;
  return x < y ? -1 : x > y ? 1 : 0;
};
const qeq = (a, b) => a.n === b.n && a.d === b.d;
const qnum = (a) => Number(a.n) / Number(a.d);
const isInt = (a) => a.d === 1n;
// text a learner could type -> Q ("3/2", "1.5", "1 1/2", "12"), null otherwise
function qparse(text) {
  const t = String(text).trim();
  let m = /^(\d+)$/.exec(t);
  if (m) return Q(m[1]);
  m = /^(\d+)\/(\d+)$/.exec(t);
  if (m) return Q(m[1], m[2]);
  m = /^(\d+) (\d+)\/(\d+)$/.exec(t);
  if (m) return qadd(Q(m[1]), Q(m[2], m[3]));
  m = /^(\d+)\.(\d+)$/.exec(t);
  if (m) return Q(m[1] + m[2], 10n ** BigInt(m[2].length));
  return null;
}
// every way the game may print a value, for the leak scan
function forms(q) {
  const out = new Set();
  if (isInt(q)) out.add(String(q.n));
  else {
    out.add(`${q.n}/${q.d}`);
    if (q.n > q.d) out.add(`${q.n / q.d} ${q.n % q.d}/${q.d}`);
  }
  for (let k = 1n; k <= 6n; k += 1n) {
    const scaled = q.n * 10n ** k;
    if (scaled % q.d === 0n) {
      const digits = String(scaled / q.d).padStart(Number(k) + 1, "0");
      out.add(
        `${digits.slice(0, -Number(k))}.${digits.slice(-Number(k))}`
          .replace(/(\.\d*?)0+$/, "$1")
          .replace(/\.$/, ""),
      );
      break;
    }
  }
  return [...out];
}
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// A token is "standalone" unless it is part of a longer number: digits, a fraction bar, a decimal point or a mixed number.
const standalone = (text, token) =>
  new RegExp(`(?<![\\d/]|\\d\\.)(?<!\\d )${escapeRe(token)}(?![\\d/]|\\.\\d)(?! \\d+/\\d+)`).test(
    text,
  );
const WORDS = {
  en: [
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
    "twenty",
  ],
  es: [
    "dos",
    "tres",
    "cuatro",
    "cinco",
    "seis",
    "siete",
    "ocho",
    "nueve",
    "diez",
    "once",
    "doce",
    "trece",
    "catorce",
    "quince",
    "dieciséis",
    "diecisiete",
    "dieciocho",
    "diecinueve",
    "veinte",
  ],
};
const wordOf = (q, lang) =>
  isInt(q) && q.n >= 2n && q.n <= 20n ? WORDS[lang][Number(q.n) - 2] : null;

// ---- the oracle -------------------------------------------------------------------------------------------------------------
function bruteLargestBatch(col) {
  const step = fromObj(col.step);
  let best = null;
  for (let k = 0n; k <= 6000n; k += 1n) {
    const b = qmul(step, Q(k));
    const feasible = Object.entries(col.limit.have).every(
      ([key, have]) => qcmp(qmul(fromObj(col.per[key]), b), fromObj(have)) <= 0,
    );
    if (!feasible) break;
    best = b;
  }
  return best;
}
function derive(round) {
  const cols = round.cols.map((col) => {
    const per = Object.fromEntries(Object.entries(col.per).map(([k, v]) => [k, fromObj(v)]));
    let batch;
    if (col.pin) {
      batch = qdiv(fromObj(col.pin.value), per[col.pin.key]);
      assert.ok(
        qeq(qmul(per[col.pin.key], batch), fromObj(col.pin.value)),
        "pinned amount is reproduced",
      );
    } else batch = bruteLargestBatch(col);
    return {
      per,
      batch,
      values: Object.fromEntries(col.ask.map((key) => [key, qmul(per[key], batch)])),
    };
  });
  const extras = {};
  const ratioOf = (c, a, b) => qdiv(c.per[a], c.per[b]);
  for (const e of round.extra) {
    if (e.kind === "ratio") {
      const [r0, r1] = round.rows.slice(0, 2).map((r) => cols[0].per[r.key]);
      const g = gcdB(r0.n, r1.n);
      extras[e.key] = [r0.n / g, r1.n / g];
    } else if (e.key === "diff") {
      const totals = cols.map((c) =>
        qmul(c.per[round.rows[1].key], fromObj(round.cols[cols.indexOf(c)].pin.value)),
      );
      extras[e.key] =
        qcmp(totals[0], totals[1]) > 0 ? qsub(totals[0], totals[1]) : qsub(totals[1], totals[0]);
    } else if (e.key === "gap") {
      const r = cols.map((c) => qdiv(c.per.a, c.per.b));
      extras[e.key] = qcmp(r[0], r[1]) > 0 ? qsub(r[0], r[1]) : qsub(r[1], r[0]);
    } else if (e.key === "speed") extras[e.key] = ratioOf(cols[0], "dist", "time");
    else extras[e.key] = ratioOf(cols[0], "y", "x");
  }
  let pick = null;
  if (round.pick) {
    const metric = (c, i) =>
      round.skillId === "more-fewer"
        ? qmul(c.per[round.rows[1].key], fromObj(round.cols[i].pin.value))
        : round.skillId === "stronger-mix"
          ? qdiv(c.per.a, c.per.b)
          : qdiv(c.per.y, c.per.x);
    const m = cols.map(metric);
    assert.notEqual(qcmp(m[0], m[1]), 0, "the two options differ");
    pick = qcmp(m[0], m[1]) > 0 ? 0 : 1;
  }
  return { cols, extras, pick };
}

// ---- tables declared by this suite ------------------------------------------------------------------------------------------
const LIMITS = { 0: 20, 1: 20, 2: 20, 3: 60, 4: 100, 5: 100, 6: 1000, 7: 1000, 8: 1000 };
const PLAUSIBLE = {
  cook: { cup: 12, tbsp: 24, count: 12 },
  crowd: { cup: 48, tbsp: 48, count: 24 },
  craft: { cup: 60, count: 100, scoop: 30, gallon: 30 },
};
const STANDARD = /^(K|[1-8])\.[A-Z]{1,3}\.[A-Z]\.\d+[a-z]?$/;

function allNumbers(round, d) {
  const out = [];
  round.cols.forEach((col, i) => {
    out.push(
      ...Object.values(col.per).map(fromObj),
      d.cols[i].batch,
      ...Object.values(d.cols[i].values),
    );
    if (col.pin) out.push(fromObj(col.pin.value));
    if (col.limit) out.push(...Object.values(col.limit.have).map(fromObj));
  });
  for (const v of Object.values(d.extras)) if (!Array.isArray(v)) out.push(v);
  for (const pair of round.source?.pairs || []) out.push(...pair.map(fromObj));
  return out;
}
function difficulty(round, d) {
  const max = Math.max(...allNumbers(round, d).map(qnum));
  const mixed = allNumbers(round, d).filter((q) => !isInt(q)).length;
  return (
    round.cols.reduce((s, c) => s + c.ask.length + (c.limit ? 2 : 0), 0) +
    2 * (round.cols.length - 1) +
    (round.hide ? 2 : 0) +
    round.extra.length +
    (round.pick ? 1 : 0) +
    Math.log10(1 + max) +
    (mixed ? 0.5 : 0)
  );
}
const rngFor = (skill, grade, level, i) => makeRng(seedFrom("rrl-test", skill, grade, level, i));
const SEEDS = 40;

// biome-ignore format: dense script, one assertion per line
async function main() {
  // ---- contract, inventory, bilingual copy ---------------------------------------------------------------------------------
  ok(validateGame(game).length === 0, `validateGame: ${validateGame(game)}`);
  ok(game.id === "ratio-recipe-lab" && game.order === 8 && game.mechanic === "scaling-table-lab", "id, order and mechanic tag");
  const gamesDir = new URL(`${base}/games/`, import.meta.url);
  for (const dir of fs.readdirSync(gamesDir)) {
    if (dir === "ratio-recipe-lab" || !fs.existsSync(new URL(`${dir}/index.js`, gamesDir)))
      continue;
    const other = (await import(new URL(`${dir}/index.js`, gamesDir).href)).default;
    ok(other.mechanic !== game.mechanic, `mechanic differs from ${dir}`);
  }
  ok(game.skills.length >= 14, `at least 14 skills (${game.skills.length})`);
  for (let g = 0; g <= 8; g += 1)
    ok(game.skills.filter((s) => s.grades[0] <= g && g <= s.grades[1]).length >= 2, `grade ${g} has at least 2 skills`);
  for (const s of game.skills) {
    ok(STANDARD.test(s.standard), `${s.id}: standard code ${s.standard}`);
    ok(SKILL_COPY[s.id] && s.strand.en && s.title.en && s.strand.es && s.title.es, `${s.id}: strand and title in both languages`);
    ok(s.title.es !== s.title.en, `${s.id}: Spanish title differs from English`);
  }
  ok(missingLanguages(MISTAKES, "MISTAKES").length === 0 && missingLanguages(UI, "UI").length === 0, "UI and MISTAKES copy carry both languages");
  for (const code of MISTAKE_CODES) {
    const text = feedbackFor(code);
    ok(text.en.trim() && text.es.trim() && text.en !== text.es, `feedback ${code} exists in both languages and differs`);
  }
  ok(new Set(MISTAKE_CODES.map((c) => feedbackFor(c).en)).size === MISTAKE_CODES.length, "every mistake has its own English text");

  // ---- every skill x grade x level x seeds ----------------------------------------------------------------------------------
  const seen = new Set();
  const feedbackSeen = new Map();
  const diffMean = {};
  let rounds = 0;
  const order = [];
  const note = (round, response, expectCode, label) => {
    const result = game.check(round, response);
    ok(!result.correct, `${round.skillId}: ${label} is rejected`);
    ok(result.mistake === expectCode, `${round.skillId}/${round.level}: ${label} names ${expectCode}, got ${result.mistake}`);
    ok(result.feedback.en.trim() && result.feedback.es.trim() && result.feedback.es !== result.feedback.en, `${expectCode}: feedback in both languages`);
    ok(!result.feedback.en.includes(game.answerText(round)) && !/=/.test(result.feedback.en), `${expectCode}: feedback does not print the worked solution`);
    seen.add(expectCode);
    feedbackSeen.set(expectCode, result.feedback.en);
  };
  const typedOf = (q) => (isInt(q) ? String(q.n) : `${q.n}/${q.d}`);

  for (const skill of game.skills) {
    for (let grade = skill.grades[0]; grade <= skill.grades[1]; grade += 1) {
      for (let level = 1; level <= 3; level += 1) {
        const diffs = [];
        for (let i = 0; i < SEEDS; i += 1) {
          const round = game.makeRound(skill.id, level, rngFor(skill.id, grade, level, i), grade);
          rounds += 1;
          ok(fits(round), `${skill.id}: the generator found a round that passes its own filters (no fallback)`);
          // JSON, determinism, bilingual prompt
          ok(JSON.stringify(JSON.parse(JSON.stringify(round))) === JSON.stringify(round), `${skill.id}: round is JSON-serializable`);
          const again = game.makeRound(skill.id, level, rngFor(skill.id, grade, level, i), grade);
          ok(JSON.stringify(again) === JSON.stringify(round), `${skill.id}: same seed, same round`);
          ok(round.prompt.en.trim().length > 20 && round.prompt.es.trim().length > 20 && round.prompt.es !== round.prompt.en, `${skill.id}: prompt in both languages`);
          ok(!/undefined|NaN|\[object/.test(round.prompt.en + round.prompt.es), `${skill.id}: prompt has no stray tokens`);

          // the oracle against the stored round and against solve()
          const d = derive(round);
          const solution = game.solve(round);
          round.cols.forEach((col, ci) => {
            ok(qeq(fromObj(col.batch), d.cols[ci].batch), `${skill.id}: stored batch equals the oracle (${ci})`);
            ok(qeq(qparse(solution.cols[ci].batch), d.cols[ci].batch), `${skill.id}: solve() batch equals the oracle`);
            for (const key of col.ask)
              ok(qeq(qparse(solution.cols[ci].values[key]), d.cols[ci].values[key]), `${skill.id}: solve() amount ${key} equals the oracle`);
            if (col.limit) {
              ok(Object.entries(col.limit.have).some(([key, h]) => qcmp(qmul(fromObj(col.per[key]), qadd(d.cols[ci].batch, fromObj(col.step))), fromObj(h)) > 0), `${skill.id}: one more step would not fit (largest batch)`);
              if (round.exact)
                ok(Object.entries(col.limit.have).some(([key, h]) => qeq(qmul(fromObj(col.per[key]), d.cols[ci].batch), fromObj(h))), `${skill.id}: whole-number limit fits exactly (no remainder)`);
            }
            ok(qcmp(d.cols[ci].batch, Q(0)) > 0, `${skill.id}: batch is positive`);
          });
          for (const e of round.extra)
            ok(e.kind === "ratio" ? e.answer.join(":") === d.extras[e.key].join(":") : qeq(fromObj(e.answer), d.extras[e.key]), `${skill.id}: extra ${e.key} equals the oracle`);
          if (round.pick)
            ok(round.pick.answer === d.pick, `${skill.id}: option answer equals the oracle`);
          ok(game.check(round, solution).correct, `${skill.id}: solve() is accepted by check()`);

          // numbers: per-grade size limit, number types, plausible kitchen amounts
          const numbers = allNumbers(round, d);
          ok(numbers.every((q) => qnum(q) <= LIMITS[grade]), `${skill.id} g${grade}: every number is at most ${LIMITS[grade]}`);
          ok(numbers.every((q) => q.n >= 0n), `${skill.id}: no negative numbers`);
          if (grade <= 3)
            ok(round.cols.every((c, ci) => Object.values(c.per).every((v) => v.d === 1) && Object.values(d.cols[ci].values).every(isInt)), `${skill.id} g${grade}: whole numbers only in early grades`);
          if (grade <= 3 && skill.id !== "double-half")
            ok(d.cols.every((c) => isInt(c.batch)), `${skill.id} g${grade}: whole-number batches`);
          if (grade <= 5)
            ok(round.style === "mixed" && numbers.every((q) => q.d <= 12n), `${skill.id} g${grade}: fractions only, denominators at most 12`);
          if (round.style === "dec")
            ok(numbers.every((q) => forms(q).some((f) => /^\d+(\.\d{1,3})?$/.test(f))), `${skill.id}: decimal rounds use terminating decimals`);
          const caps = PLAUSIBLE[round.recipe.family];
          if (caps)
            round.cols.forEach((_col, ci) => {
              for (const row of round.rows) {
                const key = row.noun ? "count" : row.unit;
                if (caps[key])
                  ok(qnum(qmul(d.cols[ci].per[row.key], d.cols[ci].batch)) <= caps[key], `${skill.id}: ${row.key} stays plausible (${round.recipe.family} ${key} <= ${caps[key]})`);
              }
            });

          // wrong answers are rejected (and verified wrong by the oracle), empty input is handled
          ok(!game.check(round, {}).correct && !game.check(round, null).correct && !game.check(round, { cols: [] }).correct, `${skill.id}: empty responses are rejected`);
          const c0 = round.cols[0];
          const b0 = d.cols[0].batch;
          const step = fromObj(c0.step);
          const with0 = (patch) => ({
            ...solution,
            cols: solution.cols.map((c, i) => (i === 0 ? { ...c, ...patch } : c)),
          });
          ok(!game.check(round, with0({ batch: typedOf(qadd(b0, step)) })).correct, `${skill.id}: a batch one step too big is rejected`);
          ok(!game.check(round, with0({ batch: "" })).correct && game.check(round, with0({ batch: "" })).mistake === "no-batch", `${skill.id}: a blank batch is named`);
          for (const key of c0.ask) {
            const wrong = qadd(d.cols[0].values[key], Q(1));
            ok(!game.check(round, with0({ values: { ...solution.cols[0].values, [key]: typedOf(wrong) } })).correct, `${skill.id}: ${key} off by one is rejected`);
            ok(game.check(round, with0({ values: { ...solution.cols[0].values, [key]: "" } })) .mistake === "value-missing", `${skill.id}: a blank amount is named`);
          }
          if (round.pick)
            note(round, { ...solution, pick: 1 - d.pick }, round.pick.wrong, "the wrong option");
          // several scale paths: any batch text that equals the oracle value is accepted (3/2 = 1.5 = 1 1/2 = 3/2)
          const alt = [...forms(b0), `${b0.n * 2n}/${b0.d * 2n}`];
          for (const text of alt)
            ok(game.check(round, with0({ batch: text })).correct, `${skill.id}: ${text} is accepted for batch ${typedOf(b0)}`);

          // specific mistakes, one family per structure
          const pinCol = c0.pin ? c0 : null;
          if (pinCol && !round.pick && round.cols.length === 1) {
            const per = d.cols[0].per[pinCol.pin.key];
            const need = fromObj(pinCol.pin.value);
            const known = new Set([typedOf(b0)]);
            const probe = (value, code, label) => {
              if (value.n <= 0n || known.has(typedOf(value))) return;
              known.add(typedOf(value));
              note(round, with0({ batch: typedOf(value) }), code, label);
            };
            if (round.hintKind === "inverse") {
              probe(need, "inv-target", "total used as the answer");
              probe(qmul(per, need), "inv-multiply", "multiplied instead of divided");
              if (qcmp(need, per) > 0) probe(qsub(need, per), "inv-diff", "subtracted");
            } else if (!qeq(per, Q(1))) {
              if (qcmp(need, per) > 0)
                probe(qsub(need, per), "batch-diff", "difference used as the batch");
              probe(need, "batch-target", "needed amount used as the batch");
              probe(qdiv(per, need), "batch-inverse", "upside-down batch");
            }
            // value mistakes at the right batch
            for (const key of c0.ask) {
              const p = d.cols[0].per[key];
              const right = d.cols[0].values[key];
              const used = new Set([typedOf(right)]);
              const vprobe = (value, code, label) => {
                if (value.n < 0n || used.has(typedOf(value))) return;
                used.add(typedOf(value));
                note(round, with0({ values: { ...solution.cols[0].values, [key]: typedOf(value) } }), code, label);
              };
              vprobe(p, "value-unscaled", "single-batch amount");
              vprobe(
                qadd(p, qsub(need, per)),
                "value-additive",
                "same amount added to every ingredient",
              );
              if (qcmp(b0, Q(0)) > 0)
                vprobe(qdiv(p, b0), "value-flipped", "divided instead of multiplied");
            }
          }
          if (c0.limit && round.cols.length === 1) {
            const over = qadd(b0, step);
            note(round, with0({ batch: typedOf(over) }), "limit-over", "a batch that needs more than you have");
            if (qcmp(b0, step) > 0)
              note(round, with0({ batch: typedOf(qsub(b0, step)) }), "limit-small", "a batch that is not the biggest");
            if (!isInt(qdiv(b0, step)) === false && step.d > 1n)
              note(round, with0({ batch: typedOf(qsub(b0, qdiv(step, Q(2)))) }), "limit-step", "a batch that is not whole steps");
          }
          if (round.skillId === "unit-rate" && round.cols.length === 1) {
            const key = c0.ask[0];
            const right = d.cols[0].values[key];
            note(round, with0({ values: { ...solution.cols[0].values, [key]: typedOf(qdiv(Q(1), right)) } }), "value-inverse", "rate the other way around");
          }
          if (
            (round.skillId === "unit-rate" || round.skillId === "percent-per-100") &&
            c0.pin &&
            qnum(d.cols[0].batch) < 1
          ) {
            const per = d.cols[0].per[c0.pin.key];
            const need = fromObj(c0.pin.value);
            const avoid = new Set([
              typedOf(qdiv(per, need)),
              typedOf(need),
              typedOf(qsub(need, per)),
              typedOf(d.cols[0].batch),
            ]);
            const grow = ["2", "3", "5", "7", "9"].find((c) => !avoid.has(c));
            if (qcmp(need, Q(1)) <= 0 || qcmp(need, per) < 0)
              note(round, with0({ batch: grow }), "batch-should-shrink", "scaling up when the goal is smaller than a batch");
          }
          for (const e of round.extra) {
            const withExtra = (text) => ({
              ...solution,
              extra: { ...solution.extra, [e.key]: text },
            });
            if (e.kind === "ratio") {
              const [a, b] = e.answer;
              note(round, withExtra(`${b}:${a}`), "ratio-flipped", "ratio in the wrong order");
              const [r0, r1] = [d.cols[0].per[round.rows[0].key], d.cols[0].per[round.rows[1].key]];
              if (!qeq(r0, Q(a)) || !qeq(r1, Q(b)))
                note(round, withExtra(`${r0.n}:${r1.n}`), "ratio-unreduced", "ratio not in simplest form");
              note(round, withExtra(`${a + 1}:${b}`), "ratio-wrong", "not an equivalent ratio");
              note(round, withExtra("3"), "ratio-missing", "no colon");
            } else if (e.key === "k")
              note(round, withExtra(typedOf(qdiv(Q(1), d.extras.k))), "extra-flip", "k flipped");
            else if (e.key === "gap")
              note(round, withExtra(typedOf(qadd(d.extras.gap, Q(1)))), "extra-gap", "gap off");
            else if (e.key === "diff") {
              const sum = d.cols.reduce(
                (s, c, i) =>
                  qadd(s, qmul(c.per[round.rows[1].key], fromObj(round.cols[i].pin.value))),
                Q(0),
              );
              note(round, withExtra(typedOf(sum)), "extra-sum", "added the two trays");
            }
          }
          if (round.pick && ["pick-more-bowls", "pick-total"].includes(round.pick.wrong)) {
            const m = d.cols.map((c, i) =>
              round.skillId === "more-fewer"
                ? [
                    fromObj(round.cols[i].pin.value),
                    qmul(c.per[round.rows[1].key], fromObj(round.cols[i].pin.value)),
                  ]
                : [c.per.a, qdiv(c.per.a, c.per.b)],
            );
            const weak = 1 - d.pick;
            ok(qcmp(m[weak][0], m[d.pick][0]) > 0, `${skill.id}: the ${round.pick.wrong} trap is real (the weaker option shows the bigger first number)`);
          }

          // hints: tiers 0-2 never contain an answer token or number word; tier 3 states the answer; ES differs
          const answer = game.answerText(round);
          ok(answer.length > 0 && answer.length < 80, `${skill.id}: answer text is short`);
          const tokens = [];
          d.cols.forEach((c, ci) => {
            const trivial =
              round.cols[ci].pin &&
              qeq(c.per[round.cols[ci].pin.key], Q(1)) &&
              qeq(fromObj(round.cols[ci].pin.value), c.batch);
            if (!trivial) tokens.push(c.batch);
            tokens.push(...Object.values(c.values));
          });
          for (const v of Object.values(d.extras)) if (!Array.isArray(v)) tokens.push(v);
          const tiers = [0, 1, 2, 3].map((t) => game.hint(round, t));
          for (let t = 0; t < 4; t += 1)
            ok(tiers[t].en.trim() && tiers[t].es.trim() && tiers[t].en !== tiers[t].es, `${skill.id}: hint tier ${t} in both languages`);
          ok(new Set(tiers.map((h) => h.en)).size === 4, `${skill.id}: four different hint texts`);
          for (let t = 0; t < 3; t += 1) {
            for (const lang of ["en", "es"]) {
              const text = tiers[t][lang];
              ok(!text.includes(answer), `${skill.id}: hint ${t} (${lang}) omits the answer text`);
              for (const q of tokens) {
                for (const f of forms(q))
                  ok(!standalone(text, f), `${skill.id}/L${level}: hint ${t} (${lang}) leaks "${f}": ${text}`);
                const word = wordOf(q, lang);
                if (word)
                  ok(!new RegExp(`\\b${word}\\b`, "i").test(text), `${skill.id}: hint ${t} (${lang}) leaks the word ${word}`);
              }
            }
          }
          ok(tiers[3].en.includes(answer) && tiers[3].es.includes(answer), `${skill.id}: tier 3 states the answer`);
          diffs.push(difficulty(round, d));
        }
        diffMean[`${skill.id}:${grade}:${level}`] = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      }
      const [d1, d2, d3] = [1, 2, 3].map((l) => diffMean[`${skill.id}:${grade}:${l}`]);
      if (!(d3 > d1))
        order.push(`${skill.id} g${grade}: L3 ${d3.toFixed(2)} !> L1 ${d1.toFixed(2)}`);
      if (!(d2 >= d1 - 0.01 && d3 >= d2 - 0.01))
        order.push(
          `${skill.id} g${grade}: not monotone ${d1.toFixed(2)} ${d2.toFixed(2)} ${d3.toFixed(2)}`,
        );
    }
  }

  ok(order.length === 0, `level 3 demands more than level 1, and levels rise: ${order.join("; ")}`);

  // every catalogued mistake was provoked and answered with its own specific feedback
  const MUST = [
    "no-batch",
    "batch-diff",
    "batch-target",
    "batch-inverse",
    "batch-should-shrink",
    "limit-over",
    "limit-small",
    "value-missing",
    "value-unscaled",
    "value-additive",
    "value-flipped",
    "value-inverse",
    "inv-target",
    "inv-multiply",
    "inv-diff",
    "pick-fewer",
    "pick-more-bowls",
    "pick-total",
    "extra-sum",
    "extra-flip",
    "extra-gap",
    "ratio-flipped",
    "ratio-unreduced",
    "ratio-wrong",
    "ratio-missing",
  ];
  for (const code of MUST) {
    // blank-batch and blank-amount codes are provoked above with their own assertions
    if (code === "no-batch" || code === "value-missing") continue;
    ok(seen.has(code), `mistake ${code} was provoked by some round`);
  }
  console.log(
    `PASS ${rounds} rounds across ${game.skills.length} skills: oracle, solve/check, limits, hints, feedback (${seen.size} distinct mistakes provoked)`,
  );

  // ---- variety: >= 30 distinct fingerprints over 100 seeds for each skill ----------------------------------------------------
  const lows = [];
  for (const skill of game.skills) {
    for (let grade = skill.grades[0]; grade <= skill.grades[1]; grade += 1) {
      const prints = new Set();
      for (let level = 1; level <= 3; level += 1) {
        const perLevel = new Set();
        for (let i = 0; i < 100; i += 1) {
          const round = game.makeRound(
            skill.id,
            level,
            rngFor(skill.id, grade, level, 1000 + i),
            grade,
          );
          const print = JSON.stringify([
            round.prompt.en,
            round.cols.map((c) => [c.per, c.pin, c.limit?.have]),
            round.source,
            game.answerText(round),
          ]);
          perLevel.add(print);
          prints.add(print);
        }
        if (perLevel.size < 30) lows.push(`${skill.id} g${grade} L${level}: ${perLevel.size}`);
      }
      ok(prints.size >= 30, `${skill.id} g${grade}: ${prints.size} distinct fingerprints across levels (>= 30)`);
    }
  }
  console.log(
    `PASS variety: every skill and grade has at least 30 distinct rounds${lows.length ? `; per-level lows: ${lows.join(", ")}` : "; every level too"}`,
  );
  ok(lows.length === 0, `every skill x grade x level has >= 30 distinct rounds in 100 seeds: ${lows.join(", ")}`);

  // ---- the model reacts to the batch: live cells and pictures equal the oracle (jsdom mount) --------------------------------
  await uiChecks();
  console.log(`ratio-recipe-lab math suite: ${checks} checks passed.`);
}

// biome-ignore format: dense DOM driving
async function uiChecks() {
  const root = document.querySelector("#root");
  const press = (el) => el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  const type = (el, value) => { el.value = value; el.dispatchEvent(new dom.window.Event("input", { bubbles: true })); };
  const samples = [["bowls-groups", 0], ["share-bowls", 1], ["double-half", 1], ["scale-whole", 3], ["fraction-batch", 4], ["graph-pairs", 5], ["unit-rate", 6], ["stronger-mix", 6], ["const-k", 7], ["compare-rates", 8], ["direct-variation", 8]];
  for (const [id, grade] of samples) {
    const skill = game.skills.find((s) => s.id === id);
    for (let level = 1; level <= 3; level += 1) {
      const round = game.makeRound(id, level, rngFor(id, grade, level, 7), grade);
      const d = derive(round);
      const submitted = [];
      const ctx = { round, lang: "en", mode: "solo", grade, level, skill, announce: () => {}, locked: () => false, submit: (r) => { submitted.push(r); return game.check(round, r); } };
      const handle = mount(root, ctx);
      const batchInput = () => root.querySelector("[data-rl-batch]");
      const stepOf = fromObj(round.cols[0].step);
      // typing a batch updates the live cells to per x batch (non-asked, non-pinned rows), checked against the oracle
      for (const text of [typedOf0(d.cols[0].batch), "2", "1/2", "3"]) {
        type(batchInput(), text);
        const b = qparse(text);
        round.rows.forEach((row) => {
          const cell = root.querySelector(`[data-rl-live="0:${row.key}"]`);
          if (!cell || cell.textContent === "?") return;
          const shown = qparse(cell.textContent.replace(/^(\d+)\.(\d+)$/, "$1.$2"));
          ok(shown && qeq(shown, qmul(d.cols[0].per[row.key], b)), `${id}: live cell ${row.key} equals per x batch (${cell.textContent} for batch ${text})`);
        });
      }
      // the picture follows the batch: bowl tiles = whole batches (+1 for a fraction), number line shows the batch
      if (round.view === "bowls") {
        type(batchInput(), "3");
        const tiles = root.querySelectorAll("svg path[d*='h84']").length;
        ok(tiles === 3, `${id}: three bowls are drawn for batch 3 (${tiles})`);
      }
      // + and - move by one step; slider has aria-valuetext
      type(batchInput(), "1");
      press(root.querySelector("[data-rl-inc]"));
      const afterInc = qparse(batchInput().value);
      ok(afterInc && qeq(afterInc, qadd(Q(1), stepOf)), `${id}: + adds one step`);
      press(root.querySelector("[data-rl-dec]"));
      ok(qeq(qparse(batchInput().value) ?? Q(0), Q(1)), `${id}: - takes it back`);
      ok((root.querySelector("[data-rl-slider]").getAttribute("aria-valuetext") || "").length > 0, `${id}: slider has aria-valuetext`);
      // a full solve through the DOM, then a language switch keeps typed work
      const sol = game.solve(round);
      round.cols.forEach((col, ci) => {
        if (round.cols.length > 1) press(root.querySelector(`[data-rl-col="${ci}"]`));
        type(batchInput(), sol.cols[ci].batch);
        for (const key of col.ask) type(root.querySelector(`[data-rl-field="${ci}:${key}"]`), sol.cols[ci].values[key]);
      });
      for (const e of round.extra) type(root.querySelector(`[data-rl-extra="${e.key}"]`), sol.extra[e.key]);
      if (round.pick) press(root.querySelector(`[data-rl-pick="${sol.pick}"]`));
      const before = root.querySelector("[data-rl-batch]").value;
      handle.setLang("es");
      ok(/Comprobar/.test(root.querySelector("[data-rl-submit]").textContent), `${id}: the button is in Spanish`);
      ok(root.querySelector("[data-rl-batch]").value === before, `${id}: the batch survives the language switch`);
      round.cols.forEach((col, ci) => {
        if (round.cols.length > 1) press(root.querySelector(`[data-rl-col="${ci}"]`));
        for (const key of col.ask) ok(root.querySelector(`[data-rl-field="${ci}:${key}"]`).value === sol.cols[ci].values[key], `${id}: typed amount ${key} survives the switch`);
      });
      handle.setLang("en");
      press(root.querySelector("[data-rl-submit]"));
      ok(submitted.length === 1 && game.check(round, submitted[0]).correct, `${id}/L${level}: the workbench submits a correct response typed through the DOM`);
      ok(root.querySelector("[data-rl-submit]").disabled, `${id}: controls lock after a correct answer`);
      handle.destroy();
    }
  }
  console.log("PASS workbench (jsdom): live cells equal the oracle, pictures follow the batch, language switch keeps work");
}
const typedOf0 = (q) => (q.d === 1n ? String(q.n) : `${q.n}/${q.d}`);

await main();
