-- 0017_teacher_library.sql — cross-device teacher library (functions/api/class library/*).
--
-- Stores teacher-authored and saved materials (vocab sets, support-engine configs, Book Studio editions,
-- custom pathways) keyed by class code so a teacher opening their class on another device gets their
-- library automatically. No student data is stored here.
--
-- The Pages Function creates this lazily (CREATE TABLE IF NOT EXISTS), so applying this migration is
-- optional and idempotent. It is the schema of record; functions/api/class/library.test.mjs fails if
-- the two differ.

CREATE TABLE IF NOT EXISTS class_platform_teacher_library (
    code TEXT NOT NULL,
    kind TEXT NOT NULL,
    item_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    payload_json TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (code, kind, item_id)
  );

CREATE INDEX IF NOT EXISTS class_platform_tlib_code ON class_platform_teacher_library (code, kind, updated_at);
