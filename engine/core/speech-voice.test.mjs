#!/usr/bin/env node
/* =============================================================================
 * speech-voice.test.mjs — the one place that decides which voice reads aloud.
 * -----------------------------------------------------------------------------
 * Read-aloud, the lesson tools and voice commands all speak through this module,
 * so a student's voice choice has to hold for every one of them: one choice per
 * language (an English voice never hijacks the Spanish lane), a voice that is
 * not installed here quietly loses, and a device with no connection only uses
 * voices that are saved on it.
 * ========================================================================== */

import assert from "node:assert/strict";
import test from "node:test";

const voices = [
  { name: "Samantha", lang: "en-US", localService: true },
  { name: "Net Natural", lang: "en-US", localService: false },
  { name: "Daniel", lang: "en-GB", localService: true },
  { name: "Paulina", lang: "es-MX", localService: true },
  { name: "Google español", lang: "es-US", localService: false },
];
const store = new Map();
const listeners = [];
let online = true;
Object.assign(globalThis, {
  window: {
    speechSynthesis: {
      getVoices: () => voices,
      addEventListener: (_t, fn) => listeners.push(fn),
      speak: () => {},
      cancel: () => {},
    },
  },
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
  SpeechSynthesisUtterance: class {
    constructor(text) {
      this.text = text;
    }
  },
});
Object.defineProperty(globalThis, "navigator", { get: () => ({ onLine: online }), configurable: true });

const sv = await import("./speech-voice.js");

test("a voice the student chose wins for its own language only", () => {
  store.clear();
  assert.equal(sv.pickBestVoice("en-US").name, "Samantha");
  sv.setPreferredVoiceName("Net Natural", "en-US");
  assert.equal(sv.pickBestVoice("en-US").name, "Net Natural");
  // The English choice does not touch the Spanish lane.
  assert.notEqual(sv.pickBestVoice("es-US").name, "Net Natural");
  sv.setPreferredVoiceName("Google español", "es-US");
  assert.equal(sv.pickBestVoice("es-US").name, "Google español");
  assert.equal(sv.pickBestVoice("en-US").name, "Net Natural");
});

test("the English choice keeps the original storage key so earlier choices still apply", () => {
  store.clear();
  sv.setPreferredVoiceName("Daniel", "en-US");
  assert.equal(store.get("nt-read-aloud-voice"), "Daniel");
  sv.setPreferredVoiceName("Paulina", "es-MX");
  assert.equal(store.get("nt-read-aloud-voice-es"), "Paulina");
  assert.equal(sv.getPreferredVoiceName("en-US"), "Daniel");
  assert.equal(sv.getPreferredVoiceName("es-US"), "Paulina");
  sv.setPreferredVoiceName("", "es-US");
  assert.equal(store.has("nt-read-aloud-voice-es"), false);
});

test("a chosen voice that is not installed here loses quietly", () => {
  store.clear();
  sv.setPreferredVoiceName("Voice From Another Laptop", "en-US");
  assert.equal(sv.pickBestVoice("en-US").name, "Samantha");
});

test("voices saved on the device can be asked for by themselves", () => {
  store.clear();
  assert.deepEqual(
    sv.listVoices("en-US", { localOnly: true }).map((v) => v.name),
    ["Samantha", "Daniel"],
  );
  assert.deepEqual(
    sv.listVoices("es", { localOnly: true }).map((v) => v.name),
    ["Paulina"],
  );
  sv.setPreferredVoiceName("Net Natural", "en-US");
  assert.equal(sv.pickBestVoice("en-US", { localOnly: true }).name, "Samantha", "a network voice is skipped");
});

test("with no connection, only saved voices are used, even if none was asked for", () => {
  store.clear();
  sv.setPreferredVoiceName("Net Natural", "en-US");
  online = false;
  try {
    assert.equal(sv.pickBestVoice("en-US").name, "Samantha");
    assert.equal(sv.pickBestVoice("es-US").name, "Paulina");
  } finally {
    online = true;
  }
});

test("makeUtterance sets language, voice and speed in one place", () => {
  store.clear();
  const u = sv.makeUtterance("Hola", "es-US", { rate: 0.7 });
  assert.equal(u.lang, "es-US");
  assert.equal(u.rate, 0.7);
  assert.equal(u.voice.lang.startsWith("es"), true);
  assert.equal(sv.makeUtterance("Hi").rate, 0.92, "the speed lessons already used is the default");
});

test("a picker hears when the device finishes loading its voices", () => {
  let heard = 0;
  const off = sv.onVoicesChanged(() => heard++);
  for (const fn of listeners) fn();
  assert.equal(heard, 1);
  off();
  for (const fn of listeners) fn();
  assert.equal(heard, 1);
});
