import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const appJs = readFileSync("focus-school/app.js", "utf8");
const serviceWorker = readFileSync("focus-school/sw.js", "utf8");
const sandbox = {
  console,
  URL,
  setInterval() { return 0; },
  clearInterval() {},
  setTimeout() { return 0; },
  clearTimeout() {},
  location: { protocol: "https:", search: "", href: "https://noam.eduwonderlab.com/" },
  navigator: { userAgent: "Test Chromebook" },
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

const savedHomeOrder = ["routine", "calendar", "plan", "assignments", "momentum"];
assert.deepEqual(
  Array.from(api.focusedHomeOrder(savedHomeOrder, ["plan"], true)),
  ["routine", "assignments"],
);
assert.deepEqual(
  Array.from(api.focusedHomeOrder(savedHomeOrder, ["plan"], false)),
  ["routine", "calendar", "assignments", "momentum"],
);
assert.deepEqual(savedHomeOrder, ["routine", "calendar", "plan", "assignments", "momentum"]);

assert.equal(api.safeSourceUrl("https://classroom.google.com/c/abc/a/123"), "https://classroom.google.com/c/abc/a/123");
assert.equal(api.safeSourceUrl("javascript:alert(1)"), "");
assert.equal(api.safeSourceUrl("http://example.com/work"), "");

const classes = [
  { id: "math", name: "Math", subject: "Mathematics", teacher: "Ms. Rivera" },
  { id: "ela", name: "Language Arts", subject: "English", teacher: "Mr. Chen" },
];
assert.equal(api.matchImportClass("ELA", classes), "ela");
assert.equal(api.matchImportClass("English - Mr. Chen", classes), "ela");

const parsed = api.parseImportText(
  `ELA
Argument essay
Teacher: Mr. Chen
Due tomorrow at 3:30 PM
https://classroom.google.com/c/abc/a/123`,
  classes,
  "2026-07-12",
);
assert.equal(parsed.length, 1);
assert.equal(parsed[0].title, "Argument essay");
assert.equal(parsed[0].classId, "ela");
assert.equal(parsed[0].due, "2026-07-13");
assert.equal(parsed[0].dueTime, "15:30");
assert.equal(parsed[0].teacher, "Mr. Chen");
assert.equal(parsed[0].assignmentType, "essay");
assert.equal(parsed[0].sourceUrl, "https://classroom.google.com/c/abc/a/123");

const assignment = {
  title: "Argument essay",
  due: "2026-07-13",
  dueTime: "15:30",
  estimateMin: 45,
  notes: "Use two quotations and explain each one.",
  sourceUrl: "https://classroom.google.com/c/abc/a/123",
  steps: [
    { text: "Choose evidence", done: true },
    { text: "Draft the claim", done: false },
  ],
};
const help = api.academicHelpPrompt(assignment, "Language Arts");
assert.match(help, /due Jul 13 at 3:30 PM/i);
assert.match(help, /45 minutes/i);
assert.match(help, /Use two quotations/i);
assert.match(help, /Draft the claim/i);
assert.doesNotMatch(help, /classroom\.google\.com/);

assert.equal(api.estimateDailyCapacity({}), 60);
assert.equal(
  api.estimateDailyCapacity({
    "2026-07-08": { focusMin: 20 },
    "2026-07-09": { focusMin: 70 },
    "2026-07-10": { focusMin: 120 },
  }),
  70,
);
assert.equal(
  api.estimateDailyCapacity({
    "2026-07-08": { focusMin: 5 },
    "2026-07-09": { focusMin: 10 },
    "2026-07-10": { focusMin: 15 },
  }),
  45,
);

const forecast = api.buildWorkloadForecast(
  [
    { id: "a", title: "Essay", due: "2026-07-14", status: "todo", estimateMin: 50, priority: "med" },
    { id: "b", title: "Review", due: "2026-07-14", status: "todo", estimateMin: 30, priority: "low" },
    { id: "c", title: "Quiz", due: "2026-07-13", status: "todo", estimateMin: 20, priority: "high" },
  ],
  {},
  "2026-07-12",
);
assert.equal(forecast.capacity, 60);
assert.equal(forecast.days.find((day) => day.date === "2026-07-14").minutes, 80);
assert.equal(forecast.days.find((day) => day.date === "2026-07-14").overloaded, true);
assert.equal(forecast.days.find((day) => day.date === "2026-07-12").minutes, 0);
assert.equal(forecast.suggestions[0].assignmentId, "b");
assert.equal(forecast.suggestions[0].moveTo, "2026-07-12");

assert.match(appJs, /Open source/);
assert.match(appJs, /rel="noopener"/);
assert.match(appJs, /Workload forecast/);
assert.match(appJs, /Move earlier/);
assert.match(serviceWorker, /focus-school-v72/);

console.log("focus-school-smart-planning: 30/30 checks passed");
