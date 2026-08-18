/**
 * skip-exit.mjs — the one honest answer for "this check did not do its work".
 *
 * THE FAILURE THIS EXISTS TO END. `validate:lesson-boot` returned exit 0 when no
 * Chromium was available, and `scripts/qa-run.mjs` printed
 * `PASS validate:lesson-boot 4.6s` — byte-identical to 16 pages genuinely
 * rendering. A gate that reports PASS without running is worse than no gate: it
 * is an active claim that something was checked. It is the same shape as the
 * injector target list that silently covered nothing, the orphaned project pages
 * and the build stamp that matched no file.
 *
 * THE PROTOCOL. Three outcomes, three exit codes:
 *
 *   0  PASS — the check ran and everything it tests holds.
 *   1  FAIL — the check ran and found a problem.
 *   3  SKIP — the check could NOT run (no browser, no network, no credential,
 *             a dirty tree it refuses to judge). Nothing was verified.
 *
 * A SKIP is never a pass. Locally it does not block a push — not every machine
 * has a browser, and a gate that blocks every push over that just gets deleted —
 * but the run's exit summary NAMES every skipped check, so "what did this run
 * actually verify?" has a visible answer. In CI there is no such excuse:
 * infrastructure that cannot run a check is a failure, and `skipExit()` returns
 * 1 there.
 *
 * This module changes only how absence is REPORTED. No check's subject matter,
 * thresholds or assertions move because of it.
 */

/** Exit code meaning "did not run" — distinct from both pass and fail. */
export const SKIP_EXIT = 3;

/**
 * Announce a skip and return the exit code to use.
 *
 * @param {string} why  what was missing, in plain words
 * @param {string} [hint]  how to make the check runnable
 * @returns {number} 1 in CI, SKIP_EXIT locally
 */
export function skipExit(why, hint) {
  const inCi = !!process.env.CI;
  console.error(`SKIPPED: ${why} — nothing was verified by this check.`);
  if (hint) console.error(`   ${hint}`);
  if (inCi) {
    console.error("   CI must not report a skipped check as a pass.");
    return 1;
  }
  return SKIP_EXIT;
}

/** Announce a skip and exit immediately. */
export function exitSkipped(why, hint) {
  process.exit(skipExit(why, hint));
}
