import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import {
  FORM_TEMPLATES,
  LEARNING_MODULES,
  STRATEGIES,
} from "../access-practice-lab/src/program/content.js";
import {
  validateForm,
  validateModule,
  validateStrategy,
} from "../access-practice-lab/src/program/validate.js";

test("strategy validator rejects a missing Spanish label before sweeping", () => {
  const fixture = { ...STRATEGIES[0], title: { en: "Only English" } };
  assert.equal(validateStrategy(fixture), false);
});
test("program validators reject missing bilingual and form honesty requirements", () => {
  assert.equal(validateStrategy({ ...STRATEGIES[0], organizer: { en: "Idea" } }), false);
  assert.equal(validateForm({ ...FORM_TEMPLATES[0], honestyLine: "" }), false);
  assert.equal(validateModule({ ...LEARNING_MODULES[0], minutes: 15 }), false);
});
test("strategy batch contains 25 validated items across domains and language uses", () => {
  assert.equal(STRATEGIES.length, 25);
  assert.ok(STRATEGIES.every(validateStrategy));
  assert.deepEqual(
    new Set(STRATEGIES.flatMap((s) => s.domains)),
    new Set(["Listening", "Speaking", "Reading", "Writing"]),
  );
  assert.deepEqual(
    new Set(STRATEGIES.flatMap((s) => s.functions)),
    new Set(["Narrate", "Inform", "Explain", "Argue"]),
  );
});
test("form and learning modules meet content contracts and match generated files", async () => {
  assert.equal(FORM_TEMPLATES.length, 6);
  assert.ok(
    FORM_TEMPLATES.every(
      (f) =>
        f.schema === "lp-form/1" &&
        f.honestyLine.includes("LP never decides") &&
        f.districtWordingSlot,
    ),
  );
  assert.equal(LEARNING_MODULES.length, 12);
  assert.ok(LEARNING_MODULES.every((m) => m.minutes === 10 && m.content.length === 3));
  assert.ok(FORM_TEMPLATES.every(validateForm));
  assert.ok(LEARNING_MODULES.every(validateModule));
  const forms = JSON.parse(
    await readFile(resolve("access-practice-lab/content/program/forms.json"), "utf8"),
  );
  const strategies = JSON.parse(
    await readFile(resolve("access-practice-lab/content/program/strategies.json"), "utf8"),
  );
  const modules = JSON.parse(
    await readFile(resolve("access-practice-lab/content/program/learning-modules.json"), "utf8"),
  );
  assert.deepEqual(forms, FORM_TEMPLATES);
  assert.deepEqual(strategies.strategies, STRATEGIES);
  assert.deepEqual(modules, LEARNING_MODULES);
});
