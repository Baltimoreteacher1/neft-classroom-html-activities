// Vocabulary Academy games — shared helpers for the "signature interaction" pass on Word Quest, Context Detective,
// Word Builder, Meaning Match and Word Sort. Decoration only: every helper fails soft, does nothing under reduced
// motion, and never changes what the learner can do or read. A game's state is never touched from here.
import { reducedMotion } from "./fx.js";

export const motionOK = () => typeof document !== "undefined" && !reducedMotion();

/** Scratch space for what the last render showed, kept per mounted game (never stored, never saved). */
export const mem = (env) => {
  env.vga ||= {};
  return env.vga;
};

/** True exactly once when `now` goes from false to true for `key`. The first sighting only records it, so a resumed run is quiet. */
export function rose(env, key, now) {
  const m = mem(env);
  const was = m[key];
  m[key] = Boolean(now);
  return was === false && Boolean(now);
}

/** True when `value` differs from the last one seen for `key` (the first sighting only records it). */
export function moved(env, key, value) {
  const m = mem(env);
  const was = m[key];
  m[key] = value;
  return was !== undefined && was !== value;
}

export const rectOf = (el) => {
  if (!el?.getBoundingClientRect) return null;
  const r = el.getBoundingClientRect();
  return r.width || r.height
    ? { left: r.left, top: r.top, width: r.width, height: r.height }
    : null;
};

/**
 * A copy of some text that glides from one rectangle to another and then disappears (or comes back, for a gentle
 * "snap back"). It is a picture of the move, aria-hidden and unclickable; the real element is already in its place.
 */
export function glide(text, from, to, { back = false, ms = 560, tone = "", done } = {}) {
  if (!motionOK() || !from || !to) {
    done?.();
    return null;
  }
  const ghost = document.createElement("span");
  ghost.className = `vga-ghost${tone ? ` vga-ghost-${tone}` : ""}`;
  ghost.setAttribute("aria-hidden", "true");
  ghost.textContent = text;
  ghost.style.left = `${from.left}px`;
  ghost.style.top = `${from.top}px`;
  ghost.style.minWidth = `${Math.min(from.width, 220)}px`;
  document.body.append(ghost);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const frames = back
    ? [
        { transform: "translate(0,0) scale(1)", opacity: 1 },
        {
          transform: `translate(${dx * 0.65}px,${dy * 0.65}px) scale(0.94)`,
          opacity: 1,
          offset: 0.5,
        },
        { transform: "translate(0,0) scale(1)", opacity: 0.9 },
      ]
    : [
        { transform: "translate(0,0) scale(1)", opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) scale(0.78)`, opacity: 0.95 },
      ];
  let finished = false;
  const end = () => {
    if (finished) return;
    finished = true;
    ghost.remove();
    done?.();
  };
  try {
    const a = ghost.animate(frames, { duration: ms, easing: "cubic-bezier(0.3, 0.9, 0.3, 1)" });
    a.onfinish = end;
    a.oncancel = end;
  } catch {
    end();
  }
  return ghost;
}

/** Add a class for one animation and take it off when the animation ends, so the same move can play again. */
export function playOnce(el, cls) {
  if (!el || !motionOK()) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  el.addEventListener("animationend", () => el.classList.remove(cls), { once: true });
}
