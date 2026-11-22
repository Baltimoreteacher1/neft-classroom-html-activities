// Assignment lifecycle rules (shared/class-platform/assignment-lifecycle.js). Run by `npm test`.

import assert from "node:assert/strict";
import test from "node:test";
import { DOMAINS, MAX_LEVEL } from "../access-practice-lab/src/support-engine/engine.js";
import {
  cleanAssignmentExtras,
  DEFAULT_ATTEMPTS,
  isAvailable,
  isLate,
  LATE_AFTER_HOURS,
  MAX_ATTEMPTS,
  MAX_SUPPORT_LEVEL,
  nextState,
  STATES,
  STUDENT_ACTIONS,
  SUPPORT_DOMAINS,
  summarize,
  TEACHER_ACTIONS,
} from "../shared/class-platform/assignment-lifecycle.js";

const step = (state, action, actor, more = {}) => nextState({ state, action, actor, ...more });

test("the support range and domains match the shared support engine", () => {
  assert.equal(MAX_SUPPORT_LEVEL, MAX_LEVEL);
  assert.deepEqual([...SUPPORT_DOMAINS], [...DOMAINS]);
});

test("the happy path: assigned, in progress, submitted, reviewed", () => {
  let s = { state: "assigned", attempt: 1 };
  s = step(s.state, "start", "student", { attempt: s.attempt });
  assert.deepEqual(s, { ok: true, state: "in_progress", attempt: 1 });
  s = step(s.state, "submit", "student", { attempt: s.attempt });
  assert.deepEqual(s, { ok: true, state: "submitted", attempt: 1 });
  s = step(s.state, "review", "teacher", { attempt: s.attempt });
  assert.deepEqual(s, { ok: true, state: "reviewed", attempt: 1 });
});

test("learners cannot do teacher actions and teachers cannot do learner actions", () => {
  for (const a of TEACHER_ACTIONS)
    assert.deepEqual(step("submitted", a, "student"), { ok: false, error: "forbidden-actor" }, a);
  for (const a of STUDENT_ACTIONS)
    assert.deepEqual(step("assigned", a, "teacher"), { ok: false, error: "forbidden-actor" }, a);
  assert.deepEqual(step("assigned", "start", "visitor"), { ok: false, error: "forbidden-actor" });
});

test("a learner cannot skip states or review their own work", () => {
  assert.deepEqual(
    step("assigned", "submit", "student"),
    { ok: false, error: "invalid-transition" },
    "must start first",
  );
  assert.deepEqual(
    step("in_progress", "review", "teacher"),
    { ok: false, error: "invalid-transition" },
    "cannot review unsubmitted work",
  );
  assert.deepEqual(step("assigned", "request_revision", "teacher"), {
    ok: false,
    error: "invalid-transition",
  });
  assert.deepEqual(step("in_progress", "start", "student"), {
    ok: false,
    error: "invalid-transition",
  });
  assert.deepEqual(step("submitted", "submit", "student"), {
    ok: false,
    error: "invalid-transition",
  });
});

test("unknown actions and malformed state are refused, not guessed", () => {
  assert.deepEqual(step("assigned", "delete", "teacher"), { ok: false, error: "invalid-action" });
  assert.deepEqual(step("assigned", undefined, "student"), { ok: false, error: "invalid-action" });
  assert.deepEqual(nextState({ state: "graded", action: "start", actor: "student" }), {
    ok: false,
    error: "invalid-state",
  });
  assert.deepEqual(
    nextState({ state: "assigned", attempt: 0, action: "start", actor: "student" }),
    { ok: false, error: "invalid-state" },
  );
  assert.deepEqual(
    nextState({ state: "assigned", attempt: 1.5, action: "start", actor: "student" }),
    { ok: false, error: "invalid-state" },
  );
});

test("self-started retries use attempts; the limit stops them", () => {
  assert.deepEqual(step("submitted", "start", "student", { attempt: 1, attempts: 2 }), {
    ok: true,
    state: "in_progress",
    attempt: 2,
  });
  assert.deepEqual(step("reviewed", "start", "student", { attempt: 2, attempts: 2 }), {
    ok: false,
    error: "attempts-used",
  });
  assert.deepEqual(step("submitted", "start", "student", { attempt: 1, attempts: 1 }), {
    ok: false,
    error: "attempts-used",
  });
  assert.equal(DEFAULT_ATTEMPTS, 3);
});

test("a teacher's revision request never uses up the learner's attempts", () => {
  const asked = step("submitted", "request_revision", "teacher", { attempt: 3, attempts: 3 });
  assert.deepEqual(asked, { ok: true, state: "needs_revision", attempt: 3 });
  assert.deepEqual(step("needs_revision", "start", "student", { attempt: 3, attempts: 3 }), {
    ok: true,
    state: "in_progress",
    attempt: 4,
  });
  assert.ok(
    step("reviewed", "request_revision", "teacher").ok,
    "a reviewed piece can still be sent back",
  );
});

