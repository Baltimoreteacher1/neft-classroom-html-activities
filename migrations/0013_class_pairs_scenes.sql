-- 0013_class_pairs_scenes.sql — class social features (functions/api/class pairs/* and scenes/*).
--
-- Peer listening pairs: the teacher turns pairs on and sets groups of 2-3; a learner shares a short take
-- (<= 60 s, <= 700 KB, D1 BLOB like class_platform_audio) with their partner only; the partner answers one
-- listener question and taps one reaction from a fixed list. Takes expire after 14 days.
-- Student-made scenes: a learner submits a short scene; only the teacher sees it until it is approved.
--
-- The Pages Function creates these lazily (CREATE TABLE IF NOT EXISTS), so applying this migration is optional
-- and idempotent. It is the schema of record; functions/api/class/social.test.mjs fails if the two differ.
-- PRIVACY: learners are referenced by class student_id only. Free text is length-limited and refuses emails,
-- phone numbers and links (shared/class-platform/social.js). Everything goes with the class or the learner.

CREATE TABLE IF NOT EXISTS class_platform_pairing (
    code TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 0,
    groups_json TEXT NOT NULL DEFAULT '[]',
    updated_at INTEGER NOT NULL
  );

CREATE TABLE IF NOT EXISTS class_platform_take (
    take_id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    student_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    task_title TEXT NOT NULL,
    question_id TEXT NOT NULL,
    seconds INTEGER NOT NULL,
    mime TEXT NOT NULL,
    bytes BLOB NOT NULL,
    size INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );

CREATE INDEX IF NOT EXISTS class_platform_take_code ON class_platform_take (code, expires_at);

CREATE TABLE IF NOT EXISTS class_platform_take_reply (
    take_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    answer TEXT NOT NULL,
    reaction TEXT NOT NULL,
    landed INTEGER,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (take_id, student_id)
  );

CREATE TABLE IF NOT EXISTS class_platform_scene (
    scene_id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    student_id TEXT NOT NULL,
    status TEXT NOT NULL,
    scene_json TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    audio_mime TEXT,
    audio BLOB,
    audio_size INTEGER NOT NULL DEFAULT 0,
    audio_expires_at INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

CREATE INDEX IF NOT EXISTS class_platform_scene_code ON class_platform_scene (code, status);
