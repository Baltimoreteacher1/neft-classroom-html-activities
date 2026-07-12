import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const appJs = readFileSync("focus-school/app.js", "utf8");
const sandbox = {
  console,
  setInterval() { return 0; },
  clearInterval() {},
  setTimeout() { return 0; },
  clearTimeout() {},
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
  "I need help with my Math assignment, “Compare ratios worksheet.” My next step is “Solve problems 1 through 5.” Please help me understand what to do without giving away the answer.",
  "Academic Help should turn a planner assignment into a specific, hint-first request",
);

assert.equal(
  api.academicHelpPrompt({ title: "Read chapter 4", steps: [] }, ""),
  "I need help with “Read chapter 4.” Please help me understand what to do without giving away the answer.",
  "Academic Help should still create a useful request without class or step data",
);

console.log("focus-school-academic-help: 2/2 checks passed");
