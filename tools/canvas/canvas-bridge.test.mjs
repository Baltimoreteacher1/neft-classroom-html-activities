/**
 * canvas-bridge.test.mjs — behavior test for assets/canvas-bridge.js.
 *
 * The earlier checks were contract-level (codec round-trip, postMessage field
 * names match the SCORM SCO). This drives the actual script in a real DOM
 * (jsdom) to prove the end-to-end student flow:
 *   1. On completion it shows the popup with a code the canvas-grades tool decodes.
 *   2. Inside a SCORM launch (?lms=scorm) it stays silent (no popup).
 *   3. The auto-watch fires once when save/resume progress reaches the threshold.
 *
 * Lives under tools/ (not deployed) and is picked up by `npm test`
 * (tools/run-tests.mjs). Lives or dies by top-level assertions + exit code.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import jsdomPkg from "jsdom";

const { JSDOM } = jsdomPkg;
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const bridgeSrc = readFileSync(resolve(repoRoot, "assets/canvas-bridge.js"), "utf8");
const codecSrc = readFileSync(resolve(repoRoot, "assets/canvas-code-codec.js"), "utf8");

let passed = 0;
function ok(label) {
  console.log("  ✓ " + label);
  passed++;
}
/** Flush microtasks (the popup renders from ensureCodec().then(...)). */
const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));

/** Fresh DOM with the codec preloaded + a save/resume stub at `percent`. */
function makeDom({ search = "", percent = 100, name = "Alex K", section = "Period 3" } = {}) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "https://eduwonderlab.com/ratio-color-mixer/" + (search || ""),
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  const w = dom.window;
  // Save/resume stub — the bridge reads identity + progress from here.
  w.NeftSaveResume = {
    getTeacherSummary: () => ({ studentName: name, section, percentComplete: percent }),
  };
  // Load the real codec into this window so codes are genuinely encodable.
  w.eval(codecSrc);
  return dom;
}

/* ---- 1. completion shows a popup with a decodable code ---- */
{
  const dom = makeDom({ percent: 100 });
  const w = dom.window;
  w.eval(bridgeSrc);
  assert.ok(w.NeftCanvasBridge && w.NeftCanvasBridge.__loaded, "bridge attached to window");
  w.NeftCanvasBridge.complete(92);
  await tick();

  const card = w.document.getElementById("nt-canvas-bridge-code");
  assert.ok(card, "completion popup rendered");
  const code = card.querySelector("#nt-cb-input").value;
  const decoded = w.NeftCanvasCodec.decode(code);
  assert.equal(decoded.ok, true, "code decodes/verifies via the shared codec");
  assert.equal(decoded.payload.a, "ratio-color-mixer", "activityId taken from the URL slug");
  assert.equal(decoded.payload.n, "Alex K", "student name carried from save/resume");
  assert.equal(decoded.payload.pc, 92, "percent carried into the code");
  ok("completion popup shows a canvas-grades-decodable code (name + activity + percent)");
}

/* ---- 2. idempotent: a second complete() does not stack popups ---- */
{
  const dom = makeDom();
  const w = dom.window;
  w.eval(bridgeSrc);
  w.NeftCanvasBridge.complete(100);
  w.NeftCanvasBridge.complete(100);
  await tick();
  const cards = w.document.querySelectorAll("#nt-canvas-bridge-code");
  assert.equal(cards.length, 1, "only one popup after repeated complete()");
  ok("complete() is idempotent (no duplicate popups)");
}

/* ---- 3. SCORM launch stays silent (the SCO relays the score instead) ---- */
{
  const dom = makeDom({ search: "?lms=scorm" });
  const w = dom.window;
  w.eval(bridgeSrc);
  assert.equal(w.NeftCanvasBridge.isScormLaunch(), true, "detects SCORM launch");
  w.NeftCanvasBridge.complete(100);
  await tick();
  assert.equal(
    w.document.getElementById("nt-canvas-bridge-code"),
    null,
    "no popup inside a SCORM launch",
  );
  ok("SCORM launch suppresses the popup (score goes to the SCO)");
}

/* ---- 4. explicit identity override (activity passes its own name field) ---- */
{
  const dom = makeDom({ name: "", section: "" }); // save/resume has no identity
  const w = dom.window;
  w.eval(bridgeSrc);
  w.NeftCanvasBridge.complete(80, { studentName: "Jordan P", classPeriod: "Block 2" });
  await tick();
  const code = w.document
    .getElementById("nt-canvas-bridge-code")
    .querySelector("#nt-cb-input").value;
  const decoded = w.NeftCanvasCodec.decode(code);
  assert.equal(decoded.payload.n, "Jordan P", "name override carried into the code");
  assert.equal(decoded.payload.p, "Block 2", "class period override carried into the code");
  ok("complete() accepts explicit identity (works without save/resume wiring)");
}

/* ---- 5. auto-watch fires once when progress reaches the threshold ---- */
await new Promise((done) => {
  const dom = makeDom({ percent: 100 });
  const w = dom.window;
  w.eval(bridgeSrc);
  // The watcher polls every 1500ms; give it a beat, then assert it fired.
  setTimeout(() => {
    const card = w.document.getElementById("nt-canvas-bridge-code");
    assert.ok(card, "auto-watch rendered the popup at threshold without an explicit call");
    ok("auto-watch auto-completes when save/resume progress hits the threshold");
    done();
  }, 1800);
});

console.log(`\n✅ canvas-bridge behavior: ${passed}/5 checks passed`);
