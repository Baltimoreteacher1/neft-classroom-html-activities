#!/usr/bin/env node
// validate:console-clean - a lesson must not throw or log an error while a student uses it.
//
//   node tools/validate-console-clean.mjs --base http://localhost:4603 [--lessons 1-1,3-1]
//
// Listens for `pageerror` (uncaught exceptions) and `console.error` from first byte through
// the entry card, the identity gate, the lesson, EVERY sidebar phase and a driven warm-up
// submit. Any such message FAILS the gate, attributed to the state it happened in.
//
// IGNORED, and counted in the output so the filter cannot hide a real problem:
//   * ERR_TUNNEL / favicon / sandbox DNS-proxy noise (the agent proxy refuses outbound hosts)
//   * "Failed to load resource" for an OFF-ORIGIN url (fonts CDN, analytics, hub API): the
//     sandbox blocks them; it is not the page's code
//   * "Failed to load resource" for same-origin /api/* (a static preview has no Worker;
//     the same rule smoke:injection uses)
// A same-origin 404 for a script, stylesheet, image or font is NOT ignored.
import { pathToFileURL } from "node:url";
import { runGates } from "./lib/lesson-gate-kit.mjs";

function judge(records) {
  const findings = [];
  const perLesson = {};
  const ignored = { network: 0, api: 0, noise: 0 };
  let runs = 0;
  let totalErrors = 0;
  const norm = (t) =>
    t
      .replace(/https?:\/\/[^\s)]+/g, "<url>")
      .replace(/\d+/g, "N")
      .slice(0, 90);
  for (const r of records) {
    const c = r.page.console;
    if (!c) continue;
    runs++;
    for (const k of Object.keys(ignored)) ignored[k] += c.ignored[k] || 0;
    perLesson[r.id] = {
      errors: c.errors.length,
      ignored: c.ignored.network + c.ignored.api + c.ignored.noise,
      // robustness facts the publisher scorecard reads (local preview: load time is relative only)
      loadMs: r.loadMs ?? null,
      entered: !!r.entered,
      phases: r.nav.phases,
      phasesVisited: r.nav.visited,
    };
    const seen = new Set();
    for (const e of c.errors) {
      const k = `${e.type}|${e.text}`;
      if (seen.has(k)) continue;
      seen.add(k);
      totalErrors++;
      findings.push({
        key: `${e.type}|${norm(e.text)}${e.url ? `|${e.url.replace(/^https?:\/\/[^/]+/, "").replace(/\d+/g, "N")}` : ""}`,
        lesson: r.id,
        viewport: r.viewport,
        state: e.state,
        detail: `${e.type}: ${e.text}${e.url ? ` (${e.url})` : ""}`,
      });
    }
  }
  const guards = [];
  if (runs === 0 && records.length) guards.push("collected console data from ZERO page runs");
  return {
    findings,
    guards,
    perLesson,
    stats: { pageRuns: runs, errors: totalErrors, ignored },
    lines: [
      `console.error / pageerror events: ${totalErrors} distinct`,
      `ignored (sandbox/static-preview noise, not the page): off-origin failed loads ${ignored.network}, /api failed loads ${ignored.api}, tunnel/favicon ${ignored.noise}`,
    ],
  };
}

export const gate = { name: "console-clean", viewports: ["1366x768"], feedback: true, judge };
if (import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(await runGates([gate]));
