// A practice set should not serve one format twelve times before showing another.
//
// Every one of the 148 generated small-group lessons used to open with the
// entire `parallelPractice` bank — twelve consecutive `guided-fill` items —
// and only reach its multiple-choice / error-analysis variety at item 13. In a
// 15-minute station rotation many students never got that far, so the variety
// authored for them effectively did not exist. Two stacked stable partitions
// produced it: `preferRich()` in the generator and the checkable/written split
// at render.
//
// This sweeps the WHOLE fleet rather than a sample, because the defect was
// unanimous — a three-lesson sample would have looked like a fleet-wide truth
// either way, and that is exactly how it survived so long.
//
// It exercises `practiceDisplayOrder`, the function the renderer actually
// calls. Re-implementing the ordering here would keep passing after the
// pipeline changed underneath it, which is the failure mode this file exists
// to prevent.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  collectPracticeItems,
  interleaveByFormat,
  practiceDisplayOrder,
} from "./small-group-practice.js";

// Resolved from this file, not cwd, so the sweep also runs standalone
// (`npm test -w @eduwonderlab/engine` executes with cwd = engine/).
const LESSONS = path.join(new URL("../..", import.meta.url).pathname, "lessons");

function longestRun(types) {
  let best = 0;
  let current = 0;
  let previous = null;
  for (const type of types) {
    current = type === previous ? current + 1 : 1;
    previous = type;
    if (current > best) best = current;
  }
  return best;
}

function smallGroupIds() {
  if (!fs.existsSync(LESSONS)) return [];
  return fs
    .readdirSync(LESSONS)
    .filter((id) => /-(group\d|catchup)$/.test(id))
    .filter((id) => fs.existsSync(path.join(LESSONS, id, "config.json")))
    .sort();
}

// ── The algorithm itself ────────────────────────────────────────────────────

test("interleaveByFormat breaks a pure block into alternation", () => {
  const items = [
    ...Array.from({ length: 6 }, (_, i) => ({ type: "guided-fill", id: `g${i}` })),
    ...Array.from({ length: 6 }, (_, i) => ({ type: "multiple-choice", id: `m${i}` })),
  ];
  const out = interleaveByFormat(items);
  assert.equal(out.length, 12, "no item may be dropped");
  assert.equal(longestRun(out.map((i) => i.type)), 1, "equal counts should alternate perfectly");
});

test("interleaveByFormat spreads a dominant format as evenly as it can", () => {
  const items = [
    ...Array.from({ length: 12 }, (_, i) => ({ type: "guided-fill", id: `g${i}` })),
    ...Array.from({ length: 6 }, (_, i) => ({ type: "multiple-choice", id: `m${i}` })),
  ];
  const out = interleaveByFormat(items);
  assert.equal(out.length, 18);
  // 12 of 18 cannot alternate perfectly; 2 is the arithmetic best.
  assert.ok(longestRun(out.map((i) => i.type)) <= 2, "a 12-item block must not survive");
});

test("interleaveByFormat preserves every item and never invents one", () => {
  const items = [
    { type: "a", id: 1 },
    { type: "a", id: 2 },
    { type: "b", id: 3 },
    { type: "c", id: 4 },
    { type: "a", id: 5 },
  ];
  const out = interleaveByFormat(items);
  assert.deepEqual(
    out.map((i) => i.id).sort((x, y) => x - y),
    [1, 2, 3, 4, 5],
  );
});

test("interleaveByFormat is deterministic — generated lessons must diff cleanly", () => {
  const items = Array.from({ length: 20 }, (_, i) => ({
    type: i % 3 === 0 ? "multiple-choice" : "guided-fill",
    id: i,
  }));
  const a = interleaveByFormat(items).map((i) => i.id);
  const b = interleaveByFormat(items).map((i) => i.id);
  assert.deepEqual(a, b);
});

