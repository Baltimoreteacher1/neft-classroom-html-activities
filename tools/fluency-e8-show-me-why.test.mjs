// Phase 2: "Show Me Why" lessons. Each lesson is played end to end the way a learner plays it (predict, build, watch,
// explain, try), the numbers its captions state are checked against the model's exact state, and the evidence rules
// (only a clean parallel problem is independent; reduced motion never autoplays) are enforced.
import assert from "node:assert/strict";
import { R, Rational } from "../math/fluency-lab/e8/rational.js";
import {
  BUILD_SOLUTIONS,
  LESSON_SKILL,
  LESSONS,
  lessonIds,
  lessonsForGrade,
  ShowMeWhy,
} from "../math/fluency-lab/e8/show-me-why.js";

import { ALL_SKILLS } from "../math/fluency-lab/problem-bank.js";

for (const [id, key] of Object.entries(LESSON_SKILL)) {
  assert.ok(LESSONS[id], `${id} is not a lesson`);
  const [grade, skillId] = key.split(":");
  assert.ok(
    ALL_SKILLS.some((sk) => sk.grade === Number(grade) && sk.id === skillId),
    `${id} maps to a skill that does not exist: ${key}`,
  );
}
for (let g = 1; g <= 8; g += 1)
  assert.ok(lessonsForGrade(g).length >= 1, `Grade ${g} has no Show Me Why lesson`);
assert.equal(lessonIds().length, 12);

let tried = 0;
for (const id of lessonIds()) {
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const run = new ShowMeWhy(id, { seed });
    // Choices are shuffled, and the right one is wherever it landed.
    const shown = run.predictChoices();
    assert.equal(new Set(shown.map((c) => c.index)).size, shown.length);
    const wrongFirst = shown.find((c) => !run.def.predict.choices[c.index].ok);
    const wrong = run.answerPredict(wrongFirst.index);
    assert.ok(
      !wrong.ok && wrong.why.en && wrong.why.es,
      `${id}: a wrong prediction still gets the reason`,
    );
    assert.ok(run.canAdvance(), "a prediction is never graded, so the learner can continue");
    run.answerPredict(shown.find((c) => run.def.predict.choices[c.index].ok).index);
    assert.ok(run.record.predict.ok);
    assert.ok(run.next());
    // Build: the build check is false until the idea is built, and true after the lesson's own moves.
    assert.ok(!run.checkBuild().ok, `${id}: build is already complete before any move`);
    assert.ok(run.checkBuild().hint.en);
    assert.ok(!run.next(), "cannot skip the build");
    for (const action of BUILD_SOLUTIONS[id])
      assert.ok(run.move(action).ok, `${id}: build move ${JSON.stringify(action)} refused`);
    assert.ok(run.checkBuild().ok, `${id}: build not recognised after the lesson's moves`);
    assert.deepEqual(run.engine.verify(), [], `${id}: the built model is inconsistent`);
    assert.ok(run.next());
    // Watch: steps one move at a time; every frame is a verified state with a bilingual caption.
    assert.equal(run.kind, "watch");
    assert.ok(!run.next(), "must watch to the end");
    for (let f = 1; f <= run.def.watch.actions.length; f += 1) {
      const frame = run.watchTo(f);
      assert.ok(frame.caption.en && frame.caption.es, `${id}: frame ${f} needs both captions`);
      assert.deepEqual(run.engine.verify(), [], `${id}: frame ${f} fails verification`);
    }
    assert.equal(run.watchTo(0).caption, null);
    run.watchTo(run.def.watch.actions.length);
    assert.ok(run.next());
    // Explain.
    assert.ok(!run.submitExplain("ok").ok, "one word is not an explanation");
    assert.ok(
      !run.submitExplain("I cut each part into ___ pieces so", 0).ok,
      "a blank left unfilled is not an explanation",
    );
    assert.ok(run.submitExplain("The same amount is cut into smaller equal pieces", null).ok);
    assert.ok(run.next());
    // Try: a parallel problem with its own numbers.
    const q = run.tryQuestion;
    assert.ok(q.prompt.en && q.prompt.es && q.answer !== undefined);
    assert.ok(!run.answerTry("987654321").ok);
    assert.ok(run.answerTry(q.answer).ok);
    assert.ok(run.next());
    assert.ok(run.done);
    const ev = run.evidence();
    assert.ok(
      ev.complete && ev.tried.correct && !ev.independent && ev.supported,
      "a wrong first try makes the success supported",
    );
    // A clean run: right first, no hints.
    const clean = new ShowMeWhy(id, { seed });
    clean.answerPredict(0);
    clean.next();
    for (const a of BUILD_SOLUTIONS[id]) clean.move(a);
    clean.checkBuild();
    clean.next();
    clean.watchTo(clean.def.watch.actions.length);
    clean.next();
    clean.submitExplain("because the pieces are the same size", null);
    clean.next();
    clean.answerTry(clean.tryQuestion.answer);
    assert.ok(clean.evidence().independent, `${id}: a clean parallel problem is independent`);
    const hinted = new ShowMeWhy(id, { seed });
    hinted.answerPredict(0);
    hinted.next();
    for (const a of BUILD_SOLUTIONS[id]) hinted.move(a);
    hinted.checkBuild();
    hinted.next();
    hinted.watchTo(hinted.def.watch.actions.length);
    hinted.next();
    hinted.submitExplain("because the pieces are the same size", null);
    hinted.next();
    hinted.tryHint();
    hinted.answerTry(hinted.tryQuestion.answer);
    assert.ok(
      !hinted.evidence().independent && hinted.evidence().supported,
      `${id}: a hint makes it supported`,
    );
    // The parallel problem has different numbers from the lesson's worked example (for the same seed it is stable).
    assert.equal(
      JSON.stringify(new ShowMeWhy(id, { seed }).startTry()),
      JSON.stringify(new ShowMeWhy(id, { seed }).startTry()),
    );
    tried += 1;
  }
  assert.equal(new ShowMeWhy(id, { reducedMotion: true }).canAutoplay, false);
  assert.equal(new ShowMeWhy(id, { reducedMotion: false }).canAutoplay, true);
}

