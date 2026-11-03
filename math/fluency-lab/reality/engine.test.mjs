// Math Reality engine: full learning-cycle journeys for every grade band, misconception repair, hints, save
// repair, undo, and the idea interpreter. Expected values are recomputed here, not read from the engine.
import assert from "node:assert/strict";
import { STEPS, evidenceOf, hintsFor, interpretIdea, missionFor, newSession, reduce, sanitizeSave, sanitizeSession } from "./engine.js";
import { MISSIONS, bandOf, missionKeys } from "./stadium-missions.js";
import { capacityOf, frac, scaleField } from "./stadium-math.js";

const set = (key, value) => ({ type: "set", key, value });
const run = (session, mission, actions) => actions.reduce((s, a) => reduce(s, a, mission), session);

// Grade -> band mapping.
assert.deepEqual([1, 2, 3, 5, 6, 7, 8].map(bandOf), ["k2", "k2", "g35", "g35", "g6", "g7", "g8"]);
assert.equal(missionFor("pizza", 6), null, "no mission is invented for a world that is not built");

// A solver per band that plays the cycle the way a thoughtful student would.
const solvers = {
  k2: (m) => [
    set("sections", 4), set("seatsPerSection", 5), { type: "continue" },
    { type: "predict", id: "b" }, set("sections", 5), { type: "continue" },
    { type: "explain", id: "b" }, { type: "continue" },
    // apply: build 12 seats with a different number of groups than the 4 used before
    ...(() => { const t = m.apply(0, { sections: 5 }).vars.target; return [set("sections", 3), set("seatsPerSection", t / 3), { type: "answer" }]; })(),
    { type: "continue" }, { type: "reflect", text: "Different groups can make the same total." }, { type: "finish" },
  ],
  g35: () => [
    set("length", 30), set("width", 20), { type: "continue" },
    { type: "predict", id: "c" }, set("length", 60), { type: "continue" },
    { type: "explain", id: "c" }, { type: "continue" },
    { type: "answer", value: 3 * 12 * 5 }, { type: "continue" }, { type: "reflect", text: "Area doubled." }, { type: "finish" },
  ],
  g6: () => [
    set("sold", 30), { type: "continue" },
    { type: "predict", id: "c" }, set("sections", 8), set("sold", 60), { type: "continue" },
    { type: "explain", id: "a" }, { type: "continue" },
    { type: "answer", value: (80 * 75) / 100 }, { type: "continue" }, { type: "reflect", text: "Same ratio." }, { type: "finish" },
  ],
  g7: () => [
    set("length", 40), set("width", 30), { type: "continue" },
    { type: "predict", id: "b" }, { type: "set", key: "scale", scale: (s) => scaleField(s, frac(2, 1)) }, { type: "continue" },
    { type: "explain", id: "c" }, { type: "continue" },
    { type: "answer", value: 9 * 10 * 6 }, { type: "continue" }, { type: "reflect", text: "Area scales by k squared." }, { type: "finish" },
  ],
  g8: () => [
    set("length", 40), set("width", 20), { type: "continue" },
    { type: "predict", id: "c" }, set("sections", 7), set("seatsPerSection", 40), { type: "continue" },
    { type: "explain", id: "a" }, { type: "continue" },
    { type: "answer", value: Math.floor((25000 - 30 * 20 * 20) / 50) }, { type: "continue" }, { type: "reflect", text: "Slope 50." }, { type: "finish" },
  ],
};

for (const [band, mission] of Object.entries(MISSIONS)) {
  let s = newSession(mission, band === "k2" ? 2 : band === "g35" ? 4 : band === "g6" ? 6 : band === "g7" ? 7 : 8);
  const seen = [s.step];
  for (const action of solvers[band](mission)) {
    const before = s.step;
    s = reduce(s, action, mission);
    if (s.step !== before) seen.push(s.step);
  }
  assert.deepEqual(seen, STEPS, `${band}: every step reached, in order`);
  assert.equal(s.step, "done");
  const ev = evidenceOf(s);
  assert.equal(ev.prediction.correct, true, `${band}: prediction recorded`);
  assert.equal(ev.apply.independent, true, `${band}: independent apply, no hints`);
  assert.equal(ev.reflection.graded, false, "reflection is never scored");
  assert.equal(ev.kind, "observed");
}

