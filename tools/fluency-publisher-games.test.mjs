import assert from "node:assert/strict";
import {
  buildHasValidArea,
  numberPuzzleBoard,
  rallyTask,
  worldBuilderTask,
} from "../math/fluency-lab/publisher-games.js";

for (let grade = 0; grade <= 8; grade += 1) {
  for (let round = 0; round < 5; round += 1) {
    const building = worldBuilderTask(grade, round);
    const plans = [];
    for (let rows = 1; rows <= building.maxSide; rows += 1) {
      for (let columns = 1; columns <= building.maxSide; columns += 1) {
        if (buildHasValidArea(rows, columns, building)) plans.push([rows, columns]);
      }
    }
    assert.ok(plans.length, `grade ${grade} builder challenge ${round} has a solution`);
    assert.ok(plans.some(([rows, columns]) => rows * columns === building.target));

    const puzzle = numberPuzzleBoard(grade, round);
    assert.ok(puzzle.pairs.length >= 2, `grade ${grade} puzzle ${round} has multiple valid pairs`);
    for (const [a, b] of puzzle.pairs) {
      assert.ok(puzzle.values.includes(a) && puzzle.values.includes(b));
      assert.equal(puzzle.op === "+" ? a + b : a * b, puzzle.target);
    }

    const rally = rallyTask(grade, round);
    assert.equal(rally.choices[rally.correctIndex], rally.expression);
    assert.equal(rally.factor * rally.n + rally.add, rally.answer);
    assert.equal(new Set(rally.choices).size, 3);
  }
}

console.log(
  "Publisher game math: 225 grade-round tasks passed, including builder solutions, multiple number pairs, and rally route answers.",
);
