/**
 * Decide whether production is serving the commit it should be.
 *
 * Pure and side-effect free so it can be tested without a network, a Worker
 * runtime, or a deploy — worker.js does the fetching and calls this.
 *
 * WHY THIS EXISTS AT ALL. The same judgement lives in scripts/smoke-live.mjs,
 * but that needs a machine that can reach the site, which in practice meant a
 * GitHub Actions runner. When the Actions queue cannot hand out a runner, the
 * check does not fail — it never runs, and the red X it leaves behind is
 * indistinguishable from a real production failure. That happened eight times
 * in one afternoon. A Cloudflare Cron Trigger answers to Cloudflare, not to
 * GitHub's queue, so the check keeps working exactly when Actions cannot.
 *
 * WHY IT IS STATELESS. The obvious design remembers the last-seen commit in
 * KV, which would need a namespace provisioned with credentials before anyone
 * could deploy this. It is not necessary: a mismatch is ambiguous only because
 * Cloudflare promotes a build across edge nodes over seconds, and the age of
 * the HEAD COMMIT already tells us which side of that window we are on. If
 * main moved thirty seconds ago, a mismatch is propagation. If main moved an
 * hour ago and production still disagrees, the build did not promote. No
 * memory required.
 */

/** Commits are compared by prefix: the stamp may carry a full or short sha. */
export function sameCommit(a, b) {
  const x = String(a || "")
    .trim()
    .toLowerCase();
  const y = String(b || "")
    .trim()
    .toLowerCase();
  if (!x || !y) return false;
  const n = Math.min(x.length, y.length);
  if (n < 7) return false; // too short to be meaningful — treat as unknown
  return x.slice(0, n) === y.slice(0, n);
}

/**
 * @param {object} input
 * @param {string|null} input.stampCommit      commit production reports serving
 * @param {string|null} input.headCommit       commit at the tip of the deploy branch
 * @param {string|null} input.headCommittedAt  ISO time that commit landed
 * @param {number} input.now                   epoch ms
 * @param {number} [input.graceMs]             how long promotion is allowed to take
 * @returns {{status: "ok"|"settling"|"drift"|"unknown", detail: string}}
 */
export function evaluateDeploy({
  stampCommit,
  headCommit,
  headCommittedAt,
  now,
  graceMs = 15 * 60 * 1000,
}) {
  // Anything we could not read is UNKNOWN, never "ok". A check that reports
  // healthy when it failed to look is worse than no check.
  if (!stampCommit)
    return { status: "unknown", detail: "could not read the production build stamp" };
  if (!headCommit) return { status: "unknown", detail: "could not read the branch head commit" };

  if (sameCommit(stampCommit, headCommit)) {
    return { status: "ok", detail: `production serves ${String(headCommit).slice(0, 9)}` };
  }

  const landed = Date.parse(headCommittedAt ?? "");
  if (!Number.isFinite(landed)) {
    // We know they differ but not for how long. Report the mismatch without
    // claiming it is a failure — the age is what makes that call.
    return {
      status: "unknown",
      detail:
        `production serves ${String(stampCommit).slice(0, 9)}, head is ` +
        `${String(headCommit).slice(0, 9)}, and the commit date was unreadable`,
    };
  }

  const ageMs = now - landed;
  if (ageMs < graceMs) {
    return {
      status: "settling",
      detail:
        `head ${String(headCommit).slice(0, 9)} landed ${Math.round(ageMs / 1000)}s ago; ` +
        `production still serves ${String(stampCommit).slice(0, 9)} (within the ` +
        `${Math.round(graceMs / 60000)}m promotion window)`,
    };
  }

  return {
    status: "drift",
    detail:
      `head ${String(headCommit).slice(0, 9)} landed ${Math.round(ageMs / 60000)}m ago but ` +
      `production still serves ${String(stampCommit).slice(0, 9)} — the build did not promote`,
  };
}
