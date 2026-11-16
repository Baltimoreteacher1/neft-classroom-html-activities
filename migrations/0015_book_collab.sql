-- 0015_book_collab.sql — Book Studio collaboration (functions/_lib/class-platform/books.js, /api/class/books/*).
--
-- Learners in one Language Page class write a book together: the owner shares a book to the class collaboration
-- space and gets a 6-character book code; classmates in the SAME class join by that code as editors (the owner or the
-- teacher can make someone a viewer, remove them, or set the whole book read-only; the teacher can turn the space off
-- for the class). The book is stored as items (book meta, each page, each element) with per-item revisions, so edits
-- merge element by element and are attributed to a class student id (class_platform_book_item.by_id).
-- Pictures travel as downscaled JPEG BLOBs (<= 1200 px, <= 350 KB, <= 30 per book; R2 is not enabled); recordings and
-- videos stay on the device that made them. Presence (page, selected element, typing) lives on the member row.
--
-- The Pages Function creates these lazily (CREATE TABLE IF NOT EXISTS), so applying this migration is optional and
-- idempotent. It is the schema of record; functions/api/class/books.test.mjs fails if the two differ.
-- PRIVACY: learners are referenced by class student_id only; text is the book itself, sanitized to the Book Studio
-- rich-text allow-list on the server. RETENTION: a shared book is deleted 30 days after its last change or open, with
-- its class (120 days unused), and with its owner when the teacher removes that learner; pictures go with their book.

CREATE TABLE IF NOT EXISTS class_platform_book_space (
    code TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1,
    updated_at INTEGER NOT NULL
  );

CREATE TABLE IF NOT EXISTS class_platform_book (
    book_id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    book_code TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    rev INTEGER NOT NULL DEFAULT 0,
    floor_rev INTEGER NOT NULL DEFAULT 0,
    locked INTEGER NOT NULL DEFAULT 0,
    write_token TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    UNIQUE (code, book_code)
  );

CREATE INDEX IF NOT EXISTS class_platform_book_code ON class_platform_book (code, expires_at);

CREATE TABLE IF NOT EXISTS class_platform_book_item (
    book_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    page_id TEXT NOT NULL DEFAULT '',
    ord REAL NOT NULL DEFAULT 0,
    data TEXT NOT NULL DEFAULT '',
    size INTEGER NOT NULL DEFAULT 0,
    rev INTEGER NOT NULL,
    by_id TEXT NOT NULL DEFAULT '',
    deleted INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (book_id, item_id)
  );

CREATE INDEX IF NOT EXISTS class_platform_book_item_rev ON class_platform_book_item (book_id, rev);

CREATE TABLE IF NOT EXISTS class_platform_book_member (
    book_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    role TEXT NOT NULL,
    edits INTEGER NOT NULL DEFAULT 0,
    joined_at INTEGER NOT NULL,
    last_seen_at INTEGER NOT NULL DEFAULT 0,
    page_id TEXT NOT NULL DEFAULT '',
    selected_id TEXT NOT NULL DEFAULT '',
    editing INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (book_id, student_id)
  );

CREATE INDEX IF NOT EXISTS class_platform_book_member_student ON class_platform_book_member (student_id);

CREATE TABLE IF NOT EXISTS class_platform_book_media (
    book_id TEXT NOT NULL,
    media_id TEXT NOT NULL,
    mime TEXT NOT NULL,
    bytes BLOB NOT NULL,
    size INTEGER NOT NULL,
    by_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (book_id, media_id)
  );
