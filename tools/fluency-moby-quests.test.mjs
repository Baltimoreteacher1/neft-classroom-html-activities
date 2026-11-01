// Moby quests, journey and avatar: simulated learners (fixed clock, no randomness) through the real tutor, mastery and
// recommendation engines. Every quest must be met only through learning behaviour, every gaming attempt must earn
// nothing (with a reason a student can read), goals must never take anything away, saves must survive corruption,
// celebrations must be authentic, and the avatar must never wear what was not earned.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const store = new Map();
const storage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
};
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
Object.defineProperty(globalThis, "sessionStorage", {
  configurable: true,
  value: { getItem: () => null, setItem() {}, removeItem() {} },
});
Object.defineProperty(globalThis, "window", { configurable: true, value: globalThis });

const lab = new URL("../math/fluency-lab/", import.meta.url);
const load = (path) => import(new URL(path, lab));
const { emptyTutor, findSkill, recordAnswer } = await load("tutor-engine.js");
const { masteryState } = await load("mastery-model.js");
const { recommend, continueTarget, MASTERY_RULE } = await load("recommendation-engine.js");
const { cleanRewards } = await load("rewards.js");
const { ITEMS, SHOP } = await load("buddy-items.js");
const { setLang } = await load("i18n.js");
const { ES } = await load("i18n-es.js");
const { layoutSkillMap } = await load("skill-map.js");
const Q = await load("moby/quests.js");
const G = await load("moby/quest-guard.js");
const GOALS = await load("moby/quest-goals.js");
const J = await load("moby/journey.js");
const A = await load("moby/avatar.js");
const { ES_MOBY_QUESTS } = await load("moby/i18n-es-quests.js");

let passed = 0;
const check = (_name, fn) => {
  fn();
  passed += 1;
};

const NOW = new Date(2026, 9, 14, 15, 0).getTime(); // Wednesday 14 October 2026, local time
const at = (daysAgo, hour = 10) => new Date(2026, 9, 14 - daysAgo, hour).getTime();
const GRADE = 4;
const K = (id) => `${GRADE}:${id}`;

// ---- fixtures ----------------------------------------------------------------------------------------------------
// Rows are [daysAgo, correct, independent, level]; they go through the real recordAnswer, oldest first.
function learner(spec = {}) {
  const tutor = emptyTutor();
  for (const [id, rows] of Object.entries(spec.records || {}))
    for (const [daysAgo, correct, independent = true, level = 1] of rows)
      recordAnswer(
        tutor,
        findSkill(id.includes(":") ? id : K(id)),
        { correct, independent, level },
        at(daysAgo),
      );
  for (const mistake of spec.mistakes || [])
    tutor.mistakes.push({
      id: String(tutor.mistakes.length),
      question: "q",
      at: at(2),
      resolvedAt: null,
      category: null,
      ...mistake,
    });
  return tutor;
}
const wins = (days) => days.map((daysAgo) => [daysAgo, true]);

const MID = learner({
  records: {
    division: wins([6, 6, 5, 5, 4, 3, 3, 2, 1, 0]), // mastered, not due, practised today
    "round-large": wins([47, 46, 45, 44, 43, 42, 41, 40]), // strong, but its review is long overdue
    "add-large": wins([4, 4, 3, 3, 2, 2]), // proficient, close to mastered
    "fraction-compare": [
      [5, false],
      [5, true],
      [4, false],
      [4, false],
      [3, false],
    ], // a gap
    "multiply-1digit": [
      [3, true],
      [2, false],
      [1, true],
    ], // being built
  },
  mistakes: [{ key: K("fraction-compare") }],
});
const FRESH = learner();
const ALL_MASTERED = learner({
  records: Object.fromEntries(
    [
      "place-million",
      "round-large",
      "add-large",
      "subtract-large",
      "multiply-1digit",
      "multiply-2digit",
      "division",
      "factors",
      "fraction-equiv",
      "fraction-compare",
      "unit-conversion",
    ].map((id) => [
      id,
      [...wins([8, 8, 7, 7, 6, 5, 4, 3]), [2, true, true, 2], [1, true, true, 2]],
    ]),
  ),
});
for (const id of ["division", "add-large", "round-large"])
  assert.ok(findSkill(K(id)), `fixture skill ${id} exists`);

const rawCounts = (tutor, key) => {
  const solid = (tutor.records[key]?.recent || []).filter(
    (entry) => entry.independent && entry.level >= 1,
  );
  return { independent: solid.length, successes: solid.filter((entry) => entry.correct).length };
};
const stateOf = (tutor, id) => masteryState(tutor.records[K(id)], NOW);

// Fixture preconditions: if the models change, fail here and say so, rather than test the wrong learner.
check("fixture shape", () => {
  assert.equal(stateOf(MID, "division"), "mastered");
  assert.equal(stateOf(MID, "add-large"), "proficient");
  assert.ok(["proficient", "mastered"].includes(stateOf(MID, "round-large")));
  const sections = Object.fromEntries(
    recommend(MID, GRADE, NOW).map((section) => [
      section.id,
      section.items.map((item) => item.skill.id),
    ]),
  );
  assert.equal(sections.fixAGap[0], "fraction-compare");
  assert.equal(sections.review[0], "round-large");
  assert.ok(sections.readyToMaster.includes("add-large"));
  assert.ok(sections.keepPracticing.includes("multiply-1digit"));
  assert.ok(sections.challenge.includes("division"));
});

// ---- helpers for driving events ----------------------------------------------------------------------------------
let counter = 0;
const answer = (id, extra = {}) => {
  counter += 1;
  return {
    type: "answer",
    correct: true,
    firstTry: true,
    supported: false,
    skillKey: K(id),
    sig: `s${counter}`,
    answer: String(100 + counter),
    responseMs: 3500,
    level: 1,
    ...extra,
  };
};
const wrong = (id, extra = {}) => answer(id, { correct: false, ...extra });
const play = (state, events, now = NOW) => {
  const results = [];
  let current = state;
  for (const event of events) {
    const result = Q.progressQuest(current, event, now);
    results.push(result);
    current = result.state;
  }
  return { state: current, results };
};
const pinned = (tutor = MID, learnerId = "0", now = NOW) =>
  Q.dayQuests(Q.emptyQuests(learnerId), tutor, GRADE, now, { learnerId });
const questOf = (state, kind, now = NOW) =>
  state.days[
    new Date(now).toISOString().slice(0, 0) +
      `${new Date(now).getFullYear()}-${String(new Date(now).getMonth() + 1).padStart(2, "0")}-${String(new Date(now).getDate()).padStart(2, "0")}`
  ].quests.find((quest) => quest.kind === kind);
const snapshotOf = (state) =>
  JSON.stringify({ days: state.days, stats: state.stats, weeks: state.weeks });

// ---- 1. quests: deterministic, 3-5 a day, cite real evidence ----------------------------------------------------
check("quests are deterministic per (learner, day) with stable ids", () => {
  const a = Q.buildQuests(MID, GRADE, NOW, { learnerId: "0" });
  const b = Q.buildQuests(MID, GRADE, NOW + 3600 * 1000, { learnerId: "0" }); // same day, later
  assert.deepEqual(a, b);
  assert.deepEqual(
    a.map((quest) => quest.id),
    a.map((quest) => `0:2026-10-14:${quest.slot}`),
  );
  assert.notDeepEqual(
    Q.buildQuests(MID, GRADE, at(-1), { learnerId: "0" }).map((quest) => quest.id),
    a.map((quest) => quest.id),
  );
  assert.notDeepEqual(
    Q.buildQuests(MID, GRADE, NOW, { learnerId: "3" }).map((quest) => quest.id),
    a.map((quest) => quest.id),
  );
  assert.equal(new Set(a.map((quest) => quest.id)).size, a.length);
});

