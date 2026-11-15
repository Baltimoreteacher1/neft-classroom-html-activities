// The exponent-copies scene: each card appears in turn, its copies arrive one after another, then the arrow, and finally
// the expanded form, the notation and the checks. Timing is a fraction of the whole scene, so adding a beat means editing
// a fraction, not recomputing frames. It reads data-* hooks from renderExponent's SVG and nothing else.
import { playScene, windows } from "./motion.mjs";

/** Scene length scales with the number of steps so each card gets about the same time. @param {number} steps */
export const durationFor = (steps) => Math.max(1800, Math.min(7500, 900 * (steps + 1)));

/**
 * @param {ParentNode} root @param {number} steps
 * @param {{ only?: number }} [opts] only: animate just this step (and the closing block), the rest stay as drawn
 */
export function exponentScene(root, steps, opts = {}) {
  const only = opts.only;
  const slots = windows(only ? 2 : steps + 1);
  /** @type {Array<import("./motion.mjs").Track & { els: Element[] }>} */
  const tracks = [];
  const all = (/** @type {string} */ sel) => [...root.querySelectorAll(sel)];
  const rise = [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }];
  const pop = [{ opacity: 0, transform: "scale(0.85)", transformBox: "fill-box", transformOrigin: "center" }, { opacity: 1, transform: "none", transformBox: "fill-box", transformOrigin: "center" }];
  const fade = [{ opacity: 0 }, { opacity: 1 }];
  for (let i = 0; i < steps; i++) {
    const n = i + 1;
    if (only && n !== only) continue;
    const { from, to } = slots[only ? 0 : i];
    const len = to - from;
    tracks.push({ els: all(`.mc-card[data-step="${n}"]`), from, to: from + len * 0.3, keyframes: rise });
    const copies = all(`.mc-copy[data-step="${n}"]`);
    const k = Math.max(1, copies.length);
    copies.forEach((el, c) => {
      const a = from + len * (0.25 + (0.5 * c) / k);
      tracks.push({ els: [el], from: a, to: Math.min(to, a + len * 0.3), keyframes: pop });
    });
    tracks.push({ els: all(`.mc-arrow[data-step="${n}"]`), from: from + len * 0.1, to: from + len * 0.4, keyframes: fade });
  }
  const last = slots[only ? 1 : steps];
  const span = last.to - last.from;
  tracks.push({ els: all(".mc-final > g"), from: last.from, to: last.from + span * 0.9, keyframes: fade });
  return { durationMs: only ? 1400 : durationFor(steps), tracks };
}

/**
 * When the exponent goes up by exactly one with the same base, only the new step enters; every other change redraws
 * without motion. Returns the running animation or null. @param {ParentNode} root @param {number[]} prev @param {number[]} next
 */
export function enterLatest(root, prev, next, opts = {}) {
  if (!prev || prev[0] !== next[0] || next[1] !== prev[1] + 1) return null;
  const svg = root.querySelector("svg");
  return svg ? playScene(exponentScene(svg, next[1], { only: next[1] }), opts) : null;
}
