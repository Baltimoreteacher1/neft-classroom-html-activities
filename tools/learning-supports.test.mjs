#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = join(ROOT, "assets", "learning-supports", "learning-supports.js");
const STYLES = join(ROOT, "assets", "learning-supports", "learning-supports.css");
assert.ok(existsSync(SCRIPT), "learning-supports.js must exist");
assert.ok(existsSync(STYLES), "learning-supports.css must exist");
const source = readFileSync(SCRIPT, "utf8");
const styles = readFileSync(STYLES, "utf8");
assert.match(styles, /min-height:\s*44px/, "support controls need 44px minimum targets");
assert.match(styles, /prefers-reduced-motion/, "support styles must honor reduced motion");
assert.match(styles, /forced-colors/, "support styles must support forced colors");
assert.match(styles, /@media\s+print/, "support styles need print behavior");

const lesson = {
  lessonId: "1-1",
  title: "Prime Factorization",
  standard: "6.NOS.4",
  contentObjective: "I can write a number as a product of prime factors.",
  languageObjective: "I can explain my factor tree.",
  vocabulary: [
    {
      term: "Prime number",
      termEs: "Número primo",
      definition: "A whole number greater than 1 with exactly two factors.",
      definitionEs: "Un número entero mayor que 1 con exactamente dos factores.",
      visual: "7 has the factors 1 and 7.",
    },
  ],
  workedExample: ["Split 60 into 6 × 10.", "Keep splitting until every factor is prime."],
  sentenceFrames: ["I broke ___ into ___ because ___."],
  wordBank: ["prime", "factor", "product"],
  extensionPrompts: ["Will a different factor tree end with the same primes?"],
  readinessHref: "/lessons/1-1/readiness/",
  profiles: [
    "read-understand",
    "focus-organize",
    "build-math",
    "express-thinking",
    "language-support",
    "challenge-extend",
  ],
};

function makeDom({ lessonId = "1-1", manifest = { schemaVersion: 1, lessons: [lesson] } } = {}) {
  const attr = lessonId ? ` data-ewl-supports-lesson="${lessonId}"` : "";
  const dom = new JSDOM(
    `<!doctype html><html${attr}><body><main><h1>Original lesson</h1><input id="original" value="student work"><button id="original-action">Check</button></main></body></html>`,
    { url: "https://eduwonderlab.com/lessons/1-1/", runScripts: "dangerously" },
  );
  dom.window.__EWL_SUPPORTS_MANIFEST__ = manifest;
  dom.window.localStorage.setItem("existing-lesson-key", "keep-me");
  dom.window.eval(source);
  return dom;
}

function click(element, window) {
  element.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
}

{
  const dom = makeDom();
  const { document, localStorage } = dom.window;
  assert.equal(document.querySelectorAll("[data-ewl-supports-root]").length, 1);
  assert.match(
    document.querySelector("[data-ewl-supports-teacher]").textContent,
    /Prepare Supports/,
  );
  assert.equal(document.querySelector("[data-ewl-supports-tools]").hidden, true);
  assert.equal(document.querySelector("#original").value, "student work");
  assert.equal(localStorage.getItem("existing-lesson-key"), "keep-me");
  assert.equal(
    document.querySelector("[role=dialog]").getAttribute("aria-labelledby"),
    "ewl-supports-title",
  );

  click(document.querySelector("[data-ewl-supports-teacher]"), dom.window);
  const dialog = document.querySelector("[role=dialog]");
  assert.equal(dialog.hidden, false);
  const readProfile = document.querySelector('[data-ewl-supports-profile="read-understand"]');
  click(readProfile, dom.window);
  assert.equal(readProfile.getAttribute("aria-pressed"), "true");
  assert.equal(document.querySelector("[data-ewl-supports-tools]").hidden, false);
  assert.equal(document.querySelector("#original").value, "student work");

  const focusTool = document.querySelector('[data-ewl-supports-tool="focus"]');
  click(focusTool, dom.window);
  assert.equal(document.body.classList.contains("ewl-supports-focus-active"), true);
  click(focusTool, dom.window);
  assert.equal(document.body.classList.contains("ewl-supports-focus-active"), false);

  document.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  assert.equal(dialog.hidden, true);
  assert.equal(document.activeElement, document.querySelector("[data-ewl-supports-teacher]"));

  click(document.querySelector("[data-ewl-supports-reset]"), dom.window);
  assert.equal(document.querySelector("#original").value, "student work");
  assert.equal(localStorage.getItem("existing-lesson-key"), "keep-me");
  assert.equal(localStorage.getItem("ewl-supports:v1:preferences"), null);
  dom.window.EWLLearningSupports.init();
  assert.equal(
    document.querySelectorAll("[data-ewl-supports-root]").length,
    1,
    "boot must be idempotent",
  );
}

{
  const dom = makeDom({ lessonId: "" });
  assert.equal(dom.window.document.querySelector("[data-ewl-supports-root]"), null);
}

{
  const dom = makeDom({ manifest: { schemaVersion: 1, lessons: [] } });
  assert.equal(dom.window.document.querySelector("[data-ewl-supports-root]"), null);
  assert.equal(dom.window.document.querySelector("#original").value, "student work");
}

{
  const dom = makeDom();
  const parsed = dom.window.EWLLearningSupports.parseSettings(
    "#ewl-supports=read-understand,unknown,<script>",
  );
  assert.deepEqual(Array.from(parsed), ["read-understand"]);
  assert.equal(
    dom.window.EWLLearningSupports.parseSettings(`#ewl-supports=${"x".repeat(3000)}`).length,
    0,
  );
  const encoded = dom.window.EWLLearningSupports.serializeSettings(["focus-organize", "unknown"]);
  assert.equal(encoded, "#ewl-supports=focus-organize");
}

console.log("learning-supports: all assertions passed");
