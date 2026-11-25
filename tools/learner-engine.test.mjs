// Learner engine acceptance (spec 4.5): estimation, Leitner budget, recommendations, daily plan.
// Everything is deterministic: seeded PRNG from the fixture library, synthetic students only.
// NEGATIVE CONTROLS: checkDecay and checkBudget take injectable hooks; a broken decay and a broken
// budget cap must make them throw. The hooks are module parameters, the source is never edited.
import assert from "node:assert/strict";
import { test } from "node:test";
import { BCPSS_UNITS, UNIT_CONNECTIONS } from "../data/bcpss-curriculum-seed.mjs";
import { loadStudio } from "../functions/_lib/bcpss/studio.js";
import { createRng, getFixtureClass, getFixtureHistory } from "../shared/fixtures/index.js";
import {
  DAY_MS,
  DEFAULTS,
  decayFactor,
  describeUnit,
  difficultyPrior,
  emptyNode,
  estimate,
  newCard,
  nextBox,
  observe,
  planDay,
  priorFor,
  recommend,
  review,
  scoreActivities,
  selectDue,
  startLevel,
  studentView,
  tagUnit,
  teacherView,
  updateDifficulty,
  validateBudget,
} from "../shared/learner/index.js";

const T0 = Date.parse("2026-09-08T13:00:00.000Z");
const level = startLevel({ grade: 4 });
const fresh = () => emptyNode(priorFor({ level, band: "3_4" }));

/** Sessions of `perSession` correct answers, one session per day. Returns the node after `sessions`. */
function practice(sessions, perSession, hooks, correct = () => true) {
  let node = fresh();
  for (let s = 0; s < sessions; s++) {
    for (let i = 0; i < perSession; i++) {
      node = observe(node, { correct: correct(s, i), ts: T0 + s * DAY_MS + i * 60_000 }, hooks);
    }
  }
  return node;
}

/** Acceptance: a student who stops practicing slides back toward "getting there" by the forgetting curve. */
function checkDecay(hooks) {
  const strongNode = practice(4, 4, hooks);
  const end = T0 + 3 * DAY_MS + 4 * 60_000;
  assert.equal(estimate(strongNode, end, hooks).status, "strong");
  let last = estimate(strongNode, end, hooks).mean;
  for (const days of [7, 21, 42, 84]) {
    const m = estimate(strongNode, end + days * DAY_MS, hooks).mean;
    assert.ok(m < last, `mean must fall while idle (day ${days})`);
    last = m;
  }
  const idle = estimate(strongNode, end + 120 * DAY_MS, hooks);
  assert.equal(idle.status, "getting there");
  assert.ok(Math.abs(idle.mean - fresh().prior.a / (fresh().prior.a + fresh().prior.b)) < 0.05);
}

/** Acceptance: the scheduler never exceeds the daily card budget. */
function checkBudget(hooks) {
  const rng = createRng("budget");
  const cards = Array.from({ length: 80 }, (_, i) => ({
    ...newCard(`term${i}`, `u${i % 5}`, 100),
    box: rng.int(1, 5),
    due: 100 - rng.int(0, 6),
  }));
  for (const budget of [1, 3, 10, 25, 40]) {
    for (const used of [0, budget - 1, budget]) {
      const got = selectDue(cards, 100, { budget, usedToday: used }, hooks);
      assert.ok(
        got.length <= Math.max(0, budget - used),
        `budget ${budget} used ${used} got ${got.length}`,
      );
    }
  }
}

test("decay: half-life math", () => {
  assert.equal(decayFactor(0), 1);
  assert.ok(Math.abs(decayFactor(21) - 0.5) < 1e-12);
  assert.ok(Math.abs(decayFactor(42, 21) - 0.25) < 1e-12);
  assert.ok(Math.abs(decayFactor(10, 10) - 0.5) < 1e-12, "half-life is tunable");
});

test("acceptance: idle student decays toward getting there", () => checkDecay({}));

test("negative control: a decay that never forgets makes the decay acceptance fail", () => {
  assert.throws(() => checkDecay({ decay: () => 1 }), { name: "AssertionError" });
});

test("acceptance: the scheduler never exceeds the daily budget", () => checkBudget({}));

test("negative control: a budget cap that does nothing makes the budget acceptance fail", () => {
  assert.throws(() => checkBudget({ cap: (list) => list }), { name: "AssertionError" });
});