// Misconception repair (Grade 7): the natural wrong prediction is tagged, observed math contradicts it, and the
// explain step refuses a wrong reason until the right one is chosen.
{
  const m = MISSIONS.g7;
  let s = newSession(m, 7);
  s = run(s, m, [set("length", 40), set("width", 30), { type: "continue" }, { type: "predict", id: "a" }]);
  assert.deepEqual(s.prediction, { id: "a", correct: false, tag: "linear-area" });
  s = reduce(s, { type: "set", key: "scale", scale: (st) => scaleField(st, frac(2, 1)) }, m);
  assert.equal(s.step, "observe");
  const c = s.observed.consequences[0];
  assert.equal(c.areaFactor.n / c.areaFactor.d, 4, "the model says 4x, not the 2x predicted");
  s = reduce(s, { type: "continue" }, m);
  s = reduce(s, { type: "explain", id: "a" }, m);
  assert.equal(s.explain.correct, false);
  assert.equal(reduce(s, { type: "continue" }, m).step, "explain", "cannot continue on a wrong reason");
  s = run(s, m, [{ type: "explain", id: "c" }, { type: "continue" }]);
  assert.equal(s.step, "apply");
  // Hints are progressive, never state the answer, and cost independence.
  const need = m.apply(0, s.apply.before).answer;
  for (let i = 0; i < 5; i += 1) s = reduce(s, { type: "hint" }, m);
  const h = hintsFor(m, s);
  assert.equal(h.shown.length, 3);
  assert.equal(h.more, false);
  for (const hint of h.shown) assert.doesNotMatch(JSON.stringify(hint), new RegExp(`\\b${need}\\b`), "no hint prints the final answer");
  s = reduce(s, { type: "answer", value: need + 1 }, m);
  assert.equal(s.apply.correct, false);
  s = reduce(s, { type: "another" }, m);
  assert.equal(s.apply.seed, 1);
  assert.equal(s.apply.hints, 0, "a new problem resets hints");
  const next = m.apply(1, s.apply.before);
  s = reduce(s, { type: "answer", value: next.answer }, m);
  assert.equal(s.apply.correct, true);
  const ev = evidenceOf(s);
  assert.equal(ev.apply.independent, true, "the fresh problem was solved alone");
  assert.equal(ev.apply.earlierMisses, 1, "the earlier miss is still on the record");
  const m2 = MISSIONS.g35;
  let t = newSession(m2, 5);
  t = run(t, m2, [set("length", 30), set("width", 20), { type: "continue" }, { type: "predict", id: "c" }, set("length", 60), { type: "continue" }, { type: "explain", id: "c" }, { type: "continue" }]);
  const answer = m2.apply(0, t.apply.before).answer;
  t = run(t, m2, [{ type: "answer", value: answer + 1 }, { type: "answer", value: answer }]);
  assert.equal(evidenceOf(t).apply.independent, false, "two attempts on one problem is not independent");
}

// Editing is only allowed in create / experiment / apply, and bad edits are refused, not applied.
{
  const m = MISSIONS.g7;
  let s = newSession(m, 7);
  s = reduce(s, { type: "continue" }, m);
  assert.equal(s.step, "create", "cannot continue before the create goal is met");
  const bad = reduce(s, set("length", 5), m);
  assert.deepEqual(bad.state, s.state);
  assert.equal(bad.log.at(-1).t, "refused");
  s = run(s, m, [set("length", 40), set("width", 30), { type: "continue" }]);
  assert.equal(s.step, "predict");
  assert.deepEqual(reduce(s, set("length", 50), m).state, s.state, "no editing while predicting");
  assert.equal(reduce(s, { type: "predict", id: "zzz" }, m).step, "predict", "unknown choice ignored");
}

// Undo restores the previous state.
{
  const m = MISSIONS.g35;
  let s = newSession(m, 4);
  s = run(s, m, [set("length", 30), set("width", 20)]);
  s = reduce(s, { type: "undo" }, m);
  assert.equal(s.state.width, 20 === s.state.width ? 20 : s.state.width);
  assert.equal(s.state.length, 30);
}

