// SoundEngine.js — Zero-dependency Web Audio API synthesizer for ACCESS Practice Lab Games & Worlds.
// Synthesizes crisp correct chime, combo pitch-escalation, gentle error thud, hint sparkle, and level-up chord.
// Persistent Mute/Unmute toggle in localStorage; unlocks safely on first user gesture; zero external audio assets.

import { storage } from "../util.js";

const MUTE_KEY = "tlp_games_v2_sound_muted";

let audioCtx = null;
let masterGain = null;
let unlocked = false;

function readMuted() {
  try {
    return storage.get(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeMuted(muted) {
  try {
    storage.set(MUTE_KEY, muted ? "1" : "0");
  } catch {}
}

let isMutedState = readMuted();

function ensureContext() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) {
    try {
      audioCtx = new AC();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = isMutedState ? 0 : 0.32;
      masterGain.connect(audioCtx.destination);
    } catch {
      return null;
    }
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(ctx, { freq, type = "sine", startOffset = 0, duration = 0.14, gainPeak = 0.25, freqEnd = null }) {
  if (!ctx || !masterGain || isMutedState) return;
  const now = ctx.currentTime + startOffset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (freqEnd && freqEnd > 0) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, now + duration);
  }
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(gainPeak, now + Math.min(0.018, duration * 0.25));
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + duration + 0.01);
}

export const SoundEngine = {
  isMuted() {
    isMutedState = readMuted();
    return isMutedState;
  },

  setMuted(muted) {
    isMutedState = Boolean(muted);
    writeMuted(isMutedState);
    if (masterGain && audioCtx) {
      masterGain.gain.setValueAtTime(isMutedState ? 0 : 0.32, audioCtx.currentTime);
    }
    return isMutedState;
  },

  toggleMute() {
    const next = !this.isMuted();
    this.setMuted(next);
    if (!next) {
      this.unlock();
      this.playClick();
    }
    return next;
  },

  unlock() {
    if (unlocked && audioCtx && audioCtx.state === "running") return true;
    const ctx = ensureContext();
    if (!ctx) return false;
    unlocked = true;
    return true;
  },

  /** Crisp two-note ascending chime for correct answers. */
  playCorrect(combo = 1) {
    if (this.isMuted()) return;
    const ctx = ensureContext();
    if (!ctx) return;
    const step = Math.min(Math.max(0, Number(combo) - 1), 8);
    // Semitone pitch escalation on combo streaks (up to +8 semitones)
    const mult = Math.pow(2, step / 12);
    playTone(ctx, { freq: 523.25 * mult, type: "triangle", startOffset: 0, duration: 0.11, gainPeak: 0.24 });
    playTone(ctx, { freq: 659.25 * mult, type: "triangle", startOffset: 0.075, duration: 0.17, gainPeak: 0.28 });
    if (step >= 2) {
      playTone(ctx, { freq: 783.99 * mult, type: "sine", startOffset: 0.14, duration: 0.19, gainPeak: 0.22 });
    }
  },

  /** Explicit combo pitch-escalation fanfare for 3+ streaks. */
  playCombo(streak = 2) {
    if (this.isMuted()) return;
    const ctx = ensureContext();
    if (!ctx) return;
    const step = Math.min(Math.max(1, Number(streak) - 1), 10);
    const base = 440 * Math.pow(2, step / 12);
    playTone(ctx, { freq: base, type: "triangle", startOffset: 0, duration: 0.09, gainPeak: 0.22 });
    playTone(ctx, { freq: base * 1.25, type: "triangle", startOffset: 0.065, duration: 0.12, gainPeak: 0.25 });
    playTone(ctx, { freq: base * 1.5, type: "sine", startOffset: 0.13, duration: 0.18, gainPeak: 0.24 });
  },

  /** Gentle low-frequency soft thud on error/retry (never harsh or buzzer-like). */
  playError() {
    if (this.isMuted()) return;
    const ctx = ensureContext();
    if (!ctx) return;
    playTone(ctx, { freq: 210, freqEnd: 145, type: "sine", startOffset: 0, duration: 0.16, gainPeak: 0.2 });
    playTone(ctx, { freq: 165, freqEnd: 120, type: "triangle", startOffset: 0.05, duration: 0.14, gainPeak: 0.15 });
  },

  /** Soft sparkle bell when a hint or Streak Shield triggers. */
  playHint() {
    if (this.isMuted()) return;
    const ctx = ensureContext();
    if (!ctx) return;
    playTone(ctx, { freq: 587.33, type: "sine", startOffset: 0, duration: 0.12, gainPeak: 0.16 });
    playTone(ctx, { freq: 880, type: "sine", startOffset: 0.06, duration: 0.15, gainPeak: 0.14 });
  },

  /** Warm major triad arpeggio chord on game/mission completion or badge unlock. */
  playLevelUp() {
    if (this.isMuted()) return;
    const ctx = ensureContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      playTone(ctx, {
        freq,
        type: idx === notes.length - 1 ? "sine" : "triangle",
        startOffset: idx * 0.075,
        duration: idx === notes.length - 1 ? 0.34 : 0.18,
        gainPeak: 0.24,
      });
    });
  },

  /** Subtle tactile tap sound on UI toggle. */
  playClick() {
    if (this.isMuted()) return;
    const ctx = ensureContext();
    if (!ctx) return;
    playTone(ctx, { freq: 640, freqEnd: 720, type: "sine", startOffset: 0, duration: 0.045, gainPeak: 0.12 });
  },
};

export default SoundEngine;
