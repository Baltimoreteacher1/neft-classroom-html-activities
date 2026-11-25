// Runs G-81..G-85 (class brief golden, weekly family plan, progress note, text tips, no egress) and requires every
// negative control to fail, the same rule validate-language-page.mjs applies.
import assert from "node:assert/strict";
import { test } from "node:test";
import { loadDataset } from "./dataset.mjs";
import { g81, g82, g83, g84, g85 } from "./gates-class-family.mjs";

const data = await loadDataset();

for (const gate of [g81, g82, g83, g84, g85]) {
  test(`${gate.id} ${gate.name}`, async () => {
    const result = await gate.run({ data });
    assert.deepEqual(result.errors, []);
    const controls = await gate.controls({ data });
    assert.ok(controls.length >= 3, "a gate needs several negative controls");
    for (const c of controls) assert.ok(c.errors.length > 0, `control "${c.name}" must fail`);
  });
}
