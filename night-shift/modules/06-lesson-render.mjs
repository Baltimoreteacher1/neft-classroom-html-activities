// Module 6 — Live Lesson Render.
// Route monitor (module 5) proves each route serves the RIGHT app over HTTP, but
// a lesson renders CLIENT-SIDE — a fatal JS error leaves #app blank while the
// HTML still returns 200 with all the right markers (the 2026-07-05 incident:
// initTeacherAccess/mountIdentityTeacherButton called without being imported →
// every lesson blank). Marker/status checks CANNOT see that. This module loads a
// sample of live lessons in headless Chromium and asserts each actually renders,
// via tools/smoke-lesson-boot.mjs --base <live>. Read-only network GETs — safe
// in dry-run.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);

export const name = "Live Lesson Render";

export async function run(ctx) {
  const cfg = ctx.config.lessonRender || {};
  const base = cfg.base || ctx.config.routeMonitor?.base || "https://eduwonderlab.com";
  const script = path.join(ctx.root, "tools", "smoke-lesson-boot.mjs");
  // Full-fleet nightly: `all` probes every lesson instead of one per unit, and
  // `variants` adds the 168 small-group + 36 catch-up configs — each is a
  // separately generated boot path, so a rendering core lesson proves nothing
  // about its variants. ~288 pages at a few seconds each needs the bigger
  // timeout; night-shift has the hours, the pre-push gate keeps the sample.
  const argsList = [script, "--base", base];
  if (cfg.all) argsList.push("--all");
  if (cfg.variants) argsList.push("--variants");
  const timeout = Number(cfg.timeoutMs) || (cfg.all ? 45 * 60 * 1000 : 180000);

  let stdout = "";
  let code = 0;
  try {
    const res = await execFileAsync("node", argsList, {
      cwd: ctx.root,
      timeout,
      maxBuffer: 16 * 1024 * 1024,
    });
    stdout = res.stdout || "";
  } catch (err) {
    // execFile rejects on non-zero exit; capture its output + code.
    stdout = (err.stdout || "") + (err.stderr || "");
    code = typeof err.code === "number" ? err.code : 1;
  }

  const lines = stdout.split("\n").filter(Boolean);
  const summaryLine =
    lines.find((l) => /lessons? rendered/.test(l)) || lines[lines.length - 1] || "(no output)";
  const failLines = lines.filter((l) => l.trim().startsWith("FAIL"));
  const details = [`Probed live lessons at ${base}.`, summaryLine.trim(), ...failLines.map((l) => `❌ ${l.trim()}`)];

  // Exit map: 0 = all rendered, 1 = a lesson failed to render, 2 = couldn't run.
  if (code === 0) {
    return { name, status: "ok", summary: summaryLine.trim(), details, actions: [] };
  }
  if (code === 2) {
    return {
      name,
      status: "warn",
      summary: "Lesson render check could not run (no browser / no build).",
      details,
      actions: ["Ensure Chromium is installed: npx playwright install chromium."],
    };
  }
  return {
    name,
    status: "fail",
    summary: `Live lesson(s) NOT rendering — ${summaryLine.trim()}`,
    details,
    actions: [
      "A live lesson renders blank (JS boot failure). Check the latest deploy of eduwonderlab.com and the lesson-renderer bundle for an uncaught error.",
    ],
  };
}
