// The question card on a practice screen: an expression shows one "=", a long expression takes the shrink class so
// it cannot run past the card, and the solver and the model panel never show the same column board twice.
// Run: node tools/fluency-question-card.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const html = readFileSync(new URL("../math/fluency-lab/index.html", import.meta.url), "utf8");
const dom = new JSDOM(html, {
  url: "https://example.test/math/fluency-lab/?grade=4&skill=add-large",
  pretendToBeVisual: true,
});
const win = dom.window;
win.HTMLElement.prototype.scrollIntoView = () => {};
win.print = () => {};
for (const [key, value] of Object.entries({
  window: win,
  document: win.document,
  location: win.location,
  history: win.history,
  localStorage: win.localStorage,
  CustomEvent: win.CustomEvent,
}))
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
await import("../math/fluency-lab/app.js");
const $ = (selector) => win.document.querySelector(selector);

$("[data-start-independent]").click();
// About one problem in four is a story; move on (by answering) until a bare expression comes up.
const savedItem = () => JSON.parse(win.localStorage.getItem("ewl-fluency-session-v2")).item;
for (let tries = 0; tries < 12 && /[A-Za-z]/.test($("#question").textContent); tries += 1) {
  $("#answer-input").value = String(savedItem().answers[0]);
  $("#answer-form").dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
  $("#next-problem").click();
}
const question = $("#question");
const text = question.textContent.trim();
assert.match(text, /^[\d,]+ \+ [\d,]+ =$/, `one equals sign, got "${text}"`);
assert.equal((text.match(/=/g) || []).length, 1, "the equals sign is not doubled");
assert.ok(question.classList.contains("is-long"), "a long expression takes the shrink class");

assert.equal(
  $("#toggle-problem-visual").textContent,
  "Hide the model",
  "the model is showing, so the button offers to hide it",
);
$("#toggle-interactive-solver").click();
assert.ok($("#interactive-solver-workspace .vc"), "the solver shows the stacked columns");
assert.equal(
  $("#problem-visual-scaffold").hidden,
  true,
  "the model panel steps aside while the solver shows the same board",
);
assert.equal(
  $("#toggle-problem-visual").textContent,
  "Show the model",
  "the button label follows the panel",
);
$("#toggle-interactive-solver").click();
assert.equal(
  $("#problem-visual-scaffold").hidden,
  false,
  "the model panel returns when the solver closes",
);

console.log(
  "fluency-question-card: one equals sign, long expressions shrink, one column board at a time",
);
process.exit(0);
