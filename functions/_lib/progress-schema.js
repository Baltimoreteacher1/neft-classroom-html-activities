/**
 * student_progress schema ownership.
 *
 * Dual mechanisms exist on purpose:
 *   migrations/0001 + 0007  — explicit D1 apply (recommended, indexed)
 *   lazy ALTER / CREATE     — so a database that has not had the migration
 *                             still serves save/resume
 *
 * They must name the SAME columns. Admin columns and lesson_telemetry have
 * no matching migration: they are runtime-only by design (teacher tooling
 * and fire-and-forget telemetry). Do not "unify" those into a production
 * migration from this file — that is a production-authorization decision.
 *
 * Production D1 is not modified by importing this module.
 */
export const STUDENT_PROGRESS_TABLE = "student_progress";

/** Columns created by migrations/0001_student_progress.sql and ensureSchema(). */
export const STUDENT_PROGRESS_BASE_COLUMNS = Object.freeze([
  "id",
  "save_code",
  "activity_id",
  "activity_title",
  "student_name",
  "section",
  "state_json",
  "progress_percent",
  "created_at",
  "updated_at",
]);

/** Columns added by migrations/0007_progress_student_link.sql and ensureStudentLinkColumns(). */
export const STUDENT_LINK_COLUMNS = Object.freeze(["student_id", "class_code", "activity_url"]);

/** Runtime-only (ensureAdminColumns). No matching migration. */
export const ADMIN_COLUMNS = Object.freeze([
  "manual_grade",
  "teacher_note",
  "exemplar_approved",
  "exemplar_note",
]);

export const TELEMETRY_TABLE = "lesson_telemetry";
export const FAMILY_SIGNOFF_TABLE = "family_signoff";

export const STUDENT_LINK_INDEX_SQL = `CREATE INDEX IF NOT EXISTS idx_student_progress_student
           ON student_progress (class_code, student_id, updated_at DESC)`;