test("acceptance: a consistently correct student reaches strong within N = 2 sessions of 4 attempts", () => {
  const N = 2;
  assert.notEqual(
    estimate(practice(1, 4), T0 + 4 * 60_000).status,
    "strong",
    "1 session is not enough",
  );
  assert.equal(estimate(practice(N, 4), T0 + (N - 1) * DAY_MS + 4 * 60_000).status, "strong");
});

test("acceptance: a consistently wrong student reaches building", () => {
  const node = practice(3, 4, {}, () => false);
  assert.equal(estimate(node, T0 + 2 * DAY_MS + 4 * 60_000).status, "building");
});

test("cold start shows getting there, never strong or building from the prior alone", () => {
  for (const grade of ["K", 3, 8]) {
    for (const band of ["1_2", "3_4", "5_6"]) {
      const node = emptyNode(priorFor({ level: startLevel({ grade }), band }));
      assert.equal(estimate(node, T0).status, "getting there");
    }
  }
  assert.equal(startLevel({ grade: 2, diagnosticLevel: 5 }), 5, "diagnostic seed wins over grade");
  assert.throws(() => startLevel({ grade: 12 }), /unknown grade/);
});

test("interval narrows with evidence and views hide numbers from students", () => {
  const few = estimate(practice(1, 2), T0 + 120_000);
  const many = estimate(practice(3, 8), T0 + 2 * DAY_MS + 8 * 60_000);
  assert.ok(many.upper - many.lower < few.upper - few.lower);
  const sv = studentView(many);
  assert.deepEqual(Object.keys(sv).sort(), ["note", "status"]);
  assert.match(sv.note, /practice estimate, not an official score/);
  assert.ok(["building", "getting there", "strong"].includes(sv.status));
  assert.doesNotMatch(JSON.stringify(sv), /\d/);
  const tv = teacherView(many);
  assert.equal(tv.interval.length, 2);
  assert.match(
    tv.disclaimer,
    /inspired by WIDA ACCESS.*not official.*not a score.*not a placement tool/i,
  );
});

test("observe is pure, rejects out-of-order and a hinted success counts less", () => {
  const a = fresh();
  const b = observe(a, { correct: true, ts: T0 });
  assert.equal(a.s, 0);
  assert.equal(b.s, 1);
  assert.throws(() => observe(b, { correct: true, ts: T0 - 1 }), /time order/);
  assert.ok(observe(a, { correct: true, hintsUsed: 1, ts: T0 }).s < 1);
});

test("fixture students: bridging students estimate higher than emerging ones", () => {
  const cls = getFixtureClass("fx-6-balanced");
  const attempts = getFixtureHistory(cls);
  const end = Date.parse(attempts[attempts.length - 1].ts);
  const byStudent = new Map();
  for (const at of attempts) {
    const node = byStudent.get(at.studentId) || fresh();
    byStudent.set(
      at.studentId,
      observe(node, { correct: at.correct, hintsUsed: at.hintsUsed, ts: Date.parse(at.ts) }),
    );
  }
  const mean = (band) => {
    const ids = cls.students.filter((s) => s.band === band).map((s) => s.id);
    return ids.reduce((n, id) => n + estimate(byStudent.get(id), end).mean, 0) / ids.length;
  };
  assert.ok(
    mean("bridging") > mean("emerging") + 0.1,
    `${mean("bridging")} vs ${mean("emerging")}`,
  );
});

test("leitner: intervals, miss to box 1, easy skips a box, top box holds", () => {
  assert.deepEqual([...DEFAULTS.leitnerIntervalsDays], [1, 2, 4, 8, 16]);
  assert.equal(nextBox(3, "miss"), 1);
  assert.equal(nextBox(2, "hit"), 3);
  assert.equal(nextBox(2, "easy"), 4);
  assert.equal(nextBox(5, "easy"), 5);
  assert.throws(() => nextBox(1, "meh"), /unknown outcome/);
  let card = newCard("compare", "u1", 10);
  const dues = [];
  for (let i = 0; i < 5; i++) {
    card = review(card, "hit", card.due);
    dues.push(card.due);
  }
  assert.deepEqual(
    dues.map((d, i) => d - (i ? dues[i - 1] : 10)),
    [2, 4, 8, 16, 16],
  );
  assert.equal(review({ ...card }, "miss", 99).due, 100);
});

