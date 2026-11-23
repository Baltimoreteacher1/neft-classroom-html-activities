// Listening policy: how many times a recording may be replayed, and at what speed, by scaffold tier.
//
//   Independent  2 plays per audio clip (the test-like condition), normal speed only
//   Guided       unlimited plays, 0.85x slow toggle, the text being spoken is highlighted while it plays
//   Hands-on     the same as Guided
//
// Pure functions over a small JSON-safe record `{ plays: { [clip]: n }, slow: false }` that rides inside the
// saved game session, so a refresh cannot hand a learner their replays back. Applies only to games whose
// domain is Listening: a read-aloud button in a Reading game is a support, not a listening task.
import { TIERS } from "./meta.js";

export const SLOW_FACTOR = 0.85;
export const emptyListening = () => ({ plays: {}, slow: false });

/** A clip is identified by its spoken text, trimmed so long passages stay small in storage. */
export const clipKey = (text) =>
  String(text ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);

export function cleanListening(raw) {
  const out = emptyListening();
  if (!raw || typeof raw !== "object") return out;
  if (raw.plays && typeof raw.plays === "object") {
    for (const [k, n] of Object.entries(raw.plays).slice(0, 200))
      if (Number.isInteger(n) && n > 0 && n < 1000) out.plays[String(k).slice(0, 80)] = n;
  }
  out.slow = raw.slow === true;
  return out;
}

export const replayLimit = (tier) => (TIERS[tier] ? TIERS[tier].replays : Infinity);
export const slowAllowed = (tier) => tier !== "independent";
export const playsLeft = (state, text, tier) => {
  const limit = replayLimit(tier);
  return limit === Infinity ? Infinity : Math.max(0, limit - (state.plays[clipKey(text)] || 0));
};

/**
 * One play request. Returns { ok, state, rate }: `ok` false means the clip is spent (the caller announces it and does
 * not speak). `baseRate` is the learner's normal speech rate; Independent never slows.
 */
export function requestPlay(state, text, tier, baseRate = 0.9) {
  const key = clipKey(text);
  if (!key) return { ok: false, state, rate: baseRate };
  if (playsLeft(state, text, tier) <= 0) return { ok: false, state, rate: baseRate };
  const next = { ...state, plays: { ...state.plays, [key]: (state.plays[key] || 0) + 1 } };
  const slow = slowAllowed(tier) && state.slow;
  return {
    ok: true,
    state: next,
    rate: slow ? Math.round(baseRate * SLOW_FACTOR * 100) / 100 : baseRate,
  };
}

export const toggleSlow = (state, tier) =>
  slowAllowed(tier) ? { ...state, slow: !state.slow } : { ...state, slow: false };

/** Mark each play button in `root` with how many plays remain, so CSS and assistive tech can say it. */
export function decorateAudio(root, state, tier) {
  for (const b of root.querySelectorAll("[data-say]")) {
    const left = playsLeft(state, b.dataset.say, tier);
    if (left === Infinity) {
      b.removeAttribute("data-plays-left");
      b.removeAttribute("aria-disabled");
      b.classList.remove("is-spent");
      continue;
    }
    b.dataset.playsLeft = String(left);
    b.classList.toggle("is-spent", left === 0);
    if (left === 0) b.setAttribute("aria-disabled", "true");
    else b.removeAttribute("aria-disabled");
  }
}
