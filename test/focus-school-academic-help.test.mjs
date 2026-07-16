import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const appJs = readFileSync("focus-school/app.js", "utf8");
const stylesCss = readFileSync("focus-school/styles.css", "utf8");
const sandbox = {
  console,
  AbortController,
  setInterval() { return 0; },
  clearInterval() {},
  setTimeout,
  clearTimeout,
  location: { protocol: "https:", search: "" },
  navigator: {},
  localStorage: { getItem() { return null; }, setItem() {} },
  sessionStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  document: {
    readyState: "loading",
    addEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
  },
  window: { __FOCUS_SCHOOL_TEST__: {}, addEventListener() {} },
  addEventListener() {},
};
Object.assign(sandbox.window, {
  window: sandbox.window,
  document: sandbox.document,
  navigator: sandbox.navigator,
  location: sandbox.location,
  localStorage: sandbox.localStorage,
  sessionStorage: sandbox.sessionStorage,
});

vm.runInNewContext(appJs, sandbox, { filename: "focus-school/app.js" });
const api = sandbox.window.__FOCUS_SCHOOL_TEST__;

const assignment = {
  title: "Compare ratios worksheet",
  due: "2026-07-13",
  steps: [
    { text: "Read the directions", done: true },
    { text: "Solve problems 1 through 5", done: false },
  ],
};

assert.equal(
  api.academicHelpPrompt(assignment, "Math"),
  "I need help with my Math assignment, “Compare ratios worksheet.” My next step is “Solve problems 1 through 5.” It is due Jul 13. Please help me understand what to do without giving away the answer.",
  "Academic Help should turn a planner assignment into a specific, hint-first request",
);

assert.equal(
  api.academicHelpPrompt({ title: "Read chapter 4", steps: [] }, ""),
  "I need help with “Read chapter 4.” Please help me understand what to do without giving away the answer.",
  "Academic Help should still create a useful request without class or step data",
);

assert.equal(
  typeof api.setAcademicHelpMode,
  "function",
  "Academic Help should expose its mode switch behavior for regression testing",
);

const draftInput = { value: "This draft must survive a mode change." };
const modeButtons = [
  {
    dataset: { arg: "hint" },
    setAttribute(name, value) {
      this[name] = value;
    },
  },
  {
    dataset: { arg: "solve" },
    setAttribute(name, value) {
      this[name] = value;
    },
  },
];
const modeRoot = {
  querySelectorAll(selector) {
    assert.equal(selector, '[data-act="ai-mode"]');
    return modeButtons;
  },
  querySelector(selector) {
    assert.equal(selector, "#aiInput");
    return draftInput;
  },
};

api.setAcademicHelpMode("solve", modeRoot);

assert.equal(draftInput.value, "This draft must survive a mode change.");
assert.equal(modeButtons[0]["aria-pressed"], "false");
assert.equal(modeButtons[1]["aria-pressed"], "true");

assert.equal(
  typeof api.requestAcademicHelp,
  "function",
  "Academic Help should expose its bounded network request for regression testing",
);

const neverResponds = (_url, options) =>
  new Promise((_resolve, reject) => {
    options.signal.addEventListener("abort", () => {
      const error = new Error("aborted");
      error.name = "AbortError";
      reject(error);
    });
  });

await assert.rejects(
  () => api.requestAcademicHelp({ messages: [] }, { fetchImpl: neverResponds, timeoutMs: 5 }),
  { name: "TimeoutError" },
  "Academic Help should stop waiting when the AI service stalls",
);

assert.match(
  appJs,
  /class="seg ai-mode-seg"/,
  "Academic Help should give the mode selector a dedicated layout hook",
);
assert.match(
  stylesCss,
  /\.ai-mode-seg\s*{[^}]*flex-direction:\s*row;/s,
  "Academic Help mode choices should stay side by side",
);
assert.match(
  appJs,
  /class="ai-scroll" id="aiScroll" role="log" aria-live="polite"/,
  "Academic Help should announce new replies to assistive technology",
);

console.log("focus-school-academic-help: 11/11 checks passed");
