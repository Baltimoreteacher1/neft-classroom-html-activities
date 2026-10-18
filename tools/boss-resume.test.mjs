import assert from "node:assert/strict";
import { restoreBattleProgress } from "../games/3d/boss-battle-3d/mechanics.js";

const plan = { phaseUnits: [1, 2, 3], hpForPhase: (i) => 6 + i * 2 };
const draft = { seed: 54321, turn: 4, values: ["999/2"], misses: 3, hintsOpened: 2 };
const old = { phaseIndex: 0, bossHp: 2, totalScore: 35, turn: 4 };
const restored = restoreBattleProgress({ ...old, draft }, plan);
assert.equal(restored.draft, draft);
assert.equal(restored.bossHp, 2);
assert.equal(restored.turn, 4);
assert.equal(restored.totalScore, 35);
assert.equal(restoreBattleProgress(old, plan).draft, null, "old v2 records remain valid");
const transitioned = restoreBattleProgress({ ...old, bossHp: 0, draft }, plan);
assert.equal(transitioned.phaseIndex, 1);
assert.equal(transitioned.bossHp, 8);
assert.equal(transitioned.totalScore, 60);
assert.equal(transitioned.draft, null);
assert.equal(
  restoreBattleProgress(transitioned, plan).totalScore,
  60,
  "phase-clear points are not awarded twice",
);
assert.equal(restoreBattleProgress({ ...old, phaseIndex: 2, bossHp: 0 }, plan).victory, true);
assert.equal(restoreBattleProgress({ ...old, totalScore: -1 }, plan), null);
assert.equal(restoreBattleProgress({ ...old, phaseIndex: 30 }, plan), null);
assert.equal(restoreBattleProgress({ ...old, draft: { ...draft, turn: 3 } }, plan).draft, null);
assert.equal(
  restoreBattleProgress({ ...old, draft: { ...draft, hintsOpened: 8 } }, plan).draft,
  null,
);
console.log(
  "Boss resume: compatible v2 records, exact draft/support history, interrupted phase transitions, no duplicate award, corrupt-state rejection passed.",
);
