#!/usr/bin/env node
/**
 * engine-lesson-passback.test.mjs — a core engine lesson launched in SCORM mode
 * must reach Canvas, not just render.
 *
 * THE BUG THIS PINS. Engine lesson pages never loaded assets/canvas-bridge.js.
 * The build-time injector (tools/inject-canvas-bridge.js) targets the activity
 * catalog plus every lessons/<id>/homework.html; lessons/<id>/index.html was
 * never in that set. The consequence was NOT "no grade" — app.js already posts
 * a score at full phase completion through canvas-code-ui.js — it was no
 * `ready` handshake and no `state`/`location` relay, so nothing was ever
 * written to cmi.suspend_data or cmi.core.lesson_location. A student who closed
 * a Canvas assignment half-way through and came back started over.
 *
 * This asserts real SCORM 1.2 CALLS against the Runtime v2 mock LMS. It
 * deliberately does NOT assert that a <script> tag exists: the shipped
 * arrangement was one where the tag's absence was invisible to every gate, and
 * a test that only re-checks the tag would be satisfied by a bridge that loads
 * and does nothing.
 *
 * jsdom, no network: the engine's real boot is far too heavy to run here, so the
 * lesson side is modelled by the exact messages assets/canvas-bridge.js emits.
 * The browser-level proof that the engine actually LOADS the bridge lives in
 * validate-scorm-runtime.mjs (static) and the live post-deploy probe.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { buildScormFiles } from "../../functions/_lib/scorm.js";
import { createMockLms } from "./mock-lms.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const LESSON_ORIGIN = "https://eduwonderlab.com";

let passed = 0;
const failures = [];
const check = (name, fn) => {
  try {
    fn();
    passed++;
  } catch (e) {
    failures.push(`${name}: ${e.message}`);
  }
};

/** Boot the shipped SCO against a mock Canvas and drive the lesson side. */
function launch(target, lms) {
  const pkg = buildScormFiles({ target, title: "Engine Passback Probe" });
  const dom = new JSDOM(pkg.files["index.html"], {
    runScripts: "dangerously",
    url: "https://lms.example.edu/scorm/1/index.html",
    beforeParse(win) {
      Object.defineProperty(win, "API", { value: lms.API, configurable: true });
      win.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
    },
  });
  const win = dom.window;
  const send = (msg, origin = LESSON_ORIGIN) =>
    win.dispatchEvent(new win.MessageEvent("message", { data: msg, origin }));
  return {
    win,
    send,
    diag: () => win.EduWonderLabScorm(),
    hide() {
      Object.defineProperty(win.document, "visibilityState", {
        value: "hidden",
        configurable: true,
      });
      win.document.dispatchEvent(new win.Event("visibilitychange"));
    },
    close: () => win.close(),
  };
}

// --- 1. THE REGRESSION: the shared engine hook must exist and be wired -------
// Source-level, but it pins the ARCHITECTURE rather than a per-lesson tag: one
// shared module, reached from the boot every engine lesson passes through.
check("the shared engine → bridge hook exists", () => {
  const mod = read("engine/core/scorm-bridge.js");
  assert.match(mod, /export function ensureCanvasBridge/, "no shared entry point");
  assert.match(mod, /lms=scorm/, "the hook does not detect a SCORM launch");
  assert.match(mod, /manual: true/, "the bridge auto-scorer is not suppressed");
  assert.match(mod, /finishButton: false/, "the hardcoded-100 finish button is not suppressed");
  assert.match(mod, /NeftCanvasBridge\b/, "no idempotence guard");
});

check("every engine lesson family reaches the hook through a shared boot", () => {
  // Not a lesson list. These two renderers ARE the boot path: all 289
  // lessons/*/lesson.js call bootFlagship (which delegates to bootLesson),
  // bootLesson, or bootSmallGroup. A new lesson inherits the behaviour by
  // existing, which is the property that keeps this fixed.
  for (const f of ["engine/core/lesson-renderer.js", "engine/core/small-group-renderer.js"]) {
    const src = read(f);
    assert.match(src, /import \{ ensureCanvasBridge \}/, `${f} does not import the hook`);
    assert.match(src, /ensureCanvasBridge\(config\)/, `${f} never calls the hook`);
  }
  const flagship = read("engine/templates/flagship/flagship.js");
  assert.match(
    flagship,
    /bootLesson/,
    "flagship no longer delegates to bootLesson — it needs its own call",
  );
});

check("the hook is inert outside a SCORM launch", () => {
  const mod = read("engine/core/scorm-bridge.js");
  // The SCORM test must gate the load, or every normal lesson visit pays for
  // LMS code it will never use.
  const body = mod.slice(mod.indexOf("export function ensureCanvasBridge"));
  assert.match(body, /if \(!isScormLaunch\(\)\) return false;/, "the bridge loads outside SCORM");
  assert.ok(
    body.indexOf("isScormLaunch()") < body.indexOf("createElement"),
    "the script element is created before the SCORM check",
  );
});

