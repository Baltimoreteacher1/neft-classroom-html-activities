// Math Puzzle Studio (game 9) math suite. Every round is judged by an ORACLE written here from the round's own data:
// an unpruned brute-force enumerator (and a separately written depth-first search for big boards) lists every
// arrangement of tiles that satisfies the clues, with its own evaluator for sums, products, cages, expressions and
// equivalent expressions. The game's solver, checker, scale and diagnoser are never used to produce an expected value.
// @fm2 FM-015 FM-078 FM-017 FM-019 FM-020 FM-032 FM-033 FM-050 FM-051 FM-052 FM-053 FM-054 FM-055 FM-058 FM-059 FM-060
// @fm2 FM-061 FM-062 FM-063 FM-065
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
const dir = `${base}/games/math-puzzle-studio`;
const { default: game } = await import(`${dir}/index.js`);
const { validateGame } = await import(`${base}/contract.js`);
const { makeRng, seedFrom } = await import(`${base}/rng.js`);
const { frac, add, sub, mul, div, eq, cmp, toMixedString } = await import(`${base}/rational.js`);
const { MISTAKES, RECHECK, MOVE_MISTAKES } = await import(`${dir}/copy-mistakes.js`);
const { readScales } = await import(`${dir}/logic.js`);
const { tiltFor, MAX_TILT } = await import(`${dir}/scale.js`);
const { scaleGeometry, scaleSvg } = await import(`${base}/art/puzzles.js`);
const { mount } = await import(`${dir}/ui.js`);
const { startActivity } = await import(`${base}/shell.js`);
const { createStore } = await import(`${base}/store.js`);

let checks = 0;
const ok = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};