test("leitner: budget validation, default 10, order is most overdue first", () => {
  assert.equal(DEFAULTS.dailyCardBudget, 10);
  for (const bad of [0, -1, 2.5, 41, "10"])
    assert.throws(() => validateBudget(bad), /daily card budget/);
  const cards = [
    { ...newCard("b", "u", 5), due: 8 },
    { ...newCard("a", "u", 5), due: 5 },
    { ...newCard("c", "u", 5), due: 99 },
  ];
  assert.deepEqual(
    selectDue(cards, 10).map((c) => c.term),
    ["a", "b"],
  );
});

// ---- recommendations and plan over a real unit ----
const row = BCPSS_UNITS.find((u) => u.id === "g6-math-u1");
const studio = await loadStudio(row.id);
const unit = describeUnit(
  row,
  UNIT_CONNECTIONS.find((c) => c.unit_id === row.id),
  studio,
);
const candidates = tagUnit(unit, studio).map((t) => {
  const parts = t.exercises.find((id) => id.startsWith("lang.")).split(".");
  return {
    ...t,
    band: parts[3],
    difficulty: difficultyPrior({ languageDemand: 0.6, band: parts[3] }),
  };
});
const learner = { level: startLevel({ grade: 6 }), targetBand: "3_4", nodes: {} };
const NOW = T0 + 30 * DAY_MS;
const history = [
  { activityId: candidates[0].id, domain: candidates[0].domain, ts: NOW - DAY_MS },
  { activityId: candidates[1].id, domain: candidates[1].domain, ts: NOW - 2 * DAY_MS },
];

test("recommendations: top 3, every one has a reason and no numbers or level words", () => {
  const recs = recommend(candidates, learner, history, NOW, { pacing: { [unit.id]: 3 } });
  assert.equal(recs.length, 3);
  for (const r of recs) {
    assert.ok(r.why.text.length > 10);
    assert.doesNotMatch(r.why.text, /\d|level|band|score|beginner/i);
    for (const k of ["need", "fit", "freshness", "variety"]) assert.ok(k in r.why.terms);
  }
});

test("recommendations: freshness, variety and the calendar change the ranking", () => {
  const all = scoreActivities(candidates, learner, history, NOW);
  const seen = all.find((s) => s.id === candidates[0].id);
  assert.equal(seen.why.terms.freshness, 0.05);
  const run = candidates.find(
    (c) => candidates.filter((o) => o.domain === c.domain).length > 1,
  ).domain;
  const streak = [1, 2].map((i) => ({ activityId: `x${i}`, domain: run, ts: NOW - i * 3600_000 }));
  const penalized = scoreActivities(candidates, learner, streak, NOW).find(
    (s) => s.candidate.domain === run,
  );
  assert.equal(penalized.why.terms.variety, 0.4);
  const soon = scoreActivities(candidates, learner, [], NOW, { pacing: { [unit.id]: 0 } })[0];
  const later = scoreActivities(candidates, learner, [], NOW)[0];
  assert.ok(soon.why.terms.calendar > later.why.terms.calendar);
});

test("recommendations: least-practiced domain gets the plain-language reason", () => {
  const busy = ["Reading", "Reading", "Writing", "Writing", "Speaking"].map((domain, i) => ({
    activityId: `h${i}`,
    domain,
    ts: NOW - (i + 4) * 3600_000,
  }));
  const recs = scoreActivities(candidates, learner, busy, NOW).filter(
    (s) => s.candidate.domain === "Listening",
  );
  assert.match(recs[0].why.text, /You practiced listening less this week\./);
});

test("recommendations: lowest-mastery nodes outrank mastered ones", () => {
  const target = candidates.find((c) => c.domain === "Writing");
  const mastered = {
    ...learner,
    nodes: Object.fromEntries(
      target.exercises.map((id) => [id, { s: 40, f: 0, ts: NOW, prior: { a: 2, b: 2 } }]),
    ),
  };
  const before = scoreActivities(candidates, learner, [], NOW).find((s) => s.id === target.id);
  const after = scoreActivities(candidates, mastered, [], NOW).find((s) => s.id === target.id);
  assert.ok(after.why.terms.need < before.why.terms.need);
});

test("acceptance: recommendations are reproducible for a seed", () => {
  const run = (seed) => {
    const rng = createRng(seed).next;
    return JSON.stringify(
      recommend(candidates, learner, history, NOW, { rng }).map((r) => [r.id, r.score, r.why.text]),
    );
  };
  assert.equal(run("seed-1"), run("seed-1"));
  assert.equal(run("seed-2"), run("seed-2"));
  assert.equal(
    JSON.stringify(recommend(candidates, learner, history, NOW)),
    JSON.stringify(recommend(candidates, learner, history, NOW)),
  );
});

