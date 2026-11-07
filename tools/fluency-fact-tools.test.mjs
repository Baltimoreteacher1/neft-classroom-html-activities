// Fact-fluency tools: introduce-then-practice, automaticity without a clock, teacher fact plans.
// Expected values are written out by hand from the fixtures.
import assert from "node:assert/strict";

import { clearStore, DAY, NOW } from "./lib/teacher-4-fixtures.mjs";

const moby = "../math/fluency-lab/moby/";
const model = await import(`${moby}fact-model.js`);
const auto = await import(`${moby}fact-automaticity.js`);
const practice = await import(`${moby}fact-practice.js`);
const plan = await import(`${moby}fact-plan.js`);
const { buildFactSession, makeFactItem } = await import(`${moby}fact-session.js`);
const makeItem = (key) => makeFactItem(key, () => 0.9);
const { setLang, t } = await import("../math/fluency-lab/i18n.js");
const hasEs = (text) => {
  setLang("es", { persist: false });
  const out = t(text) !== text;
  setLang("en", { persist: false });
  return out;
};

clearStore();
const record = (store, key, entries) => {
  let next = store;
  for (const [daysAgo, correct, extra = {}] of entries)
    next = model.recordFactAttempt(
      next,
      { key, correct, firstTry: true, supported: false, ...extra },
      NOW - daysAgo * DAY,
    );
  return next;
};

// ---- #7 introduce, then practice ----
{
  const session = buildFactSession({
    store: model.emptyFacts(),
    grade: 3,
    minutes: 10,
    now: NOW,
    rng: () => 0.3,
  });
  const steps = practice.practiceSteps(session.items);
  const learnFamilies = new Set(
    session.items.filter((i) => i.phase === "learn").map((i) => model.familyOf(i.key).id),
  );
  const intros = steps.filter((s) => s.type === "intro");
  assert.equal(intros.length, learnFamilies.size, "one introduction per new fact family");
  for (const [index, step] of steps.entries()) {
    if (step.type !== "intro") continue;
    const nextStep = steps[index + 1];
    assert.equal(nextStep.type, "item");
    assert.equal(nextStep.afterIntro, true, "the fact right after its introduction is supported");
    assert.equal(model.familyOf(nextStep.item.key).id, step.family.id);
    assert.ok(step.family.equations.length >= 1);
  }
  // Later appearances of an introduced family are independent checks.
  const introducedKeys = new Set(steps.filter((s) => s.afterIntro).map((s) => s.item.key));
  const later = steps.filter(
    (s) => s.type === "item" && !s.afterIntro && introducedKeys.has(s.item.key),
  );
  assert.ok(later.length >= 1, "an introduced fact comes back as an independent check");
  assert.equal(steps.filter((s) => s.type === "item").length, session.items.length, "no item lost");

  const step = { item: { key: "mul:6:7", strategy: "break-apart" }, afterIntro: true };
  assert.deepEqual(
    practice.itemResult(step, { firstCorrect: true, how: "knew" }),
    {
      key: "mul:6:7",
      correct: true,
      firstTry: true,
      supported: true,
      mode: "untimed",
      strategy: "break-apart",
    },
    "no self-report on a supported answer",
  );
  const own = practice.itemResult(
    { ...step, afterIntro: false },
    { firstCorrect: true, how: "knew" },
  );
  assert.equal(own.how, "knew");
  assert.equal(
    practice.itemResult({ ...step, afterIntro: false }, { firstCorrect: false, how: "knew" }).how,
    undefined,
  );
  assert.equal(
    practice.itemResult({ ...step, afterIntro: false }, { firstCorrect: true, how: "fast" }).how,
    undefined,
    "unknown taps are dropped",
  );
}

