-- 0021_class_platform_experience.sql — schema of record for class_platform_experience.
--
-- functions/_lib/class-platform/store.js (EXPERIENCE_SCHEMA) has always created this table lazily;
-- it was never written down as a migration, so the table list derived from migrations/ missed it and
-- a class delete test built from that list could not see it. The statements are identical to the lazy
-- ones and idempotent. It holds the validated mission definition an instructor published to a class:
-- teacher content, no student data.

CREATE TABLE IF NOT EXISTS class_platform_experience (
    experience_id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    def_json TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

CREATE INDEX IF NOT EXISTS class_platform_experience_code ON class_platform_experience (code);
