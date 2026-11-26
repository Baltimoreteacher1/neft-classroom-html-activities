import assert from "node:assert/strict";
import { test } from "node:test";
import { buildParallelogramPlay, validateParallelogram } from "./parallelogram-area.js";
import { paraArea, paraChoices, paraCopy } from "./parallelogram-area-model.js";

test("rejects bad parallelogram configs", () => {
  for (const bad of [
    null,
    {},
    { base: 2, height: 5, slant: 6 },
    { base: 10, height: 7, slant: 6 }, // slant <= height
    { base: 10, height: 1, slant: 3 },
  ]) {
    assert.equal(validateParallelogram(bad), null, JSON.stringify(bad));
    assert.equal(buildParallelogramPlay(bad), null, JSON.stringify(bad));
  }
});

test("recomputes 5-1 (base 14, height 9, slant 10 → area 126)", () => {
  const cfg = { base: 14, height: 9, slant: 10, unit: { en: "ft", es: "ft" } };
  const v = validateParallelogram(cfg);
  assert.ok(v);
  assert.equal(paraArea(v), 126);
  const copy = paraCopy(v);
  assert.equal(copy.area, 126);
  assert.equal(copy.wrongSlant, 140);
  assert.match(copy.printSummary.en, /126/);
  assert.match(copy.morph.say.es, /el total/);
  const opts = paraChoices(v);
  assert.equal(opts.find((o) => o.correct).value, 126);
  assert.ok(opts.some((o) => o.kind === "slant" && o.value === 140));
  const play = buildParallelogramPlay(cfg);
  assert.equal(play.scenes.length, 4);
  assert.ok(play.scenes.every((s) => s.askChild?.en && s.askChild?.es));
});
