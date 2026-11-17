/**
 * The guide coach that family.js still runs inside a real activity, without a browser: completes(), findTarget() and
 * isShown() behave, against the answer-loop steps (coach/activity-steps.js) written with tour-data.js's words.
 * Teacher Tour 2.0 itself (/start/tour) is tested by tools/access-tour2.test.mjs (engine) and
 * tools/access-tour2-e2e.mjs (browser).
 *   node --test tools/access-intro-tour.test.mjs
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";

const win = new JSDOM("<main id='app'></main>", {
  url: "https://lab.test/access-practice-lab/start/tour",
}).window;
for (const key of ["window", "document", "localStorage", "sessionStorage", "location", "history"])
  globalThis[key] = win[key];

const T = await import("../access-practice-lab/src/intro/tour-data.js");
const { completes, findTarget, isShown } = await import(
  "../access-practice-lab/src/coach/coach.js"
);
const { loopSteps, SEL } = await import("../access-practice-lab/src/coach/activity-steps.js");

test("coach: completes() matches the step's action, findTarget() takes the first shown target", () => {
  const doc = new JSDOM(
    `<body>
      <label class="choice"><input data-ans-choice type="radio"><span id="in">B</span></label>
      <button data-check hidden>Check</button>
      <button data-early-check id="early">Check</button>
      <div id="gone"></div>
    </body>`,
  ).window.document;
  // JSDOM has no layout: give the elements that "show" a box.
  const box = (el, w, h) => {
    el.getBoundingClientRect = () => ({
      width: w,
      height: h,
      top: 0,
      left: 0,
      right: w,
      bottom: h,
    });
  };
  box(doc.querySelector("[data-check]"), 0, 0);
  box(doc.getElementById("early"), 80, 44);
  box(doc.querySelector("label.choice"), 200, 48);
  const answer = loopSteps(T.TEACHER_SAY.loop).find((s) => s.id === "answer").done;
  const inner = doc.getElementById("in");
  assert.equal(
    completes(answer, { type: "click", target: inner }),
    true,
    "click inside label.choice",
  );
  assert.equal(completes(answer, { type: "change", target: inner }), false, "only the named event");
  assert.equal(completes({ click: "[data-sure]" }, { type: "click", target: inner }), false);
  assert.equal(completes(null, { type: "click", target: inner }), false);
  assert.equal(completes(answer, { type: "click", target: null }), false);
  assert.equal(completes(answer, null), false);

  assert.equal(findTarget(doc, null), null);
  assert.equal(findTarget(null, "[data-check]"), null);
  assert.equal(
    findTarget(doc, SEL.check),
    doc.getElementById("early"),
    "hidden first choice skipped",
  );
  assert.equal(findTarget(doc, "[data-retry]"), null);
  assert.equal(findTarget(doc, "#gone"), null, "an element with no box is not a target");
  assert.equal(findTarget(doc, (d) => d.querySelector("label.choice")).className, "choice");
  assert.equal(
    findTarget(doc, () => undefined),
    null,
  );

  assert.equal(isShown(doc.getElementById("early")), true);
  assert.equal(isShown(doc.querySelector("[data-check]")), false);
  const detached = doc.createElement("div");
  box(detached, 10, 10);
  assert.equal(isShown(detached), false, "a detached element is not shown");
  assert.equal(isShown(null), false);
});
