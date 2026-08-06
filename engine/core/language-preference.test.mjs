// One student, one language preference.
//
// The lesson engine persisted `nt-lang`; the small-group studio persisted its
// own `nt-sg-lang`. Nothing synced them, so a student who chose Español in a
// lesson walked into the studio and got English back, and had to find a second
// control they had no reason to know existed. `tools-mode.js` had already been
// patched to check BOTH keys — a fallback that reads as a bug someone hit and
// worked around rather than fixed.
//
// The studio now reads and writes the shared preference. What needs pinning is
// the one-time migration: it runs once per device, and if it regresses, the
// only people who notice are the students who had already set Spanish — they
// silently lose it, and nothing goes red.
//
// Each case imports i18n.js under a fresh query string because the migration
// runs at MODULE LOAD. Re-importing the same specifier would return the cached
// module and quietly test nothing.

import assert from "node:assert/strict";
import test from "node:test";

function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    _dump: () => Object.fromEntries(map),
  };
}

let seq = 0;
async function loadI18nWith(storage) {
  globalThis.localStorage = storage;
  seq += 1;
  return import(`./i18n.js?migration-case=${seq}`);
}

test("legacy studio Spanish is adopted when the student has no shared choice", async () => {
  const store = fakeStorage({ "nt-sg-lang": "es" });
  const { getPreferredLang } = await loadI18nWith(store);
  assert.equal(getPreferredLang(), "es", "a device already set to Spanish must stay Spanish");
  assert.equal(store._dump()["nt-lang"], "es");
  assert.equal("nt-sg-lang" in store._dump(), false, "legacy key is cleared, not left to re-vote");
});

test("an explicit shared choice outranks the legacy key", async () => {
  // The student picked English under the new key. The stale studio value must
  // not drag them back to Spanish on the next load.
  const store = fakeStorage({ "nt-sg-lang": "es", "nt-lang": "en" });
  const { getPreferredLang } = await loadI18nWith(store);
  assert.equal(getPreferredLang(), "en");
  assert.equal("nt-sg-lang" in store._dump(), false);
});

test("legacy English is adopted too, not just Spanish", async () => {
  const store = fakeStorage({ "nt-sg-lang": "en" });
  const { getPreferredLang } = await loadI18nWith(store);
  assert.equal(getPreferredLang(), "en");
  assert.equal(store._dump()["nt-lang"], "en");
});

test("no legacy key: English stands, and nothing is invented", async () => {
  const store = fakeStorage({});
  const { getPreferredLang } = await loadI18nWith(store);
  assert.equal(getPreferredLang(), "en");
  assert.deepEqual(store._dump(), {}, "migration must not write a preference nobody chose");
});

test("a junk legacy value is discarded without becoming the preference", async () => {
  const store = fakeStorage({ "nt-sg-lang": "fr" });
  const { getPreferredLang } = await loadI18nWith(store);
  assert.equal(getPreferredLang(), "en");
  assert.equal(store._dump()["nt-lang"], undefined);
  assert.equal("nt-sg-lang" in store._dump(), false);
});

test("setPreferredLang round-trips through the shared key the studio now writes", async () => {
  const store = fakeStorage({});
  const { getPreferredLang, setPreferredLang } = await loadI18nWith(store);
  setPreferredLang("es");
  assert.equal(store._dump()["nt-lang"], "es");
  assert.equal(getPreferredLang(), "es");
  setPreferredLang("en");
  assert.equal(getPreferredLang(), "en");
});
