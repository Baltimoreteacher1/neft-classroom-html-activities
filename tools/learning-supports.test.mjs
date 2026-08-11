#!/usr/bin/env node
/* =============================================================================
 * learning-supports.test.mjs — JSDOM tests for learning supports controller.
 * ========================================================================== */

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const JS_PATH = join(ROOT, "assets", "learning-supports", "learning-supports.js");

// Mock manifest data for testing
const mockManifest = {
  "1-1": {
    lessonId: "1-1",
    title: "Prime Factorization",
    standard: "6.NOS.4",
    contentObjective: "I can write a number as a product of its prime factors.",
    languageObjective: "I can explain how I broke a number down using math words.",
    vocabulary: [
      {
        term: "Prime number",
        definition: "A number bigger than 1 that you can only divide by 1 and itself.",
        visual: "7 has factors 1, 7",
      },
    ],
    workedExample: "Split 60: 60 = 6 x 10 -> (2 x 3) x (2 x 5) -> 2^2 x 3 x 5.",
    sentenceFrames: ["I know ___ is prime because ___."],
    wordBank: ["prime", "composite"],
    readinessHref: "/lessons/6-13/readiness/",
    profiles: {
      "read-understand": true,
      "focus-organize": true,
      "build-math": true,
      "express-thinking": true,
      "language-support": true,
      "challenge-extend": true,
    },
  },
};

async function runTests() {
  console.log("Running JSDOM tests for learning supports...");

  if (!existsSync(JS_PATH)) {
    console.error("FAIL: learning-supports.js does not exist yet.");
    process.exit(1);
  }

  // Setup JSDOM
  const dom = new JSDOM(
    `<!doctype html>
    <html lang="en" data-ewl-supports-lesson="1-1">
      <head>
        <title>Prime Factorization</title>
      </head>
      <body>
        <main id="app">
          <input type="text" id="original-input" value="student work" />
        </main>
      </body>
    </html>`,
    {
      url: "https://eduwonderlab.com/lessons/6-13/",
      runScripts: "outside-only",
    },
  );

  // Setup global environment
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    writable: true,
    configurable: true,
  });

  // Mock localStorage
  const store = {};
  globalThis.localStorage = {
    getItem(key) {
      return store[key] || null;
    },
    setItem(key, val) {
      store[key] = String(val);
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
  localStorage.setItem("existing-lesson-key", "keep-me");
  // "Prepare Supports" is teacher-only; enable Teacher Mode so it renders.
  localStorage.setItem("nt-teacher-mode", "1");

  // Mock fetch to return our mock manifest
  const originalGlobalFetch = globalThis.fetch;
  const mockFetch = async (url) => {
    if (String(url).includes("manifest.json")) {
      return {
        ok: true,
        json: async () => mockManifest,
      };
    }
    return { ok: false };
  };
  dom.window.fetch = mockFetch;
  globalThis.fetch = mockFetch;

  // Import the script
  const jsUrl = pathToFileURL(JS_PATH).href;
  const mod = await import(jsUrl);
  const EWLLearningSupports = dom.window.EWLLearningSupports || mod.EWLLearningSupports;

  assert.ok(EWLLearningSupports, "EWLLearningSupports global should be exposed");

  // Boot
  await EWLLearningSupports.init();

  // Assertions from Step 1
  assert.equal(document.querySelectorAll("[data-ewl-supports-root]").length, 1);
  assert.equal(
    document.querySelector("[data-ewl-supports-teacher]").textContent.includes("Prepare Supports"),
    true,
  );
  assert.equal(
    document.querySelector("[data-ewl-supports-teacher]").hidden,
    false,
    "Teacher panel must be visible in Teacher Mode",
  );
  assert.equal(document.querySelector("[data-ewl-supports-tools]").hidden, true);

  const originalInput = document.getElementById("original-input");
  assert.equal(originalInput.value, "student work");
  assert.equal(localStorage.getItem("existing-lesson-key"), "keep-me");

  console.log("PASS: Basic controller boot asserts passed");

  // Accessibility Contract Assertions (Task 3 Step 1)
  const dialog = document.getElementById("ewl-supports-dialog");
  assert.equal(dialog.getAttribute("role"), "dialog");
  assert.equal(dialog.getAttribute("aria-modal"), "true");
  // Accessible name may come from aria-label OR aria-labelledby (both valid).
  const labelledbyId = dialog.getAttribute("aria-labelledby");
  const dialogHasName =
    dialog.getAttribute("aria-label") || (labelledbyId && document.getElementById(labelledbyId));
  assert.ok(dialogHasName, "Dialog must have an accessible name (aria-label or aria-labelledby)");

  // Modal backdrop must exist for a true modal dialog.
  assert.ok(
    document.querySelector("[data-ewl-supports-backdrop]"),
    "Modal backdrop element must be present",
  );

  // No positive tabindex
  const positiveTab = Array.from(document.querySelectorAll("[tabindex]")).some((el) => {
    const val = Number(el.getAttribute("tabindex"));
    return !isNaN(val) && val > 0;
  });
  assert.equal(positiveTab, false, "Accessibility fail: Positive tabindex is not allowed");

  // Button accessibility & naming
  const allButtons = document.querySelectorAll("[data-ewl-supports-root] button");
  assert.ok(allButtons.length > 0, "No buttons found in supports UI");
  for (const btn of allButtons) {
    const hasText = btn.textContent.trim().length > 0;
    const hasLabel = btn.getAttribute("aria-label");
    assert.ok(
      hasText || hasLabel,
      "Accessibility fail: All buttons must have text content or an aria-label",
    );

    // 44px class contract check
    const hasNamespacedClass = Array.from(btn.classList).some((cls) =>
      cls.startsWith("ewl-supports-"),
    );
    assert.ok(
      hasNamespacedClass,
      `CSS contract fail: Button does not have namespaced support class: ${btn.className}`,
    );
  }

  // Keyboard Dialog Flow & Focus Return
  const configBtn = document.querySelector(".ewl-supports-btn-teacher");
  configBtn.focus();
  assert.equal(document.activeElement, configBtn);

  // Click config button to open
  configBtn.click();
  assert.equal(dialog.hidden, false, "Dialog should show after click");

  // Send Escape key to document to close dialog and return focus
  const escEvent = new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true });
  document.dispatchEvent(escEvent);
  assert.equal(dialog.hidden, true, "Dialog should hide on Escape");
  assert.equal(document.activeElement, configBtn, "Focus must return to teacher trigger on Escape");

  console.log("PASS: Accessibility and focus return contract assertions passed");

  // Clean up
  await EWLLearningSupports.destroy();
  dom.window.close();
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.navigator;
  delete globalThis.localStorage;
  globalThis.fetch = originalGlobalFetch;

  console.log("PASS: All JSDOM tests passed!");
}

runTests().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
