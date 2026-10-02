#!/usr/bin/env node
// Lifecycle regressions: exercise the real test view with isolated device storage.
import assert from "node:assert/strict";
import test from "node:test";
import {
  clearTestRecord,
  loadTestRecord,
  saveTestRecord,
} from "../access-practice-lab/src/store.js";
import { toHtml } from "../access-practice-lab/src/util.js";

const values = new Map();
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
};
globalThis.window = { scrollTo() {} };
globalThis.document = { getElementById: () => null };
const view = await import("../access-practice-lab/src/views/test.js");
const fixture = {
  id: "runtime-fixture",
  title: "Lifecycle test",
  band: "6-8",
  sections: [
    { domain: "Speaking", items: [{ id: "s1", type: "constructed", prompt: "Explain." }] },
    { domain: "Writing", items: [{ id: "w1", type: "constructed", prompt: "Write." }] },
  ],
};
globalThis.fetch = async () => ({ ok: true, json: async () => fixture });
const ctx = { route: { testId: fixture.id }, prefs: {}, rerender() {}, navigate() {} };
const target = (selector, extra = {}) => ({
  closest: (s) => (s === selector ? {} : null),
  matches: (s) => s === selector,
  ...extra,
});
const click = async (selector) => {
  await view.onClick({ target: target(selector) }, ctx);
  // Restart/submit deliberately wait for the recorder's stop event.
  await Promise.resolve();
  await Promise.resolve();
};
async function reset(record = {}) {
  view.invalidate();
  saveTestRecord(fixture.id, record);
  return toHtml((await view.render(ctx)).html);
}

test("spoken completion requires speech evidence, never planning notes", () => {
  const item = fixture.sections[0].items[0];
  assert.equal(view.responseDone(item, "Speaking", "I plan to say this"), false);
  assert.equal(view.responseDone(item, "Speaking", "", true), true);
  assert.equal(view.responseDone(item, "Speaking", "", false, true), true);
  assert.equal(view.responseDone(item, "Writing", "My response"), true);
});

test("save and exit pauses the test and retains the resume position", async () => {
  await reset({ answers: { w1: "Saved writing" }, index: 1, timer: true, remaining: 125 });
  await click("[data-start]");
  assert.equal(loadTestRecord(fixture.id).phase, "running");
  await click("[data-exit]");
  const record = loadTestRecord(fixture.id);
  assert.equal(record.phase, "intro");
  assert.equal(record.remaining, 125);
  assert.equal(record.index, 1);
  assert.equal(record.answers.w1, "Saved writing");
  assert.match(toHtml((await view.render(ctx)).html), /Resume test/);
});

test("route unmount cancels the timer and persists a paused phase", async () => {
  const realSet = globalThis.setInterval;
  const realClear = globalThis.clearInterval;
  const timers = new Map();
  globalThis.setInterval = (fn) => {
    timers.set(1, fn);
    return 1;
  };
  globalThis.clearInterval = (id) => timers.delete(id);
  try {
    await reset({ timer: true, remaining: 60 });
    await click("[data-start]");
    view.mount();
    assert.equal(timers.size, 1);
    timers.get(1)();
    view.unmount();
    assert.equal(timers.size, 0);
    assert.equal(loadTestRecord(fixture.id).remaining, 59);
    assert.equal(loadTestRecord(fixture.id).phase, "intro");
  } finally {
    globalThis.setInterval = realSet;
    globalThis.clearInterval = realClear;
  }
});

test("clearing device progress cannot resurrect a cached test", async () => {
  await reset({ answers: { w1: "Old response" }, index: 1 });
  await click("[data-start]");
  clearTestRecord(fixture.id);
  const html = toHtml((await view.render(ctx)).html);
  assert.match(html, /Start test/);
  assert.doesNotMatch(html, /Resume test|Old response/);
  await click("[data-start]");
  assert.deepEqual(loadTestRecord(fixture.id).answers, {});
});

test("restored progress replaces cached test answers on the next render", async () => {
  await reset({ answers: { w1: "Before import" }, index: 1 });
  saveTestRecord(fixture.id, { answers: { w1: "Imported response" }, index: 1 });
  await view.render(ctx);
  await click("[data-start]");
  const html = toHtml((await view.render(ctx)).html);
  assert.match(html, /Imported response/);
  assert.doesNotMatch(html, /Before import/);
});

