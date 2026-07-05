#!/usr/bin/env node
// Night Shift orchestrator. Runs enabled modules in order, isolating failures,
// then writes a morning briefing. Safe to run anytime; --dry-run mutates nothing.
import { repoRoot, gitFor, makeLogger, readJson, path } from "./lib/util.mjs";
import { writeBriefing } from "./lib/report.mjs";

import * as regression from "./modules/01-regression-sentinel.mjs";
import * as buildQa from "./modules/02-build-qa.mjs";
import * as divergence from "./modules/03-divergence-watch.mjs";
import * as backlog from "./modules/04-backlog-advancer.mjs";
import * as routeMonitor from "./modules/05-route-monitor.mjs";
import * as lessonRender from "./modules/06-lesson-render.mjs";

const MODULES = [
  { key: "regression-sentinel", mod: regression },
  { key: "build-qa", mod: buildQa },
  { key: "route-monitor", mod: routeMonitor },
  { key: "lesson-render", mod: lessonRender },
  { key: "divergence-watch", mod: divergence },
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
  const ctx = { root, config, dryRun, log, git };
  const results = [];

  for (const { key, mod } of MODULES) {
    if (enabled[key] === false) {
      results.push({ name: mod.name, status: "skip", summary: "Disabled in config.", details: [], actions: [] });
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

  const date = new Date().toISOString().slice(0, 10);
  const meta = { date, branch, dryRun, durationMs: Date.now() - started };
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
