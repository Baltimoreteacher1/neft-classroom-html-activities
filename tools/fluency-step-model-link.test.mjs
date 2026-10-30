// The area model beside a worked example follows the active step: the split step marks the split, each partial-product
// step lights its own part, finished parts get a check, the adding step lights the total, and tapping a step moves it.
// Run: node tools/fluency-step-model-link.test.mjs
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><body></body>", {
  url: "https://example.test/",
  pretendToBeVisual: true,
});
for (const [key, value] of Object.entries({
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  MutationObserver: dom.window.MutationObserver,
  requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
}))
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });

const { sync, initStepModelLink } = await import("../math/fluency-lab/step-model-link.js");
const { stepsBlock } = await import("../math/fluency-lab/trail-pictures.js");

let checks = 0;
const ok = (condition, message) => {
  checks += 1;
  assert.ok(condition, message);
};

const STEPS = [
  "Split 39 into 30 + 9.",
  "30 × 17 = 510",
  "9 × 17 = 153",
  "Add the two parts: 510 + 153 = 663",
];
const area = `<div class="tp-live" data-live="area"><p class="tp-prompt">39 = 30 + 9.</p>
  <div class="tp-area"><span class="tp-area-side">17</span><div class="tp-area-box">
    <div class="tp-part"><b>30 × 17</b><input></div><div class="tp-part"><b>9 × 17</b><input></div></div></div>
  <p class="tp-sum">Add the parts: <input></p></div>`;

function mount(shown) {
  document.body.innerHTML = `<div class="learn-simple"><div class="tr-example">${area}</div>
    <div data-learn-steps data-total-steps="${STEPS.length}">${stepsBlock(STEPS, shown, { id: "t" })}</div></div>`;
  // Fill rows ask for typed answers; the link reads the step wording, so open rows are rendered as their expression.
  sync();
}
const parts = () =>
  [...document.querySelectorAll(".tp-part")].map((part) =>
    part.className.replace("tp-part", "").trim(),
  );
const caption = () => document.querySelector("[data-step-caption]")?.textContent;

mount(1);
ok(
  document.querySelector(".tp-area").classList.contains("link-split"),
  "the split step marks the split",
);
ok(/Step 1 of 4/.test(caption()), `caption names the step and the total: ${caption()}`);

mount(2);
ok(
  parts()[0] === "step-focus" && parts()[1] === "step-dim",
  `step 2 lights the first part: ${parts()}`,
);
ok(/30 × 17/.test(caption()), `caption names the part: ${caption()}`);
ok(!document.querySelector(".tp-area").classList.contains("link-split"), "the split mark clears");

mount(3);
ok(
  parts()[0] === "step-done" && parts()[1] === "step-focus",
  `step 3 checks the first part and lights the second: ${parts()}`,
);

mount(4);
ok(
  document.querySelector(".tp-area").classList.contains("link-sum"),
  "the adding step marks the sum",
);
ok(
  document.querySelector(".tp-sum").classList.contains("step-focus"),
  "the adding step lights the total",
);
ok(
  parts().every((state) => state === "step-done"),
  "every part is checked at the adding step",
);
ok(/Step 4 of 4/.test(caption()), "caption on the last step");

// Syncing again changes nothing and adds no second caption.
sync();
sync();
ok(
  document.querySelectorAll("[data-step-caption]").length === 1,
  "one caption, however often it syncs",
);

// Tapping an earlier step shows that step in the picture; the newest step is active again when another opens.
initStepModelLink([document.body]);
const list = document.querySelector("[data-learn-steps] .tr-steps");
list.children[1]
  .querySelector(".tr-step-text")
  .dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
await new Promise((resolve) => setTimeout(resolve, 50));
ok(parts()[0] === "step-focus", `tapping step 2 lights the first part: ${parts()}`);
ok(
  !document.querySelector(".tp-sum").classList.contains("step-focus"),
  "the total's mark clears when an earlier step is tapped",
);
ok(list.children[1].classList.contains("step-linked"), "the tapped step is marked");

// A picture the link does not know is left alone.
document.body.innerHTML = `<div class="learn-simple"><div data-live="array"><div class="tp-array">x</div></div><div data-learn-steps><ol class="tr-steps"><li><span class="tr-step-text">Count 3 rows.</span></li></ol></div></div>`;
sync();
ok(!document.querySelector("[data-step-caption]"), "other pictures are not touched");

console.log(`fluency-step-model-link: ${checks} checks passed`);
dom.window.close();
