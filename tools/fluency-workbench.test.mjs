// Custom numeric entry in the Math Fluency Lab workbench: the typed-problem parser, the
// range rules behind every number box, and the real UI driven in jsdom.
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { parseProblem } from "../math/fluency-lab/workbench-parse.js";
import { createWorkbenchState } from "../math/fluency-lab/workbench-state.js";

const strict = (text) => parseProblem(text, { strict: true });

// ---- parser: every example in the entry bar's own placeholder ----------------------------
assert.deepEqual(strict("15 + 8"), { tool: "counters", a: 15, b: 8 });
assert.deepEqual(strict("15 − 8"), { tool: "counters", a: 15, b: 0, takeAway: 8 });
assert.deepEqual(strict("34 - 18"), { tool: "numberline", start: 34, jump: -18 });
assert.deepEqual(strict("6 x 8"), { tool: "array", rows: 6, cols: 8 });
assert.deepEqual(strict("6 × 8 = ?"), { tool: "array", rows: 6, cols: 8 });
assert.deepEqual(strict("3/4"), { tool: "fractions", fractions: [{ n: 3, d: 4 }] });
assert.deepEqual(strict("-4 + 7"), { tool: "integers", first: -4, pos: 7, neg: 4 });
assert.deepEqual(strict("2x + 4 = 12"), { tool: "balance", coeff: 2, constant: 4, rhs: 12 });
assert.deepEqual(strict("x - 3 = 5"), { tool: "balance", coeff: 1, constant: -3, rhs: 5 });
assert.deepEqual(strict("25 + 40"), { tool: "numberline", start: 25, jump: 40 });
assert.deepEqual(strict("5 - 8"), { tool: "integers", first: 5, pos: 5, neg: 8 });
assert.deepEqual(strict("5 - -3"), { tool: "integers", first: 5, pos: 8, neg: 0 });
assert.deepEqual(strict("1,200 + 300"), { tool: "numberline", start: 1200, jump: 300 });

// ---- parser: refusals say why, and never guess ------------------------------------------
assert.equal(strict(""), null);
assert.equal(strict("hello"), null);
assert.equal(strict("15 + 8 and more"), null, "strict means the whole entry is the expression");
assert.match(strict("2.5 + 1").error, /whole numbers/);
assert.match(strict("20 x 30").error, /area model/);
assert.match(strict("1/40").error, /denominators/);
assert.match(strict("0x + 4 = 4").error, /can't be 0/);

// ---- parser: authored questions keep their old behaviour --------------------------------
assert.deepEqual(parseProblem("34 + 18 = ?"), { tool: "numberline", start: 34, jump: 18 });
assert.deepEqual(parseProblem("Solve 2x + 4 = 12 for x"), {
  tool: "balance",
  coeff: 2,
  constant: 4,
  rhs: 12,
});
assert.equal(parseProblem("What is the value of the expression?"), null);

// ---- state: authored problem sets up the givens but never the answer --------------------
const wb = createWorkbenchState();
wb.resetToItem({ question: "9 + 6" });
assert.equal(wb.state.tool, "counters");
assert.deepEqual(wb.counts(), { a: 9, b: 0 }, "only the first addend is placed for the student");
wb.resetToItem({ question: "12 × 7" });
assert.deepEqual(wb.state.array, { rows: 12, cols: 7, split: 5 });
wb.resetToItem({ question: "Order these fractions 1/2 and 3/4" });
assert.equal(wb.state.tool, "fractions");
assert.deepEqual(wb.state.fractions.shaded, {}, "an authored fraction problem arrives unshaded");

// ---- state: a typed problem is built out completely -------------------------------------
wb.applyTyped(strict("15 + 8"));
assert.deepEqual(wb.counts(), { a: 15, b: 8 });
assert.equal(wb.state.counters.total, 30);
wb.applyTyped(strict("15 - 8"));
assert.equal(wb.filled(), 7);
wb.applyTyped(strict("34 - 18"));
assert.equal(wb.nlCurrent(), 16);
wb.applyTyped(strict("3/4"));
assert.deepEqual([...wb.state.fractions.shaded[4]], [0, 1, 2]);

// ---- state: every number box enforces its own range -------------------------------------
wb.fields["counters-a"].set(25);
assert.deepEqual(wb.fields["counters-b"].range(), [0, 5], "A + B can never pass 30 counters");
wb.fields.cols.set(4);
wb.fields.split.set(3);
wb.fields.cols.set(3);
assert.equal(wb.state.array.split, 2, "shrinking columns pulls the split back inside");
wb.actions.resetJumps();
wb.fields["nl-start"].set(-12);
wb.actions.addJump("+7");
wb.actions.addJump("-20");
assert.equal(wb.nlCurrent(), -25);
assert.match(wb.actions.addJump("abc"), /whole number/);
assert.match(wb.actions.addJump("0"), /whole number/);
wb.fields.pos.set(6);
wb.fields.neg.set(9);
wb.actions.integers("cancelPairs");
assert.deepEqual(wb.state.integers, { pos: 0, neg: 3 });
wb.fields["fr-den"].set(5);
wb.fields["fr-num"].set(5);
wb.fields["fr-den"].set(3);
assert.equal(wb.state.fractions.n, 3, "numerator follows a smaller denominator");
assert.equal(wb.fields["bal-coeff"].nonzero, true);

// ---- UI: drive the real workbench ---------------------------------------------------------
const dom = new JSDOM('<!doctype html><input id="answer-input"><div id="wb"></div>', {
  url: "https://example.test/",
  pretendToBeVisual: true,
});
for (const [k, v] of Object.entries({ window: dom.window, document: dom.window.document }))
  Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true });