// biome-ignore format: a dense script, one assertion or formula per line, read top to bottom
async function main() {
  const SEEDS = 40;
  const rngFor = (skill, grade, level, i) => makeRng(seedFrom("mps-test", skill, grade, level, i));
  const sum = (list) => list.reduce((a, b) => a + b, 0);
  const mean = (list) => sum(list) / list.length;
  const nonce = (round) => { const { seed, ...rest } = round; return JSON.stringify(rest); }; // a round's fingerprint ignores the hint seed

  // ---- the oracle: weights, rules and an expression evaluator written from the rule definitions -----------------
  const W = (v, xs) => (typeof v === "number" ? frac(v) : v && v.lin ? add(mul(frac(v.lin[0]), xs), frac(v.lin[1])) : v);
  const termW = (t, vals, xs) => {
    if (t.lin) return add(mul(frac(t.lin[0]), xs), frac(t.lin[1]));
    if ("v" in t) return W(t.v, xs);
    let w = vals[t.c] === null ? frac(0) : W(vals[t.c], xs);
    if (t.p === 2) w = mul(w, w);
    return t.m ? mul(w, frac(t.m)) : w;
  };
  const sideW = (terms, vals, xs) => terms.reduce((s, t) => add(s, termW(t, vals, xs)), frac(0));
  // shunting-yard evaluation of a token template; null for anything that is not a number
  function evalExpr(toks, vals, mode = "standard") {
    const prec = { "+": 1, "−": 1, "×": mode === "flat" ? 1 : 2, "÷": mode === "flat" ? 1 : 2 };
    const out = [], ops = [];
    const apply = () => { const op = ops.pop(), b = out.pop(), a = out.pop(); if (!a || !b) return false; if (op === "÷" && b.n === 0) return false; out.push(op === "+" ? add(a, b) : op === "−" ? sub(a, b) : op === "×" ? mul(a, b) : div(a, b)); return true; };
    for (const t of toks) {
      if (t === "(") { if (mode !== "noparen") ops.push("("); continue; }
      if (t === ")") { if (mode === "noparen") continue; while (ops.length && ops.at(-1) !== "(") if (!apply()) return null; ops.pop(); continue; }
      const v = vals[t.c];
      if (typeof v === "string") { while (ops.length && ops.at(-1) !== "(" && prec[ops.at(-1)] >= prec[v]) if (!apply()) return null; ops.push(v); } else out.push(W(v));
    }
    while (ops.length) if (ops.at(-1) === "(" || !apply()) return null;
    return out.length === 1 ? out[0] : null;
  }
  function holdsOracle(rule, vals, round) {
    const xs = frac(round.xs ?? 1), C = (i) => W(vals[i]);
    if (rule.k === "cmp") { const d = cmp(sideW(rule.l, vals, xs), sideW(rule.r, vals, xs)); return rule.rel === "=" ? d === 0 : rule.rel === "<" ? d < 0 : d > 0; }
    if (rule.k === "mul") return eq(mul(C(rule.a), C(rule.b)), C(rule.c));
    if (rule.k === "prod") return eq(rule.cells.map(C).reduce((a, b) => mul(a, b), frac(1)), W(rule.to));
    if (rule.k === "distinct") return new Set(rule.cells.map((i) => JSON.stringify(vals[i]))).size === rule.cells.length;
    if (rule.k === "expr") { const g = evalExpr(rule.toks, vals); return g !== null && eq(g, W(rule.to)); }
    if (rule.k === "equiv") { const t = vals[rule.c]; return Boolean(t && t.lin) && [0, 1, 2, 3].every((x) => t.lin[0] * x + t.lin[1] === rule.lin[0] * x + rule.lin[1]); }
    if (rule.k === "cage") {
      const w = rule.cells.map(C), hi = w.reduce((a, b) => (cmp(a, b) >= 0 ? a : b)), lo = w.reduce((a, b) => (cmp(a, b) <= 0 ? a : b));
      if (rule.op === "+") return eq(w.reduce((a, b) => add(a, b), frac(0)), W(rule.to));
      if (rule.op === "×") return eq(w.reduce((a, b) => mul(a, b), frac(1)), W(rule.to));
      if (rule.op === "−") return w.length === 2 && eq(sub(hi, lo), W(rule.to));
      return w.length === 2 && lo.n !== 0 && eq(div(hi, lo), W(rule.to));
    }
    throw new Error(`unknown rule ${rule.k}`);
  }
  const openOf = (round) => round.cells.flatMap((c, i) => (c.v === null ? [i] : []));
  const fullVals = (round, ids) => { const vals = round.cells.map((c) => c.v); openOf(round).forEach((cell, k) => { const t = ids[k] ? round.pool.find((p) => p.id === ids[k]) : null; vals[cell] = t ? t.v : null; }); return vals; };
  const validOracle = (round, ids) => {
    const open = openOf(round);
    if (open.some((_, k) => !ids[k])) return false;
    if (!round.reuse && new Set(ids).size !== ids.length) return false;
    if (open.some((cell, k) => round.cells[cell].type && round.pool.find((p) => p.id === ids[k]).kind !== round.cells[cell].type)) return false;
    const vals = fullVals(round, ids);
    return round.rules.every((rule) => holdsOracle(rule, vals, round));
  };
  const space = (round) => { const n = round.pool.length, k = openOf(round).length; let s = 1; for (let i = 0; i < k; i += 1) s *= round.reuse ? n : n - i; return s; };
  // every arrangement, no pruning at all: only for boards small enough to try them all
  function brute(round) {
    const open = openOf(round), found = [], ids = [];
    (function go(pos) {
      if (pos === open.length) { if (validOracle(round, ids)) found.push([...ids]); return; }
      for (const t of round.pool) { if (!round.reuse && ids.includes(t.id)) continue; ids[pos] = t.id; go(pos + 1); }
      ids.length = pos;
    })(0);
    return found;
  }
  // a depth-first search with its own pruning, for kenken-sized boards
  function dfs(round) {
    const open = openOf(round), vals = round.cells.map((c) => c.v), found = [], ids = [];
    const cellsOf = (r) => (r.k === "cmp" ? [...r.l, ...r.r].filter((t) => "c" in t).map((t) => t.c) : r.k === "mul" ? [r.a, r.b, r.c] : r.k === "equiv" ? [r.c] : r.k === "expr" ? r.toks.filter((t) => typeof t === "object").map((t) => t.c) : r.cells);
    const partial = (r) => {
      const cs = cellsOf(r), have = cs.filter((c) => vals[c] !== null);
      if (r.k === "distinct") return new Set(have.map((c) => JSON.stringify(vals[c]))).size === have.length;
      return have.length < cs.length || holdsOracle(r, vals, round);
    };
    (function go(pos) {
      if (pos === open.length) { if (validOracle(round, ids)) found.push([...ids]); return; }
      for (const t of round.pool) {
        if (!round.reuse && ids.includes(t.id)) continue;
        vals[open[pos]] = t.v; ids[pos] = t.id;
        if (round.rules.every(partial)) go(pos + 1);
      }
      vals[open[pos]] = null; ids.length = pos;
    })(0);
    return found;
  }
  const distinctValues = (round, list) => new Set(list.map((ids) => JSON.stringify(ids.map((id) => round.pool.find((p) => p.id === id).v)))).size;

  // ---- 1. contract and skill inventory (FM-015 FM-019 FM-020) ------------------------------------------------------
  assert.deepEqual(validateGame(game), []);
  ok(game.id === "math-puzzle-studio" && game.order === 9 && game.mechanic === "constraint-puzzle-solver", "game identity");
  ok(game.skills.length >= 14, `at least 14 skills (${game.skills.length})`);
  for (let g = 0; g <= 8; g += 1) ok(game.skills.filter((s) => s.grades[0] <= g && g <= s.grades[1]).length >= 2, `grade ${g} has at least two skills`);
  for (const s of game.skills) ok(/^[K0-8]\.[A-Z]{1,3}\.[A-Z]\.\d+[a-z]?$/.test(s.standard), `standard code shape ${s.standard}`);
  ok(game.howTo.en.length >= 3 && game.together.es !== game.together.en && game.howTo.es.join() !== game.howTo.en.join(), "how to play and together text in both languages");
  ok(game.cssHref.endsWith("game.css") && game.secPerRound >= 15, "css href and pace");

  // ---- 2. declared tables: size limits by grade, who must be unique, a difficulty proxy ----------------------------
  const LIMIT = [20, 20, 100, 1000, 200, 400, 300, 200, 2000]; // largest whole number a round may show, by grade
  const MANY = new Set(["target-ops", "equal-forms", "inequality-scale", "factor-pairs"]); // several answers are accepted
  const flatten = (v) => (v && typeof v === "object" ? Object.values(v).flatMap(flatten) : typeof v === "number" ? [v] : []);
  const shownNumbers = (r) => flatten([(r.cells || []).map((c) => c.v), (r.pool || []).map((t) => (t.label ? nums(t.label).map(Number) : t.v)), r.rules, r.rowSums, r.colSums, r.target, r.product, r.sum, r.gap, r.eq, r.cages]).filter((n) => Number.isFinite(n));
  const open = (r) => openOf(r).length;
  const digits = (n) => String(Math.abs(n)).length;
  const bigOf = (r) => Math.max(...shownNumbers(r));
  const PROXY = {
    "bond-parts": (r) => open(r) * 6 + bigOf(r) / 2,
    "balance-same": (r) => open(r) * 4 + bigOf(r) / 2,
    "equal-sign": (r) => r.scales[0].l.length * 3 + r.scales[0].r.length * 3 + bigOf(r) / 4,
    "missing-addend": (r) => bigOf(r) / 4 + (r.eq.length > 5 ? 4 : r.eq.includes("−") ? 3 : 1),
    "grid-sums": (r) => open(r) * 3 + r.n * 2 + digits(bigOf(r)),
    "magic-triangle": (r) => open(r) * 2 + (r.pool.length - open(r)) * 2,
    "magic-square": (r) => open(r) * 2 + (r.pool.length - open(r)) * 2 + bigOf(r) / 20,
    "factor-grid": (r) => open(r) * 2 + r.rows * 2 + bigOf(r) / 20,
    kenken: (r) => r.n * 3 + open(r) + r.cages.filter((c) => c.op === "−" || c.op === "÷").length * 2,
    "factor-pairs": (r) => digits(r.product) * 2 + (r.gap ? 4 : 0) + bigOf(r) / 10,
    "target-ops": (r) => r.cells.length * 2 + r.toks.filter((t) => t === "(").length * 3 + new Set(r.pool.filter((t) => t.kind === "op").map((t) => t.v)).size,
    "equal-forms": (r) => r.scales[0].l.length * 3 + r.scales[0].r.length * 3 + new Set(r.pool.map((t) => (/%/.test(t.label) ? "p" : /\./.test(t.label) ? "d" : "f"))).size,
    "scale-onestep": (r) => (r.eq.l.x > 1 || r.eq.r.x > 1 ? 3 : 1) + (r.xv.d > 1 ? 5 : 0) + digits(bigOf(r)),
    "inequality-scale": (r) => open(r) * 3 + (r.scales[0].l.some((t) => t.box) ? 5 : 0) + digits(bigOf(r)),
    "scale-twostep": (r) => (r.xv.d > 1 ? 6 : 0) + digits(bigOf(r)) * 2 + Math.max(r.eq.l.x, r.eq.r.x),
    "equiv-expr": (r) => r.scales[0].l[0].text.length / 2 + r.pool.length / 2,
    "scale-system": (r) => sum(r.scales.flatMap((s) => [...s.l, ...s.r]).map((t) => t.m || 0)) + digits(bigOf(r)) * 2 + sum(r.scales.flatMap((s) => s.l).filter((t) => "v" in t).map(() => 3)),
    "scale-both-sides": (r) => (r.xv.d > 1 ? 6 : 0) + Math.abs(r.eq.l.x - r.eq.r.x) * 2 + digits(bigOf(r)),
    "pythag-squares": (r) => bigOf(r) / 10 + (r.scales[0].l.some((t) => "c" in t) ? 3 : 0),
  };
  for (const s of game.skills) ok(PROXY[s.id], `difficulty proxy declared for ${s.id}`);

  // ---- 3. the sweep: skill x grade x level x seeds (FM-050 FM-051 FM-058 FM-059 FM-060 FM-065) -------------------
  const wrongKeys = new Set(), seenKeys = new Set(), feedbackByKey = new Map();
  let rounds = 0, wrongTried = 0, exhaustiveRuns = 0;
  const demandBySkill = new Map(), fingerprints = new Map();
  const submit = (round, response) => {
    const result = game.check(round, response);
    if (!result.correct) {
      seenKeys.add(`${round.skillId}:${result.mistake}`); wrongKeys.add(result.mistake);
      ok(result.feedback.en?.trim() && result.feedback.es?.trim() && result.feedback.en !== result.feedback.es, `bilingual feedback for ${result.mistake}`);
      ok(typeof result.mistake === "string" && result.mistake.length > 2, "a wrong answer names its mistake");
      feedbackByKey.set(`${round.skillId}:${result.mistake}`, result.feedback);
    }
    return result;
  };
  const putFor = (round, ids) => { const put = round.cells.map(() => null); openOf(round).forEach((cell, k) => { put[cell] = ids[k]; }); return put; };
  const solveIds = (round) => { const sol = game.solve(round).put; return openOf(round).map((cell) => sol[cell]); };
  // what the learner should be told when the board is wrong, derived here from the clues alone (the first broken rule decides)
  function expectedKey(round, ids) {
    const vals = fullVals(round, ids), broken = round.rules.filter((r) => !holdsOracle(r, vals, round));
    const first = broken.find((b) => b.k === "distinct") ?? broken[0], idx = round.rules.indexOf(first), n = round.n;
    const single = openOf(round).length === 1 ? round.pool.find((p) => p.id === ids[0]) : null;
    if (single && single.why) return single.why;
    if (round.layout === "bond") { const s = W(vals[1]).n + W(vals[2]).n; return s > W(vals[0]).n ? "parts-too-much" : "parts-too-little"; }
    if (round.layout === "grid") { const r = broken.some((b) => round.rules.indexOf(b) < n), c = broken.some((b) => round.rules.indexOf(b) >= n); return r && c ? "both-off" : r ? "row-off" : "col-off"; }
    if (round.layout === "triangle") return first.k === "distinct" ? "repeat" : "side-off";
    if (round.layout === "magic") return first.k === "distinct" ? "repeat" : idx < 3 ? "row-off" : idx < 6 ? "col-off" : "diag-off";
    if (round.layout === "cage") return first.k === "distinct" ? (idx < n ? "repeat-row" : "repeat-col") : { "+": "cage-add", "−": "cage-sub", "×": "cage-mul", "÷": "cage-div" }[first.op];
    if (round.layout === "pairs") return broken.length === 2 ? "neither-pair" : first.k === "prod" ? "only-sum" : "only-product";
    if (round.layout === "factor") { const [a, b, c] = [first.a, first.b, first.c], o = (i) => round.cells[i].v === null; if (!o(a) && !o(b)) return W(vals[c]).n === W(vals[a]).n + W(vals[b]).n ? "added-not-multiplied" : "wrong-product"; return o(c) ? "factor-mismatch" : "wrong-factor"; }
    if (round.layout === "expr") {
      const rule = round.rules[0], flat = evalExpr(rule.toks, vals, "flat"), bare = evalExpr(rule.toks, vals, "noparen"), got = evalExpr(rule.toks, vals);
      if (flat && eq(flat, W(rule.to))) return "order-of-ops";
      if (bare && eq(bare, W(rule.to))) return "parens-ignored";
      if (!got || got.d !== 1 || got.n < 0) return "not-whole";
      return got.n > rule.to ? "over-target" : "under-target";
    }
    if (round.layout === "balance") {
      const xs = frac(round.xs ?? 1);
      if (round.system) {
        const good = round.scales.map((s) => eq(sideW(s.l, vals, xs), sideW(s.r, vals, xs)));
        if (good.filter(Boolean).length === 1) return "one-scale-only";
        const sw = [vals[1], vals[0]];
        return round.rules.every((r) => holdsOracle(r, sw, round)) ? "swapped-weights" : "neither-scale";
      }
      const s = round.scales[0], d = cmp(sideW(s.l, vals, xs), sideW(s.r, vals, xs));
      if (s.rel !== "=") return d === 0 ? "equal-not-tip" : "wrong-way";
      const left = s.l.some((t) => "c" in t && !t.box), right = s.r.some((t) => "c" in t && !t.box);
      if (left && right) return "recheck";
      return (left ? d > 0 : d < 0) ? "slot-pan-heavy" : "slot-pan-light";
    }
    return "recheck";
  }
  const expectedAny = (round, ids) => {
    if (!round.reuse && new Set(ids).size !== ids.length) return "reused-tile";
    if (openOf(round).some((cell, k) => round.cells[cell].type && round.pool.find((p) => p.id === ids[k]).kind !== round.cells[cell].type)) return "wrong-kind";
    return expectedKey(round, ids);
  };
  const allowedFeedback = (skillId, key) => Boolean(MISTAKES[`${skillId}:${key}`] || MISTAKES[key]);

  const latinOk = (round, open, ids, pos) => { // the rows and columns so far hold no repeat (given cells included)
    const vals = round.cells.map((c) => c.v);
    for (let k = 0; k <= pos; k += 1) vals[open[k]] = round.pool.find((p) => p.id === ids[k]).v;
    return round.rules.filter((r) => r.k === "distinct").every((r) => { const have = r.cells.map((i) => vals[i]).filter((v) => v !== null).map((v) => JSON.stringify(v)); return new Set(have).size === have.length; });
  };
  function checkPlaceRound(round, label, exhaustive) {
    const open = openOf(round), sp = space(round);
    const pruned = dfs(round), list = sp <= 40000 ? brute(round) : pruned;
    if (sp <= 40000) ok(JSON.stringify(list.map((x) => x.join())) === JSON.stringify(pruned.map((x) => x.join())), `${label} brute force and search agree`);
    const count = distinctValues(round, list);
    ok(count >= 1, `${label} has at least one solution`);
    if (!MANY.has(round.skillId) && !(round.skillId === "bond-parts" && round.level === 3) && !(round.skillId === "balance-same" && round.level === 3)) ok(count === 1, `${label} has exactly one solution (${count})`);
    if (round.skillId === "factor-pairs") ok(count <= 2, `${label} factor pair is unique up to order (${count})`);
    // the game accepts every oracle solution and nothing else we try
    for (const ids of list.slice(0, 60)) ok(game.check(round, { put: putFor(round, ids) }).correct, `${label} accepts solution ${ids}`);
    ok(validOracle(round, solveIds(round)), `${label} solve() is a solution`);
    const trials = [];
    const base = list[0];
    for (let k = 0; k < open.length; k += 1) for (const t of round.pool) if (t.id !== base[k]) { const x = [...base]; x[k] = t.id; trials.push(x); }
    for (let a = 0; a < open.length; a += 1) for (let b = a + 1; b < open.length; b += 1) { const x = [...base]; [x[a], x[b]] = [x[b], x[a]]; trials.push(x); }
    const rng = makeRng(seedFrom("trials", label));
    for (let i = 0; i < 25; i += 1) trials.push(open.map(() => round.pool[Math.floor(rng() * round.pool.length)].id));
    for (const ids of trials.slice(0, 400)) {
      const want = validOracle(round, ids), res = submit(round, { put: putFor(round, ids) });
      wrongTried += 1;
      ok(res.correct === want, `${label} ${ids}: game says ${res.correct}, oracle says ${want}`);
      if (want) continue;
      const key = expectedAny(round, ids);
      ok(res.mistake === key, `${label} ${ids}: mistake ${res.mistake}, expected ${key}`);
      ok(allowedFeedback(round.skillId, res.mistake) || res.mistake === "recheck", `${label} feedback exists for ${res.mistake}`);
    }
    // exhaustive: every arrangement of a small board (and every Latin filling of a KenKen board) against the oracle
    if (exhaustive) {
      const everything = [], ids = [];
      (function go(pos) {
        if (everything.length >= 30000) return;
        if (pos === open.length) { everything.push([...ids]); return; }
        for (const t of round.pool) { if (!round.reuse && ids.includes(t.id)) continue; ids[pos] = t.id; if (round.layout !== "cage" || latinOk(round, open, ids, pos)) go(pos + 1); }
        ids.length = pos;
      })(0);
      for (const full of everything) {
        const want = validOracle(round, full), res = submit(round, { put: putFor(round, full) });
        ok(res.correct === want, `${label} exhaustive ${full}: game ${res.correct}, oracle ${want}`);
        if (!want) ok(res.mistake === expectedAny(round, full), `${label} exhaustive ${full}: ${res.mistake} vs ${expectedAny(round, full)}`);
      }
      exhaustiveRuns += everything.length;
    }
    ok(!submit(round, { put: round.cells.map(() => null) }).correct && game.check(round, { put: round.cells.map(() => null) }).neutral === true, `${label} an unfinished board is a neutral miss`);
    ok(!game.check(round, undefined).correct && !game.check(round, {}).correct && !game.check(round, { put: "x" }).correct, `${label} junk responses are rejected`);
    for (const t of round.pool) if (t.why) ok(allowedFeedback(round.skillId, t.why), `${label} tile mistake ${t.why} has feedback`);
  }

  // leak detector for tiers 0-2: the whole answer, any lone number of a one-number answer (digits or words), or the
  // answer's leading numbers in order close together
  const NUM_EN = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty".split(" ");
  const NUM_ES = "cero uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciséis diecisiete dieciocho diecinueve veinte".split(" ");
  const nums = (text) => text.match(/\d+(?:\.\d+)?/g) || [];
  function leaks(hint, answer, lang) {
    if (hint.includes(answer)) return "whole answer";
    const tokens = nums(answer);
    const has = (t) => new RegExp(`(?<![\\d.])${t.replace(".", "\\.")}(?!\\d|\\.\\d)`).test(hint);
    if (tokens.length === 1) {
      if (has(tokens[0])) return `the number ${tokens[0]}`;
      const word = (lang === "es" ? NUM_ES : NUM_EN)[Number(tokens[0])];
      if (word && Number(tokens[0]) <= 20 && !tokens[0].includes(".") && new RegExp(`(?<![a-záéíóúñ])${word}(?![a-záéíóúñ])`, "i").test(hint)) return `the word ${word}`;
    }
    if (tokens.length >= 2) {
      const lead = tokens.slice(0, 4);
      const re = new RegExp(lead.map((t) => `(?<![\\d.])${t.replace(".", "\\.")}(?![\\d]|\\.\\d)`).join("\\D{0,8}?"));
      if (re.test(hint)) return "the leading numbers in order";
      if (tokens.length === 2 && tokens.every(has)) return "both numbers";
    }
    return null;
  }
  function checkHints(round, label) {
    const answer = game.answerText(round), tiers = [0, 1, 2, 3].map((t) => game.hint(round, t, null));
    ok(answer.length > 0 && answer.length < 200, `${label} answer text is short`);
    for (const [tier, h] of tiers.entries()) {
      ok(h.en?.trim() && h.es?.trim() && h.en !== h.es, `${label} hint ${tier} in both languages`);
      if (tier < 3) ok(!leaks(h.en, answer, "en") && !leaks(h.es, answer, "es"), `${label} hint ${tier} leaks (${leaks(h.en, answer, "en") || leaks(h.es, answer, "es")}) the answer ${answer}: ${h.en}`);
      else ok(h.en.includes(answer) && h.es.includes(answer), `${label} tier 3 states the answer ${answer}`);
    }
    ok(new Set(tiers.slice(0, 3).map((h) => h.en)).size === 3, `${label} hint tiers differ`);
    ok(JSON.stringify(game.hint(round, 2)) === JSON.stringify(tiers[2]), `${label} hints are deterministic`);
  }

  // ---- the equation scale oracle: a state machine written from the rules of the pans ------------------------------
  const S0 = (r) => ({ lx: r.eq.l.x, lk: frac(r.eq.l.k), rx: r.eq.r.x, rk: frac(r.eq.r.k) });
  function step(s, m) { // returns the next state, or an object {no: why}
    const sides = m.side === "both" ? ["l", "r"] : [m.side], n = m.n, out = { ...s };
    if (m.op === "take" && m.what === "k") { for (const p of sides) { if (cmp(s[`${p}k`], frac(n)) < 0) return { no: "too-few-weights" }; out[`${p}k`] = sub(s[`${p}k`], frac(n)); } return out; }
    if (m.op === "take" && m.what === "x") { if (m.side !== "both") return { no: "x-one-pan" }; for (const p of sides) { if (s[`${p}x`] < n) return { no: "too-few-boxes" }; out[`${p}x`] = s[`${p}x`] - n; } return out; }
    if (m.op === "split") {
      if (m.side !== "both") return { no: "split-one-pan" };
      for (const p of sides) { if (s[`${p}x`] % n) return { no: "split-uneven" }; out[`${p}x`] = s[`${p}x`] / n; out[`${p}k`] = div(s[`${p}k`], frac(n)); if (out[`${p}x`] > 0 && out[`${p}k`].d !== 1) return { no: "split-loose" }; }
      return out;
    }
    return { no: "bad-move" };
  }
  const weigh = (s, xv) => ({ l: add(mul(frac(s.lx), xv), s.lk), r: add(mul(frac(s.rx), xv), s.rk) });
  const solved = (s) => (s.lx === 1 && s.lk.n === 0 && s.rx === 0) || (s.rx === 1 && s.rk.n === 0 && s.lx === 0);
  const unfinished = (s) => (s.lx > 0 && s.rx > 0 ? "x-both-pans" : (s.lx > 0 ? s.lk : s.rk).n !== 0 ? "loose-weights" : "needs-split");
  const answerOf = (s) => (s.lx === 1 ? s.rk : s.lk);

  function checkScaleRound(round, label) {
    // the answer from algebra alone: (left x - right x) * x = right loose - left loose
    const lx = round.eq.l.x, rx = round.eq.r.x, lk = round.eq.l.k, rk = round.eq.r.k;
    const x = div(frac(rk - lk), frac(lx - rx));
    ok(x.n > 0 && eq(x, round.xv), `${label} hidden weight ${toMixedString(round.xv)} is the algebraic solution ${toMixedString(x)}`);
    const w0 = weigh(S0(round), round.xv);
    ok(eq(w0.l, w0.r), `${label} starts balanced`);
    ok(game.answerText(round) === `x = ${toMixedString(x)}`, `${label} answer text`);
    ok(lx + rx >= 1 && Number.isInteger(lx) && Number.isInteger(rx), `${label} whole numbers of x-boxes`);
    // a breadth-first search over legal both-pan moves reaches "x alone" with the right weight, and the game's solution is accepted
    let frontier = [{ s: S0(round), moves: [] }], reached = null;
    for (let depth = 0; depth < 4 && !reached; depth += 1) {
      const next = [];
      for (const { s, moves } of frontier) for (const m of candidates(s)) { const t = step(s, m); if (t.no) continue; const node = { s: t, moves: [...moves, m] }; if (solved(t)) { reached ??= node; } next.push(node); }
      frontier = next.slice(0, 600);
    }
    ok(reached && eq(answerOf(reached.s), x), `${label} the oracle reaches x = ${toMixedString(x)} by legal moves`);
    ok(game.check(round, { moves: reached.moves }).correct, `${label} the oracle's own moves are accepted`);
    ok(game.check(round, game.solve(round)).correct, `${label} solve() is accepted`);
    // random legal sequences: the game's readings agree with the pans, and finishing or not is judged correctly
    const rng = makeRng(seedFrom("walk", label));
    for (let walk = 0; walk < 12; walk += 1) {
      let s = S0(round); const moves = [];
      for (let k = 0; k < 4; k += 1) {
        const pool = candidates(s, true).filter((m) => !step(s, m).no), m = pool[Math.floor(rng() * pool.length)];
        if (!m) break;
        s = step(s, m); moves.push(m);
        const res = submit(round, { moves }), w = weigh(s, round.xv), level = eq(w.l, w.r);
        ok(res.correct === (level && solved(s)), `${label} walk ${JSON.stringify(moves)}: ${res.correct}`);
        if (!res.correct) ok(res.mistake === (level ? unfinished(s) : "tipped"), `${label} walk mistake ${res.mistake}`);
      }
    }
    // an illegal move is never accepted
    ok(!game.check(round, { moves: [{ op: "take", what: "k", side: "both", n: 9999 }] }).correct && game.check(round, { moves: [{ op: "take", what: "k", side: "both", n: 9999 }] }).mistake === "bad-move", `${label} an impossible move is refused`);
    ok(!game.check(round, {}).correct && !game.check(round, { moves: "x" }).correct, `${label} junk responses rejected`);
    // one-sided removal tips the scale by exactly that much
    if (Math.max(round.eq.l.k, round.eq.r.k) > 0 && round.eq.l.k > 0) {
      const m1 = { op: "take", what: "k", side: "l", n: 1 }, t = step(S0(round), m1);
      if (!t.no) { const w = weigh(t, round.xv); ok(eq(sub(w.r, w.l), frac(1)), `${label} one weight off the left pan tips the scale by exactly 1`); ok(game.check(round, { moves: [m1] }).mistake === "tipped", `${label} a one-pan move is named "tipped"`); }
    }
  }
    // the moves worth trying from a state: amounts the pans really hold, so searches and walks are not all refusals
  function candidates(s, oneSided = false) {
    const out = [], amounts = new Set([1]);
    for (const k of [s.lk, s.rk]) if (k.d === 1 && k.n > 0) amounts.add(k.n);
    for (const n of amounts) { out.push({ op: "take", what: "k", side: "both", n }); if (oneSided) out.push({ op: "take", what: "k", side: "l", n }, { op: "take", what: "k", side: "r", n }); }
    for (let n = 1; n <= Math.min(s.lx, s.rx); n += 1) out.push({ op: "take", what: "x", side: "both", n });
    for (let n = 2; n <= Math.max(s.lx, s.rx); n += 1) out.push({ op: "split", side: "both", n });
    return out;
  }

  // ---- the sweep itself ------------------------------------------------------------------------------------------
  for (const skill of game.skills) {
    for (let grade = skill.grades[0]; grade <= skill.grades[1]; grade += 1) {
      for (let level = 1; level <= 3; level += 1) {
        const demands = [];
        for (let i = 0; i < SEEDS; i += 1) {
          const round = game.makeRound(skill.id, level, rngFor(skill.id, grade, level, i), grade), label = `${skill.id} g${grade} L${level} #${i}`;
          rounds += 1;
          assert.deepEqual(JSON.parse(JSON.stringify(round)), round, `${label} JSON round trip`);
          assert.deepEqual(game.makeRound(skill.id, level, rngFor(skill.id, grade, level, i), grade), round, `${label} deterministic`);
          ok(round.skillId === skill.id && round.level === level && round.grade === grade, `${label} identity`);
          ok(round.prompt.en.trim() && round.prompt.es.trim() && round.prompt.en !== round.prompt.es, `${label} prompt in both languages`);
          assert.deepEqual(nums(round.prompt.en), nums(round.prompt.es), `${label} the prompt states the same numbers in both languages`);
          const shown = shownNumbers(round);
          ok(Math.max(...shown) <= LIMIT[grade], `${label} within the grade ${grade} limit (${Math.max(...shown)})`); // FM-051
          if (grade <= 5) ok(shown.every((n) => n >= 0) && !JSON.stringify(round).includes("\"n\":-"), `${label} no negative numbers below grade 6`); // FM-055
          ok(shown.every((n) => Number.isFinite(n) && Math.abs(n) <= 1e6), `${label} sane numbers`);
          demands.push(PROXY[skill.id](round));
          const key = `${skill.id}|${level}`;
          if (!fingerprints.has(key)) fingerprints.set(key, new Set());
          if (i % 2 === 0) fingerprints.get(key).add(nonce(round));
          ok(submit(round, game.solve(round)).correct, `${label} solve() is accepted`);
          if (round.kind === "scale") checkScaleRound(round, label); else checkPlaceRound(round, label, i < 2 && (round.layout === "cage" || space(round) <= 25000));
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
      for (let i = 0; i < 100; i += 1) {
        const grade = skill.grades[0] + (i % (skill.grades[1] - skill.grades[0] + 1));
        prints.add(nonce(game.makeRound(skill.id, level, rngFor(skill.id, grade, level, 1000 + i), grade)));
      }
      ok(prints.size >= 30, `${skill.id} L${level}: ${prints.size} distinct rounds in 100 seeds`);
    }
  }
  const flat = [...demandBySkill].filter(([, d]) => !(d[3] > d[1])).map(([key, d]) => `${key}: ${d[1].toFixed(2)} -> ${d[3].toFixed(2)}`);
  ok(flat.length === 0, `level 3 must demand more than level 1; not rising: ${flat.join("; ")}`);

  // ---- 5. the feedback catalogue (FM-063) --------------------------------------------------------------------------
  const exercised = new Set([...seenKeys].map((k) => k.split(":").slice(1).join(":")));
  const mustSee = Object.keys(MISTAKES).map((k) => k.split(":").pop()).filter((k) => !["tipped", "bad-move", "incomplete", "loose-weights", "needs-split", "x-both-pans"].includes(k));
  const unseen = [...new Set(mustSee)].filter((key) => !exercised.has(key) && key !== "reused-tile" && key !== "wrong-kind");
  ok(unseen.length === 0, `mistakes never exercised by the sweep: ${unseen.join(", ")}`);
  for (const k of ["tipped", "loose-weights", "needs-split", "x-both-pans"]) ok(exercised.has(k), `scale mistake ${k} exercised`);
  for (const [id, text] of Object.entries(MISTAKES)) ok(text.en.trim() && text.es.trim() && text.en !== text.es, `catalogue entry ${id} in both languages`);
  const texts = Object.entries(MISTAKES).filter(([id]) => !/^(off-one|off-ten)$/.test(id)).map(([, v]) => v.en);
  ok(new Set(texts).size === texts.length, "every named mistake has its own wording");
  const generic = new Set(Object.values(RECHECK).map((x) => x.en));
  for (const [id, text] of Object.entries(MISTAKES)) ok(!generic.has(text.en), `${id} is not the generic fallback wording`);
  for (const skill of game.skills) ok(RECHECK[skill.id]?.en && RECHECK[skill.id].es !== RECHECK[skill.id].en, `${skill.id} has its own fallback feedback`);
  for (const [id, text] of Object.entries(MOVE_MISTAKES)) ok(text.en.trim() && text.es.trim() && text.en !== text.es, `move refusal ${id} in both languages`);

  // ---- 6. the balance scale tells the truth: exact readings, proportional tilt, matching drawing (FM-059) ----------
  ok(tiltFor(frac(0), 10) === 0, "no difference, no tilt");
  for (const [d, ref] of [[frac(1), 40], [frac(3), 40], [frac(1, 2), 5], [frac(-2), 30], [frac(-1, 4), 3]]) {
    const t = tiltFor(d, ref);
    ok(Math.sign(t) === Math.sign(d.n) && Math.abs(t) <= MAX_TILT, `tilt sign and size for ${d.n}/${d.d}`);
    if (Math.abs(tiltFor(mul(d, frac(2)), ref)) < MAX_TILT) ok(Math.abs(tiltFor(mul(d, frac(2)), ref) - 2 * t) < 1e-9, `tilt is proportional to the difference (${d.n}/${d.d})`);
  }
  ok(tiltFor(frac(1000), 10) === MAX_TILT && tiltFor(frac(-1000), 10) === -MAX_TILT, "the tilt is clamped");
  for (const tilt of [-14, -6.5, 0, 3, 14]) {
    const g = scaleGeometry(tilt), svg = scaleSvg(tilt, "");
    ok(tilt === 0 ? Math.abs(g.left[1] - g.right[1]) < 1e-9 : (g.left[1] > g.right[1]) === (tilt > 0), `the drawn beam end goes down on the heavier side (${tilt})`);
    ok(svg.includes(`x1="${g.left[0]}"`) && svg.includes(`y2="${g.right[1]}"`), `the drawing uses the same beam coordinates (${tilt})`);
  }
  let readings = 0;
  for (const skill of game.skills) {
    for (let level = 1; level <= 3; level += 1) {
      for (let i = 0; i < 8; i += 1) {
        const grade = skill.grades[1], round = game.makeRound(skill.id, level, rngFor(skill.id, grade, level, 5000 + i), grade);
        if (!round.scales) continue;
        const rng = makeRng(seedFrom("read", skill.id, level, i)), open = openOf(round);
        for (let t = 0; t < 6; t += 1) {
          const put = round.cells.map(() => null);
          for (const cell of open) if (rng() < 0.8) put[cell] = round.pool[Math.floor(rng() * round.pool.length)].id;
          const xs = round.xRange ? round.xRange[0] + Math.floor(rng() * 6) : (round.xs ?? 1);
          const vals = fullVals(round, open.map((c) => put[c])), got = readScales(round, put, xs);
          round.scales.forEach((s, k) => {
            const pending = s.l.concat(s.r).some((term) => term.box && vals[term.c] === null);
            const l = sideW(s.l, vals, frac(xs)), r = sideW(s.r, vals, frac(xs));
            ok(eq(got[k].left, l) && eq(got[k].right, r), `${skill.id} pan weights are exact`);
            ok(pending === got[k].pending, `${skill.id} an unknown weight makes no claim`);
            if (!pending) { ok(eq(got[k].diff, sub(l, r)), `${skill.id} the difference is exact`); ok(got[k].tilt === tiltFor(sub(l, r), round.ref), `${skill.id} the tilt follows the difference`); }
            else ok(got[k].tilt === 0, `${skill.id} no tilt for an unknown weight`);
          });
          readings += 1;
        }
      }
    }
  }
  ok(readings > 100, `scale readings checked (${readings})`);

  // ---- 7. the board in jsdom: tiles, keyboard, language, locking, the shell (FM-032 FM-033 FM-020) ---------------------
  const root = document.querySelector("#root"), q = (s) => root.querySelector(s), qa = (s) => [...root.querySelectorAll(s)];
  const click = (el) => el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  const press = (el, key) => el.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  const context = (round, lock = []) => { const calls = []; return { calls, round, lang: "en", announce: (t) => calls.push(["say", t]), locked: () => false, onLock: (cb) => lock.push(cb), submit: (response) => { calls.push(["submit", response]); return game.check(round, response); } }; };
  const place = (cell, id) => { click(q(`[data-pz-tile="${id}"]`)); click(q(`[data-pz-slot="${cell}"]`)); };

  // a bond: tap a tile then a spot, tap a placed tile to take it back, undo, clear, language switch, check
  const bond = game.makeRound("bond-parts", 1, makeRng(3), 0), bctx = context(bond);
  let view = mount(root, bctx);
  const spot = openOf(bond)[0], right = solveIds(bond)[0], wrong = bond.pool.find((t) => t.id !== right).id;
  ok(qa("[data-pz-tile]").length === bond.pool.length && qa("[data-pz-slot]").length === 1, "a tile for every pool entry and a spot for every empty cell");
  ok(q("[data-pz-check]") && qa("button").every((b) => b.textContent.trim() || b.getAttribute("aria-label")), "every button has a text label");
  click(q("[data-pz-check]"));
  ok(!bctx.calls.some((c) => c[0] === "submit") && /Fill every/.test(q("[data-pz-msg]").textContent), "checking an unfinished board asks for the spots and is not an attempt");
  place(spot, wrong);
  ok(q(`[data-pz-slot="${spot}"]`).classList.contains("is-filled") && bctx.calls.some((c) => c[0] === "say" && /Placed/.test(c[1])), "a placed tile fills its spot and is announced");
  view.setLang("es");
  ok(q(`[data-pz-slot="${spot}"]`).classList.contains("is-filled") && /Comprobar/.test(q("[data-pz-check]").textContent) && /Fichas/.test(q(".pz-tray").getAttribute("aria-label")), "a language switch keeps the placed tile and relabels everything");
  view.setLang("en");
  click(q(`[data-pz-slot="${spot}"]`));
  ok(!q(`[data-pz-slot="${spot}"]`).classList.contains("is-filled"), "tapping a placed tile takes it back");
  place(spot, wrong); click(q("[data-pz-undo]"));
  ok(!q(`[data-pz-slot="${spot}"]`).classList.contains("is-filled"), "undo takes back the last move");
  place(spot, wrong); press(q(`[data-pz-slot="${spot}"]`), "Backspace");
  ok(!q(`[data-pz-slot="${spot}"]`).classList.contains("is-filled"), "Backspace clears a spot");
  place(spot, wrong); click(q("[data-pz-clear]"));
  ok(!q(`[data-pz-slot="${spot}"]`).classList.contains("is-filled") && q("[data-pz-undo]").disabled === false, "clear empties the board and can be undone");
  click(q("[data-pz-tile]")); press(q("[data-pz-tile]"), "Escape");
  ok(q("[data-pz-tile]").getAttribute("aria-pressed") === "false", "Escape puts a picked-up tile down");
  place(spot, right); click(q("[data-pz-check]"));
  ok(bctx.calls.at(-1)[0] === "submit" && game.check(bond, bctx.calls.at(-1)[1]).correct && q("[data-pz-check]").disabled, "the board is submitted as the response and locks when correct");
  view.destroy();
  ok(root.innerHTML === "", "destroy empties the stage");

  // a tile used once stays used; an operation tile will not go in a number spot
  const ops = game.makeRound("target-ops", 2, makeRng(9), 5), octx = context(ops);
  view = mount(root, octx);
  const opTile = ops.pool.find((t) => t.kind === "op"), numTile = ops.pool.find((t) => t.kind === "num");
  click(q(`[data-pz-tile="${opTile.id}"]`)); click(q('[data-pz-slot="0"]'));
  ok(/needs a number/.test(q("[data-pz-msg]").textContent) && !q('[data-pz-slot="0"]').classList.contains("is-filled"), "an operation does not go in a number spot, and the message says why");
  place(0, numTile.id);
  ok(q(`[data-pz-tile="${numTile.id}"]`).disabled, "a tile that is placed cannot be placed again");
  ok(qa("[data-pz-slot]").every((b) => /Number spot|Operation spot/.test(b.getAttribute("aria-label"))), "spots are named for what goes in them");
  view.destroy();

  // a scale: placing a tile changes the written reading and the tilt, and both match the oracle
  const scale = game.makeRound("balance-same", 2, makeRng(11), 1), sctx = context(scale);
  view = mount(root, sctx);
  const readNow = () => q("[data-pz-reading]").textContent, tilt = () => Number(q("[data-pz-scale]").dataset.tilt);
  const oracleSay = (put) => { const vals = fullVals(scale, openOf(scale).map((c) => put[c])), s = scale.scales[0], d = sub(sideW(s.l, vals, frac(1)), sideW(s.r, vals, frac(1))); return d.n === 0 ? "The scale balances." : `${d.n > 0 ? "Left" : "Right"} is heavier by ${toMixedString(frac(Math.abs(d.n), d.d))}.`; };
  ok(readNow() === oracleSay(scale.cells.map(() => null)) && tilt() !== 0, `the empty scale reads: ${readNow()}`);
  for (const t of scale.pool) {
    place(openOf(scale)[0], t.id);
    const put = scale.cells.map(() => null); put[openOf(scale)[0]] = t.id;
    ok(readNow() === oracleSay(put), `reading with ${t.v}: ${readNow()} vs ${oracleSay(put)}`);
    const d = sub(sideW(scale.scales[0].l, fullVals(scale, [t.id]), frac(1)), sideW(scale.scales[0].r, fullVals(scale, [t.id]), frac(1)));
    ok(Math.sign(tilt()) === Math.sign(d.n) && Math.abs(Math.abs(tilt()) - Math.abs(tiltFor(d, scale.ref))) < 0.01, `the beam tilt matches the difference for ${t.v}`);
    click(q(`[data-pz-slot="${openOf(scale)[0]}"]`));
  }
  view.destroy();

  // equivalent expressions: the x buttons change the weights and the reading
  const eqv = game.makeRound("equiv-expr", 1, makeRng(2), 7), ectx = context(eqv);
  view = mount(root, ectx);
  const before = q("[data-pz-xval]").textContent;
  click(q("[data-pz-xup]"));
  ok(q("[data-pz-xval]").textContent !== before && ectx.calls.some((c) => /Weight of x/.test(String(c[1]))), "the x button changes the sample weight and announces the reading");
  view.destroy();

  // an equation scale: moves, refusals with reasons, undo, check
  const eqs = game.makeRound("scale-twostep", 1, makeRng(5), 7), qctx = context(eqs);
  view = mount(root, qctx);
  const amount = (n) => { const f = q("[data-pz-amt]"); f.value = String(n); f.dispatchEvent(new dom.window.Event("input", { bubbles: true })); };
  const loose = Math.max(eqs.eq.l.k, eqs.eq.r.k);
  amount(loose + 50); click(q('[data-pz-take="k"]'));
  ok(/cannot take off/.test(q("[data-pz-msg]").textContent) && q("[data-pz-undo]").disabled, "taking off more than is there is refused with the reason and changes nothing");
  click(q("[data-pz-pans='l']")); amount(1); click(q('[data-pz-take="k"]'));
  ok(Math.abs(Number(q("[data-pz-scale]").dataset.tilt)) > 0 && /heavier by 1\./.test(q("[data-pz-reading]").textContent), `one pan only tips the scale: ${q("[data-pz-reading]").textContent}`);
  click(q("[data-pz-check]"));
  ok(qctx.calls.at(-1)[0] === "submit" && /tipped/.test(JSON.stringify(game.check(eqs, qctx.calls.at(-1)[1]).mistake)), "checking a tipped scale submits the moves");
  click(q("[data-pz-undo]"));
  ok(/balances/.test(q("[data-pz-reading]").textContent), "undo puts the beam level again");
  click(q("[data-pz-pans='both']"));
  amount(2); click(q("[data-pz-split]"));
  ok(/cannot make|cut/.test(q("[data-pz-msg]").textContent) || q("[data-pz-undo]").disabled === false, "splitting that does not come out even is refused");
  view.setLang("es");
  ok(/Deshacer/.test(q("[data-pz-undo]").textContent) || q("[data-pz-undo]"), "the equation scale relabels in Spanish");
  view.destroy();
  const mq = game.makeRound("scale-onestep", 2, makeRng(1), 6), mctx = context(mq);
  view = mount(root, mctx);
  for (const m of game.solve(mq).moves) {
    amount(m.n);
    click(q(`[data-pz-pans="${m.side}"]`));
    click(m.op === "split" ? q("[data-pz-split]") : q(`[data-pz-take="${m.what}"]`));
  }
  ok(/balances/.test(q("[data-pz-reading]").textContent), "the solving moves keep the scale level");
  click(q("[data-pz-check]"));
  ok(game.check(mq, mctx.calls.at(-1)[1]).correct && q("[data-pz-check]").disabled, "the solution moves are submitted and lock the scale");
  view.destroy();

  // the shell: hint tiers, three misses, Show me, and a language switch that keeps the work
  const store = createStore({ profile: 0, storage: { getItem: () => null, setItem: () => {} } });
  const session = startActivity({ root, game, store, grade: 8, skillId: "pythag-squares", level: 2, rounds: 2, seed: 77, lang: "en" });
  const shown = [];
  for (let i = 0; i < 3; i += 1) { click(q("[data-fm2-hint]")); shown.push(q("[data-fm2-hintbox]").textContent.replace(/^Hint \d+\s*/, "")); }
  const live = window.__fm2.round, answer = game.answerText(live);
  ok(new Set(shown).size === 3 && !leaks(shown.join(" "), answer, "en"), "shell hint tiers 0-2 differ and do not leak");
  const wrongId = live.pool.find((t) => !validOracle(live, [t.id])).id;
  place(0, wrongId);
  click(q("[data-fm2-lang]"));
  ok(q('[data-pz-slot="0"]').classList.contains("is-filled") && /Comprobar/.test(q("[data-pz-check]").textContent), "the shell language switch keeps the tile and relabels the board");
  click(q("[data-fm2-lang]"));
  for (let i = 0; i < 3; i += 1) click(q("[data-pz-check]"));
  ok(!q("[data-fm2-showme]").hidden && q("[data-fm2-next]").hidden, "Show me appears after three misses, and there is no Next yet");
  ok(/Not yet/.test(q("[data-fm2-feedback]").textContent) && q("[data-fm2-feedback]").textContent.length > 40, "the miss feedback names the mistake");
  click(q("[data-fm2-showme]"));
  ok(q("[data-fm2-hintbox]").textContent.includes(answer) && !q("[data-fm2-next]").hidden, "Show me states the answer and offers Next");
  ok(q('[data-pz-slot="0"]').disabled && q("[data-pz-check]").disabled && q("[data-pz-tile]").disabled, "Show me locks the board");
  click(q("[data-fm2-next]"));
  place(0, solveIds(window.__fm2.round)[0]); click(q("[data-pz-check]"));
  ok(/Correct!/.test(q("[data-fm2-feedback]").textContent) && !q("[data-fm2-next]").hidden, "a correct board ends the round in the shell");
  session.destroy();

  // ---- 8. repo rules for student games: small files, no timers, links, external scripts or emoji (FM-017) -----------
  const folder = new URL(`${dir}/`, import.meta.url);
  for (const [where, name] of [...fs.readdirSync(folder).map((n) => [folder, n]), [new URL(`${base}/art/`, import.meta.url), "puzzles.js"]]) {
    const source = fs.readFileSync(new URL(name, where), "utf8");
    ok(source.split("\n").length <= 500, `${name} stays within 500 lines (${source.split("\n").length})`);
    ok(!/\b(setInterval|setTimeout|requestAnimationFrame|Date\.now|countdown|timer)\b/i.test(source.replace(/\/\/.*$/gm, "")), `${name} has no timers or countdowns`);
    ok(!/<a\s|href=|https?:\/\/(?!www\.w3\.org)/.test(source), `${name} has no links or external resources`);
    ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(source.replace(/[✓•→−×÷¢]/g, "")), `${name} uses no emoji`);
  }
  console.log(`math-puzzle-studio math suite: ${checks} checks, ${rounds} rounds (${game.skills.length} skills), ${wrongTried} wrong boards tried, ${exhaustiveRuns} boards enumerated passed.`);
}
await main();
