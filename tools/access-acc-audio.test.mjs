#!/usr/bin/env node
/**
 * Phase 3 contract: microphone preflight, capture MIME honesty, the speaking state machine, controlled listening and
 * the storage fallback. Browser capture/playback with a real (fake-device) microphone is in access-acc-audio-e2e.mjs.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  Capture,
  extensionFor,
  MIME_CANDIDATES,
  pickMimeType,
} from "../access-practice-lab/src/acc/audio/capture.js";
import {
  ListeningEngine,
  MIN_HEARD_MS,
  ttsPlayer,
} from "../access-practice-lab/src/acc/audio/listening.js";
import {
  classifyCalibration,
  detectSupport,
  MicPreflight,
  RMS_SILENT,
  rms,
} from "../access-practice-lab/src/acc/audio/mic-preflight.js";
import {
  clampPrep,
  SpeakingMachine,
} from "../access-practice-lab/src/acc/audio/speaking-machine.js";
import { _testing, StorageError } from "../access-practice-lab/src/acc/storage/access-db.js";

// ── mic preflight ──────────────────────────────────────────────────────────────
test("rms is the root-mean-square of the samples and tells silence from speech", () => {
  assert.equal(rms([]), 0);
  assert.equal(rms(new Float32Array(100)), 0);
  assert.ok(Math.abs(rms([0.5, -0.5, 0.5, -0.5]) - 0.5) < 1e-9);
  assert.equal(classifyCalibration({ peak: RMS_SILENT / 2 }), "silent");
  assert.equal(classifyCalibration({ peak: 0.1 }), "ok");
});

class FakeTrack extends EventTarget {
  stopped = false;
  stop() {
    this.stopped = true;
  }
}
const fakeEnv = ({ amplitude = 0.2, error = null, noCtx = false } = {}) => {
  const track = new FakeTrack();
  const stream = { getTracks: () => [track], getAudioTracks: () => [track] };
  const closes = { n: 0 };
  class AC {
    state = "running";
    createAnalyser() {
      return { fftSize: 0, getFloatTimeDomainData: (b) => b.fill(amplitude) };
    }
    createMediaStreamSource() {
      return { connect() {} };
    }
    close() {
      closes.n++;
      return Promise.resolve();
    }
  }
  return {
    track,
    closes,
    env: {
      navigator: {
        mediaDevices: {
          getUserMedia: async () => {
            if (error) throw Object.assign(new Error("x"), { name: error });
            return stream;
          },
        },
      },
      AudioContext: noCtx ? undefined : AC,
      MediaRecorder: class {},
      isSecureContext: true,
    },
  };
};
const fastClock = () => {
  let t = 0;
  return {
    now: () => t,
    schedule: (fn) => {
      const id = setInterval(() => {
        t += 500;
        fn();
      }, 1);
      return () => clearInterval(id);
    },
  };
};

test("preflight: a working microphone reaches ready after the 3-second calibration", async () => {
  const { env } = fakeEnv();
  const states = [];
  const clock = fastClock();
  const p = new MicPreflight({ env, ...clock, onState: (s) => states.push(s) });
  assert.equal(await p.request(), "ready");
  assert.deepEqual(states, ["requesting", "calibrating", "ready"]);
  assert.ok(p.takeStream());
  p.destroy();
});

test("preflight: denied, unavailable, unsupported and silent each report their own state", async () => {
  for (const [opts, expected] of [
    [{ error: "NotAllowedError" }, "denied"],
    [{ error: "NotFoundError" }, "unavailable"],
    [{ noCtx: true }, "unsupported"],
    [{ amplitude: 0 }, "silent"],
  ]) {
    const { env } = fakeEnv(opts);
    const p = new MicPreflight({ env, ...fastClock() });
    assert.equal(await p.request(), expected, JSON.stringify(opts));
    assert.equal(p.takeStream(), null, "no stream is handed out unless ready");
    p.destroy();
  }
  assert.equal(detectSupport({ navigator: {} }).getUserMedia, false);
});

test("preflight releases every track and the AudioContext, and detects an interrupted device", async () => {
  const { env, track, closes } = fakeEnv();
  const p = new MicPreflight({ env, ...fastClock() });
  await p.request();
  track.dispatchEvent(new Event("ended"));
  assert.equal(p.state, "interrupted");
  p.release();
  assert.equal(track.stopped, true);
  assert.equal(closes.n, 1);
  p.release(); // safe twice
});

test("a request that resolves after the learner navigated away closes its stream", async () => {
  const { env, track } = fakeEnv();
  const p = new MicPreflight({ env, ...fastClock() });
  const pending = p.request();
  p.destroy();
  await pending;
  assert.equal(track.stopped, true);
});

// ── capture ────────────────────────────────────────────────────────────────────
test("MIME detection picks a supported type and labels the file by what the browser really produced", () => {
  const MR = class {
    static isTypeSupported = (m) => m === "audio/mp4";
  };
  assert.equal(pickMimeType(MR), "audio/mp4");
  assert.equal(extensionFor("audio/mp4"), "m4a");
  assert.equal(extensionFor("audio/webm;codecs=opus"), "webm");
  assert.equal(extensionFor("audio/ogg;codecs=opus"), "ogg");
  assert.equal(
    pickMimeType(
      class {
        static isTypeSupported = () => false;
      },
    ),
    "",
  );
  assert.equal(pickMimeType(undefined), null);
  assert.ok(
    !MIME_CANDIDATES.some((m) => /wav/.test(m)),
    "no WAV is offered: there is no WAV encoder",
  );
  assert.notEqual(extensionFor("audio/webm"), "wav", "a WebM blob is never labelled WAV");
});

test("Capture resolves a blob with the recorder's real MIME type and duration, and rejects an empty recording", async () => {
  let t = 0;
  class FakeMR extends EventTarget {
    static isTypeSupported = (m) => m === "audio/webm";
    state = "inactive";
    mimeType = "audio/webm";
    constructor(_stream, o) {
      super();
      this.o = o;
    }
    start() {
      this.state = "recording";
    }
    stop() {
      this.state = "inactive";
      const e = new Event("dataavailable");
      e.data = new Blob(["abc"], { type: this.mimeType });
      this.dispatchEvent(e);
      queueMicrotask(() => this.dispatchEvent(new Event("stop")));
    }
  }
  const cap = new Capture({}, { env: { MediaRecorder: FakeMR }, now: () => t });
  const p = cap.start();
  t = 4200;
  cap.sample(0.4);
  cap.stop();
  const r = await p;
  assert.equal(r.extension, "webm");
  assert.equal(r.mimeType, "audio/webm");
  assert.equal(r.seconds, 4.2);
  assert.deepEqual(r.env, [0.4]);
  class EmptyMR extends FakeMR {
    stop() {
      this.state = "inactive";
      queueMicrotask(() => this.dispatchEvent(new Event("stop")));
    }
  }
  const bad = new Capture({}, { env: { MediaRecorder: EmptyMR } });
  const bp = bad.start();
  bad.stop();
  await assert.rejects(bp, /empty/);
});

// ── speaking machine ───────────────────────────────────────────────────────────
const machineIo = ({ failPut = false, noHas = false } = {}) => {
  const timers = [];
  const stored = new Map();
  let capture;
  const io = {
    now: () => 1234,
    setTimer: (fn) => (timers.push(fn), timers.length),
    clearTimer: () => {},
    capture: () =>
      (capture = {
        resolve: null,
        started: false,
        aborted: false,
        start() {
          this.started = true;
          return new Promise((r) => (this.resolve = r));
        },
        stop() {
          this.resolve({
            blob: new Blob(["x"], { type: "audio/webm" }),
            mimeType: "audio/webm",
            extension: "webm",
            seconds: 3,
            env: [0.1],
            fps: 20,
          });
        },
        abort() {
          this.aborted = true;
        },
      }),
    store: {
      put: async (r) => {
        if (failPut) throw Object.assign(new Error("full"), { name: "QuotaExceededError" });
        stored.set(r.id, r);
      },
      has: async (id) => !noHas && stored.has(id),
    },
  };
  return {
    io,
    timers,
    stored,
    cap: () => capture,
    tick: (n = 1) => {
      for (let i = 0; i < n; i++) timers.at(-1)?.();
    },
  };
};
const tick = () => new Promise((r) => setTimeout(r, 0));

test("speaking walks READY -> PREPARING -> RECORDING -> REVIEWING -> CONFIRMING -> SUBMITTED and stores before submitting", async () => {
  const m = machineIo();
  const sm = new SpeakingMachine({ prepSeconds: 3, recordSeconds: 20, takes: 1 }, m.io);
  const seen = [];
  sm.on((s) => seen.push(s.state));
  assert.equal(sm.begin(), true);
  assert.equal(sm.state, "PREPARING");
  m.tick(3); // preparation ends -> recording starts by itself
  assert.equal(sm.state, "RECORDING");
  assert.ok(m.cap().started);
  assert.equal(sm.stop(), true);
  await tick();
  assert.equal(sm.state, "REVIEWING");
  assert.equal(sm.rerecord(), false, "single-take practice cannot re-record");
  assert.ok(sm.useTake());
  assert.equal(m.stored.size, 0, "nothing is stored until the learner confirms");
  assert.equal(await sm.confirm(), true);
  assert.equal(sm.state, "SUBMITTED");
  assert.equal(m.stored.size, 1);
  assert.equal(await sm.confirm(), false, "SUBMITTED is final: no duplicate submission");
  assert.deepEqual(
    seen.filter((s, i) => s !== seen[i - 1]),
    ["PREPARING", "RECORDING", "PROCESSING", "REVIEWING", "CONFIRMING", "SUBMITTED"],
  );
});

test("speaking: two-take practice allows one re-record; illegal jumps throw", async () => {
  const m = machineIo();
  const sm = new SpeakingMachine({ prepSeconds: 0, recordSeconds: 20, takes: 2 }, m.io);
  sm.begin();
  assert.equal(sm.state, "RECORDING", "no preparation time goes straight to recording");
  sm.stop();
  await tick();
  assert.equal(sm.takesLeft, 1);
  assert.ok(sm.rerecord());
  sm.stop();
  await tick();
  assert.equal(sm.rerecord(), false, "both takes used");
  assert.throws(() => sm.go("SUBMITTED"), /illegal/);
  assert.equal(clampPrep(99), 45);
  assert.equal(clampPrep(-3), 0);
});

test("speaking never declares success when the audio did not save", async () => {
  for (const opts of [{ failPut: true }, { noHas: true }]) {
    const m = machineIo(opts);
    const sm = new SpeakingMachine({ prepSeconds: 0, recordSeconds: 20, takes: 1 }, m.io);
    sm.begin();
    sm.stop();
    await tick();
    sm.useTake();
    assert.equal(await sm.confirm(), false);
    assert.equal(sm.state, "CONFIRMING", "stays recoverable");
    assert.ok(sm.error);
    assert.equal(sm.submitted, null);
  }
});

test("an interrupted microphone abandons the take and returns to READY with an explanation", () => {
  const m = machineIo();
  const sm = new SpeakingMachine({ prepSeconds: 0, recordSeconds: 20, takes: 1 }, m.io);
  sm.begin();
  sm.interrupted();
  assert.equal(sm.state, "READY");
  assert.match(sm.error, /interrupted/);
  assert.equal(m.cap().aborted, true);
});

// ── listening ──────────────────────────────────────────────────────────────────
const player = (outcomes, clock) => ({
  play: async () => {
    const o = outcomes.shift();
    clock.t += o.ms;
    return o.out;
  },
  stop() {},
});
test("listening allows two plays, counts a heard play, refunds a failed one, and stops at zero", async () => {
  const clock = { t: 0 };
  const used = [];
  const e = new ListeningEngine({
    player: player(
      [
        { out: "failed", ms: 100 },
        { out: "ended", ms: 8000 },
        { out: "ended", ms: 8000 },
      ],
      clock,
    ),
    maxPlays: 2,
    onUsed: (n) => used.push(n),
    now: () => clock.t,
  });
  assert.equal(await e.play(), "failed");
  assert.equal(e.remaining, 2, "a failed play costs nothing");
  assert.equal(await e.play(), "ended");
  assert.equal(e.remaining, 1);
  assert.equal(await e.play(), "ended");
  assert.equal(e.remaining, 0);
  assert.equal(await e.play(), "none-left");
  assert.deepEqual(used, [1, 2]);
});

test("listening: an interruption after audio was heard still counts, and refresh cannot reset the count", async () => {
  const clock = { t: 0 };
  const e = new ListeningEngine({
    player: player([{ out: "failed", ms: MIN_HEARD_MS + 10 }], clock),
    maxPlays: 2,
    now: () => clock.t,
  });
  assert.equal(await e.play(), "stopped");
  assert.equal(e.used, 1);
  const restored = new ListeningEngine({ player: player([], clock), maxPlays: 2, used: 2 });
  assert.equal(restored.remaining, 0);
  assert.equal(await restored.play(), "none-left");
});

test("listening: a simulation cannot pause or stop; learning mode can", () => {
  const sim = new ListeningEngine({
    player: {
      play: async () => "ended",
      stop() {
        throw new Error("stopped");
      },
    },
    mode: "summative",
  });
  assert.equal(sim.canPause, false);
  sim.status = "playing";
  assert.doesNotThrow(() => sim.stop());
  const learn = new ListeningEngine({
    player: { play: async () => "ended", stop() {} },
    mode: "formative",
  });
  assert.equal(learn.canPause, true);
});

test("tts player speaks structured turns as dialogue and plain scripts as one segment", async () => {
  const calls = [];
  const speech = {
    speak: async (s) => (calls.push(["speak", s]), true),
    speakDialogue: async (l) => (calls.push(["dialogue", l]), true),
    stop() {},
  };
  assert.equal(await ttsPlayer({ script: "Hello there." }, speech).play(), "ended");
  assert.equal(
    await ttsPlayer(
      {
        turns: [
          { speaker: "Teacher", text: "Hi" },
          { speaker: "Student one", text: "Hello" },
        ],
      },
      speech,
    ).play(),
    "ended",
  );
  assert.deepEqual(calls[1], ["dialogue", ["Teacher: Hi", "Student one: Hello"]]);
  assert.equal(
    await ttsPlayer({ script: "x" }, { ...speech, speak: async () => false }).play(),
    "failed",
  );
});

// ── storage fallback (the IndexedDB adapter itself is exercised in a real browser) ──
test("memory storage: same contract, atomic batches, import never overwrites, invalid input is a typed error", async () => {
  const s = new _testing.MemoryStorage();
  assert.equal(s.persistent, false);
  await s.recordings.put({ id: "r1", blob: new Blob(["abc"]), mimeType: "audio/webm" });
  assert.equal(await s.recordings.has("r1"), true);
  await assert.rejects(
    s.recordings.put({ id: "r2" }),
    (e) => e instanceof StorageError && e.code === "invalid",
  );
  await s.saveSessionWithEvidence({
    session: { id: "s1", setId: "x", learner: "L1" },
    rows: [{ learner: "L1", itemId: "i1", t: 1, domain: "Reading" }],
  });
  assert.equal((await s.progress.list({ learner: "L1" })).length, 1);
  const exp = await s.exportAll({ includeRecordings: true });
  assert.ok(!JSON.stringify(exp).includes("learnerId"), "the device id is not exported");
  const other = new _testing.MemoryStorage();
  assert.deepEqual(await other.importAll(exp), { added: 3, conflicts: 0 });
  assert.deepEqual(await other.importAll(exp), { added: 0, conflicts: 3 });
  await assert.rejects(other.importAll({ format: "nope" }), /compatible/);
  assert.deepEqual(await s.purge({ recordings: true }), ["recordings"]);
  assert.equal(await s.recordings.has("r1"), false);
  assert.match(await s.learnerId(), /^L-/);
});
