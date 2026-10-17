/* Neft Adaptive Difficulty controller (additive, dependency-free).
 *
 * A tiny, well-tested state machine the unit games use for their optional
 * "Auto ✨" mode, paired with a silent Cognitive Dynamic Difficulty Adjustment
 * (CDDA) analyzer for visual scaffolding and mastery flow-state morphing.
 * It does NOT invent new problems — it only chooses which of a game's EXISTING,
 * already-validated difficulty levels the next problem should come from, ramping
 * up after clean-solve streaks and easing down after misses.
 *
 * Usage inside a game:
 *   const ctrl = window.NTAdaptive.create({ min: 1, max: 2, start: 1 });
 *   // when generating the next problem:
 *   const lvl = ctrl.level;            // 1..max — feed this to the existing generator
 *   // after grading an answer:
 *   const change = ctrl.record(isCorrect); // 'up' | 'down' | null
 *
 * Fail-safe: pure in-memory, no network. If this file fails to load,
 * a game simply won't offer Auto mode; its manual levels keep working.
 */
(() => {
  "use strict";

  const host = /** @type {any} */ (window);
  if (host.NTAdaptive) return; // idempotent

  /**
   * @param {number} v
   * @param {number} lo
   * @param {number} hi
   */
  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  /**
   * @param {any} [opts]
   */
  function create(opts) {
    opts = opts || {};
    const min = typeof opts.min === "number" ? opts.min : 1;
    const max = typeof opts.max === "number" ? opts.max : 2;
    // clean solves in a row needed to move up a level:
    const up = typeof opts.up === "number" ? opts.up : 3;
    // misses in a row that drop a level:
    const down = typeof opts.down === "number" ? opts.down : 2;
    const start = clamp(typeof opts.start === "number" ? opts.start : min, min, max);

    return {
      level: start,
      streak: 0, // consecutive correct
      misses: 0, // consecutive wrong
      min: min,
      max: max,
      // Record one graded answer. Returns 'up'/'down' when the level changed,
      // else null. Read `.level` afterward for the next problem's difficulty.
      /** @param {boolean} correct */
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

  /* ---------- Silent Cognitive Dynamic Difficulty Adjustment (CDDA) ----------
   * Monitors consecutive correct/incorrect actions, input velocity (ms between
   * prompt and response), and structural error patterns (coordinate swap, sign
   * flip, unscaled ratio, partition mismatch) so the game stage can project
   * non-punitive visual scaffolding on struggle and fade it out after 3
   * consecutive successes (Mastery Flow State).
   */
  /**
   * @param {any} detail
   * @returns {string}
   */
  function detectErrorPattern(detail) {
    if (!detail || typeof detail !== "object") return "general-miss";
    if (typeof detail.pattern === "string" && detail.pattern) return detail.pattern;
    if (typeof detail.misconception === "string" && detail.misconception) {
      const m = detail.misconception.toLowerCase();
      if (m.includes("swap") || m.includes("axis") || m.includes("order")) return "coord-swap";
      if (m.includes("sign") || m.includes("neg") || m.includes("opp")) return "sign-flip";
      if (m.includes("add") || m.includes("ratio") || m.includes("scale")) return "unscaled-ratio";
      if (m.includes("denom") || m.includes("part") || m.includes("frac"))
        return "partition-mismatch";
    }
    const attempted = detail.attempted;
    const expected = detail.expected;
    if (
      Array.isArray(attempted) &&
      Array.isArray(expected) &&
      attempted.length === 2 &&
      expected.length === 2
    ) {
      if (
        Number(attempted[0]) === Number(expected[1]) &&
        Number(attempted[1]) === Number(expected[0]) &&
        Number(expected[0]) !== Number(expected[1])
      ) {
        return "coord-swap";
      }
      if (
        Number(attempted[0]) > 0 &&
        Number(expected[0]) > 0 &&
        Number(attempted[0]) - Number(attempted[1]) === Number(expected[0]) - Number(expected[1]) &&
        Number(attempted[0]) * Number(expected[1]) !== Number(attempted[1]) * Number(expected[0])
      ) {
        return "unscaled-ratio";
      }
    }
    if (
      typeof attempted === "number" &&
      typeof expected === "number" &&
      expected !== 0 &&
      Math.abs(attempted + expected) < 1e-6
    ) {
      return "sign-flip";
    }
    const msg = String(detail.message || "").toLowerCase();
    if (msg.includes("coordinate") || msg.includes("horizontal") || msg.includes("(x, y)"))
      return "coord-swap";
    if (msg.includes("negative") || msg.includes("opposite") || msg.includes("sign"))
      return "sign-flip";
    if (msg.includes("scale factor") || msg.includes("ratio") || msg.includes("multiplier"))
      return "unscaled-ratio";
    if (msg.includes("division") || msg.includes("fraction") || msg.includes("denominator"))
      return "partition-mismatch";
    return "general-miss";
  }

  /**
   * @param {any} [opts]
   */
  function createCDDA(opts) {
    opts = opts || {};
    const masteryThreshold = typeof opts.masteryStreak === "number" ? opts.masteryStreak : 3;
    const struggleThreshold = typeof opts.struggleMisses === "number" ? opts.struggleMisses : 1;
    let lastStamp = Date.now();

    return {
      state: "neutral", // 'neutral' | 'scaffold' | 'mastery'
      streak: 0,
      misses: 0,
      totalCorrect: 0,
      totalAttempts: 0,
      lastPattern: "none",
      velocityMs: 0,
      tempoScale: 1.0,
      patternCounts: /** @type {Record<string, number>} */ ({}),
      /**
       * @param {any} detail
       */
      analyze: function (detail) {
        const now = Date.now();
        this.velocityMs = clamp(now - lastStamp, 16, 60000);
        lastStamp = now;
        const ok = !!(detail && detail.correct);
        this.totalAttempts += 1;

        if (ok) {
          this.totalCorrect += 1;
          this.streak += 1;
          this.misses = 0;
          if (this.streak >= masteryThreshold) {
            this.state = "mastery";
            this.lastPattern = "none";
            this.tempoScale = 1.1;
          } else if (this.state === "scaffold" && this.streak >= 3) {
            this.state = "neutral";
            this.tempoScale = 1.0;
          }
        } else {
          this.misses += 1;
          this.streak = 0;
          this.tempoScale = 1.0;
          const pattern = detectErrorPattern(detail);
          this.lastPattern = pattern;
          this.patternCounts[pattern] = (this.patternCounts[pattern] || 0) + 1;
          if (this.misses >= struggleThreshold || this.patternCounts[pattern] >= 2) {
            this.state = "scaffold";
          }
        }
        return {
          state: this.state,
          streak: this.streak,
          misses: this.misses,
          pattern: this.lastPattern,
          velocityMs: this.velocityMs,
          tempoScale: this.tempoScale,
          scaffoldActive: this.state === "scaffold",
          masteryActive: this.state === "mastery",
        };
      },
      reset: function () {
        this.state = "neutral";
        this.streak = 0;
        this.misses = 0;
        this.lastPattern = "none";
        this.tempoScale = 1.0;
        lastStamp = Date.now();
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
  /** @param {string} game */
  function keyFor(game) {
    return "nt-auto-lvl-" + String(game || "game");
  }
  // The level Auto should start the student at (default = easiest).
  /**
   * @param {string} game
   * @param {number} [min]
   * @param {number} [max]
   */
  function pickLevel(game, min, max) {
    min = typeof min === "number" ? min : 1;
    max = typeof max === "number" ? max : 2;
    let v = min;
    try {
      v = Number.parseInt(localStorage.getItem(keyFor(game)) || String(min), 10) || min;
    } catch (_e) {}
    return clamp(v, min, max);
  }
  // Record how a run went and adjust the stored Auto level for next time.
  //   result = { won: bool, accuracy: 0..1, maxStreak: number, min, max }
  /**
   * @param {string} game
   * @param {any} result
   */
  function recordRun(game, result) {
    result = result || {};
    const min = typeof result.min === "number" ? result.min : 1;
    const max = typeof result.max === "number" ? result.max : 2;
    const cur = pickLevel(game, min, max);
    let next = cur;
    const acc = typeof result.accuracy === "number" ? result.accuracy : 1;
    // Cleared it comfortably → step up next time. Struggled → step down.
    if (result.won && acc >= 0.8 && cur < max) next = cur + 1;
    else if ((!result.won || acc < 0.5) && cur > min) next = cur - 1;
    next = clamp(next, min, max);
    try {
      localStorage.setItem(keyFor(game), String(next));
    } catch (_e) {}
    return next;
  }

  const sharedCDDA = createCDDA();

  host.NTAdaptive = {
    create: create,
    createCDDA: createCDDA,
    detectErrorPattern: detectErrorPattern,
    cdda: sharedCDDA,
    pickLevel: pickLevel,
    recordRun: recordRun,
  };
})();