// --- 2. THE PAYOFF: resume state actually reaches Canvas ---------------------
check("an engine lesson's state relay writes suspend_data and lesson_location", () => {
  const lms = createMockLms();
  const sco = launch("1-1", lms);
  // What canvas-bridge.js emits on an engine lesson once it is loaded.
  sco.send({ source: "neft-lesson", type: "ready", protocol: 2 });
  sco.send({
    source: "neft-lesson",
    type: "state",
    protocol: 2,
    state: '{"fields":{"q1":"7"},"progressPercent":40}',
    location: "guided-practice-2",
  });
  sco.hide(); // flush
  assert.equal(
    lms.valueOf("cmi.suspend_data"),
    '{"fields":{"q1":"7"},"progressPercent":40}',
    "resume state never reached Canvas — this is the exact bug",
  );
  assert.equal(lms.valueOf("cmi.core.lesson_location"), "guided-practice-2");
  assert.equal(sco.diag().lessonProtocol, 2, "the handshake did not complete");
  sco.close();
});

check("reopening restores what the engine lesson stored", () => {
  const first = createMockLms();
  const a = launch("1-1", first);
  a.send({ source: "neft-lesson", type: "ready", protocol: 2 });
  a.send({
    source: "neft-lesson",
    type: "state",
    protocol: 2,
    state: '{"fields":{"q1":"7"}}',
    location: "explore",
  });
  a.hide();
  a.close();

  const second = createMockLms({ data: { ...first.data } });
  const b = launch("1-1", second);
  const frame = b.win.document.getElementById("lesson");
  const seen = [];
  Object.defineProperty(frame, "contentWindow", {
    value: { postMessage: (m) => seen.push(m) },
    configurable: true,
  });
  b.send({ source: "neft-lesson", type: "ready", protocol: 2 });
  const restore = seen.find((m) => m.type === "restore");
  assert.ok(restore, "nothing was restored on reopen");
  assert.equal(restore.state, '{"fields":{"q1":"7"}}');
  assert.equal(restore.location, "explore");
  b.close();
});

// --- 3. score stays the ENGINE's, and is not duplicated ----------------------
check("the engine's completion score reaches Canvas exactly once", () => {
  const lms = createMockLms();
  const sco = launch("1-1", lms);
  sco.send({ source: "neft-lesson", type: "ready", protocol: 2 });
  // app.js → grade-emit → canvas-code-ui posts this at full phase completion.
  sco.send({ source: "neft-lesson", type: "score", percent: 82, protocol: 2 });
  const writes = lms.opsFor("LMSSetValue").length;
  assert.equal(lms.valueOf("cmi.core.score.raw"), "82");
  assert.equal(lms.valueOf("cmi.core.lesson_status"), "passed");
  // A second identical completion (a re-render, a second subscriber) must not
  // write again — the engine has one completion, so Canvas must see one.
  sco.send({ source: "neft-lesson", type: "score", percent: 82, protocol: 2 });
  assert.equal(lms.opsFor("LMSSetValue").length, writes, "a duplicate completion wrote again");
  sco.close();
});

check("the bridge cannot introduce a second, competing score", () => {
  // manual:true disables the save/resume auto-watcher, whose percent is
  // "how much of the lesson was touched" — a different quantity from the
  // lesson's percent correct. Two sources would race and the last one wins.
  const mod = read("engine/core/scorm-bridge.js");
  assert.match(mod, /manual: true/);
  const bridge = read("assets/canvas-bridge.js");
  assert.match(
    bridge,
    /if \(cfg\.manual \|\| cfg\.auto === false\) return;/,
    "canvas-bridge no longer honours manual — the auto-watcher would double-report",
  );
  assert.match(
    bridge,
    /if \(cfg\.finishButton === false\) return;/,
    "canvas-bridge no longer honours finishButton — a student could send a fake 100",
  );
});

// --- 4. the working families must not regress --------------------------------
check("homework and standalone activities keep their existing behaviour", () => {
  const bridge = read("assets/canvas-bridge.js");
  // Defaults unchanged: only an explicit false opts out, so the 109 catalog
  // activities and 84 homework pages are untouched by this change.
  assert.doesNotMatch(bridge, /cfg\.finishButton \|\| /, "finishButton default was inverted");
  assert.match(
    bridge,
    /if \(!global \|\| global\.NeftCanvasBridge\) return;/,
    "lost double-load guard",
  );

  for (const target of ["/lessons/1-1/homework.html", "/ratio-color-mixer/"]) {
    const lms = createMockLms();
    const sco = launch(target, lms);
    sco.send({ source: "neft-lesson", type: "ready", protocol: 2 });
    sco.send({ source: "neft-lesson", type: "score", percent: 95, protocol: 2 });
    assert.equal(lms.valueOf("cmi.core.score.raw"), "95", `${target} stopped reporting`);
    assert.equal(lms.valueOf("cmi.core.lesson_status"), "passed");
    sco.close();
  }
});