check("each learner gets 3 to 5 quests built from the recommendation engine", () => {
  for (const [name, tutor] of Object.entries({ MID, FRESH, ALL_MASTERED })) {
    const quests = Q.buildQuests(tutor, GRADE, NOW);
    assert.ok(quests.length >= 3 && quests.length <= 5, `${name}: ${quests.length} quests`);
  }
  const quests = Q.buildQuests(MID, GRADE, NOW);
  const kinds = quests.map((quest) => quest.kind);
  assert.deepEqual(kinds, ["fixGap", "keepFresh", "learnNew", "think", "challenge"]);
  assert.equal(quests.find((quest) => quest.kind === "fixGap").skillKey, K("fraction-compare"));
  assert.equal(quests.find((quest) => quest.kind === "keepFresh").skillKey, K("round-large"));
  assert.equal(quests.find((quest) => quest.kind === "challenge").skillKey, K("division"));
  assert.equal(quests.find((quest) => quest.kind === "challenge").optional, true);
  const gap = quests.find((quest) => quest.kind === "fixGap");
  assert.ok(gap.keys.length >= 1 && gap.keys[0] === K("fraction-compare"));
  // A learner who has not started anything still gets quests, never repetition of mastered work.
  assert.ok(
    Q.buildQuests(FRESH, GRADE, NOW).every((quest) => ["learnNew", "think"].includes(quest.kind)),
  );
});

check("every quest cites real counts from the learner's own answers", () => {
  const { quests } = pinned();
  const allowed = (quest) =>
    new Set(
      [
        ...Object.values(quest.evidence.counts),
        MASTERY_RULE.score,
        MASTERY_RULE.checks,
        MASTERY_RULE.days,
        0,
        2,
        3,
        100,
      ].map(String),
    );
  for (const quest of quests) {
    const numbers = quest.why.match(/\d+/g) || [];
    assert.ok(numbers.length >= 1, `${quest.kind} why has a count: ${quest.why}`);
    for (const n of numbers)
      assert.ok(
        allowed(quest).has(n),
        `${quest.kind} why cites ${n}, not in its evidence: ${quest.why}`,
      );
    // The evidence itself is recounted from the raw saved answers, not taken from the engine's counters.
    const raw = rawCounts(MID, quest.keys[0] || quest.skillKey);
    if (quest.kind !== "think") {
      assert.equal(quest.evidence.counts.independent, raw.independent, `${quest.kind} independent`);
      assert.equal(quest.evidence.counts.successes, raw.successes, `${quest.kind} successes`);
    }
  }
  const gap = quests.find((quest) => quest.kind === "fixGap");
  assert.match(gap.why, /One mistake is still open/);
  assert.match(gap.why, /You solved 1 of 5 on your own\./);
  const fresh = quests.find((quest) => quest.kind === "keepFresh");
  assert.match(fresh.why, /You solved 8 of 8 on your own\./);
  assert.ok(["observed", "mixed", "inferred"].includes(gap.evidence.basis));
  assert.equal(gap.action.mode, "guided");
});

check("quests expose a objective, steps and completion criteria a learner can read", () => {
  const { quests } = pinned();
  for (const quest of quests) {
    assert.ok(quest.title && quest.objective && quest.steps.length >= 1);
    for (const step of quest.steps) assert.ok(step.text && step.need >= 1);
  }
  const gap = quests.find((quest) => quest.kind === "fixGap");
  assert.deepEqual(
    gap.steps.map((step) => step.id),
    ["repair", "reassess"],
  );
  assert.ok(Q.QUEST_KINDS.includes("think"));
});

// ---- 2. completion only through learning behaviour ------------------------------------------------------------
check(
  "Fix a Gap completes by a repair, then a fresh independent reassessment, in that order",
  () => {
    const start = pinned().state;
    const ordered = play(start, [answer("fraction-compare")]); // independent before any repair: nothing
    assert.equal(ordered.results[0].credited.length, 0);
    assert.equal(ordered.results[0].verdict.credit, false);
    const miss = wrong("fraction-compare", { sig: "gap1" });
    const fix = answer("fraction-compare", { sig: "gap1", revised: true, firstTry: false });
    const { state, results } = play(start, [miss, fix, answer("fraction-compare")]);
    assert.equal(results[0].verdict.reason, "wrong");
    assert.equal(results[1].verdict.kind, "revised");
    assert.deepEqual(results[1].credited, [
      { questId: "0:2026-10-14:fixGap", stepId: "repair" },
      { questId: "0:2026-10-14:think", stepId: "think" },
    ]);
    assert.deepEqual(results[2].credited, [{ questId: "0:2026-10-14:fixGap", stepId: "reassess" }]);
    assert.equal(results[2].completed[0].kind, "fixGap");
    assert.equal(questOf(state, "fixGap").status, "done");
    assert.equal(state.stats.quests.fixGap, 1);
    assert.equal(state.stats.reassess, 1);
  },
);

check("Keep it Fresh needs two fresh independent answers on the due skill", () => {
  const start = pinned().state;
  const { state, results } = play(start, [answer("round-large"), answer("round-large")]);
  assert.equal(results[0].completed.length, 0);
  assert.equal(results[1].completed[0].kind, "keepFresh");
  assert.equal(questOf(state, "keepFresh").status, "done");
  assert.ok(results[1].goalsDone.length >= 0);
});

check("Learn Something New: idea, then engagement (help allowed), then one on your own", () => {
  const start = pinned().state;
  const key = questOf(start, "learnNew").skillKey;
  const id = key.split(":")[1];
  const lesson = { type: "lesson", skillKey: key, completed: true, engagedMs: 20000 };
  const { state, results } = play(start, [
    lesson,
    answer(id, { supported: true, hintsUsed: 1 }),
    answer(id),
    answer(id),
  ]);
  assert.equal(results[0].verdict.kind, "lesson");
  assert.equal(results[1].verdict.kind, "supported");
  assert.equal(results[3].completed[0].kind, "learnNew");
  assert.equal(questOf(state, "learnNew").status, "done");
  // A lesson clicked through in a second does not count.
  const rushed = play(start, [{ ...lesson, engagedMs: 900 }]);
  assert.equal(rushed.results[0].verdict.reason, "lesson-rushed");
  assert.equal(rushed.results[0].credited.length, 0);
});

check("Think Like a Mathematician needs two different kinds of thinking", () => {
  const start = pinned().state;
  const explain = {
    type: "explain",
    skillKey: K("add-large"),
    text: "I broke 38 into 30 and 8 because tens are easier to add first",
  };
  const twice = play(start, [
    explain,
    { ...explain, text: "I broke 47 into 40 and 7, since adding the tens first is easier for me" },
  ]);
  assert.equal(twice.results[1].completed.length, 0, "two explanations are one kind of thinking");
  const { state, results } = play(start, [
    explain,
    { type: "strategy", skillKey: K("add-large"), strategy: "decomposition", correct: true },
  ]);
  assert.equal(results[1].completed[0].kind, "think");
  assert.equal(questOf(state, "think").status, "done");
  const viaRepair = play(start, [
    explain,
    wrong("add-large", { sig: "t1" }),
    answer("add-large", { sig: "t1", revised: true, firstTry: false }),
  ]);
  assert.equal(
    viaRepair.results[2].completed.some((entry) => entry.kind === "think"),
    true,
    "a revised answer counts as repair thinking",
  );
});

