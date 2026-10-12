// Pins the Fluency Lab open items: story problems, mixed-operation skills, less zero/one filler, division steps
// that ask before they tell, either-direction percent change, and prerequisites for mixed skills.
import assert from "node:assert/strict";

const { ALL_SKILLS, generateProblem, getSkill, opsOf, resolveOp, seededRandom } = await import(
  "../math/fluency-lab/problem-bank.js"
);
const { storyFor } = await import("../math/fluency-lab/story-problems.js");
const { likelyMistake } = await import("../math/fluency-lab/mistake-notes.js");
const { prerequisites } = await import("../math/fluency-lab/tutor-engine.js");

const sample = (skill, n = 400, seed = 7) => {
  const rng = seededRandom(seed);
  return Array.from({ length: n }, () => generateProblem(skill, rng));
};
const symbols = (items) =>
  new Set(items.map((item) => item.question.match(/ ([+−×÷]) /)?.[1]).filter(Boolean));

// Mixed skills practise both operations their titles promise.
assert.deepEqual([...symbols(sample(getSkill(3, "add-sub-1000")))].sort(), ["+", "−"]);
assert.deepEqual(opsOf({ op: "muldiv" }), ["mul", "div"]);
assert.deepEqual(opsOf({ op: "add" }), ["add"]);
assert.equal(resolveOp({ op: "add" }, Math.random).op, "add");
const resolved = new Set(
  Array.from({ length: 50 }, (_, i) => resolveOp({ op: "addsub" }, seededRandom(i)).op),
);
assert.deepEqual([...resolved].sort(), ["add", "sub"]);

// Percent change goes both ways.
const changes = sample(getSkill(7, "percent-change"), 200).map((item) => item.question);
assert.ok(
  changes.some((q) => /increase|more|raise|up/i.test(q)) &&
    changes.some((q) => /decrease|off|discount|down/i.test(q)),
  "percent change shows both directions",
);

// Zero/one filler is a minority, not gone.
for (const skill of ALL_SKILLS.filter((s) => s.generator === "fact" && s.grade <= 2)) {
  const filler = sample(skill).filter((item) =>
    /(^| )0 [+−×]|[+−×] 0 =|1 × | × 1 =/.test(item.question),
  ).length;
  assert.ok(filler / 400 < 0.2, `${skill.grade}:${skill.id} filler ${filler}/400`);
}

// Division steps ask "divisor × ? = dividend" before any step states the quotient.
for (const item of sample(getSkill(3, "division-facts"), 200)) {
  assert.match(item.steps[0], /× \? =/, `first step asks: ${item.steps[0]}`);
}

// Story problems keep the numbers and answer, open with a clue, and leave the bare expression for tools.
let stories = 0;
const rng = seededRandom(11);
for (const skill of ALL_SKILLS.filter((s) => s.generator === "fact")) {
  for (const item of sample(skill, 60)) {
    const story = storyFor(item, rng);
    if (!story) continue;
    stories += 1;
    assert.equal(story.expr, item.question);
    assert.deepEqual(story.answers, item.answers);
    assert.ok(story.story && !/= \?$/.test(story.question), story.question);
    assert.equal(story.steps.length, (item.steps || []).length + 1);
    assert.ok(
      !story.steps[0].includes(String(item.answers[0])),
      `clue leaks answer: ${story.steps[0]}`,
    );
    assert.equal(storyFor(story, rng), null, "a story is never re-wrapped");
  }
}
assert.ok(stories > 200, `stories generated: ${stories}`);
assert.equal(storyFor({ kind: "number", question: "x + 3 = 7", answers: ["4"] }, rng), null);

// Wrong-answer notes still read the expression behind a story.
const story = storyFor(
  { kind: "number", question: "38 + 25 = ?", answers: ["63"], steps: [] },
  () => 0,
);
assert.ok(story);
assert.equal(
  likelyMistake(story, "53"),
  likelyMistake({ kind: "number", question: "38 + 25 = ?", answers: ["63"] }, "53"),
);

// Mixed skills keep (and gain) prerequisite links.
const prereq = (grade, id) => prerequisites(getSkill(grade, id)).map((s) => `${s.grade}:${s.id}`);
assert.deepEqual(prereq(3, "add-sub-1000"), ["2:add-1000"]);
assert.deepEqual(prereq(6, "decimal-ops"), ["5:decimal-mul"]);
assert.deepEqual(prereq(7, "fraction-ops"), ["5:fraction-add"]);

console.log(`fluency open items: ok (${stories} stories)`);
