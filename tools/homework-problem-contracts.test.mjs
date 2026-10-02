import assert from "node:assert/strict";
import { test } from "node:test";
import {
  answerKeyLines,
  matchingPairs,
  normalizeDragSort,
  questionGuide,
  spanishChoiceFeedback,
  tableModel,
} from "../scripts/lib/homework-problems.mjs";

test("left/right matching keeps stable answer values and translated labels", () => {
  assert.deepEqual(matchingPairs({ pairs: [{ left: "one", right: "1", leftEs: "uno" }] }), [
    { term: "one", match: "1", termEs: "uno", matchEs: "" },
  ]);
});
test("middle answer column stays under Quotient", () => {
  const model = tableModel({
    columns: ["Expression", "Quotient", "Pattern"],
    rows: [{ given: "2 ÷ 1/2", answer: "4", pattern: "increases" }],
  });
  assert.equal(model.rows[0][1].correctValue, "4");
  assert.equal(model.rows[0][1].isEditable, true);
  assert.equal(model.rows[0][2].val, "increases");
});
test("semantic answer fields become practice; free explanations use self review", () => {
  const m = tableModel({
    columns: ["Problem", "Equation", "Solution"],
    rows: [{ problem: "A", equation: "4x=12", solution: "3" }],
  });
  assert.equal(m.rows[0][2].isEditable, true);
  const open = tableModel({
    columns: ["Question", "Rewrite"],
    rows: [{ question: "A", rewrite: "Many valid questions" }],
  });
  assert.equal(open.rows[0][1].selfReview, true);
});
test("question help and Spanish retry use authored hints", () => {
  const it = {
    hints: ["Multiply the factors."],
    hintsEs: ["Multiplica los factores."],
    choices: ["A", "B"],
    correctIndex: 1,
  };
  assert.equal(questionGuide(it).en, it.hints[0]);
  assert.match(spanishChoiceFeedback(it)[0], /Multiplica/);
  assert.equal(spanishChoiceFeedback(it).length, 2);
});

// ── Family answer key: every problem shape yields lines a parent can check ──

test("answer key: multiple choice names the correct option, not a letter", () => {
  const key = answerKeyLines({
    type: "multiple-choice",
    choices: ["3", "6", "9"],
    choicesEs: ["tres", "seis", "nueve"],
    correctIndex: 1,
    explanation: "Double it.",
    explanationEs: "Duplícalo.",
  });
  assert.deepEqual(key.lines, [{ en: "6", es: "seis" }]);
  assert.deepEqual(key.note, { en: "Double it.", es: "Duplícalo." });
});
test("answer key: matching lists every pair", () => {
  const key = answerKeyLines({
    type: "matching-game",
    pairs: [
      { term: "ratio", match: "3:2", termEs: "razón" },
      { left: "rate", right: "5 per 1" },
    ],
  });
  assert.deepEqual(key.lines, [
    { en: "ratio → 3:2", es: "razón → 3:2" },
    { en: "rate → 5 per 1", es: "" },
  ]);
});
test("answer key: drag order numbers the correct order; drag sort groups by category", () => {
  const order = answerKeyLines({
    type: "drag-sort",
    items: ["Subtract 4", "Divide by 2"],
    correctOrder: ["Divide by 2", "Subtract 4"],
    itemsEs: ["Resta 4", "Divide entre 2"],
  });
  assert.deepEqual(order.lines, [
    { en: "1. Divide by 2", es: "1. Divide entre 2" },
    { en: "2. Subtract 4", es: "2. Resta 4" },
  ]);
  const sort = answerKeyLines({
    type: "drag-sort",
    categories: ["Prime", "Composite"],
    items: [
      { text: "7", category: "prime" },
      { text: "9", category: "composite" },
      { text: "11", category: "prime" },
    ],
  });
  assert.equal(normalizeDragSort({ categories: ["Prime"], items: [] }).kind, "sort");
  assert.deepEqual(sort.lines, [
    { en: "Prime: 7, 11", es: "" },
    { en: "Composite: 9", es: "" },
  ]);
});
test("answer key: fill table names row, column and value for each editable cell", () => {
  const key = answerKeyLines(
    {
      type: "fill-table",
      columns: ["Expression", "Quotient"],
      rows: [{ given: "2 ÷ 1/2", answer: "4" }],
    },
    { translate: (en, authored) => authored || (en === "Quotient" ? "Cociente" : "") },
  );
  assert.deepEqual(key.lines, [{ en: "2 ÷ 1/2 · Quotient: 4", es: "2 ÷ 1/2 · Cociente: 4" }]);
});
test("answer key: error analysis gives the step and the correct work", () => {
  const key = answerKeyLines({
    type: "error-analysis",
    errorStep: 1,
    correctWork: "12 ÷ 3 = 4",
    explanation: "Divide, do not subtract.",
  });
  assert.deepEqual(key.lines, [
    { en: "The mistake is in Step 2.", es: "El error está en el Paso 2." },
    { en: "Correct work: 12 ÷ 3 = 4", es: "" },
  ]);
  assert.equal(key.note.en, "Divide, do not subtract.");
});
test("answer key: open response prefers modelAnswer and always leaves a note", () => {
  const authored = answerKeyLines({
    type: "open-response",
    modelAnswer: "The ratio is 3:2 because…",
    keywords: ["ratio"],
  });
  assert.equal(authored.lines[0].en, "The ratio is 3:2 because…");
  assert.equal(authored.lines[1].en, "A strong answer uses: ratio.");
  const bare = answerKeyLines({ type: "open-response", prompt: "Explain." });
  assert.deepEqual(bare.lines, []);
  assert.match(bare.note.en, /Answers will vary/);
});
