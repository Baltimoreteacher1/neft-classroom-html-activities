// Adaptive checkup, driven by simulated learners with different skill profiles. Each learner is a function from a
// skill key and attempt number to right/wrong, so the test exercises the real queue-rewriting rules end to end.
import assert from "node:assert/strict";

Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => null, setItem() {}, removeItem() {} } });
Object.defineProperty(globalThis, "window", { configurable: true, value: globalThis });

const { findSkill, sanitizeTutor, emptyTutor } = await import("./tutor-engine.js");
const { MAX_FOUNDATION_PROBES, PURPOSE, checkupPlan, checkupSummary, recordCheckupAnswer } = await import("./placement.js");

// Walk a session exactly as app.js does: answer queue[answered], advance, then let the checkup react.
function run(grade, learner, unsureKeys = []) {
  const queue = checkupPlan(grade);
  const session = { queue, target: queue.length, answered: 0, diagnosticResults: {} };
  const asked = [];
  const attempts = {};
  while (session.answered < session.target) {
    assert.ok(asked.length < 200, "checkup must terminate");
    const entry = session.queue[session.answered];
    attempts[entry.key] = (attempts[entry.key] || 0) + 1;
    const unsure = unsureKeys.includes(entry.key);
    const correct = !unsure && Boolean(learner(entry.key, attempts[entry.key]));
    asked.push({ ...entry, correct, unsure });
    session.answered += 1;
    recordCheckupAnswer(session, entry.key, correct, { unsure });
  }
  return { session, asked, summary: checkupSummary(session) };
}

const grades = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const strong = () => true;
const never = () => false;

// Every grade: the plan covers each skill once, entries resolve, and a strong learner is never given a second look.
let shortened = 0;
for (const grade of grades) {
  const plan = checkupPlan(grade);
  assert.equal(new Set(plan.map((entry) => entry.key)).size, plan.length, `grade ${grade}: one initial item per skill`);
  assert.ok(plan.every((entry) => findSkill(entry.key) && entry.purpose === PURPOSE.initial));
  const { session, asked, summary } = run(grade, strong);
  assert.ok(asked.every((entry) => entry.purpose === PURPOSE.initial), `grade ${grade}: no follow-ups after passes`);
  assert.equal(summary.gaps.length + summary.secondLook.length + summary.foundationGaps.length, 0);
  for (const key of session.checkup?.inferred || []) {
    assert.ok(!(key in session.diagnosticResults), `grade ${grade}: ${key} is inferred, never credited as a pass`);
    assert.ok(!asked.some((entry) => entry.key === key), `grade ${grade}: ${key} was skipped, not asked`);
  }
  if (asked.length < plan.length) shortened += 1;
  assert.equal(asked.length + (session.checkup?.inferred.length || 0), plan.length, `grade ${grade}: asked + inferred covers the plan`);
}
assert.ok(shortened > 0, "a strong learner skips at least one prerequisite somewhere, so passing changes the checkup");

// One slip: the second look recovers it. It is never recorded as a gap and triggers no foundation probe.
{
  const slipKey = checkupPlan(6)[2].key;
  const { session, asked, summary } = run(6, (key, attempt) => key !== slipKey || attempt > 1);
  const slipped = asked.filter((entry) => entry.key === slipKey);
  assert.deepEqual(slipped.map((entry) => [entry.purpose, entry.correct]), [[PURPOSE.initial, false], [PURPOSE.second, true]]);
  assert.equal(slipped.length, 2, "exactly one second look");
  assert.equal(session.diagnosticResults[slipKey], true);
  assert.equal(summary.gaps.length, 0);
  assert.ok(!asked.some((entry) => entry.purpose === PURPOSE.foundation), "a recovered slip does not probe foundations");
  assert.deepEqual(session.checkup.recovered, [slipKey]);
}

// "I'm not sure yet": no second look, no foundation probe, never a gap, and not credited as a pass.
{
  const unsureKey = "6:divide-fractions";
  const { session, asked, summary } = run(6, strong, [unsureKey]);
  assert.equal(asked.filter((entry) => entry.key === unsureKey).length, 1, "asked once, not pushed with a second look");
  assert.ok(!asked.some((entry) => entry.purpose !== PURPOSE.initial));
  assert.equal(session.diagnosticResults[unsureKey], false, "not credited as a pass");
  assert.deepEqual(summary.unsure, [findSkill(unsureKey).title]);
  assert.deepEqual(summary.gaps, [], "unsure is not a gap");
}

