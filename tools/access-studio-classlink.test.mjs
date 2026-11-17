// WIDA Data Studio live class link (access-teacher/predictive/classlink.js) against a mocked class API: roster
// and summaries, name matching, assignments done, and one-click assignments whose payload passes the server's
// own validateSettings (shared/class-platform/contract.js) with the teacher passcode header on every call.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validateSettings } from "../shared/class-platform/contract.js";

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
const index = readFileSync(new URL("../access-practice-lab/content/index.json", import.meta.url));
const calls = [];
const settings = {
  assignments: [
    { id: "old-1", title: "Old", path: "/access-practice-lab/Reading/A/old-1", due: null },
  ],
};
globalThis.fetch = async (url, init = {}) => {
  const u = String(url);
  if (u.includes("content/index.json")) return new Response(index);
  calls.push(init.headers?.["x-class-teacher"]);
  if (u.includes("/roster"))
    return Response.json({
      ok: true,
      settings,
      students: [
        {
          studentId: "s1",
          alias: "Ana Rivera",
          lastSeen: 1,
          docs: { language: { summary: { weekEvidence: 4, assignmentsDone: ["old-1"] } } },
        },
      ],
    });
  if (u.endsWith("/settings")) {
    const v = validateSettings(JSON.parse(init.body).settings, "language");
    if (!v.ok) return Response.json({ ok: false, error: v.error }, { status: 400 });
    settings.assignments = JSON.parse(init.body).settings.assignments;
    return Response.json({ ok: true });
  }
  return Response.json({ ok: false }, { status: 404 });
};
const m = await import("../access-teacher/predictive/classlink.js");

test("live class: roster, matching, done counts, valid assignments with the teacher passcode", async () => {
  localStorage.setItem(
    m.CLASSES_KEY,
    JSON.stringify([{ code: "ABCD12", passcode: "pass-1", title: "P3" }, { code: "NOPASS" }]),
  );
  const classes = m.teacherClasses();
  assert.equal(classes.length, 1, "classes without a passcode are ignored");
  const live = await m.loadClass(classes[0]);
  assert.equal(live.ok, true);
  assert.equal(m.memberFor(live.students, "ana rivera").studentId, "s1");
  assert.equal(m.memberFor(live.students, "Ana").studentId, "s1", "a unique first name matches");
  assert.equal(m.memberFor(live.students, "Ben"), null);
  assert.deepEqual(m.doneCount(live.students[0], live.assignments), { done: 1, total: 1 });
  assert.equal(m.supportLevelFor(2.1), "A");
  assert.equal(m.supportLevelFor(3.2), "B");
  assert.equal(m.supportLevelFor(4.6), "C");
  const first = await m.assignToClass(classes[0], { band: "6-8", domain: "Speaking", level: 3.2 });
  assert.equal(first.ok, true);
  assert.equal(first.added.length, 2);
  assert.equal(settings.assignments.length, 3, "kept the existing assignment and added two");
  const second = await m.assignToClass(classes[0], { band: "6-8", domain: "Speaking", level: 3.2 });
  assert.equal(
    new Set(settings.assignments.map((a) => a.id)).size,
    settings.assignments.length,
    "no duplicates",
  );
  assert.equal(second.ok, true);
  assert.ok(calls.every((c) => c === "pass-1"));
});
