// GCF "type the factors" lists: once every factor of a number is listed, the row closes.
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><body></body>", { url: "https://eduwonderlab.com/math/fluency-lab/" });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;
const { interactivePicture, handleModelTap } = await import("./trail-pictures.js");

document.body.innerHTML = interactivePicture({ type: "lists", a: 12, b: 18, find: "gcf" });

const input = (n) => document.querySelector(`[data-factor-of="${n}"]`);
const add = (n) => document.querySelector(`[data-add-factor="${n}"]`);
const type = (n, value) => {
  input(n).value = String(value);
  handleModelTap(add(n));
};
const chips = (n) => [...document.querySelectorAll(`[data-chips="${n}"] b`)].map((b) => b.dataset.chip);
const note = () => document.querySelector("[data-list-note]").textContent;

// Factors of 12 are 1, 2, 3, 4, 6, 12. Wrong and repeated entries never close the row.
type(12, 5);
type(12, 1);
type(12, 1);
assert.deepEqual(chips(12), ["1"]);
for (const f of [2, 3, 4, 6]) {
  type(12, f);
  assert.equal(input(12).disabled, false, `still open after ${f}`);
}
type(12, 12);
assert.deepEqual(chips(12), ["1", "2", "3", "4", "6", "12"]);
assert.equal(input(12).disabled, true, "input closes when all six factors are listed");
assert.equal(add(12).disabled, true, "Add closes when all six factors are listed");
assert.match(note(), /all 6 factors of 12/);

// The other number's row is independent and stays open.
assert.equal(input(18).disabled, false);
assert.equal(add(18).disabled, false);
for (const f of [1, 2, 3, 6, 9, 18]) type(18, f);
assert.equal(input(18).disabled, true);
assert.equal(add(18).disabled, true);

// A prime has exactly two factors.
document.body.innerHTML = interactivePicture({ type: "lists", a: 7, b: 14, find: "gcf" });
type(7, 1);
assert.equal(input(7).disabled, false);
type(7, 7);
assert.equal(input(7).disabled, true);
console.log("factor-list-complete: ok");
