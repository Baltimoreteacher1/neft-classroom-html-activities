// Stage 3: Harmonic Audio Engine (Web Audio API Mathematical Sonification)
// Generates pure algorithmic harmonic intervals for mathematical equivalence, balance, and resolution.
// Zero audio assets, 100% offline, calm volume, completely disabled when user settings disable sound.

let audioCtx = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Synthesizes a soft sine chord.
 * @param {number[]} frequencies Array of frequencies in Hz
 * @param {number} duration Duration in seconds
 * @param {number} masterGain Master volume (0.0 to 1.0)
 */
function playChord(frequencies, duration = 0.5, masterGain = 0.12) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(masterGain, now + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  gainNode.connect(ctx.destination);

  frequencies.forEach((freq) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    osc.connect(gainNode);
    osc.start(now);
    osc.stop(now + duration);
  });
}

/**
 * 1. EQUIVALENCE / BALANCED HARMONY
 * Pure consonant major triad (C4, E4, G4, C5) signaling mathematical truth and balance.
 */
export function playConsonantHarmony() {
  // C4 = 261.63, E4 = 329.63, G4 = 392.00, C5 = 523.25
  playChord([261.63, 329.63, 392.00, 523.25], 0.6, 0.15);
}

/**
 * 2. UNBALANCED / TENSION CHORD
 * Soft warm detuned interval signaling that two expressions or sides are not yet equal.
 */
export function playTensionInterval() {
  // C4 = 261.63, F#4 = 369.99 (Tritone, softened)
  playChord([261.63, 369.99], 0.35, 0.08);
}

/**
 * 3. RESOLUTION ARPEGGIO
 * Tension chord quickly resolving into the harmonic consonant chord (satisfaction of equality).
 */
export function playResolutionSequence() {
  const ctx = getAudioContext();
  if (!ctx) return;

  playTensionInterval();
  setTimeout(() => {
    playConsonantHarmony();
  }, 250);
}

/**
 * 4. STEP PROCEED CHIME
 * Gentle single-frequency ascending chime for step progress.
 */
export function playStepChime(stepNumber = 1) {
  const baseFreq = 440; // A4
  const semitones = Math.min(12, stepNumber * 2);
  const freq = baseFreq * Math.pow(2, semitones / 12);
  playChord([freq], 0.25, 0.1);
}
