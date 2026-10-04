#!/usr/bin/env node
import assert from "node:assert/strict";
import test from "node:test";
import * as recorder from "../access-practice-lab/src/recorder.js";

globalThis.window = {};
globalThis.cancelAnimationFrame = () => {};
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
};
const stream = () => {
  const state = { stops: 0 };
  return { state, getTracks: () => [{ stop: () => state.stops++ }] };
};
const setMic = (getUserMedia) =>
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia },
  });
class FakeRecorder extends EventTarget {
  state = "inactive";
  mimeType = "audio/webm";
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    queueMicrotask(() => this.dispatchEvent(new Event("stop")));
  }
}
globalThis.MediaRecorder = FakeRecorder;

test("navigation cancels a pending microphone request and closes its late stream", async () => {
  const permission = deferred();
  const mic = stream();
  setMic(() => permission.promise);
  const pending = recorder.start("old-page");
  await Promise.resolve();
  await recorder.stop();
  permission.resolve(mic);
  assert.equal(await pending, null);
  assert.equal(recorder.isRecording("old-page"), false);
  assert.equal(mic.state.stops, 1);
});

test("the newest recording request wins if permissions resolve out of order", async () => {
  const firstPermission = deferred();
  const firstMic = stream();
  const secondMic = stream();
  let requests = 0;
  setMic(() => (++requests === 1 ? firstPermission.promise : Promise.resolve(secondMic)));
  const first = recorder.start("old");
  await Promise.resolve();
  const second = recorder.start("new");
  await second;
  firstPermission.resolve(firstMic);
  assert.equal(await first, null);
  assert.equal(recorder.isRecording("new"), true);
  assert.equal(firstMic.state.stops, 1);
  await recorder.stop();
  assert.equal(secondMic.state.stops, 1);
});

test("repeated stops await the same finalization and empty audio is not evidence", async () => {
  const mic = stream();
  setMic(async () => mic);
  let finalized = false;
  await recorder.start("empty", {
    onStop: () => {
      finalized = true;
    },
  });
  const first = recorder.stop();
  const second = recorder.stop();
  await Promise.all([first, second]);
  assert.equal(finalized, true);
  assert.equal(mic.state.stops, 1);
  assert.equal(recorder.takesFor("empty").length, 0);
});

test("recorder construction and start errors both close acquired microphones", async () => {
  for (const stage of ["constructor", "start"]) {
    const mic = stream();
    setMic(async () => mic);
    globalThis.MediaRecorder = class extends FakeRecorder {
      constructor(...args) {
        super(...args);
        if (stage === "constructor") throw new Error("Unsupported recorder");
      }
      start() {
        throw new Error("Recorder cannot start");
      }
    };
    await assert.rejects(recorder.start(`failure-${stage}`));
    assert.equal(mic.state.stops, 1);
    assert.equal(recorder.isRecording(`failure-${stage}`), false);
  }
  globalThis.MediaRecorder = FakeRecorder;
});

test("download extension follows the browser recording format", async () => {
  for (const [mimeType, extension] of [
    ["audio/mp4", "m4a"],
    ["audio/ogg;codecs=opus", "ogg"],
    ["audio/webm", "webm"],
  ]) {
    setMic(async () => stream());
    globalThis.MediaRecorder = class extends FakeRecorder {
      mimeType = mimeType;
      stop() {
        const data = new Event("dataavailable");
        data.data = new Blob(["synthetic recording"], { type: mimeType });
        this.dispatchEvent(data);
        super.stop();
      }
    };
    await recorder.start(mimeType);
    await recorder.stop();
    assert.equal(recorder.takesFor(mimeType)[0].extension, extension);
  }
  globalThis.MediaRecorder = FakeRecorder;
});
