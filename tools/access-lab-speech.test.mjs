#!/usr/bin/env node
import assert from "node:assert/strict";
import test from "node:test";

const utterances = [];
globalThis.window = {
  speechSynthesis: {
    getVoices: () => [],
    addEventListener() {},
    cancel() {}, // Browser cancellation need not dispatch an event.
    speak: (utterance) => utterances.push(utterance),
  },
};
globalThis.SpeechSynthesisUtterance = class {
  constructor(text) {
    this.text = text;
  }
};
const speech = await import("../access-practice-lab/src/speech.js");

test("stop settles a read-aloud even when the browser cancels silently", async () => {
  const playing = speech.speak("First question");
  assert.equal(speech.isSpeaking(), true);
  speech.stop();
  assert.equal(await playing, false);
  assert.equal(speech.isSpeaking(), false);
});

test("old utterance errors cannot cancel a newer read-aloud", async () => {
  const first = speech.speak("First question");
  const stale = utterances.at(-1);
  const second = speech.speak("Second question");
  assert.equal(await first, false);
  stale.onerror();
  assert.equal(speech.isSpeaking(), true);
  speech.stop();
  assert.equal(await second, false);
});

test("old end events cannot enqueue the next cancelled segment", async () => {
  const first = speech.speak(["Old first", "Old second"]);
  const stale = utterances.at(-1);
  const second = speech.speak("New question");
  const count = utterances.length;
  stale.onend();
  assert.equal(await first, false);
  assert.equal(utterances.length, count);
  assert.equal(speech.isSpeaking(), true);
  speech.stop();
  assert.equal(await second, false);
});

test("successful speech resolves true after its final segment", async () => {
  const playing = speech.speak("One sentence");
  utterances.at(-1).onend();
  assert.equal(await playing, true);
  assert.equal(speech.isSpeaking(), false);
});

test("a browser speak exception settles cleanly", async () => {
  const original = window.speechSynthesis.speak;
  window.speechSynthesis.speak = () => {
    throw new Error("Unavailable voice");
  };
  try {
    assert.equal(await speech.speak("Question"), false);
    assert.equal(speech.isSpeaking(), false);
  } finally {
    window.speechSynthesis.speak = original;
  }
});
