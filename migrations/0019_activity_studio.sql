-- 0019_activity_studio.sql — Activity Studio: teacher activities, published student copies, revisions and
-- anonymous per-question response counters (functions/_lib/class-platform/activities.js).
--
-- The counters hold only totals per question (correct on first try, correct at the end, revised, hints, how many
-- students chose each wrong option id). No text, names, device ids or session ids are stored.
--
-- The Pages Function creates these lazily (CREATE TABLE IF NOT EXISTS), so applying this migration is
-- optional and idempotent. It is the schema of record; functions/api/class/activities.test.mjs fails if
-- the two differ.

CREATE TABLE IF NOT EXISTS class_platform_activity (
    code TEXT NOT NULL,
    activity_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    kind TEXT NOT NULL,
    grade TEXT NOT NULL DEFAULT '',
    subject TEXT NOT NULL DEFAULT '',
    unit_id TEXT NOT NULL DEFAULT '',
    draft_json TEXT NOT NULL,
    rev INTEGER NOT NULL,
    state TEXT NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'published', 'unpublished')),
    published_json TEXT,
    published_rev INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    published_at INTEGER,
    PRIMARY KEY (code, activity_id)
  );

CREATE UNIQUE INDEX IF NOT EXISTS class_platform_activity_id ON class_platform_activity (activity_id);

CREATE TABLE IF NOT EXISTS class_platform_activity_rev (
    code TEXT NOT NULL,
    activity_id TEXT NOT NULL,
    rev INTEGER NOT NULL,
    saved_at INTEGER NOT NULL,
    json TEXT NOT NULL,
    PRIMARY KEY (code, activity_id, rev)
  );

CREATE TABLE IF NOT EXISTS class_platform_activity_stat (
    activity_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    n INTEGER NOT NULL DEFAULT 0,
    first_correct INTEGER NOT NULL DEFAULT 0,
    final_correct INTEGER NOT NULL DEFAULT 0,
    revised INTEGER NOT NULL DEFAULT 0,
    hints INTEGER NOT NULL DEFAULT 0,
    wrong_json TEXT NOT NULL DEFAULT '{}',
    PRIMARY KEY (activity_id, question_id)
  );
