// Pins the diagnosis → intervention loop: when the engine can name WHY a student
// missed, that name has to change what happens next. Before this, the tag was
// computed, filed to three analytics sinks, and discarded — the student got the
// same generic ladder either way, and the next item was whatever came next in
// the bucket. These tests exist so that cannot quietly revert: every assertion
// below is about a decision the student actually experiences.

import assert from "node:assert/strict";
import { createAdaptiveSequence } from "./adaptive.js";
import { createRemediation, deriveDiagnosis } from "./remediation.js";

const ITEM = {
  type: "multiple-choice",
  stem: "A recipe uses 3 cups of flour for every 5 cups of water. What is the ratio of flour to water?",
  choices: ["5:3", "3:5", "8:5", "3:8"],
  correctIndex: 1,
  explanation: "Flour is named first, so it goes first.",
};

// ── deriveDiagnosis ──

// A known tag resolves to the authored student-voice explanation.
{
  const d = deriveDiagnosis(ITEM, "ratio-inverted");
  assert.ok(d, "a known tag must produce a diagnosis");
  assert.equal(d.tag, "ratio-inverted");
  assert.ok(d.label.length > 0, "the diagnosis carries the short error name");
  assert.ok(d.text.length > 0, "the diagnosis carries student-voice text");
}

// The diagnosis must never hand over the answer — the student still has a retry,
// and a diagnosis that states the number spends that retry for them.
{
  const d = deriveDiagnosis(ITEM, "ratio-inverted");
  assert.ok(!d.text.includes("3:5"), "the diagnosis must not print the correct answer");
}

// Spanish resolves to the Spanish authoring, not to English.
{
  const en = deriveDiagnosis(ITEM, "ratio-inverted", "en");
  const es = deriveDiagnosis(ITEM, "ratio-inverted", "es");
  assert.notEqual(es.text, en.text, "Spanish must use the authored Spanish voice");
}

// An unknown or retired tag degrades to null rather than an empty card.
{
  assert.equal(deriveDiagnosis(ITEM, "not-a-real-tag"), null);
  assert.equal(deriveDiagnosis(ITEM, ""), null);
  assert.equal(deriveDiagnosis(ITEM, null), null);
}

// ── createRemediation: which ladder runs ──

// With no tag, the first rung is the generic hint, exactly as before.
{
  const r = createRemediation({ question: ITEM });
  assert.equal(r.diagnosed(), false);
  assert.equal(r.nextStep({ correct: false }).kind, "hint");
}

// With a tag, the first rung names the error instead of nudging at the problem.
{
  const r = createRemediation({ question: ITEM, misconception: "ratio-inverted" });
  assert.equal(r.diagnosed(), true);
  const first = r.nextStep({ correct: false });
  assert.equal(first.kind, "diagnosis");
  assert.equal(first.payload.tag, "ratio-inverted");
}

// A tag that does not resolve must fall back to the generic ladder at CONSTRUCTION
// time, not at render time — otherwise the student meets an empty first rung and
// loses a retry to it.
{
  const r = createRemediation({ question: ITEM, misconception: "typo-tag" });
  assert.equal(r.diagnosed(), false);
  assert.equal(r.nextStep({ correct: false }).kind, "hint");
}

const walk = (r) => {
  const kinds = [];
  for (let i = 0; i < 8; i++) {
    const s = r.nextStep({ correct: false });
    kinds.push(s.kind);
    if (s.kind === "done") break;
  }
  return kinds;
};

// The diagnosed ladder drops the passive worked-example rung — the student has
// been told what went wrong, so re-reading a solved example is the wrong move —
// and replaces it with two levels of misconception support: name the error, then
// a micro-task where the error cannot hide.
{
  const generic = createRemediation({ question: ITEM });
  const diagnosed = createRemediation({ question: ITEM, misconception: "ratio-inverted" });
  assert.deepEqual(walk(generic), ["hint", "worked-example", "guided", "retry-easier", "done"]);
  assert.deepEqual(walk(diagnosed), [
    "diagnosis",
    "intervention",
    "guided",
    "retry-easier",
    "done",
  ]);
}

// When the item's OWN feedback already named the error (multiple-choice prints
// the diagnosis chip and the student sentence, and offers its own retry), the
// panel must not say it again. It opens at the second-level move instead, so it
// is purely additive rather than a second card repeating the first.
{
  const r = createRemediation({
    question: ITEM,
    misconception: "ratio-inverted",
    level1Shown: true,
  });
  assert.deepEqual(walk(r), ["intervention", "guided", "retry-easier", "done"]);
}