const { mountWorkbench } = await import("../math/fluency-lab/workbench.js");
const host = document.querySelector("#wb");
mountWorkbench(host, { skill: "addition", item: { question: "34 + 18", skill: "addition" } });

const $ = (sel) => host.querySelector(sel);
const type = (el, value) => {
  el.value = value;
  el.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
};
const enter = (el) =>
  el.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

assert.ok($("#wb-problem-input"), "universal problem bar is present");
assert.equal(
  $("[data-tool].active").dataset.tool,
  "numberline",
  "34 + 18 starts on the number line",
);

type($("#wb-problem-input"), "6 x 8");
enter($("#wb-problem-input"));
assert.equal($("[data-tool].active").dataset.tool, "array");
assert.equal($("[data-field='rows']").value, "6");
assert.equal($("[data-field='cols']").value, "8");

type($("[data-field='rows']"), "9");
assert.match($(".array-split-header").textContent, /9 × 8/);
assert.equal($("[data-field='rows']").value, "9", "typing keeps the value in the box");

type($("#wb-problem-input"), "banana");
$("[data-entry='model']").click();
assert.match($(".workbench-entry-msg").textContent, /couldn't read/);
assert.equal($("[data-tool].active").dataset.tool, "array", "a bad entry changes nothing");

type($("#wb-problem-input"), "-4 + 7");
$("[data-entry='model']").click();
assert.equal($("[data-tool].active").dataset.tool, "integers");
assert.equal($("[data-field='pos']").value, "7");
assert.equal($("[data-field='neg']").value, "4");
assert.match($(".integers-readout").textContent, /\+3/);

type($("#wb-problem-input"), "2x + 4 = 12");
$("[data-entry='model']").click();
assert.equal($("[data-field='bal-coeff']").value, "2");
assert.match($(".balance-readout").textContent, /x = 4/);
type($("[data-field='bal-coeff']"), "0");
$("[data-field='bal-coeff']").dispatchEvent(new dom.window.Event("change", { bubbles: true }));
assert.equal(
  $("[data-field='bal-coeff']").value,
  "2",
  "0 is refused as a coefficient when the box is left",
);
assert.match($(".workbench-hint").textContent, /other than 0/);

type($("#wb-problem-input"), "3/4");
$("[data-entry='model']").click();
assert.equal($(".strip-label + .interactive-fraction-strip") !== null, true);
assert.equal(host.querySelectorAll(".fraction-strip-piece.shaded").length, 3);
type($("[data-field='fr-num']"), "1");
type($("[data-field='fr-den']"), "5");
$("[data-fraction-action='add']").click();
assert.ok($("[data-remove-strip='5']"), "a custom 1/5 strip is added and removable");

type($("#wb-problem-input"), "15 + 8");
$("[data-entry='model']").click();
assert.equal($("[data-field='counters-a']").value, "15");
assert.equal($("[data-field='counters-b']").value, "8");
assert.equal(host.querySelectorAll(".interactive-counter-cell.part-b").length, 8);

$("[data-tool='numberline']").click();
type($("[data-field='nl-start']"), "5");
type($("#wb-jump-input"), "-8");
$("[data-jump-action='add']").click();
assert.match($(".numberline-readout").textContent, /Current Position:\s*-3/);

$("[data-entry='reset']").click();
assert.equal(
  $("[data-tool].active").dataset.tool,
  "numberline",
  "reset returns to the practice problem's tool",
);
assert.match($(".numberline-readout").textContent, /Start:\s*34/);
assert.equal($("#wb-problem-input").value, "");

console.log("fluency-workbench: ok");
