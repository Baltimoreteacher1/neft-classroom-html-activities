/**
 * nt-signal.test.mjs — behavior tests for the NTSignal per-device signal store
 * (assets/nt-signal.js).
 *
 * The asset is a plain browser IIFE (no exports), so the tests install a
 * jsdom-free localStorage shim on globalThis, import the file (the IIFE
 * attaches NTSignal to globalThis when window is absent), and drive the real
 * public API. Proves: recording/aggregation, persistence shape + no-PII key
 * whitelist, weak-standard and misconception ranking, tier suggestion
 * thresholds (l1/l2/both), bounded eviction, and that a throwing storage
 * backend never breaks the API (in-memory fallback).
 *
 * Lives under tools/ (not deployed) and runs via `npm test` (tools/run-tests.mjs)
 * or directly: node --test tools/nt-signal.test.mjs
 */

import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const KEY = "nt-signal:v1";

function makeStorageShim() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      map.set(k, String(v));
    },
    removeItem: (k) => {
      map.delete(k);
    },
    __map: map,
  };
}

const goodStorage = makeStorageShim();
globalThis.localStorage = goodStorage;

const here = dirname(fileURLToPath(import.meta.url));
await import(pathToFileURL(resolve(here, "../assets/nt-signal.js")).href);
const NTSignal = globalThis.NTSignal;

function reset() {
  globalThis.localStorage = goodStorage;
  goodStorage.__map.clear();
  NTSignal.clear();
}

test("record() aggregates attempts/correct per standard and counts tags", () => {
  reset();
  NTSignal.record({ standard: "6.NOS.A.1", correct: true });
  NTSignal.record({ standard: "6.NOS.A.1", correct: false, misconceptionTag: "flip-sign" });
  NTSignal.record({ standard: "6.AT.1", correct: true, lesson: "6-1-2" });
  const p = NTSignal.profile();
  assert.equal(p.standards["6.NOS.A.1"].attempts, 2);
  assert.equal(p.standards["6.NOS.A.1"].correct, 1);
  assert.equal(p.standards["6.AT.1"].attempts, 1);
  assert.equal(p.misconceptions["flip-sign"].count, 1);
  assert.equal(p.lastLesson, "6-1-2", "record({lesson}) remembers the last lesson");
  assert.ok(p.updatedAt > 0);
});

test("persists under nt-signal:v1 with the documented no-PII shape", () => {
  reset();
  NTSignal.record({ standard: "6.RP.A.1", correct: false, misconceptionTag: "part-whole" });
  NTSignal.setLastLesson("6-2-1");
  const raw = goodStorage.getItem(KEY);
  assert.ok(raw, "store written to localStorage under the versioned key");
  const parsed = JSON.parse(raw);
  assert.deepEqual(
    Object.keys(parsed).sort(),
    ["lastLesson", "misconceptions", "standards", "updatedAt"],
    "top-level shape is exactly the documented one (no names/sections/free text)",
  );
  assert.deepEqual(Object.keys(parsed.standards["6.RP.A.1"]).sort(), [
    "attempts",
    "correct",
    "lastTs",
  ]);
  assert.equal(parsed.lastLesson, "6-2-1");
});

test("weakStandards() ranks lowest correct-rate first and needs >=2 attempts", () => {
  reset();
  // 0/2 — weakest.
  NTSignal.record({ standard: "6.NOS.B.2", correct: false });
  NTSignal.record({ standard: "6.NOS.B.2", correct: false });
  // 1/2 — middle.
  NTSignal.record({ standard: "6.AT.2", correct: true });
  NTSignal.record({ standard: "6.AT.2", correct: false });
  // 2/2 — strong.
  NTSignal.record({ standard: "6.GM.1", correct: true });
  NTSignal.record({ standard: "6.GM.1", correct: true });
  // 0/1 — a single miss is noise, must not appear.
  NTSignal.record({ standard: "6.M.1", correct: false });
  const weak = NTSignal.weakStandards(3);
  assert.deepEqual(
    weak.map((w) => w.standard),
    ["6.NOS.B.2", "6.AT.2", "6.GM.1"],
  );
  assert.equal(weak[0].rate, 0);
  assert.equal(weak[1].rate, 0.5);
  assert.ok(!weak.some((w) => w.standard === "6.M.1"), "single-attempt standards excluded");
  assert.equal(NTSignal.weakStandards(1).length, 1, "n caps the list");
});

