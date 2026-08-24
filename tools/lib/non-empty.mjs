/**
 * non-empty.mjs — a gate that swept nothing did not pass.
 *
 * THE SECOND SHAPE OF THE SAME LIE. tools/lib/skip-exit.mjs handles a check that
 * could not RUN. This handles a check that ran, discovered nothing to look at,
 * found no problems in that nothing, and reported PASS. Both produce a green
 * line that means "verified" and neither verified anything.
 *
 * It is not hypothetical here. Every one of these gates walks a directory or
 * asks git for a file list: a renamed folder, a changed glob, a `git ls-files`
 * that returns empty in a detached worktree, or a build that has not run yet
 * all reduce the subject to zero — and the report is indistinguishable from a
 * clean curriculum.
 *
 * FAIL, NOT SKIP, and the distinction is the whole point. A skip means the
 * ENVIRONMENT is missing something (no browser, no network, no credential) and
 * the check is blameless. An empty sweep means the DISCOVERY is broken: these
 * files are in the repo, so finding none of them is a defect in the gate, not a
 * property of the machine it ran on.
 */

/**
 * Assert a discovered subject is non-empty before sweeping it.
 *
 * @param {string} label   what was being looked for, in plain words
 * @param {ArrayLike<unknown>|Map<unknown,unknown>|Set<unknown>} subject
 * @param {string} [hint]  where the list comes from, so a zero is diagnosable
 * @param {number} [floor] the smallest count that is still credible (default 1)
 */
export function assertNonEmpty(label, subject, hint, floor = 1) {
  const n = subject == null ? 0 : (subject.size ?? subject.length ?? 0);
  if (n >= floor) return n;
  console.error(
    `FAIL  ${label}: the sweep found ${n} (expected at least ${floor}). ` +
      "An empty sweep is broken discovery, not a clean result — this gate " +
      "verified NOTHING and must not report a pass.",
  );
  if (hint) console.error(`      ${hint}`);
  process.exit(1);
}
