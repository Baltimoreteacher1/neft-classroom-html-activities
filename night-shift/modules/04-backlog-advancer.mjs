// Module 4 — Backlog Advancer.
// Drains backlog.json. `regen` tasks run idempotent npm generators in an isolated
// worktree; if build+validate stay clean, commit to a branch, push, open a PR.
// `claude` tasks run a scoped headless `claude -p` and are gated off by default.
// NEVER deploys.
import path from "node:path";
import { sh, hasCommand, resolveCommand, readJson, writeJson } from "../lib/util.mjs";

export const name = "Backlog Advancer";

// Read, search, and edit files — no Bash, no network. A task that genuinely
// needs to run something declares `allowedTools` for itself.
const DEFAULT_CLAUDE_TOOLS = ["Read", "Glob", "Grep", "Edit", "Write"];

async function makeWorktree(ctx, branch, baseRef) {
  const wt = path.join(ctx.root, ".night-shift-worktrees", branch.replace(/[^\w.-]/g, "_"));
  await ctx.git.raw("worktree", "prune");
  // Base off the deploy branch (origin/main) so regen PRs contain ONLY the
  // regen diff — never the dirty working branch the repo happens to sit on.
  const r = await ctx.git.raw("worktree", "add", "-B", branch, wt, baseRef);
  return r.ok ? wt : null;
}

async function cleanupWorktree(ctx, wt) {
  if (wt) await ctx.git.raw("worktree", "remove", "--force", wt);
}

