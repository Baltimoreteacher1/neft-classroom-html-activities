#!/usr/bin/env node
/**
 * scorm-runtime.test.mjs — the SCORM Runtime v2 shell, end to end, against a
 * mock Canvas.
 *
 * The companion to scorm-lifecycle.test.mjs, which proves the SCORM 1.2 DATA
 * contract (call order, cmi values, resume). This file proves the RUNTIME
 * contract: what a student sees while the lesson loads, what happens when it
 * does not, what happens when Canvas's API arrives after the lesson has already
 * finished, and what the shell refuses to accept from a frame it does not trust.
 *
 * Every scenario here is one of the failure modes that made a Canvas SCORM
 * assignment "just not work" with nothing actionable to report:
 *   - a blank white iframe while a lesson loaded, so a student assumed it broke;
 *   - a lesson that scored before Canvas was ready, so the grade went nowhere;
 *   - Cloudflare Access intercepting the student origin, which presented
 *     identically to a network outage;
 *   - a transient failure that would have recovered on a retry nobody made;
 *   - a lesson with no bridge treated as broken and replaced with an error card,
 *     when it had rendered perfectly.
 *
 * It runs the SHIPPED SCO — the same bytes /api/scorm serves — inside jsdom
 * with ?ewlfast=1, which compresses the runtime's own timeouts so real timer
 * paths execute in about a second. Nothing here re-implements the runtime.
 */
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { buildScormFiles, ERROR_CODES } from "../../functions/_lib/scorm.js";
import { createMockLms } from "./mock-lms.mjs";

const LESSON_ORIGIN = "https://eduwonderlab.com";
const EVIL_ORIGIN = "https://evil.example.com";

let passed = 0;
const failures = [];
async function check(name, fn) {
  try {
    await fn();
    passed++;
  } catch (e) {
    failures.push(`${name}: ${e.message}`);
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Boot the real SCO in a mock Canvas.
 *
 * @param {object} opts
 * @param {object|null} opts.lms        mock LMS to expose as window.API, or null
 * @param {number} opts.lmsDelayMs      expose the API only after this delay,
 *                                      modelling Canvas initializing late
 * @param {boolean} opts.iframeLoads    whether the iframe fires `load`
 * @param {(url:string)=>object} opts.fetchImpl  stands in for the network so the
 *                                      Cloudflare Access classifier is testable
 */
function launch({
  lms = createMockLms(),
  lmsDelayMs = 0,
  iframeLoads = true,
  fetchImpl = null,
  target = "1-3",
} = {}) {
  const pkg = buildScormFiles({ target, title: "Runtime Probe" });
  const dom = new JSDOM(pkg.files["index.html"], {
    runScripts: "dangerously",
    // ?ewlfast=1 → the shell's own 12s/20s/2s/6s waits become 120/200/20/60ms.
    url: "https://lms.example.edu/scorm/1/index.html?ewlfast=1",
    beforeParse(win) {
      if (lms && lmsDelayMs === 0) {
        Object.defineProperty(win, "API", { value: lms.API, configurable: true });
      } else if (lms) {
        setTimeout(() => {
          Object.defineProperty(win, "API", { value: lms.API, configurable: true });
        }, lmsDelayMs);
      }
      win.fetch =
        fetchImpl ||
        (() => Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) }));
      // jsdom does not fetch iframe src, so the load event is ours to model —
      // which is the point: "did the lesson render?" is the discriminator the
      // shell uses, and both answers need testing.
      // Patched on the PROTOTYPE, because beforeParse runs before any element
      // exists and the shell sets iframe.src during parse.
      const proto = win.HTMLIFrameElement.prototype;
      const srcs = new WeakMap();
      Object.defineProperty(proto, "src", {
        configurable: true,
        get() {
          return srcs.get(this) || "";
        },
        set(v) {
          srcs.set(this, v);
          if (iframeLoads) setTimeout(() => this.dispatchEvent(new win.Event("load")), 1);
        },
      });
    },
  });

  const win = dom.window;
  const doc = win.document;
  const send = (msg, origin = LESSON_ORIGIN) =>
    win.dispatchEvent(new win.MessageEvent("message", { data: msg, origin }));

  return {
    win,
    doc,
    lms,
    send,
    diag: () => win.EduWonderLabScorm(),
    ready: (protocol = 2) => send({ source: "neft-lesson", type: "ready", protocol }),
    score: (percent) => send({ source: "neft-lesson", type: "score", percent, protocol: 2 }),
    loadingVisible: () => !doc.getElementById("ewl-loading").hidden,
    failureVisible: () => !doc.getElementById("ewl-failed").hidden,
    code: () => doc.getElementById("ewl-code").textContent,
    close: () => dom.window.close(),
  };
}

