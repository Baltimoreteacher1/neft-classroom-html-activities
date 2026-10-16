#!/usr/bin/env node
/* =============================================================================
 * step-solver.test.mjs
 * -----------------------------------------------------------------------------
 * Drives the real Step Lab in a real DOM. step-diagnosis.test.mjs proves the
 * diagnosis; this proves the WIRING, because a diagnosis that never reaches the
 * student or the teacher is indistinguishable, from outside, from one that does.
 *
 *   - a wrong line the engine can name shows the "Looks like" chip (EN+ES) and
 *     one Socratic question, and keeps the existing "Not quite" guidance;
 *   - it never prints the correct line or answer;
 *   - the misconception reaches the lesson state, NTSignal and the telemetry the
 *     heatmap reads — once per distinct wrong line, tag only, no typed text;
 *   - an ambiguous or unexplained line stays silent (no chip, no records);
 *   - everything the component did before is unchanged.
 * ========================================================================== */

import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><body></body>", {
  url: "https://eduwonderlab.com/",
  pretendToBeVisual: true,
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);

const { renderStepSolver } = await import("./step-solver.js");

/** Mount a solver with spies on every sink a diagnosis is supposed to reach. */
function mount(cfg, { withState = true } = {}) {
  const calls = { state: [], signal: [], telemetry: [] };
  window.__ntLessonMeta = { standard: "6.AT.8", lesson: "8-2" };
  window.NTSignal = { record: (r) => calls.signal.push(r) };
  window.NTtelemetry = { track: (name, props) => calls.telemetry.push([name, props]) };
  const host = document.createElement("div");
  document.body.append(host);
  const ctx = withState ? { state: { recordMisconception: (t) => calls.state.push(t) } } : {};
  const handle = renderStepSolver(host, cfg, ctx);
  const root = host.querySelector(".stepslv");
  const type = (text) => {
    const input = root.querySelector('[data-el="inp"]');
    input.value = text;
    root.querySelector('[data-el="check"]').click();
  };
  const feed = () => root.querySelector('[data-el="feed"]');
  const lineCount = () => root.querySelectorAll(".stepslv-line").length;
  return { root, type, feed, lineCount, calls, handle };
}

test("a nameable wrong line shows the chip in EN and ES plus one question", () => {
  const s = mount({ mode: "expression", start: "3(x + 4)" });
  s.type("3x + 4");
  const feed = s.feed();
  const chip = feed.querySelector(".stepslv-diagnosis");
  assert.ok(chip, "no diagnosis chip rendered");
  assert.match(chip.querySelector(".i18n-en").textContent, /^Looks like: Distributed to the first term only$/);
  assert.match(chip.querySelector(".i18n-es").textContent, /^Parece que: Distribuyó solo al primer término$/);
  const nudge = feed.querySelector(".stepslv-nudge");
  assert.ok(nudge, "no Socratic question rendered");
  assert.match(nudge.querySelector(".i18n-en").textContent, /\?/);
  assert.match(nudge.querySelector(".i18n-es").textContent, /¿.*\?/);
  // The existing guidance is still there, and the bad line was not accepted.
  assert.match(feed.textContent, /Not quite/);
  assert.equal(s.lineCount(), 1);
});

test("the diagnosis never prints the correct line or the answer", () => {
  const cases = [
    [{ mode: "expression", start: "3(x + 4)" }, "3x + 4", ["3x + 12", "12"]],
    [{ mode: "equation", start: "x + 7 = 15" }, "x = 22", ["8", "x = 8"]],
    [{ mode: "expression", start: "2 + 3 × 4" }, "20", ["14"]],
  ];
  for (const [cfg, typed, forbidden] of cases) {
    const s = mount(cfg);
    s.type(typed);
    const text = s.feed().textContent;
    assert.ok(s.feed().querySelector(".stepslv-diagnosis"), `${cfg.start} -> ${typed} not diagnosed`);
    for (const f of forbidden) assert.ok(!text.includes(f), `feed leaked "${f}": ${text}`);
  }
});

test("a diagnosed step reaches lesson state, NTSignal and telemetry, once per distinct line", () => {
  const s = mount({ mode: "equation", start: "x + 7 = 15" });
  s.type("x = 22");
  s.type("x = 22"); // same wrong line again: same evidence, not twice the evidence
  assert.deepEqual(s.calls.state, ["equation-not-inverse-operation"]);
  assert.deepEqual(s.calls.telemetry, [
    ["misconception", { tag: "equation-not-inverse-operation", standard: "6.AT.8" }],
  ]);
  assert.equal(s.calls.signal.length, 1);
  assert.equal(s.calls.signal[0].misconceptionTag, "equation-not-inverse-operation");
  assert.equal(s.calls.signal[0].lesson, "8-2");
  assert.ok(!("standard" in s.calls.signal[0]), "a step miss must not log a standard attempt");
  s.type("x = 15"); // a different wrong line, a different tag
  assert.deepEqual(s.calls.state, [
    "equation-not-inverse-operation",
    "equation-answered-with-given-number",
  ]);
  assert.equal(s.calls.telemetry.length, 2);
});

