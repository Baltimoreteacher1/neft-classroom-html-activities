import assert from "node:assert/strict";
import test from "node:test";
import {
  parallelExample,
  questionIn,
  safeStrategy,
} from "../access-practice-lab/src/mls/fluency-player.js";
import {
  practiceProblem,
  sourceSkill,
  validateAnswer,
} from "../access-practice-lab/src/mls/fluency-problems.js";
import {
  cleanProgress,
  emptyProgress,
  progressFor,
} from "../access-practice-lab/src/mls/fluency-progress.js";
import { ALL_SKILLS, generateProblem, seededRandom } from "../math/fluency-lab/problem-bank.js";

test("all active skills reuse seeded Fluency questions and answer checking at the standard level", () => {
  for (const source of ALL_SKILLS) {
    const skill = sourceSkill(source.grade, source.id);
    assert.equal(skill, source);
    for (let seed = 1; seed <= 36; seed += 1) {
      const expected = generateProblem(source, seededRandom(seed));
      const actual = practiceProblem(skill, seed, 2);
      assert.deepEqual(actual, expected, `${skill.grade}:${skill.id} seed ${seed}`);
      assert.ok(
        expected.answers.some((value) => validateAnswer(value, actual)),
        `${skill.id} seed ${seed}`,
      );
      assert.ok(!validateAnswer("", actual), skill.id);
      const warmup = practiceProblem(skill, seed, 1);
      assert.ok(
        warmup.answers.some((value) => validateAnswer(value, warmup)),
        `${skill.id} warm-up seed ${seed}`,
      );
    }
  }
  assert.equal(sourceSkill(1, "ratios"), null);
  assert.equal(sourceSkill(60, "add-10"), null);
});

test("a wrong try can open a genuinely different worked example", () => {
  const skill = sourceSkill(6, "ratios");
  const current = practiceProblem(skill, 3);
  const other = parallelExample(skill, current, 3, 2);
  assert.ok(other);
  assert.notEqual(other.question, current.question);
  assert.ok(other.answers.every((answer) => !validateAnswer(answer, current)));
  assert.equal(safeStrategy(current, `The answer is ${current.displayAnswer}.`), "");
  assert.equal(
    safeStrategy(current, "Use the same factor for both quantities."),
    "Use the same factor for both quantities.",
  );
  const repeated = { question: "8 + 0 = ?", answers: ["8"], displayAnswer: "8" };
  assert.equal(safeStrategy(repeated, "The result is 8."), "");
});

test("language choice translates a question without changing its math", () => {
  const skill = sourceSkill(6, "percent");
  const item = practiceProblem(skill, 65);
  assert.equal(questionIn(item, "en").text, item.question);
  assert.equal(questionIn(item, "es").lang, "es");
  const bilingual = questionIn(item, "bi");
  assert.equal(bilingual.original, item.question);
  assert.equal(bilingual.text, questionIn(item, "es").text);
});

test("versioned saves isolate learner slots, and evidence contains no typed math answers or journal entries", async () => {
  const base = { grade: 6, sourceId: "ratios", seed: 12, level: 2, count: 8 };
  const p1 = await progressFor(base, 1);
  const p2 = await progressFor(base, 2);
  const first = { ...emptyProgress(), index: 2, latestAnswer: "ignored" };
  const second = {
    ...first,
    index: 3,
    recent: [{ ok: true, supported: false, answer: "ignored" }],
  };
  await Promise.all([p1.save(first), p1.save(second), p1.saveExplanation("I scaled both terms.")]);
  const reloaded = await progressFor(base, 1);
  assert.deepEqual(reloaded.state, {
    ...emptyProgress(),
    index: 3,
    recent: [{ kind: "try", ok: true, supported: false }],
  });
  assert.equal(await reloaded.journal(), "I scaled both terms.");
  assert.deepEqual(p2.state, emptyProgress());
  assert.equal(await p2.journal(), "");
  assert.deepEqual(cleanProgress({ version: 99, index: 6 }, 8), emptyProgress());
});
