/* Sound cues are opt-in, remembered, and never play while off. */
import assert from "node:assert/strict";

const calls = [];
class FakeAudio {
  constructor() {
    this.currentTime = 0;
    this.state = "running";
    this.destination = {};
  }
  createOscillator() {
    return { frequency: {}, connect() {}, start: () => calls.push("osc"), stop() {} };
  }
  createGain() {
    return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} };
  }
}
const store = new Map();
globalThis.AudioContext = FakeAudio;
globalThis.localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, v),
};
const sound = await import("../curriculum/learning-labs/shared/sound.mjs");

assert.equal(sound.enabled(), false, "off by default");
assert.equal(sound.play("hit"), false, "silent while off");
assert.equal(calls.length, 0);
sound.set(true);
assert.equal(store.get("eduwonderlab:learning-lab:sound"), "on", "choice is remembered");
assert.equal(sound.play("hit"), true);
assert.equal(calls.length, sound.CUES.hit.length, "one tone per note");
assert.equal(sound.play("nope"), false, "unknown cue ignored");
sound.set(false);
calls.length = 0;
assert.equal(sound.play("stamp"), false, "silent again after turning off");
assert.equal(calls.length, 0);
// blocked storage must not throw
globalThis.localStorage = {
  getItem() {
    throw new Error("blocked");
  },
  setItem() {
    throw new Error("blocked");
  },
};
sound.set(true);
assert.equal(sound.enabled(), true);
console.log("learning-labs-sound: opt-in, remembered, silent while off.");
