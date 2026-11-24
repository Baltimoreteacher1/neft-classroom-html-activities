// Web Audio sound design: every cue is synthesised, so the arcade ships with no
// audio files and works offline. Speech uses the device voice (no recordings,
// no uploads) and always fails silently if a browser has none installed.
import { store } from "./store.js";

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.volume = 0.55;
  }

  get enabled() {
    return store.settings.sound !== false;
  }

  ensure() {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      try {
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.volume;
        this.master.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  tone(freq, { dur = 0.16, type = "sine", gain = 0.16, at = 0, glide = null, detune = 0 } = {}) {
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(30, freq), t0);
    osc.detune.value = detune;
    if (glide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, glide), t0 + dur);
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.014);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.04);
  }

  noise({ dur = 0.28, gain = 0.09, at = 0, from = 1600, to = 240 } = {}) {
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + at;
    const frames = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 0.9;
    filter.frequency.setValueAtTime(from, t0);
    filter.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(amp).connect(this.master);
    src.start(t0);
  }

  click() {
    this.tone(1100, { dur: 0.045, gain: 0.05, type: "triangle" });
  }

  hover() {
    this.tone(1500, { dur: 0.03, gain: 0.022, type: "sine" });
  }

  correct(streak = 0) {
    const lift = Math.min(streak, 6) * 22;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((f, i) =>
      this.tone(f + lift, { dur: 0.2, at: i * 0.062, gain: 0.12, type: "triangle" })
    );
    this.tone(1046.5 + lift, { dur: 0.32, at: 0.19, gain: 0.05, type: "sine" });
  }

  partial() {
    this.tone(392, { dur: 0.16, gain: 0.1, type: "triangle" });
    this.tone(523.25, { dur: 0.22, at: 0.12, gain: 0.08, type: "triangle" });
  }

  wrong() {
    this.tone(196, { dur: 0.24, gain: 0.11, type: "sine", glide: 138 });
    this.noise({ dur: 0.16, gain: 0.05, from: 500, to: 160 });
  }

  hint() {
    this.tone(660, { dur: 0.09, gain: 0.06, type: "sine" });
    this.tone(880, { dur: 0.12, at: 0.08, gain: 0.05, type: "sine" });
  }

  whoosh() {
    this.noise({ dur: 0.34, gain: 0.055, from: 2200, to: 320 });
  }

  start() {
    [392, 523.25, 659.25, 783.99].forEach((f, i) =>
      this.tone(f, { dur: 0.24, at: i * 0.07, gain: 0.09, type: "triangle" })
    );
  }

  level() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
      this.tone(f, { dur: 0.26, at: i * 0.08, gain: 0.1, type: "triangle" })
    );
  }

  badge() {
    [783.99, 987.77, 1174.66].forEach((f, i) =>
      this.tone(f, { dur: 0.22, at: i * 0.05, gain: 0.07, type: "sine" })
    );
  }

  finish(stars = 3) {
    const chord = stars >= 3 ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 659.25, 783.99];
    chord.forEach((f, i) =>
      this.tone(f, { dur: 0.5, at: i * 0.03, gain: 0.11, type: "triangle" })
    );
    this.tone(261.63, { dur: 0.7, gain: 0.05, type: "sine" });
  }

  speakCue() {
    this.tone(880, { dur: 0.06, gain: 0.05, type: "sine" });
  }
}

export const sound = new SoundEngine();

let voices = [];

function loadVoices() {
  if (!("speechSynthesis" in window)) return;
  voices = window.speechSynthesis.getVoices() || [];
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  loadVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
}

function pickVoice(lang) {
  if (!voices.length) loadVoices();
  const exact = voices.find((v) => v.lang?.replace("_", "-") === lang);
  if (exact) return exact;
  const base = lang.slice(0, 2);
  return voices.find((v) => v.lang?.toLowerCase().startsWith(base)) || null;
}

export const canSpeak = () =>
  typeof window !== "undefined" && "speechSynthesis" in window;

/**
 * Read text aloud with the device voice.
 * @returns {boolean} false when speech is unavailable.
 */
export function speak(text, { rate = 0.95, pitch = 1.02, lang = "en-US", onend } = {}) {
  if (!canSpeak()) {
    window.setTimeout(() => onend?.(), 250);
    return false;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 1;
    const voice = pickVoice(lang);
    if (voice) utterance.voice = voice;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      sound.speakCue();
      onend?.();
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    onend?.();
    return false;
  }
}

export function stopSpeaking() {
  if (!canSpeak()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* noop */
  }
}

export const canRecord = () =>
  typeof navigator !== "undefined" &&
  !!navigator.mediaDevices?.getUserMedia &&
  typeof window.MediaRecorder !== "undefined";
