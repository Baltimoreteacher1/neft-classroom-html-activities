import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isExponentProductBug, powerValue } from "../../../engine/core/publisher-models.js";
import {
  GAME_SHELL,
  checkGameMove,
  exponentBugIsProduct,
  shellProgress,
  studentFacingMiss,
} from "./game-shell-data.mjs";

const PLAYABLE = [
  "u1-decimal-dash",
  "u1-factor-frenzy",
  "u2-fraction-frenzy",
  "u3-ratio-rush",
  "u4-percent-power",
  "u5-area-attack",
  "u6-expression-express",
  "u6-power-up-arcade",
  "u7-equation-quest",
  "u8-data-dash",
  "u9-coordinate-quest",
  "u10-volume-blast",
  "placement-quest",
  "practice-arcade",
];

test("every playable cabinet has an objective, one step, keys, and a miss line", () => {
  assert.deepEqual(Object.keys(GAME_SHELL).sort(), [...PLAYABLE].sort());
  for (const id of PLAYABLE) {
    const spec = GAME_SHELL[id];
    assert.ok(spec.objective.length > 20, id);
    assert.ok(spec.tutorial.length > 20, id);
    assert.match(spec.keys, /Enter|Tab|Arrow|Space/i, id);
    assert.match(spec.miss, /may indicate/i, id);
    assert.doesNotMatch(spec.miss, /the answer is/i, id);
  }
});

test("a generic miss is replaced and a specific one is kept", () => {
  const generic = studentFacingMiss("u3-ratio-rush", "Not quite — try again!");
  assert.match(generic, /both numbers/);
  const specific = "2:3 is not equivalent to 2:5. Whatever you multiply the top by, do the SAME to the bottom.";
  assert.equal(studentFacingMiss("u3-ratio-rush", specific), specific);
});

test("progress counts a repeated message once and stores no name", () => {
  const once = shellProgress(null, { id: "u3-ratio-rush", message: "miss", correct: false });
  const twice = shellProgress(once, { id: "u3-ratio-rush", message: "miss", correct: false });
  assert.equal(twice.attempts, 1);
  assert.equal(twice.misses, 1);
  const solved = shellProgress(twice, { id: "u3-ratio-rush", message: "Both parts matched.", correct: true });
  assert.equal(solved.solved, 1);
  assert.equal("name" in solved, false);
});

test("exponent, ratio, and equation checks use the shared models", () => {
  assert.equal(powerValue(3, 2).value, 9);
  assert.equal(isExponentProductBug(3, 2, 6), true);
  assert.equal(exponentBugIsProduct(3, 2, 6), true);
  const power = checkGameMove("u6-power-up-arcade", { base: 3, exponent: 2, answer: 6 });
  assert.equal(power.ok, false);
  assert.equal(power.bug, true);
  assert.match(power.studentMessage, /may indicate/);
  assert.doesNotMatch(power.studentMessage, /\b9\b/);
  const ratio = checkGameMove("u3-ratio-rush", { a: 2, b: 3, factor: 4, x: 8, y: 12 });
  assert.equal(ratio.ok, true);
  const added = checkGameMove("u3-ratio-rush", { a: 2, b: 3, factor: 4, x: 6, y: 7 });
  assert.equal(added.ok, false);
  const equation = checkGameMove("u7-equation-quest", {
    equation: { p: 2, q: 3, r: 11 },
    op: { type: "sub", k: 3 },
    claimed: 4,
  });
  assert.equal(equation.ok, true);
  const wrong = checkGameMove("u7-equation-quest", {
    equation: { p: 2, q: 3, r: 11 },
    op: { type: "sub", k: 3 },
    claimed: 8,
  });
  assert.equal(wrong.ok, false);
  assert.match(wrong.studentMessage, /both sides/);
});

test("the shared shell is wired into the cabinet loader and the ten phaser games", () => {
  const studio = readFileSync(new URL("./phaser-studio.js", import.meta.url), "utf8");
  const tools = readFileSync(new URL("./cabinet-tools.js", import.meta.url), "utf8");
  assert.match(studio, /game-shell\.js/);
  assert.match(studio, /EWLGameShell\.observe/);
  assert.match(tools, /game-shell\.js/);
  const power = readFileSync(new URL("../u6-power-up-arcade/index.html", import.meta.url), "utf8");
  const arcade = readFileSync(new URL("../practice-arcade/index.html", import.meta.url), "utf8");
  assert.match(power, /game-shell\.js/);
  assert.match(arcade, /may indicate a different operation/);
});
