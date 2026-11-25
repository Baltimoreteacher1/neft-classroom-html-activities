// Passport and Save/Resume import must carry the Language Lens word record: a new device is filled, a second device's
// counters merge by the larger value, importing the same backup twice changes nothing, and a malformed record is
// refused before anything is written.
import assert from "node:assert/strict";
import test from "node:test";

// A Storage-like object: values are own properties, so Object.keys(localStorage) lists them as the browser does.
class MemoryStorage {
  getItem(k) {
    return Object.hasOwn(this, k) ? this[k] : null;
  }
  setItem(k, v) {
    this[k] = String(v);
  }
  removeItem(k) {
    delete this[k];
  }
}
const mem = {
  store: new MemoryStorage(),
  get: (k) => mem.store.getItem(k),
  set: (k, v) => mem.store.setItem(k, v),
  clear() {
    mem.store = new MemoryStorage();
    globalThis.localStorage = mem.store;
  },
};
globalThis.localStorage = mem.store;
const { importProgressData, exportCode, importCode } = await import(
  "../access-practice-lab/src/store.js"
);
const { blankWords, recordEncounters, WORDS_KEY } = await import(
  "../access-practice-lab/src/lang/word-encounters.js"
);

const T0 = Date.parse("2026-11-01T12:00:00Z");
const record = (fill) => {
  const s = blankWords();
  fill(s);
  return s;
};
const stored = () => JSON.parse(mem.get(WORDS_KEY));

test("an empty device takes the backup as is", () => {
  mem.clear();
  const backup = record((s) =>
    recordEncounters(s, ["system"], { src: "wordlab", mode: "wrote", now: T0 }),
  );
  assert.equal(importProgressData({ [WORDS_KEY]: JSON.stringify(backup) }), 1);
  assert.deepEqual(stored(), backup);
});

test("a second device merges by the larger counter and adds words this device lacks", () => {
  const other = record((s) => {
    recordEncounters(s, ["system"], { src: "wordlab", mode: "saw", now: T0 });
    recordEncounters(s, ["system"], { src: "reading", mode: "saw", now: T0 });
    recordEncounters(s, ["trend"], { src: "arcade", mode: "chose", now: T0 });
  });
  importProgressData({ [WORDS_KEY]: JSON.stringify(other) });
  const merged = stored();
  assert.equal(merged.words.system.n.wrote, 1, "this device's use is kept");
  assert.equal(merged.words.system.n.saw, 2, "the backup's two sightings are added");
  assert.ok(merged.words.trend, "a word only the backup knew arrives");
});

test("importing the same backup again writes nothing", () => {
  const before = mem.get(WORDS_KEY);
  const same = record((s) =>
    recordEncounters(s, ["trend"], { src: "arcade", mode: "chose", now: T0 }),
  );
  assert.equal(importProgressData({ [WORDS_KEY]: JSON.stringify(same) }), 0);
  assert.equal(mem.get(WORDS_KEY), before);
});

test("a malformed record is refused and nothing is written", () => {
  const before = mem.get(WORDS_KEY);
  for (const bad of [{ v: 2, words: {} }, { v: 1, words: [] }, { v: 1 }, [], "x"])
    assert.throws(() => importProgressData({ [WORDS_KEY]: JSON.stringify(bad) }), /word record/);
  assert.equal(mem.get(WORDS_KEY), before);
});

test("an unreadable record on this device is kept, not overwritten", () => {
  mem.set(WORDS_KEY, "{not json");
  const incoming = record((s) => recordEncounters(s, ["claim"], { mode: "saw", now: T0 }));
  assert.equal(importProgressData({ [WORDS_KEY]: JSON.stringify(incoming) }), 0);
  assert.equal(mem.get(WORDS_KEY), "{not json");
});

test("the Passport code carries the word record to a new device", () => {
  mem.clear();
  const mine = record((s) =>
    recordEncounters(s, ["method"], { src: "demand", mode: "heard", now: T0 }),
  );
  mem.set(WORDS_KEY, JSON.stringify(mine));
  const code = exportCode();
  mem.clear();
  importCode(code);
  assert.deepEqual(stored(), mine);
});
