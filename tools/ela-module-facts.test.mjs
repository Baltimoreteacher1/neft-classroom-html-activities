// The module-line splitter, the lesson-range reader and the lesson->week placement (tools/lib/ela-module-facts.mjs), on fixtures.
import assert from "node:assert/strict";
import test from "node:test";
import { lessonRange, placeLessons, splitModuleLine } from "./lib/ela-module-facts.mjs";

test("a module line with a question splits into title, question and writing type", () => {
  const s = splitModuleLine("Outer Space How do people learn about space? Opinion Writing");
  assert.equal(s.title, "Outer Space");
  assert.equal(s.essential_question, "How do people learn about space?");
  assert.equal(s.writing, "Opinion Writing");
});

test("a dash between title and question is not part of the title", () => {
  const s = splitModuleLine(
    "The American West- What was life like in the West for early Americans? Informative Writing",
  );
  assert.equal(s.title, "The American West");
  assert.equal(s.writing, "Informative Writing");
});

test("a module line with no question is only a title", () => {
  const s = splitModuleLine("Language & Power");
  assert.equal(s.title, "Language & Power");
  assert.equal(s.essential_question, null);
});

test("a title that is itself a question is not split", () => {
  const s = splitModuleLine("What is Love?");
  assert.equal(s.title, null);
  assert.equal(s.essential_question, null);
  assert.equal(s.line, "What is Love?");
});

test("an empty line gives nothing", () => assert.equal(splitModuleLine(null), null));

test("a week's lesson numbers keep only the longest consecutive run", () => {
  assert.deepEqual(lessonRange([1, 2, 3, 4, 20]), [1, 4]);
  assert.deepEqual(lessonRange([14, 15, 16]), [14, 16]);
  assert.equal(lessonRange([5]), null);
  assert.equal(lessonRange([2, 9, 20]), null);
});

const weeks = [1, 2, 3, 4].map((n) => ({
  n,
  terms: ["", "ocean tide", "reef coral", "pollution runoff"][n - 1] || "filler",
}));
const v = (term, new_or_review = "new") => ({ term, new_or_review });
const lessons = [
  { id: "l1", sequence: 1, vocab: [v("filler")] },
  { id: "l2", sequence: 2, vocab: [v("tide")] },
  { id: "l3", sequence: 3, vocab: [v("coral reef")] },
  { id: "l4", sequence: 4, vocab: [v("runoff")] },
];

test("a lesson lands in the week whose words it teaches, and says which words", () => {
  const placed = placeLessons({ lessons, weeks, eligible: [1, 2, 3, 4] });
  const by = Object.fromEntries(placed.map((p) => [p.id, p]));
  assert.equal(by.l2.week, 2);
  assert.equal(by.l2.how, "terms");
  assert.deepEqual(by.l2.terms, ["tide"]);
  assert.equal(by.l3.week, 3);
  assert.equal(by.l4.week, 4);
});

test("weeks never go backwards as lessons advance", () => {
  const reversed = [...lessons].reverse().map((l, i) => ({ ...l, sequence: i + 1 }));
  const placed = placeLessons({ lessons: reversed, weeks, eligible: [1, 2, 3, 4] });
  for (let i = 1; i < placed.length; i++) assert.ok(placed[i].week >= placed[i - 1].week);
});

test("lessons only land in eligible weeks", () => {
  const placed = placeLessons({ lessons, weeks, eligible: [3, 4] });
  for (const p of placed) assert.ok([3, 4].includes(p.week));
});

test("a lesson no week uses keeps the lessons' order and says so", () => {
  const placed = placeLessons({
    lessons: [{ id: "x", sequence: 1, vocab: [v("zebra")] }],
    weeks,
    eligible: [1, 2, 3, 4],
  });
  assert.equal(placed[0].how, "order");
  assert.equal(placed[0].terms, undefined);
});

test("nothing to place gives nothing", () => {
  assert.deepEqual(placeLessons({ lessons: [], weeks, eligible: [1] }), []);
  assert.deepEqual(placeLessons({ lessons, weeks, eligible: [] }), []);
});