test("reassign resets any started state to assigned with a new attempt, and refuses when already assigned", () => {
  for (const state of ["in_progress", "submitted", "needs_revision", "reviewed"]) {
    assert.deepEqual(
      step(state, "reassign", "teacher", { attempt: 2, attempts: 2 }),
      { ok: true, state: "assigned", attempt: 3 },
      state,
    );
  }
  assert.deepEqual(step("assigned", "reassign", "teacher"), {
    ok: false,
    error: "invalid-transition",
  });
});

test("every state is reachable and every transition lands on a known state", () => {
  const seen = new Set(["assigned"]);
  const queue = [["assigned", 1]];
  while (queue.length) {
    const [state, attempt] = queue.shift();
    for (const [actor, actions] of [
      ["student", STUDENT_ACTIONS],
      ["teacher", TEACHER_ACTIONS],
    ]) {
      for (const action of actions) {
        const r = nextState({ state, attempt, action, actor, attempts: 2 });
        if (!r.ok) continue;
        assert.ok(STATES.includes(r.state), `${state} -${action}-> ${r.state}`);
        if (!seen.has(r.state)) {
          seen.add(r.state);
          queue.push([r.state, Math.min(r.attempt, 2)]);
        }
      }
    }
  }
  assert.deepEqual([...seen].sort(), [...STATES].sort());
});

test("cleanAssignmentExtras defaults an old assignment and rejects bad fields", () => {
  assert.deepEqual(cleanAssignmentExtras({}), {
    ok: true,
    value: { availableFrom: null, attempts: 3, draft: false, supports: null },
  });
  assert.deepEqual(cleanAssignmentExtras(undefined).ok, true);
  const good = cleanAssignmentExtras({
    availableFrom: "2026-12-01",
    attempts: 5,
    draft: true,
    supports: { writing: 2, speaking: 1 },
  });
  assert.deepEqual(good.value, {
    availableFrom: "2026-12-01",
    attempts: 5,
    draft: true,
    supports: { speaking: 1, writing: 2 },
  });
  for (const [bad, error] of [
    [{ availableFrom: "12/01/2026" }, "invalid-available-from"],
    [{ availableFrom: "2026-13-45" }, "invalid-available-from"],
    [{ attempts: 0 }, "invalid-attempts"],
    [{ attempts: MAX_ATTEMPTS + 1 }, "invalid-attempts"],
    [{ attempts: "3" }, "invalid-attempts"],
    [{ draft: "yes" }, "invalid-draft"],
    [{ supports: { writing: 7 } }, "invalid-supports"],
    [{ supports: { writing: 0 } }, "invalid-supports"],
    [{ supports: [1, 2] }, "invalid-supports"],
  ])
    assert.deepEqual(cleanAssignmentExtras(bad), { ok: false, error }, JSON.stringify(bad));
  assert.equal(
    cleanAssignmentExtras({ supports: { reading: undefined, nonsense: 3 } }).value.supports,
    null,
    "unknown keys are dropped",
  );
});

test("learners see an assignment only when it is released and has started", () => {
  assert.equal(isAvailable({}, "2026-11-20"), true, "an old assignment is visible");
  assert.equal(isAvailable({ draft: true }, "2026-11-20"), false);
  assert.equal(isAvailable({ availableFrom: "2026-11-21" }, "2026-11-20"), false);
  assert.equal(isAvailable({ availableFrom: "2026-11-20" }, "2026-11-20"), true);
  assert.equal(
    isAvailable({ availableFrom: "garbage" }, "2026-11-20"),
    true,
    "an unreadable date does not hide work",
  );
});

test("a due date is end of day anywhere in the US: 8 pm in New York is on time, two days later is late", () => {
  const due = "2026-11-20";
  const eveningNY = Date.parse("2026-11-21T01:00:00Z"); // 8 pm EST on the due date
  const lateHawaii = Date.parse("2026-11-21T09:30:00Z"); // 11:30 pm HST on the due date
  const nextDay = Date.parse("2026-11-21T12:00:00Z") + 60_000 * 60 * 11; // well past the window
  assert.equal(isLate(due, eveningNY), false);
  assert.equal(isLate(due, lateHawaii), false);
  assert.equal(
    isLate(due, Date.parse(due + "T00:00:00Z") + LATE_AFTER_HOURS * 3_600_000 + 1),
    true,
  );
  assert.equal(isLate(due, nextDay), true);
  assert.equal(isLate(null, nextDay), false, "no due date is never late");
  assert.equal(isLate("soon", nextDay), false);
});

test("summarize counts learners with no record as not started and never loses anyone", () => {
  const ids = ["s1", "s2", "s3", "s4", "s5"];
  const rows = [
    { studentId: "s1", state: "submitted", late: true },
    { studentId: "s2", state: "in_progress" },
    { studentId: "s3", state: "reviewed" },
    { studentId: "gone", state: "submitted" },
    { studentId: "s5", state: "mystery" },
  ];
  const s = summarize(rows, ids);
  assert.equal(s.total, 5);
  assert.deepEqual(s.counts, {
    assigned: 2,
    in_progress: 1,
    submitted: 1,
    needs_revision: 0,
    reviewed: 1,
  });
  assert.equal(
    Object.values(s.counts).reduce((a, b) => a + b, 0),
    ids.length,
    "counts add up to the class",
  );
  assert.equal(s.late, 1);
  assert.equal(s.needsReview, 1);
});
