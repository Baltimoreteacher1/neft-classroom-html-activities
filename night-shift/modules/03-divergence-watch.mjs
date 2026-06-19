// Module 3 — Deploy / Divergence Watch.
// Stray-ref detection (the macOS "* 2" fetch-blocker), local-vs-remote divergence,
// and CF-Git-vs-wrangler drift risk.
import { readdir, stat, rm } from "node:fs/promises";
import path from "node:path";

export const name = "Deploy / Divergence Watch";

async function findStrayRefs(gitDir) {
  // macOS iCloud/Finder dupes: "name 2", "name 3", or "conflicted copy" under .git.
  const hits = [];
  async function walk(dir, depth) {
    if (depth > 4) return;
    let entries = [];
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (/ \d+$/.test(e.name) || /conflicted copy/i.test(e.name)) hits.push(full);
      if (e.isDirectory()) await walk(full, depth + 1);
    }
  }
  await walk(gitDir, 0);
  return hits;
}

export async function run(ctx) {
  const cfg = ctx.config.divergenceWatch || {};
  const remote = cfg.remote || "origin";
  const main = cfg.mainBranch || "main";
  const details = [];
  const actions = [];
  let worst = "ok";

  const gitDir = path.join(ctx.root, ".git");

  // 1. Stray refs first — they block fetch.
  let strays = [];
  try {
    strays = await findStrayRefs(gitDir);
  } catch {
    /* ignore */
  }
  if (strays.length) {
    if (worst === "ok") worst = "warn";
    details.push(`⚠️ ${strays.length} stray macOS dupe(s) under .git (can block fetch):`);
    strays.slice(0, 6).forEach((s) => details.push(`   ${path.relative(ctx.root, s)}`));
    if (cfg.autoFixStrayRefs && !ctx.dryRun) {
      let removed = 0;
      for (const s of strays) {
        try {
          const st = await stat(s);
          if (st.isFile()) {
            await rm(s);
            removed++;
          }
        } catch {
          /* ignore */
        }
      }
      details.push(`   ↳ removed ${removed} stray file(s).`);
    } else {
      actions.push(
        `Remove stray .git dupes (e.g. \`refs/stash 2\`) before they block fetch, or set autoFixStrayRefs.`,
      );
    }
  } else {
    details.push("✅ No stray macOS dupe refs under .git.");
  }

  // 2. Fetch + divergence.
  const branch = await ctx.git.currentBranch();
  const fetch = await ctx.git.raw("fetch", remote, "--prune");
  if (!fetch.ok) {
    worst = "fail";
    details.push(`❌ \`git fetch ${remote}\` failed: ${fetch.stderr.trim().slice(0, 200)}`);
    actions.push("Fetch is failing — usually a stray ref above. Clear it, then re-run.");
  } else {
    const ab = await ctx.git.aheadBehind(main, `${remote}/${main}`);
    if (!ab) {
      details.push(`⏭️ Could not compute ${main}…${remote}/${main} (local ${main} present?).`);
    } else if (ab.behind > 0 && ab.ahead > 0) {
      worst = "fail";
      details.push(`❌ \`${main}\` DIVERGED: ${ab.ahead} ahead, ${ab.behind} behind ${remote}.`);
      actions.push(
        `\`${main}\` diverged (${ab.ahead}↑/${ab.behind}↓) — integrate via a throwaway branch, never force.`,
      );
    } else if (ab.behind > 0) {
      if (worst === "ok") worst = "warn";
      details.push(`⚠️ \`${main}\` is ${ab.behind} behind ${remote} — fetch+merge before pushing.`);
    } else if (ab.ahead > 0) {
      if (worst === "ok") worst = "warn";
      details.push(`⚠️ \`${main}\` is ${ab.ahead} ahead of ${remote} — unpushed commits.`);
    } else {
      details.push(`✅ \`${main}\` in sync with ${remote}/${main}.`);
    }
  }

  details.push(`ℹ️ Working branch: \`${branch}\`.`);

  // 3. CF Git auto-deploy drift reminder (advisory — known recurring hazard).
  details.push(
    "ℹ️ Reminder: CF Pages Git integration can auto-deploy `main` and fight manual wrangler. " +
      "If the live site reverts, check CF dashboard Git connection.",
  );

  const summary =
    worst === "fail"
      ? "Repo divergence/fetch problem needs attention."
      : worst === "warn"
        ? "Minor divergence or stray refs to tidy."
        : "Repo in sync, no stray refs.";
  return { name, status: worst, summary, details, actions };
}
