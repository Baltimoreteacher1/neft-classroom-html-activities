#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const path = fileURLToPath(
  new URL("../access-practice-lab/content/reading-path/phonics-scope.json", import.meta.url),
);
export function validateScope(data) {
  const errors = [];
  if (
    data?.schema !== "lp-reading-path/1" ||
    data.reviewStatus !== "automated-checks-only" ||
    data.units?.length !== 15
  )
    return ["scope: requires 15 units and review status"];
  const ids = new Set();
  for (const [i, u] of data.units.entries()) {
    if (ids.has(u.id)) errors.push("duplicate unit");
    ids.add(u.id);
    if (
      u.n !== i + 1 ||
      !u.graphemes?.length ||
      u.exampleWords?.length < 8 ||
      u.sightWords?.length < 4 ||
      u.sightWords?.length > 8 ||
      !u.teaches?.en ||
      !u.teaches?.es
    )
      errors.push(`${u.id}: incomplete scope`);
    const count = (k) => u.items?.filter((x) => x.kind === k).length;
    if (
      count("game") < 2 ||
      count("game") > 3 ||
      count("reader") !== 1 ||
      count("mini-lesson") !== 1
    )
      errors.push(`${u.id}: wrong item counts`);
    if (new Set(u.items?.map((x) => x.id)).size !== u.items?.length)
      errors.push(`${u.id}: duplicate item`);
    for (const item of u.items || [])
      if (!item.title?.en || !item.title?.es) errors.push(`${u.id}: missing language`);
  }
  return errors;
}
const scope = JSON.parse(readFileSync(path, "utf8"));
assert.deepEqual(validateScope(scope), []);
for (const bad of [
  { ...scope, units: [] },
  { ...scope, units: scope.units.slice(1) },
  { ...scope, units: scope.units.map((u, i) => (i ? u : { ...u, items: [] })) },
  { ...scope, units: scope.units.map((u, i) => (i ? u : { ...u, teaches: { en: "only" } })) },
])
  assert.ok(validateScope(bad).length);
console.log("reading-path: PASS · 15 units · item counts · EN/ES · 4 known-bad mutations");
