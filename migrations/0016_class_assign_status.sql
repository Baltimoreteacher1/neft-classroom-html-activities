-- 0016_class_assign_status.sql — per-learner assignment status (functions/api/class astatus/*).
--
-- A teacher assigns work and sees, for each learner, where it stands: assigned, in progress, submitted, needs
-- revision or reviewed, with the attempt number, a short teacher comment and a log of transitions. A learner
-- reads and moves only their own rows. The rules are in shared/class-platform/assignment-lifecycle.js.
--
-- The Pages Function creates these lazily (CREATE TABLE IF NOT EXISTS), so applying this migration is optional and
-- idempotent. It is the schema of record; functions/api/class/assign-status.test.mjs fails if the two differ.
-- PRIVACY: learners are referenced by class student_id only (a nickname lives in the student row); no free text
-- except the teacher's comment (280 characters). RETENTION: rows go with the learner and with the class.

CREATE TABLE IF NOT EXISTS class_platform_astatus (
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
  );

CREATE INDEX IF NOT EXISTS class_platform_astatus_student ON class_platform_astatus (code, student_id);

CREATE TABLE IF NOT EXISTS class_platform_aevent (
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
  );

CREATE INDEX IF NOT EXISTS class_platform_aevent_student ON class_platform_aevent (code, assignment_id, student_id);
