// Assignment lifecycle rules for a class: who may move a learner's assignment from which state to which, how many
// attempts a learner gets, and what counts as late. Pure functions (no DOM, no storage, no network): the server
// (functions/_lib/class-platform/assign-status.js) enforces them and the pages only mirror them.
//
// "Draft" is a flag on the assignment (the teacher has not released it), not a per-learner state.
// Per-learner states: assigned -> in_progress -> submitted -> reviewed, plus needs_revision when the teacher asks for
// another try. A teacher can reassign at any point. This is practice tracking, never a grade.

export const STATES = Object.freeze([
  "assigned",
  "in_progress",
  "submitted",
  "needs_revision",
  "reviewed",
]);
export const STUDENT_ACTIONS = Object.freeze(["start", "submit"]);
export const TEACHER_ACTIONS = Object.freeze(["review", "request_revision", "reassign"]);

export const DEFAULT_ATTEMPTS = 3;
export const MAX_ATTEMPTS = 5;
/** A support level per domain, in the same 1..6 range as the shared support engine (src/support-engine/engine.js). */
export const MAX_SUPPORT_LEVEL = 6;
export const SUPPORT_DOMAINS = Object.freeze(["listening", "speaking", "reading", "writing"]);
/**
 * A due date means the end of that day anywhere in the US. Dates are compared against 00:00 UTC of the due date plus
 * 34 hours (24 for the day, 10 for Hawaii), so a learner turning work in at 8 pm in New York is never marked late.
 */
export const LATE_AFTER_HOURS = 34;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const dateOnly = (value) =>
  typeof value === "string" &&
  DATE_RE.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
    ? value
    : null;

/**
 * Validate the optional lifecycle fields of one assignment. Missing fields take their defaults, so an assignment
 * written before this feature existed still validates and behaves as it always did.
 * @returns {{ ok: true, value: { availableFrom: string|null, attempts: number, draft: boolean, supports: object|null } } | { ok: false, error: string }}
 */
export function cleanAssignmentExtras(raw = {}) {
  const extras = raw && typeof raw === "object" ? raw : {};
  let availableFrom = null;
  if (extras.availableFrom != null) {
    availableFrom = dateOnly(extras.availableFrom);
    if (!availableFrom) return { ok: false, error: "invalid-available-from" };
  }
  let attempts = DEFAULT_ATTEMPTS;
  if (extras.attempts != null) {
    if (!Number.isInteger(extras.attempts) || extras.attempts < 1 || extras.attempts > MAX_ATTEMPTS)
      return { ok: false, error: "invalid-attempts" };
    attempts = extras.attempts;
  }
  if (extras.draft != null && typeof extras.draft !== "boolean")
    return { ok: false, error: "invalid-draft" };
  let supports = null;
  if (extras.supports != null) {
    const s = extras.supports;
    if (!s || typeof s !== "object" || Array.isArray(s))
      return { ok: false, error: "invalid-supports" };
    supports = {};
    for (const d of SUPPORT_DOMAINS) {
      if (s[d] == null) continue;
      if (!Number.isInteger(s[d]) || s[d] < 1 || s[d] > MAX_SUPPORT_LEVEL)
        return { ok: false, error: "invalid-supports" };
      supports[d] = s[d];
    }
    if (!Object.keys(supports).length) supports = null;
  }
  return { ok: true, value: { availableFrom, attempts, draft: extras.draft === true, supports } };
}

/** Learners see an assignment only when it is released and its start date has come. `today` is YYYY-MM-DD (UTC). */
export function isAvailable(assignment, today) {
  if (assignment?.draft === true) return false;
  const from = dateOnly(assignment?.availableFrom);
  return !(from && today < from);
}

/** Late work is accepted and flagged, never refused. */
export function isLate(due, nowMs) {
  const d = dateOnly(due);
  return Boolean(d) && nowMs > Date.parse(`${d}T00:00:00Z`) + LATE_AFTER_HOURS * 3_600_000;
}

/**
 * The one transition function. `actor` is "student" or "teacher".
 * A learner may start again after submitting only while attempts remain; a teacher's revision request and a
 * teacher's reassignment never use up the learner's attempts limit.
 * @returns {{ ok: true, state: string, attempt: number } | { ok: false, error: string }}
 */
export function nextState({
  state = "assigned",
  attempt = 1,
  action,
  actor,
  attempts = DEFAULT_ATTEMPTS,
}) {
  if (!STATES.includes(state) || !Number.isInteger(attempt) || attempt < 1)
    return { ok: false, error: "invalid-state" };
  const studentAction = STUDENT_ACTIONS.includes(action);
  const teacherAction = TEACHER_ACTIONS.includes(action);
  if (!studentAction && !teacherAction) return { ok: false, error: "invalid-action" };
  if ((studentAction && actor !== "student") || (teacherAction && actor !== "teacher"))
    return { ok: false, error: "forbidden-actor" };

  switch (action) {
    case "start":
      if (state === "assigned") return { ok: true, state: "in_progress", attempt };
      if (state === "needs_revision")
        return { ok: true, state: "in_progress", attempt: attempt + 1 };
      if (state === "submitted" || state === "reviewed") {
        return attempt < attempts
          ? { ok: true, state: "in_progress", attempt: attempt + 1 }
          : { ok: false, error: "attempts-used" };
      }
      return { ok: false, error: "invalid-transition" };
    case "submit":
      return state === "in_progress"
        ? { ok: true, state: "submitted", attempt }
        : { ok: false, error: "invalid-transition" };
    case "review":
      return state === "submitted"
        ? { ok: true, state: "reviewed", attempt }
        : { ok: false, error: "invalid-transition" };
    case "request_revision":
      return state === "submitted" || state === "reviewed"
        ? { ok: true, state: "needs_revision", attempt }
        : { ok: false, error: "invalid-transition" };
    case "reassign":
      return state === "assigned"
        ? { ok: false, error: "invalid-transition" }
        : { ok: true, state: "assigned", attempt: attempt + 1 };
    default:
      return { ok: false, error: "invalid-action" };
  }
}

/**
 * Class view for one assignment: how many learners are in each state. A learner with no record has not started.
 * @param {Array<{ studentId: string, state: string, late?: boolean }>} rows
 * @param {string[]} studentIds everyone in the class
 */
export function summarize(rows, studentIds) {
  const counts = Object.fromEntries(STATES.map((s) => [s, 0]));
  const byStudent = new Map(rows.map((r) => [r.studentId, r]));
  let late = 0;
  for (const id of studentIds) {
    const row = byStudent.get(id);
    counts[row && STATES.includes(row.state) ? row.state : "assigned"] += 1;
    if (row?.late) late += 1;
  }
  return { total: studentIds.length, counts, late, needsReview: counts.submitted };
}
