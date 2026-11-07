// Spanish (es-US) voice for vocabulary previews with a graceful fallback (Language Page feature #15).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";

const voice = (lang, name = lang) => ({ lang, name, voiceURI: name });

test("status: ready with any Spanish voice, none when voices exist but none is Spanish, unknown before load", async () => {
  const { spanishVoiceStatus } = await import("../access-practice-lab/src/speech.js");
  assert.equal(spanishVoiceStatus([]), "unknown");
  assert.equal(spanishVoiceStatus([voice("en-US")]), "none");
  assert.equal(spanishVoiceStatus([voice("en-US"), voice("es-MX")]), "ready");
});

test("es-US is preferred, and no Spanish voice means nothing is spoken and the page is marked", async () => {
  const dom = new JSDOM("<html><body></body></html>");
  let list = [voice("en-US", "Samantha"), voice("es-ES", "Monica"), voice("es-US", "Paulina")];
  const spoken = [];
  class Utterance {
    constructor(text) {
      this.text = text;
    }
  }
  const listeners = {};
  dom.window.speechSynthesis = {
    getVoices: () => list,
    addEventListener: (k, f) => (listeners[k] = f),
    speak: (u) => {
      spoken.push(u);
      setTimeout(() => u.onend?.(), 0);
    },
    cancel() {},
    speaking: false,
    pending: false,
  };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.SpeechSynthesisUtterance = Utterance;
  dom.window.SpeechSynthesisUtterance = Utterance;
  const speech = await import(`../access-practice-lab/src/speech.js?case=${Date.now()}`);
  assert.equal(speech.pickVoice("es-US").name, "Paulina");
  assert.equal(document.documentElement.hasAttribute("data-no-es-voice"), false);
  await speech.speakSpanish("evidencia");
  assert.equal(spoken.at(-1)?.text, "evidencia");
  list = [voice("en-US", "Samantha")];
  listeners.voiceschanged?.();
  assert.equal(document.documentElement.hasAttribute("data-no-es-voice"), true);
  const before = spoken.length;
  assert.equal(await speech.speakSpanish("evidencia"), "no-voice");
  assert.equal(spoken.length, before, "an English voice never reads the Spanish word");
});

test("the app routes every Spanish audio button through speakSpanish, and the fallback hides them", () => {
  const main = readFileSync(new URL("../access-practice-lab/src/main.js", import.meta.url), "utf8");
  assert.match(main, /speakSpanish\(sayEs\.dataset\.sayEs/);
  assert.match(main, /no Spanish voice/);
  const css = readFileSync(new URL("../access-practice-lab/acc.css", import.meta.url), "utf8");
  assert.match(css, /:root\[data-no-es-voice\] \[data-say-es\]/);
});
