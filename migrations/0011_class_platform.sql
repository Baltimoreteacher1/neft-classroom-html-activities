-- 0011_class_platform.sql — the class platform (functions/api/class).
--
-- Shared by Fluency Lab and The Language Page: a teacher creates a class, students
-- join with the class code (or its QR) and an alias, progress documents sync
-- last-write-wins, and live rooms / voice notes hang off the class.
--
-- The Pages Function creates these lazily (CREATE TABLE IF NOT EXISTS, the
-- sg-room / class-data pattern), so applying this migration is optional and
-- idempotent. It is the schema of record, and functions/api/class/class.test.mjs
-- fails if the two differ.
--
-- PRIVACY: the only person-shaped column is `alias`, a nickname the contract
-- refuses to accept as a full name, email or phone number. Secrets (teacher
-- passcode, student key) are stored as salted SHA-256 hashes.
-- RETENTION: a class unused for 120 days is deleted whole; live rooms last 6
-- hours; shared recordings and voice notes 30 days (shared/class-platform/contract.js LIMITS).

CREATE TABLE IF NOT EXISTS class_platform_class (
    code TEXT PRIMARY KEY,
    app TEXT NOT NULL,
    title TEXT NOT NULL,
    salt TEXT NOT NULL,
    teacher_hash TEXT NOT NULL,
    settings_json TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL,
    last_active_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );

CREATE INDEX IF NOT EXISTS class_platform_class_expires ON class_platform_class (expires_at);

CREATE TABLE IF NOT EXISTS class_platform_student (
    code TEXT NOT NULL,
    student_id TEXT NOT NULL,
    alias TEXT NOT NULL COLLATE NOCASE,
    key_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    last_seen_at INTEGER NOT NULL,
    PRIMARY KEY (code, student_id),
    UNIQUE (code, alias)
  );

CREATE TABLE IF NOT EXISTS class_platform_doc (
    code TEXT NOT NULL,
    student_id TEXT NOT NULL,
    doc TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    received_at INTEGER NOT NULL,
    data TEXT NOT NULL,
    summary_json TEXT NOT NULL DEFAULT '{}',
    PRIMARY KEY (code, student_id, doc)
  );

CREATE TABLE IF NOT EXISTS class_platform_guard (
    bucket_key TEXT PRIMARY KEY,
    hits INTEGER NOT NULL DEFAULT 0,
    expires_at INTEGER NOT NULL
  );

CREATE TABLE IF NOT EXISTS class_platform_room (
    room_id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    kind TEXT NOT NULL,
    state_json TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );

CREATE INDEX IF NOT EXISTS class_platform_room_code ON class_platform_room (code, expires_at);

CREATE TABLE IF NOT EXISTS class_platform_response (
    room_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    item TEXT NOT NULL,
    response_json TEXT NOT NULL,
    correct INTEGER,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (room_id, student_id, item)
  );

CREATE TABLE IF NOT EXISTS class_platform_audio (
    audio_id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    student_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    parent_id TEXT,
    label TEXT NOT NULL DEFAULT '',
    mime TEXT NOT NULL,
    bytes BLOB NOT NULL,
    size INTEGER NOT NULL,
    heard INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );

CREATE INDEX IF NOT EXISTS class_platform_audio_student ON class_platform_audio (code, student_id);
