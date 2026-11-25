/* =============================================================================
 * Schema for Book Studio collaboration (books written together inside one class).
 * Schema of record: migrations/0015_book_collab.sql; the endpoint also creates these
 * lazily with the rest of the class platform (store.js ensureSchema), and
 * functions/api/class/books.test.mjs fails if the two differ.
 *
 * RETENTION: a shared book lives 30 days after its last change or open
 * (COLLAB.retentionDays), and always goes with its class (120 days unused) and with
 * its owner when the teacher removes that learner. Pictures go with their book.
 * ========================================================================== */

export const COLLAB_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS class_platform_book_space (
    code TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS class_platform_book (
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
  )`,
  `CREATE INDEX IF NOT EXISTS class_platform_book_code ON class_platform_book (code, expires_at)`,
  `CREATE TABLE IF NOT EXISTS class_platform_book_item (
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
  )`,
  `CREATE INDEX IF NOT EXISTS class_platform_book_item_rev ON class_platform_book_item (book_id, rev)`,
  `CREATE TABLE IF NOT EXISTS class_platform_book_member (
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
  )`,
  `CREATE INDEX IF NOT EXISTS class_platform_book_member_student ON class_platform_book_member (student_id)`,
  `CREATE TABLE IF NOT EXISTS class_platform_book_media (
    book_id TEXT NOT NULL,
    media_id TEXT NOT NULL,
    mime TEXT NOT NULL,
    bytes BLOB NOT NULL,
    size INTEGER NOT NULL,
    by_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (book_id, media_id)
  )`,
];

/** Statements that delete the given books (a SELECT of book ids with its own bindings) and everything in them. */
const dropBooks = (db, idsSql, binds) => [
  db.prepare(`DELETE FROM class_platform_book_item WHERE book_id IN (${idsSql})`).bind(...binds),
  db.prepare(`DELETE FROM class_platform_book_member WHERE book_id IN (${idsSql})`).bind(...binds),
  db.prepare(`DELETE FROM class_platform_book_media WHERE book_id IN (${idsSql})`).bind(...binds),
  db.prepare(`DELETE FROM class_platform_book WHERE book_id IN (${idsSql})`).bind(...binds),
];

export const deleteBookStatements = (db, bookId) => dropBooks(db, `SELECT ? AS book_id`, [bookId]);

/** Retention sweep: expired books and books of expired classes. */
export const collabPruneStatements = (db, now, goneClassesSql) => [
  ...dropBooks(
    db,
    `SELECT book_id FROM class_platform_book WHERE expires_at < ? OR code IN (${goneClassesSql})`,
    [now, now],
  ),
  db.prepare(`DELETE FROM class_platform_book_space WHERE code IN (${goneClassesSql})`).bind(now),
];
