import assert from "node:assert/strict";
import { test } from "node:test";
import { buildOrderOpsPlay, validateOrderOps } from "./order-of-operations.js";
import { evalOrderOps, orderOpsChoices, orderOpsCopy } from "./order-of-operations-model.js";

test("rejects invalid order-of-operations configs", () => {
  for (const bad of [
    null,
    {},
    { a: 0, b: 4, base: 2, exp: 2, d: 1 },
    { a: 3, b: 1, base: 2, exp: 2, d: 0 },
    { a: 1, b: 2, base: 2, exp: 2, d: 20 }, // negative total
  ]) {
    assert.equal(validateOrderOps(bad), null, JSON.stringify(bad));
    assert.equal(buildOrderOpsPlay(bad), null, JSON.stringify(bad));
  }
});

test("recomputes 6-4 (3 + 4 × 2^2 − 6 = 13)", () => {
  const cfg = { a: 3, b: 4, base: 2, exp: 2, d: 6 };
  const v = validateOrderOps(cfg);
  assert.ok(v);
  const r = evalOrderOps(v);
  assert.equal(r.pow, 4);
  assert.equal(r.prod, 16);
  assert.equal(r.total, 13);
  assert.equal(r.leftToRight, 22);
  const copy = orderOpsCopy(v);
  assert.match(copy.printSummary.en, /13/);
  assert.match(copy.printSummary.es, /13/);
  const opts = orderOpsChoices(v);
  assert.equal(opts.find((o) => o.correct).value, 13);
  assert.ok(opts.some((o) => o.kind === "ltr" && o.value === 22));
  const play = buildOrderOpsPlay(cfg);
  assert.equal(play.scenes.length, 4);
  assert.ok(play.scenes.every((s) => s.askChild?.en && s.askChild?.es));
});
