import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const source = readFileSync("assets/u4-studio-whole-check.js", "utf8");
const dom = new JSDOM(
  "<!doctype html><html><head></head><body><main id='panel-4'></main></body></html>",
  {
    runScripts: "dangerously",
    url: "https://example.test/",
  },
);
const { window } = dom;
window.localStorage.setItem("u4-whole-check-seed", "2");
window.eval(source);
const d = window.document;
const cell = d.getElementById("wc-cell");
const whole = d.getElementById("wc-whole");
const test = d.getElementById("wc-test");
const feedback = d.getElementById("wc-feedback");
assert.match(d.querySelector(".wc-given").textContent, /18 students/);
cell.value = "4.5";
whole.value = "45";
test.click();
assert.match(feedback.textContent, /tape is consistent/);
assert.equal(d.querySelector(".wc-tape").dataset.whole, "45");
cell.value = "7.2";
whole.value = "72";
test.click();
assert.match(feedback.textContent, /40% of the tape is 28.8, while the known part is 18/);
assert.equal(
  d.querySelector(".wc-tape").querySelectorAll(".wc-cell")[0].textContent,
  "7.2por celda",
);
d.getElementById("wc-new").click();
assert.match(d.querySelector(".wc-given").textContent, /20 students/);
assert.equal(feedback.textContent, "");
console.log(
  "u4-whole-check: correct 18-on-4-cells model, wrong whole rescales tape, and seeded variants pass",
);
dom.window.close();
