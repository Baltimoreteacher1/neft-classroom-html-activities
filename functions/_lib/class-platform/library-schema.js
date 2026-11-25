/* =============================================================================
 * Schema for cross-device teacher library (vocab sets, support configs, Book Studio editions, pathways).
 * Schema of record: migrations/0017_teacher_library.sql; the endpoint also creates these lazily
 * (store.js ensureSchema), and functions/api/class/library.test.mjs fails if the two differ.
 * ========================================================================== */

export const LIBRARY_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS class_platform_teacher_library (
    code TEXT NOT NULL,
    kind TEXT NOT NULL,
    item_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    payload_json TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (code, kind, item_id)
  )`,
  `CREATE INDEX IF NOT EXISTS class_platform_tlib_code ON class_platform_teacher_library (code, kind, updated_at)`,
];

export const libraryPruneStatements = (db, now, goneClassesSql) => [
  db
    .prepare(`DELETE FROM class_platform_teacher_library WHERE code IN (${goneClassesSql})`)
    .bind(now),
];
