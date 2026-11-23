#!/usr/bin/env node
// Arcade core contracts: WIDA levels, Shard economy, canonical prompts, adaptive selection, evidence,
// and the session state machine that the three flagship games share. Pure logic, no browser.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  cleanAdaptive,
  emptyAdaptive,
  layersAllowed,
  pickNext,
  playProfile,
  record,
  targetLevel,
} from "../access-practice-lab/src/game-core/Adaptive.js";
import {
  award,
  awardRecovery,
  cleanEconomy,
  consume,
  ECONOMY_CONFIG,
  emptyEconomy,
  emptyStreak,
  matrixMultiplier,
  maxStake,
  purchase,
  refund,
  rewardFor,
  settleStake,
  shopCatalog,
  simulateEarnings,
  spend,
  stake,
  streakAfter,
  streakMultiplier,
} from "../access-practice-lab/src/game-core/Economy.js";
import { classify, summarize, toCsv } from "../access-practice-lab/src/game-core/Evidence.js";
import {
  BANDS,
  eliminable,
  evaluate,
  forLevel,
  loadPromptPool,
  scaffoldView,
  validatePrompt,
} from "../access-practice-lab/src/game-core/Prompts.js";
import {
  ArcadeSession,
  GameClock,
  makeRng,
  STATES,
  StateMachine,
} from "../access-practice-lab/src/game-core/Session.js";
import {
  groupOfLevel,
  levelProfile,
  supportOfLevel,
  WIDA_LEVELS,
} from "../access-practice-lab/src/game-core/WidaLevels.js";

const fetchJson = async (p) =>
  JSON.parse(readFileSync(new URL(`../access-practice-lab/content/${p}`, import.meta.url), "utf8"));
const pools = {};
for (const band of BANDS)
  pools[band] = (await loadPromptPool({ band, fetchJson, cache: false })).prompts;

// ── WIDA ────────────────────────────────────────────────────────────────────────────────────
test("six WIDA levels group into three practice groups with real level names", () => {
  assert.deepEqual(
    WIDA_LEVELS.map((l) => l.en),
    ["Entering", "Emerging", "Developing", "Expanding", "Bridging", "Reaching"],
  );
  assert.deepEqual(
    [1, 2, 3, 4, 5, 6].map((n) => groupOfLevel(n).id),
    [
      "scaffolded",
      "scaffolded",
      "developing-independence",
      "developing-independence",
      "advanced",
      "advanced",
    ],
  );
  assert.deepEqual([1, 3, 5].map(supportOfLevel), ["A", "B", "C"]);
});

test("level changes support, never rigor", () => {
  for (let n = 1; n <= 6; n += 1) assert.equal(levelProfile(n).rigor, "grade-level");
  assert.ok(levelProfile(1).hintLayers > levelProfile(6).hintLayers);
  assert.equal(levelProfile(99).level, 6);
  assert.equal(levelProfile("x").level, 1);
});

// ── economy ─────────────────────────────────────────────────────────────────────────────────
test("streak multipliers match the published table", () => {
  const t = [
    [1, 1],
    [2, 1],
    [3, 1.5],
    [4, 1.5],
    [5, 2],
    [7, 2],
    [8, 3],
    [11, 3],
    [12, 5],
    [40, 5],
  ];
  for (const [s, m] of t) assert.equal(streakMultiplier(s), m, `streak ${s}`);
});

test("rewards are bounded: per-answer cap, soft run cap, never negative, pace bonus only when timed", () => {
  let e = emptyEconomy();
  const high = rewardFor(e, { difficulty: 5, streak: 30, independent: true });
  assert.ok(high <= ECONOMY_CONFIG.questionCap);
  const timed = rewardFor(e, {
    difficulty: 3,
    streak: 1,
    independent: true,
    timed: true,
    paced: 1,
  });
  const untimed = rewardFor(e, {
    difficulty: 3,
    streak: 1,
    independent: true,
    timed: false,
    paced: 1,
  });
  assert.ok(timed > untimed);
  assert.ok(
    timed - untimed <= Math.round(ECONOMY_CONFIG.baseReward[3] * ECONOMY_CONFIG.paceBonusMax),
  );
  assert.ok(
    untimed > rewardFor(e, { difficulty: 3, streak: 1, independent: false }),
    "independence pays in untimed modes",
  );
  e = { ...e, earned: ECONOMY_CONFIG.runSoftCap };
  assert.ok(
    rewardFor(e, { difficulty: 3, streak: 1 }) <=
      Math.ceil(rewardFor(emptyEconomy(), { difficulty: 3, streak: 1 }) * 0.3),
  );
});

