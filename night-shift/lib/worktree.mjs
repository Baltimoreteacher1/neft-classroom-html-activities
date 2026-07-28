// Night Shift — audit worktree.
//
// The source-truth modules (Regression Sentinel, Build + Visual QA) must judge
// what is SHIPPABLE, not whatever happens to be checked out. Running them in the
// live working directory produced weeks of false ❌: the nightly job audited a
// dirty tree on a feature branch, so unrelated in-progress edits were reported
// as "Build is broken — deploy would fail" while `origin/main` was perfectly
// green. A monitor that alarms on work-in-progress trains you to ignore it.
//
// This creates a clean detached worktree at <remote>/<main> and hands it to
// those modules. Modules that are ABOUT the live repo (divergence-watch,
// backlog-advancer) keep using the real root.
import { mkdtemp, symlink, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { sh } from "./util.mjs";

// MUST live outside the repo and contain no dot-dir path segment: vite's
// copyStandaloneHtml filter skips any absolute path containing `/.claude/` etc.,
// so a worktree under a dot-dir builds a dist with ALL standalone content
// silently filtered out — every copied dir empty, QA false-fails. Same hazard
// scripts/ship.sh documents; keep the two in step.
const PREFIX = "eduwonderlab-nightshift-";

/**
 * Create a clean detached worktree at `${remote}/${main}`.
 * Returns { ok, dir, ref, sha, reason, cleanup } — `cleanup` is always callable.
 */
export async function createAuditWorktree(root, { remote = "origin", main = "main", log } = {}) {
  const noop = { cleanup: async () => {} };

  const fetch = await sh("git", ["-C", root, "fetch", remote, "--prune"], { timeout: 5 * 60_000 });
  if (!fetch.ok) {
    return { ok: false, reason: `git fetch ${remote} failed: ${fetch.stderr.trim().slice(0, 200)}`, ...noop };
  }

  const ref = `${remote}/${main}`;
  const rev = await sh("git", ["-C", root, "rev-parse", ref]);
  if (!rev.ok) return { ok: false, reason: `cannot resolve ${ref}`, ...noop };
  const sha = rev.stdout.trim();

  let dir;
  try {
    dir = await mkdtemp(path.join(tmpdir(), PREFIX));
  } catch (err) {
    return { ok: false, reason: `mkdtemp failed: ${err.message}`, ...noop };
  }

  const add = await sh("git", ["-C", root, "worktree", "add", "--detach", "--force", dir, sha, "--quiet"], {
    timeout: 10 * 60_000,
  });
  if (!add.ok) {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
    return { ok: false, reason: `worktree add failed: ${add.stderr.trim().slice(0, 200)}`, ...noop };
  }

  // Share node_modules so the worktree can build without a fresh install.
  const nm = path.join(root, "node_modules");
  if (existsSync(nm)) {
    await symlink(nm, path.join(dir, "node_modules"), "dir").catch(() => {});
  }

  const cleanup = async () => {
    // Concurrent automation in this repo can transiently hold files in the
    // worktree; retry briefly, then leave it rather than hang the run.
    for (let i = 0; i < 3 && existsSync(dir); i++) {
      const r = await sh("git", ["-C", root, "worktree", "remove", "--force", dir]);
      if (r.ok) break;
      await new Promise((res) => setTimeout(res, 1000));
    }
    await sh("git", ["-C", root, "worktree", "prune"]);
    if (existsSync(dir)) {
      log?.warn(`could not remove audit worktree ${dir} — remove it manually`);
    }
  };

  return { ok: true, dir, ref, sha, cleanup };
}
