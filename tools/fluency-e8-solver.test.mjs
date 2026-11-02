// Phase 2: Guided Solver 2.0. Every problem the library generates that the solver understands is solved step by step
// with exact arithmetic, and the plan's final answer must equal the library's own answer key. Support is never
// recorded as independent, fading follows fixed rules, and parallel problems are new but in the same family.
import assert from "node:assert/strict";
import { seeded } from "../math/fluency-lab/e8/engine-core.js";
import {
  buildPlan,
  GuidedSolver,
  nextScaffold,
  parallelQuestion,
  solverSupports,
} from "../math/fluency-lab/e8/guided-solver.js";
import { parseRational, Rational } from "../math/fluency-lab/e8/rational.js";
import {
  ALL_SKILLS,
  generateProblem,
  seededRandom,
  validateAnswer,
} from "../math/fluency-lab/problem-bank.js";

const answerOf = (step) =>
  step.kind === "choice" ? step.choices.findIndex((c) => c.correct) : step.answer.toString();

let supported = 0;
let checked = 0;
const families = new Set();
const skillsCovered = new Set();
for (const skill of ALL_SKILLS) {
  for (let seed = 1; seed <= 25; seed += 1) {
    const problem = generateProblem(skill, seededRandom(seed * 101 + skill.grade), 1);
    checked += 1;
    const plan = buildPlan(problem.question);
    if (!plan) continue;
    supported += 1;
    families.add(plan.family);
    skillsCovered.add(`${skill.grade}:${skill.id}`);
    // The plan's answer must be accepted by the library's own validator for that very problem.
    const shown = plan.answer.isInteger() ? plan.answer.toString() : plan.answer.toString();
    assert.ok(
      validateAnswer(shown, problem),
      `${skill.id}: "${problem.question}" plan answer ${shown} rejected by the library (expects ${problem.answers})`,
    );
    // Walk every scaffold level to the end answering each step correctly.
    for (const scaffold of [3, 2, 1, 0]) {
      const solver = new GuidedSolver(problem.question, { scaffold });
      let guard = 0;
      while (solver.current() && guard < 40) {
        const step = solver.current();
        const out = solver.submit(answerOf(step));
        assert.ok(
          out.ok,
          `${skill.id} scaffold ${scaffold}: correct answer refused at ${step.id} for "${problem.question}"`,
        );
        guard += 1;
      }
      const summary = solver.summary();
      assert.ok(summary.finished && summary.correct, `${skill.id}: solver did not finish`);
      assert.equal(summary.independent, scaffold === 0, `scaffold ${scaffold} independence`);
      assert.equal(summary.owesFreshAttempt, scaffold > 0);
    }
  }
}
assert.ok(
  supported >= 150,
  `the solver understood only ${supported} of ${checked} generated problems`,
);
for (const f of [
  "addSub",
  "multiply",
  "fractionAddSub",
  "equation",
  "percent",
  "slope",
  "integers",
])
  assert.ok(families.has(f), `family ${f} never exercised; saw ${[...families]}`);

// Wrong answers get specific corrections, not a generic "try again".
{
  const s = new GuidedSolver("1/3 + 1/4 = ?");
  const wrong = s.submit("7");
  assert.ok(!wrong.ok && /Adding the denominators/.test(wrong.feedback.en));
  assert.ok(s.submit("12").ok);
  const bare = s.submit("1");
  assert.ok(!bare.ok && /Changing only the bottom/.test(bare.feedback.en));
  assert.ok(s.submit("4").ok);
  assert.ok(s.submit("3").ok);
  assert.ok(s.submit("7").ok);
  const unsimplified = new GuidedSolver("1/4 + 1/4 = ?", { scaffold: 0 });
  const r = unsimplified.submit("2/4");
  assert.ok(!r.ok && /simplest form/.test(r.feedback.en));
  assert.ok(unsimplified.submit("1/2").ok);
  const slope = new GuidedSolver("Find the slope through (1, 2) and (5, -6).", { scaffold: 0 });
  assert.ok(
    /rise ÷ run|run ÷ rise|Slope is rise over run/.test(
      (slope.submit("-1/2").feedback || {}).en || "",
    ),
    "flipped slope gets a targeted message",
  );
  const eq = new GuidedSolver("10x − 9 = 91. Find x.", { scaffold: 0 });
  assert.ok(/first step was skipped/.test(eq.submit("9.1").feedback.en));
  const ints = new GuidedSolver("-3 + 5 = ?", { scaffold: 0 });
  assert.ok(/sign is flipped/.test(ints.submit("-2").feedback.en));
  assert.ok(!ints.submit("abc").ok && ints.submit("abc").invalid);
  assert.ok(ints.submit("2").ok);
}