// ---- #6 automaticity without a clock ----
{
  const key = "mul:6:7";
  assert.equal(auto.automaticity(undefined, NOW), "not-yet");
  // Secure (4 right on 2 days) with no taps: strategy, never assumed automatic.
  let store = record(model.emptyFacts(), key, [
    [3, true],
    [3, true],
    [1, true],
    [1, true],
  ]);
  assert.equal(model.factStatus(store.facts[key], NOW), "secure");
  assert.equal(auto.automaticity(store.facts[key], NOW), "strategy");
  // "I just knew it" on two different days, most recently too: automatic.
  store = record(model.emptyFacts(), key, [
    [3, true, { how: "knew" }],
    [3, true],
    [1, true],
    [1, true, { how: "knew" }],
  ]);
  assert.equal(auto.automaticity(store.facts[key], NOW), "automatic");
  // Knew on only one day: still strategy.
  store = record(model.emptyFacts(), key, [
    [3, true],
    [3, true],
    [1, true, { how: "knew" }],
    [1, true, { how: "knew" }],
  ]);
  assert.equal(auto.automaticity(store.facts[key], NOW), "strategy");
  // Latest tap "counted" wins, even when secure.
  store = record(model.emptyFacts(), key, [
    [3, true, { how: "knew" }],
    [3, true],
    [1, true, { how: "knew" }],
    [0, true, { how: "counted" }],
  ]);
  assert.equal(auto.automaticity(store.facts[key], NOW), "counting");
  // Counting before secure.
  store = record(model.emptyFacts(), key, [[0, true, { how: "counted" }]]);
  assert.equal(auto.automaticity(store.facts[key], NOW), "counting");
  // A tap on a supported or wrong answer is not stored.
  store = record(model.emptyFacts(), key, [
    [0, false, { how: "knew" }],
    [0, true, { supported: true, how: "knew" }],
  ]);
  assert.ok(store.facts[key].recent.every((entry) => !entry.how));
  // Taps survive the sanitizer (backup round trip); junk is dropped.
  const raw = JSON.parse(
    JSON.stringify(record(model.emptyFacts(), key, [[1, true, { how: "knew" }]])),
  );
  raw.facts[key].recent.push({ ...raw.facts[key].recent[0], how: "magic" });
  const clean = model.sanitizeFacts(raw);
  assert.deepEqual(
    clean.facts[key].recent.map((e) => e.how ?? null),
    ["knew", null],
  );
  // No timing is ever read: identical records with and without ms give the same status.
  const timed = record(model.emptyFacts(), key, [
    [3, true, { how: "knew", mode: "timed", ms: 9000 }],
    [3, true],
    [1, true],
    [1, true, { how: "knew" }],
  ]);
  assert.equal(auto.automaticity(timed.facts[key], NOW), "automatic");
  const counts = auto.automaticityCounts(timed, [key, "mul:2:3"], NOW);
  assert.deepEqual(counts.counts, { automatic: 1, strategy: 0, counting: 0, "not-yet": 1 });
  for (const rule of auto.autoRules()) {
    assert.ok(!/\{\w+\}/.test(rule.text), "rules are filled");
    assert.ok(hasEs(rule.template) && hasEs(rule.label), `Spanish for ${rule.id}`);
  }
  for (const label of Object.values(auto.HOW_LABELS)) assert.ok(hasEs(label), label);
}

// ---- #14 per-student fact plans ----
{
  assert.equal(plan.encodeFactPlan({ ops: ["mul", "div"], count: 15 }), "fp1.md.15");
  assert.deepEqual(plan.decodeFactPlan("fp1.md.15"), { ops: ["mul", "div"], count: 15 });
  assert.deepEqual(plan.decodeFactPlan("fp1.x.20"), { ops: [], count: 20 });
  assert.deepEqual(plan.decodeFactPlan("fp1.dm.0"), { ops: ["mul", "div"], count: null });
  for (const bad of ["fp1.q.10", "fp2.m.10", "fp1.m.17", "fp1.x.0", "", "fp1.m"])
    assert.equal(plan.decodeFactPlan(bad), null, bad);
  assert.equal(plan.encodeFactPlan({}), null);
  assert.deepEqual(plan.acceptFactPlanFromHash("#factplan=fp1.a.10"), { ops: ["add"], count: 10 });
  assert.deepEqual(
    plan.loadFactPlan(),
    { ops: ["add"], count: 10 },
    "opening the link saves the plan",
  );
  assert.equal(plan.acceptFactPlanFromHash("#assignment=x"), null);
  const session = buildFactSession({
    store: model.emptyFacts(),
    grade: 3,
    minutes: 15,
    now: NOW,
    rng: () => 0.5,
  });
  const kept = practice.applyFactPlan(session.items, { ops: ["div"], count: 5 });
  assert.ok(kept.length <= 5 && kept.length >= 1);
  assert.ok(kept.every((item) => item.key.startsWith("div:")));
  assert.equal(practice.applyFactPlan(session.items, { ops: [], count: 10 }).length, 10);
  assert.equal(practice.applyFactPlan(session.items, null), session.items);
}

