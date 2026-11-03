// Microphone preflight. A student must start every permission request and every recording: nothing here runs until
// request() is called from a click. It reports real state only (no fake meters): RMS comes from an AnalyserNode on the
// live stream.
//   idle -> requesting -> calibrating -> ready
//   requesting -> denied | unavailable | unsupported
//   calibrating -> silent (heard nothing) | ready
//   any -> interrupted (the track ended or was muted by the device)
export const RMS_SILENT = 0.008; // below this peak during calibration the microphone is treated as silent
export const CALIBRATION_MS = 3000;

/** Root-mean-square of float samples in [-1, 1]. */
export function rms(samples) {
  if (!samples?.length) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

/** @returns {"silent"|"ok"} using the loudest RMS heard while the student spoke. */
export function classifyCalibration({ peak }) {
  return peak < RMS_SILENT ? "silent" : "ok";
}

export function detectSupport(env = globalThis) {
  const nav = env.navigator;
  return {
    getUserMedia: Boolean(nav?.mediaDevices?.getUserMedia),
    audioContext: Boolean(env.AudioContext || env.webkitAudioContext),
    mediaRecorder: typeof env.MediaRecorder === "function",
    secure: env.isSecureContext !== false,
  };
}

export const PREFLIGHT_MESSAGES = {
  idle: "Check your microphone before you start.",
  requesting: "Your browser is asking to use the microphone. Choose Allow.",
  calibrating: "Say a sentence out loud, like “My name is…”. Checking for 3 seconds.",
  ready: "Your microphone is working.",
  denied: "The microphone is blocked. Allow it in your browser’s site settings, then try again.",
  unavailable: "No microphone was found. Plug one in or use another device, then try again.",
  unsupported: "This browser cannot record audio. Try a recent version of Chrome, Edge, Firefox or Safari.",
  silent: "The microphone did not hear you. Check that it is not muted, move closer, and try again.",
  interrupted: "The microphone stopped. Check the device, then check again.",
};

export class MicPreflight {
  /**
   * @param {object} [deps] injectable for tests: { env, now, schedule(fn, ms) -> cancel }
   */
  constructor({ env = globalThis, onState, onLevel, now = () => Date.now(), schedule } = {}) {
    this.env = env;
    this.onState = onState;
    this.onLevel = onLevel;
    this.now = now;
    this.schedule = schedule || ((fn, ms) => {
      const id = setInterval(fn, ms);
      return () => clearInterval(id);
    });
    this.state = "idle";
    this.stream = null;
    this.ctx = null;
    this.analyser = null;
    this.buffer = null;
    this.stopLoop = null;
    this.peak = 0;
    this.floor = 1;
    this.generation = 0;
  }

  set(state) {
    this.state = state;
    this.onState?.(state, PREFLIGHT_MESSAGES[state]);
  }
  support() {
    return detectSupport(this.env);
  }

  /** Instantaneous level 0..1 from the analyser (RMS of the current buffer). */
  level() {
    if (!this.analyser) return 0;
    this.analyser.getFloatTimeDomainData(this.buffer);
    return Math.min(1, rms(this.buffer) * 4); // scaled so ordinary speech fills most of the meter
  }
  rawRms() {
    if (!this.analyser) return 0;
    this.analyser.getFloatTimeDomainData(this.buffer);
    return rms(this.buffer);
  }

  /** Ask for the microphone and run the 3-second calibration. Must be called from a user gesture. */
  async request() {
    this.release();
    const gen = ++this.generation;
    const s = this.support();
    if (!s.getUserMedia || !s.audioContext || !s.mediaRecorder || !s.secure) {
      this.set("unsupported");
      return this.state;
    }
    this.set("requesting");
    let stream;
    try {
      stream = await this.env.navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (error) {
      if (gen !== this.generation) return this.state;
      const name = error?.name || "";
      this.set(name === "NotAllowedError" || name === "SecurityError" ? "denied" : name === "NotFoundError" || name === "OverconstrainedError" || name === "NotReadableError" ? "unavailable" : "unavailable");
      return this.state;
    }
    if (gen !== this.generation) {
      for (const t of stream.getTracks()) t.stop();
      return this.state;
    }
    this.stream = stream;
    const Ctx = this.env.AudioContext || this.env.webkitAudioContext;
    try {
      this.ctx = new Ctx();
      if (this.ctx.state === "suspended") await this.ctx.resume?.();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.buffer = new Float32Array(this.analyser.fftSize);
      this.ctx.createMediaStreamSource(stream).connect(this.analyser);
    } catch {
      this.release();
      this.set("unsupported");
      return this.state;
    }
    for (const track of stream.getAudioTracks?.() || stream.getTracks()) {
      track.addEventListener?.("ended", () => this.state !== "idle" && this.set("interrupted"));
      track.addEventListener?.("mute", () => this.state === "ready" && this.set("interrupted"));
    }
    return this.calibrate(gen);
  }

  calibrate(gen) {
    this.set("calibrating");
    this.peak = 0;
    this.floor = 1;
    const started = this.now();
    return new Promise((resolve) => {
      this.stopLoop = this.schedule(() => {
        if (gen !== this.generation) return resolve(this.state);
        const v = this.rawRms();
        this.peak = Math.max(this.peak, v);
        this.floor = Math.min(this.floor, v);
        this.onLevel?.(Math.min(1, v * 4), this.now() - started);
        if (this.now() - started >= CALIBRATION_MS) {
          this.stopLoop?.();
          this.stopLoop = null;
          this.set(classifyCalibration({ peak: this.peak }) === "silent" ? "silent" : "ready");
          resolve(this.state);
        }
      }, 50);
    });
  }

  /** Hands the live stream to the recorder; the preflight keeps ownership of cleanup. */
  takeStream() {
    return this.state === "ready" ? this.stream : null;
  }
  get ready() {
    return this.state === "ready";
  }

  /** Stop every track and close the AudioContext. Safe to call repeatedly. */
  release() {
    this.stopLoop?.();
    this.stopLoop = null;
    for (const t of this.stream?.getTracks?.() || []) t.stop();
    this.stream = null;
    this.ctx?.close?.().catch?.(() => {});
    this.ctx = null;
    this.analyser = null;
  }
  destroy() {
    this.generation++;
    this.release();
    this.state = "idle";
  }
}
