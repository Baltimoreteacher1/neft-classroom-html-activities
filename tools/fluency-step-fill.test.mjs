// "Your turn" steps: partial results are typed by the learner, never printed first, and every step can say why.
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><body><div id='host'></div></body>", {
  url: "https://example.test/",
});
for (const [key, value] of Object.entries({
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
}))
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });

const { stepsBlock } = await import("../math/fluency-lab/trail-pictures.js");
const { whyFor } = await import("../math/fluency-lab/step-whys.js");
const { getGrade, generateProblem, seededRandom } = await import(
  "../math/fluency-lab/problem-bank.js"
);

const steps = ["34 + 50 = 84", "84 + 6 = 90", "34 + 56 = 90"];
const host = document.querySelector("#host");
host.innerHTML = stepsBlock(steps, 1, { id: "t1", cap: 2 });
let input = host.querySelector("input.tr-fill");
assert.ok(
  host.querySelector("button[data-step]").disabled,
  "the next step waits for the typed number",
);
assert.ok(input, "a step that ends in a partial result asks the learner to type it");
assert.ok(!host.textContent.includes("84"), "the partial result is not printed before it is typed");

const type = (el, value) => {
  el.value = value;
  el.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
};
type(input, "85");
input.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
assert.ok(
  host.querySelector(".tr-fill-note").textContent.length > 0,
  "a wrong try gets a gentle nudge",
);
assert.ok(!host.textContent.includes("84"), "a wrong try still does not show the number");
type(input, "84");
assert.ok(host.textContent.includes("34 + 50 = 84"), "typing the right number opens the step");
assert.equal(host.querySelectorAll("input.tr-fill").length, 0);
assert.ok(
  !host.querySelector("button[data-step]").disabled,
  "the next step opens once the number is typed",
);

host.innerHTML = stepsBlock(steps, 2, { id: "t1", cap: 2 });
input = host.querySelector("input.tr-fill");
assert.ok(input && host.textContent.includes("84 + 6"), "the second step asks for its own number");
for (let i = 0; i < 2; i += 1) {
  type(input, "1");
  input.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
}
assert.ok(
  host.textContent.includes("84 + 6 = 90"),
  "after two wrong tries the step opens so nobody is stuck",
);

host.innerHTML = stepsBlock(steps, 3, { id: "t1" });
assert.equal(
  host.querySelectorAll("input.tr-fill").length,
  0,
  "solved steps stay solved when the list re-renders",
);
assert.ok(!/class="tr-step-text"[^>]*><input/.test(host.innerHTML));

// The last step names the answer and is never a fill-in.
host.innerHTML = stepsBlock(["8 + 2 = 10", "10 + 3 = 13"], 2, { id: "t2" });
assert.equal(host.querySelectorAll("input.tr-fill").length, 1);

// Reasons are plain sentences and exist for the common fact strategies.
assert.ok(whyFor("10 × 4 = 40", 0, ["10 × 4 = 40", "40 − 4 = 36"]));
assert.ok(whyFor("40 − 4 = 36", 1, ["10 × 4 = 40", "40 − 4 = 36"]).includes("one group fewer"));

// Across every skill the guided steps keep working: no fill-in step is the last one.
let fills = 0;
for (let grade = 1; grade <= 8; grade += 1)
  for (const skill of getGrade(grade).skills) {
    const item = generateProblem(skill, seededRandom(grade * 31 + 7));
    host.innerHTML = stepsBlock(item.steps, item.steps.length, { id: `${skill.id}` });
    assert.equal(
      host.querySelectorAll("li").length,
      item.steps.length,
      `${skill.id}: every step renders`,
    );
    fills += host.querySelectorAll("input.tr-fill").length;
  }
assert.ok(fills > 20, `fill-in steps appear across the skills (${fills})`);
console.log(
  `fluency-step-fill: typed partial results, nudges, auto-open after two misses, reasons; ${fills} fill-ins across 80 skills`,
);
