#!/usr/bin/env node
/* =============================================================================
 * voice-nav.test.mjs — voice commands understand both of the site's languages.
 * -----------------------------------------------------------------------------
 * The microphone used to listen for English only ("en-US", English command
 * words), so a student who had chosen Spanish could not use it at all. It now
 * listens in the language the student picked and understands the commands in
 * both, with or without accents.
 * ========================================================================== */

import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html lang='en'><body></body></html>", { url: "http://localhost/" });
const { window } = dom;
/** @type {any[]} */
const recognisers = [];
window.SpeechRecognition = class {
  start() {
    recognisers.push(this);
  }
  stop() {}
};
const cancelled = [];
window.speechSynthesis = {
  getVoices: () => [],
  addEventListener() {},
  cancel: () => cancelled.push(1),
  speak() {},
};
window.SpeechSynthesisUtterance = class {
  constructor(text) {
    this.text = text;
  }
};
Object.assign(globalThis, {
  window,
  document: window.document,
  localStorage: window.localStorage,
  SpeechSynthesisUtterance: window.SpeechSynthesisUtterance,
});

const { mountVoiceNav } = await import("./voice-nav.js");

function setup(lang) {
  document.body.innerHTML = "";
  if (lang) localStorage.setItem("nt-lang", lang);
  else localStorage.removeItem("nt-lang");
  recognisers.length = 0;
  const moves = [];
  const api = mountVoiceNav({
    getCurrentPhase: () => 1,
    phaseCount: 4,
    phaseNames: ["Warm-Up", "Explorar", "Practice", "Exit"],
    navigateTo: (i) => moves.push(i),
    getPhaseEl: () => document.body,
  });
  document.querySelector(".nt-voice-mic").click();
  return { moves, api, say: (words) => recognisers.at(-1).onresult({ results: [[{ transcript: words }]] }) };
}

test("English: listens in English and understands next / back / stop", () => {
  const { moves, say, api } = setup();
  assert.equal(recognisers.at(-1).lang, "en-US");
  say("next");
  say("go back");
  assert.deepEqual(moves, [2, 0]);
  say("please stop");
  assert.equal(cancelled.length > 0, true);
  api.destroy();
});

test("Spanish: listens in Spanish and understands the same commands, with or without accents", () => {
  const { moves, say, api } = setup("es");
  assert.equal(recognisers.at(-1).lang, "es-US");
  say("siguiente");
  say("Atrás");
  say("atras");
  assert.deepEqual(moves, [2, 0, 0]);
  say("explorar");
  assert.deepEqual(moves.at(-1), 1, "a phase can be named in Spanish");
  api.destroy();
});

test("the microphone button names itself in the student's language and reports its state", () => {
  localStorage.setItem("nt-lang", "es");
  document.body.innerHTML = "";
  const api = mountVoiceNav({
    getCurrentPhase: () => 0,
    phaseCount: 2,
    phaseNames: [],
    navigateTo() {},
    getPhaseEl: () => document.body,
  });
  const mic = document.querySelector(".nt-voice-mic");
  assert.match(mic.getAttribute("aria-label"), /Control por voz/);
  assert.equal(mic.getAttribute("aria-pressed"), "false");
  mic.click();
  assert.equal(mic.getAttribute("aria-pressed"), "true");
  assert.match(document.querySelector("[aria-live]").textContent, /Escuchando/);
  api.destroy();
  localStorage.removeItem("nt-lang");
});
