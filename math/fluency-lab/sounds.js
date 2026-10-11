// Optional soft sound effects. Off until the learner turns them on; there is no sound for a wrong answer.
import { readLocal, writeLocal } from "./school-tools.js";

const KEY = "ewl-fluency-sound-v1";
const NOTES = { good: [523.25, 659.25], win: [523.25, 659.25, 783.99, 1046.5] };
let enabled = null;
let context = null;

export const soundOn = () => (enabled ??= readLocal(KEY, false) === true);

export function setSound(next) {
  enabled = Boolean(next);
  writeLocal(KEY, enabled);
  if (enabled) chime("good");
}

export function chime(kind) {
  if (!soundOn() || !NOTES[kind]) return;
  const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!Audio) return;
  try {
    context ||= new Audio();
    if (context.state === "suspended") context.resume();
    NOTES[kind].forEach((frequency, i) => {
      const start = context.currentTime + i * 0.11;
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.07, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain).connect(context.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch {
    /* sound is optional */
  }
}