// --- 1. normal launch --------------------------------------------------------
await check("normal launch: loading shows first, then the lesson, then a grade", async () => {
  const sco = launch();
  assert.ok(sco.loadingVisible(), "the student saw a blank frame instead of a loading state");
  assert.equal(
    sco.doc.getElementById("lesson").getAttribute("data-state"),
    "pending",
    "the lesson frame was revealed before it was ready",
  );
  sco.ready();
  assert.ok(!sco.loadingVisible(), "the loading state never cleared after the handshake");
  assert.equal(sco.doc.getElementById("lesson").getAttribute("data-state"), "ready");
  assert.equal(sco.diag().state, "ready");
  assert.equal(sco.diag().lessonProtocol, 2, "the lesson protocol version was not recorded");
  sco.score(84);
  assert.equal(sco.lms.valueOf("cmi.core.score.raw"), "84");
  assert.equal(sco.lms.valueOf("cmi.core.lesson_status"), "passed");
  sco.close();
});

// --- 2. slow LMS: queue, then flush -----------------------------------------
await check("slow LMS: a score reported before Canvas is ready is queued, not lost", async () => {
  const lms = createMockLms();
  const sco = launch({ lms, lmsDelayMs: 60 });
  sco.ready();
  sco.score(91);
  // Canvas is not there yet, so nothing can have been written.
  assert.equal(lms.opsFor("LMSInitialize").length, 0, "initialized against an absent API");
  assert.equal(lms.valueOf("cmi.core.score.raw"), "", "wrote a grade with no LMS present");
  assert.ok(sco.diag().queued > 0, "the score was dropped instead of queued");
  await sleep(400); // API appears; the discovery backoff finds it and flushes
  assert.equal(lms.opsFor("LMSInitialize").length, 1, "did not initialize once the API appeared");
  assert.equal(lms.valueOf("cmi.core.score.raw"), "91", "the queued grade never reached Canvas");
  assert.equal(lms.valueOf("cmi.core.lesson_status"), "passed");
  assert.equal(sco.diag().queued, 0, "the queue was not drained");
  sco.close();
});

// --- 3. slow lesson ---------------------------------------------------------
await check("slow lesson: loading stays visible until the lesson is truly ready", async () => {
  const sco = launch();
  await sleep(80); // past the "still loading" hint, short of the handshake bound
  assert.ok(sco.loadingVisible(), "the loading state cleared before the lesson said it was ready");
  assert.ok(
    !sco.doc.getElementById("ewl-loading-more").hidden,
    "the secondary 'still loading' line never appeared",
  );
  assert.ok(!sco.failureVisible(), "showed a failure while the lesson was still loading");
  sco.ready();
  assert.ok(!sco.loadingVisible());
  sco.close();
});

// --- 4. a lesson that renders but never speaks -------------------------------
await check("rendered-but-silent lesson is shown, never replaced with an error", async () => {
  // A standalone activity without the canvas bridge is WORKING. Treating a
  // missing handshake as a failure would put an error card over a perfectly
  // good lesson — the single worst thing this shell could do.
  const sco = launch({ iframeLoads: true });
  await sleep(300);
  assert.ok(!sco.failureVisible(), "a rendered lesson was replaced with a failure card");
  assert.ok(!sco.loadingVisible(), "the loading state never cleared over a rendered lesson");
  assert.equal(sco.diag().state, "ready");
  sco.close();
});

// --- 5. transient failure recovers on retry ----------------------------------
await check("transient failure: the shell retries and succeeds without the student acting", () => {
  const sco = launch({ iframeLoads: false });
  return sleep(320).then(() => {
    assert.ok(sco.diag().attempts > 1, `no retry was attempted (attempts=${sco.diag().attempts})`);
    sco.ready(); // the retry got through
    assert.ok(!sco.failureVisible(), "showed a failure after a retry succeeded");
    assert.equal(sco.diag().state, "ready");
    sco.close();
  });
});

