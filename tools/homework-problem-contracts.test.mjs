import assert from "node:assert/strict";
import { test } from "node:test";
import {
  matchingPairs,
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