check("no standing timer is introduced (the npm test hang class)", () => {
  // Comments stripped first: the module's own comment EXPLAINS why it avoids a
  // setInterval, and a detector that reads prose fails on the documentation of
  // the very thing it is checking for.
  const code = read("engine/core/scorm-bridge.js")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
  assert.doesNotMatch(code, /setInterval/, "the engine hook introduced a standing timer");
  // And manual:true is what keeps the bridge's own 1.5s poller from starting.
  assert.match(code, /manual: true/);
});

// --- 5. pathway types WITHOUT a scoreable terminus ---------------------------
check("small-group and catch-up are marked completion-only, so no score is invented", () => {
  const hook = read("engine/core/scorm-bridge.js");
  // `variant` is group1 / group2 / catchup on exactly the pathways rendered by
  // small-group-renderer.js, which never calls createApp() — so
  // engine/core/app.js:1222 completeLesson() is unreachable for them and there
  // is no percent they could honestly report.
  assert.match(
    hook,
    /completionOnly: !!config\?\.variant/,
    "the hook no longer marks variant pathways completion-only",
  );
  const sg = read("engine/core/small-group-renderer.js");
  // Word-boundary: createApplyLab CONTAINS "createApp", and a bare substring
  // match reports small-group as reaching the scoring engine when it does not.
  assert.doesNotMatch(
    sg,
    /\bcreateApp\(/,
    "small-group now reaches createApp — re-check the terminus",
  );
});

check("unit projects are completion-only, derived from the path not a list", () => {
  const inj = read("tools/inject-canvas-bridge.js");
  assert.match(inj, /math\\\/\[a-z0-9-\]\+\\\/projects/, "project detection is not path-derived");
  assert.match(inj, /completionOnly:true/, "projects no longer get completion-only mode");
  assert.match(inj, /finishButton:false/, "the hardcoded-100 button is back on projects");
});

check("completionOnly suppresses the score post entirely", () => {
  const bridge = read("assets/canvas-bridge.js");
  const c = bridge.slice(bridge.indexOf("function complete("));
  const guard = c.indexOf("cfg.completionOnly");
  const report = c.indexOf("reportScore(pct)");
  assert.ok(guard > -1, "completionOnly is not honoured by complete()");
  assert.ok(guard < report, "completionOnly is checked AFTER the score is posted");
});

// --- 6. the suspend_data ceiling --------------------------------------------
check("an oversize payload becomes a pointer, never nothing and never truncated", () => {
  const bridge = read("assets/canvas-bridge.js");
  const fn = bridge.slice(
    bridge.indexOf("function compactForScorm"),
    bridge.indexOf("function snapshotState"),
  );
  assert.match(fn, /ref: "local"/, "no pointer fallback — oversize state persists NOTHING");
  assert.match(fn, /pointer\.length <= SUSPEND_BUDGET/, "the pointer itself is not size-checked");
  assert.match(fn, /console\.info/, "the reduction is silent — it must be logged");
  // Truncation is the one thing that must never happen: half a JSON payload
  // restores as wrong answers, which is worse than no resume at all.
  assert.doesNotMatch(fn, /\.slice\(0,\s*SUSPEND_BUDGET\)/, "payload is being truncated");
  // Measured on production: small-group/catch-up/project serialize 7.7k-12.3k
  // chars with ZERO fields filled, so this path is the normal case for them,
  // not an edge case.
  assert.ok(
    fn.indexOf("SUSPEND_BUDGET") < fn.indexOf('ref: "local"'),
    "budget check must gate the pointer",
  );
});

check("a restored pointer is never fed back in as lesson state", () => {
  const bridge = read("assets/canvas-bridge.js");
  const raw = bridge.slice(bridge.indexOf("function applyRestore"));
  assert.match(
    raw,
    /st && st\.ref === "local"/,
    "applyRestore would hand a pointer to _restoreState — a shape with no fields",
  );
  // Comments stripped before the ORDERING check: the guard's own comment names
  // _restoreState while explaining why it exists, and a detector that reads
  // prose finds that mention first and reports the order backwards.
  const fn = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
  assert.ok(
    fn.indexOf('st.ref === "local"') < fn.indexOf("_restoreState"),
    "the pointer guard runs after the restore",
  );
});

check("payloads already under the limit keep their existing format", () => {
  // Core lessons (713 chars) and homework (2,551) must be untouched by the
  // pointer work — measured, and the early return is what guarantees it.
  const bridge = read("assets/canvas-bridge.js");
  const fn = bridge.slice(bridge.indexOf("function compactForScorm"));
  assert.match(
    fn,
    /if \(out\.length <= SUSPEND_BUDGET\) return out;/,
    "no early return for fitting payloads",
  );
});

console.log("Engine lesson → Canvas passback");
console.log(`  checks passed: ${passed}`);
if (failures.length) {
  console.log(`\nFAIL — ${failures.length} problem(s):`);
  for (const f of failures) console.log("  ✗ " + f);
  console.log("\nSee docs/scorm-runtime.md — engine lesson SCORM bridge integration.");
  process.exit(1);
}
console.log("RESULT: PASS ✅");
