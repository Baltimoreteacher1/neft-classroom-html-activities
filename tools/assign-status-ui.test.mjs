// The status buttons offered to learners and teachers (access-practice-lab/src/class/assign-status-ui.js) must be
// exactly the moves the lifecycle rules allow. Run by `npm test`.

import assert from "node:assert/strict";
import test from "node:test";
import {
  learnerActions,
  STATE_TEXT,
  teacherActions,
} from "../access-practice-lab/src/class/assign-status-ui.js";
import {
  nextState,
  STATES,
  STUDENT_ACTIONS,
  TEACHER_ACTIONS,
} from "../shared/class-platform/assignment-lifecycle.js";

const S = (en) => en;
const names = (list) => list.map((a) => a.action);

test("every state has English and Spanish text", () => {
  for (const state of STATES) {
    assert.equal(STATE_TEXT[state].length, 2, state);
    assert.ok(
      STATE_TEXT[state].every((t) => t.length > 2),
      state,
    );
  }
});

test("a learner is offered only moves the rules accept, labelled for where they are", () => {
  assert.deepEqual(learnerActions({ state: "assigned", attempt: 1, attemptsLeft: 2 }, S), [
    { action: "start", label: "Start" },
  ]);
  assert.deepEqual(learnerActions({ state: "in_progress", attempt: 1, attemptsLeft: 2 }, S), [
    { action: "submit", label: "Turn in" },
  ]);
  assert.deepEqual(learnerActions({ state: "submitted", attempt: 1, attemptsLeft: 2 }, S), [
    { action: "start", label: "Try again" },
  ]);
  assert.deepEqual(
    learnerActions({ state: "needs_revision", attempt: 1, attemptsLeft: 0 }, S),
    [{ action: "start", label: "Revise" }],
    "a requested revision is offered even with no tries left",
  );
  assert.deepEqual(
    learnerActions({ state: "reviewed", attempt: 3, attemptsLeft: 0 }, S),
    [],
    "no tries left after review: nothing to press",
  );
  assert.deepEqual(learnerActions({ state: "submitted", attempt: 3, attemptsLeft: 0 }, S), []);
});

test("learner buttons never include a move the rules would refuse, across every state and attempt count", () => {
  for (const state of STATES) {
    for (const attempt of [1, 2, 3]) {
      for (const attemptsLeft of [0, 1, 2]) {
        const offered = names(learnerActions({ state, attempt, attemptsLeft }, S));
        for (const action of STUDENT_ACTIONS) {
          const ok = nextState({
            state,
            attempt,
            action,
            actor: "student",
            attempts: attempt + attemptsLeft,
          }).ok;
          assert.equal(
            offered.includes(action),
            ok,
            `${state} attempt ${attempt} left ${attemptsLeft} ${action}`,
          );
        }
      }
    }
  }
});

test("a teacher is offered review and revise for turned-in work, reassign once started, and nothing before", () => {
  assert.deepEqual(names(teacherActions("assigned", S)), []);
  assert.deepEqual(names(teacherActions("in_progress", S)), ["reassign"]);
  assert.deepEqual(names(teacherActions("submitted", S)), [
    "review",
    "request_revision",
    "reassign",
  ]);
  assert.deepEqual(names(teacherActions("needs_revision", S)), ["reassign"]);
  assert.deepEqual(names(teacherActions("reviewed", S)), ["request_revision", "reassign"]);
  for (const state of STATES) {
    for (const action of TEACHER_ACTIONS) {
      assert.equal(
        names(teacherActions(state, S)).includes(action),
        nextState({ state, attempt: 1, action, actor: "teacher" }).ok,
        `${state} ${action}`,
      );
    }
  }
});
