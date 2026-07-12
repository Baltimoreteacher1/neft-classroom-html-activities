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

assert.equal(
  api.importCandidateKey({ title: "  Ratios   Worksheet ", classId: "MATH", due: "2026-07-13" }),
  "ratios worksheet|math|2026-07-13",
  "candidate keys normalize whitespace and case",
);

const candidates = api.buildImportCandidates(
  [
    { title: "Ratios worksheet", classId: "math", due: "2026-07-13", source: "Classroom" },
    { title: "Read chapter 4", classId: "ela", due: "2026-07-14", source: "Gmail" },
  ],
  [{ title: "RATIOS WORKSHEET", classId: "math", due: "2026-07-13" }],
  [{ title: "Read chapter 4", classId: "ela", due: "2026-07-14", status: "pending" }],
);
assert.equal(candidates.length, 2);
assert.equal(candidates[0].duplicate, true, "existing assignments are detected");
assert.equal(candidates[1].duplicate, true, "pending inbox entries are detected");
assert.ok(candidates.every((item) => item.id && item.status === "pending"));

const briefingState = {
  assignments: [
    { id: "late", title: "Late math", status: "todo", due: "2026-07-11", estimateMin: 20 },
    { id: "today", title: "Science review", status: "todo", due: "2026-07-12", estimateMin: 15 },
    { id: "later", title: "Essay", status: "todo", due: "2026-07-16", estimateMin: 30 },
  ],
  todos: [{ id: "t1", text: "Bring permission slip", done: false, date: "2026-07-12" }],
  changeLog: [{ id: "e1", ts: 200, label: "Imported Science review", device: "Chromebook" }],
};
const morning = api.buildDailyBriefing(briefingState, "morning", "2026-07-12");
assert.match(morning.headline, /2 priorities/i);
assert.deepEqual([...morning.items].map((item) => item.title), ["Late math", "Science review"]);
const afterSchool = api.buildDailyBriefing(briefingState, "afterSchool", "2026-07-12");
assert.match(afterSchool.headline, /35 minutes/i);
assert.match(afterSchool.recent, /Imported Science review/);

const mergedHistory = api.mergeChangeLog(
  [
    { id: "a", ts: 100, label: "Added task", device: "Phone", kind: "assignment" },
    { id: "b", ts: 300, label: "Completed task", device: "Chromebook", kind: "assignment" },
  ],
  [
    { id: "a", ts: 100, label: "Added task", device: "Phone", kind: "assignment" },
    { id: "c", ts: 200, label: "Added reminder", device: "Mac", kind: "reminder" },
  ],
  2,
);
assert.deepEqual([...mergedHistory].map((item) => item.id), ["b", "c"]);

const event = api.normalizeChangeEvent({ id: "x", ts: 123, kind: "bad-kind", label: "x".repeat(180), device: "d".repeat(100) });
assert.equal(event.kind, "other");
assert.equal(event.label.length, 120);
assert.equal(event.device.length, 60);

assert.match(appJs, /data-act="undo-last"/, "undo is exposed as an explicit action");
assert.match(appJs, /Recently Changed/, "recent changes are visible to the student");
assert.match(appJs, /Import Inbox/, "the review inbox is visible");
assert.match(appJs, /Daily Briefing/, "briefings are visible");

console.log("focus-school-reliability: 15/15 checks passed");
