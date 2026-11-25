-- 0023_formative.sql — exit-ticket scores and class-level error tallies (BCPSS Language Studio, formative engine).
--
-- ALIAS-ONLY, NO FREE TEXT. A score is (class, ticket, opaque student id, one of three rubric levels, who scored).
-- The student id is the class platform's opaque id (class_platform_student.student_id); no name, initials or
-- alias is stored here. An error tally is (class, unit, error type from the unit's own catalog, week, count):
-- an aggregate that points at no student at all.
--
--   formative_score  one row per class/ticket/student/scorer. The teacher's score and a student's own score
--                    (older bands only) are separate rows, so one never overwrites the other. Re-scoring
--                    upserts the level.
--   formative_error  class-wide counts per week. The count only ever moves through the teacher API and never
--                    drops below zero.
--
-- Both tables carry the class code, so deleting a class removes them and deleting a student alias removes that
-- student's scores (functions/_lib/privacy/tables.js). Additive and idempotent: IF NOT EXISTS throughout.

CREATE TABLE IF NOT EXISTS formative_score (
  class_code   TEXT NOT NULL,
  ticket_id    TEXT NOT NULL CHECK (length(ticket_id) BETWEEN 3 AND 90),
  unit_id      TEXT NOT NULL,
  student_id   TEXT NOT NULL,
  rubric_level TEXT NOT NULL DEFAULT 'emerging' CHECK (rubric_level IN ('emerging', 'developing', 'proficient')),
  scored_by    TEXT NOT NULL DEFAULT 'teacher' CHECK (scored_by IN ('teacher', 'self')),
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  PRIMARY KEY (class_code, ticket_id, student_id, scored_by)
);

CREATE INDEX IF NOT EXISTS formative_score_unit ON formative_score (class_code, unit_id);

CREATE TABLE IF NOT EXISTS formative_error (
  class_code TEXT NOT NULL,
  unit_id    TEXT NOT NULL,
  error_type TEXT NOT NULL CHECK (length(error_type) BETWEEN 3 AND 60),
  week_start TEXT NOT NULL,
  count      INTEGER NOT NULL CHECK (count BETWEEN 0 AND 100000),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (class_code, unit_id, error_type, week_start)
);