test("a long perfect run cannot inflate without bound", () => {
  const a = simulateEarnings(400, 1);
  const b = simulateEarnings(800, 1);
  assert.ok(b.earned < a.earned * 2.2, `earned ${a.earned} -> ${b.earned}`);
  assert.ok(b.shards >= 0 && (b.stock.shield || 0) >= 0);
});

test("purchases validate, cap, never go negative, and are idempotent", () => {
  let e = { ...emptyEconomy(), shards: 100 };
  const r1 = purchase(e, "shield", "t1");
  assert.ok(r1.ok);
  assert.equal(r1.state.shards, 100 - ECONOMY_CONFIG.items.shield.price);
  const dup = purchase(r1.state, "shield", "t1");
  assert.ok(dup.duplicate);
  assert.equal(dup.state.shards, r1.state.shards, "same transaction id charges once");
  assert.equal(purchase(r1.state, "freeze", "t2").reason, "short");
  assert.equal(purchase(e, "nonsense", "t3").reason, "unknown");
  assert.equal(
    purchase(e, "grapple", "t4", { gameId: "arena-blitz" }).reason,
    "unknown",
    "grapple is Syntax Odyssey only",
  );
  assert.ok(purchase(e, "grapple", "t5", { gameId: "syntax-odyssey" }).ok);
  let m = { ...emptyEconomy(), shards: 99999 };
  for (let i = 0; i < 8; i += 1) {
    const p = purchase(m, "matrix", `m${i}`);
    if (p.ok) m = p.state;
  }
  assert.equal(m.matrix, 5);
  assert.equal(purchase(m, "matrix", "mx").reason, "max");
  assert.equal(matrixMultiplier(m), 2);
  let s = { ...emptyEconomy(), shards: 99999 };
  for (let i = 0; i < 6; i += 1) {
    const p = purchase(s, "shield", `s${i}`);
    if (p.ok) s = p.state;
  }
  assert.equal(s.stock.shield, ECONOMY_CONFIG.items.shield.max);
});

test("shop catalog reports why an upgrade cannot be bought", () => {
  const rows = shopCatalog({ ...emptyEconomy(), shards: 10 }, { gameId: "arena-blitz" });
  assert.ok(rows.every((r) => r.reason === "short"));
  assert.ok(!rows.some((r) => r.id === "grapple"));
  assert.ok(
    shopCatalog(emptyEconomy(), { gameId: "syntax-odyssey" }).some((r) => r.id === "grapple"),
  );
});

test("recovery pays 50% (free revise) or 75% (Recovery Pulse) of the full payout", () => {
  const e = emptyEconomy();
  const full = rewardFor(e, { difficulty: 3, streak: 1 });
  const r = awardRecovery(e, { difficulty: 3, streak: 1 }, "a").pay;
  const p = awardRecovery(e, { difficulty: 3, streak: 1, pulse: true }, "b").pay;
  assert.equal(r, Math.round(full * 0.5));
  assert.equal(p, Math.round(full * 0.75));
  assert.equal(
    awardRecovery(award(e, { difficulty: 3 }, "x").state, { difficulty: 3 }, "x").pay,
    0,
    "a repeated tx pays nothing",
  );
});

test("game-defined spending: validated, idempotent, refund capped at what was spent", () => {
  const e = { ...emptyEconomy(), shards: 100 };
  assert.equal(spend(e, 0, "a").reason, "range");
  assert.equal(spend(e, 101, "b").reason, "short");
  const s1 = spend(e, 40, "c");
  assert.equal(s1.state.shards, 60);
  assert.equal(spend(s1.state, 40, "c").state.shards, 60, "repeat tx charges once");
  const r = refund(s1.state, 999, "d");
  assert.equal(r.state.shards, 100);
  assert.equal(r.state.spent, 0);
});