test("interleaveByFormat leaves single-format and tiny sets alone", () => {
  const single = [{ type: "guided-fill", id: 1 }, { type: "guided-fill", id: 2 }, { type: "guided-fill", id: 3 }];
  assert.deepEqual(interleaveByFormat(single).map((i) => i.id), [1, 2, 3]);
  assert.deepEqual(interleaveByFormat([]).length, 0);
  assert.deepEqual(interleaveByFormat(null).length, 0);
});

test("interleaveByFormat never rewrites _practiceIndex — that is the Save/Resume key", () => {
  const items = [
    ...Array.from({ length: 8 }, (_, i) => ({ type: "guided-fill", _practiceIndex: i })),
    ...Array.from({ length: 4 }, (_, i) => ({ type: "multiple-choice", _practiceIndex: 8 + i })),
  ];
  const out = interleaveByFormat(items);
  assert.deepEqual(
    out.map((i) => i._practiceIndex).sort((a, b) => a - b),
    Array.from({ length: 12 }, (_, i) => i),
    "every original index must still be present exactly once",
  );
  for (const item of out) {
    assert.equal(typeof item._practiceIndex, "number");
  }
});

// ── The fleet ───────────────────────────────────────────────────────────────

test("no small-group lesson serves a long single-format block", () => {
  const ids = smallGroupIds();
  // A gate that silently matches nothing reports a clean fleet.
  assert.ok(ids.length > 100, `expected the generated fleet, found ${ids.length} lessons`);

  const offenders = [];
  let worst = 0;
  for (const id of ids) {
    const config = JSON.parse(
      fs.readFileSync(path.join(LESSONS, id, "config.json"), "utf8"),
    );
    const shown = practiceDisplayOrder(collectPracticeItems(config));
    const allTypes = shown.map((i) => i.type || "?");
    if (!allTypes.length) continue;

    // practiceDisplayOrder deliberately holds every open-response item back and
    // appends them as a block at the end — written reflection belongs after the
    // interactive work, and only the interactive items are passed through
    // interleaveByFormat. So the trailing written block is the design, not a
    // clustering defect, and measuring across it fails a lesson for having
    // three things to write about. Judge the part the interleaver owns, and
    // pin the design separately below.
    const writtenAtTail = allTypes.filter((t) => t === "open-response").length;
    const tail = allTypes.slice(allTypes.length - writtenAtTail);
    assert.ok(
      tail.every((t) => t === "open-response"),
      `${id}: open-response items must be the trailing block (practiceDisplayOrder's contract)`,
    );
    const types = allTypes.slice(0, allTypes.length - writtenAtTail);
    if (!types.length) continue;

    const run = longestRun(types);
    if (run > worst) worst = run;

    // Judge each lesson against what its own mix allows, not a flat number. A
    // set that is 12 fills and 2 others cannot do better than runs of 4, and
    // failing it for that would be demanding content the lesson does not have.
    const counts = new Map();
    for (const type of types) counts.set(type, (counts.get(type) || 0) + 1);
    const dominant = Math.max(...counts.values());
    const optimal = Math.ceil(dominant / (types.length - dominant + 1));
    if (run > optimal) offenders.push(`${id}: ${run} in a row (best possible ${optimal})`);
  }
  assert.deepEqual(
    offenders.slice(0, 12),
    [],
    `${offenders.length} lesson(s) cluster worse than their mix requires (worst run ${worst})`,
  );
});

test("interleaving does not drop or duplicate any practice item", () => {
  for (const id of ["1-1-group1", "1-2-group2", "1-3-catchup", "9-4-group1"]) {
    const dir = path.join(LESSONS, id, "config.json");
    if (!fs.existsSync(dir)) continue;
    const config = JSON.parse(fs.readFileSync(dir, "utf8"));
    const collected = collectPracticeItems(config);
    const shown = practiceDisplayOrder(collected);
    assert.equal(shown.length, collected.length, `${id}: item count changed`);
    const before = collected.map((i) => i._practiceIndex).sort((a, b) => a - b);
    const after = shown.map((i) => i._practiceIndex).sort((a, b) => a - b);
    assert.deepEqual(after, before, `${id}: Save/Resume indices changed`);
  }
});
