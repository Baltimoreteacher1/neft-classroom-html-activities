// Optional soft sound effects. Off until the learner turns them on; zero external audio files.
import { readLocal, writeLocal } from "./school-tools.js";

const KEY = "ewl-fluency-sound-v1";
const VOL_KEY = "ewl-fluency-volume-v1";

const PENTATONIC_FANFARE = [523.25, 587.33, 659.25, 783.99, 880.0]; // C5, D5, E5, G5, A5
const MAJOR_THIRD = [523.25, 659.25]; // C5, E5

const NOTES = {
  good: [523.25, 659.25, 783.99],
  automatic: PENTATONIC_FANFARE,
  strategic: MAJOR_THIRD,
  win: [523.25, 659.25, 783.99, 1046.5],
  hesitation: [261.63, 329.63],
  streak: [523.25, 659.25, 783.99, 1046.5, 1318.51],
};

let enabled = null;
let masterVolume = null;
let context = null;

export const soundOn = () => (enabled ??= readLocal(KEY, false) === true);

export function getVolume() {
  if (masterVolume === null) {
    const saved = readLocal(VOL_KEY, 0.7);
    masterVolume = typeof saved === "number" ? Math.max(0, Math.min(1, saved)) : 0.7;
  }
  return masterVolume;
}

export function setVolume(vol) {
  masterVolume = Math.max(0, Math.min(1, Number(vol) || 0));
  writeLocal(VOL_KEY, masterVolume);
}

export function setSound(next) {
  enabled = Boolean(next);
  writeLocal(KEY, enabled);
  if (enabled) chime("automatic");
}

export function playMarimbaTap() {
  if (!soundOn()) return;
  const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!Audio) return;
  try {
    context ||= new Audio();
    if (context.state === "suspended") context.resume();
    const start = context.currentTime;
    const vol = getVolume();

    // Two-tone soft damped marimba wood tap (no punitive buzzer)
    [220, 175].forEach((freq, idx) => {
      const t = start + idx * 0.06;
      const osc = context.createOscillator();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.85, t + 0.08);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.exponentialRampToValueAtTime(300, t + 0.08);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.04 * vol, t + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);

      osc.connect(filter).connect(gain).connect(context.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    });
  } catch {
    /* sound is optional */
  }
}

export function chime(kind) {
  if (!soundOn()) return;
  if (kind === "prompt" || kind === "wood_tap" || kind === "incorrect") {
    playMarimbaTap();
    return;
  }
  const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!Audio) return;
  try {
    context ||= new Audio();
    if (context.state === "suspended") context.resume();
    const vol = getVolume();

    if (kind === "slice" || kind === "flip") {
      const start = context.currentTime;
      const osc = context.createOscillator();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      osc.type = kind === "flip" ? "triangle" : "square";
      osc.frequency.setValueAtTime(kind === "flip" ? 220 : 420, start);
      osc.frequency.exponentialRampToValueAtTime(kind === "flip" ? 380 : 180, start + 0.04);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(kind === "flip" ? 600 : 900, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime((kind === "flip" ? 0.04 : 0.06) * vol, start + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.045);
      osc.connect(filter).connect(gain).connect(context.destination);
      osc.start(start);
      osc.stop(start + 0.05);
      return;
    }

    const notes = NOTES[kind] || NOTES.good;
    const isHesitation = kind === "hesitation";
    const isAutomatic = kind === "automatic";

    // Play chord fanfare or notes with gentle low-pass filter
    notes.forEach((frequency, i) => {
      const start = context.currentTime + i * (isHesitation ? 0.16 : isAutomatic ? 0.06 : 0.09);
      const osc = context.createOscillator();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();

      osc.type = "sine";
      osc.frequency.value = frequency;

      filter.type = "lowpass";
      filter.frequency.value = 2400;

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime((isHesitation ? 0.035 : 0.07) * vol, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + (isHesitation ? 0.28 : isAutomatic ? 0.22 : 0.14));

      osc.connect(filter).connect(gain).connect(context.destination);
      osc.start(start);
      osc.stop(start + (isHesitation ? 0.32 : isAutomatic ? 0.25 : 0.16));
    });
  } catch {
    /* sound is optional */
  }
}


