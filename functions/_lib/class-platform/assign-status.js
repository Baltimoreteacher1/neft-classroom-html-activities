/* =============================================================================
 * Assignment status for a Language Page class: where each learner stands on each assignment, the teacher's comment,
 * and a short log of transitions. The rules (who may move what, attempts, late) are in
 * shared/class-platform/assignment-lifecycle.js; this module only enforces them against the database.
 *
 * Routes (/api/class/astatus/*):
 *   POST act      { code, assignmentId, action, studentId?, comment? }   learner: start | submit (their own row)
 *                                                                        teacher: review | request_revision | reassign
 *   GET  mine?code=                                                     learner -> their rows for released work
 *   GET  board?code=                                                    teacher -> every assignment x learner
 *   GET  history?code=&assignmentId=&studentId=                         teacher -> that learner's transition log
 *
 * A learner can read and move only their own rows; a draft or not-yet-available assignment is invisible to them.
 * Status is practice tracking, never a grade.
 * ========================================================================== */

import {
  DEFAULT_ATTEMPTS,
  isAvailable,
  isLate,
  nextState,
  STUDENT_ACTIONS,
  summarize,
} from "../../../shared/class-platform/assignment-lifecycle.js";
import { cleanText, isStudentId } from "../../../shared/class-platform/contract.js";
import { parseJson, studentFromRequest, teacherRole } from "./store.js";

export const MAX_COMMENT = 280;
const MAX_EVENTS = 40;
const ASSIGNMENT_ID = /^[a-z0-9][a-z0-9:_-]{0,39}$/;
const today = (now) => new Date(now).toISOString().slice(0, 10);

const statusOf = (row, assignment) => ({
  assignmentId: assignment.id,
  studentId: row?.student_id,
  state: row?.state || "assigned",
  attempt: Number(row?.attempt) || 1,
  late: Boolean(row?.late),
  comment: row?.comment || "",
  updatedAt: row ? Number(row.updated_at) : 0,
});

const errorStatus = (error) => (error === "forbidden-actor" ? 403 : 409);

