// Optional soft sound effects. Off until the learner turns them on; there is no sound for a wrong answer.
import { readLocal, writeLocal } from "./school-tools.js";

const KEY = "ewl-fluency-sound-v1";
const NOTES = {
  good: [523.25, 659.25, 783.99],
  win: [523.25, 659.25, 783.99, 1046.5],
  hesitation: [261.63, 329.63],
  streak: [523.25, 659.25, 783.99, 1046.5, 1318.51],
  sprint: [523.25, 659.25, 783.99, 1046.5],
};
let enabled = null;
let context = null;

export const soundOn = () => (enabled ??= readLocal(KEY, false) === true);

export function setSound(next) {
  enabled = Boolean(next);
  writeLocal(KEY, enabled);
  if (enabled) chime("good");
}

export function chime(kind) {
  if (!soundOn()) return;
  const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!Audio) return;
  try {
    context ||= new Audio();
    if (context.state === "suspended") context.resume();
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
      gain.gain.exponentialRampToValueAtTime(kind === "flip" ? 0.04 : 0.06, start + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.045);
      osc.connect(filter).connect(gain).connect(context.destination);
      osc.start(start);
      osc.stop(start + 0.05);
      return;
    }
    if (!NOTES[kind]) return;
    const isHesitation = kind === "hesitation";
    NOTES[kind].forEach((frequency, i) => {
      const start = context.currentTime + i * (isHesitation ? 0.16 : 0.09);
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(isHesitation ? 0.035 : 0.07, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + (isHesitation ? 0.28 : 0.14));
      osc.connect(gain).connect(context.destination);
      osc.start(start);
      osc.stop(start + (isHesitation ? 0.32 : 0.16));
    });
  } catch {
    /* sound is optional */
  }
}

