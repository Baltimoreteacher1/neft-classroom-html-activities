// D1 access for the formative engine (migration 0023). Every statement is scoped by class code. Student ids are
// checked against the class roster before anything is written, so an unknown id (or a name typed into the id
// field) can never reach a row.
import { weekStart } from "../../../shared/formative/constants.js";

const rows = async (stmt) => (await stmt.all()).results || [];

/** Opaque student ids on a class roster. */
export async function rosterIds(db, code) {
  const list = await rows(
    db.prepare("SELECT student_id FROM class_platform_student WHERE code = ?1").bind(code),
  );
  return new Set(list.map((r) => r.student_id));
}

/**
 * Set (or with level === null clear) one scorer's levels. Re-scoring upserts: created_at keeps the first time,
 * updated_at moves. One batch, so a call is all-or-nothing.
 * @param {{ studentId: string, level: string | null }[]} entries
 */
export async function writeScores(db, { code, ticketId, unitId, by, entries, now }) {
  const upsert = `INSERT INTO formative_score (class_code, ticket_id, unit_id, student_id, rubric_level, scored_by, created_at, updated_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7)
    ON CONFLICT (class_code, ticket_id, student_id, scored_by)
    DO UPDATE SET rubric_level = excluded.rubric_level, updated_at = excluded.updated_at`;
  const clear = `DELETE FROM formative_score WHERE class_code = ?1 AND ticket_id = ?2 AND student_id = ?3 AND scored_by = ?4`;
  await db.batch(
    entries.map((e) =>
      e.level
        ? db.prepare(upsert).bind(code, ticketId, unitId, e.studentId, e.level, by, now)
        : db.prepare(clear).bind(code, ticketId, e.studentId, by),
    ),
  );
}

/** [{ studentId, level, by, updatedAt }] for one ticket. */
export async function readScores(db, code, ticketId) {
  const list = await rows(
    db
      .prepare(
        `SELECT student_id, rubric_level, scored_by, updated_at FROM formative_score
         WHERE class_code = ?1 AND ticket_id = ?2 ORDER BY student_id, scored_by`,
      )
      .bind(code, ticketId),
  );
  return list.map((r) => ({
    studentId: r.student_id,
    level: r.rubric_level,
    by: r.scored_by,
    updatedAt: Number(r.updated_at),
  }));
}

/**
 * Add (or subtract) class-wide error counts for the current week. A tally never goes below zero.
 * @param {{ type: string, count: number }[]} deltas
 */
export async function bumpErrors(db, { code, unitId, deltas, now }) {
  const week = weekStart(now);
  const sql = `INSERT INTO formative_error (class_code, unit_id, error_type, week_start, count, updated_at)
    VALUES (?1, ?2, ?3, ?4, MAX(0, ?5), ?6)
    ON CONFLICT (class_code, unit_id, error_type, week_start)
    DO UPDATE SET count = MAX(0, count + ?5), updated_at = ?6`;
  await db.batch(deltas.map((d) => db.prepare(sql).bind(code, unitId, d.type, week, d.count, now)));
  return week;
}

/** [{ errorType, weekStart, count }] for one unit, oldest week first. */
export async function readErrors(db, code, unitId, sinceWeek = "0000-00-00") {
  const list = await rows(
    db
      .prepare(
        `SELECT error_type, week_start, count FROM formative_error
         WHERE class_code = ?1 AND unit_id = ?2 AND week_start >= ?3 ORDER BY week_start, error_type`,
      )
      .bind(code, unitId, sinceWeek),
  );
  return list.map((r) => ({
    errorType: r.error_type,
    weekStart: r.week_start,
    count: Number(r.count),
  }));
}
