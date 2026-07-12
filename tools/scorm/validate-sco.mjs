#!/usr/bin/env node
// validate-sco.mjs — lock the SCORM SCO wrapper's hardening so a future edit
// (or a concurrent rewrite) can't silently regress it.
//
// Guards three things:
//   1. The LIVE SCO (functions/_lib/scorm.js, what /api/scorm serves) still
//      contains every hardening invariant — cross-origin-safe API discovery,
//      report() finished/started guards, session_time, Canvas identity,
//      the message-origin check, and the <noscript> fallback.
//   2. The CLI template (tools/scorm/template/index.html.tpl) carries the SAME
//      invariants — the two SCO builders must stay in lockstep.
//   3. The endpoint (functions/api/scorm.js) validates the target exists
//      (fail-OPEN: only a definitive 404 blocks) before packaging.
//
// Run:  npm run validate:scorm        (part of `npm run validate`)
// Exit: 0 = all invariants hold, 1 = one or more missing (each printed).
import { readFileSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { buildScormFiles, zipStore } from "../../functions/_lib/scorm.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const norm = (s) => String(s).replace(/\s+/g, " ");
const problems = [];

// Invariants that MUST appear in BOTH SCO sources (whitespace-normalized, so a
// pretty-printed template and a single-line generated SCO match identically).
const SCO_INVARIANTS = [
  ["cross-origin-guarded findAPI", "try { if (win.API != null) return win.API; } catch"],
  ["report() guards finished", "if (!API || finished) return;"],
  ["report() guards started", "if (!started) return;"],
  ["records session_time", 'API.LMSSetValue("cmi.core.session_time", sessionTime());'],
  ["captures startedAt", "startedAt = Date.now();"],
  ["message-origin check", "e.origin !== LESSON_ORIGIN"],
  ["Canvas identity: student name", 'sn=" + encodeURIComponent(name)'],
  ["Canvas identity: student id", 'si=" + encodeURIComponent(sid)'],
  ["noscript fallback", "Open the activity directly"],
  ["launches at end (data-src → src)", "launchUrl(); })();"],
];

// Endpoint invariants (functions/api/scorm.js).
const ENDPOINT_INVARIANTS = [
  ["defines targetExists()", "async function targetExists("],
  ["HEAD-probes the target", 'method: "HEAD"'],
  ["fail-open: only 404 blocks", "res.status !== 404"],
  ["405 → ranged GET fallback", '"bytes=0-0"'],
  ["aborts on timeout", "AbortController"],
  ["gates packaging on existence", "await targetExists(pkg.lessonUrl)"],
  ["returns a 404 error page", "No activity exists"],
];

function checkSource(label, text) {
  const n = norm(text);
  for (const [name, needle] of SCO_INVARIANTS) {
    if (!n.includes(norm(needle))) problems.push(`${label}: missing invariant — ${name}`);
  }
}

// --- 1: live SCO built in-memory (the /api/scorm output) ---
const pkg = buildScormFiles({ target: "1-3", title: "Regression Probe" });
const liveSco = pkg.files["index.html"];
checkSource("live SCO (_lib/scorm.js)", liveSco);
if (!pkg.files["imsmanifest.xml"]?.includes("<schemaversion>1.2</schemaversion>"))
  problems.push("live manifest: not SCORM 1.2");
try {
  const zip = zipStore(pkg.files);
  if (!(zip instanceof Uint8Array) || zip.length < 100) problems.push("zipStore produced no bytes");
} catch (e) {
  problems.push("zipStore threw: " + (e.message || e));
}

// --- 2: CLI template (must mirror the live SCO) ---
const tpl = readFileSync(join(ROOT, "tools/scorm/template/index.html.tpl"), "utf8");
checkSource("CLI template (index.html.tpl)", tpl);

// --- 3: endpoint target-exists validation ---
const api = norm(readFileSync(join(ROOT, "functions/api/scorm.js"), "utf8"));
for (const [name, needle] of ENDPOINT_INVARIANTS) {
  if (!api.includes(norm(needle))) problems.push(`endpoint (api/scorm.js): missing — ${name}`);
}

console.log("SCORM SCO hardening validation");
console.log(`  live SCO invariants   : ${SCO_INVARIANTS.length}`);
console.log(`  template invariants   : ${SCO_INVARIANTS.length} (lockstep with live)`);
console.log(`  endpoint invariants   : ${ENDPOINT_INVARIANTS.length}`);
if (problems.length) {
  console.log(`\nFAIL — ${problems.length} problem(s):`);
  for (const p of problems) console.log("  ✗ " + p);
  console.log(
    "\nThe SCO wrapper lost a hardening guard, or the two builders drifted.\n" +
      "Keep functions/_lib/scorm.js `sco()` and tools/scorm/template/index.html.tpl in lockstep.",
  );
  process.exit(1);
}
console.log("RESULT: PASS ✅ (SCO hardening intact; live + CLI builders in lockstep)");
