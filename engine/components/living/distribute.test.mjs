// distribute.test.mjs — the living "3(x + 4)" play refuses configs it cannot
// draw correctly, and builds its seven scenes from the lesson's own numbers.
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildDistributePlay, validateDistribute } from "./distribute.js";

test("rejects numbers the stage cannot draw", () => {
  for (const bad of [{}, { a: 1, c: 4 }, { a: 6, c: 4 }, { a: 3, c: 0 }, { a: 3, c: 7 }, { a: 2.5, c: 3 }, { a: "3", c: "x" }]) {
    assert.equal(validateDistribute(bad), null, JSON.stringify(bad));
    assert.equal(buildDistributePlay(bad), null, JSON.stringify(bad));
  }
});

test("uses authored presets for the reverse and transfer scenes", () => {
  const v = validateDistribute({ a: 3, c: 4, presets: [{ a: 3, c: 4 }, { a: 2, c: 5 }, { a: 4, c: 3 }] });
  assert.deepEqual(v, { a: 3, c: 4, reverse: { a: 2, c: 5 }, transfer: { a: 4, c: 3 } });
});

test("falls back to valid presets that differ from the lesson's own expression", () => {
  for (let a = 2; a <= 5; a++) {
    for (let c = 1; c <= 6; c++) {
      const v = validateDistribute({ a, c });
      for (const p of [v.reverse, v.transfer]) {
        assert.ok(p.a >= 2 && p.a <= 5 && p.c >= 1 && p.c <= 6);
        assert.ok(!(p.a === a && p.c === c), `preset repeats ${a}(x + ${c})`);
      }
    }
  }
});

test("builds seven scenes whose static text states the right expansion", () => {
  const play = buildDistributePlay({ a: 3, c: 4 });
  assert.equal(play.scenes.length, 7);
  assert.deepEqual(
    play.scenes.map((s) => s.id),
    ["situate", "predict", "regroup", "area", "test", "reverse", "transfer"],
  );
  assert.match(play.printSummary.en, /3\(x \+ 4\) = 3x \+ 12/);
  assert.match(play.printSummary.es, /3\(x \+ 4\) = 3x \+ 12/);
  // Gated scenes are the ones that ask the student to act.
  assert.deepEqual(
    play.scenes.filter((s) => s.gate).map((s) => s.id),
    ["predict", "regroup", "test", "reverse"],
  );
});