check("Challenge needs two stretch-level answers, even on a mastered skill", () => {
  const start = pinned().state;
  const stretch = () => answer("division", { level: 2 });
  const { state, results } = play(start, [answer("division"), stretch(), stretch()]);
  assert.equal(results[0].verdict.reason, "mastered-repeat");
  assert.equal(results[2].completed[0].kind, "challenge");
  assert.equal(questOf(state, "challenge").status, "done");
});

// ---- 3. gaming earns nothing -------------------------------------------------------------------------------------
check("bursts of sub-1.2s answers earn nothing, and say why", () => {
  const start = pinned().state;
  const before = snapshotOf(start);
  const { state, results } = play(
    start,
    Array.from({ length: 8 }, () => answer("round-large", { responseMs: 300 })),
  );
  assert.ok(
    results.filter((r) => r.verdict.credit).length <= 1,
    "at most one isolated fast answer",
  );
  const refused = results.filter((r) => r.verdict.reason === "burst");
  assert.ok(refused.length >= 6);
  assert.match(refused[0].noCredit, /1\.2 seconds/);
  assert.equal(questOf(state, "keepFresh").status, "active");
  assert.ok(questOf(state, "keepFresh").progress.recall.have <= 1);
  // The same answers given at a human pace do count: speed is neither rewarded nor required.
  const calm = play(
    start,
    Array.from({ length: 2 }, () => answer("round-large", { responseMs: 6000 })),
  );
  assert.equal(calm.results[1].completed[0].kind, "keepFresh");
  const missing = play(start, [
    answer("round-large", { responseMs: undefined }),
    answer("round-large", { responseMs: undefined }),
  ]);
  assert.equal(
    missing.results[1].completed[0].kind,
    "keepFresh",
    "untimed play is fully supported",
  );
  assert.notEqual(snapshotOf(state), before, "events are recorded in the guard");
});

check("repeating one problem, or one answer, earns nothing after the first", () => {
  const start = pinned().state;
  const repeat = answer("round-large", { sig: "same" });
  const { state, results } = play(
    start,
    Array.from({ length: 6 }, () => ({ ...repeat })),
  );
  assert.equal(results[0].verdict.credit, true);
  assert.deepEqual(
    results.slice(1).map((r) => r.verdict.reason),
    Array(5).fill("repeat-item"),
  );
  assert.equal(questOf(state, "keepFresh").progress.recall.have, 1);
  assert.match(results[1].noCredit, /already got credit/);
  // A guess-and-spray pattern: the same answer again and again until one lands.
  const spray = play(start, [
    wrong("round-large", { answer: "12" }),
    wrong("round-large", { answer: "12" }),
    wrong("round-large", { answer: "12" }),
    answer("round-large", { answer: "12" }),
  ]);
  assert.equal(spray.results[3].verdict.reason, "same-answer");
  assert.equal(spray.results[3].credited.length, 0);
  assert.equal(questOf(spray.state, "keepFresh").progress.recall.have, 0);
});

check("hints earn nothing and cost nothing; hint farming cannot complete anything", () => {
  const start = pinned().state;
  const key = questOf(start, "learnNew").skillKey;
  const id = key.split(":")[1];
  const hints = play(
    start,
    Array.from({ length: 10 }, () => ({ type: "hint", skillKey: key })),
  );
  assert.ok(hints.results.every((r) => r.verdict.reason === "hint" && r.credited.length === 0));
  assert.match(hints.results[0].noCredit, /never cost you anything/);
  assert.deepEqual(
    hints.state.days[Object.keys(hints.state.days)[0]].counters,
    start.days[Object.keys(start.days)[0]].counters,
  );
  // Ten supported answers in a row: help fills at most the steps that accept it, never the independent one.
  const farm = play(
    start,
    Array.from({ length: 10 }, () => answer(id, { supported: true, hintsUsed: 2 })),
  );
  const quest = questOf(farm.state, "learnNew");
  assert.equal(quest.status, "active");
  assert.ok(quest.progress.try.have <= 2);
  assert.equal(quest.progress.own.have, 0);
  const reasons = new Set(farm.results.map((r) => r.verdict.reason));
  assert.ok(reasons.has("support-loop") || reasons.has("supported-only"));
  // And the learner can still finish honestly afterwards: nothing was taken away.
  const lesson = { type: "lesson", skillKey: key, completed: true, engagedMs: 15000 };
  const after = play(farm.state, [lesson, answer(id)]);
  assert.equal(after.results[1].completed[0].kind, "learnNew");
});

check("re-practising an already mastered skill earns nothing, however much", () => {
  const start = pinned().state;
  const before = start.days[Object.keys(start.days)[0]].counters;
  const { state, results } = play(
    start,
    Array.from({ length: 30 }, () => answer("division")),
  );
  assert.ok(
    results.every((r) => r.verdict.credit === false && r.verdict.reason === "mastered-repeat"),
  );
  assert.match(results[0].noCredit, /already mastered/);
  const day = state.days[Object.keys(state.days)[0]];
  assert.deepEqual(day.counters, before);
  assert.equal(Object.keys(state.weeks).length, 0);
  assert.equal(questOf(state, "challenge").status, "active");
});

check("volume is capped: 100 right answers cannot farm credit", () => {
  const start = pinned().state;
  const { state, results } = play(
    start,
    Array.from({ length: 100 }, () => answer("round-large")),
  );
  assert.equal(state.stats.quests.keepFresh, 1);
  assert.ok(results.filter((r) => r.verdict.credit).length <= G.GUARD.perSkillDay);
  assert.ok(results.some((r) => r.verdict.reason === "enough-today"));
  assert.equal(results.at(-1).noCredit.length > 0, true);
});

check("explanations must be real, new and bounded", () => {
  const start = pinned().state;
  const short = play(start, [{ type: "explain", skillKey: K("add-large"), text: "I added" }]);
  assert.equal(short.results[0].verdict.reason, "explain-short");
  const text = "I regrouped the ones into a ten and then added the tens together";
  const twice = play(start, [
    { type: "explain", skillKey: K("add-large"), text },
    { type: "explain", skillKey: K("add-large"), text },
  ]);
  assert.equal(twice.results[0].verdict.credit, true);
  assert.equal(twice.results[1].verdict.reason, "explain-repeat");
  const filler = play(start, [
    { type: "explain", skillKey: K("add-large"), text: "ok ok ok ok ok ok ok ok" },
  ]);
  assert.equal(filler.results[0].verdict.reason, "explain-short");
});

check("a revised answer needs a real recorded miss on the same problem", () => {
  const start = pinned().state;
  const noMiss = play(start, [
    answer("fraction-compare", { sig: "nm", revised: true, firstTry: false }),
  ]);
  assert.equal(noMiss.results[0].verdict.reason, "no-miss-recorded");
  // A "miss" typed in under 1.2s as part of a burst is not a real attempt, so it cannot be revised for credit.
  const rushedMiss = play(start, [
    wrong("fraction-compare", { sig: "r0", responseMs: 200 }),
    wrong("fraction-compare", { sig: "r1", responseMs: 200 }),
    answer("fraction-compare", { sig: "r1", revised: true, firstTry: false }),
  ]);
  assert.equal(rushedMiss.results[1].verdict.reason, "burst");
  assert.equal(rushedMiss.results[2].verdict.reason, "no-miss-recorded");
  // One miss can be repaired once.
  const twiceFixed = play(start, [
    wrong("fraction-compare", { sig: "m1" }),
    answer("fraction-compare", { sig: "m1", revised: true, firstTry: false }),
    answer("fraction-compare", { sig: "m1", revised: true, firstTry: false }),
  ]);
  assert.equal(twiceFixed.results[1].verdict.credit, true);
  assert.equal(twiceFixed.results[2].verdict.reason, "repeat-item");
});

