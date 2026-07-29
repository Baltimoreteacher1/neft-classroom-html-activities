-- =============================================================================
-- Usage Signal — D1 schema (the instrument layer)
-- Apply with:  npx wrangler d1 migrations apply neft-student-progress
-- (binding "DB" — same database as student_progress). The Pages Function also
-- creates these tables lazily via CREATE TABLE IF NOT EXISTS, so applying this
-- migration is optional but recommended for an explicit, indexed schema.
--
-- WHY THIS EXISTS
-- The site has ~2000 pages, ~114 games, 200+ lesson configs and dozens of
-- teacher tools, and until now NOTHING reported which of them a student ever
-- opened. scripts/usage-report.mjs was written to answer "what is used, and
-- what has never been touched" but had no data source: student_progress and
-- insight_signal are both empty, and game_scores has only ever received rows
-- from three game ids. That makes "what should I build next?" and "what is
-- safe to delete?" equally unanswerable, which is why the site only grows.
--
-- These two tables are the missing instrument. They record WHICH page was
-- opened and WHETHER it errored — never who opened it.
--
-- PRIVACY POSTURE (non-negotiable, this is student traffic)
--   * No names, no save codes, no roster ids, no IP, no full user-agent.
--   * No free text from the page. `path` is same-origin and length-capped;
--     `section` is a coarse area slug derived from the path, not a class period.
--   * `day` is a UTC date only (no clock time), so rows cannot be correlated
--     into a single student's session timeline.
--   * `device` is a 3-value bucket (desktop/tablet/mobile), not a fingerprint.
-- The result is aggregate-only: countable, never re-identifiable.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- usage_signal — one row per (page, day, device) with an incrementing count.
-- Deliberately an UPSERT-counter, not an event log: an event log of student
-- pageviews would be a de-facto behavioural record of minors. A daily counter
-- answers every question the backlog actually asks ("is this page used?")
-- while being structurally incapable of reconstructing an individual session.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usage_signal (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  path          TEXT NOT NULL,      -- same-origin pathname, capped at 200 chars
  area          TEXT,               -- coarse slug: curriculum | math | games | ...
  day           TEXT NOT NULL,      -- UTC date "YYYY-MM-DD" (no time of day)
  device        TEXT,               -- desktop | tablet | mobile
  views         INTEGER DEFAULT 0,  -- times the page was opened
  dwell_ms_sum  INTEGER DEFAULT 0,  -- summed visible dwell, for a mean
  dwell_n       INTEGER DEFAULT 0,  -- dwell samples (views that reported one)
  updated_at    TEXT NOT NULL
);

-- The upsert key. UNIQUE so ON CONFLICT can increment in one statement.
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_signal_key
  ON usage_signal (path, day, device);

-- "What is used / never used" — the usage-report join, by area then volume.
CREATE INDEX IF NOT EXISTS idx_usage_signal_area
  ON usage_signal (area, day);

-- ---------------------------------------------------------------------------
-- client_error — field JS errors, deduped per (page, message, day).
-- Before this, a student hitting a JS exception was discovered days later when
-- a hand went up. Same counter shape, same privacy posture: the message is
-- truncated and the stack is NOT stored (stacks can contain interpolated
-- student input from template literals).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_error (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  path        TEXT NOT NULL,      -- page that threw, capped at 200 chars
  message     TEXT NOT NULL,      -- error message, capped at 300 chars
  source      TEXT,               -- script url, capped at 200 chars
  line        INTEGER,
  day         TEXT NOT NULL,      -- UTC date "YYYY-MM-DD"
  hits        INTEGER DEFAULT 0,
  first_seen  TEXT NOT NULL,
  last_seen   TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_error_key
  ON client_error (path, message, day);

-- "What is broken right now" — newest, loudest first.
CREATE INDEX IF NOT EXISTS idx_client_error_day
  ON client_error (day, hits);
