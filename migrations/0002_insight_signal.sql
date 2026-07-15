-- =============================================================================
-- Insight Signal — D1 schema (the "second brain" substrate layer)
-- Apply with:  npx wrangler d1 migrations apply neft-student-progress
-- (binding "DB" — same database as student_progress). The Pages Function also
-- creates this table lazily via CREATE TABLE IF NOT EXISTS, so applying this
-- migration is optional but recommended for an explicit, indexed schema.
--
-- WHY THIS EXISTS
-- Insight Brief computes a rich per-student diagnosis (tier, risk, weak
-- standards, misconception counts) from the /api/progress analytics on every
-- open — then throws it away when the tab closes. This table captures that
-- diagnosis as a timestamped SNAPSHOT so the signal becomes longitudinal and
-- joinable (student -> standard/misconception -> over time), instead of a
-- single ephemeral view. It stores only DERIVED signal (counts + tier), never
-- raw student work text. Teacher-gated, closed by default — same posture as
-- student_progress / lesson_telemetry.
-- =============================================================================

CREATE TABLE IF NOT EXISTS insight_signal (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  captured_at           TEXT NOT NULL,      -- ISO time the snapshot was taken
  section               TEXT,               -- class period / section
  student_name          TEXT,               -- roster name (as in student_progress)
  tier                  TEXT,               -- support | watch | on-track | enrichment | no-data
  risk                  INTEGER DEFAULT 0,  -- engine risk score
  activities            INTEGER DEFAULT 0,  -- activities with data in the window
  struggles             INTEGER DEFAULT 0,  -- struggle + hint-exhausted + low-score events
  misconceptions        INTEGER DEFAULT 0,  -- misconception events
  avg_score             INTEGER,            -- rolling average (nullable when no graded work)
  weak_standards_json   TEXT,               -- {"6.RP.A.3": 2, ...} standard -> weakness count
  mastery_standards_json TEXT,              -- ["6.NS.B.4", ...] standards shown as mastered
  source                TEXT DEFAULT 'insight-brief'
);

-- Longitudinal reads: a section's snapshots over time (the class trajectory).
CREATE INDEX IF NOT EXISTS idx_insight_signal_section
  ON insight_signal (section, captured_at);

-- Per-student trajectory (the longitudinal student model).
CREATE INDEX IF NOT EXISTS idx_insight_signal_student
  ON insight_signal (student_name, captured_at);
