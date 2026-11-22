// Reading Room content quality (ratchet) and answer/feedback logic.
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  evidenceParagraphs,
  gradeActivity,
  hintFor,
  nextAnswerState,
  partialCount,
  responseEvidence,
  splitSentences,
} from "../access-practice-lab/src/reading-room-check.js";
import {
  keyIsLongestShare,
  keyPositionShare,
  lessonQualityIssues,
  PRAISE_OPENER,
} from "../access-practice-lab/src/reading-room-quality.js";

const dir = "access-practice-lab/content/reading-room/";
const lessons = JSON.parse(fs.readFileSync(`${dir}lessons.json`, "utf8")).lessons;
const debt = new Set(JSON.parse(fs.readFileSync(`${dir}quality-debt.json`, "utf8")).lessons);

// Ratchet: clean lessons stay clean, listed lessons are removed from the list once fixed.
for (const l of lessons) {
  const issues = lessonQualityIssues(l);
  if (debt.has(l.id))
    assert.ok(issues.length, `${l.id} is clean now: remove it from quality-debt.json`);
  else assert.equal(issues.length, 0, `quality issues:\n${issues.join("\n")}`);
}
for (const id of debt)
  assert.ok(
    lessons.some((l) => l.id === id),
    `quality-debt lists unknown lesson ${id}`,
  );

// Accidental clues in aggregate: the key is not usually the longest option, and not usually in one slot.
const longest = keyIsLongestShare(lessons);
assert.ok(
  longest.share < 0.4,
  `key is the longest option in ${(longest.share * 100).toFixed(0)}% of questions`,
);
const pos = keyPositionShare(lessons);
assert.ok(
  pos.maxShare < 0.4,
  `key sits in one slot in ${(pos.maxShare * 100).toFixed(0)}% of questions`,
);

// Every evidenceIds/hint pair is resolvable; located evidence never points at a missing paragraph.
for (const l of lessons) {
  const ids = new Set(l.paragraphs.map((p) => p.id));
  for (const a of l.activities)
    for (const id of evidenceParagraphs(a, l))
      assert.ok(ids.has(id), `${l.id}/${a.id}: evidence ${id}`);
}

// Rules detect what they claim to.
assert.ok(PRAISE_OPENER.test("Well done! The order words show the steps."));
assert.ok(!PRAISE_OPENER.test("The order words first, next and finally show the steps."));
const bad = {
  id: "x",
  paragraphs: [
    { id: "p1", text: "t", guidingQuestion: "What detail in this section connects to cause?" },
  ],
  activities: [
    {
      id: "a",
      type: "choice",
      rationale: "Great job, that is right because the barrel filled up.",
      answerId: "a",
      choices: [
        { id: "a", text: "Same" },
        { id: "b", text: "same", why: "" },
        { id: "c", text: "All of the above" },
      ],
    },
  ],
};
const found = lessonQualityIssues(bad).join("\n");
for (const re of [
  /generic template/,
  /opens with praise/,
  /duplicate answer options/,
  /no teaching note/,
  /depends on option order/,
])
  assert.match(found, re);

// Grading and tiered feedback state.
const choice = {
  id: "q",
  type: "choice",
  skill: "s",
  answerId: "b",
  choices: [{ id: "a" }, { id: "b" }, { id: "c" }],
};
assert.equal(gradeActivity(choice, { value: "b" }), true);
let st = nextAnswerState(choice, { value: "a" }, "practice");
assert.deepEqual(
  [st.correct, st.attempts, st.revealed],
  [false, 1, false],
  "first miss keeps the explanation closed",
);
st = nextAnswerState(choice, { ...st, value: "c" }, "practice");
assert.deepEqual(
  [st.correct, st.attempts, st.revealed],
  [false, 2, true],
  "second miss opens the explanation",
);
st = nextAnswerState(choice, { value: "b" }, "practice");
assert.equal(st.revealed, true);
const order = {
  id: "o",
  type: "order",
  items: [{ id: "x" }, { id: "y" }, { id: "z" }],
  answerOrder: ["y", "z", "x"],
};
assert.equal(gradeActivity(order, { values: [2, 0, 1] }), true);
assert.deepEqual(partialCount(order, { values: [2, 1, 0] }), { right: 1, total: 3 });
const multi = { id: "m", type: "multi", answerIds: ["a", "b"] };
assert.deepEqual(partialCount(multi, { values: ["a", "c", "d"] }), {
  right: 1,
  total: 2,
  picked: 3,
});
assert.equal(
  gradeActivity({ id: "e", type: "evidence", answerIds: ["p2"] }, { values: ["p2"] }),
  true,
);

// Hints point somewhere but never hand over the answer text.
const lesson = {
  paragraphs: [
    { id: "p1", text: "Rain filled the barrel behind the school roof." },
    { id: "p2", text: "Students measured the water with a ruler every morning." },
  ],
};
const q = {
  id: "h",
  type: "choice",
  answerId: "a",
  choices: [
    { id: "a", text: "Students measured water every morning" },
    { id: "b", text: "Rain stopped" },
  ],
};
assert.deepEqual(evidenceParagraphs(q, lesson), ["p2"]);
assert.match(hintFor(q, lesson).text, /paragraph 2/);
assert.equal(hintFor({ ...q, hint: "Check the second paragraph." }, lesson).authored, true);

// Open-response check counts only passage words the prompt did not hand over.
const r = responseEvidence(
  lesson,
  "What did students measure?",
  "They measured the water with a ruler because rain filled the barrel.",
);
assert.ok(r.used.includes("ruler") && r.used.includes("barrel") && !r.used.includes("measured"));
assert.deepEqual(splitSentences('One. Two? "Three!" Four'), ["One.", "Two?", '"Three!"', "Four"]);
console.log(
  `PASS reading-room quality: ${lessons.length} lessons, ${debt.size} on the debt list, key longest ${(longest.share * 100).toFixed(0)}%, max slot ${(pos.maxShare * 100).toFixed(0)}%`,
);
// Whole-text questions do not get a guessed evidence paragraph.
assert.deepEqual(
  evidenceParagraphs(
    {
      id: "m",
      type: "choice",
      skill: "Main idea",
      prompt: "What is this mostly about?",
      answerId: "a",
      choices: [{ id: "a", text: "Students measured water every morning" }],
    },
    lesson,
  ),
  [],
);
