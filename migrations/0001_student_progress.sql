-- =============================================================================
-- Save / Resume — D1 schema (optional backend)
-- Apply with:  npx wrangler d1 migrations apply neft-student-progress
-- (after adding the [[d1_databases]] binding to wrangler.toml — see
--  SAVE_RESUME_SYSTEM.md). The Pages Function also creates this table lazily
-- via CREATE TABLE IF NOT EXISTS, so applying this migration is optional but
-- recommended for an explicit, indexed schema.
-- =============================================================================

CREATE TABLE IF NOT EXISTS student_progress (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  save_code        TEXT UNIQUE NOT NULL,
  activity_id      TEXT NOT NULL,
  activity_title   TEXT,
  student_name     TEXT,
  section          TEXT,
  state_json       TEXT NOT NULL,
  progress_percent INTEGER DEFAULT 0,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

-- Fast lookup by code (the student-facing key).
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_progress_code
  ON student_progress (save_code);

-- Teacher views: list work per activity / section.
CREATE INDEX IF NOT EXISTS idx_student_progress_activity
  ON student_progress (activity_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_section
  ON student_progress (section);