export async function run(ctx) {
  const cfg = ctx.config.backlogAdvancer || {};
  const details = [];
  const actions = [];
  let worst = "ok";

  if (!cfg.enabled) {
    return { name, status: "skip", summary: "Backlog Advancer disabled.", details, actions };
  }

  const backlogPath = path.join(ctx.root, "night-shift", "backlog.json");
  const backlogDoc = await readJson(backlogPath, { tasks: [] });
  const backlog = backlogDoc.tasks || [];
  const pending = backlog.filter((t) => t.status === "pending");
  if (!pending.length) {
    return { name, status: "ok", summary: "Backlog empty — nothing to advance.", details, actions };
  }

  const max = cfg.maxTasksPerRun || 1;
  const batch = pending.slice(0, max);
  const haveGh = await hasCommand("gh");
  // Absolute path, not a bare name: launchd's PATH has no version-manager
  // shims, and no non-interactive shell sources the mise activation either, so
  // a bare `claude` is unrunnable from a scheduled run. See resolveCommand.
  const claudeBin = await resolveCommand("claude", { cwd: ctx.root });

  // Resolve the deploy branch as the base for all generated worktrees.
  const remote = ctx.config.divergenceWatch?.remote || "origin";
  const mainBranch = cfg.baseBranch || ctx.config.divergenceWatch?.mainBranch || "main";
  if (!ctx.dryRun) await ctx.git.raw("fetch", remote, mainBranch);
  const baseRef = `${remote}/${mainBranch}`;

  for (const task of batch) {
    if (task.type === "claude" && !cfg.enableClaudeTasks) {
      details.push(`⏭️ "${task.title}" — claude task, but enableClaudeTasks is off.`);
      continue;
    }
    if (task.type === "claude" && !claudeBin) {
      worst = "warn";
      details.push(`⚠️ "${task.title}" — \`claude\` CLI did not resolve on PATH; skipped.`);
      actions.push("Night Shift could not find the `claude` CLI — check the login-shell PATH.");
      continue;
    }
    if (ctx.dryRun) {
      details.push(`🔎 [dry-run] would advance "${task.title}" (${task.type}) in a worktree → PR.`);
      continue;
    }

    const branch = `night-shift/${task.id}`;
    const wt = await makeWorktree(ctx, branch, baseRef);
    if (!wt) {
      worst = "warn";
      details.push(`⚠️ "${task.title}" — could not create worktree, skipped.`);
      continue;
    }

    try {
      let workOk = false;
      if (task.type === "regen") {
        const r = await sh("npm", ["run", task.script], { cwd: wt, timeout: 20 * 60_000 });
        workOk = r.ok;
        if (!workOk) details.push(`❌ "${task.title}" — \`npm run ${task.script}\` failed.`);
      } else if (task.type === "claude") {
        const prompt = `${task.prompt}\n\nConstraints: scoped diff only; do NOT deploy; do NOT touch unrelated files.`;
        // An unattended run gets no Bash unless the task asks for it by name:
        // nothing here should be able to shell out at 2am on its own initiative.
        const tools = (task.allowedTools || DEFAULT_CLAUDE_TOOLS).join(",");
        const r = await sh(
          claudeBin,
          ["-p", prompt, "--permission-mode", "acceptEdits", "--allowedTools", tools],
          { cwd: wt, timeout: (task.timeoutMinutes || 30) * 60_000 },
        );
        workOk = r.ok;
        if (!workOk) {
          // A 30-minute wall clock and a broken prompt are different problems;
          // reporting both as ❌ is how a briefing stops being worth reading.
          const why = r.timedOut
            ? `timed out after ${task.timeoutMinutes || 30}m`
            : `exited ${r.code}`;
          const tail = (r.stderr || r.stdout || "").trim().split("\n").slice(-3).join(" / ");
          details.push(`❌ "${task.title}" — headless claude ${why}.${tail ? ` ${tail}` : ""}`);
        }
      }

      if (!workOk) {
        worst = "warn";
        continue;
      }

      // Verify before proposing: validators must stay green.
      const val = await sh("npm", ["run", "validate"], { cwd: wt, timeout: 8 * 60_000 });
      if (!val.ok) {
        worst = "warn";
        details.push(`⚠️ "${task.title}" — work done but validators failed; NOT committing.`);
        continue;
      }

      const wtGit = (...a) => sh("git", ["-C", wt, ...a]);
      const status = (await wtGit("status", "--porcelain")).stdout.trim();
      if (!status) {
        details.push(`✅ "${task.title}" — ran clean, no changes produced (already current).`);
        task.status = "done";
        continue;
      }

      await wtGit("add", "-A");
      await wtGit("commit", "-m", `chore(night-shift): ${task.title}`);
      task.status = "in-review";

      if (cfg.openPullRequests && haveGh) {
        await wtGit("push", "-u", "origin", branch, "--force-with-lease");
        const pr = await sh(
          "gh",
          [
            "pr",
            "create",
            "--base",
            mainBranch,
            "--head",
            branch,
            "--title",
            `[night-shift] ${task.title}`,
            "--body",
            `Automated overnight regeneration.\n\nTask: ${task.id}\nValidators: passing.\nReview the diff; nothing was deployed.`,
          ],
          { cwd: wt },
        );
        if (pr.ok) {
          details.push(`✅ "${task.title}" — PR opened: ${pr.stdout.trim()}`);
          actions.push(`Review PR for "${task.title}".`);
        } else {
          details.push(`✅ "${task.title}" — pushed \`${branch}\` (PR open failed, open manually).`);
          actions.push(`Open a PR for branch \`${branch}\`.`);
        }
      } else {
        details.push(`✅ "${task.title}" — committed to \`${branch}\` (not pushed; no gh/PR).`);
        actions.push(`Push + review branch \`${branch}\` for "${task.title}".`);
      }
    } finally {
      await cleanupWorktree(ctx, wt);
    }
  }

  // Persist backlog status changes (preserve any extra keys; never in dry-run).
  if (!ctx.dryRun) {
    await writeJson(backlogPath, { ...backlogDoc, tasks: backlog });
  }

  const summary = ctx.dryRun
    ? `Dry-run: would advance ${batch.length} backlog task(s).`
    : worst === "warn"
      ? "Advanced backlog with some skips/failures — see details."
      : `Advanced ${batch.length} backlog task(s); PRs await review.`;
  return { name, status: worst, summary, details, actions };
}
