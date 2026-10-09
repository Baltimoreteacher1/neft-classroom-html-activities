#!/usr/bin/env node
/**
 * choice-order.test.mjs — display-order shuffling for multiple choice.
 *
 * Authored data puts the correct answer at D about half as often as at A, B or
 * C. The engine now SHOWS choices in a stable seeded order while grading,
 * feedback and saved answers stay in authored index space. This pins:
 *   1. the order is a pure, stable function of (lesson, item);
 *   2. lists whose order means something are never moved;
 *   3. the real component grades the authored answer whatever slot it lands in,
 *      labels letters in display order, and reports the AUTHORED index upward;
 *   4. across the real fleet, the displayed correct slot is no longer biased.
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const dom = new JSDOM("<!doctype html><body></body>", {
  url: "https://eduwonderlab.com/lessons/4-1/",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;
globalThis.HTMLElement = dom.window.HTMLElement;
Object.defineProperty(globalThis, "location", { value: dom.window.location, configurable: true });

const { choiceOrderFor, currentLessonKey, displayLetterFor, isOrderSensitive, namesChoiceLetters, seededOrder } =
  await import("./choice-order.js");
const { renderMultipleChoice } = await import("../components/multiple-choice.js");

const ITEM = {
  stem: "Which ratio is equivalent to 3:4?",
  choices: ["6:8", "4:3", "3:7", "9:16"],
  correctIndex: 0,
  explanation: "Multiply both terms by 2.",
  choiceFeedback: ["", "That reverses the ratio.", "That adds instead of scaling.", "That squares."],
};

test("seededOrder is a deterministic permutation", () => {
  const a = seededOrder(4, "x");
  assert.deepEqual(a, seededOrder(4, "x"));
  assert.deepEqual([...a].sort(), [0, 1, 2, 3]);
});

test("the page's lesson seeds the order", () => {
  assert.equal(currentLessonKey(), "4-1");
  assert.deepEqual(choiceOrderFor(ITEM), choiceOrderFor(ITEM, { lessonKey: "4-1" }));
});

test("order-sensitive lists keep their authored order", () => {
  assert.equal(isOrderSensitive(["2", "4", "All of the above", "None of the above"]), true);
  assert.equal(isOrderSensitive(["1", "2", "Both A and B", "3"]), true);
  assert.equal(isOrderSensitive(["12", "15", "18", "21"]), true, "ascending numbers stay put");
  assert.equal(isOrderSensitive(["$1.50", "$2", "$12", "$20"]), true);
  assert.equal(isOrderSensitive(["110", "44", "84", "440"]), false, "an unordered numeric list may move");
  assert.equal(isOrderSensitive(["y", "Both of them", "Neither one", "x"]), false);
  assert.equal(isOrderSensitive(["Only b", "Only c", "Both b and c", "b + c"]), false);
  const sensitive = { ...ITEM, choices: ["6:8", "4:3", "All of these", "9:16"] };
  assert.deepEqual(choiceOrderFor(sensitive), [0, 1, 2, 3]);
});

test("an item whose own text names a choice letter keeps its order", () => {
  const hinted = { ...ITEM, hint: "First step: try option D. Apply that same check to A, B, and C." };
  assert.equal(namesChoiceLetters(hinted), true);
  assert.deepEqual(choiceOrderFor(hinted), [0, 1, 2, 3]);
  // "Part A" is a part of a two-part item, not a choice.
  assert.equal(namesChoiceLetters({ stem: "Which reasoning shows why your answer to Part A is correct?" }), false);
});

/** Render the real component; returns helpers keyed by AUTHORED index. */
function mount(item, onAnswer = () => {}) {
  const host = document.createElement("div");
  document.body.append(host);
  renderMultipleChoice(host, { ...item, onAnswer });
  const pick = (authored) => {
    const input = host.querySelector(`input[type="radio"][value="${authored}"]`);
    input.checked = true;
    input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    [...host.querySelectorAll("button")].find((b) => /check answer/i.test(b.textContent)).click();
  };
  const retry = () => [...host.querySelectorAll("button")].find((b) => /try again/i.test(b.textContent)).click();
  const shown = () => [...host.querySelectorAll(".mc-option-label .choice-text")].map((t) => t.textContent);
  const letters = () => [...host.querySelectorAll(".mc-letter-badge")].map((t) => t.textContent);
  return { host, pick, retry, shown, letters };
}

