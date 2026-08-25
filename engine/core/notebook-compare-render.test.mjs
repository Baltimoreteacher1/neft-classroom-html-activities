#!/usr/bin/env node
/**
 * notebook-compare-render.test.mjs — the compare line must reach the FEEDBACK.
 *
 * The derivation is proved elsewhere. This proves the wiring, by driving the
 * real multiple-choice component through a real answer in a real DOM, because
 * those are different failures. A helper that is never called and one that
 * returns null are indistinguishable from the outside — which is exactly how
 * this repo once shipped an interactive visual whose mount stamped
 * `data-iv-mounted` before running the factory that draws anything.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><body></body>", { url: "https://eduwonderlab.com/" });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;
globalThis.HTMLElement = dom.window.HTMLElement;

const { renderMultipleChoice } = await import("../components/multiple-choice.js");

/** Render an MC item, answer it, and return the container. */
function answer(opts, choiceIndex) {
  const host = document.createElement("div");
  document.body.append(host);
  renderMultipleChoice(host, {
    stem: "What is the whole?",
    choices: ["110", "44", "84", "440"],
    correctIndex: 0,
    explanation: "Divide the part by the percent.",
    ...opts,
  });
  const inputs = host.querySelectorAll('input[type="radio"]');
  inputs[choiceIndex].checked = true;
  inputs[choiceIndex].dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  const check = [...host.querySelectorAll("button")].find((b) => /check/i.test(b.textContent));
  check?.click();
  return host;
}

test("a correct answer on a notebook item offers the comparison", () => {
  const host = answer({ notebookAsked: true }, 0);
  const line = host.querySelector(".nb-compare");
  assert.ok(line, "the helper is wired but nothing reached the feedback");
  assert.match(line.textContent, /Check your written work/);
});

test("an item that never asked for a notebook gets NO comparison", () => {
  // "Check your written work" is incoherent where no work was requested.
  const host = answer({}, 0);
  assert.equal(host.querySelector(".nb-compare"), null);
});

test("the comparison does not appear while a retry is still pending", () => {
  // A first miss still has "Try Again" available. Pointing at the notebook
  // there reads as "you got it wrong", which is a different message.
  const host = answer({ notebookAsked: true }, 1);
  assert.equal(
    host.querySelector(".nb-compare"),
    null,
    "the student has not settled the item yet",
  );
});

test("the existing feedback is preserved, not replaced", () => {
  // This is a reframe riding alongside the explanation, never a substitution.
  const host = answer({ notebookAsked: true }, 0);
  assert.match(host.textContent, /Divide the part by the percent/);
});

test("both language lanes render in the comparison", () => {
  const host = answer({ notebookAsked: true }, 0);
  const line = host.querySelector(".nb-compare");
  assert.ok(line.querySelector('[lang="en"]'), "English lane missing");
  assert.ok(line.querySelector('[lang="es"]'), "Spanish lane missing");
});
