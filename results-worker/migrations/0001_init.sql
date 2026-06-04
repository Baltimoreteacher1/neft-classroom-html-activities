-- 0001_init.sql · Neft results backend · initial schema
-- D1 (SQLite). Everything namespaced under teacher_id. Multi-teacher from day 1:
-- adding a teacher/class is a row INSERT, never a migration.
-- NO PII: there is deliberately no student name column. Identify a student only
-- by (teacher_id, class_code, student_ref). The teacher maps refs->names off-platform.

CREATE TABLE IF NOT EXISTS teachers (
  teacher_id   TEXT PRIMARY KEY,          -- stable slug, e.g. 'neft'
  display_name TEXT,
  read_key     TEXT NOT NULL,             -- dashboard/export credential (the only real secret)
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS classes (
  teacher_id  TEXT NOT NULL,
  class_code  TEXT NOT NULL,              -- e.g. 'P3-MATH'
  label       TEXT,
  write_key   TEXT NOT NULL,              -- ships in client HTML; NOT secret (see README)
  created_at  TEXT NOT NULL,
  PRIMARY KEY (teacher_id, class_code),
  FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id)
);

CREATE TABLE IF NOT EXISTS results (
  id                 TEXT PRIMARY KEY,     -- client-generated UUID -> idempotent dedupe
  teacher_id         TEXT NOT NULL,
  class_code         TEXT NOT NULL,
  student_ref        TEXT NOT NULL,        -- roster number or handle. NEVER a real name.
  activity_slug      TEXT NOT NULL,
  standard           TEXT,
  score              INTEGER NOT NULL,
  total              INTEGER NOT NULL,
  percent            REAL NOT NULL,
  misconception_tags TEXT NOT NULL DEFAULT '[]',  -- JSON array of tag strings
  attempt_timestamp  TEXT NOT NULL,        -- client clock (ISO 8601)
  synced_at          TEXT NOT NULL,        -- server clock at insert (ISO 8601)
  FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id)
);

-- Covers the debrief/raw-read filter: teacher + class + standard + date range.
CREATE INDEX IF NOT EXISTS idx_results_query
  ON results (teacher_id, class_code, standard, attempt_timestamp);