test("the component shows display order, letters A-D in that order, stable across re-render", () => {
  const order = choiceOrderFor(ITEM);
  assert.notDeepEqual(order, [0, 1, 2, 3], "fixture should actually move (pick another stem if the hash changes)");
  const first = mount(ITEM);
  assert.deepEqual(first.shown(), order.map((i) => ITEM.choices[i]));
  assert.deepEqual(first.letters(), ["A", "B", "C", "D"]);
  assert.equal(first.host.querySelector(".mc-problem").dataset.choiceOrder, order.join(","));
  const again = mount(ITEM);
  assert.deepEqual(again.shown(), first.shown(), "a reload must show the same order");
});

test("grading, onAnswer and choiceFeedback use the AUTHORED index", () => {
  const calls = [];
  const m = mount(ITEM, (ok, selected) => calls.push([ok, selected]));
  m.pick(1);
  assert.deepEqual(calls.at(-1), [false, 1], "onAnswer reports the authored index of the pick");
  assert.match(m.host.querySelector(".problem-check-result").textContent, /reverses the ratio/);
  m.retry();
  m.pick(0);
  assert.deepEqual(calls.at(-1), [true, 0]);
  const correctLabel = m.host.querySelector(".mc-option-label.is-correct");
  assert.match(correctLabel.textContent, /6:8/);
});

test("the revealed answer names the letter the student SAW", () => {
  const m = mount(ITEM);
  m.pick(1);
  m.retry();
  m.pick(2);
  const seen = displayLetterFor(ITEM, 0);
  assert.match(m.host.querySelector(".problem-check-result").textContent, new RegExp(`The answer is ${seen}\\.`));
  const correctLabel = m.host.querySelector(".mc-option-label.is-correct");
  assert.equal(correctLabel.querySelector(".mc-letter-badge").textContent, seen);
});

test("across every lesson, the displayed correct slot is balanced", () => {
  const counts = [0, 0, 0, 0];
  let authoredD = 0;
  let moved = 0;
  const walk = (node, visit) => {
    if (Array.isArray(node)) for (const n of node) walk(n, visit);
    else if (node && typeof node === "object") {
      if (Array.isArray(node.choices) && Number.isInteger(node.correctIndex)) visit(node);
      for (const v of Object.values(node)) walk(v, visit);
    }
  };
  for (const id of readdirSync(resolve(ROOT, "lessons"))) {
    let config;
    try {
      config = JSON.parse(readFileSync(resolve(ROOT, "lessons", id, "config.json"), "utf8"));
    } catch {
      continue;
    }
    walk(config, (item) => {
      if (item.type && item.type !== "multiple-choice") return;
      if (item.choices.length !== 4) return;
      const order = choiceOrderFor(item, { lessonKey: id });
      if (order.join() === "0,1,2,3") return;
      moved++;
      if (item.correctIndex === 3) authoredD++;
      counts[order.indexOf(item.correctIndex)]++;
    });
  }
  assert.ok(moved > 2000, `expected thousands of shuffled items, got ${moved}`);
  const share = counts.map((c) => c / moved);
  for (const [slot, s] of share.entries()) {
    assert.ok(s > 0.2 && s < 0.3, `slot ${"ABCD"[slot]} holds ${(s * 100).toFixed(1)}% of correct answers`);
  }
  assert.ok(authoredD / moved < 0.2, "fixture sanity: authored data really was D-light");
});
