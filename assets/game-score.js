/* =============================================================================
 * game-score.js — the ONE place that turns gameplay into a game_scores row.
 * -----------------------------------------------------------------------------
 * WHY THIS EXISTS
 * 29 games judge answers and report nothing. Each counts in its own vocabulary
 * (one tracks `correct`, another `wrong`, another a running `Score`), but the
 * CONTRACT for what lands in D1 is identical for all of them and easy to get
 * subtly wrong — `total` means ATTEMPTS, not maxScore, and getting that
 * backwards silently corrupted every accuracy figure on the site once already
 * (see the engine3d bug fixed 2026-07-28). Writing that contract out 29 times
 * would be 29 chances to reintroduce it.
 *
 * So the contract lives here once. A game calls three things:
 *
 *   NeftScore.init({ gameId: "unit-rate-duel", standard: "6.RP.A.2" });
 *   NeftScore.attempt(isCorrect);   // once per judged answer
 *   NeftScore.finish();             // when the game is genuinely over
 *
 * This is NOT an adapter over the score bridge — it does not wrap, rename or
 * re-route anything. EduPulse.record stays the single integration point and is
 * called directly below. What lives here is the counting rule, which is game
 * logic that was going to be copy-pasted 29 times otherwise.
 *
 * HONESTY RULES (the whole point):
 *   - attempt() is called ONCE per judged answer, including wrong ones. A game
 *     that only counts wins reports 100% accuracy and is worse than silence.
 *   - finish() reports whatever actually happened. It never invents a perfect
 *     score, and never reports at all if nothing was attempted — an opened-and-
 *     abandoned game must stay absent from game_scores, not land as a 0%.
 *   - A game left without finishing still reports on pagehide, because "student
 *     answered 6 of 10 then closed the tab" is real data. Reporting is
 *     idempotent, so the two paths cannot double-count.
 * ========================================================================== */
(function (global) {
  "use strict";

  var BRIDGE_SRC = "/assets/edupulse-bridge.js";
  var state = null;
  var reported = false;

  function ensureBridge() {
    if (global.EduPulse) return Promise.resolve(global.EduPulse);
    return new Promise(function (resolve) {
      var s = document.querySelector('script[src="' + BRIDGE_SRC + '"]');
      if (!s) {
        s = document.createElement("script");
        s.src = BRIDGE_SRC;
        document.body.appendChild(s);
      }
      s.addEventListener(
        "load",
        function () {
          resolve(global.EduPulse || null);
        },
        { once: true },
      );
      s.addEventListener(
        "error",
        function () {
          resolve(null);
        },
        { once: true },
      );
      if (global.EduPulse) resolve(global.EduPulse);
    });
  }

  /** Fall back to the folder name, which is what the audit joins on. */
  function inferGameId() {
    try {
      var p = global.location.pathname.replace(/\/index\.html?$/i, "").replace(/^\/+|\/+$/g, "");
      return p.split("/").pop() || "unknown-game";
    } catch (_e) {
      return "unknown-game";
    }
  }

  /** attempts/correct are always the sum of per-answer and batch grading. */
  function recount() {
    var a = state.singles.attempts;
    var c = state.singles.correct;
    for (var k in state.batches) {
      if (Object.prototype.hasOwnProperty.call(state.batches, k)) {
        a += state.batches[k].attempts;
        c += state.batches[k].correct;
      }
    }
    state.attempts = a;
    state.correct = c;
  }

  function report() {
    // Nothing judged means nothing to say. A row here would assert the student
    // scored 0%, when in fact they never answered anything.
    if (reported || !state || state.attempts === 0) return;
    reported = true;
    var payload = {
      activityId: state.gameId,
      standard: state.standard || "",
      level: state.level || 1,
      score: state.correct,
      // total maps from problemsAttempted — ATTEMPTS, never maxScore.
      problemsAttempted: state.attempts,
      problemsCorrect: state.correct,
      durationSec: Math.round((Date.now() - state.startedAt) / 1000),
    };
    ensureBridge().then(function (ep) {
      // Reporting must never break a game: if the bridge cannot load, the
      // student keeps playing and we simply have no row.
      if (ep && typeof ep.record === "function") {
        try {
          ep.record(payload);
        } catch (_e) {}
      }
    });
  }

  global.NeftScore = {
    init: function (opts) {
      opts = opts || {};
      state = {
        gameId: opts.gameId || inferGameId(),
        standard: opts.standard || "",
        level: opts.level || 1,
        // attempts/correct are DERIVED from the two sources below, so a game
        // that mixes per-answer and batch grading cannot have one clobber the
        // other. Never assign to them directly.
        attempts: 0,
        correct: 0,
        singles: { attempts: 0, correct: 0 },
        batches: {},
        startedAt: Date.now(),
      };
      reported = false;
      return this;
    },
    /** Call once per judged answer — including wrong ones. */
    attempt: function (isCorrect) {
      if (!state) this.init({});
      state.singles.attempts += 1;
      if (isCorrect) state.singles.correct += 1;
      recount();
      return this;
    },
    /**
     * Batch-graded activities (drag every chip, then press Check) judge many
     * answers at once and can be re-checked repeatedly. Counting per item would
     * multiply the attempts by however many times the student pressed Check, so
     * record the tally against a key and keep only the LATEST value for that
     * key — the student's most recent state of that exercise, counted once.
     */
    tally: function (key, attempts, correct) {
      if (!state) this.init({});
      state.batches = state.batches || {};
      state.batches[key] = {
        attempts: Math.max(0, attempts | 0),
        correct: Math.max(0, correct | 0),
      };
      recount();
      return this;
    },
    /** Call when the game is genuinely over. Safe to call more than once. */
    finish: function () {
      report();
      return this;
    },
    /** Test/debug aid — never used by gameplay. */
    _state: function () {
      return state && JSON.parse(JSON.stringify(state));
    },
  };

  // A closed tab is still data: report whatever was attempted. Idempotent with
  // finish(), so a game that ends properly does not report twice.
  global.addEventListener("pagehide", report);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") report();
  });
})(window);