// ---- #4 Grade 6-8 facts on the per-fact engine ----
{
  const k68 = await import(`${moby}fact-keys-68.js`);
  const cases = [
    ["int:mul:-3:4", "−3 × 4 = ?", ["-12", "−12"]],
    ["int:sub:2:-5", "2 − (−5) = ?", ["7"]],
    ["int:div:-24:-6", "−24 ÷ (−6) = ?", ["4"]],
    ["int:add:-7:3", "−7 + 3 = ?", ["-4"]],
    ["sq:13", "13² = ?", ["169"]],
    ["cube:4", "4³ = ?", ["64"]],
    ["fdp:3:8", "3/8 = ?%", ["37.5", "37.5%"]],
    ["fdp:1:25", "1/25 = ?%", ["4"]],
    ["dvb:111:3", "Is 111 divisible by 3? (yes or no)", ["yes", "sí"]],
    ["dvb:84:9", "Is 84 divisible by 9? (yes or no)", ["no"]],
    ["gcf:8:12", "GCF of 8 and 12 = ?", ["4"]],
    ["lcm:4:6", "LCM of 4 and 6 = ?", ["12"]],
    ["rate:96:8", "$96 for 8 items. $? for 1 item", ["12", "$12"]],
  ];
  for (const [key, question, accepted] of cases) {
    assert.equal(model.isTrackedKey(key), true, key);
    const item = makeItem(key);
    assert.equal(item.question, question, key);
    for (const answer of accepted)
      assert.ok(item.answers.includes(answer), `${key} accepts ${answer}`);
    assert.ok(
      !item.answers.includes("0") || key === "sq:0",
      `${key} wrong answers are not accepted`,
    );
    const hint = model.strategyHint(key);
    assert.ok(
      hint.text &&
        !accepted.some((a) =>
          new RegExp(`(^|\\D)${a.replace(/[$%.]/g, "\\$&")}(\\D|$)`).test(hint.text),
        ),
      `${key} hint never states the answer`,
    );
    assert.ok(hasEs(hint.template), `Spanish hint for ${key}`);
  }
  for (const bad of [
    "int:mul:3:4",
    "int:div:-7:2",
    "sq:16",
    "cube:11",
    "fdp:1:3",
    "dvb:84:7",
    "gcf:6:6",
    "lcm:2:13",
    "rate:25:2",
    "int:add:-13:1",
  ])
    assert.equal(model.isTrackedKey(bad), false, bad);
  // Records, sanitizer and status work for the new keys exactly as for basic facts.
  let store = model.emptyFacts();
  for (const [d, c] of [
    [3, true],
    [3, true],
    [1, true],
    [1, true],
  ])
    store = model.recordFactAttempt(store, { key: "int:mul:-3:4", correct: c }, NOW - d * DAY);
  assert.equal(
    model.factStatus(
      model.sanitizeFacts(JSON.parse(JSON.stringify(store))).facts["int:mul:-3:4"],
      NOW,
    ),
    "secure",
  );
  // Grade domains: Grade 5 and below are unchanged; 6, 7 and 8 gain their own facts and keep Grade 5's.
  const five = model.gradeFactDomain(5).keys.length;
  assert.ok(model.gradeFactDomain(6).keys.length > five);
  assert.ok(
    model.gradeFactDomain(6).keys.includes("fdp:1:4") &&
      !model.gradeFactDomain(6).keys.includes("int:mul:-3:4"),
  );
  assert.ok(
    model.gradeFactDomain(7).newSet.has("int:mul:-3:4") &&
      !model.gradeFactDomain(7).newSet.has("fdp:1:4"),
  );
  assert.ok(model.gradeFactDomain(8).newSet.has("cube:4"));
  const session = buildFactSession({
    store: model.emptyFacts(),
    grade: 7,
    minutes: 10,
    now: NOW,
    rng: () => 0.4,
  });
  assert.ok(
    session.items.some((item) => item.key.startsWith("int:")),
    "a Grade 7 session practises integer facts",
  );
  for (const item of session.items) assert.ok(item.answers.length && item.question, item.key);
  const map = model.progressMap(model.emptyFacts(), 7, "int-mul", NOW);
  assert.equal(
    map.counts.total,
    model.gradeFactDomain(7).bands.find((b) => b.id === "int-mul").keys.length,
  );
  for (const text of k68.HINTS_68) assert.ok(hasEs(text), text);
}

console.log("fluency-fact-tools: ok");