test("nothing the student typed is written to any sink", () => {
  const s = mount({ mode: "equation", start: "x + 7 = 15" });
  s.type("x = 22");
  const everything = JSON.stringify(s.calls);
  assert.ok(!everything.includes("22"), `typed text leaked: ${everything}`);
});

test("Start over forgets what was counted", () => {
  const s = mount({ mode: "equation", start: "x + 7 = 15" });
  s.type("x = 22");
  s.root.querySelector('[data-el="reset"]').click();
  s.type("x = 22");
  assert.equal(s.calls.state.length, 2);
});

test("an unexplained wrong line keeps the old message and records nothing", () => {
  const s = mount({ mode: "expression", start: "3(x + 4)" });
  s.type("5x + 1");
  assert.match(s.feed().textContent, /isn't worth the same amount/);
  assert.equal(s.feed().querySelector(".stepslv-diagnosis"), null);
  assert.equal(s.feed().querySelector(".stepslv-nudge"), null);
  assert.deepEqual([s.calls.state, s.calls.signal, s.calls.telemetry], [[], [], []]);
});

test("an ambiguous wrong line is not labelled", () => {
  const s = mount({ mode: "equation", start: "x - 1 = 2" });
  s.type("x = 1"); // 2 − 1, or the 1 already in the equation: two causes, no claim
  assert.match(s.feed().textContent, /Not quite/);
  assert.equal(s.feed().querySelector(".stepslv-diagnosis"), null);
  assert.equal(s.calls.state.length, 0);
});

test("an equivalent line is accepted with no chip", () => {
  const s = mount({ mode: "equation", start: "3x + 6 = 18" });
  s.type("3x = 12");
  assert.match(s.feed().textContent, /Step 1 accepted/);
  assert.equal(s.feed().querySelector(".stepslv-diagnosis"), null);
  assert.equal(s.lineCount(), 2);
  s.type("x = 4");
  assert.match(s.feed().textContent, /Solved/);
  assert.equal(s.calls.state.length, 0);
});

test("without a lesson state (other mounting surfaces) the other sinks still fire", () => {
  const s = mount({ mode: "expression", start: "2 + 3 × 4" }, { withState: false });
  s.type("20");
  assert.ok(s.feed().querySelector(".stepslv-diagnosis"));
  assert.equal(s.calls.telemetry.length, 1);
  assert.equal(s.calls.signal.length, 1);
});

test("a sink that throws can never break the lesson", () => {
  const s = mount({ mode: "expression", start: "2 + 3 × 4" });
  window.NTtelemetry = {
    track() {
      throw new Error("offline");
    },
  };
  assert.doesNotThrow(() => s.type("20"));
  assert.ok(s.feed().querySelector(".stepslv-diagnosis"), "the student still sees the diagnosis");
});

test("existing parse and shape messages are unchanged", () => {
  const s = mount({ mode: "equation", start: "x + 7 = 15" });
  s.type("x $ 4");
  assert.match(s.feed().textContent, /symbol in there I can't read/);
  s.type("x + 7");
  assert.match(s.feed().textContent, /needs something on both sides/);
  s.type("");
  assert.match(s.feed().textContent, /Type a full line first/);
});

// The mounting path every lesson surface goes through. renderStepSolver is only
// handed the lesson state if mountInteractiveVisuals passes it down; a registry
// entry that drops its third argument would silently strand every diagnosis
// outside the lesson's per-tag counts while this file's direct tests stay green.
test("mountInteractiveVisuals hands the lesson state to the step solver", async () => {
  const { interactiveVisualHost, mountInteractiveVisuals } = await import(
    "../core/interactive-visual.js"
  );
  const recorded = [];
  window.__ntLessonMeta = { standard: "6.AT.8", lesson: "8-2" };
  window.NTSignal = { record() {} };
  window.NTtelemetry = { track() {} };
  const card = document.createElement("div");
  card.innerHTML = interactiveVisualHost({ kind: "step-solver", mode: "equation", start: "x + 7 = 15" }, {});
  document.body.append(card);
  mountInteractiveVisuals(card, { state: { recordMisconception: (t) => recorded.push(t) }, phaseId: 2 });
  const host = card.querySelector(".interactive-visual");
  for (let i = 0; i < 100 && !host.querySelector(".stepslv"); i++) {
    await new Promise((r) => setTimeout(r, 10));
  }
  const root = host.querySelector(".stepslv");
  assert.ok(root, "step solver never mounted");
  root.querySelector('[data-el="inp"]').value = "x = 22";
  root.querySelector('[data-el="check"]').click();
  assert.deepEqual(recorded, ["equation-not-inverse-operation"]);
});
