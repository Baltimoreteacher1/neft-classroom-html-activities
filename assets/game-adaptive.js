/* Neft Adaptive Difficulty controller (additive, dependency-free).
 *
 * A tiny, well-tested state machine the unit games use for their optional
 * "Auto ✨" mode. It does NOT invent new problems — it only chooses which of a
 * game's EXISTING, already-validated difficulty levels the next problem should
 * come from, ramping up after clean-solve streaks and easing down after misses.
 * This keeps every student near the edge of their ability without a manual pick,
 * and without any new (untested) math generators.
 *
 * Usage inside a game:
 *   const ctrl = window.NTAdaptive.create({ min: 1, max: 2, start: 1 });
 *   // when generating the next problem:
 *   const lvl = ctrl.level;            // 1..max — feed this to the existing generator
 *   // after grading an answer:
 *   const change = ctrl.record(isCorrect); // 'up' | 'down' | null
 *
 * Fail-safe: pure in-memory, no storage, no network. If this file fails to load,
 * a game simply won't offer Auto mode; its manual levels keep working.
 */
(function () {
  "use strict";

  if (window.NTAdaptive) return; // idempotent

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function create(opts) {
    opts = opts || {};
    var min = typeof opts.min === "number" ? opts.min : 1;
    var max = typeof opts.max === "number" ? opts.max : 2;
    // clean solves in a row needed to move up a level:
    var up = typeof opts.up === "number" ? opts.up : 3;
    // misses in a row that drop a level:
    var down = typeof opts.down === "number" ? opts.down : 2;
    var start = clamp(typeof opts.start === "number" ? opts.start : min, min, max);

    return {
      level: start,
      streak: 0, // consecutive correct
      misses: 0, // consecutive wrong
      min: min,
      max: max,
      // Record one graded answer. Returns 'up'/'down' when the level changed,
      // else null. Read `.level` afterward for the next problem's difficulty.
      record: function (correct) {
        if (correct) {
          this.streak += 1;
          this.misses = 0;
          if (this.streak >= up && this.level < this.max) {
            this.level += 1;
            this.streak = 0;
            return "up";
          }
        } else {
          this.misses += 1;
          this.streak = 0;
          if (this.misses >= down && this.level > this.min) {
            this.level -= 1;
            this.misses = 0;
            return "down";
          }
        }
        return null;
      },
      reset: function () {
        this.level = start;
        this.streak = 0;
        this.misses = 0;
      },
    };
  }

  /* ---------- Cross-session "Auto" starting-level chooser ----------
   * Many games fix their board geometry at level-select (e.g. a Quadrant-I vs
   * four-quadrant grid), so changing level mid-run is unsafe. Instead, "Auto"
   * mode picks a whole, already-validated level for the student at the start of
   * a run, and nudges that pick up or down for NEXT time based on how the run
   * went. Persistent, safe (reuses tested level paths wholesale), and it means
   * a student never has to self-diagnose which level to choose.
   */
  function keyFor(game) {
    return "nt-auto-lvl-" + String(game || "game");
  }
  // The level Auto should start the student at (default = easiest).
  function pickLevel(game, min, max) {
    min = typeof min === "number" ? min : 1;
    max = typeof max === "number" ? max : 2;
    var v = min;
    try {
      v = parseInt(localStorage.getItem(keyFor(game)) || String(min), 10) || min;
    } catch (_e) {}
    return clamp(v, min, max);
  }
  // Record how a run went and adjust the stored Auto level for next time.
  //   result = { won: bool, accuracy: 0..1, maxStreak: number, min, max }
  function recordRun(game, result) {
    result = result || {};
    var min = typeof result.min === "number" ? result.min : 1;
    var max = typeof result.max === "number" ? result.max : 2;
    var cur = pickLevel(game, min, max);
    var next = cur;
    var acc = typeof result.accuracy === "number" ? result.accuracy : 1;
    // Cleared it comfortably → step up next time. Struggled → step down.
    if (result.won && acc >= 0.8 && cur < max) next = cur + 1;
    else if ((!result.won || acc < 0.5) && cur > min) next = cur - 1;
    next = clamp(next, min, max);
    try {
      localStorage.setItem(keyFor(game), String(next));
    } catch (_e) {}
    return next;
  }

  window.NTAdaptive = {
    create: create,
    pickLevel: pickLevel,
    recordRun: recordRun,
  };
})();
