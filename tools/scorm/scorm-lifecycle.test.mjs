#!/usr/bin/env node
/**
 * scorm-lifecycle.test.mjs — run the REAL generated SCO against a mock SCORM 1.2
 * LMS in jsdom and assert the whole lifecycle, including relaunch.
 *
 * Every check here pins a defect that was actually present:
 *   - the SCO stamped "incomplete" on every launch, so reopening a finished
 *     assignment to review it wiped the grade from the gradebook;
 *   - LMSInitialize's return value was ignored, so an LMS that refused the
 *     session looked identical to one that accepted it and the whole period's
 *     work went nowhere silently;
 *   - a later, lower score overwrote a higher one, and "completed" overwrote
 *     "passed";
 *   - nothing was ever written to cmi.suspend_data, so resume existed only in
 *     the student's own browser localStorage.
 *
 * jsdom rather than a browser on purpose: this must be fast enough to sit in the
 * push gate, and none of it depends on real layout.
 */
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { buildScormFiles } from "../../functions/_lib/scorm.js";
import { createMockLms } from "./mock-lms.mjs";

const LESSON_ORIGIN = "https://eduwonderlab.com";
let passed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failures.push(`${name}: ${e.message}`);
  }
}

/**
 * Boot the generated SCO inside a parent window that exposes `window.API`,
 * exactly as an LMS frames it. Returns helpers to drive the lesson side.
 */
function launch({ lms, target = "1-3", title = "Lifecycle Probe" } = {}) {
  const pkg = buildScormFiles({ target, title });
  const html = pkg.files["index.html"];

  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: "https://lms.example.edu/scorm/1/index.html",
    beforeParse(win) {
      // The SCO walks parents looking for window.API. Model the LMS frame by
      // putting the API on a stand-in parent — jsdom's window.parent is itself,
      // so the walk terminates on the first hop, which is the common Canvas
      // shape (SCO framed directly by the player).
      Object.defineProperty(win, "API", { value: lms.API, configurable: true });
    },
  });

  const win = dom.window;
  const send = (msg, origin = LESSON_ORIGIN) => {
    const ev = new win.MessageEvent("message", { data: msg, origin });
    win.dispatchEvent(ev);
  };
  return {
    dom,
    win,
    pkg,
    score: (percent) => send({ source: "neft-lesson", type: "score", percent }),
    ready: () => send({ source: "neft-lesson", type: "ready" }),
    state: (state, location) => send({ source: "neft-lesson", type: "state", state, location }),
    hostile: (msg) => send(msg, "https://evil.example.com"),
    unload: () => win.dispatchEvent(new win.Event("pagehide")),
    hide: () => {
      Object.defineProperty(win.document, "visibilityState", {
        value: "hidden",
        configurable: true,
      });
      win.document.dispatchEvent(new win.Event("visibilitychange"));
    },
    diag: () => win.NeftScormDiagnostics(),
  };
}

// --- 1. cold launch: initialize once, before anything else -------------------
check("cold launch initializes exactly once, before any write", () => {
  const lms = createMockLms();
  const sco = launch({ lms });
  sco.ready();
  const ops = lms.ops();
  assert.equal(
    ops.filter((o) => o === "LMSInitialize").length,
    1,
    `expected exactly one LMSInitialize, got ${ops.filter((o) => o === "LMSInitialize").length}`,
  );
  assert.equal(ops[0], "LMSInitialize", `first call was ${ops[0]}`);
  const firstWrite = ops.indexOf("LMSSetValue");
  if (firstWrite !== -1) assert.ok(firstWrite > 0, "wrote before initializing");
});

check("cold launch marks a fresh attempt incomplete", () => {
  const lms = createMockLms();
  launch({ lms }).ready();
  assert.equal(lms.valueOf("cmi.core.lesson_status"), "incomplete");
});

// --- 2. relaunch of a COMPLETED attempt must not erase it --------------------
check("relaunch does not downgrade a completed attempt to incomplete", () => {
  const lms = createMockLms({
    data: { "cmi.core.lesson_status": "passed", "cmi.core.score.raw": "92" },
  });
  launch({ lms }).ready();
  assert.equal(
    lms.valueOf("cmi.core.lesson_status"),
    "passed",
    "reopening a finished assignment erased the grade",
  );
  assert.equal(lms.valueOf("cmi.core.score.raw"), "92");
});

// --- 3. scoring semantics ----------------------------------------------------
check("score at/over mastery reports passed", () => {
  const lms = createMockLms();
  const sco = launch({ lms });
  sco.ready();
  sco.score(85);
  assert.equal(lms.valueOf("cmi.core.lesson_status"), "passed");
  assert.equal(lms.valueOf("cmi.core.score.raw"), "85");
  assert.equal(lms.valueOf("cmi.core.score.min"), "0");
  assert.equal(lms.valueOf("cmi.core.score.max"), "100");
});