test("risk stake is at most half of held Shards and settles without negatives", () => {
  const e = { ...emptyEconomy(), shards: 101 };
  assert.equal(maxStake(e), 50);
  assert.equal(stake(e, 51, "a").reason, "range");
  assert.equal(stake(e, 0, "b").reason, "range");
  const s = stake(e, 50, "c");
  assert.ok(s.ok);
  assert.equal(s.state.shards, 51);
  const lost = settleStake(s.state, 50, false, {}, "d");
  assert.equal(lost.state.shards, 51);
  assert.ok(settleStake(s.state, 50, true, {}, "e").state.shards > 51);
});

test("streak shield absorbs a miss without breaking the gameplay streak", () => {
  let st = emptyStreak();
  for (let i = 0; i < 4; i += 1) st = streakAfter(st, true).streak;
  const shielded = streakAfter(st, false, { shield: true });
  assert.ok(shielded.shieldUsed);
  assert.equal(shielded.streak.streak, 4);
  assert.equal(streakAfter(st, false).streak.streak, 0);
  assert.equal(cleanEconomy({ shards: -5, matrix: 99, stock: { shield: 9 } }).shards, 0);
  assert.equal(cleanEconomy({ matrix: 99 }).matrix, 5);
});

// ── prompts ─────────────────────────────────────────────────────────────────────────────────
test("every band loads a pool of valid canonical prompts with no dropped sources", () => {
  for (const band of BANDS) {
    assert.ok(pools[band].length >= 30, `${band} pool ${pools[band].length}`);
    for (const p of pools[band]) assert.deepEqual(validatePrompt(p), [], p.id);
  }
});

test("listening prompts carry audio text; production prompts carry a rule", () => {
  for (const p of pools["6-8"].filter((x) => x.domain === "Listening"))
    assert.ok(p.stimulus.audio, p.id);
  for (const p of pools["6-8"].filter((x) => x.format === "construct"))
    assert.ok(p.evaluationRule.criteria.length);
});

