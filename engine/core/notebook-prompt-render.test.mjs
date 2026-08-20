#!/usr/bin/env node
/**
 * notebook-prompt-render.test.mjs — the prompt must reach the CARD, not just
 * return a string.
 *
 * `notebook-prompt.test.mjs` proves the derivation. This proves the wiring, in
 * a real DOM, because those are different failures and this repo has shipped
 * the second kind: an interactive visual whose mount stamped `data-iv-mounted`
 * BEFORE running the component factory, so a dead manipulative still parsed,
 * still linted, and rendered nothing. A derivation that is never called is
 * indistinguishable from one that returns null.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

// Same global set the repo's other jsdom tests install (see
// small-group-sentence-frames.test.mjs). Node 24 makes globalThis.navigator
// getter-only, and nothing on this path reads it.
const dom = new JSDOM("<!doctype html><body></body>", { url: "https://eduwonderlab.com/" });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;
globalThis.HTMLElement = dom.window.HTMLElement;

const { createProblemCard } = await import("./problem-shell.js");

/** Build a card and hand back its notebook prompt element, if any. */
function cardFor(problemDef, number = 3, lessonModel = null) {
  const { card } = createProblemCard({
    number,
    total: 6,
    stem: problemDef.stem || "Which of the following is a prime number?",
    problemDef,
    lessonModel,
  });
  return { card, prompt: card.querySelector(".nb-setup") };
}

test("a multiple-choice card renders the notebook setup", () => {
  const { prompt } = cardFor({ type: "multiple-choice" });
  assert.ok(prompt, "the derivation is wired but nothing reached the card");
  assert.match(prompt.textContent, /#3/, "the rendered setup must name the problem number");
  assert.match(prompt.textContent, /notebook/i);
  assert.equal(prompt.querySelectorAll(".nb-setup-steps li").length, 2, "two steps render");
});

test("the lesson model renders as something to COPY, in its own element", () => {
  const { prompt } = cardFor({ type: "multiple-choice" }, 2, "Whole = Part \u00F7 Percent");
  const code = prompt.querySelector(".nb-setup-model code");
  assert.ok(code, "the model must render in its own element, set apart to transcribe");
  assert.equal(code.textContent, "Whole = Part \u00F7 Percent");
});

test("a lesson with no model renders the setup without a model line", () => {
  const { prompt } = cardFor({ type: "multiple-choice" }, 2, null);
  assert.ok(prompt, "47 of 84 lessons have no formula and must still get the setup");
  assert.equal(prompt.querySelector(".nb-setup-model"), null);
});

test("the prompt sits between the stem and the answer body", () => {
  // Placement is the whole design: it must be read at the moment the student
  // decides whether to work it out or just pick. Above the stem it is chrome;
  // below the answer UI it is an epitaph.
  const { card } = cardFor({ type: "multiple-choice" });
  const kids = [...card.children];
  const stem = kids.findIndex((el) => el.classList.contains("problem-stem"));
  const note = kids.findIndex((el) => el.classList.contains("nb-setup"));
  const body = kids.findIndex((el) => el.classList.contains("problem-body"));
  assert.ok(stem !== -1 && note !== -1 && body !== -1, "card is missing one of the three parts");
  assert.ok(stem < note && note < body, `expected stem < prompt < body, got ${stem}/${note}/${body}`);
});

test("both language lanes render", () => {
  const { prompt } = cardFor({ type: "multiple-choice" });
  assert.ok(prompt.querySelector('[lang="en"]'), "English lane missing");
  assert.ok(prompt.querySelector('[lang="es"]'), "Spanish lane missing");
});

test("the prompt is NOT hidden from assistive technology", () => {
  // A student using a screen reader needs the instruction as much as a sighted
  // one; only the pencil is decorative.
  const { prompt } = cardFor({ type: "multiple-choice" });
  assert.notEqual(prompt.getAttribute("aria-hidden"), "true");
  const icon = prompt.querySelector(".nb-setup-icon");
  assert.equal(icon?.getAttribute("aria-hidden"), "true", "the pencil is decoration");
});

test("a manipulative card renders NO prompt", () => {
  for (const type of ["net-folder", "number-line", "algebra-tiles", "coordinate-grid"]) {
    const { prompt } = cardFor({ type });
    assert.equal(prompt, null, `${type}: the screen is the work surface, paper is wrong`);
  }
});

test("a card built without problemDef renders no prompt and does not throw", () => {
  // Every other caller of createProblemCard predates this feature and passes no
  // problemDef. Silence is the correct default; a throw here would take out
  // every problem card on the site.
  const { card } = createProblemCard({ number: 1, total: 1, stem: "x" });
  assert.equal(card.querySelector(".nb-setup"), null);
});

test("the card still renders its stem and body unchanged", () => {
  // Guard against the prompt displacing what was already there.
  const { card } = cardFor({ type: "multiple-choice", stem: "Which is prime?" });
  assert.match(card.querySelector(".problem-stem").textContent, /Which is prime/);
  assert.ok(card.querySelector(".problem-body"));
  assert.match(card.getAttribute("aria-label"), /Problem 3 of 6/);
});
