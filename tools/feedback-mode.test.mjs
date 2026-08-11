#!/usr/bin/env node
/* ==========================================================================
 * feedback-mode.test.mjs
 *
 * The invariant worth guarding here is the SCOPE one. Delayed feedback is a
 * real pedagogical setting, but pointed at the wrong surface it is a silent
 * regression: the adaptive sequence chooses the next item from the outcome of
 * the current one, so withholding that outcome would leave adaptivity running
 * on nothing while every page still rendered perfectly. The source assertion
 * below is the only thing that can catch a later edit which "helpfully" extends
 * the mode to the adaptive path.
 * ========================================================================== */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body><div id='h'></div></body></html>", {
  url: "https://eduwonderlab.com/lessons/6-13/",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;
globalThis.HTMLElement = dom.window.HTMLElement;

const { MODES, getFeedbackMode, mountFeedbackModeToggle, setFeedbackMode } = await import(
  "../engine/core/feedback-mode.js"
);

let checks = 0;

// ── Resolution order ───────────────────────────────────────────────────────
checks += 1;
assert.equal(getFeedbackMode({}), MODES.immediate, "immediate is the default");

checks += 1;
assert.equal(
  getFeedbackMode({ practice: { feedbackMode: "delayed" } }),
  MODES.delayed,
  "a lesson can author delayed as its default",
);

checks += 1;
assert.equal(
  getFeedbackMode({ practice: { feedbackMode: "nonsense" } }),
  MODES.immediate,
  "an unknown authored value falls back to immediate rather than breaking",
);

setFeedbackMode(MODES.immediate);
checks += 1;
assert.equal(
  getFeedbackMode({ practice: { feedbackMode: "delayed" } }),
  MODES.immediate,
  "the teacher's per-device setting overrides the lesson default",
);

checks += 1;
assert.equal(setFeedbackMode("sideways"), false, "an invalid mode is rejected, not stored");
checks += 1;
assert.equal(
  getFeedbackMode({}),
  MODES.immediate,
  "a rejected write leaves the previous setting intact",
);

// ── The toggle ─────────────────────────────────────────────────────────────
{
  const host = dom.window.document.getElementById("h");
  const changes = [];
  mountFeedbackModeToggle(host, {}, (m) => changes.push(m));
  const buttons = host.querySelectorAll('[role="radio"]');
  checks += 1;
  assert.equal(buttons.length, 2, "the toggle offers exactly two modes");
  checks += 1;
  assert.equal(
    buttons[0].getAttribute("aria-checked"),
    "true",
    "the active mode is announced to assistive tech",
  );

  buttons[1].dispatchEvent(new dom.window.Event("click"));
  checks += 1;
  assert.deepEqual(changes, [MODES.delayed], "picking a mode notifies the caller once");
  checks += 1;
  assert.equal(getFeedbackMode({}), MODES.delayed, "picking a mode persists it");
  checks += 1;
  assert.equal(
    buttons[1].getAttribute("aria-checked"),
    "true",
    "aria-checked follows the selection",
  );
  checks += 1;
  assert.equal(buttons[0].getAttribute("aria-checked"), "false", "the old mode is unchecked");
}

// ── Scope: the adaptive sequence must never be delayed ─────────────────────
{
  const renderer = readFileSync(
    new URL("../engine/core/lesson-renderer.js", import.meta.url),
    "utf8",
  );

  // getFeedbackMode is consulted exactly once, inside renderSkillPractice.
  const uses = renderer.match(/getFeedbackMode\(/g) || [];
  checks += 1;
  assert.equal(
    uses.length,
    1,
    "feedback mode must be consulted in exactly one place — the fixed skill-practice set",
  );

  const skillStart = renderer.indexOf("function renderSkillPractice(");
  const practiceStart = renderer.indexOf("function renderPracticePhase(");
  const useAt = renderer.indexOf("getFeedbackMode(");
  checks += 1;
  assert.ok(skillStart > 0 && practiceStart > skillStart, "both practice functions exist");
  checks += 1;
  assert.ok(
    useAt > skillStart && useAt < practiceStart,
    "getFeedbackMode is called inside renderSkillPractice, NOT in the adaptive renderPracticePhase",
  );

  const adaptiveBody = renderer.slice(practiceStart);
  checks += 1;
  assert.equal(
    /\bdelayed\b/.test(adaptiveBody.slice(0, adaptiveBody.indexOf("function renderConnectPhase"))),
    false,
    "the adaptive practice phase must not reference delayed feedback — it needs each outcome to pick the next item",
  );
}

console.log(`feedback mode: ${checks} checks passed.`);
