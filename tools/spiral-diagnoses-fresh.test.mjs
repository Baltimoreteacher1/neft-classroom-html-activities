#!/usr/bin/env node
// spiral-review/diagnoses.json is generated from the committed bank and the
// shared misconception taxonomy. When either changes and the artifact is not
// regenerated, Spiral Review would name an error the engine no longer predicts,
// or miss one it does. This fails until the artifact is rebuilt.
//
// It also pins the page contract: every tag is a real taxonomy id with student
// text, no correct choice is ever diagnosed, and every tagged question exists in
// the bank with the same number of choices (app.js maps tags by position).

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildDiagnoses } from "../scripts/generate-spiral-diagnoses.mjs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const bank = JSON.parse(read("spiral-review/bank.json"));
const committed = read("spiral-review/diagnoses.json");
const fresh = `${JSON.stringify(buildDiagnoses(bank), null, 2)}\n`;
assert.equal(
  committed,
  fresh,
  "spiral-review/diagnoses.json is stale — run: node scripts/generate-spiral-diagnoses.mjs",
);

const { tags, items } = JSON.parse(committed);
const byId = new Map((bank.questions || bank).map((q) => [q.id, q]));
let slots = 0;
for (const [id, perChoice] of Object.entries(items)) {
  const q = byId.get(id);
  assert.ok(q, `${id}: diagnosed question is not in the bank`);
  assert.equal(perChoice.length, q.choices.length, `${id}: tag count must match choice count`);
  assert.equal(
    perChoice[q.correctIndex],
    null,
    `${id}: the correct choice must never carry a diagnosis`,
  );
  for (const t of perChoice) {
    if (!t) continue;
    slots += 1;
    assert.ok(tags[t]?.label && tags[t]?.student, `${id}: tag ${t} has no label/student text`);
  }
}
assert.ok(slots > 0, "zero diagnosed slots — the detector stopped firing on the bank");

// The page script must read the artifact and carry tags through its shuffle.
const app = read("spiral-review/app.js");
assert.ok(app.includes('fetch("diagnoses.json"'), "app.js must load diagnoses.json");
assert.ok(/diagnoses\b[\s\S]*order/.test(app), "app.js must reorder tags with the choices");

console.log(
  `PASS spiral-diagnoses-fresh: ${Object.keys(items).length} questions, ${slots} diagnosed choices`,
);