export async function handleAssignStatus(ctx, action) {
  const { db, body, url, now, method, fail, request, env } = ctx;
  const found = await ctx.requireClass(
    db,
    method === "GET" ? url.searchParams.get("code") : body?.code,
    now,
  );
  if (found.error) return found.error;
  const { cls } = found;
  if (cls.app !== "language") return fail("invalid-app");
  const teacher = await teacherRole(request, env, cls);
  const student = teacher ? null : await studentFromRequest(request, db, cls);
  if (!teacher && !student) return fail("unauthorized", 401);
  const assignments = parseJson(cls.settings_json, {}).assignments || [];
  const key = `${method} ${action}`;

  if (key === "POST act") {
    const assignment = assignments.find((a) => a.id === body?.assignmentId);
    if (!ASSIGNMENT_ID.test(String(body?.assignmentId ?? "")) || !assignment)
      return fail("assignment-not-found", 404);
    const actor = teacher ? "teacher" : "student";
    let studentId;
    if (student) {
      if (body?.studentId != null && body.studentId !== student.student_id)
        return fail("forbidden", 403);
      if (!STUDENT_ACTIONS.includes(body?.action)) return fail("forbidden-actor", 403);
      if (!isAvailable(assignment, today(now))) return fail("not-available", 409);
      studentId = student.student_id;
    } else {
      if (!isStudentId(body?.studentId)) return fail("invalid-student");
      const known = await db
        .prepare(`SELECT 1 AS x FROM class_platform_student WHERE code = ? AND student_id = ?`)
        .bind(cls.code, body.studentId)
        .first();
      if (!known) return fail("not-found", 404);
      studentId = body.studentId;
    }
    const current = await db
      .prepare(
        `SELECT * FROM class_platform_astatus WHERE code = ? AND assignment_id = ? AND student_id = ?`,
      )
      .bind(cls.code, assignment.id, studentId)
      .first();
    const from = current?.state || "assigned";
    const step = nextState({
      state: from,
      attempt: Number(current?.attempt) || 1,
      action: body?.action,
      actor,
      attempts: assignment.attempts || DEFAULT_ATTEMPTS,
    });
    if (!step.ok) return fail(step.error, errorStatus(step.error));

    const submitting = body.action === "submit";
    const reassigning = body.action === "reassign";
    // Only a teacher action writes the comment; a learner moving their own work must not erase the feedback they act on.
    const comment = teacher
      ? reassigning
        ? ""
        : cleanText(body?.comment, MAX_COMMENT)
      : (current?.comment ?? "");
    if (teacher && typeof body?.comment === "string" && body.comment.length > MAX_COMMENT)
      return fail("comment-too-long");
    const late = submitting
      ? isLate(assignment.due, now)
      : reassigning
        ? false
        : Boolean(current?.late);
    await db.batch([
      db
        .prepare(
          `INSERT INTO class_platform_astatus
             (code, assignment_id, student_id, state, attempt, late, comment, started_at, submitted_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(code, assignment_id, student_id) DO UPDATE SET
             state = excluded.state, attempt = excluded.attempt, late = excluded.late,
             comment = excluded.comment, started_at = COALESCE(class_platform_astatus.started_at, excluded.started_at),
             submitted_at = excluded.submitted_at, updated_at = excluded.updated_at`,
        )
        .bind(
          cls.code,
          assignment.id,
          studentId,
          step.state,
          step.attempt,
          late ? 1 : 0,
          comment,
          step.state === "in_progress" ? now : null,
          submitting ? now : reassigning ? null : (current?.submitted_at ?? null),
          now,
        ),
      db
        .prepare(
          `INSERT INTO class_platform_aevent (code, assignment_id, student_id, action, from_state, to_state, attempt, actor, at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          cls.code,
          assignment.id,
          studentId,
          body.action,
          from,
          step.state,
          step.attempt,
          actor,
          now,
        ),
      db
        .prepare(
          `DELETE FROM class_platform_aevent WHERE code = ? AND assignment_id = ? AND student_id = ?
             AND event_id NOT IN (SELECT event_id FROM class_platform_aevent WHERE code = ? AND assignment_id = ? AND student_id = ?
               ORDER BY event_id DESC LIMIT ${MAX_EVENTS})`,
        )
        .bind(cls.code, assignment.id, studentId, cls.code, assignment.id, studentId),
    ]);
    return {
      ok: true,
      status: {
        assignmentId: assignment.id,
        studentId,
        state: step.state,
        attempt: step.attempt,
        late,
        comment,
        updatedAt: now,
      },
    };
  }

  if (key === "GET mine") {
    if (!student) return fail("students-only", 403);
    const released = assignments.filter((a) => isAvailable(a, today(now)));
    const rows = await db
      .prepare(`SELECT * FROM class_platform_astatus WHERE code = ? AND student_id = ?`)
      .bind(cls.code, student.student_id)
      .all();
    const byId = new Map((rows.results || []).map((r) => [r.assignment_id, r]));
    return {
      ok: true,
      statuses: released.map((a) => {
        const s = statusOf(byId.get(a.id), a);
        const attempts = a.attempts || DEFAULT_ATTEMPTS;
        return {
          assignmentId: a.id,
          state: s.state,
          attempt: s.attempt,
          late: s.late,
          comment: s.comment,
          updatedAt: s.updatedAt,
          attemptsLeft: Math.max(0, attempts - s.attempt),
        };
      }),
    };
  }

  if (key === "GET board") {
    if (!teacher) return fail("unauthorized", 401);
    const kids = await db
      .prepare(`SELECT student_id, alias FROM class_platform_student WHERE code = ? ORDER BY alias`)
      .bind(cls.code)
      .all();
    const rows = await db
      .prepare(`SELECT * FROM class_platform_astatus WHERE code = ?`)
      .bind(cls.code)
      .all();
    const students = kids.results || [];
    const ids = students.map((s) => s.student_id);
    return {
      ok: true,
      students: students.length,
      assignments: assignments.map((a) => {
        const mine = (rows.results || []).filter((r) => r.assignment_id === a.id);
        const byStudent = new Map(mine.map((r) => [r.student_id, r]));
        const entries = students.map((s) => ({
          alias: s.alias,
          ...statusOf(byStudent.get(s.student_id) || { student_id: s.student_id }, a),
          studentId: s.student_id,
        }));
        return {
          id: a.id,
          title: a.title,
          due: a.due ?? null,
          draft: a.draft === true,
          availableFrom: a.availableFrom ?? null,
          attempts: a.attempts || DEFAULT_ATTEMPTS,
          supports: a.supports ?? null,
          summary: summarize(
            mine.map((r) => ({ studentId: r.student_id, state: r.state, late: Boolean(r.late) })),
            ids,
          ),
          students: entries,
        };
      }),
    };
  }

  if (key === "GET history") {
    if (!teacher) return fail("unauthorized", 401);
    const assignmentId = url.searchParams.get("assignmentId");
    const studentId = url.searchParams.get("studentId");
    if (!ASSIGNMENT_ID.test(String(assignmentId ?? "")) || !isStudentId(studentId))
      return fail("invalid-request");
    const res = await db
      .prepare(
        `SELECT action, from_state, to_state, attempt, actor, at FROM class_platform_aevent
         WHERE code = ? AND assignment_id = ? AND student_id = ? ORDER BY event_id`,
      )
      .bind(cls.code, assignmentId, studentId)
      .all();
    return {
      ok: true,
      events: (res.results || []).map((e) => ({
        action: e.action,
        from: e.from_state,
        to: e.to_state,
        attempt: Number(e.attempt),
        actor: e.actor,
        at: Number(e.at),
      })),
    };
  }

  return fail("not-found", 404);
}
