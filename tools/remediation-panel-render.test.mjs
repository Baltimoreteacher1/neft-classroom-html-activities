// What the student actually SEES after a miss.
//
// The routing decisions are pinned by engine/core/diagnosis-routing.test.mjs;
// this pins the rendering, because the two can disagree. A controller can
// correctly select the "diagnosis" rung and the panel can still fall through its
// switch and render nothing — which is exactly the failure mode a logic-only
// test cannot see, and which a student would experience as a wrong answer that
// silently swallowed their retry.
//
// It also pins the guided rung's shape. That rung used to be four "Reveal this
// step" buttons: the only part of the ladder that asked nothing of the student,
// where clicking four times and reading four sentences counted as having worked
// through the problem. The model answer must now come AFTER a real attempt.
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body><div id='host'></div></body></html>", {
  pretendToBeVisual: true,
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Event = dom.window.Event;
globalThis.requestAnimationFrame = (cb) => dom.window.setTimeout(cb, 0);

const { renderRemediation } = await import("../engine/components/remediation-panel.js");

const ITEM = {
  type: "multiple-choice",
  stem: "A recipe uses 3 cups of flour for every 5 cups of water. What is the ratio of flour to water?",
  choices: ["5:3", "3:5", "8:5", "3:8"],
  correctIndex: 1,
  explanation: "Flour is named first. Write the quantities in the order the question names them.",
};

function mount(opts = {}) {
  const host = document.createElement("div");
  document.body.append(host);
  const api = renderRemediation(host, { question: ITEM, ...opts });
  return { host, api };
}

const textOf = (el) => (el ? el.textContent.trim() : "");

// ── The diagnosed opening rung renders ──
{
  const { host } = mount({ misconception: "ratio-inverted" });
  const label = host.querySelector(".remediation-diagnosis-label");
  assert.ok(label, "a diagnosed miss must render the named-error label");
  assert.ok(textOf(label).length > 0, "the label must not be blank");

  const heading = textOf(host.querySelector("h4"));
  assert.ok(
    /thinking/i.test(heading),
    `diagnosed heading should be about thinking, got "${heading}"`,
  );

  const body = host.textContent;
  assert.ok(/ratio is flipped/i.test(body), "the authored student-voice text must be on screen");
  assert.ok(!body.includes("3:5"), "the diagnosis must not hand over the correct answer");

  // It is never a dead end: the retry control is present.
  const retry = host.querySelector(".btn-primary");
  assert.ok(retry, "the diagnosed rung must offer a retry");
  assert.ok(/try again/i.test(textOf(retry)));
}

// ── An undiagnosed miss still renders the generic hint rung, unchanged ──
{
  const { host } = mount();
  assert.equal(
    host.querySelector(".remediation-diagnosis-label"),
    null,
    "no tag means no diagnosis label",
  );
  const heading = textOf(host.querySelector("h4"));
  assert.ok(/hint/i.test(heading), `generic heading should be a hint, got "${heading}"`);
  assert.ok(host.querySelector(".btn-primary"), "the generic rung must offer a retry too");
}

// ── An unresolvable tag renders the generic rung, not an empty card ──
{
  const { host } = mount({ misconception: "not-a-real-tag" });
  assert.equal(host.querySelector(".remediation-diagnosis-label"), null);
  assert.ok(/hint/i.test(textOf(host.querySelector("h4"))));
  assert.ok(host.textContent.trim().length > 20, "the card must never render empty");
}

// ── The guided rung asks before it tells ──
//
// renderRemediation() drives the first step itself at mount time (the wrong
// answer IS the first signal), so the controller is already showing the opening
// rung here — one more miss escalates to guided.
{
  const { host, api } = mount({ misconception: "ratio-inverted" });
  const guided = api.controller.nextStep({ correct: false });
  assert.equal(guided.kind, "guided", "the diagnosed ladder's second rung is the guided one");
  assert.ok(Array.isArray(guided.payload.prompts) && guided.payload.prompts.length > 0);
  for (const p of guided.payload.prompts) {
    assert.ok(p.prompt && p.prompt.length, "each guided step asks the student something");
    assert.ok(
      p.answer && p.answer.length,
      "each guided step has a model answer to compare against",
    );
  }
  assert.ok(host);
}

// Rendered, by clicking the way a student does: retry, miss again, and land on a
// guided rung that gives you somewhere to write before it shows you anything.
{
  const click = (el) => el.dispatchEvent(new dom.window.Event("click", { bubbles: true }));
  const { host } = mount({ misconception: "ratio-inverted" });

  click(host.querySelector(".btn-primary")); // "I see it — try again"
  const radios = [...host.querySelectorAll("input[type=radio]")];
  assert.ok(radios.length, "the retry re-mounts the original question");
  radios[0].checked = true; // a wrong choice — correctIndex is 1
  radios[0].dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  const submit = [...host.querySelectorAll("button")].find((b) =>
    /check|submit/i.test(b.textContent),
  );
  assert.ok(submit, "the retry offers a submit control");
  click(submit);
  // The multiple-choice component holds its feedback on screen briefly before
  // reporting the result, so the escalation is asynchronous by design.
  await new Promise((r) => setTimeout(r, 2500));

  const input = host.querySelector(".remediation-guided-input");
  assert.ok(input, "the guided rung must give the student somewhere to write");
  assert.ok(
    !/Reveal this step/i.test(host.textContent),
    "the reveal-only shortcut is gone — the model answer is earned, not clicked",
  );

  const checkBtn = [...host.querySelectorAll("button")].find((b) =>
    /Check my thinking/i.test(b.textContent),
  );
  assert.ok(checkBtn, "the guided rung offers a check control");
  assert.equal(checkBtn.disabled, true, "the model stays hidden until something is written");

  // The model answer appears only after a real attempt, and the attempt stays on
  // screen next to it so the student can actually compare the two.
  input.value = "Find the ratio of flour to water in the order the question names them";
  input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  assert.equal(checkBtn.disabled, false, "writing something enables the check");
  click(checkBtn);

  assert.ok(host.querySelector("[role=status]"), "the model answer is announced when revealed");
  assert.equal(input.readOnly, true, "the student's own words are preserved beside the model");
  const rate = [...host.querySelectorAll("button")].map((b) => b.textContent);
  assert.ok(
    rate.some((t) => /matches mine/i.test(t)) && rate.some((t) => /was different/i.test(t)),
    "the student judges the match themselves rather than just clicking Continue",
  );
}

console.log(
  "PASS remediation-panel-render: diagnosed, generic, and guided rungs render as specified",
);
