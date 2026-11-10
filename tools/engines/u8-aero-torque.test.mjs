// Aero-Torque round generators, checked independently of the game's own judge.
// 300 seeds x 4 levels: every equation has the stated solution, no round starts
// solved, answers fit the controls, and judgeField accepts exactly the field
// that a brute-force probe sweep says holds the solution set.
import assert from "node:assert/strict";
import { rng } from "../../math/games/engines/core/math.js";
import {
  judgeField,
  makeEquation,
  makeInequality,
  satisfies,
} from "../../math/games/engines/u8-aero-torque/math.js";

let eqs = 0;
let ineqs = 0;
for (let seed = 1; seed <= 300; seed++) {
  for (let level = 1; level <= 4; level++) {
    const next = rng(seed * 31 + level);
    const eq = makeEquation(level, next);
    const lhs = eq.kind === "add" ? eq.x + eq.a : eq.a * eq.x;
    assert.equal(lhs, eq.b, `seed ${seed} L${level}: ${JSON.stringify(eq)} is false at x`);
    assert.ok(
      eq.x > 0 && eq.x <= 30 && Number.isInteger(eq.x * 2),
      `x fits the half-step dial: ${eq.x}`,
    );
    assert.ok(eq.kind === "mul" ? eq.a >= 2 : eq.a >= 1, "never already isolated");
    if (level === 1) assert.equal(eq.kind, "add");
    if (level === 2) assert.equal(eq.kind, "mul");
    eqs++;

    const q = makeInequality(level, next);
    assert.ok(
      q.boundary >= 0 && q.boundary <= 20 && Number.isInteger(q.boundary),
      "boundary on the deck",
    );
    // Independent truth: sweep probes at quarter steps across the deck.
    let right = null;
    for (let v = 0; v <= 20; v += 0.25) {
      if (v === q.boundary) continue;
      const truth = satisfies(q, v);
      const side = v > q.boundary;
      if (truth) right = right === null ? side : right;
      if (truth) assert.equal(side, right, `solutions on both sides of ${q.boundary}`);
    }
    assert.notEqual(right, null, "inequality has solutions on the deck");
    const closed = satisfies(q, q.boundary);
    assert.equal(
      judgeField(q, q.boundary, right, closed),
      "ok",
      `judge rejects the true field: ${JSON.stringify(q)}`,
    );
    assert.notEqual(
      judgeField(q, q.boundary, !right, closed),
      "ok",
      "judge accepts a reversed field",
    );
    assert.notEqual(
      judgeField(q, q.boundary, right, !closed),
      "ok",
      "judge accepts the wrong node",
    );
    assert.equal(judgeField(q, q.boundary + 1, right, closed), "boundaryHigh");
    assert.equal(judgeField(q, q.boundary - 1, right, closed), "boundaryLow");
    // The game parks the boundary at 17 or 2; it must never start on the answer.
    assert.notEqual(q.boundary <= 10 ? 17 : 2, q.boundary, "start position is the answer");
    ineqs++;
  }
}
console.log(`ok u8-aero-torque: ${eqs} equations, ${ineqs} inequalities checked independently`);