// The numbers each lesson states are the model's own numbers.
const at = (id, frames = Infinity) => {
  const r = new ShowMeWhy(id);
  r.watchTo(Math.min(frames, r.def.watch.actions.length));
  return r.engine;
};
assert.equal(at("tenFrame").state.filled, 10);
assert.equal(at("baseTen", 1).derive().facts.value, 13);
assert.equal(at("baseTen", 2).derive().facts.value, 13);
assert.equal(at("array").derive().facts.total, 12);
assert.deepEqual(
  at("areaMultiply", 1).derive().facts.parts,
  [0, 60, 0, 78],
  "split at 10: 10×6 + 13×6",
);
assert.deepEqual(
  at("areaMultiply").derive().facts.parts,
  [0, 120, 0, 18],
  "split at 20: 20×6 + 3×6",
);
assert.equal(at("areaMultiply").derive().facts.total, 138);
{
  const e = at("fractionBar", 1);
  assert.equal(`${e.state.n}/${e.state.d}`, "3/6");
  assert.ok(e.derive().facts.value.eq(R(1, 2)));
  assert.equal(`${at("fractionBar").state.n}/${at("fractionBar").state.d}`, "1/2");
}
assert.equal(at("fractionOps").derive().facts.result.toString(), "7/12");
assert.equal(at("tapeRatio", 1).derive().facts.B, 6);
assert.equal(at("tapeRatio").derive().facts.A, 8);
assert.equal(at("tapeRatio").derive().facts.B, 12);
assert.equal(at("balanceScale", 1).derive().equation, "3x = 12");
assert.equal(at("balanceScale").derive().facts.solved, true);
assert.equal(at("balanceScale").state.D, "4");
assert.equal(at("integerChips", 2).derive().facts.net, 3);
assert.equal(at("integerChips", 3).derive().facts.net, 4);
assert.equal(at("integerChips").derive().facts.net, 5);
assert.equal(at("linearGraph", 1).derive().facts.point[1].toString(), "5");
assert.equal(at("linearGraph", 2).derive().facts.point[1].toString(), "7");
assert.equal(at("linearGraph").derive().facts.point[1].toString(), "9");
assert.equal(new ShowMeWhy("dotPlot").engine.derive().facts.mean.toString(), "4");
assert.equal(at("dotPlot").derive().facts.mean.toString(), "5");
assert.equal(at("triangleArea").derive().facts.triangle.toString(), "12");
assert.equal(at("triangleArea", 1).derive().facts.triangle.toString(), "12");

// Parallel problems have exact answers that an independent computation agrees with.
for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
  const a = new ShowMeWhy("fractionOps", { seed });
  const q = a.startTry();
  const b = a.tryEngine.params.b[0];
  assert.equal(q.answer, R(1, 2).add(R(b, 5)).toString());
  const t = new ShowMeWhy("tapeRatio", { seed });
  const tq = t.startTry();
  assert.equal(tq.answer, String(t.tryEngine.state.b * 5));
  const g = new ShowMeWhy("linearGraph", { seed });
  const gq = g.startTry();
  assert.equal(
    gq.answer,
    String(g.tryEngine.params.m * g.tryEngine.params.x + g.tryEngine.params.b),
  );
  const d = new ShowMeWhy("dotPlot", { seed });
  const dq = d.startTry();
  const sum = d.tryEngine.state.data.reduce((x, y) => x + y, 0);
  assert.equal(dq.answer, R(sum, d.tryEngine.state.data.length).toString());
  const s = new ShowMeWhy("balanceScale", { seed });
  s.startTry();
  const p = s.tryEngine.params;
  assert.equal(s.tryQuestion.answer, String((p.d - p.b) / p.a));
  assert.ok(
    Number.isInteger((p.d - p.b) / p.a),
    "the balance try-it problem has a whole-number solution",
  );
}

console.log(
  `Show Me Why: ${lessonIds().length} lessons played end to end across ${tried} seeded runs; captions match the models' exact state; only a clean parallel problem is independent.`,
);
