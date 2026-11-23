// Vocabulary Academy games — the shared "game feel" layer: a quiet sound set (off until the learner turns it on), a small
// burst of sparkles on a right answer, first-try gems, and the medals on the finish cards. Nothing here is timed, nothing
// takes anything away on a miss, and every effect is decoration: the words and icons carry the meaning, so a muted,
// reduced-motion or screen-reader learner loses nothing. Pure helpers are exported for tests; DOM helpers fail soft.
const KEY = "va-games-sound";

/** Learner's sound choice. Storage can be blocked, so every read and write is guarded. */
export function soundOn() {
  try {
    return globalThis.localStorage?.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
export function setSound(on) {
  try {
    globalThis.localStorage?.setItem(KEY, on ? "1" : "0");
  } catch {}
  return Boolean(on);
}

export const reducedMotion = () => {
  try {
    return Boolean(globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  } catch {
    return false;
  }
};

let ctx = null;
const audio = () => {
  if (ctx) return ctx;
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
  } catch {
    ctx = null;
  }
  return ctx;
};

/** Notes (Hz, start offset s, length s) for each cue. Soft sine tones, low volume; a miss is one low, gentle note. */
export const CUES = {
  ok: [
    [523.25, 0, 0.12],
    [783.99, 0.09, 0.2],
  ],
  retry: [[261.63, 0, 0.18]],
  done: [
    [523.25, 0, 0.14],
    [659.25, 0.11, 0.14],
    [783.99, 0.22, 0.14],
    [1046.5, 0.33, 0.34],
  ],
  step: [[659.25, 0, 0.1]],
};

/** Play a cue when the learner has sound on. Resolves quietly when audio is unavailable or blocked. */
export function cue(name) {
  if (!soundOn()) return false;
  const notes = CUES[name];
  const ac = audio();
  if (!notes || !ac) return false;
  try {
    if (ac.state === "suspended") ac.resume?.();
    const t0 = ac.currentTime;
    for (const [freq, at, len] of notes) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0 + at);
      gain.gain.exponentialRampToValueAtTime(0.11, t0 + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + at + len);
      osc.connect(gain).connect(ac.destination);
      osc.start(t0 + at);
      osc.stop(t0 + at + len + 0.05);
    }
    return true;
  } catch {
    return false;
  }
}

const SPARKS = 9;
/** A ring of small sparkles on an element. Removed by itself; skipped for reduced motion. */
export function burst(el, { big = false } = {}) {
  if (!el || reducedMotion() || typeof document === "undefined") return;
  const wrap = document.createElement("span");
  wrap.className = `vag-burst${big ? " vag-burst-big" : ""}`;
  wrap.setAttribute("aria-hidden", "true");
  const n = big ? SPARKS * 2 : SPARKS;
  for (let i = 0; i < n; i++) {
    const s = document.createElement("i");
    const a = (360 / n) * i;
    s.style.setProperty("--a", `${a}deg`);
    s.style.setProperty("--d", `${(big ? 46 : 26) + (i % 3) * 7}px`);
    s.style.animationDelay = `${(i % 4) * 18}ms`;
    wrap.append(s);
  }
  el.append(wrap);
  setTimeout(() => wrap.remove(), 900);
}

/** Medal for one finished word: gold = right with no miss, silver = right after one miss, bronze = right after more. */
export function medalFor(row) {
  if (!row || !(row.correct > 0)) return "";
  if (row.misses === 0) return "gold";
  return row.misses === 1 ? "silver" : "bronze";
}
export const MEDAL_LABEL = {
  gold: ["Gold: right with no misses", "Oro: correcta sin errores"],
  silver: ["Silver: right after one miss", "Plata: correcta tras un error"],
  bronze: ["Bronze: right after a few tries", "Bronce: correcta tras varios intentos"],
};

/** Gems for a run: one per judged answer that was right on the first try. Pure: { gems, of } from the run's log. */
export function gemCount(log) {
  const judged = (log || []).filter((e) => e && typeof e.ok === "boolean");
  return { gems: judged.filter((e) => e.ok && e.firstTry).length, of: judged.length };
}

/** A short, kind line for the finish card, chosen by the share of first-try answers. Never mentions a score of failure. */
export function cheerKey(sum) {
  const total = sum?.judged || 0;
  if (!total) return "start";
  const r = (sum.firstTry || 0) / total;
  if (r >= 0.9) return "shine";
  if (r >= 0.6) return "strong";
  return "growing";
}
export const CHEER = {
  shine: ["You shone on almost every word.", "Brillaste en casi todas las palabras."],
  strong: [
    "A strong run. The words you missed are the ones to look at again.",
    "Una buena ronda. Las palabras que fallaste son las que conviene repasar.",
  ],
  growing: [
    "Every miss is a clue. Look at the words below and play again.",
    "Cada error es una pista. Mira las palabras de abajo y juega otra vez.",
  ],
  start: ["", ""],
};
