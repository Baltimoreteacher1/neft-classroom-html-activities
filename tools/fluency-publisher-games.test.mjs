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
    if (building.optimize) {
      const fence = (plan) => 2 * (plan[0] + plan[1]);
      assert.equal(
        Math.min(...plans.map(fence)),
        building.minFence,
        `grade ${grade} capstone asks for the genuinely smallest fence`,
      );
    }

    const puzzle = numberPuzzleBoard(grade, round);
    assert.ok(puzzle.pairs.length >= 2, `grade ${grade} puzzle ${round} has multiple valid pairs`);
    for (const [a, b] of puzzle.pairs) {
      assert.ok(puzzle.values.includes(a) && puzzle.values.includes(b));
      assert.equal(puzzle.op === "+" ? a + b : puzzle.op === "×" ? a * b : a - b, puzzle.target);
    }

    const rally = rallyTask(grade, round);
    assert.ok(["add", "multiply-add", "distributive"].includes(rally.type));
    assert.equal(rally.choices[rally.correctIndex], rally.routeCorrect);
    assert.equal(
      rally.type === "add"
        ? rally.n + rally.add
        : rally.type === "distributive"
          ? rally.factor * (rally.n + rally.add)
          : rally.factor * rally.n + rally.add,
      rally.answer,
    );
    if (rally.type === "distributive") {
      assert.equal(
        rally.factor * rally.n + rally.factor * rally.add,
        rally.answer,
        "the expanded route is equivalent to the factored expression",
      );
    }
    assert.equal(new Set(rally.choices).size, 3);
  }
}

console.log(
  "Publisher game math: 225 grade-round tasks passed, including optimal-area builds, multiple add/multiply/subtract pairs, and grade-differentiated rally expressions.",
);
