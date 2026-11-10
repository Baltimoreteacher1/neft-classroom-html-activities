// Procedural sound for engine games: no audio files, Web Audio only.
//
// The AudioContext is created on the first user gesture (browsers refuse to
// start one before that). Sounds play on EVENTS (a lock, a solve, a strain),
// never per frame; Web Audio source nodes are single-use by design, so each
// event builds a few short-lived nodes that the browser frees after stop().
// Dial ticks are rate-limited so holding an arrow key does not stack hundreds.

const MASTER_GAIN = 0.5;

export class Synth {
  constructor() {
    /** @type {AudioContext | null} */
    this.ctx = null;
    /** @type {GainNode | null} */
    this.master = null;
    this.muted = false;
    this.lastTick = 0;
  }

  /** Create or resume the context. Call from a pointer or key handler. */
  unlock() {
    if (!this.ctx) {
      const Ctor = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
      if (!Ctor) return;
      try {
        this.ctx = new Ctor();
      } catch {
        return;
      }
      this.master = this.ctx.createGain();
      this.master.gain.value = MASTER_GAIN;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master && this.ctx)
      this.master.gain.setTargetAtTime(muted ? 0 : MASTER_GAIN, this.ctx.currentTime, 0.02);
  }

  ready() {
    return !!this.ctx && !this.muted && this.ctx.state === "running";
  }

  /**
   * One enveloped oscillator voice.
   * @param {number} freq
   * @param {OscillatorType} type
   * @param {number} start seconds from now
   * @param {number} dur seconds
   * @param {number} peak gain
   * @param {BiquadFilterType | null} [filter]
   * @param {number} [cutoff]
   * @param {number} [detune] cents
   */
  voice(freq, type, start, dur, peak, filter = null, cutoff = 0, detune = 0) {
    const ctx = this.ctx;
    const t0 = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    osc.detune.setValueAtTime(detune, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let tail = /** @type {AudioNode} */ (osc);
    if (filter) {
      const biquad = ctx.createBiquadFilter();
      biquad.type = filter;
      biquad.frequency.value = cutoff;
      osc.connect(biquad);
      tail = biquad;
    }
    tail.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  /** Mastery: ascending A4 → C5 → E5 triangle chord with soft decay. */
  success() {
    if (!this.ready()) return;
    this.voice(440, "triangle", 0, 0.9, 0.16);
    this.voice(523.25, "triangle", 0.09, 0.9, 0.14);
    this.voice(659.25, "triangle", 0.18, 1.1, 0.13);
  }

  /** Dial tick: high-passed 1200 Hz click, ~8 ms, rate-limited. */
  tick() {
    if (!this.ready()) return;
    const now = this.ctx.currentTime;
    if (now - this.lastTick < 0.035) return;
    this.lastTick = now;
    this.voice(1200, "square", 0, 0.008, 0.05, "highpass", 900);
  }

  /** Weight impact: low sine thump, 55-110 Hz scaled by `heft` 0..1. */
  impact(heft = 0.5) {
    if (!this.ready()) return;
    this.voice(110 - 55 * Math.min(1, Math.max(0, heft)), "sine", 0, 0.35, 0.3);
  }

  /** Snap / lock into place: short mid click over a low body. */
  lock() {
    if (!this.ready()) return;
    this.voice(880, "triangle", 0, 0.06, 0.08);
    this.voice(165, "sine", 0, 0.18, 0.16);
  }

  /** Strain / error: low-passed detuned sub-bass, gentle, never a buzzer. */
  strain() {
    if (!this.ready()) return;
    this.voice(62, "sawtooth", 0, 0.55, 0.12, "lowpass", 220, -18);
    this.voice(65, "sawtooth", 0.02, 0.55, 0.1, "lowpass", 220, 22);
  }
}

/** Short vibration on devices that support it (Android Chromebooks, phones). */
export function haptic(pattern) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    /* unsupported or blocked: haptics are optional */
  }
}
