-- =============================================================================
-- Class Roster — D1 schema (cross-device identity layer)
-- Apply with:  npx wrangler d1 migrations apply neft-student-progress
-- (binding "DB" — same database as student_progress). The Pages Function also
-- creates this table lazily via CREATE TABLE IF NOT EXISTS, so applying this
-- migration is optional but recommended for an explicit, indexed schema.
--
-- WHY THIS EXISTS
-- Student identity today is device-bound: the typed name lives only in each
-- browser's localStorage, so a student on a different Chromebook loses their
-- identity (and with it progress continuity). This table lets a teacher sync a
-- class list (first name + last initial ONLY — never full legal names) under a
-- short join code. Any device can then fetch the name list with the code and
-- the student picks their name — same name every time, on every device.
-- Reads are rate-limited; writes are TEACHER_KEY-gated (same posture as
-- /api/board). Codes are unguessable 6-char strings from the save-code
-- alphabet (no 0/O/1/I/L).
-- =============================================================================

CREATE TABLE IF NOT EXISTS class_roster (
  code         TEXT NOT NULL,      -- join code, e.g. "MK7Q9C"
  student_id   TEXT NOT NULL,      -- stable server-issued id (survives re-uploads)
  student_name TEXT NOT NULL,      -- "First L." — never a full legal name
  section      TEXT NOT NULL,      -- class period label, e.g. "601"
  created_at   INTEGER NOT NULL DEFAULT 0,
  updated_at   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (code, student_id)
);

-- Student join flow: fetch the whole class list by code.
CREATE INDEX IF NOT EXISTS idx_class_roster_code
  ON class_roster (code);

-- Per-IP read guard (anti-enumeration), mirrors board_codes_guard.
CREATE TABLE IF NOT EXISTS class_roster_guard (
  ip     TEXT NOT NULL,
  bucket INTEGER NOT NULL,
  hits   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip, bucket)
);
