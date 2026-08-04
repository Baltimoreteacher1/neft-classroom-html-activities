/**
 * Automatic difficulty pilot for small-group practice.
 *
 * The adaptive coach and auto-support opened help, but the difficulty of the
 * sequence itself never moved unless a student pressed a button. This module
 * adds the missing rule, decided with the teacher: miss twice in a row and the
 * set steps DOWN a path (supports open, plus a worked model drawn from the
 * student's own solved work); solve three in a row without hints and the set
 * steps UP a path. Pure logic only — DOM wiring lives with the renderer and
 * practice section, so this file is testable in Node.
 */

/** Consecutive misses (across any problems) before the set steps down. */
export const AUTO_STEP_DOWN_MISSES = 2;
/** Consecutive hint-free solves before the set steps up. */
export const AUTO_STEP_UP_SOLVES = 3;

/** Path ladder, least to most demanding — ids shared with the adaptive coach. */
export const PATH_ORDER = ["stabilize", "connect", "stretch"];

/**
 * @typedef {{move: "up"|"down", path: string, atFloor: boolean}} AutoMove
 */

/**
 * Session-scoped difficulty pilot. Feed it every attempt and hint; it answers
 * with a move only at the exact moment the rule fires, and never repeats a
 * move without fresh evidence (counters reset after each move).
 *
 * @param {string|null|undefined} initialPath restored `adaptivePath`, if any
 */
export function createAutoPilot(initialPath) {
  let path = PATH_ORDER.includes(String(initialPath)) ? String(initialPath) : "connect";
  let misses = 0;
  let cleanSolves = 0;
  let hintedSinceSolve = false;

  return {
    /** Current path id (source of truth stays with renderer state/store). */
    path: () => path,
    /** A hint on the current problem makes the next solve "supported", not clean. */
    noteHint() {
      hintedSinceSolve = true;
    },
    /**
     * Record one attempt. Returns an AutoMove when the rule fires, else null.
     * A miss at the floor still returns a move ({atFloor: true}) so callers
     * can open supports even though the path cannot drop further.
     * @param {boolean} correct
     * @returns {AutoMove|null}
     */
    recordAttempt(correct) {
      if (correct) {
        misses = 0;
        cleanSolves = hintedSinceSolve ? 0 : cleanSolves + 1;
        hintedSinceSolve = false;
        if (cleanSolves >= AUTO_STEP_UP_SOLVES) {
          cleanSolves = 0;
          const at = PATH_ORDER.indexOf(path);
          if (at < PATH_ORDER.length - 1) {
            path = PATH_ORDER[at + 1];
            return { move: "up", path, atFloor: false };
          }
        }
        return null;
      }
      cleanSolves = 0;
      hintedSinceSolve = false;
      misses++;
      if (misses >= AUTO_STEP_DOWN_MISSES) {
        misses = 0;
        const at = PATH_ORDER.indexOf(path);
        const atFloor = at <= 0;
        if (!atFloor) path = PATH_ORDER[at - 1];
        return { move: "down", path, atFloor };
      }
      return null;
    },
  };
}

/**
 * Pick the best worked model to show a struggling student: one of their OWN
 * already-solved problems, with a real explanation. Never returns an unsolved
 * item — printing an unsolved problem's answer is the giveaway pattern the
 * fleet eval exists to prevent.
 *
 * @param {Array<{stem?: string, explanation?: string, sampleAnswer?: string,
 *   _practiceIndex?: number}>} items practice items in this section
 * @param {(storeIndex: number) => boolean} isSolved solved-state probe
 * @returns {{stem?: string, explanation?: string, sampleAnswer?: string,
 *   _practiceIndex?: number}|null} the solved item to model, or null when none qualifies
 */
export function pickWorkedModel(items, isSolved) {
  if (!Array.isArray(items)) return null;
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const index = Number(item._practiceIndex);
    if (!Number.isInteger(index) || index < 0) continue;
    if (!isSolved(index)) continue;
    if (item.explanation || item.sampleAnswer) return item;
  }
  return null;
}
