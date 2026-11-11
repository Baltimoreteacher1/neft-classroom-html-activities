import assert from "node:assert/strict";
import test from "node:test";
import {
  essentialQuestion,
  LEGACY_TAB,
  materialsFor,
  nextStep,
  restoreTab,
  STAGES,
  stageMinutes,
  totalMinutes,
  variantOf,
} from "./small-group-pathway.js";

test("five stages, 15–20 minutes for every variant", () => {
  assert.deepEqual(
    STAGES.map((s) => s.label),
    ["Launch & Notice", "Build Understanding", "Solve Together", "Your Turn", "Prove It"],
  );
  for (const v of ["group1", "group2", "catchup"]) {
    const t = totalMinutes(v);
    assert.ok(t >= 15 && t <= 20, `${v} totals ${t}`);
    assert.equal(stageMinutes(v).length, 5);
  }
});

test("retired Apply tab restores onto Prove It", () => {
  const ids = STAGES.map((s) => s.id);
  assert.equal(LEGACY_TAB["sg-tab-apply"], "sg-tab-check");
  assert.equal(restoreTab("sg-tab-apply", ids), "sg-tab-check");
  assert.equal(restoreTab("sg-tab-own", ids), "sg-tab-own");
  assert.equal(restoreTab("nope", ids), null);
});

test("variantOf reads the lesson id", () => {
  assert.equal(variantOf({ lessonId: "3-1-group2" }), "group2");
  assert.equal(variantOf({ lessonId: "3-1-catchup" }), "catchup");
  assert.equal(variantOf({ lessonId: "3-1-group1" }), "group1");
});

test("materials come from the figures a lesson draws", () => {
  const cfg = { launch: { practice: { together: [{ figure: { kind: "numberLine" } }] } } };
  const m = materialsFor(cfg);
  assert.equal(m[0], "Student notebook and pencil");
  assert.ok(m.some((x) => /number-line/i.test(x)));
});

test("essential question rewrites the objective", () => {
  assert.equal(
    essentialQuestion({ contentObjective: "I can write and describe a ratio." }),
    "How can we write and describe a ratio?",
  );
  assert.equal(essentialQuestion({}), "");
});

test("next step is decided on independent work only", () => {
  assert.equal(nextStep({ independent: 7, total: 8 }).band, "secure");
  assert.equal(nextStep({ independent: 4, total: 8 }).band, "growing");
  assert.equal(nextStep({ independent: 1, total: 8 }).band, "support");
  assert.equal(nextStep({ independent: 0, total: 0 }).band, "none");
});
