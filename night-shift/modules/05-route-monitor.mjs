// Module 5 — Live Route Monitor.
// Probes the production site over HTTP and asserts each route serves the RIGHT
// app (correct status + distinctive content markers). Build QA (module 2) covers
// the LOCAL dist; this covers what students actually hit. Missing markers catch
// the deploy-overwrite / curriculum-clobber incident class that returns 200 with
// foreign or stripped content. Read-only network GETs — safe in dry-run.
import path from "node:path";
import { execFileSync } from "node:child_process";
import { readJson } from "../lib/util.mjs";
import { runRouteMonitor } from "../../scripts/route-monitor.mjs";

export const name = "Live Route Monitor";

/**
 * Commit production SHOULD be serving: config override, env, or `origin/main`.
 *
 * NOT `HEAD`. Push-to-`main` is the only deploy path, so `origin/main` is the
 * only ref production can be behind. Reading HEAD meant that on any feature
 * branch the module compared the live site against a commit that had never been
 * pushed and reported "deploy lag — live X != main Y", naming a Y that was not
 * main at all. That is a guaranteed false alarm for the whole life of a branch,
 * and it is the same bug class as the 2026-07-28 fix that moved the source-truth
 * modules onto a clean origin/main worktree — this module was missed then.
 *
 * Falls back to HEAD only when there is no `origin/main` (fresh clone, no
 * remote), where HEAD is the best guess available.
 */
function expectedCommit(ctx) {
  if (ctx.config?.routeMonitor?.expectedCommit) return ctx.config.routeMonitor.expectedCommit;
  if (process.env.CF_EXPECTED_COMMIT) return process.env.CF_EXPECTED_COMMIT;
  for (const ref of ["refs/remotes/origin/main", "HEAD"]) {
    try {
      return execFileSync("git", ["rev-parse", ref], { cwd: ctx.root, encoding: "utf8" }).trim();
    } catch {
      // try the next ref
    }
  }
  return undefined;
}

export async function run(ctx) {
  const cfg = ctx.config.routeMonitor || {};
  const manifestPath = path.join(ctx.root, cfg.manifest || "night-shift/route-manifest.json");
  const manifest = await readJson(manifestPath, null);

  if (!manifest || !Array.isArray(manifest.routes)) {
    return {
      name,
      status: "warn",
      summary: "No route manifest — live monitor skipped.",
      details: [`⚠️ Could not load ${path.relative(ctx.root, manifestPath)}. Expected a JSON file with a routes[] array.`],
      actions: ["Add night-shift/route-manifest.json to enable live route monitoring."],
    };
  }

  let report;
  try {
    report = await runRouteMonitor({ manifest, base: cfg.base, expectedCommit: expectedCommit(ctx) });
  } catch (err) {
    return {
      name,
      status: "warn",
      summary: "Route monitor could not run.",
      details: [`⚠️ ${err.message}`],
      actions: ["Check the route manifest base URL and network access."],
    };
  }

  const icon = { ok: "✅", warn: "⚠️", fail: "❌" };
  const details = [`Probed ${report.results.length} live route(s) at ${report.base}.`];
  const actions = [];
  for (const r of report.results) {
    // Surface every non-ok line, plus a compact note for ok lines.
    if (r.level === "ok") details.push(`✅ [${r.status}] ${r.label}`);
    else details.push(`${icon[r.level]} [${r.status}] ${r.label} — ${r.note}`);
  }

  let status = "ok";
  if (report.counts.fail > 0) {
    status = "fail";
    actions.push(`${report.counts.fail} live route(s) serving wrong/missing/unreachable content — verify the latest deploy of eduwonderlab.com.`);
  } else if (report.counts.warn > 0) {
    status = "warn";
  }

  const summary =
    status === "fail"
      ? `${report.counts.fail} route(s) FAILED live verification.`
      : status === "warn"
        ? `Live routes up; ${report.counts.warn} warning(s).`
        : `All ${report.counts.ok} live route(s) verified.`;

  return { name, status, summary, details, actions };
}