// A real gap: two misses mark the skill, then exactly the authored foundation is probed. A passed foundation stops there.
{
  const gapKey = "6:divide-fractions";
  assert.ok(findSkill(gapKey), "fixture skill exists");
  const { session, asked, summary } = run(6, (key) => key !== gapKey);
  const gapRows = asked.filter((entry) => entry.key === gapKey);
  assert.deepEqual(gapRows.map((entry) => entry.purpose), [PURPOSE.initial, PURPOSE.second]);
  assert.equal(session.diagnosticResults[gapKey], false);
  const probes = asked.filter((entry) => entry.purpose === PURPOSE.foundation);
  assert.deepEqual(probes.map((entry) => entry.key), ["5:fraction-mul"], "probes the authored foundation, once");
  assert.equal(summary.foundationGaps.length, 0, "a passed foundation is not reported as a gap");
  assert.deepEqual(session.checkup.recovered, [], "a skill missed twice is not 'recovered'");
  assert.deepEqual(summary.secondLook, []);
  assert.deepEqual(summary.gaps, [findSkill(gapKey).title], "the gap is reported once, by title");
  assert.ok(!summary.solid.includes(findSkill(gapKey).title));
  assert.equal(session.checkup.foundations["5:fraction-mul"], true);
}

// A missed foundation is followed back one more step, then the probe cap holds.
{
  const gapKey = "6:divide-fractions";
  const { asked, summary } = run(6, (key) => key !== gapKey && key !== "5:fraction-mul" && key !== "3:mul-0-5");
  const probes = asked.filter((entry) => entry.purpose === PURPOSE.foundation).map((entry) => entry.key);
  assert.deepEqual(probes, ["5:fraction-mul", "3:mul-0-5"], "follows the chain back through earlier grades");
  assert.ok(probes.length <= MAX_FOUNDATION_PROBES);
  assert.deepEqual(summary.foundationGaps.map((skill) => `${skill.grade}:${skill.id}`), probes);
}

// A learner who misses everything: bounded length, capped probes, no skill asked more than twice as a grade item.
for (const grade of grades) {
  const { session, asked } = run(grade, never);
  const plan = checkupPlan(grade);
  assert.ok(asked.length <= plan.length * 2 + MAX_FOUNDATION_PROBES, `grade ${grade}: bounded length`);
  assert.ok(session.checkup.probed.length <= MAX_FOUNDATION_PROBES);
  assert.ok(plan.every((entry) => session.diagnosticResults[entry.key] === false), `grade ${grade}: every skill ends as an evidenced gap`);
  const counts = {};
  for (const entry of asked.filter((row) => row.purpose !== PURPOSE.foundation)) counts[entry.key] = (counts[entry.key] || 0) + 1;
  assert.ok(Object.values(counts).every((count) => count === 2), `grade ${grade}: each skill gets exactly one second look`);
}

// Determinism: same learner, same plan, same transcript.
{
  const learner = (key, attempt) => (key.length + attempt) % 3 !== 0;
  assert.deepEqual(run(5, learner).asked, run(5, learner).asked);
}

// Persistence: foundations survive a save/load, bad keys and non-booleans do not.
{
  const tutor = emptyTutor();
  tutor.diagnostics[6] = {
    at: 1,
    results: { "6:divide-fractions": false },
    foundations: { "5:fraction-mul": false, "7:equations": true, "nope:nope": true, "3:mul-0-5": "yes" },
  };
  const clean = sanitizeTutor(JSON.parse(JSON.stringify(tutor)));
  assert.deepEqual(clean.diagnostics[6].foundations, { "5:fraction-mul": false });
  assert.deepEqual(clean.diagnostics[6].results, { "6:divide-fractions": false });
}

// Every checkup string the page can show has a Spanish entry with the same placeholders. Most are passed to t()
// through arrays and ternaries, which the general i18n test cannot see, so they are listed here.
{
  const { ES } = await import("./i18n-es.js");
  const keys = ["Starting-point checkup", "Your starting-point checkup", "I’m not sure yet", "A short checkup that adjusts to your answers", "and {n} more",
    "A miss gets a second look before it counts. Choose “I’m not sure yet” whenever you need to.",
    "One miss is not enough to decide, so here is a fresh one. Choose “I’m not sure yet” whenever you need to.",
    "A short look at an earlier idea this builds on. Choose “I’m not sure yet” whenever you need to.",
    "Solid today: {skills}.", "Right on the second look: {skills}.", "Worth practicing: {skills}.", "Skipped for now: {skills}.",
    "Not asked, because your harder answers already showed the idea: {skills}.",
    "A short checkup suggests what to try next. It cannot prove mastery or determine a grade level."];
  const holes = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join();
  for (const key of keys) {
    assert.ok(ES[key], `Spanish entry for: ${key}`);
    assert.equal(holes(ES[key]), holes(key), `placeholders match for: ${key}`);
  }
}

console.log(`Adaptive checkup passed: 9 grades, strong/slip/gap/chain/guesser learners, ${shortened} grade(s) shortened by inference`);
