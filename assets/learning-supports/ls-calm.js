// Calm mode: reduced motion, sound off, low stimulation.
//
// The look of calm mode (no animation, no confetti or sparkles, quieter colours)
// is CSS keyed on `html.ls-calm` in ls-supports.css. Two things CSS cannot
// reach are handled here:
//
//  - Sound. Games and lessons make their own sounds with the Web Audio API and
//    with <audio>/<video>. While calm mode is on, audio contexts made after this
//    loads start suspended, and media elements play muted. Read-aloud uses the
//    speech engine, which is separate: a student who asks to hear the page still
//    hears it.
//
//  - Code that asks the browser "does this person want less motion?". Many
//    components check `prefers-reduced-motion` before they animate. Calm mode is
//    the same request made inside the page, so it answers that question too.
//
// Sound also follows the site's own mute switch, window.NT_MUTED, which the
// game kit and the lesson layers already honour; calm mode sets it and puts it
// back as it found it.
//
// Both gates read the live setting on every call, so switching calm mode off
// restores everything without a reload.

/** @param {() => boolean} isCalm */
function gateMotionQuery(isCalm) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
  const native = window.matchMedia.bind(window);
  window.matchMedia = (query) => {
    const list = native(query);
    if (!/prefers-reduced-motion/i.test(query)) return list;
    const asksForLess = !/no-preference/i.test(query);
    return new Proxy(list, {
      get(target, prop) {
        if (prop === "matches") return isCalm() ? asksForLess : target.matches;
        const value = Reflect.get(target, prop, target);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
  };
}

/** @param {() => boolean} isCalm */
function gateSound(isCalm) {
  if (typeof window === "undefined") return;
  /** @type {Set<AudioContext>} */
  const contexts = new Set();

  for (const name of /** @type {const} */ (["AudioContext", "webkitAudioContext"])) {
    const Native = /** @type {any} */ (window)[name];
    if (typeof Native !== "function") continue;
    /** @type {any} */ (window)[name] = class extends Native {
      /** @param {...any} args */
      constructor(...args) {
        super(...args);
        contexts.add(/** @type {any} */ (this));
        if (isCalm()) super.suspend().catch(() => {});
      }

      resume() {
        return isCalm() ? Promise.resolve() : super.resume();
      }
    };
  }

  if (typeof HTMLMediaElement !== "undefined") {
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...args) {
      if (isCalm()) this.muted = true;
      return play.apply(this, args);
    };
  }

  // Turning calm mode on silences what is already playing.
  return {
    silence() {
      for (const ctx of contexts) ctx.suspend().catch(() => {});
      for (const el of document.querySelectorAll("audio, video")) {
        /** @type {HTMLMediaElement} */ (el).muted = true;
      }
    },
  };
}

/**
 * @param {{ get: () => import("./ls-prefs.js").Prefs, subscribe: (fn: (p: import("./ls-prefs.js").Prefs) => void) => () => void }} prefs
 */
export function installCalm(prefs) {
  const isCalm = () => prefs.get().calm;
  gateMotionQuery(isCalm);
  const sound = gateSound(isCalm);
  const site = /** @type {any} */ (window);
  /** @type {{ was: unknown } | null} */
  let muted = null;
  /** @param {boolean} on */
  const apply = (on) => {
    document.documentElement.classList.toggle("ls-calm", on);
    if (on) {
      sound?.silence();
      if (!muted) muted = { was: site.NT_MUTED };
      site.NT_MUTED = true;
    } else if (muted) {
      site.NT_MUTED = muted.was;
      muted = null;
    }
  };
  apply(isCalm());
  prefs.subscribe((p) => apply(p.calm));
}