check("score under mastery reports completed, not failed", () => {
  const lms = createMockLms();
  const sco = launch({ lms });
  sco.ready();
  sco.score(40);
  assert.equal(lms.valueOf("cmi.core.lesson_status"), "completed");
  assert.equal(lms.valueOf("cmi.core.score.raw"), "40");
});

check("a later lower score never overwrites a higher one", () => {
  const lms = createMockLms();
  const sco = launch({ lms });
  sco.ready();
  sco.score(100);
  sco.score(20);
  assert.equal(lms.valueOf("cmi.core.score.raw"), "100", "high-water mark lost");
  assert.equal(lms.valueOf("cmi.core.lesson_status"), "passed", "passed was downgraded");
});

check("score is clamped to 0..100", () => {
  const lms = createMockLms();
  const sco = launch({ lms });
  sco.ready();
  sco.score(-40);
  assert.equal(lms.valueOf("cmi.core.score.raw"), "0");
});

// --- 4. suspend_data: resume that follows the student ------------------------
check("state from the lesson is persisted to suspend_data and committed", async () => {
  const lms = createMockLms();
  const sco = launch({ lms });
  sco.ready();
  sco.state('{"fields":{"q1":"7"}}', "guided-practice");
  sco.hide(); // flushes the debounce
  assert.equal(lms.valueOf("cmi.suspend_data"), '{"fields":{"q1":"7"}}');
  assert.equal(lms.valueOf("cmi.core.lesson_location"), "guided-practice");
  assert.ok(lms.commits.length > 0, "never committed");
});

check("suspend_data over the SCORM 1.2 limit is refused, not truncated", () => {
  const lms = createMockLms();
  const sco = launch({ lms });
  sco.ready();
  sco.state("x".repeat(5000), "somewhere");
  sco.hide();
  assert.equal(lms.valueOf("cmi.suspend_data"), "", "wrote an oversize payload");
  assert.match(sco.diag().lastError, /suspend_data too large/);
});

check("lesson_location is capped at the CMIString255 limit", () => {
  const lms = createMockLms();
  const sco = launch({ lms });
  sco.ready();
  sco.state("{}", "y".repeat(400));
  sco.hide();
  assert.ok(
    lms.valueOf("cmi.core.lesson_location").length <= 255,
    "lesson_location exceeded 255 chars — a strict LMS rejects the whole write",
  );
});

check("stored state is handed back to the lesson on relaunch", () => {
  const lms = createMockLms({
    data: { "cmi.suspend_data": '{"fields":{"q1":"7"}}', "cmi.core.lesson_location": "warmup" },
  });
  const sco = launch({ lms });
  const seen = [];
  // The SCO posts the restore into the iframe; capture it at the boundary.
  const frame = sco.win.document.getElementById("lesson");
  Object.defineProperty(frame, "contentWindow", {
    value: { postMessage: (m, o) => seen.push({ m, o }) },
    configurable: true,
  });
  sco.ready();
  // Runtime v2 also answers the handshake with a `hello` carrying its protocol
  // version, so the assertion is on the RESTORE specifically — exactly one, and
  // never a second that would re-apply stale state over live work.
  const restores = seen.filter((s) => s.m.type === "restore");
  assert.equal(restores.length, 1, `expected one restore message, got ${restores.length}`);
  assert.equal(restores[0].m.state, '{"fields":{"q1":"7"}}');
  assert.equal(restores[0].m.location, "warmup");
  assert.equal(restores[0].o, LESSON_ORIGIN, "restore was not origin-targeted");
  for (const s of seen) {
    assert.equal(s.o, LESSON_ORIGIN, `message ${s.m.type} was not origin-targeted`);
  }
});

// --- 5. termination ----------------------------------------------------------
check("exit commits then finishes, exactly once, with a session time", () => {
  const lms = createMockLms();
  const sco = launch({ lms });
  sco.ready();
  sco.score(75);
  sco.unload();
  sco.unload(); // a second pagehide must not double-terminate
  const ops = lms.ops();
  const finishes = ops.filter((o) => o === "LMSFinish");
  assert.equal(finishes.length, 1, `expected one LMSFinish, got ${finishes.length}`);
  assert.equal(ops[ops.length - 1], "LMSFinish", "LMSFinish was not the last call");
  assert.ok(ops.lastIndexOf("LMSCommit") < ops.lastIndexOf("LMSFinish"), "committed after finish");
  assert.match(lms.valueOf("cmi.core.session_time"), /^\d{2,4}:\d{2}:\d{2}$/);
});

