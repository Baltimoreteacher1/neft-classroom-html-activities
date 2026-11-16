-- 0014_class_book_supports.sql — Book Studio language-support assignments (functions/api/class bsupport/*).
--
-- A teacher publishes an assignment book with language supports and a plan (class default, groups, per-student
-- overrides). The plan stays on the server: a student receives only the supports resolved for them, never the
-- profile number, other groups' supports or classmates' plans. Support-use events and a work snapshot (revisions,
-- first attempts) are stored per student for the teacher's evidence view.
--
-- The Pages Function creates these lazily (CREATE TABLE IF NOT EXISTS), so applying this migration is optional and
-- idempotent. It is the schema of record; functions/api/class/book-supports.test.mjs fails if the two differ.
-- PRIVACY: learners are referenced by class student_id only; everything goes with the class or the learner.

CREATE TABLE IF NOT EXISTS class_platform_bassign (
    code TEXT NOT NULL,
    assignment_id TEXT NOT NULL,
    title TEXT NOT NULL,
    task TEXT NOT NULL DEFAULT '',
    book_json TEXT NOT NULL,
    supports_json TEXT NOT NULL,
    plan_json TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (code, assignment_id)
  );

CREATE TABLE IF NOT EXISTS class_platform_bevent (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    student_id TEXT NOT NULL,
    assignment_id TEXT NOT NULL,
    support_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL DEFAULT '',
    at INTEGER NOT NULL
  );

CREATE INDEX IF NOT EXISTS class_platform_bevent_student ON class_platform_bevent (code, assignment_id, student_id);

CREATE TABLE IF NOT EXISTS class_platform_bwork (
    code TEXT NOT NULL,
    student_id TEXT NOT NULL,
    assignment_id TEXT NOT NULL,
    work_json TEXT NOT NULL,
    texts_json TEXT NOT NULL DEFAULT '[]',
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (code, student_id, assignment_id)
  );
