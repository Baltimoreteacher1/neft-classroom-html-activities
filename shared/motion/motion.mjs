// Motion runtime: the Web Animations API driven by a scene scheduled in FRACTIONS of its duration.
//   windows(count)        pure: split 0..1 into equal windows
//   timeline(total, tracks)  pure: fractions -> { delay, duration } in ms (tested without a browser)
//   playScene(scene)      run it; reduced motion keeps fades only; the page being hidden pauses it
//
// Rules this module enforces for every scene:
//  - Deterministic: timing comes from fractions of the scene, never from a clock or Math.random.
//  - The static picture is the truth: a scene only ever animates FROM a transient state TO the element's natural
//    state (fill: "backwards"), so cancelling or finishing leaves exactly what print and reduced motion show.
//  - No render loop: the browser's animation engine runs it; nothing here uses requestAnimationFrame.
//  - No layout: only opacity and transform are animated, so nothing shifts.
import { MOTION } from "./tokens.mjs";

/** @param {number} count @returns {Array<{ from: number, to: number }>} */
export function windows(count) {
  return Array.from({ length: count }, (_, i) => ({ from: i / count, to: (i + 1) / count }));
}

/**
 * @typedef {object} Track
 * @property {number} from fraction of the scene where the track starts (0-1)
 * @property {number} to fraction where it ends (0-1)
 * @property {Keyframe[]} keyframes first = transient state, last = natural state
 */

/** @param {number} totalMs @param {Array<{ from: number, to: number }>} tracks */
export function timeline(totalMs, tracks) {
  return tracks.map((t) => {
    if (!(t.from >= 0 && t.to <= 1 && t.to >= t.from)) throw new RangeError(`track fractions must satisfy 0 <= from <= to <= 1 (got ${t.from}, ${t.to})`);
    return { delay: Math.round(t.from * totalMs), duration: Math.max(1, Math.round((t.to - t.from) * totalMs)) };
  });
}

/** The OS setting, or the site's own Reduce motion control (<html data-motion="reduce">, see assets/design/family/family.css). */
export function reducedMotion() {
  try {
    if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
    return typeof document !== "undefined" && document.documentElement?.dataset?.motion === "reduce";
  } catch {
    return false;
  }
}

/** Reduced motion keeps opacity changes and drops everything that moves. @param {Keyframe[]} frames */
export function fadesOnly(frames) {
  return frames.map((f) => {
    /** @type {Keyframe} */
    const out = {};
    if (f.opacity !== undefined) out.opacity = f.opacity;
    if (f.offset !== undefined) out.offset = f.offset;
    return out;
  });
}

/** @type {Set<{ pause: () => void, resume: () => void }>} */
const live = new Set();
let wired = false;
function wire() {
  if (wired || typeof document === "undefined") return;
  wired = true;
  document.addEventListener("visibilitychange", () => {
    for (const c of live) document.hidden ? c.pause() : c.resume();
  });
}

/**
 * @param {{ durationMs: number, tracks: Array<Track & { els: Element[] }> }} scene
 * @param {{ reduced?: boolean }} [opts]
 * @returns {{ finished: Promise<void>, cancel: () => void, finish: () => void, pause: () => void, resume: () => void }}
 */
export function playScene(scene, opts = {}) {
  wire();
  const reduced = opts.reduced ?? reducedMotion();
  const total = reduced ? Math.min(scene.durationMs, 1600) : scene.durationMs;
  const times = timeline(total, scene.tracks);
  /** @type {Animation[]} */
  const anims = [];
  scene.tracks.forEach((t, i) => {
    for (const el of t.els) {
      if (typeof el.animate !== "function") continue;
      anims.push(el.animate(reduced ? fadesOnly(t.keyframes) : t.keyframes, { delay: times[i].delay, duration: times[i].duration, easing: MOTION.easing, fill: "backwards" }));
    }
  });
  const ctl = {
    finished: Promise.all(anims.map((a) => a.finished.catch(() => undefined))).then(() => {
      live.delete(ctl);
    }),
    cancel() {
      for (const a of anims) a.cancel();
      live.delete(ctl);
    },
    finish() {
      for (const a of anims) {
        try {
          a.finish();
        } catch {
          a.cancel();
        }
      }
      live.delete(ctl);
    },
    pause() {
      for (const a of anims) a.pause();
    },
    resume() {
      for (const a of anims) a.play();
    },
  };
  live.add(ctl);
  if (typeof document !== "undefined" && document.hidden) ctl.pause();
  return ctl;
}