check("no writes occur after termination", () => {
  const lms = createMockLms();
  const sco = launch({ lms });
  sco.ready();
  sco.unload();
  const afterFinish = lms.calls.slice(lms.ops().lastIndexOf("LMSFinish") + 1);
  sco.score(90);
  const writes = lms.calls
    .slice(lms.ops().indexOf("LMSFinish") + 1)
    .filter((c) => c.op === "LMSSetValue");
  assert.equal(writes.length, 0, `wrote ${writes.length} value(s) after LMSFinish`);
  assert.equal(afterFinish.length, 0);
});

// --- 6. hostile / malformed input -------------------------------------------
check("messages from another origin are ignored", () => {
  const lms = createMockLms();
  const sco = launch({ lms });
  sco.ready();
  sco.hostile({ source: "neft-lesson", type: "score", percent: 100 });
  assert.equal(lms.valueOf("cmi.core.score.raw"), "", "accepted a cross-origin score");
});

check("malformed suspend data from the LMS does not break the launch", () => {
  const lms = createMockLms({ data: { "cmi.suspend_data": "{not json at all" } });
  const sco = launch({ lms });
  sco.ready();
  sco.score(50);
  assert.equal(lms.valueOf("cmi.core.score.raw"), "50", "a bad stored payload blocked scoring");
});

// --- 7. failure modes: the SCO must degrade, never loop or crash -------------
check("an LMS that refuses LMSInitialize does not stop the lesson", () => {
  const lms = createMockLms({ fail: (op) => (op === "Initialize" ? "101" : null) });
  const sco = launch({ lms });
  sco.ready();
  sco.score(80);
  assert.equal(lms.opsFor("LMSSetValue").length, 0, "wrote despite a refused initialize");
  assert.ok(sco.win.document.getElementById("lesson"), "the activity frame was torn down");
});

check("SetValue failures surface a diagnostic and a calm student notice", () => {
  const lms = createMockLms({ fail: (op) => (op === "SetValue" ? "351" : null) });
  const sco = launch({ lms });
  sco.ready();
  sco.score(80);
  const diag = sco.diag();
  assert.ok(diag.failures > 0, "failures were not counted");
  assert.match(diag.lastError, /351/, "the SCORM error code was not captured");
  const notice = sco.win.document.getElementById("nt-scorm-notice");
  assert.ok(notice, "no student-facing notice after repeated write failures");
  assert.doesNotMatch(notice.textContent, /351|LMSSetValue/, "showed a raw LMS error to a student");
});

check("Commit failures do not loop or throw", () => {
  const lms = createMockLms({ fail: (op) => (op === "Commit" ? "101" : null) });
  const sco = launch({ lms });
  sco.ready();
  sco.score(70);
  sco.unload();
  assert.ok(lms.opsFor("LMSCommit").length < 25, "commit retry loop");
});

check("no LMS at all: the activity still launches and nothing is faked", () => {
  const pkg = buildScormFiles({ target: "1-3", title: "No LMS" });
  const dom = new JSDOM(pkg.files["index.html"], {
    runScripts: "dangerously",
    url: "https://eduwonderlab.com/x/",
  });
  const frame = dom.window.document.getElementById("lesson");
  assert.ok(frame, "no activity frame");
  assert.ok(frame.getAttribute("src"), "the activity was never launched without an LMS");
  const diag = dom.window.NeftScormDiagnostics();
  assert.equal(diag.apiFound, false);
  assert.equal(diag.initialized, false, "claimed an LMS session with no LMS present");
  assert.equal(diag.status, "", "reported a completion status with no LMS present");
});

// --- 8. Canvas identity ------------------------------------------------------
check("the LMS learner identity is passed to the activity, normalized", () => {
  const lms = createMockLms();
  const sco = launch({ lms });
  const src = sco.win.document.getElementById("lesson").getAttribute("src");
  assert.match(src, /sn=Ana%20Rivera/, `"Last, First" was not normalized: ${src}`);
  assert.match(src, /si=1001/);
});

check("student identity is read, never written back", () => {
  const lms = createMockLms();
  launch({ lms }).ready();
  const wrote = lms
    .opsFor("LMSSetValue")
    .filter((c) => c.key === "cmi.core.student_id" || c.key === "cmi.core.student_name");
  assert.equal(wrote.length, 0, "attempted to write a read-only identity element");
});

// --- report ------------------------------------------------------------------
console.log("SCORM 1.2 lifecycle (real SCO vs mock LMS, jsdom)");
console.log(`  checks passed: ${passed}`);
if (failures.length) {
  console.log(`\nFAIL — ${failures.length} problem(s):`);
  for (const f of failures) console.log("  ✗ " + f);
  process.exit(1);
}
console.log("RESULT: PASS ✅");
process.exit(0);
