// Passport and Save/Resume import must carry the Science Lab record: a new device is filled, this device's work wins per case,
// cases it has not started come from the backup, and a malformed record is refused before anything is written.
import assert from "node:assert/strict";
import test from "node:test";

const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  key: (i) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size;
  },
};
const { importProgressData } = await import("../access-practice-lab/src/store.js");
const KEY = "accessPracticeLab:v1:science-lab";
const record = (cases) => ({ v: 1, bands: { "6-8": { cases } } });

test("an empty device takes the backup as is", () => {
  mem.clear();
  const backup = record({ ice: { support: "A", stages: { notice: { done: 1 } } } });
  importProgressData({ [KEY]: JSON.stringify(backup) });
  assert.deepEqual(JSON.parse(mem.get(KEY)), backup);
});

test("this device wins per case and missing cases come from the backup", () => {
  importProgressData({
    [KEY]: JSON.stringify(record({ ice: { support: "C" }, seeds: { support: "B" } })),
  });
  const cases = JSON.parse(mem.get(KEY)).bands["6-8"].cases;
  assert.equal(cases.ice.support, "A");
  assert.equal(cases.seeds.support, "B");
});

test("a malformed record is refused and nothing is written", () => {
  const before = mem.get(KEY);
  assert.throws(
    () => importProgressData({ [KEY]: JSON.stringify({ v: 2, bands: {} }) }),
    /Science Lab/,
  );
  assert.throws(() => importProgressData({ [KEY]: "not json" }), /Science Lab/);
  assert.equal(mem.get(KEY), before);
});
