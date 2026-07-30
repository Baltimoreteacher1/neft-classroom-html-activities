#!/usr/bin/env node
// The generated label artifact must match the taxonomy it was generated from.
//
// data/misconception-labels.json is what every teacher-facing standalone page
// reads to turn a tag slug into a human name. If the taxonomy gains an entry and
// nobody re-runs the generator, those pages silently fall back to printing the
// raw slug — which looks like a data problem, not a stale build, and sends a
// teacher hunting in the wrong place. This test makes the staleness loud.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { OUTPUT, buildLabels, serialize } from "../scripts/generate-misconception-labels.mjs";

const expected = serialize(buildLabels());
let actual;
try {
  actual = readFileSync(OUTPUT, "utf8");
} catch {
  assert.fail(
    "data/misconception-labels.json is missing — run: node scripts/generate-misconception-labels.mjs",
  );
}

assert.equal(
  actual,
  expected,
  "data/misconception-labels.json is stale — run: node scripts/generate-misconception-labels.mjs",
);

const parsed = JSON.parse(actual);
assert.ok(parsed.count > 0, "the taxonomy exported zero tags");
for (const [id, entry] of Object.entries(parsed.tags)) {
  assert.ok(entry.label, `${id} exported without a label`);
  assert.ok(entry.watchFor, `${id} exported without a teacher move`);
}

console.log(`misconception labels: artifact matches taxonomy (${parsed.count} tags).`);
