#!/usr/bin/env node
// The learner's saved reading voice reaches every speak() call that does not name a voice itself.
import assert from "node:assert/strict";
import test from "node:test";

const voices = [
  { name: "Zarvox", lang: "en-US", voiceURI: "zarvox" },
  { name: "Google US English", lang: "en-US", voiceURI: "google-us" },
  { name: "Samantha", lang: "en-US", voiceURI: "samantha" },
  { name: "Daniel", lang: "en-GB", voiceURI: "daniel" },
  { name: "Paulina", lang: "es-MX", voiceURI: "paulina" },
];

test("voice: saved choice applies to speak(); explicit and automatic previews win", async () => {
  const spoken = [];
  globalThis.window = {
    speechSynthesis: {
      getVoices: () => voices,
      addEventListener() {},
      cancel() {},
      speak: (u) => (spoken.push(u), u.onend?.()),
    },
  };
  globalThis.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text;
    }
  };
  try {
    const speech = await import(`../access-practice-lab/src/speech.js?voice=${Date.now()}`);
    const names = (lang) => speech.getVoiceOptions(lang).map((o) => o.id);
    assert.deepEqual(names("en"), ["default", "google-us", "samantha", "daniel"]);
    assert.deepEqual(names("es"), ["default", "paulina"]);

    speech.setVoiceDefaults({ en: "daniel", es: "paulina", rate: 0.75 });
    await speech.speak("Hello");
    assert.equal(spoken.at(-1).voice.name, "Daniel");
    assert.equal(spoken.at(-1).rate, 0.75);

    await speech.speak("Hola", { lang: "es-US" });
    assert.equal(spoken.at(-1).voice.name, "Paulina");

    // A caller that names a voice keeps it; "auto" (the Automatic preview) ignores the saved choice.
    await speech.speak("Hello", { voiceURI: "samantha" });
    assert.equal(spoken.at(-1).voice.name, "Samantha");
    await speech.speak("Hello", { voiceURI: "auto" });
    assert.notEqual(spoken.at(-1).voice?.name, "Daniel");

    // The bare "default" a few call sites pass still defers to the saved choice, and an unset choice changes nothing.
    await speech.speak("Hello", { voiceURI: "default" });
    assert.equal(spoken.at(-1).voice.name, "Daniel");
    speech.setVoiceDefaults({});
    await speech.speak("Hello", { voiceURI: "default" });
    assert.equal(spoken.at(-1).voice, undefined);
    assert.equal(spoken.at(-1).rate, 0.9);
  } finally {
    delete globalThis.window;
    delete globalThis.SpeechSynthesisUtterance;
  }
});
