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
  location: { protocol: "https:", search: "", href: "https://noam.eduwonderlab.com/" },
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
  id: "a1",
  title: "Compare ratios worksheet",
  classId: "math",
  due: "2026-07-11",
  estimateMin: 30,
  priority: "high",
  steps: [{ text: "Solve problems 1 through 5", done: false }],
};

assert.equal(
  api.buildGuidedHelpPrompt(assignment, "Math", "I do not understand the directions", "example"),
  "I need help with my Math assignment, “Compare ratios worksheet.” I do not understand the directions. It is due Jul 11. It is estimated to take 30 minutes. The unfinished steps are: Solve problems 1 through 5. Please show me one similar example, then let me try mine.",
  "guided help combines assignment context, stuck point, and support style",
);

assert.deepEqual(
  [...api.extractActionSteps("Try this:\n1. Read the directions\n- Circle the numbers\n• Solve one problem\nRemember to check.")],
  ["Read the directions", "Circle the numbers", "Solve one problem"],
  "only concise list actions become previewable planner steps",
);

assert.equal(
  api.teacherHelpDraft(assignment, { name: "Math", teacher: "Ms. Rivera" }),
  "Hi Ms. Rivera,\n\nI’m working on “Compare ratios worksheet” in Math. I’m still confused after trying the directions and asking for a hint. Could you help me understand what to do next?\n\nThank you,",
  "teacher escalation is concise and assignment-specific",
);

assert.equal(api.offlineStrategies(assignment).length, 4, "offline help always offers four actions");
assert.match(api.offlineStrategies(assignment)[0].prompt, /directions/i);

const recovery = api.buildCatchUpPlan(
  [
    assignment,
    { id: "a2", title: "Read chapter 4", due: "2026-07-10", estimateMin: 0, priority: "med", steps: [] },
    { id: "a3", title: "Science questions", due: "2026-07-12", estimateMin: 15, priority: "low", steps: [] },
    { id: "a4", title: "Later project", due: "2026-07-20", estimateMin: 90, priority: "high", steps: [] },
  ],
  "2026-07-12",
  20,
);
assert.equal(recovery.length, 3, "catch-up mode limits the recovery plan to three items");
assert.deepEqual(recovery.map((item) => item.id), ["a2", "a1", "a3"]);
assert.equal(recovery[0].minutes, 20, "missing estimates use the configured focus length");

const compactTabs = api.rankNavigation({ ai: 9, reading: 7, calendar: 5, routines: 2 });
assert.deepEqual(
  [...compactTabs].map((tab) => tab[0]),
  ["home", "homework", "ai", "reading", "calendar", "more"],
  "compact navigation pins core views, ranks three favorites, and keeps More",
);

const insights = api.buildSupportInsights({
  assignments: [
    { ...assignment, status: "done", actualMin: 45, completedAt: "2026-07-12T14:00:00Z" },
    { ...assignment, id: "a5", status: "done", estimateMin: 20, actualMin: 30, completedAt: "2026-07-12T15:00:00Z" },
    { ...assignment, id: "a6", status: "todo", classId: "math", due: "2026-07-01" },
  ],
  classes: [{ id: "math", name: "Math" }],
  activity: { "2026-07-10": { focusMin: 30 }, "2026-07-12": { focusMin: 60 } },
  supportStats: {
    hint: 3,
    example: 2,
    check: 1,
    appliedSteps: 2,
    completedAfter: { hint: 1, example: 3, check: 0 },
  },
});
assert.match(insights.estimate, /longer/i);
assert.equal(insights.delayedClass, "Math");
assert.match(insights.support, /Examples/i);
assert.match(insights.support, /finished work/i);

assert.match(appJs, /data-act="academic-help"/, "assignment cards expose direct Academic Help");
assert.match(appJs, /support-preview-steps/, "AI advice includes preview-before-save actions");
assert.match(appJs, /catch-up-mode/, "catch-up mode is reachable in the UI");
assert.match(
  appJs,
  /view === "ai" \|\| view === "insights"/,
  "floating controls step aside in Academic Help and Insights",
);

console.log("focus-school-integrated-support: 13/13 checks passed");
