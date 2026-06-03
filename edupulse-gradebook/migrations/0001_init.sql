-- edupulse-gradebook — initial schema
-- D1 (SQLite). One row per scored activity event.
-- event_id is the PRIMARY KEY; ingestion uses INSERT OR IGNORE for idempotent
-- dedupe (replaying the same eventId is a no-op).

CREATE TABLE IF NOT EXISTS scores (
  event_id           TEXT PRIMARY KEY,
  ts                 TEXT,            -- client event time (ISO 8601)
  received_at        TEXT,           -- server receive time (ISO 8601)
  device_id          TEXT,
  student_id         TEXT,
  student_name       TEXT,
  class_period       TEXT,
  activity_id        TEXT,
  activity_title     TEXT,
  standard           TEXT,
  score              REAL,
  max_score          REAL,
  percent            REAL,
  stars              INTEGER,
  problems_correct   INTEGER,
  problems_attempted INTEGER,
  misconceptions     TEXT,           -- pipe-delimited list, e.g. "A|B|C"
  duration_sec       INTEGER
);

CREATE INDEX IF NOT EXISTS idx_scores_standard     ON scores (standard);
CREATE INDEX IF NOT EXISTS idx_scores_student_id   ON scores (student_id);
CREATE INDEX IF NOT EXISTS idx_scores_class_period ON scores (class_period);
CREATE INDEX IF NOT EXISTS idx_scores_ts           ON scores (ts);
