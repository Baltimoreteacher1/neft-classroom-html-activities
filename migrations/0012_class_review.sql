-- 0012_class_review.sql — the class scoring queue (functions/_lib/class-platform/review.js).
--
-- A learner in a Language Page class may share one finished writing sample with the
-- teacher (class_platform_work); the teacher reviews a sample or a shared recording
-- with practice-rubric descriptor chips and a short comment (class_platform_review).
--
-- Like 0011, the Pages Function creates these lazily (CREATE TABLE IF NOT EXISTS), so
-- applying this migration is optional and idempotent. It is the schema of record, and
-- functions/api/class/class.test.mjs fails if it and REVIEW_SCHEMA differ.
--
-- PRIVACY: no names; rows key on the class code and the class-local student id.
-- chips_json holds practice-rubric dimension ids and 0-3 ratings from content/rubrics,
-- never a WIDA level or score. RETENTION: writing samples follow the 30-day audio
-- retention; a review goes with the item it answers and with its class.

CREATE TABLE IF NOT EXISTS class_platform_work (
    work_id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    student_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    label TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );

CREATE INDEX IF NOT EXISTS class_platform_work_student ON class_platform_work (code, student_id);

CREATE TABLE IF NOT EXISTS class_platform_review (
    code TEXT NOT NULL,
    item_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    rubric TEXT NOT NULL,
    chips_json TEXT NOT NULL DEFAULT '{}',
    comment TEXT NOT NULL DEFAULT '',
    reviewed_at INTEGER NOT NULL,
    PRIMARY KEY (code, item_id)
  );

CREATE INDEX IF NOT EXISTS class_platform_review_student ON class_platform_review (code, student_id);