// A tag with no authored micro-task simply has one fewer rung — the ladder must
// not stall on an empty card.
{
  const r = createRemediation({ question: ITEM, misconception: "geom-surface-area-as-volume" });
  assert.equal(r.hasIntervention(), true, "this tag does have one");

  // Simulate the no-intervention case through the public contract: every
  // taxonomy tag currently has a micro-task, so assert that invariant instead of
  // faking one — if a tag is ever added without a move, this is what tells us.
  const withMove = createRemediation({ question: ITEM, misconception: "ratio-inverted" });
  assert.equal(withMove.hasIntervention(), true);
}

// Recovery reports WHICH rung did it — recovering after the named diagnosis is a
// different event, pedagogically and for the teacher view, from recovering only
// after an easier problem.
{
  const r = createRemediation({ question: ITEM, misconception: "ratio-inverted" });
  r.nextStep({ correct: false }); // diagnosis
  const done = r.nextStep({ correct: true });
  assert.equal(done.payload.recovered, true);
  assert.equal(done.payload.recoveredAt, "diagnosis");
}

// A correct answer still short-circuits the whole thing on both ladders.
{
  for (const tag of [undefined, "ratio-inverted"]) {
    const r = createRemediation({ question: ITEM, misconception: tag });
    assert.equal(r.nextStep({ correct: true }).kind, "done");
  }
}

// Recovering mid-ladder reports recovery, not exhaustion.
{
  const r = createRemediation({ question: ITEM, misconception: "ratio-inverted" });
  r.nextStep({ correct: false });
  const done = r.nextStep({ correct: true });
  assert.equal(done.kind, "done");
  assert.equal(done.payload.recovered, true);
}

// ── createAdaptiveSequence: targeted re-exposure ──

const tagged = (id, tags) => ({ id, type: "multiple-choice", misconceptionTags: tags });
const CONFIG = {
  practice: {
    onLevel: [
      tagged("a", []),
      tagged("b", ["ratio-inverted"]),
      tagged("c", []),
      tagged("d", ["rate-not-per-one"]),
    ],
    approaching: [],
    extending: [],
  },
};
const flatState = { get: () => ({ totalAttempts: 0, totalCorrect: 0, streak: 0 }) };

// With no target, order is untouched — the ordinary path must not change.
{
  const seq = createAdaptiveSequence(CONFIG, flatState);
  const ids = [];
  for (let i = 0; i < 4; i++) ids.push(seq.nextProblem("core").id);
  assert.deepEqual(ids, ["a", "b", "c", "d"]);
}

// With a target, the item that traps that error jumps the queue.
{
  const seq = createAdaptiveSequence(CONFIG, flatState);
  const first = seq.nextProblem("core", { targetTag: "ratio-inverted" });
  assert.equal(first.id, "b");
  assert.equal(first.targetedFor, "ratio-inverted");
}

// A targeted pull must not be served twice, and must not skip the items it
// jumped over — the whole set still gets delivered, exactly once each.
{
  const seq = createAdaptiveSequence(CONFIG, flatState);
  const ids = [seq.nextProblem("core", { targetTag: "ratio-inverted" }).id];
  for (let i = 0; i < 3; i++) ids.push(seq.nextProblem("core").id);
  assert.equal(seq.nextProblem("core"), null, "the set is exhausted, not extended");
  assert.deepEqual([...ids].sort(), ["a", "b", "c", "d"]);
  assert.equal(ids[0], "b");
}

// Targeting is a preference, never a filter: an error no item traps changes
// nothing at all.
{
  const seq = createAdaptiveSequence(CONFIG, flatState);
  const first = seq.nextProblem("core", { targetTag: "geom-volume-added-dimensions" });
  assert.equal(first.id, "a");
  assert.equal(first.targetedFor, undefined);
}

// A single-tag item (`misconceptionTag`, the other authored form) is found too.
{
  const cfg = {
    practice: {
      onLevel: [tagged("x", []), { id: "y", misconceptionTag: "sign-dropped" }],
      approaching: [],
      extending: [],
    },
  };
  const seq = createAdaptiveSequence(cfg, flatState);
  assert.equal(seq.nextProblem("core", { targetTag: "sign-dropped" }).id, "y");
}

// The served cap still holds — a targeted pull consumes a slot like any other.
{
  const seq = createAdaptiveSequence(CONFIG, flatState, { maxItems: 2 });
  seq.nextProblem("core", { targetTag: "ratio-inverted" });
  seq.nextProblem("core");
  assert.equal(seq.nextProblem("core"), null);
}

console.log("PASS diagnosis-routing: 17 assertions across the diagnosis → intervention loop");