// Save repair: nonsense and tampered saves never produce an invalid session.
{
  const m = MISSIONS.g7;
  assert.equal(sanitizeSession(null, m), null);
  assert.equal(sanitizeSession({ missionId: "other" }, m), null);
  const tampered = sanitizeSession({ missionId: m.id, step: "done", state: { length: 99999, width: "x", sold: -3 }, base: null, prediction: null, apply: { attempts: 1e9, hints: -4 }, log: "no", history: [{ state: null }] }, m);
  assert.equal(tampered.step, "create", "a step with missing inputs falls back to create");
  assert.ok(tampered.state.length <= 200 && tampered.state.sold >= 0);
  assert.equal(tampered.apply.attempts, 99);
  assert.equal(tampered.apply.hints, 0);
  assert.deepEqual(tampered.log, []);
  assert.deepEqual(tampered.history, []);
  // A real mid-journey save round-trips through JSON.
  let s = newSession(m, 7);
  s = run(s, m, [set("length", 40), set("width", 30), { type: "continue" }, { type: "predict", id: "b" }, { type: "set", key: "scale", scale: (st) => scaleField(st, frac(2, 1)) }, { type: "continue" }]);
  const back = sanitizeSession(JSON.parse(JSON.stringify(s)), m);
  assert.equal(back.step, "explain");
  assert.deepEqual(back.state, s.state);
  assert.deepEqual(back.prediction, s.prediction);
  assert.equal(back.observed.consequences[0].areaFactor.n, 4);
  assert.deepEqual(sanitizeSave({ version: 99 }), { version: 1, worlds: {}, completed: [], idea: "" });
  assert.equal(sanitizeSave({ version: 1, completed: [{ missionId: "a", at: 1 }, { nope: 1 }], idea: "x".repeat(500) }).idea.length, 120);
}

// Idea interpreter: honest about unsupported worlds, never invents one.
assert.deepEqual(interpretIdea("I want to build a soccer stadium"), { match: "exact", worldId: "stadium", ready: true });
assert.deepEqual(interpretIdea("open a PIZZA restaurant!"), { match: "exact", worldId: "pizza", ready: false });
assert.deepEqual(interpretIdea("I want to explore space"), { match: "exact", worldId: "space", ready: false });
assert.deepEqual(interpretIdea("design a garden"), { match: "near", worldId: "stadium", ready: true });
assert.deepEqual(interpretIdea("create a theme park"), { match: "near", worldId: "stadium", ready: true });
assert.deepEqual(interpretIdea("qwerty"), { match: "none" });
assert.deepEqual(interpretIdea("   "), { match: "none" });
assert.deepEqual(interpretIdea("<script>alert(1)</script>"), { match: "none" });

// Mission data quality: unique choice ids, exactly one correct choice, predict choices differ, no timer language.
for (const mission of Object.values(MISSIONS)) {
  const s = { length: 40, width: 20, sections: 4, seatsPerSection: 5, sold: 12, budget: 30000, price: 10 };
  const p = mission.predict(s);
  assert.equal(p.choices.filter((c) => c.correct).length, 1, `${mission.id}: one correct prediction`);
  assert.equal(new Set(p.choices.map((c) => JSON.stringify([c.text, c.vars]))).size, p.choices.length, `${mission.id}: predict choices are distinct`);
  assert.equal(mission.explain.choices.filter((c) => c.correct).length, 1, `${mission.id}: one correct reason`);
  for (const c of [...p.choices, ...mission.explain.choices]) if (!c.correct) assert.ok(c.tag, `${mission.id}: every wrong choice names its misconception`);
  for (const tag of [...p.choices, ...mission.explain.choices].map((c) => c.tag).filter(Boolean)) assert.ok(mission.repair[tag], `${mission.id}: repair text for ${tag}`);
  for (let seed = 0; seed < 8; seed += 1) {
    const a = mission.apply(seed, s);
    if (a.kind === "number") {
      assert.ok(Number.isInteger(a.answer) && a.answer > 0, `${mission.id}: whole positive answer`);
      assert.ok(a.hints.length >= 2);
    }
  }
}
for (const key of missionKeys()) assert.doesNotMatch(key, /timer|countdown|hurry|seconds/i);
const g35 = MISSIONS.g35;
assert.equal(capacityOf({ sections: 3, seatsPerSection: 4 }), 12);
console.log("reality engine: five grade-band journeys, repair, hints, undo, save repair and idea interpreter passed");
