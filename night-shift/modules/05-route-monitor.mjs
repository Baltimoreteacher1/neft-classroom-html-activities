// Module 5 — Live Route Monitor.
// Probes the production site over HTTP and asserts each route serves the RIGHT
// app (correct status + distinctive content markers). Build QA (module 2) covers
// the LOCAL dist; this covers what students actually hit. Missing markers catch
// the deploy-overwrite / curriculum-clobber incident class that returns 200 with
// foreign or stripped content. Read-only network GETs — safe in dry-run.
import path from "node:path";
import { readJson } from "../lib/util.mjs";
import { runRouteMonitor } from "../../scripts/route-monitor.mjs";

export const name = "Live Route Monitor";

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
    report = await runRouteMonitor({ manifest, base: cfg.base });
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