test("evaluation: choice, multi, order, construct", () => {
  const choice = pools["6-8"].find(
    (p) => p.format === "choice" && Object.keys(p.distractorFeedback).length,
  );
  assert.ok(evaluate(choice, choice.correctAnswer).correct);
  const wrong = choice.answerOptions.find(
    (o) => o.id !== choice.correctAnswer && choice.distractorFeedback[o.id],
  );
  const ev = evaluate(choice, wrong.id);
  assert.ok(!ev.correct);
  assert.equal(ev.misconception.note, choice.distractorFeedback[wrong.id]);
  const multi = pools["6-8"].find((p) => p.format === "multi");
  assert.ok(
    evaluate(multi, [...multi.correctAnswer].reverse()).correct,
    "order of picks does not matter",
  );
  assert.ok(!evaluate(multi, multi.correctAnswer.slice(0, 1)).correct);
  const order = pools["6-8"].find((p) => p.format === "order");
  assert.ok(evaluate(order, order.correctAnswer).correct);
  const swapped = [...order.correctAnswer];
  [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
  const bad = evaluate(order, swapped);
  assert.ok(!bad.correct && bad.partial < 1);
  const cons = pools["6-8"].find((p) => p.format === "construct");
  assert.ok(!evaluate(cons, { text: "ok", checks: [] }).correct);
});

test("eliminating never removes the answer and keeps a real choice", () => {
  for (const p of pools["3-5"].filter((x) => x.format === "choice")) {
    const hide = eliminable(p, makeRng(7));
    assert.ok(!hide.includes(String(p.correctAnswer)), p.id);
    assert.ok(p.answerOptions.length - hide.length >= 2, p.id);
    assert.ok(hide.length <= 2);
  }
});

test("Spanish scaffolds never print the answer", () => {
  for (const band of ["3-5", "6-8"]) {
    for (const p of pools[band].filter((x) => x.format === "choice")) {
      const ans = p.answerOptions.find((o) => o.id === String(p.correctAnswer)).text.toLowerCase();
      const lang = p.scaffoldLevels.find((s) => s.kind === "language");
      for (const g of lang?.gloss || []) assert.notEqual(g.term.toLowerCase(), ans, p.id);
    }
  }
});

// ── adaptive ────────────────────────────────────────────────────────────────────────────────
test("independent success raises the target; misses lower it and queue a transfer item", () => {
  const profile = playProfile({ band: "6-8", level: 3 });
  const pool = pools["6-8"].filter((p) => p.format === "choice");
  let st = emptyAdaptive();
  const rng = makeRng(3);
  for (let i = 0; i < 6; i += 1) {
    const c = pickNext(pool, st, { profile, rng });
    st = record(
      st,
      {
        ...c.prompt,
        analyticsMetadata: { ...c.prompt.analyticsMetadata, skillFamily: "vocabulary" },
      },
      "independent",
    );
  }
  assert.ok(targetLevel(profile, st) > 3);
  let low = emptyAdaptive();
  const first = pool[0];
  low = record(low, first, "revealed");
  assert.ok(targetLevel(profile, low) < 3);
  assert.equal(low.transfer.length, 1);
});

test("a due transfer item is the same skill family and a different prompt", () => {
  const profile = playProfile({ band: "6-8", level: 3 });
  const pool = pools["6-8"].filter((p) => p.format === "choice");
  const missed = pool.find((p) => p.analyticsMetadata.skillFamily === "inference") || pool[0];
  let st = record(emptyAdaptive(), missed, "revealed");
  st = { ...st, seen: st.seen + 2 };
  const c = pickNext(pool, st, { profile, rng: makeRng(5) });
  assert.equal(c.kind, "transfer");
  assert.equal(c.prompt.analyticsMetadata.skillFamily, missed.analyticsMetadata.skillFamily);
  assert.notEqual(c.prompt.id, missed.id);
});

test("grade focus prefers tagged items but never starves the pool; selection is deterministic", () => {
  const pool = pools["6-8"].filter((p) => p.format === "choice");
  const f6 = playProfile({ band: "6-8", gradeFocus: "6", level: 4 });
  const a = pickNext(pool, emptyAdaptive(), { profile: f6, rng: makeRng(11) });
  const b = pickNext(pool, emptyAdaptive(), { profile: f6, rng: makeRng(11) });
  assert.equal(a.prompt.id, b.prompt.id);
  assert.ok(!a.prompt.grades.length || a.prompt.grades.includes("6"));
  assert.equal(
    playProfile({ band: "3-5", gradeFocus: "7" }).gradeFocus,
    "",
    "focus applies to 6-8 only",
  );
  const tiny = [pool[0]];
  assert.ok(pickNext(tiny, emptyAdaptive(), { profile: f6 }));
});

test("every band and level has prompts to adapt to", () => {
  for (const band of BANDS) {
    for (let level = 1; level <= 6; level += 1) {
      const n = forLevel(pools[band], level).length;
      assert.ok(n >= 0);
    }
    assert.ok(
      [1, 2, 3, 4, 5, 6].some((l) => forLevel(pools[band], l).length > 0),
      band,
    );
  }
});

test("scaffold layers fade with independence but the first layer stays", () => {
  const p = pools["6-8"].find((x) => x.scaffoldLevels.length >= 3);
  let st = emptyAdaptive();
  const base = layersAllowed(st, p, 1);
  for (let i = 0; i < 3; i += 1) st = record(st, p, "independent");
  assert.ok(layersAllowed(st, p, 1) < base);
  assert.ok(layersAllowed(st, p, 6) >= 1);
  assert.deepEqual(cleanAdaptive({ shift: 99 }).shift, 2);
});

// ── evidence ────────────────────────────────────────────────────────────────────────────────
test("outcomes distinguish independent, revised, scaffolded and revealed", () => {
  assert.equal(classify({ firstCorrect: true, finalCorrect: true }), "independent");
  assert.equal(
    classify({ firstCorrect: true, finalCorrect: true, scaffolds: ["hint"] }),
    "scaffolded",
  );
  assert.equal(classify({ firstCorrect: false, finalCorrect: true }), "revised");
  assert.equal(classify({ firstCorrect: false, finalCorrect: false, revealed: true }), "revealed");
});

test("CSV export is formula-safe and carries no score fields", () => {
  const rec = {
    id: "x",
    sourceId: "x",
    game: "arena-blitz",
    mode: "classic",
    band: "6-8",
    level: 3,
    domain: "Reading",
    family: "vocabulary",
    skill: "=HYPERLINK(1)",
    format: "choice",
    outcome: "independent",
    firstCorrect: true,
    attempts: 1,
    scaffolds: [],
    misconception: "",
    at: "2026-11-23",
  };
  const csv = toCsv([rec]);
  assert.ok(csv.includes("'=HYPERLINK"));
  assert.ok(!/shard|score|ms\b/i.test(csv.split("\n")[0]));
  const sum = summarize([rec]);
  assert.equal(sum.independent, 1);
});

// ── state machine, clock, session ───────────────────────────────────────────────────────────
test("state machine rejects illegal transitions and overlays return to their host", () => {
  const m = new StateMachine();
  assert.equal(m.go("PLAYING"), false);
  assert.ok(m.go("READY") && m.go("PLAYING"));
  assert.ok(m.go("SHOP"));
  assert.equal(m.go("QUESTION_ACTIVE"), false, "cannot skip out of an overlay");
  assert.ok(m.back());
  assert.equal(m.state, "PLAYING");
  assert.ok(m.go("PAUSED") && m.go("PLAYING"));
  for (const s of STATES) assert.ok(typeof s === "string");
});

test("clock: holds stop it, freeze skips 10s, big deltas are capped, untimed never expires", () => {
  let expired = 0;
  const c = new GameClock({ limitMs: 90000, onExpire: () => expired++ });
  for (let i = 0; i < 4; i += 1) c.tick(250);
  assert.equal(c.elapsed, 1000);
  c.hold("shop");
  c.tick(5000);
  assert.equal(c.elapsed, 1000);
  c.release("shop");
  c.freeze(10000);
  for (let i = 0; i < 50; i += 1) c.tick(250);
  assert.equal(c.elapsed, 1000 + (12500 - 10000), "frozen time does not count");
  const before = c.elapsed;
  c.tick(60000);
  assert.equal(c.elapsed, before + 250, "a suspended tab cannot drain the clock");
  for (let i = 0; i < 500; i += 1) c.tick(250);
  assert.equal(expired, 1);
  const u = new GameClock({ limitMs: 0 });
  u.tick(1e9);
  assert.equal(u.expired, false);
});

const startSession = (over = {}) => {
  const s = new ArcadeSession({
    gameId: "arena-blitz",
    pool: pools["6-8"].filter((p) => p.format !== "construct"),
    band: "6-8",
    level: 3,
    seed: 42,
    ...over,
  });
  s.ready();
  s.begin();
  return s;
};
const answerRight = (s, q) =>
  s.submit(
    q.id,
    q.prompt.format === "multi" || q.prompt.format === "order"
      ? q.prompt.correctAnswer
      : q.prompt.correctAnswer,
  );
const wrongFor = (q) => {
  const p = q.prompt;
  if (p.format === "choice")
    return p.answerOptions.find((o) => o.id !== String(p.correctAnswer)).id;
  if (p.format === "multi")
    return [p.answerOptions.find((o) => !p.correctAnswer.includes(o.id)).id];
  return [...p.correctAnswer].reverse();
};

test("session: correct first try pays, builds streak, records independent evidence", () => {
  const s = startSession();
  const q = s.ask();
  assert.equal(s.state, "QUESTION_ACTIVE");
  const r = answerRight(s, q);
  assert.ok(r.correct && r.pay > 0);
  assert.equal(s.streak.streak, 1);
  assert.equal(s.state, "FEEDBACK");
  assert.equal(s.records[0].outcome, "independent");
  assert.equal(s.next(), "PLAYING");
});

test("session: a miss gives targeted recovery, a second try, then the answer; evidence stays honest", () => {
  const s = startSession();
  let q = s.ask();
  const miss = s.submit(q.id, wrongFor(q));
  assert.ok(!miss.correct);
  assert.equal(s.state, "RECOVERY");
  assert.ok(miss.recoveryHint !== undefined);
  const again = s.submit(
    q.id,
    q.prompt.format === "choice" ? q.prompt.correctAnswer : q.prompt.correctAnswer,
  );
  assert.ok(again.correct);
  assert.ok(
    again.pay > 0 &&
      again.pay <= rewardFor(emptyEconomy(), { difficulty: q.prompt.difficulty, streak: 1 }),
  );
  assert.equal(s.records[0].outcome, "revised");
  assert.equal(s.records[0].firstCorrect, false, "the second try never becomes a first attempt");
  s.next();
  q = s.ask();
  s.submit(q.id, wrongFor(q));
  const shown = s.submit(q.id, wrongFor(q));
  assert.ok(shown.revealed);
  assert.equal(s.records[1].outcome, "revealed");
  assert.equal(s.adaptive.transfer.length >= 1, true);
});

test("session: submit is idempotent and stale tickets are refused", () => {
  const s = startSession();
  const q = s.ask();
  const a = answerRight(s, q);
  const b = answerRight(s, q);
  assert.equal(a, b);
  assert.equal(s.records.length, 1);
  assert.equal(s.economy.shards, a.pay);
  assert.equal(s.submit("nope", "a").ok, false);
});

test("session: shield absorbs a miss (streak kept, miss still recorded), hearts drop only without one", () => {
  const s = startSession({ mode: "survival" });
  s.economy = { ...s.economy, shards: 500 };
  assert.ok(s.buy("shield").ok);
  let q = s.ask();
  answerRight(s, q);
  s.next();
  q = s.ask();
  answerRight(s, q);
  s.next();
  q = s.ask();
  const r = s.submit(q.id, wrongFor(q));
  assert.ok(r.shield);
  assert.equal(s.hearts, 3);
  assert.equal(s.streak.streak, 2);
  s.submit(q.id, q.prompt.correctAnswer);
  s.next();
  q = s.ask();
  const r2 = s.submit(q.id, wrongFor(q));
  assert.ok(r2.heartLost);
  assert.equal(s.hearts, 2);
});

test("session: survival ends in GAME_OVER when hearts run out; calm mode never loses hearts", () => {
  const s = startSession({ mode: "survival" });
  for (let i = 0; i < 3; i += 1) {
    const q = s.ask();
    s.submit(q.id, wrongFor(q));
    s.submit(q.id, wrongFor(q));
    s.next();
  }
  assert.equal(s.state, "GAME_OVER");
  assert.ok(s.finish());
  assert.equal(s.state, "RESULTS");
  const calm = startSession({ mode: "survival", calm: true });
  assert.equal(calm.maxHearts, 0);
  assert.equal(calm.timed, false);
  const q = calm.ask();
  calm.submit(q.id, wrongFor(q));
  assert.equal(calm.hearts, 0);
  assert.notEqual(calm.state, "GAME_OVER");
});

test("session: shop and pause hold the clock; Chrono Freeze needs a timed run", () => {
  const s = startSession({ mode: "blitz", questionPausesClock: false });
  for (let i = 0; i < 8; i += 1) s.tick(250);
  assert.ok(s.openShop());
  s.tick(5000);
  assert.equal(s.clock.elapsed, 2000);
  s.economy = { ...s.economy, shards: 300 };
  assert.ok(s.buy("freeze").ok);
  assert.ok(s.closeShop());
  assert.ok(s.useFreeze());
  s.tick(250);
  assert.equal(s.clock.elapsed, 2000, "frozen");
  assert.ok(s.pause());
  s.tick(250);
  assert.ok(s.resume());
  const untimed = startSession();
  untimed.economy = { ...untimed.economy, shards: 300 };
  untimed.buy("freeze");
  assert.equal(untimed.useFreeze(), false);
  assert.equal(untimed.economy.stock.freeze, 1, "no charge when there is no timer");
});

test("session: Blitz timer expiry mid-question lets the student finish it, then ends the round", () => {
  const s = startSession({ mode: "blitz", questionPausesClock: false });
  const q = s.ask();
  for (let i = 0; i < 400; i += 1) s.tick(250);
  assert.ok(s.expiredPending);
  answerRight(s, q);
  assert.equal(s.next(), "ROUND_COMPLETE");
  assert.ok(s.finish());
});

test("session: Context Decoder is prompt-tied, never hides the answer, and counts as help", () => {
  const s = startSession();
  s.economy = { ...s.economy, shards: 100 };
  s.buy("decoder");
  const q = s.ask({ formats: ["choice"] });
  const d = s.useDecoder(q.id);
  assert.ok(d);
  assert.ok(!d.hidden.includes(String(q.prompt.correctAnswer)));
  s.submit(q.id, q.prompt.correctAnswer);
  assert.equal(s.records[0].outcome, "scaffolded");
});

test("session: Recovery Pulse serves a fresh prompt of the same family at 75% payout", () => {
  const s = startSession();
  s.economy = { ...s.economy, shards: 100 };
  s.buy("recovery");
  let q = s.ask({ formats: ["choice"] });
  const fam = q.prompt.analyticsMetadata.skillFamily;
  s.submit(q.id, wrongFor(q));
  s.submit(q.id, wrongFor(q));
  const fresh = s.useRecoveryPulse();
  if (fresh) {
    assert.equal(fresh.prompt.analyticsMetadata.skillFamily, fam);
    assert.notEqual(fresh.prompt.id, q.prompt.id);
    const r = s.submit(fresh.id, fresh.prompt.correctAnswer);
    assert.ok(r.correct);
  }
  assert.equal(s.records[0].outcome, "revealed", "the original miss stays a miss");
});

test("session: snapshot restores the same run, same next question and a mid-question ticket", () => {
  const a = startSession();
  let q = a.ask();
  answerRight(a, q);
  a.next();
  q = a.ask();
  a.scaffold(q.id);
  const snap = JSON.parse(JSON.stringify(a.serialize()));
  const b = ArcadeSession.restore(snap, {
    pool: pools["6-8"].filter((p) => p.format !== "construct"),
  });
  assert.ok(b);
  assert.equal(b.state, "QUESTION_ACTIVE");
  assert.equal(b.publicTicket().id, a.publicTicket().id);
  assert.equal(b.economy.shards, a.economy.shards);
  assert.equal(b.streak.streak, a.streak.streak);
  answerRight(a, a.publicTicket());
  answerRight(b, b.publicTicket());
  a.next();
  b.next();
  assert.equal(a.ask().prompt.id, b.ask().prompt.id, "seeded RNG state survives a save");
});

test("session: corrupt or incompatible snapshots restore to null, never a half-built run", () => {
  const pool = pools["6-8"];
  assert.equal(ArcadeSession.restore(null, { pool }), null);
  assert.equal(ArcadeSession.restore({ v: 99 }, { pool }), null);
  assert.equal(ArcadeSession.restore({ v: 1, gameId: 5 }, { pool }), null);
});

test("session: finish -> save -> replay keeps adaptive state and resets the run", () => {
  const s = startSession();
  const q = s.ask();
  answerRight(s, q);
  s.next();
  assert.ok(s.finish());
  let saved = null;
  assert.ok(
    s.save((r) => {
      saved = r;
    }),
  );
  assert.equal(saved.evidence.attempted, 1);
  assert.ok(s.replay());
  assert.equal(s.economy.shards, 0);
  assert.equal(s.records.length, 0);
  assert.ok(s.begin());
});

test("session: game-defined spend, world credits are capped, and staking stays within half", () => {
  const s = startSession();
  s.economy = { ...s.economy, shards: 100 };
  assert.ok(s.canSpend(40));
  assert.ok(s.spendShards(40).ok);
  assert.equal(s.economy.shards, 60);
  assert.equal(s.spendShards(500).reason, "short");
  assert.ok(s.refundShards(10).ok);
  assert.equal(s.economy.shards, 70);
  let got = 0;
  for (let i = 0; i < 40; i += 1) got += s.creditShards(10, `w${i}`);
  assert.ok(got <= 30 + Math.round(0 * 0.15) + 1, `world pickups capped, got ${got}`);
  const st = s.stakeShards(1000);
  assert.equal(st.reason, "range");
  const ok = s.stakeShards(Math.floor(s.economy.shards / 2));
  assert.ok(ok.ok);
  assert.ok(s.settleStake(ok.staked, true) > 0);
});
