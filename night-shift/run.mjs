#!/usr/bin/env node
// Night Shift orchestrator. Runs enabled modules in order, isolating failures,
// then writes a morning briefing. Safe to run anytime; --dry-run mutates nothing.
import { repoRoot, gitFor, makeLogger, readJson, path } from "./lib/util.mjs";
import { writeBriefing } from "./lib/report.mjs";
import { createAuditWorktree } from "./lib/worktree.mjs";

import * as regression from "./modules/01-regression-sentinel.mjs";
import * as buildQa from "./modules/02-build-qa.mjs";
import * as divergence from "./modules/03-divergence-watch.mjs";
import * as backlog from "./modules/04-backlog-advancer.mjs";
import * as routeMonitor from "./modules/05-route-monitor.mjs";
import * as lessonRender from "./modules/06-lesson-render.mjs";
import * as backupSentinel from "./modules/07-backup-sentinel.mjs";
import * as signalHealth from "./modules/08-signal-health.mjs";
import * as memoryIndex from "./modules/09-memory-index.mjs";

// `audit: true` = the module judges SOURCE, so it must run against a clean
// checkout of origin/main, not the live working tree. Everything else is either
// about the live repo itself (divergence, backlog) or hits production over the
// network (route monitor, lesson render) and is root-independent.
const MODULES = [
  { key: "regression-sentinel", mod: regression, audit: true },
  { key: "build-qa", mod: buildQa, audit: true },
  { key: "route-monitor", mod: routeMonitor },
  { key: "lesson-render", mod: lessonRender },
  { key: "divergence-watch", mod: divergence },
  { key: "backup-sentinel", mod: backupSentinel },
  { key: "signal-health", mod: signalHealth },
  // Reads ~/.claude, not the repo — root-independent, so no audit worktree.
  { key: "memory-index", mod: memoryIndex },
  { key: "backlog-advancer", mod: backlog },
];

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const root = repoRoot();
  const log = makeLogger();
  const config = await readJson(path.join(root, "night-shift", "config.json"), {});
  const enabled = config.modules || {};
  const git = gitFor(root);
  const branch = await git.currentBranch();
  const started = Date.now();

  log.info(`Starting Night Shift (${dryRun ? "dry-run" : "live"}) on branch ${branch}`);

  // Source-truth modules audit a clean origin/main worktree — see lib/worktree.mjs.
  const dw = config.divergenceWatch || {};
  const wt = await createAuditWorktree(root, { remote: dw.remote, main: dw.mainBranch, log });
  if (wt.ok) {
    log.info(`Auditing ${wt.ref} @ ${wt.sha.slice(0, 9)} in clean worktree ${wt.dir}`);
  } else {
    log.warn(`audit worktree unavailable (${wt.reason}) — source modules will report as inconclusive`);
  }

  const ctx = { root, config, dryRun, log, git, auditRoot: wt.ok ? wt.dir : null };
  const results = [];

  try {
    for (const { key, mod, audit } of MODULES) {
      if (enabled[key] === false) {
        results.push({ name: mod.name, status: "skip", summary: "Disabled in config.", details: [], actions: [] });
        continue;
      }
      // Never judge source from a dirty tree: a missing worktree makes the
      // result unknown, and unknown must not masquerade as broken.
      if (audit && !ctx.auditRoot) {
        results.push({
          name: mod.name,
          status: "warn",
          summary: "Inconclusive — could not check out origin/main to audit.",
          details: [`⚠️ ${wt.reason}`],
          actions: [`Night Shift could not create the audit worktree: ${wt.reason}`],
        });
        continue;
      }
      log.info(`▶ ${mod.name}`);
      try {
        const r = await mod.run(ctx);
        results.push(r);
        log.info(`  ${r.status.toUpperCase()} — ${r.summary}`);
      } catch (err) {
        log.error(`  ${mod.name} threw: ${err.stack || err}`);
        results.push({
          name: mod.name,
          status: "fail",
          summary: `Module crashed: ${err.message || err}`,
          details: [String(err.stack || err).split("\n").slice(0, 4).join(" / ")],
          actions: [`Investigate Night Shift module "${mod.name}" crash.`],
        });
      }
    }
  } finally {
    await wt.cleanup();
  }

  const date = new Date().toISOString().slice(0, 10);
  const meta = {
    date,
    branch,
    dryRun,
    durationMs: Date.now() - started,
    auditRef: wt.ok ? wt.ref : null,
    auditSha: wt.ok ? wt.sha : null,
  };
  const { dir, headline, counts } = await writeBriefing(root, results, meta);

  log.info("");
  log.info(`Briefing: ${headline} — ${counts.ok}✅ ${counts.warn}⚠️ ${counts.fail}❌ ${counts.skip}⏭️`);
  log.info(`Written to ${path.relative(root, dir)}/${date}.md (and latest.md)`);

  // Non-zero exit on any failure so launchd/monitoring can alert.
  process.exit(counts.fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("[night-shift] fatal:", e);
  process.exit(2);
});
