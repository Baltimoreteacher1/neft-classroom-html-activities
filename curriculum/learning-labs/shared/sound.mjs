// Optional sound cues, synthesized (no files to load). Off until the student turns it on; the choice is remembered.
// Cues mark moments a student earned (hit a target, right prediction, solved, stamp) — never wrong answers.
const KEY = 'eduwonderlab:learning-lab:sound';
let ctx = null;
const read = () => { try { return localStorage.getItem(KEY) === 'on'; } catch { return false; } };
let on = null; // read lazily so importing this file never touches storage
const isOn = () => (on ??= read());

// frequencies in Hz, played in sequence
export const CUES = {
  tick: [660],
  hit: [523, 659, 784],
  star: [587, 784],
  stamp: [523, 659, 784, 1047],
  soft: [330],
};

export const enabled = () => isOn();
export function set(value) {
  on = !!value;
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* storage blocked */ }
  if (on) context(); // created inside the click that turned sound on, as browsers require
}
function context() {
  if (ctx) return ctx;
  const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!Audio) return null;
  try { ctx = new Audio(); } catch { ctx = null; }
  return ctx;
}
export function play(cue, pitchShift = 0) {
  if (!isOn() || !CUES[cue]) return false;
  const c = context();
  if (!c) return false;
  if (c.state === 'suspended') c.resume?.();
  const volume = cue === 'tick' ? 0.03 : 0.08;
  CUES[cue].forEach((hz, i) => {
    const osc = c.createOscillator(), gain = c.createGain(), t = c.currentTime + i * 0.11;
    osc.type = 'sine'; osc.frequency.value = hz * 2 ** (pitchShift / 12);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(t); osc.stop(t + 0.18);
  });
  return true;
}
