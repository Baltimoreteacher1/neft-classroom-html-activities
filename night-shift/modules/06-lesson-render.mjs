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
  let killed = false;
  try {
    const res = await execFileAsync("node", argsList, {
      cwd: ctx.root,
      timeout,
      maxBuffer: 64 * 1024 * 1024,
    });
    stdout = res.stdout || "";
  } catch (err) {
    // execFile rejects on non-zero exit; capture its output + code.
    stdout = (err.stdout || "") + (err.stderr || "");
    // A process we KILLED (timeout, maxBuffer, OOM) is not evidence that a
    // lesson is broken — it never got to finish probing. Node reports a kill
    // via err.killed/err.signal and leaves err.code non-numeric.
    killed = Boolean(err.killed) || Boolean(err.signal) || typeof err.code !== "number";
    code = typeof err.code === "number" ? err.code : 1;
  }

  const lines = stdout.split("\n").filter(Boolean);
  // smoke-lesson-boot.mjs prints "N/M pages rendered; K failed." — match that
  // wording (it says "pages", not "lessons"; the old /lessons? rendered/ never
  // matched and silently fell through to the last line of output, which on a
  // truncated run was a PASS row reported as the failure summary).
  const summaryLine = lines.find((l) => /\d+\s*\/\s*\d+ (?:pages?|lessons?) rendered/.test(l));
  const failLines = lines.filter((l) => l.trim().startsWith("FAIL"));
  const details = [`Probed live lessons at ${base}.`];
  if (summaryLine) details.push(summaryLine.trim());
  details.push(...failLines.map((l) => `❌ ${l.trim()}`));

  // Exit map: 0 = all rendered, 1 = a lesson failed to render, 2 = couldn't run.
  if (code === 0) {
    return { name, status: "ok", summary: summaryLine ? summaryLine.trim() : "All probed pages render.", details, actions: [] };
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

  // INCONCLUSIVE, NOT A FAILURE. A run we killed, or one that produced neither a
  // summary line nor a single FAIL row, never reached a verdict — reporting that
  // as "lessons are blank" cries wolf and trains the briefing to be ignored.
  // (2026-08-24: the ~288-page --all --variants run was killed mid-stream and
  // surfaced as "Live lesson(s) NOT rendering — PASS 2-2-group2 #app/mount".)
  if (killed || (!summaryLine && failLines.length === 0)) {
    const why = killed
      ? `exceeded its ${Math.round(timeout / 60000)}m budget and was killed`
      : "ended without reporting a verdict";
    return {
      name,
      status: "warn",
      summary: `Lesson render check INCONCLUSIVE — ${why} (not a render failure).`,
      details: [
        ...details,
        `⚠️ Probe ${why} after ${lines.filter((l) => /^\s*(PASS|FAIL)\b/.test(l)).length} page(s) — no verdict reached.`,
      ],
      actions: [
        `Raise lessonRender.timeoutMs in night-shift/config.json (currently ${timeout}ms) or narrow the sample; re-run \`npm run monitor:lesson-render\` to get a real verdict.`,
      ],
    };
  }

  return {
    name,
    status: "fail",
    summary: `Live lesson(s) NOT rendering — ${summaryLine ? summaryLine.trim() : `${failLines.length} page(s) failed`}`,
    details,
    actions: [
      "A live lesson renders blank (JS boot failure). Check the latest deploy of eduwonderlab.com and the lesson-renderer bundle for an uncaught error.",
    ],
  };
}