test("plan: 10/15/20 minutes fit, warm-up is 2 minutes, one activity per domain, 8-20 minute activities", () => {
  const scored = scoreActivities(candidates, learner, history, NOW);
  const cards = Array.from({ length: 30 }, (_, i) => ({
    ...newCard(`w${i}`, i % 2 ? "other" : unit.id, 1),
    due: 1,
  }));
  for (const minutes of DEFAULTS.planMinutes) {
    const plan = planDay(minutes, scored, { cards, today: 5, currentUnitId: unit.id, budget: 10 });
    assert.ok(plan.totalMinutes <= minutes, `${minutes}: ${plan.totalMinutes}`);
    assert.equal(plan.warmup.minutes, 2);
    assert.ok(
      plan.warmup.cards.every((c) => c.unitId !== unit.id),
      "warm-up reviews earlier units",
    );
    assert.ok(plan.warmup.cards.length <= DEFAULTS.warmupCards);
    const doms = plan.activities.map((a) => candidates.find((c) => c.id === a.id).domain);
    assert.equal(new Set(doms).size, doms.length);
    assert.ok(plan.activities.length >= 1);
    for (const a of plan.activities) {
      assert.ok(a.minutes >= 8 && a.minutes <= 20);
      assert.ok(a.why.text.length > 0);
    }
  }
  assert.throws(() => planDay(12, scored, { cards, today: 5 }), /plan length/);
});

test("plan: warm-up respects the daily card budget even with many due cards", () => {
  const scored = scoreActivities(candidates, learner, history, NOW);
  const cards = Array.from({ length: 30 }, (_, i) => ({ ...newCard(`w${i}`, "other", 1), due: 1 }));
  assert.equal(
    planDay(15, scored, { cards, today: 5, currentUnitId: unit.id, budget: 3 }).warmup.cards.length,
    3,
  );
  assert.equal(
    planDay(15, scored, { cards, today: 5, currentUnitId: unit.id, budget: 10, usedToday: 10 })
      .warmup.cards.length,
    0,
  );
});

test("plan: knapsack matches brute force on random instances", () => {
  const rng = createRng("knap");
  const doms = ["Listening", "Speaking", "Reading", "Writing", "Vocabulary", "Game"];
  for (let t = 0; t < 40; t++) {
    const scored = Array.from({ length: 8 }, (_, i) => ({
      id: `k${i}`,
      score: rng.next(),
      candidate: { id: `k${i}`, domain: rng.pick(doms), minutes: rng.int(8, 14) },
      why: { text: "x" },
    })).sort((a, b) => b.score - a.score);
    const plan = planDay(20, scored, { cards: [], today: 0 });
    const got = plan.activities.reduce((n, a) => n + scored.find((s) => s.id === a.id).score, 0);
    let best = 0;
    for (let mask = 0; mask < 1 << scored.length; mask++) {
      const picks = scored.filter((_, i) => mask & (1 << i));
      if (new Set(picks.map((p) => p.candidate.domain)).size !== picks.length) continue;
      if (picks.reduce((n, p) => n + p.candidate.minutes, 0) > 18) continue;
      best = Math.max(
        best,
        picks.reduce((n, p) => n + p.score, 0),
      );
    }
    assert.ok(Math.abs(got - best) < 1e-9, `trial ${t}: ${got} vs ${best}`);
  }
});

test("difficulty: prior spans the demand range; updates come only from cells of >= 10", () => {
  const lo = difficultyPrior({ languageDemand: 0.43, band: "1_2" });
  const hi = difficultyPrior({ languageDemand: 0.8, band: "5_6" });
  assert.ok(lo >= 0.2 && hi <= 0.95 && hi > lo + 0.4);
  assert.equal(
    updateDifficulty(0.5, { attempts: 9, correct: 0 }),
    0.5,
    "small cell leaves the prior",
  );
  assert.ok(
    updateDifficulty(0.5, { attempts: 100, correct: 10 }) > 0.5,
    "mostly wrong makes it harder",
  );
  assert.ok(updateDifficulty(0.5, { attempts: 100, correct: 95 }) < 0.5);
  assert.equal(updateDifficulty(0.5, undefined), 0.5);
});