test("topMisconceptions() ranks by count and honors n", () => {
  reset();
  for (let i = 0; i < 3; i++)
    NTSignal.record({ standard: "6.AT.3", misconceptionTag: "keep-flip" });
  NTSignal.record({ standard: "6.AT.3", misconceptionTag: "off-by-ten" });
  const top = NTSignal.topMisconceptions(5);
  assert.equal(top[0].tag, "keep-flip");
  assert.equal(top[0].count, 3);
  assert.equal(top[1].tag, "off-by-ten");
  assert.equal(NTSignal.topMisconceptions(1).length, 1);
});

test("suggestTier(): both on thin data, l1 under 0.6, l2 over 0.85, both between", () => {
  reset();
  assert.equal(NTSignal.suggestTier(), "both", "no data -> both");
  NTSignal.record({ standard: "6.X.1", correct: false });
  NTSignal.record({ standard: "6.X.1", correct: true });
  assert.equal(NTSignal.suggestTier(), "both", "under 4 attempts -> both (thin data)");

  reset();
  for (let i = 0; i < 4; i++) NTSignal.record({ standard: "6.X.1", correct: false });
  NTSignal.record({ standard: "6.X.1", correct: true }); // 1/5 = 0.2
  assert.equal(NTSignal.suggestTier(), "l1", "rolling rate < 0.6 -> l1");

  reset();
  for (let i = 0; i < 9; i++) NTSignal.record({ standard: "6.X.2", correct: true });
  NTSignal.record({ standard: "6.X.2", correct: false }); // 9/10 = 0.9
  assert.equal(NTSignal.suggestTier(), "l2", "rolling rate > 0.85 -> l2");

  reset();
  for (let i = 0; i < 3; i++) NTSignal.record({ standard: "6.X.3", correct: true });
  NTSignal.record({ standard: "6.X.3", correct: false }); // 3/4 = 0.75
  assert.equal(NTSignal.suggestTier(), "both", "mid rate -> both");
});

test("store is bounded: <=64 standards, <=32 misconception tags", () => {
  reset();
  for (let i = 0; i < 70; i++) {
    NTSignal.record({ standard: "6.STD." + i, correct: true, misconceptionTag: "tag-" + i });
  }
  const p = NTSignal.profile();
  assert.ok(Object.keys(p.standards).length <= 64, "standards capped at 64");
  assert.ok(Object.keys(p.misconceptions).length <= 32, "tags capped at 32");
  assert.ok(p.standards["6.STD.69"], "the most recent standard survives eviction");
});

test("invalid input and throwing storage never break the API", () => {
  reset();
  // Garbage input is ignored, not thrown.
  NTSignal.record(null);
  NTSignal.record("nope");
  NTSignal.record({ standard: 42, correct: true });
  assert.deepEqual(Object.keys(NTSignal.profile().standards), []);

  // Corrupt stored JSON falls back to an empty store.
  goodStorage.setItem(KEY, "{not json");
  assert.deepEqual(NTSignal.profile().standards, {});

  // A storage backend that throws on every call: API still works in memory.
  NTSignal.clear();
  globalThis.localStorage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
    removeItem() {
      throw new Error("blocked");
    },
  };
  NTSignal.record({ standard: "6.MEM.1", correct: true });
  NTSignal.record({ standard: "6.MEM.1", correct: false });
  const p = NTSignal.profile();
  assert.equal(p.standards["6.MEM.1"].attempts, 2, "in-memory fallback keeps aggregating");
  assert.equal(NTSignal.suggestTier(), "both");
  NTSignal.clear(); // removeItem throws — must be swallowed
  globalThis.localStorage = goodStorage;
});

test("clear() wipes both localStorage and the in-memory fallback", () => {
  reset();
  NTSignal.record({ standard: "6.NOS.A.1", correct: true });
  assert.ok(goodStorage.getItem(KEY));
  NTSignal.clear();
  assert.equal(goodStorage.getItem(KEY), null);
  assert.deepEqual(NTSignal.profile().standards, {});
});
