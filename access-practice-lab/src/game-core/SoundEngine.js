// SoundEngine.js — Zero-dependency Web Audio API synthesizer for ACCESS Practice Lab Games & Worlds.
// Synthesizes crisp correct chime, combo pitch-escalation, gentle error thud, hint sparkle, and level-up chord.
// Persistent Mute/Unmute toggle in localStorage; unlocks safely on first user gesture; zero external audio assets.

import { storage } from "../util.js";

const MUTE_KEY = "tlp_games_v2_sound_muted";
const VOL_KEY = "tlp_arcade_audio_v1";
const MASTER = 0.32;

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

// Separate SFX and speech volumes (0..1), persisted. Speech volume is read by the speech helpers; SFX scales the master.
function readVolumes() {
  try {
    const v = JSON.parse(storage.get(VOL_KEY) || "{}");
    const clamp = (n, d) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : d);
    return { sfx: clamp(v.sfx, 0.8), speech: clamp(v.speech, 1) };
  } catch {
    return { sfx: 0.8, speech: 1 };
  }
}
let volumes = readVolumes();
let voices = 0;
const lastPlayed = new Map();
const MAX_VOICES = 10;

function ensureContext() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) {
    try {
      audioCtx = new AC();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = isMutedState ? 0 : MASTER * volumes.sfx;
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
  if (!ctx || !masterGain || isMutedState || voices >= MAX_VOICES) return;
  voices += 1;
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
  osc.onended = () => {
    voices = Math.max(0, voices - 1);
  };
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
      masterGain.gain.setValueAtTime(isMutedState ? 0 : MASTER * volumes.sfx, audioCtx.currentTime);
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


  // ── publisher-grade cues (arcade games). Short harmonic envelopes; each is rate-limited so a burst cannot pile up. ──
  _cue(name, minGap, fn) {
    if (this.isMuted()) return;
    const ctx = ensureContext();
    if (!ctx) return;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - (lastPlayed.get(name) || -1e9) < minGap) return;
    lastPlayed.set(name, now);
    fn(ctx);
  },
  getVolumes() {
    return { ...volumes };
  },
  setVolume(kind, value) {
    if (kind !== "sfx" && kind !== "speech") return volumes;
    volumes = { ...volumes, [kind]: Math.min(1, Math.max(0, Number(value) || 0)) };
    try {
      storage.set(VOL_KEY, JSON.stringify(volumes));
    } catch {}
    if (kind === "sfx" && masterGain && audioCtx) masterGain.gain.setValueAtTime(isMutedState ? 0 : MASTER * volumes.sfx, audioCtx.currentTime);
    return { ...volumes };
  },
  /** Release the audio device when a game exits or the page is hidden. Safe to call repeatedly. */
  suspend() {
    if (audioCtx && audioCtx.state === "running") audioCtx.suspend().catch(() => {});
  },
  resume() {
    if (audioCtx && audioCtx.state === "suspended" && !isMutedState) audioCtx.resume().catch(() => {});
  },
  dispose() {
    voices = 0;
    lastPlayed.clear();
    if (audioCtx) {
      const c = audioCtx;
      audioCtx = null;
      masterGain = null;
      unlocked = false;
      c.close().catch(() => {});
    }
  },
  /** A rising two-step when the multiplier tier goes up (3, 5, 8). */
  playStreakUp(tier = 1) {
    this._cue("streak", 120, (ctx) => {
      const base = 392 * Math.pow(2, Math.min(4, tier) / 12 * 2);
      playTone(ctx, { freq: base, type: "triangle", duration: 0.1, gainPeak: 0.2 });
      playTone(ctx, { freq: base * 1.5, type: "triangle", startOffset: 0.08, duration: 0.2, gainPeak: 0.22 });
    });
  },
  /** Overdrive: a bright open fifth with a shimmer. */
  playOverdrive() {
    this._cue("overdrive", 600, (ctx) => {
      [523.25, 783.99, 1046.5, 1567.98].forEach((f, i) => playTone(ctx, { freq: f, type: i % 2 ? "sine" : "triangle", startOffset: i * 0.05, duration: 0.42, gainPeak: 0.2 }));
    });
  },
  playPurchase() {
    this._cue("purchase", 150, (ctx) => {
      playTone(ctx, { freq: 740, type: "triangle", duration: 0.08, gainPeak: 0.2 });
      playTone(ctx, { freq: 988, type: "sine", startOffset: 0.06, duration: 0.16, gainPeak: 0.2 });
      playTone(ctx, { freq: 1480, type: "sine", startOffset: 0.12, duration: 0.2, gainPeak: 0.12 });
    });
  },
  playShield() {
    this._cue("shield", 300, (ctx) => {
      playTone(ctx, { freq: 330, freqEnd: 660, type: "sine", duration: 0.28, gainPeak: 0.22 });
      playTone(ctx, { freq: 495, freqEnd: 990, type: "triangle", startOffset: 0.04, duration: 0.3, gainPeak: 0.14 });
    });
  },
  playRecovery() {
    this._cue("recovery", 300, (ctx) => {
      [440, 554.37, 659.25].forEach((f, i) => playTone(ctx, { freq: f, type: "sine", startOffset: i * 0.09, duration: 0.2, gainPeak: 0.2 }));
    });
  },
  /** Countdown beat: n = 3,2,1 ticks, 0 = the go chime. */
  playCountdown(n = 3) {
    this._cue(`count${n}`, 250, (ctx) => {
      if (n > 0) playTone(ctx, { freq: 523.25, type: "sine", duration: 0.12, gainPeak: 0.18 });
      else {
        playTone(ctx, { freq: 784, type: "triangle", duration: 0.12, gainPeak: 0.22 });
        playTone(ctx, { freq: 1047, type: "sine", startOffset: 0.08, duration: 0.3, gainPeak: 0.22 });
      }
    });
  },
  playWaveComplete() {
    this._cue("wave", 500, (ctx) => {
      [523.25, 659.25, 783.99].forEach((f, i) => playTone(ctx, { freq: f, type: "triangle", startOffset: i * 0.11, duration: 0.22, gainPeak: 0.22 }));
      playTone(ctx, { freq: 1046.5, type: "sine", startOffset: 0.36, duration: 0.4, gainPeak: 0.2 });
    });
  },
  playLevelTransition() {
    this._cue("transition", 600, (ctx) => {
      playTone(ctx, { freq: 392, freqEnd: 784, type: "sine", duration: 0.45, gainPeak: 0.18 });
      playTone(ctx, { freq: 587.33, freqEnd: 1174.66, type: "triangle", startOffset: 0.1, duration: 0.4, gainPeak: 0.12 });
    });
  },
  playVictory() {
    this._cue("victory", 1500, (ctx) => {
      const seq = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.51];
      seq.forEach((f, i) => playTone(ctx, { freq: f, type: i === seq.length - 1 ? "sine" : "triangle", startOffset: i * 0.12, duration: i === seq.length - 1 ? 0.7 : 0.2, gainPeak: 0.24 }));
    });
  },
  /** Game over is soft and falling, never a buzzer. */
  playGameOver() {
    this._cue("gameover", 1500, (ctx) => {
      [392, 349.23, 311.13, 261.63].forEach((f, i) => playTone(ctx, { freq: f, type: "sine", startOffset: i * 0.16, duration: 0.3, gainPeak: 0.18 }));
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
