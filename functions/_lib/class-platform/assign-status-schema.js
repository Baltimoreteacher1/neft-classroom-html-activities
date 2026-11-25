/* =============================================================================
 * Schema for class assignment status (per learner: where each assignment stands, the attempt, a teacher comment,
 * and a short log of transitions). Schema of record: migrations/0016_class_assign_status.sql; the endpoint also
 * creates these lazily (store.js ensureSchema), and functions/api/class/assign-status.test.mjs fails if the two
 * differ. The rules live in shared/class-platform/assignment-lifecycle.js.
 * ========================================================================== */

export const ASSIGN_STATUS_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS class_platform_astatus (
    code TEXT NOT NULL,
    assignment_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    state TEXT NOT NULL,
    attempt INTEGER NOT NULL DEFAULT 1,
    late INTEGER NOT NULL DEFAULT 0,
    comment TEXT NOT NULL DEFAULT '',
    started_at INTEGER,
    submitted_at INTEGER,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (code, assignment_id, student_id)
  )`,
  `CREATE INDEX IF NOT EXISTS class_platform_astatus_student ON class_platform_astatus (code, student_id)`,
  `CREATE TABLE IF NOT EXISTS class_platform_aevent (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    assignment_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    action TEXT NOT NULL,
    from_state TEXT NOT NULL,
    to_state TEXT NOT NULL,
    attempt INTEGER NOT NULL,
    actor TEXT NOT NULL,
    at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS class_platform_aevent_student ON class_platform_aevent (code, assignment_id, student_id)`,
];

export const astatusPruneStatements = (db, now, goneClassesSql) => [
  db.prepare(`DELETE FROM class_platform_aevent WHERE code IN (${goneClassesSql})`).bind(now),
  db.prepare(`DELETE FROM class_platform_astatus WHERE code IN (${goneClassesSql})`).bind(now),
];