// --- 6. permanent failure ----------------------------------------------------
await check("permanent failure: bounded retries, then a student recovery state", async () => {
  const sco = launch({ iframeLoads: false });
  await sleep(1200);
  assert.ok(sco.failureVisible(), "never reached the recovery state");
  assert.ok(sco.diag().attempts <= 3, `retries were not bounded (${sco.diag().attempts})`);
  const card = sco.doc.getElementById("ewl-failed").textContent;
  assert.match(card, /We couldn't load your lesson/, "no plain-language failure message");
  // The reference code is the one deliberate exception: it is opaque to a
  // student and is the only thing that lets a teacher say WHICH failure this
  // was. Everything else on the card must be plain language.
  const prose = card.replace(sco.code(), "");
  assert.doesNotMatch(prose, /SCORM|LMS|iframe|HTTP|undefined|\{|Error/, "leaked developer detail");
  assert.match(sco.code(), /^Reference: EWL-SCORM-[A-Z]+$/, "the reference code is not opaque");
  const retry = sco.doc.getElementById("ewl-retry");
  assert.ok(retry, "no Try Again control");
  assert.ok(retry.textContent.trim().length > 0, "the retry button has no accessible name");
  assert.equal(sco.doc.getElementById("ewl-failed").getAttribute("role"), "alert");
  sco.close();
});

// --- 7. Cloudflare Access is classified distinctly ---------------------------
await check("Cloudflare Access is diagnosed as ACCESS, not as a generic outage", async () => {
  // The probe is blocked (as Access does), but the host itself answers — which
  // is exactly the signature of an interstitial in front of a healthy origin.
  const sco = launch({
    iframeLoads: false,
    fetchImpl: (url, opts) =>
      String(url).includes("/api/scorm-probe")
        ? Promise.reject(new Error("Failed to fetch"))
        : Promise.resolve({
            type: opts && opts.redirect === "manual" ? "opaqueredirect" : "opaque",
          }),
  });
  await sleep(1400);
  assert.ok(sco.failureVisible(), "never reached the recovery state");
  assert.equal(sco.diag().errorCode, ERROR_CODES.ACCESS, "Access was not distinguished");
  assert.match(sco.code(), /EWL-SCORM-ACCESS/, "the reference code was not shown");
  sco.close();
});

await check("an unreachable origin is LOAD, and a healthy one is TIMEOUT", async () => {
  const dead = launch({
    iframeLoads: false,
    fetchImpl: () => Promise.reject(new Error("offline")),
  });
  await sleep(1400);
  assert.equal(dead.diag().errorCode, ERROR_CODES.LOAD, "an offline origin was misdiagnosed");
  dead.close();

  const healthy = launch({ iframeLoads: false });
  await sleep(1400);
  assert.equal(
    healthy.diag().errorCode,
    ERROR_CODES.TIMEOUT,
    "a healthy origin whose lesson never rendered was misdiagnosed",
  );
  healthy.close();
});

// --- 8. the optional progress API is not load-bearing ------------------------
await check("a failing progress API does not take the lesson down", async () => {
  // /api/progress is the lesson's own concern and is not on this shell's path
  // at all. What must be true is that a rejected fetch anywhere cannot move the
  // shell out of the ready state once the lesson is up.
  const sco = launch({ fetchImpl: () => Promise.reject(new Error("progress API down")) });
  sco.ready();
  sco.score(55);
  await sleep(300);
  assert.equal(sco.diag().state, "ready", "a failed background fetch tore down a live lesson");
  assert.ok(!sco.failureVisible());
  assert.equal(sco.lms.valueOf("cmi.core.score.raw"), "55", "LMS reporting stopped too");
  sco.close();
});

// --- 9. resume ---------------------------------------------------------------
await check("resume: a partial attempt is restored on reopen, and completion survives", () => {
  const first = createMockLms();
  const a = launch({ lms: first });
  a.ready();
  a.send({
    source: "neft-lesson",
    type: "state",
    protocol: 2,
    state: '{"fields":{"q1":"12"}}',
    location: "guided-practice-3",
  });
  a.win.document.dispatchEvent(new a.win.Event("visibilitychange"));
  Object.defineProperty(a.win.document, "visibilityState", { value: "hidden", configurable: true });
  a.win.document.dispatchEvent(new a.win.Event("visibilitychange"));
  assert.equal(
    first.valueOf("cmi.suspend_data"),
    '{"fields":{"q1":"12"}}',
    "state never persisted",
  );
  assert.equal(first.valueOf("cmi.core.lesson_location"), "guided-practice-3");
  a.close();

  // Reopening: the SCO must hand the stored state back, and must NOT stamp
  // "incomplete" over a status the LMS already holds.
  const second = createMockLms({ data: { ...first.data } });
  const b = launch({ lms: second });
  const frame = b.doc.getElementById("lesson");
  const seen = [];
  Object.defineProperty(frame, "contentWindow", {
    value: { postMessage: (m) => seen.push(m) },
    configurable: true,
  });
  b.ready();
  const restore = seen.find((m) => m.type === "restore");
  assert.ok(restore, "nothing was restored on reopen");
  assert.equal(restore.state, '{"fields":{"q1":"12"}}');
  assert.equal(restore.location, "guided-practice-3");
  b.close();
});

await check("reopening a passed assignment does not reset the grade", () => {
  const lms = createMockLms({
    data: { "cmi.core.lesson_status": "passed", "cmi.core.score.raw": "100" },
  });
  const sco = launch({ lms });
  sco.ready();
  sco.score(40); // a review pass that answers one question
  assert.equal(lms.valueOf("cmi.core.score.raw"), "100", "a review overwrote a completed grade");
  assert.equal(lms.valueOf("cmi.core.lesson_status"), "passed", "passed was downgraded");
  sco.close();
});

// --- 10. duplicate completion ------------------------------------------------
await check("a repeated completion does not spam or corrupt the LMS record", () => {
  const lms = createMockLms();
  const sco = launch({ lms });
  sco.ready();
  sco.score(88);
  const afterFirst = lms.opsFor("LMSSetValue").length;
  sco.score(88);
  sco.score(88);
  sco.score(88);
  assert.equal(
    lms.opsFor("LMSSetValue").length,
    afterFirst,
    "an unchanged repeated completion wrote to the LMS again",
  );
  assert.equal(lms.valueOf("cmi.core.score.raw"), "88");
  sco.close();
});

// --- 11. hostile / malformed messages ---------------------------------------
await check("a message from the wrong origin cannot touch the gradebook", () => {
  const lms = createMockLms();
  const sco = launch({ lms });
  sco.ready();
  sco.send({ source: "neft-lesson", type: "score", percent: 100, protocol: 2 }, EVIL_ORIGIN);
  assert.equal(lms.valueOf("cmi.core.score.raw"), "", "a foreign origin wrote a grade");
  sco.send({ source: "neft-lesson", type: "ready", protocol: 2 }, EVIL_ORIGIN);
  sco.close();
});

await check("malformed and unknown messages are ignored safely", () => {
  const lms = createMockLms();
  const sco = launch({ lms });
  sco.ready();
  const before = lms.opsFor("LMSSetValue").length;
  for (const bad of [
    null,
    "a string",
    42,
    { source: "somebody-else", type: "score", percent: 100 },
    { source: "neft-lesson", type: "LMSSetValue", key: "cmi.core.score.raw", value: "100" },
    { source: "neft-lesson", type: "score" },
    { source: "neft-lesson", type: "score", percent: "100" },
    { source: "neft-lesson", type: "score", percent: Number.NaN },
    { source: "neft-lesson", type: "score", percent: Number.POSITIVE_INFINITY },
    { source: "neft-lesson", type: "state", state: { not: "a string" } },
  ]) {
    sco.send(bad);
  }
  assert.equal(lms.opsFor("LMSSetValue").length, before, "a malformed message reached the LMS");
  assert.equal(sco.diag().state, "ready", "a malformed message destabilized the runtime");
  sco.close();
});

await check("an out-of-range height is refused and an in-range one is recorded", () => {
  const sco = launch();
  sco.ready();
  for (const px of [0, -1, 12, 199, 20001, 1e9, "tall", null]) {
    sco.send({ source: "neft-lesson", type: "height", protocol: 2, px });
  }
  assert.equal(sco.diag().height, 0, "an out-of-bounds height was accepted");
  sco.send({ source: "neft-lesson", type: "height", protocol: 2, px: 1400 });
  assert.equal(sco.diag().height, 1400, "a valid height was not recorded");
  sco.close();
});

// --- 12. protocol compatibility ---------------------------------------------
await check("a protocol-1 lesson still works, and a future protocol is not dropped", () => {
  // A lesson that predates Runtime v2 sends no `protocol` field at all. It must
  // be fully supported: this is what makes live-side and wrapper-side upgrades
  // independent of each other.
  const v1 = createMockLms();
  const a = launch({ lms: v1 });
  a.send({ source: "neft-lesson", type: "ready" });
  assert.equal(a.diag().state, "ready", "a protocol-1 handshake was ignored");
  a.send({ source: "neft-lesson", type: "score", percent: 77 });
  assert.equal(v1.valueOf("cmi.core.score.raw"), "77", "a protocol-1 score was dropped");
  assert.equal(a.diag().lessonProtocol, 1);
  a.close();

  // A lesson claiming a protocol this shell has never heard of is handled on
  // the subset it does understand, never rejected wholesale — otherwise a live
  // improvement would break every already-uploaded package.
  const vN = createMockLms();
  const b = launch({ lms: vN });
  b.send({ source: "neft-lesson", type: "ready", protocol: 99 });
  b.send({ source: "neft-lesson", type: "score", percent: 65, protocol: 99 });
  assert.equal(b.diag().state, "ready", "a future-protocol handshake was rejected");
  assert.equal(vN.valueOf("cmi.core.score.raw"), "65", "a future-protocol score was dropped");
  assert.equal(b.diag().lessonProtocol, 99, "the lesson protocol was not recorded for diagnosis");
  b.close();
});

// --- 13. no LMS at all -------------------------------------------------------
await check("launched outside an LMS, the lesson still runs", async () => {
  const sco = launch({ lms: null });
  sco.ready();
  sco.score(70);
  await sleep(50);
  assert.equal(sco.diag().state, "ready", "no LMS was treated as a failure");
  assert.equal(sco.diag().apiFound, false);
  assert.ok(!sco.failureVisible(), "showed a student a failure for a supported launch mode");
  sco.close();
});

// --- 14. accessibility of the shell -----------------------------------------
await check("the shell's own states are announced and keyboard-safe", () => {
  const sco = launch();
  const loading = sco.doc.getElementById("ewl-loading");
  assert.equal(loading.getAttribute("role"), "status");
  assert.equal(loading.getAttribute("aria-live"), "polite");
  assert.equal(sco.doc.getElementById("ewl-failed").getAttribute("role"), "alert");
  const retry = sco.doc.getElementById("ewl-retry");
  assert.equal(retry.tagName, "BUTTON", "the retry control is not natively focusable");
  assert.equal(retry.getAttribute("type"), "button");
  assert.equal(
    sco.doc.getElementById("lesson").getAttribute("title"),
    "Runtime Probe",
    "the lesson frame has no accessible name",
  );
  assert.equal(sco.doc.documentElement.getAttribute("lang"), "en");
  const css = sco.doc.querySelector("style").textContent;
  assert.match(css, /prefers-reduced-motion/, "the spinner ignores reduced-motion");
  assert.match(css, /focus-visible/, "the retry control has no visible focus style");
  sco.close();
});

// --- 15. the student's Try Again actually retries ----------------------------
await check("Try Again relaunches the lesson", async () => {
  const sco = launch({ iframeLoads: false });
  await sleep(1200);
  assert.ok(sco.failureVisible());
  const before = sco.diag().attempts;
  sco.doc.getElementById("ewl-retry").dispatchEvent(new sco.win.Event("click"));
  assert.ok(sco.loadingVisible(), "Try Again did not return to the loading state");
  assert.equal(
    sco.diag().attempts,
    1,
    `Try Again did not reset the attempt budget (was ${before})`,
  );
  sco.ready();
  assert.equal(sco.diag().state, "ready", "Try Again could not recover");
  sco.close();
});

console.log("SCORM Runtime v2 scenarios (real SCO vs mock Canvas, jsdom)");
console.log(`  scenarios passed: ${passed}`);
if (failures.length) {
  console.log(`\nFAIL — ${failures.length} problem(s):`);
  for (const f of failures) console.log("  ✗ " + f);
  process.exit(1);
}
console.log("RESULT: PASS ✅");
