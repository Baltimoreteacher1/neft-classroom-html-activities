-- =============================================================================
-- Progress ← Student link (the "/today" resume layer)
-- Apply with:  npx wrangler d1 migrations apply neft-student-progress
-- (binding "DB" — same database as student_progress + class_roster). The Pages
-- Function also adds these columns lazily, so applying this migration is
-- optional but recommended for an explicit, indexed schema.
--
-- WHY THIS EXISTS
-- `save_code` is UNIQUE and every row is ONE activity — the code prefix is even
-- derived from the activity ("MATH-7KQ2"). A student who touches five lessons
-- therefore holds five unrelated codes, and nothing in the schema links those
-- rows together. That makes "pick up where you left off" impossible to answer:
-- there is no way to ask "what does this student have going?"
--
-- These columns add that link, keyed on the identity we ALREADY maintain —
-- class_roster's (code, student_id), which is stable across roster re-uploads.
-- Purely additive: save_code stays UNIQUE and stays the per-activity key, so
-- every resume code already written in a student's notebook keeps working, and
-- older clients that don't send the new fields keep saving exactly as before.
--
-- PRIVACY: student_id is a server-issued opaque id and class_code is a join
-- code. Neither is new PII — both already exist in class_roster.
-- =============================================================================

ALTER TABLE student_progress ADD COLUMN student_id TEXT;
ALTER TABLE student_progress ADD COLUMN class_code TEXT;

-- The record already carries its own pathname client-side but never stored it,
-- so a resume list had no way to link back to the page. Store it.
ALTER TABLE student_progress ADD COLUMN activity_url TEXT;

-- The one query /api/progress/mine runs: "this student's work, newest first."
CREATE INDEX IF NOT EXISTS idx_student_progress_student
  ON student_progress (class_code, student_id, updated_at DESC);
