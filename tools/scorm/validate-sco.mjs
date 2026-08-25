#!/usr/bin/env node
// validate-sco.mjs — lock the SCORM SCO wrapper's hardening so a future edit
// (or a concurrent rewrite) can't silently regress it.
//
// Guards three things:
//   1. The LIVE SCO (functions/_lib/scorm.js, what /api/scorm serves) still
//      contains every hardening invariant — cross-origin-safe API discovery,
//      report() finished/started guards, session_time, Canvas identity,
//      the message-origin check, and the <noscript> fallback.
//   2. The CLI builder (tools/scorm/build-scorm.mjs) still goes through that
//      one implementation instead of carrying its own copy of the SCO.
//   3. The endpoint (functions/api/scorm.js) validates the target exists
//      (fail-OPEN: only a definitive 404 blocks) before packaging.
//
// Run:  npm run validate:scorm        (part of `npm run validate`)
// Exit: 0 = all invariants hold, 1 = one or more missing (each printed).
import { existsSync, readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import {
  buildScormFiles,
  SCORM_PROTOCOL_VERSION as PROTOCOL_VERSION,
  SCORM_RUNTIME_VERSION as RUNTIME_VERSION,
  zipStore,
} from "../../functions/_lib/scorm.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const norm = (s) => String(s).replace(/\s+/g, " ");
const problems = [];

// Invariants that MUST appear in BOTH SCO sources (whitespace-normalized, so a
// pretty-printed template and a single-line generated SCO match identically).
const SCO_INVARIANTS = [
  ["cross-origin-guarded findAPI", "try { if (win.API != null) return win.API; } catch"],
  // Runtime v2 routes every LMS write through whenReady(), which holds BOTH
  // guards that report() used to hold inline: nothing is written after
  // LMSFinish, and nothing is written without a live LMSInitialize — the
  // difference is that a write arriving too EARLY is now queued rather than
  // dropped. The invariant is the same; the spelling moved.
  ["no LMS write after finish", "function whenReady(kind, fn) { if (finished) return;"],
  ["no LMS write without a live session", "if (API && start()) { fn(); flushQueue(); return; }"],
  ["queues events until the LMS is ready", "enqueue(kind, fn);"],
  ["records session_time", 'setValue("cmi.core.session_time", sessionTime());'],
  ["captures startedAt", "startedAt = Date.now();"],
  ["message-origin check", "e.origin !== LESSON_ORIGIN"],
  ["Canvas identity: student name", 'sn=" + encodeURIComponent(name)'],
  ["Canvas identity: student id", 'si=" + encodeURIComponent(sid)'],
  ["noscript fallback", "Open the activity directly"],
  ["launches at the end (data-src → src)", "launch(); renderDebug();"],
  // --- added by the 2026-08 hardening pass; each pins a real defect ---
  ["reads status before writing it", 'var current = lmsGet("cmi.core.lesson_status");'],
  ["inspects LMS error codes", "API.LMSGetLastError()"],
  ["checks call return values", 'ok = String(fn()) === "true";'],
  ["score is a high-water mark", 'if (prevStr !== "" && isFinite(prev) && prev > value)'],
  ["never downgrades passed", 'currentStatus !== "passed" || status === "passed"'],
  // --- Runtime v2 invariants; each pins a failure the v1 shell could not see ---
  ["declares its runtime version", `var RUNTIME = ${RUNTIME_VERSION};`],
  ["declares its protocol version", `var PROTOCOL = ${PROTOCOL_VERSION};`],
  ["paints a loading state before the lesson", "Loading your math lesson"],
  ["announces loading to assistive tech", 'role="status" aria-live="polite"'],
  ["respects reduced motion", "prefers-reduced-motion: reduce"],
  ["retries are bounded", "var RETRY_DELAYS = [2000 / FAST, 6000 / FAST];"],
  ["student-facing failure state", "We couldn't load your lesson."],
  ["failure state offers a retry", 'id="ewl-retry"'],
  ["classifies Cloudflare Access", "CODES.ACCESS"],
  ["Access probe is the reachability contract", "/api/scorm-probe"],
  ["rejects unknown message types", "if (!ALLOWED[type])"],
  ["validates the score payload", 'typeof d.percent !== "number" || !isFinite(d.percent)'],
  ["bounds a reported height", "if (n < 200 || n > 20000)"],
  ["retries LMS discovery", "var API_RETRIES = [0, 250, 750, 1500, 3000, 6000];"],
  ["ignores a duplicate completion", "duplicate completion ignored"],
  ["never yanks a working lesson", 'if (settled && diag.state === "ready") return;'],
  ["degrades rather than failing a rendered lesson", "if (iframeLoaded)"],
  ["refuses oversize suspend_data", "s.length > SUSPEND_LIMIT"],
  ["caps lesson_location", "slice(0, LOCATION_LIMIT)"],
  ["restores state to the activity", 'type: "restore"'],
  ["commits on the hidden transition", 'document.visibilityState === "hidden"'],
  ["student-facing failure notice", "may not be saving to the course"],
];

// NOTE ON WHAT THIS FILE CAN AND CANNOT SEE. Every check above is a source-text
// grep: it proves a line is present, never that the runtime behaves. The
// behavioural gate is tools/scorm/scorm-lifecycle.test.mjs, which boots this
// exact generated SCO against a mock SCORM 1.2 LMS and asserts the call
// ORDER and the resulting cmi values. Keep both — this one is instant and
// catches a deletion; that one catches a rewrite that still contains the words.

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

// --- 2: the CLI builder must use the SHARED library, not its own copy ---
// tools/scorm/template/ used to hold a second, hand-maintained SCO that this
// file kept in step with a list of invariant strings. That list could only pin
// what someone thought to add, so every hardening fix had to land twice and a
// package downloaded from the site could differ materially from one built by
// the script. The template is gone; what must be true now is that the CLI still
// goes through the one implementation.
const cli = readFileSync(join(ROOT, "tools/scorm/build-scorm.mjs"), "utf8");
if (!cli.includes('from "../../functions/_lib/scorm.js"'))
  problems.push("CLI builder (build-scorm.mjs): no longer imports the shared SCO builder");
if (/execSync|child_process/.test(cli))
  problems.push(
    "CLI builder (build-scorm.mjs): shells out again — use zipStore, so output stays " +
      "deterministic and the lesson id is never interpolated into a shell command",
  );
if (existsSync(join(ROOT, "tools/scorm/template")))
  problems.push(
    "tools/scorm/template/ is back — that is the duplicate SCO this consolidation removed",
  );

// --- 3: endpoint target-exists validation ---
const api = norm(readFileSync(join(ROOT, "functions/api/scorm.js"), "utf8"));
for (const [name, needle] of ENDPOINT_INVARIANTS) {
  if (!api.includes(norm(needle))) problems.push(`endpoint (api/scorm.js): missing — ${name}`);
}

console.log("SCORM SCO hardening validation");
console.log(`  live SCO invariants   : ${SCO_INVARIANTS.length}`);
console.log(`  endpoint invariants   : ${ENDPOINT_INVARIANTS.length}`);
if (problems.length) {
  console.log(`\nFAIL — ${problems.length} problem(s):`);
  for (const p of problems) console.log("  ✗ " + p);
  console.log(
    "\nThe SCO wrapper lost a hardening guard, or the two builders drifted.\n" +
      "The one SCO builder is functions/_lib/scorm.js sco().",
  );
  process.exit(1);
}
console.log("RESULT: PASS ✅ (SCO hardening intact; one shared SCO builder)");
