import assert from "node:assert/strict";
import { test } from "node:test";
import { buildIntegersPlay, validateIntegers } from "./integers-opposites.js";
import { fmtSigned, integersCopy, oppositeChoices, oppositeOf } from "./integers-opposites-model.js";

test("rejects bad integer configs", () => {
  for (const bad of [null, {}, { value: 0 }, { value: 250 }, { value: -2.5 }]) {
    assert.equal(validateIntegers(bad), null, JSON.stringify(bad));
    assert.equal(buildIntegersPlay(bad), null, JSON.stringify(bad));
  }
});

test("recomputes 7-1 (Badwater Basin −86 m and opposite +86)", () => {
  const cfg = {
    value: -86,
    unit: { en: "m", es: "m" },
    zeroLabel: { en: "sea level", es: "el nivel del mar" },
    place: { en: "Badwater Basin", es: "Cuenca Badwater" },
  };
  const v = validateIntegers(cfg);
  assert.ok(v);
  assert.equal(oppositeOf(-86), 86);
  assert.equal(fmtSigned(-86), "−86");
  const copy = integersCopy(v);
  assert.equal(copy.opp, 86);
  assert.equal(copy.dist, 86);
  assert.match(copy.printSummary.en, /−86.*\+86/);
  assert.match(copy.mirror.done.es, /el total/);
  const opts = oppositeChoices(-86);
  assert.equal(opts.find((o) => o.correct).value, 86);
  const play = buildIntegersPlay(cfg);
  assert.equal(play.scenes.length, 4);
  assert.ok(play.scenes.every((s) => s.askChild?.en && s.askChild?.es));
});
