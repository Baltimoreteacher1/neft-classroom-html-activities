import assert from "node:assert/strict";
import test from "node:test";
import { MathVisualEngine, seeded } from "../engine-core.js";
import { getModel } from "../models.js";
import { THREE_MODEL_IDS, mountThreeModel } from "./registry.js";

test("the 3D showcase registry is deliberately small and stays lazy", async () => {
  assert.deepEqual(THREE_MODEL_IDS, ["fractionBar", "prismVolume", "balanceScale"]);
  assert.equal(await mountThreeModel("array", null), null);
  for (const id of THREE_MODEL_IDS) {
    const module = await import(`./${({ fractionBar: "fraction", prismVolume: "volume", balanceScale: "balance" })[id]}.js`);
    assert.equal(typeof module.mount, "function", `${id} has a mount contract`);
  }
});

test("fraction construction state stays equivalent after splitting and shading pieces", () => {
  const model = getModel("fractionBar");
  const engine = new MathVisualEngine("fractionBar", model.generate(seeded(71), 5));
  const before = engine.model.derive(engine.state, engine.params).facts.value;
  assert.deepEqual(engine.dispatch({ type: "refine", by: 2 }), { ok: true });
  const afterSplit = engine.model.derive(engine.state, engine.params).facts.value;
  assert.equal(afterSplit.eq(before), true);
  assert.deepEqual(engine.dispatch({ type: "toggle", index: 0 }), { ok: true });
  assert.equal(engine.model.verify(engine.state, engine.params).length, 0);
});

test("volume layers contain exactly the model-derived number of unit cubes", () => {
  const model = getModel("prismVolume");
  const engine = new MathVisualEngine("prismVolume", model.generate(seeded(94), 6));
  for (const [type, field] of [["setL", "l"], ["setW", "w"], ["setH", "h"]]) {
    const value = Math.min(8, engine.state[field] + 1);
    assert.deepEqual(engine.dispatch({ type, value }), { ok: true });
    const derived = engine.model.derive(engine.state, engine.params);
    assert.equal(derived.facts.cubes, engine.state.l * engine.state.w * engine.state.h);
    assert.deepEqual(engine.model.verify(engine.state, engine.params), []);
  }
});

test("equation reactor accepts equivalent transformations and refuses division by zero", () => {
  const model = getModel("balanceScale");
  const engine = new MathVisualEngine("balanceScale", model.generate(seeded(62), 8));
  const initial = engine.model.derive(engine.state, engine.params).facts.solution;
  assert.deepEqual(engine.dispatch({ type: "addConst", value: 1 }), { ok: true });
  assert.deepEqual(engine.dispatch({ type: "mul", value: 2 }), { ok: true });
  assert.deepEqual(engine.model.verify(engine.state, engine.params), []);
  assert.equal(engine.model.derive(engine.state, engine.params).facts.solution.eq(initial), true);
  const before = engine.state;
  const invalid = engine.dispatch({ type: "div", value: 0 });
  assert.equal(invalid.ok, false);
  assert.equal(engine.state, before);
  assert.match(String(invalid.reason.en), /divide.*0/i);
});
