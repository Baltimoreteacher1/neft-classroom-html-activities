import assert from "node:assert/strict";
import { test } from "node:test";
import { buildExponentsPlay, validateExponents } from "./exponents.js";
import { exponentChoices, exponentsCopy, factorChain, powerValue } from "./exponents-model.js";

test("rejects bad exponent configs", () => {
  for (const bad of [
    null,
    {},
    { base: 1, exponent: 3 },
    { base: 2, exponent: 1 },
    { base: 2, exponent: 2 }, // 2^2 === 2*2 === 2+2
    { base: 2, exponent: 6 },
    { base: 4, exponent: 4 },
    { base: 11, exponent: 2 },
    { base: 2.5, exponent: 3 },
  ]) {
    assert.equal(validateExponents(bad), null, JSON.stringify(bad));
    assert.equal(buildExponentsPlay(bad), null, JSON.stringify(bad));
  }
});

test("recomputes every stated number for 6-3 (2^4 = 16)", () => {
  const v = validateExponents({ base: 2, exponent: 4 });
  assert.ok(v);
  assert.equal(powerValue(2, 4), 16);
  assert.equal(factorChain(2, 4), "2 × 2 × 2 × 2");
  const copy = exponentsCopy(v);
  assert.equal(copy.val, 16);
  assert.equal(copy.prod, 8);
  assert.match(copy.printSummary.en, /2\^4.*16.*8/);
  assert.match(copy.printSummary.es, /2\^4.*16.*8/);
  assert.match(copy.build.say.es, /el total/);
  const opts = exponentChoices(2, 4);
  assert.equal(opts.find((o) => o.correct).value, 16);
  assert.ok(opts.some((o) => o.kind === "times" && o.value === 8));
  const play = buildExponentsPlay({ base: 2, exponent: 4 });
  assert.equal(play.scenes.length, 4);
  assert.ok(play.scenes.every((s) => s.askChild?.en && s.askChild?.es));
});