// Support is never independent: hints, reveals, a wrong try, or any scaffold level above zero.
{
  const hinted = new GuidedSolver("What is 25% of 80?", { scaffold: 0 });
  hinted.hint();
  hinted.submit("20");
  const a = hinted.summary();
  assert.ok(
    a.correct && !a.independent && a.supported && a.owesFreshAttempt,
    "a hinted success is supported",
  );
  const revealed = new GuidedSolver("What is 25% of 80?", { scaffold: 0 });
  revealed.reveal();
  const b = revealed.summary();
  assert.ok(!b.correct && !b.independent, "a revealed answer is not even correct work");
  const retry = new GuidedSolver("What is 25% of 80?", { scaffold: 0 });
  retry.submit("25");
  retry.submit("20");
  const c = retry.summary();
  assert.ok(
    c.correct && !c.independent,
    "right on the second try is not an independent first response",
  );
  const clean = new GuidedSolver("What is 25% of 80?", { scaffold: 0 });
  clean.submit("20");
  assert.ok(clean.summary().independent);
}
// The hint ladder never gives the answer away on the first rung and never repeats forever.
{
  const s = new GuidedSolver("8x = 32. Find x.", { scaffold: 0 });
  const h1 = s.hint().text.en;
  assert.ok(!/\b4\b/.test(h1), "first hint must not state the answer");
}
// Fading rules.
assert.equal(
  nextScaffold(3, [
    { independent: true, correct: true },
    { independent: true, correct: true },
  ]),
  2,
);
assert.equal(nextScaffold(2, [{ independent: true, correct: true }]), 2);
assert.equal(
  nextScaffold(2, [
    { independent: true, correct: true },
    { independent: false, correct: true },
  ]),
  2,
);
assert.equal(nextScaffold(1, [{ independent: true, correct: false }]), 2);
assert.equal(
  nextScaffold(0, [
    { independent: true, correct: true },
    { independent: true, correct: true },
  ]),
  0,
);

// Parallel problems are new, supported and in the same family; the same seed gives the same problem.
{
  let made = 0;
  for (const q of [
    "34,798 + 50,611 = ?",
    "9,000 − 4,567 = ?",
    "36 × 24 = ?",
    "6/10 − 1/4 = ?",
    "1/3 + 1/4 = ?",
    "8x = 32. Find x.",
    "10x − 9 = 91. Find x.",
    "x + 5 = 12. Find x.",
    "What is 50% of 24?",
    "Find the slope through (1, 2) and (5, -6).",
    "-3 + 5 = ?",
  ]) {
    const fam = buildPlan(q)?.family;
    assert.ok(fam, `no plan for ${q}`);
    for (let seed = 1; seed <= 30; seed += 1) {
      const p = parallelQuestion(q, seeded(seed));
      assert.ok(p, `no parallel problem for ${q} seed ${seed}`);
      assert.notEqual(
        p.replace(/[\s,]/g, ""),
        q.replace(/[\s,]/g, ""),
        "parallel problem repeats the original",
      );
      assert.equal(buildPlan(p).family, fam, `${p} left the family of ${q}`);
      assert.deepEqual(parallelQuestion(q, seeded(seed)), p, "parallel problems are reproducible");
      // And it is solvable to the same standard of exactness.
      const solver = new GuidedSolver(p, { scaffold: 3 });
      while (solver.current())
        assert.ok(
          solver.submit(answerOf(solver.current())).ok,
          `${p}: own plan refused its own answer`,
        );
      made += 1;
    }
  }
  assert.equal(made, 330);
}
assert.ok(!solverSupports("Which shape has four equal sides?"));

console.log(
  `Guided solver: ${supported} of ${checked} generated problems planned across ${families.size} families / ${skillsCovered.size} skills; answers match the library key; support is never independent.`,
);