test("reports distinguish spoken evidence from notes, and restart clears oral evidence", async () => {
  await reset({ answers: { s1: "Planning only", w1: "Written response" } });
  await click("[data-submit]");
  let result = loadTestRecord(fixture.id).results;
  assert.equal(result.sections[0].openDone, 0);
  assert.equal(result.sections[1].openDone, 1);
  await reset({ answers: { s1: "Planning only" }, oralPractice: { s1: true } });
  await click("[data-submit]");
  result = loadTestRecord(fixture.id).results;
  assert.equal(result.sections[0].openDone, 1);
  await click("[data-restart]");
  const record = loadTestRecord(fixture.id);
  assert.equal(record.phase, "intro");
  assert.deepEqual(record.answers, {});
  assert.equal(record.oralPractice, undefined);
  assert.equal(record.results, undefined);
});

test("restarting a test removes recordings from the previous attempt", async () => {
  const recorder = await import("../access-practice-lab/src/recorder.js");
  const mediaDescriptor = Object.getOwnPropertyDescriptor(navigator, "mediaDevices");
  const originalMediaRecorder = globalThis.MediaRecorder;
  const originalCancelFrame = globalThis.cancelAnimationFrame;
  let tracksStopped = 0;
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: async () => ({ getTracks: () => [{ stop: () => tracksStopped++ }] }),
    },
  });
  globalThis.cancelAnimationFrame = () => {};
  globalThis.MediaRecorder = class extends EventTarget {
    state = "inactive";
    mimeType = "audio/webm";
    start() {
      this.state = "recording";
    }
    stop() {
      this.state = "inactive";
      const data = new Event("dataavailable");
      data.data = new Blob(["synthetic audio"], { type: this.mimeType });
      this.dispatchEvent(data);
      this.dispatchEvent(new Event("stop"));
    }
  };
  try {
    await reset();
    await recorder.start(`${fixture.id}:s1`);
    await recorder.stop();
    assert.equal(recorder.takesFor(`${fixture.id}:s1`).length, 1);
    await click("[data-restart]");
    assert.equal(recorder.takesFor(`${fixture.id}:s1`).length, 0);
    assert.equal(tracksStopped, 1);
    await click("[data-submit]");
    assert.equal(loadTestRecord(fixture.id).results.sections[0].openDone, 0);
  } finally {
    if (mediaDescriptor) Object.defineProperty(navigator, "mediaDevices", mediaDescriptor);
    else delete navigator.mediaDevices;
    globalThis.MediaRecorder = originalMediaRecorder;
    globalThis.cancelAnimationFrame = originalCancelFrame;
  }
});

test("question navigation stops the previous question's read-aloud", async () => {
  const speech = await import("../access-practice-lab/src/speech.js");
  window.speechSynthesis = { getVoices: () => [], speak() {}, cancel() {} };
  globalThis.SpeechSynthesisUtterance = class {};
  try {
    await reset();
    await click("[data-start]");
    const reading = speech.speak("Question one");
    await click("[data-next]");
    assert.equal(await reading, false);
    assert.equal(speech.isSpeaking(), false);
    assert.equal(loadTestRecord(fixture.id).index, 1);
  } finally {
    delete window.speechSynthesis;
    delete globalThis.SpeechSynthesisUtterance;
  }
});

test("a slow previous test load cannot replace the current test state", async () => {
  const originalFetch = globalThis.fetch;
  let release;
  globalThis.fetch = async (url) => {
    const id = url.includes("slow-test") ? "slow-test" : "fast-test";
    if (id === "slow-test")
      await new Promise((resolve) => {
        release = resolve;
      });
    return { ok: true, json: async () => ({ ...fixture, id }) };
  };
  try {
    view.invalidate();
    const previous = view.render({ ...ctx, route: { testId: "slow-test" } });
    await view.render({ ...ctx, route: { testId: "fast-test" } });
    release();
    await previous;
    await click("[data-start]");
    assert.equal(loadTestRecord("fast-test").phase, "running");
    assert.deepEqual(loadTestRecord("slow-test"), {});
  } finally {
    globalThis.fetch = originalFetch;
    view.invalidate();
  }
});