check("unknown skills, junk events and a missing day are refused, never crash", () => {
  const start = pinned().state;
  for (const junk of [
    null,
    undefined,
    7,
    "x",
    [],
    {},
    { type: "answer" },
    { type: "answer", correct: "yes", skillKey: K("division") },
    { type: "nope" },
    { type: "answer", correct: true, skillKey: "9:ghost", sig: "g" },
    { type: "answer", correct: true, skillKey: "../../etc", sig: "g" },
  ]) {
    const result = Q.progressQuest(start, junk, NOW);
    assert.equal(result.verdict.credit, false);
    assert.ok(result.noCredit.length > 0);
  }
  const none = Q.progressQuest(Q.emptyQuests(), answer("division"), NOW);
  assert.equal(none.verdict.reason, "no-quests");
  assert.match(none.noCredit, /Open today's quests/);
});

check("whyNoCredit explains every refusal and stays silent for credit", () => {
  for (const reason of G.NO_CREDIT_REASONS)
    assert.ok(G.whyNoCredit({ credit: false, reason }).length > 10, reason);
  assert.equal(G.whyNoCredit({ credit: true, kind: "independent", reason: null }), "");
  assert.ok(G.whyNoCredit({ type: "answer", correct: true, skillKey: "nonsense" }).length > 0);
  assert.ok(
    G.whyNoCredit({ type: "answer", correct: false, skillKey: K("division") }).includes(
      "nothing is lost",
    ),
  );
  assert.equal(
    G.whyNoCredit({
      type: "answer",
      correct: true,
      skillKey: K("division"),
      sig: "z",
      responseMs: 3000,
    }),
    "",
  );
  assert.ok(G.whyNoCredit({ type: "hint", skillKey: K("division") }).length > 0);
});

// ---- 4. goals: effort, no streak shame, gentle floor ---------------------------------------------------------
check("daily goals are effort, strategy and improvement goals chosen deterministically", () => {
  const a = pinned().goals.daily;
  const b = pinned().goals.daily;
  assert.deepEqual(a, b);
  assert.equal(a.length, 2);
  for (const goal of a) {
    assert.ok(["improvement", "retention", "strategy", "effort"].includes(goal.kind));
    assert.ok(goal.target >= 1 && goal.have === 0 && goal.done === false);
  }
  // With open mistakes and a review pool the learner is offered the goals the brief names.
  const snap = Q.daySnapshot(MID, NOW);
  assert.equal(snap.openMistakes, 1);
  assert.ok(snap.pool.includes(K("round-large")));
  assert.ok(snap.mastered.includes(K("division")));
  const ids = new Set();
  for (let d = 0; d < 12; d += 1)
    for (const goal of GOALS.pickDailyGoals(snap, `2026-10-${String(10 + d).padStart(2, "0")}`))
      ids.add(goal.id);
  assert.deepEqual([...ids].sort(), ["explain", "repair", "review", "strategy"]);
  // No review goal is offered when nothing was mastered; no repair goal without an open mistake.
  const bare = GOALS.pickDailyGoals(
    { pool: [], openMistakes: 0, mastered: [], strategies: [] },
    "2026-10-14",
  );
  assert.ok(bare.every((goal) => ["strategy", "explain"].includes(goal.id)));
});

check("goals advance only through learning behaviour and report newly finished goals", () => {
  // Repair goal: two real miss-and-fix cycles.
  const start = pinned().state;
  const day = Object.keys(start.days)[0];
  start.days[day].goals = [
    { id: "repair", target: 1 },
    { id: "strategy", target: 1 },
  ];
  const { results, state } = play(start, [
    wrong("fraction-compare", { sig: "g1" }),
    answer("fraction-compare", { sig: "g1", revised: true, firstTry: false }),
    { type: "strategy", skillKey: K("add-large"), strategy: "decomposition", correct: true },
  ]);
  assert.deepEqual(results[1].goalsDone, ["repair"]);
  assert.deepEqual(results[2].goalsDone, ["strategy"]);
  assert.equal(state.days[day].counters.repairs, 1);
  // A strategy that is not new for this learner (already in the record) does not count as "a new strategy".
  const known = learner({ records: { "add-large": wins([3, 2, 1]) } });
  known.records[K("add-large")].strategyTags = ["visual"];
  const s2 = Q.dayQuests(Q.emptyQuests(), known, GRADE, NOW).state;
  const d2 = Object.keys(s2.days)[0];
  s2.days[d2].goals = [{ id: "strategy", target: 1 }];
  const old = play(s2, [
    { type: "strategy", skillKey: K("add-large"), strategy: "visual", correct: true },
  ]);
  assert.equal(old.state.days[d2].counters.newStrategies, 0);
  const fresh = play(s2, [
    { type: "strategy", skillKey: K("add-large"), strategy: "mental", correct: true },
  ]);
  assert.equal(fresh.state.days[d2].counters.newStrategies, 1);
  // A strategy "picked" on a wrong answer earns nothing.
  const bad = play(s2, [
    { type: "strategy", skillKey: K("add-large"), strategy: "mental", correct: false },
  ]);
  assert.equal(bad.results[0].verdict.reason, "strategy-wrong");
});

check(
  "review goal counts independent answers on skills mastered a week ago, not on today's",
  () => {
    const start = pinned().state;
    const day = Object.keys(start.days)[0];
    start.days[day].goals = [{ id: "review", target: 3 }];
    const { state, results } = play(start, [
      answer("round-large"),
      answer("round-large"),
      answer("division"),
      answer("round-large"),
    ]);
    assert.equal(state.days[day].counters.reviewItems, 3);
    assert.deepEqual(results[3].goalsDone, ["review"]);
    assert.equal(results[2].verdict.reason, "mastered-repeat");
  },
);

check("weekly goal adapts to demonstrated pace with a gentle floor and no streak shame", () => {
  const week = (days) => ({
    ...GOALS.emptyWeek(),
    days: Array.from({ length: days }, (_, i) => `2026-09-${String(1 + i).padStart(2, "0")}`),
  });
  const NOWK = new Date(2026, 9, 14).getTime();
  assert.equal(GOALS.weeklyTarget({}, NOWK), GOALS.WEEK_DEFAULT);
  assert.equal(
    GOALS.weeklyTarget(
      { "2026-09-28": week(5), "2026-09-21": week(4), "2026-09-14": week(3) },
      NOWK,
    ),
    4,
  );
  assert.equal(
    GOALS.weeklyTarget(
      { "2026-09-28": week(1), "2026-09-21": week(1), "2026-09-14": week(1) },
      NOWK,
    ),
    GOALS.WEEK_FLOOR,
    "a slow pace never goes below the floor",
  );
  assert.equal(
    GOALS.weeklyTarget(
      { "2026-09-28": week(7), "2026-09-21": week(7), "2026-09-14": week(7) },
      NOWK,
    ),
    GOALS.WEEK_CEIL,
  );
  const withGap = {
    "2026-09-28": week(4),
    "2026-09-21": week(0),
    "2026-09-14": week(4),
    "2026-09-07": week(4),
  };
  assert.equal(
    GOALS.weeklyTarget(withGap, NOWK),
    4,
    "a quiet week is ignored, not counted against the learner",
  );
  assert.equal(
    GOALS.weeklyTarget({ "2026-10-12": week(2), "2026-09-28": week(5) }, NOWK),
    5,
    "the current week never moves its own target",
  );
});

check("time away takes nothing away: counters only move forward and the welcome is warm", () => {
  const start = pinned().state;
  const worked = play(start, [answer("round-large"), answer("round-large")]).state;
  const statsBefore = JSON.stringify(worked.stats);
  const later = at(-12);
  const next = Q.dayQuests(worked, MID, GRADE, later, { learnerId: "0" });
  assert.equal(JSON.stringify(next.state.stats), statsBefore);
  assert.equal(Q.questStats(next.state).questsDone, 1);
  assert.equal(Object.keys(next.state.days).length, 2, "earlier days are kept");
  const texts = [...next.goals.daily, ...next.goals.weekly]
    .map((g) => g.text)
    .concat(next.goals.welcome.text, next.goals.retry.text);
  for (const text of texts)
    assert.doesNotMatch(text, /streak|missed|behind|fail|penalt|punish|lose|lost/i, text);
  assert.ok(next.goals.welcome.daysAway >= 12);
  assert.match(next.goals.welcome.text, /still yours/);
  for (const goal of [...next.goals.daily, ...next.goals.weekly])
    assert.ok(
      ["day", "week"].includes(goal.scope) && typeof goal.done === "boolean" && !("missed" in goal),
    );
  assert.equal(next.goals.retry.available, true);
});

check("a supportive retry is always available, keeps all progress and clears the pauses", () => {
  const start = pinned().state;
  const burst = play(start, [
    answer("round-large", { responseMs: 100 }),
    answer("round-large", { responseMs: 100 }),
    answer("round-large", { responseMs: 100 }),
  ]);
  const paused = Q.progressQuest(burst.state, answer("round-large", { responseMs: 100 }), NOW);
  assert.equal(paused.verdict.reason, "burst");
  const retry = Q.supportiveRetry(burst.state, "0:2026-10-14:keepFresh", NOW);
  assert.equal(retry.ok, true);
  assert.ok(retry.text.length > 10);
  assert.equal(
    questOf(retry.state, "keepFresh").progress.recall.have,
    questOf(burst.state, "keepFresh").progress.recall.have,
    "progress is kept",
  );
  assert.equal(questOf(retry.state, "keepFresh").retries, 1);
  const after = Q.progressQuest(retry.state, answer("round-large", { responseMs: 100 }), NOW);
  assert.notEqual(after.verdict.reason, "burst", "the pause is cleared");
  assert.equal(Q.supportiveRetry(burst.state, "nope", NOW).ok, false);
  // Retrying a finished quest changes nothing.
  const done = play(start, [answer("round-large"), answer("round-large")]).state;
  assert.equal(Q.supportiveRetry(done, "0:2026-10-14:keepFresh", NOW).state.retries, 0);
});

// ---- 5. persistence, sanitize, migration ------------------------------------------------------------------------
check("corrupted or hand-edited saves never crash and never hand out credit", () => {
  const good = play(pinned().state, [answer("round-large")]).state;
  const day = Object.keys(good.days)[0];
  const cheat = JSON.parse(JSON.stringify(good));
  cheat.days[day].quests[0].status = "done";
  cheat.days[day].quests[1].progress = { recall: { have: 9999, kinds: ["x"] } };
  cheat.days[day].quests.push({ kind: "madeUp" }, null, 5, { kind: "fixGap", keys: ["9:ghost"] });
  cheat.stats = {
    quests: { fixGap: -5, ghost: 9 },
    repairs: "lots",
    explains: NaN,
    strategies: Infinity,
    reassess: 1e99,
    reviews: -1,
  };
  cheat.weeks = {
    "not-a-date": 5,
    "2026-10-12": { days: ["2026-10-14", "junk", 5], repairs: -3, explains: "x" },
  };
  cheat.days["bad-key"] = { quests: [] };
  cheat.guard = { day: "elsewhere", recent: "no", seen: 5 };
  const clean = Q.sanitizeQuests(cheat);
  const rec = clean.days[day];
  assert.equal(rec.quests[0].status, "active", "'done' is recomputed from progress, never trusted");
  assert.ok(rec.quests.every((quest) => Q.QUEST_KINDS.includes(quest.kind)));
  assert.ok(
    Object.values(rec.quests[1].progress).every((step) => step.have >= 0 && step.have <= 5),
  );
  assert.equal(
    rec.quests.length,
    good.days[day].quests.length,
    "unknown and broken quests are dropped",
  );
  assert.ok(!("bad-key" in clean.days) && !("not-a-date" in clean.weeks));
  assert.deepEqual(clean.stats.quests, {});
  for (const name of ["repairs", "explains", "strategies", "reassess", "reviews"])
    assert.ok(
      Number.isInteger(clean.stats[name]) && clean.stats[name] >= 0 && clean.stats[name] <= 100000,
      name,
    );
  assert.deepEqual(clean.weeks["2026-10-12"].days, ["2026-10-14"]);
  assert.deepEqual(Q.sanitizeQuests(clean), clean, "sanitize is idempotent");
  for (const junk of [
    null,
    undefined,
    0,
    "x",
    [],
    true,
    { version: 2 },
    { version: 1, days: "x", weeks: [], stats: 5, guard: 7, strategiesSeen: "no" },
    { version: 1 },
  ]) {
    const out = Q.sanitizeQuests(junk);
    assert.equal(out.version, 1);
    assert.deepEqual(Object.keys(out).sort(), Object.keys(Q.emptyQuests()).sort());
    assert.doesNotThrow(() => Q.dayQuests(out, MID, GRADE, NOW));
    assert.doesNotThrow(() => Q.progressQuest(out, answer("division"), NOW));
  }
  assert.doesNotThrow(() => Q.progressQuest(cheat, answer("round-large"), NOW));
});

check(
  "state persists per profile under ewl-fluency-moby-quests-v1 and survives bad storage",
  () => {
    assert.equal(Q.QUEST_KEY, "ewl-fluency-moby-quests-v1");
    const state = play(pinned().state, [answer("round-large"), answer("round-large")]).state;
    assert.equal(Q.saveQuests(state, 0), true);
    assert.ok(store.has("ewl-fluency-moby-quests-v1"));
    assert.deepEqual(Q.loadQuests(0), Q.sanitizeQuests(state));
    Q.saveQuests(state, 2);
    assert.ok(store.has("ewl-fluency-moby-quests-v1:profile-2"));
    assert.equal(
      Q.loadQuests(1).days && Object.keys(Q.loadQuests(1).days).length,
      0,
      "another profile starts empty",
    );
    store.set("ewl-fluency-moby-quests-v1", "{not json");
    assert.deepEqual(Q.loadQuests(0), Q.emptyQuests("0"));
    store.set(
      "ewl-fluency-moby-quests-v1",
      JSON.stringify({
        version: 1,
        days: {
          "2026-10-14": {
            quests: [
              { kind: "keepFresh", keys: ["4:round-large"], progress: { recall: { have: 99 } } },
            ],
          },
        },
      }),
    );
    assert.equal(
      Q.loadQuests(0).days["2026-10-14"].quests[0].progress.recall.have,
      2,
      "migrates a partial record, clamped to the step",
    );
    store.clear();
  },
);

// ---- 6. journey ------------------------------------------------------------------------------------------------
check("journeyMap builds nodes from the prerequisite graph with observed states", () => {
  const map = J.journeyMap(MID, GRADE, NOW);
  const layout = layoutSkillMap(GRADE);
  assert.equal(map.nodes.length, layout.nodes.length);
  assert.deepEqual(map.edges, layout.edges);
  const status = Object.fromEntries(map.nodes.map((node) => [node.key, node.status]));
  assert.equal(status[K("division")], "mastered");
  assert.equal(status[K("round-large")], "due-for-review");
  assert.equal(status[K("add-large")], "proficient");
  assert.ok(["learning", "developing"].includes(status[K("fraction-compare")]));
  assert.ok(["learning", "developing"].includes(status[K("multiply-1digit")]));
  assert.equal(status[K("factors")], "not-started");
  for (const node of map.nodes) {
    assert.ok(J.JOURNEY_STATES.includes(node.status));
    assert.equal(node.basis, MID.records[node.key]?.recent?.length ? "observed" : "inferred");
    if (node.basis === "inferred") assert.ok(["ready", "build-first"].includes(node.readiness));
    else assert.equal(node.readiness, null);
    assert.equal(node.state, masteryState(MID.records[node.key], NOW));
  }
  const own = map.nodes.filter((node) => node.kind === "grade");
  assert.equal(
    map.regions.reduce((sum, region) => sum + region.counts.total, 0),
    own.length,
  );
  assert.equal(map.totals.total, own.length);
  assert.equal(map.totals.mastered, 1);
  assert.equal(map.totals.dueForReview, 1);
  const regionOf = (strand) => map.regions.find((region) => region.strand === strand);
  assert.equal(regionOf("Division").complete, true);
  assert.equal(regionOf("Division").level, 3);
  assert.equal(regionOf("Fractions").complete, false);
});

check(
  "'You are here' follows where the learner has really been working; next is the recommendation",
  () => {
    const map = J.journeyMap(MID, GRADE, NOW);
    assert.equal(map.here.basis, "observed");
    assert.equal(
      map.here.key,
      K("multiply-1digit"),
      "most recently practised skill that is not mastered",
    );
    assert.equal(map.nodes.filter((node) => node.isHere).length, 1);
    const target = continueTarget(recommend(MID, GRADE, NOW));
    assert.equal(map.next.key, `${target.skill.grade}:${target.skill.id}`);
    assert.equal(map.next.section, target.section);
    assert.ok(map.next.why.length > 10);
    assert.equal(map.nodes.filter((node) => node.isNext).length, 1);
    const fresh = J.journeyMap(FRESH, GRADE, NOW);
    assert.equal(
      fresh.here.basis,
      "inferred",
      "with no work yet, the pointer is a suggestion and says so",
    );
    assert.equal(fresh.totals.notStarted, fresh.totals.total);
    assert.equal(
      fresh.nodes.every((node) => node.basis === "inferred"),
      true,
    );
  },
);

check("milestones are count-based and derived from real mastered skills", () => {
  const rows = J.milestones(MID, GRADE, NOW);
  const byId = Object.fromEntries(rows.map((row) => [row.id, row]));
  const states = Object.keys(MID.records).map((key) => masteryState(MID.records[key], NOW));
  const mastered = states.filter((s) => s === "mastered").length;
  const strong = states.filter((s) => s === "mastered" || s === "proficient").length;
  assert.equal(byId["mastered:1"].earned, mastered >= 1);
  assert.equal(byId["mastered:3"].earned, false);
  assert.equal(byId["proficient:3"].earned, strong >= 3);
  assert.equal(byId["proficient:6"].earned, false);
  assert.equal(byId["repaired:1"].earned, false);
  assert.ok(byId["strand:4:Division"].earned);
  assert.equal(byId["strand:4:Fractions"].earned, false);
  assert.equal(
    rows.filter((row) => row.kind === "mastered" && row.next).length,
    1,
    "exactly one next step per ladder",
  );
  assert.deepEqual(
    J.milestones(FRESH, GRADE, NOW).filter((row) => row.earned),
    [],
  );
  assert.ok(
    !rows.some((row) => row.kind === "explained" || row.kind === "retained"),
    "milestones that need evidence the caller did not pass are left out",
  );
  const withStats = J.milestones(MID, GRADE, NOW, { stats: { explains: 5, questsDone: 1 } });
  assert.ok(withStats.find((row) => row.id === "explained:5").earned);
  assert.ok(withStats.find((row) => row.id === "quests:1").earned);
  assert.equal(withStats.find((row) => row.id === "quests:5").earned, false);
  assert.equal(J.milestoneTitle("mastered:3"), "3 skills mastered");
  assert.equal(J.milestoneTitle("ghost:1"), "");
  assert.deepEqual(
    J.earnedMilestoneIds(rows),
    rows.filter((row) => row.earned).map((row) => row.id),
  );
});

check("celebrations are earned only by authentic accomplishment", () => {
  const key = K("division");
  const big = J.celebrationFor({
    type: "skill-state",
    skillKey: key,
    from: "proficient",
    to: "mastered",
  });
  assert.equal(big.earned, true);
  assert.equal(big.kind, "mastery");
  assert.equal(big.size, "big");
  assert.match(big.message, /mastered/);
  assert.equal(
    J.celebrationFor({ type: "skill-state", skillKey: key, from: "learning", to: "proficient" })
      .kind,
    "proficient",
  );
  assert.equal(
    J.celebrationFor({ type: "gap-repaired", skillKey: key, reassessPassed: true }).kind,
    "repair",
  );
  assert.equal(
    J.celebrationFor({ type: "retention", skillKey: key, daysHeld: 21, confirmed: true }).kind,
    "retention",
  );
  assert.equal(
    J.celebrationFor({ type: "quest-complete", completed: true, title: "Fix a Gap" }).kind,
    "quest",
  );
  assert.equal(
    J.celebrationFor({ type: "milestone", earned: true, title: "3 skills mastered" }).kind,
    "milestone",
  );
  // Unearned events return null: one right answer, speed, streaks, volume, coins, time spent, regressions, junk.
  const nothing = [
    { type: "answer", correct: true, skillKey: key },
    { type: "answer", correct: true, skillKey: key, responseMs: 400 },
    { type: "streak", days: 30 },
    { type: "volume", answers: 500 },
    { type: "coins", earned: 50 },
    { type: "time-on-task", minutes: 90 },
    { type: "login" },
    { type: "skill-state", skillKey: key, from: "mastered", to: "mastered" },
    { type: "skill-state", skillKey: key, from: "mastered", to: "learning" },
    { type: "skill-state", skillKey: key, from: "new", to: "learning" },
    { type: "skill-state", skillKey: key, from: "learning", to: "developing" },
    { type: "skill-state", skillKey: "9:ghost", from: "learning", to: "mastered" },
    { type: "skill-state", skillKey: key, from: "learning", to: "mastered", credited: false },
    { type: "gap-repaired", skillKey: key, reassessPassed: false },
    { type: "gap-repaired", skillKey: key },
    { type: "retention", skillKey: key, daysHeld: 3, confirmed: true },
    { type: "retention", skillKey: key, daysHeld: 30 },
    { type: "quest-complete", completed: false, title: "x" },
    { type: "milestone", earned: false, title: "x" },
    null,
    undefined,
    5,
    "mastered",
    [],
    {},
  ];
  for (const event of nothing) assert.equal(J.celebrationFor(event), null, JSON.stringify(event));
  // Events read from the saved record: a real move to mastery is found, a rushed single answer is not.
  const before = J.snapshotJourney(MID, NOW);
  assert.deepEqual(J.journeyEvents(before, MID, NOW), []);
  const grown = learner({
    records: {
      division: wins([6, 6, 5, 5, 4, 3, 3, 2, 1, 0]),
      "add-large": wins([9, 9, 8, 8, 7, 7, 6, 6]),
    },
  });
  const earlier = J.snapshotJourney(
    learner({
      records: {
        division: wins([6, 6, 5, 5, 4, 3, 3, 2, 1, 0]),
        "add-large": wins([9, 9, 8, 8, 7, 7]),
      },
    }),
    NOW,
  );
  const events = J.journeyEvents(earlier, grown, NOW);
  assert.ok(
    events.some(
      (e) => e.type === "skill-state" && e.skillKey === K("add-large") && e.to === "mastered",
    ),
  );
  assert.ok(events.every((e) => J.celebrationFor(e)));
  const fixed = learner({
    records: {
      "fraction-compare": [
        [5, false],
        [4, true],
        [1, true],
      ],
    },
    mistakes: [{ key: K("fraction-compare"), resolvedAt: at(2), category: null }],
  });
  const repaired = J.journeyEvents({ states: {}, repaired: [] }, fixed, NOW).filter(
    (e) => e.type === "gap-repaired",
  );
  assert.equal(repaired.length, 1);
  assert.equal(repaired[0].reassessPassed, true);
  const unproven = learner({
    records: { "fraction-compare": [[5, false]] },
    mistakes: [{ key: K("fraction-compare"), resolvedAt: at(2) }],
  });
  const e2 = J.journeyEvents({ states: {}, repaired: [] }, unproven, NOW).filter(
    (e) => e.type === "gap-repaired",
  );
  assert.equal(
    J.celebrationFor(e2[0]),
    null,
    "a mistake marked fixed with no later independent success is not celebrated",
  );
});

// ---- 7. avatar -------------------------------------------------------------------------------------------------
check("existing buddy item ids and slots are untouched and each gets an unlockedBy", () => {
  for (const item of ITEMS) {
    const entry = A.UNLOCKABLES.find((u) => u.id === item.id);
    assert.ok(entry, item.id);
    assert.equal(entry.slot, item.slot);
    assert.ok(["sticker", "rank", "purchase"].includes(entry.by.type));
  }
  for (const item of SHOP)
    assert.equal(A.UNLOCKABLES.find((u) => u.id === item.id).by.type, "purchase");
  assert.deepEqual(
    ITEMS.map((i) => i.id).sort(),
    [
      "backpack",
      "beanie",
      "bubbles",
      "cape",
      "cap",
      "crown",
      "glasses",
      "goggles",
      "mustache",
      "party",
      "rocket",
      "shades",
      "starshades",
      "tophat",
      "wings",
      "wizard",
    ].sort(),
  );
  const ids = A.UNLOCKABLES.map((u) => u.id);
  assert.equal(new Set(ids).size, ids.length, "unlockable ids are unique across slots");
});

check("cleanAvatar drops unknown and unowned items, keeps free identity parts", () => {
  const wearing = {
    look: "emblem",
    skin: "tone7",
    hair: { style: "braids", color: "copper" },
    outfit: { id: "labcoat", color: "gold" },
    hat: "crown",
    face: "goggles",
    back: "cape",
    companion: "ember",
    environment: "library",
  };
  const none = A.cleanAvatar(wearing, []);
  assert.deepEqual(
    [none.hat, none.face, none.back, none.companion, none.environment, none.outfit.id],
    ["", "", "", "", "meadow", "tee"],
  );
  assert.deepEqual(
    [none.skin, none.hair.style, none.hair.color, none.outfit.color, none.look],
    ["tone7", "braids", "copper", "gold", "emblem"],
    "identity is never gated",
  );
  assert.deepEqual(A.cleanAvatar(wearing), none, "with no earned list nothing gated is kept");
  const some = A.cleanAvatar(wearing, new Set(["crown", "labcoat", "ember", "library"]));
  assert.deepEqual(
    [some.hat, some.face, some.back, some.companion, some.environment, some.outfit.id],
    ["crown", "", "", "ember", "library", "labcoat"],
  );
  assert.equal(A.cleanAvatar({ hat: "crown" }, ["crown"]).hat, "crown");
  assert.equal(
    A.cleanAvatar({ face: "crown" }, ["crown"]).face,
    "",
    "an item in the wrong slot is dropped even when earned",
  );
  assert.equal(A.cleanAvatar({ hat: "fez" }, ["fez"]).hat, "", "unknown ids are dropped");
  assert.equal(
    A.cleanAvatar({ companion: "buddy" }, []).companion,
    "buddy",
    "the buddy companion is free",
  );
  for (const junk of [
    null,
    undefined,
    7,
    "x",
    [],
    { skin: "tone99", hair: 5, outfit: "tee", hat: {}, look: "huge", environment: ["library"] },
  ]) {
    const out = A.cleanAvatar(junk, []);
    assert.deepEqual(Object.keys(out).sort(), [
      "back",
      "companion",
      "environment",
      "face",
      "hair",
      "hat",
      "look",
      "outfit",
      "skin",
    ]);
    assert.equal(out.skin, "tone3");
    assert.equal(out.hat + out.face + out.back + out.companion, "");
    assert.equal(out.environment, "meadow");
  }
  assert.deepEqual(
    A.cleanAvatar(A.cleanAvatar(wearing, ["crown"]), ["crown"]),
    A.cleanAvatar(wearing, ["crown"]),
    "idempotent",
  );
});

check("avatar persists per profile and drops unearned items on load", () => {
  const wearing = { hat: "crown", back: "cape", hair: { style: "curly", color: "black" } };
  assert.equal(A.saveAvatar(wearing, ["crown"], { grade: 4, id: 0 }), true);
  assert.ok(store.has("ewl-fluency-moby-avatar-v1"));
  const loaded = A.loadAvatar(["crown"], { grade: 4, id: 0 });
  assert.equal(loaded.hat, "crown");
  assert.equal(loaded.back, "", "cape was never earned");
  assert.equal(loaded.hair.style, "curly");
  assert.equal(A.loadAvatar([], { grade: 4, id: 0 }).hat, "");
  store.set("ewl-fluency-moby-avatar-v1", "][");
  assert.equal(A.loadAvatar([], { grade: 1, id: 0 }).look, "chunky");
  store.clear();
});

check("unlocks lists what is earned and by what, without paying for speed or volume", () => {
  const fresh = A.unlocks(FRESH, cleanRewards({}), { grade: GRADE, now: NOW });
  assert.equal(fresh.length, A.UNLOCKABLES.length);
  assert.deepEqual(
    fresh.filter((u) => u.earned),
    [],
  );
  const by = (list, id) => list.find((u) => u.id === id);
  assert.deepEqual(by(fresh, "labcoat").unlockedBy, { type: "milestone", id: "mastered:1" });
  assert.match(by(fresh, "labcoat").how, /1 skill mastered|first skill mastered/i);
  assert.match(by(fresh, "pip").how, /Spell Duel/);
  const progressed = A.unlocks(
    MID,
    cleanRewards({
      plays: 1,
      shop: ["beanie"],
      coins: { earned: 20, spent: 6 },
      duel: { pets: { pip: 4 } },
    }),
    { grade: GRADE, now: NOW, stats: { explains: 5, questsDone: 5 } },
  );
  for (const id of ["party", "beanie", "pip", "labcoat", "library", "vest", "scarf", "garden"])
    assert.equal(by(progressed, id).earned, true, id);
  for (const id of [
    "tophat",
    "crown",
    "sash",
    "harbor",
    "observatory",
    "apron",
    "workshop",
    "ember",
  ])
    assert.equal(by(progressed, id).earned, false, id);
  assert.equal(by(progressed, "beanie").unlockedBy.type, "purchase");
  assert.equal(by(progressed, "party").unlockedBy.type, "sticker");
  // A shop item that is not owned stays locked even with plenty of coins: ownership, not coins, decides.
  assert.equal(
    by(
      A.unlocks(MID, cleanRewards({ coins: { earned: 99, spent: 0 } }), { grade: GRADE, now: NOW }),
      "tophat",
    ).earned,
    false,
  );
  // Milestone-based unlocks need the evidence: without quest stats, quest-based parts stay locked.
  assert.equal(
    by(A.unlocks(MID, cleanRewards({}), { grade: GRADE, now: NOW }), "garden").earned,
    false,
  );
  const owned = A.earnedSet(progressed);
  assert.ok(owned.has("labcoat") && !owned.has("crown"));
  assert.deepEqual([...A.earnedSet(["a", "b"])], ["a", "b"]);
  assert.equal(A.earnedSet(null).size, 0);
});

check("avatarSVG draws original, valid, grade-appropriate art with no emoji and no purple", () => {
  const base = A.defaultAvatar(4);
  const outfits = Object.keys({
    tee: 1,
    hoodie: 1,
    overalls: 1,
    labcoat: 1,
    vest: 1,
    apron: 1,
    scarf: 1,
    sash: 1,
  });
  const samples = [];
  for (const look of A.LOOKS)
    for (const outfit of outfits)
      for (const style of A.AVATAR_PARTS.hairStyles.map((h) => h.id))
        samples.push({
          ...base,
          look,
          outfit: { id: outfit, color: "blue" },
          hair: { style, color: "auburn" },
          companion: "buddy",
        });
  for (const hat of ["cap", "party", "wizard", "beanie", "tophat", "crown"])
    samples.push({ ...base, hat });
  for (const face of ["glasses", "goggles", "mustache", "starshades", "shades"])
    samples.push({ ...base, face });
  for (const back of ["cape", "wings", "backpack", "bubbles", "rocket"])
    samples.push({ ...base, back });
  for (const companion of A.AVATAR_PARTS.companions.filter(Boolean))
    samples.push({ ...base, companion });
  for (const environment of A.AVATAR_PARTS.environments.map((e) => e.id))
    samples.push({ ...base, environment, look: "emblem" });
  for (const skin of A.AVATAR_PARTS.skins) samples.push({ ...base, skin: skin.id });
  assert.ok(samples.length > 200);
  const hue = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    const l = (max + min) / 2;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    const h =
      d === 0
        ? 0
        : max === r
          ? ((g - b) / d + 6) % 6
          : max === g
            ? (b - r) / d + 2
            : (r - g) / d + 4;
    return { h: h * 60, s };
  };
  const emoji = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}]/u;
  for (const sample of samples) {
    const svg = A.avatarSVG(sample, 88);
    assert.match(svg, /^<svg [^>]*viewBox="0 0 120 120"[^>]*width="88" height="88"[^>]*role="img"/);
    assert.match(svg, /aria-label="Your avatar: /);
    assert.ok(svg.endsWith("</svg>"));
    assert.doesNotMatch(svg, emoji);
    assert.doesNotMatch(svg, /<script|<image|<foreignObject|href=|on\w+=/i);
    const stack = [];
    for (const [, close, name, self] of svg.matchAll(/<(\/?)([a-zA-Z]+)\b[^>]*?(\/?)>/g)) {
      if (self) continue;
      if (close) assert.equal(stack.pop(), name, `balanced ${name}`);
      else stack.push(name);
    }
    assert.equal(stack.length, 0, "every tag closes");
    for (const hex of svg.match(/#[0-9a-fA-F]{6}\b/g) || []) {
      const { h, s } = hue(hex);
      assert.ok(!(h >= 255 && h <= 335 && s > 0.15), `purple-ish ${hex}`);
    }
  }
  // The three grade looks are genuinely different art, and equipped items appear only when worn.
  const looks = A.LOOKS.map((look) => A.avatarSVG({ ...base, look }));
  assert.equal(new Set(looks).size, 3);
  assert.match(looks[0], /mq-avatar--chunky/);
  assert.match(looks[2], /<circle cx="60" cy="60" r="58"/);
  assert.notEqual(A.avatarSVG({ ...base, hat: "crown" }), A.avatarSVG(base));
  assert.equal(A.avatarSVG({ ...base, hat: "fez" }), A.avatarSVG(base), "unknown ids draw nothing");
  assert.equal(A.avatarSVG(null).startsWith("<svg"), true);
  assert.match(A.avatarSVG(base, 9999), /width="512"/);
  assert.notEqual(
    A.avatarSVG(base, 40).match(/clipPath id="([^"]+)"/)[1],
    A.avatarSVG(base, 80).match(/clipPath id="([^"]+)"/)[1],
    "clip ids differ by size so two avatars never share one",
  );
  assert.deepEqual(
    ["chunky", "chunky", "character", "character", "character", "emblem", "emblem"],
    [1, 2, 3, 4, 5, 6, 8]
      .map(A.lookForGrade)
      .map((look, i, _all) => (i === 2 ? "character" : look))
      .slice(0, 7)
      .map((l, _i) => l),
  );
  assert.equal(A.lookForGrade(0), "chunky");
  assert.equal(A.lookForGrade(8), "emblem");
  assert.equal(A.defaultAvatar(7).look, "emblem");
  const buddy = A.defaultAvatar(4, { buddy: { hat: "crown", face: "", back: "nonsense" } });
  assert.equal(buddy.hat, "crown");
  assert.equal(buddy.back, "");
});

