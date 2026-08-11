import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ID_MAP, migrateSavedWork } from "./toc-save-migration.js";

// A fake Storage. localStorage semantics that matter here: index-ordered key()
// access, and getItem returning null (not undefined) for a miss.
function fakeStorage(seed = {}) {
  const m = new Map(Object.entries(seed));
  return {
    get length() {
      return m.size;
    },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    snapshot: () => Object.fromEntries(m),
  };
}

// The generated map must not drift from the migration source of truth.
{
  const src = JSON.parse(readFileSync(new URL("../../data/toc-migration.json", import.meta.url)));
  const expected = src.moves.filter((m) => m.from !== m.to);
  assert.equal(ID_MAP.size, expected.length, "ID_MAP must cover every id that changed");
  for (const mv of expected) {
    assert.equal(ID_MAP.get(mv.from), mv.to, `ID_MAP ${mv.from} -> ${mv.to}`);
  }
}

// Swaps are the case a naive one-at-a-time rename corrupts: 5-2 and 5-3 trade
// places, so whichever is written first would destroy the other's payload.
{
  const s = fakeStorage({ "rma_5-2": "TRAPEZOIDS", "rma_5-3": "TRIANGLES" });
  migrateSavedWork(s);
  const out = s.snapshot();
  assert.equal(out["rma_5-3"], "TRAPEZOIDS", "5-2's work must land on 5-3");
  assert.equal(out["rma_5-2"], "TRIANGLES", "5-3's work must land on 5-2");
}

// Per-student and companion key shapes must survive the remap.
{
  const s = fakeStorage({
    "rma_1-1_ava": "PRIME",
    "rma_9-7-group1": "REFLECT",
    "rma_9-7-catchup_bo": "REFLECT2",
  });
  migrateSavedWork(s);
  const out = s.snapshot();
  assert.equal(out["rma_6-13_ava"], "PRIME", "per-student key follows the lesson");
  assert.equal(out["rma_7-9-group1"], "REFLECT", "group companion follows its base lesson");
  assert.equal(out["rma_7-9-catchup_bo"], "REFLECT2", "catchup companion keeps its student suffix");
  assert.equal(out["rma_1-1_ava"], undefined, "old key is dropped");
}

// Keys that are not lesson state, and lessons that did not move, are untouched.
{
  const s = fakeStorage({ "rma_3-1": "STAYS", nt_student: "ava", rma_teacher_mode: "1" });
  migrateSavedWork(s);
  const out = s.snapshot();
  assert.equal(out["rma_3-1"], "STAYS", "a lesson that kept its number is not rewritten");
  assert.equal(out.nt_student, "ava", "unrelated keys are left alone");
  assert.equal(out.rma_teacher_mode, "1", "non-lesson rma_ keys are left alone");
}

// Idempotent: a second run must not re-migrate already-new keys. Without the
// flag, rma_5-3 (now holding 5-2's work) would be remapped again to 5-2.
{
  const s = fakeStorage({ "rma_5-2": "TRAPEZOIDS", "rma_5-3": "TRIANGLES" });
  migrateSavedWork(s);
  const afterFirst = s.snapshot();
  const moved = migrateSavedWork(s);
  assert.equal(moved, 0, "second run must be a no-op");
  assert.deepEqual(s.snapshot(), afterFirst, "second run must not change anything");
}

// Storage disabled (Safari private mode throws on access) must not throw.
{
  const hostile = {
    get length() {
      return 0;
    },
    key: () => null,
    getItem: () => {
      throw new Error("SecurityError");
    },
    setItem: () => {},
    removeItem: () => {},
  };
  assert.doesNotThrow(() => migrateSavedWork(hostile), "must degrade quietly, not break the lesson");
}

console.log("toc-save-migration.test.mjs: all assertions passed");
