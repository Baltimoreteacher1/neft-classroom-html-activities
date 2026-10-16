// A student's Learning Supports choices must survive reloads, follow them to
// the pages that keep their own copy, and never break a page when storage is
// blocked or the saved record is junk.
import assert from "node:assert/strict";
import test from "node:test";
import { createPrefs, DEFAULTS, sanitize, STORAGE_KEY } from "./ls-prefs.js";

/** @returns {Storage} */
function memoryStorage(seed = {}) {
  const data = new Map(Object.entries(seed));
  return /** @type {any} */ ({
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => void data.set(k, String(v)),
    removeItem: (k) => void data.delete(k),
    _data: data,
  });
}

test("defaults are all off and reading speed is normal", () => {
  const prefs = createPrefs({ storage: memoryStorage() });
  assert.deepEqual(prefs.get(), DEFAULTS);
});

test("a choice survives a reload", () => {
  const storage = memoryStorage();
  createPrefs({ storage }).set({ calm: true, rate: 0.7, readLang: "es" });
  const again = createPrefs({ storage }).get();
  assert.equal(again.calm, true);
  assert.equal(again.rate, 0.7);
  assert.equal(again.readLang, "es");
});

test("junk in storage falls back to defaults instead of throwing", () => {
  for (const bad of ["{not json", "42", JSON.stringify({ calm: "yes", rate: 99, readLang: "fr" })]) {
    const prefs = createPrefs({ storage: memoryStorage({ [STORAGE_KEY]: bad }) });
    assert.deepEqual(prefs.get(), DEFAULTS);
  }
  assert.equal(sanitize(null).calm, false);
});

test("blocked storage still lets the page change settings", () => {
  const blocked = /** @type {any} */ ({
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
  });
  const prefs = createPrefs({ storage: blocked });
  prefs.set({ contrast: true });
  assert.equal(prefs.get().contrast, true);
  const none = createPrefs({ storage: null });
  none.set({ spacing: true });
  assert.equal(none.get().spacing, true);
});

test("subscribers hear about every change and can unsubscribe", () => {
  const prefs = createPrefs({ storage: memoryStorage() });
  const heard = [];
  const off = prefs.subscribe((p) => heard.push(p.calm));
  prefs.set({ calm: true });
  off();
  prefs.set({ calm: false });
  assert.deepEqual(heard, [true]);
});

test("a setting made in the Math Workbench is picked up on first load", () => {
  const storage = memoryStorage({ mw_a11y: JSON.stringify({ contrast: true, bigui: true, cbsafe: true }) });
  const got = createPrefs({ storage }).get();
  assert.equal(got.contrast, true);
  assert.equal(got.targets, true);
  assert.equal(got.calm, false);
});

test("shared settings are mirrored out without touching the peer's own keys", () => {
  const storage = memoryStorage({ mw_a11y: JSON.stringify({ cbsafe: true, focus: true }) });
  createPrefs({ storage }).set({ spacing: true, targets: true });
  const mw = JSON.parse(storage.getItem("mw_a11y"));
  assert.equal(mw.spacing, true);
  assert.equal(mw.dyslexia, true);
  assert.equal(mw.bigui, true);
  assert.equal(mw.cbsafe, true, "the workbench's colour-blind choice is its own");
  assert.equal(mw.focus, true, "the workbench's focus choice is its own");
});

test("the hub and lesson-dock contrast switches stay in step", () => {
  const storage = memoryStorage({
    "curriculumReadingPreferences:v1": JSON.stringify({ readableFont: true }),
    "ewl-supports:v1:preferences": JSON.stringify({ profiles: { "read-understand": true }, speechRate: 1 }),
  });
  createPrefs({ storage }).set({ contrast: true });
  assert.equal(JSON.parse(storage.getItem("curriculumReadingPreferences:v1")).highContrast, true);
  assert.equal(JSON.parse(storage.getItem("curriculumReadingPreferences:v1")).readableFont, true);
  const dock = JSON.parse(storage.getItem("ewl-supports:v1:preferences"));
  assert.equal(dock.highContrast, true);
  assert.deepEqual(dock.profiles, { "read-understand": true });
});

test("a change made later on a peer page wins when this page loads", () => {
  const storage = memoryStorage();
  createPrefs({ storage }).set({ contrast: true });
  // The student turns high contrast OFF in the Math Workbench.
  const mw = JSON.parse(storage.getItem("mw_a11y"));
  storage.setItem("mw_a11y", JSON.stringify({ ...mw, contrast: false }));
  assert.equal(createPrefs({ storage }).get().contrast, false);
});

test("a page that never asked for a support gets no peer records written", () => {
  const storage = memoryStorage();
  createPrefs({ storage });
  assert.equal(storage.getItem("mw_a11y"), null);
  assert.equal(storage.getItem("ewl-supports:v1:preferences"), null);
});

test("reset puts every choice back", () => {
  const prefs = createPrefs({ storage: memoryStorage() });
  prefs.set({ calm: true, focus: true, rate: 1.1 });
  prefs.reset();
  assert.deepEqual(prefs.get(), DEFAULTS);
});
