/* =============================================================================
 * Schema for Book Studio language-support assignments (teacher-authored supports
 * delivered per student, support-use events, student work snapshots). Schema of
 * record: migrations/0014_class_book_supports.sql; the endpoint also creates
 * these lazily (store.js ensureSchema), and functions/api/class/book-supports.test.mjs
 * fails if the two differ.
 * ========================================================================== */

export const BOOK_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS class_platform_bassign (
    code TEXT NOT NULL,
    assignment_id TEXT NOT NULL,
    title TEXT NOT NULL,
    task TEXT NOT NULL DEFAULT '',
    book_json TEXT NOT NULL,
    supports_json TEXT NOT NULL,
    plan_json TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (code, assignment_id)
  )`,
  `CREATE TABLE IF NOT EXISTS class_platform_bevent (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    student_id TEXT NOT NULL,
    assignment_id TEXT NOT NULL,
    support_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL DEFAULT '',
    at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS class_platform_bevent_student ON class_platform_bevent (code, assignment_id, student_id)`,
  `CREATE TABLE IF NOT EXISTS class_platform_bwork (
    code TEXT NOT NULL,
    student_id TEXT NOT NULL,
    assignment_id TEXT NOT NULL,
    work_json TEXT NOT NULL,
    texts_json TEXT NOT NULL DEFAULT '[]',
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (code, student_id, assignment_id)
  )`,
];

export const bookPruneStatements = (db, now, goneClassesSql) => [
  db.prepare(`DELETE FROM class_platform_bevent WHERE code IN (${goneClassesSql})`).bind(now),
  db.prepare(`DELETE FROM class_platform_bwork WHERE code IN (${goneClassesSql})`).bind(now),
  db.prepare(`DELETE FROM class_platform_bassign WHERE code IN (${goneClassesSql})`).bind(now),
];