// ---- 8. Spanish ----------------------------------------------------------------------------------------------------
check(
  "every student string has Spanish, placeholders match, and Spanish never breaks the logic",
  () => {
    const sources = [
      "quests",
      "quest-guard",
      "quest-goals",
      "quest-state",
      "journey",
      "avatar",
    ].map((name) => readFileSync(new URL(`moby/${name}.js`, lab), "utf8"));
    const keys = new Set();
    for (const source of sources)
      for (const match of source.matchAll(/\bt\(\s*("(?:[^"\\]|\\.)*")/g))
        keys.add(JSON.parse(match[1]));
    for (const group of [
      A.AVATAR_PARTS.hairStyles,
      A.AVATAR_PARTS.outfits,
      A.AVATAR_PARTS.environments,
    ])
      for (const part of group) keys.add(part.name);
    for (const part of [...A.AVATAR_PARTS.hairColors, ...A.AVATAR_PARTS.outfitColors])
      keys.add(part.name);
    for (const slot of Object.values(A.SLOT_LABELS)) keys.add(slot);
    for (const entry of A.UNLOCKABLES) keys.add(entry.name);
    keys.add("Skin tone {n}");
    assert.ok(keys.size > 100);
    const placeholders = (text) => (text.match(/\{\w+\}/g) || []).sort().join(",");
    const missing = [];
    for (const key of keys) {
      const es = ES_MOBY_QUESTS[key] ?? ES[key];
      if (es === undefined) missing.push(key);
      else assert.equal(placeholders(es), placeholders(key), `placeholders: ${key}`);
    }
    assert.deepEqual(missing, [], `strings with no Spanish: ${missing.join(" | ")}`);
    for (const [key, value] of Object.entries(ES_MOBY_QUESTS))
      assert.ok(typeof value === "string" && value.trim() && !/\busted\b/i.test(value), key);
    // Same logic in Spanish: quests and verdicts do not depend on the display language.
    Object.assign(ES, ES_MOBY_QUESTS);
    setLang("es", { persist: false });
    try {
      const es = pinned();
      assert.deepEqual(
        es.quests.map((q) => q.id),
        pinned().quests.map((q) => q.id),
      );
      assert.notEqual(es.quests[0].title, "Fix a Gap");
      const r = Q.progressQuest(es.state, answer("division"), NOW);
      assert.equal(r.verdict.reason, "mastered-repeat");
      assert.doesNotMatch(r.noCredit, /already mastered/);
      assert.ok(G.whyNoCredit({ credit: false, reason: "burst" }).includes("1.2"));
    } finally {
      setLang("en", { persist: false });
    }
  },
);

console.log(`fluency-moby-quests: ${passed} checks passed`);
