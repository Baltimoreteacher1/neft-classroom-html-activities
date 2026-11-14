/* =============================================================================
 * Schema for the class social features (peer listening pairs, student-made
 * scenes). Schema of record: migrations/0013_class_pairs_scenes.sql; the
 * endpoint also creates these lazily with the rest of the class platform
 * (store.js ensureSchema), and functions/api/class/social.test.mjs fails if the
 * two differ. Kept apart from store.js SCHEMA so 0011 stays the record of its own.
 * ========================================================================== */

export const SOCIAL_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS class_platform_pairing (
    code TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 0,
    groups_json TEXT NOT NULL DEFAULT '[]',
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS class_platform_take (
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
  )`,
  `CREATE INDEX IF NOT EXISTS class_platform_take_code ON class_platform_take (code, expires_at)`,
  `CREATE TABLE IF NOT EXISTS class_platform_take_reply (
    take_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    answer TEXT NOT NULL,
    reaction TEXT NOT NULL,
    landed INTEGER,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (take_id, student_id)
  )`,
  `CREATE TABLE IF NOT EXISTS class_platform_scene (
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
  )`,
  `CREATE INDEX IF NOT EXISTS class_platform_scene_code ON class_platform_scene (code, status)`,
];

const takesOf = `SELECT take_id FROM class_platform_take WHERE code = ?`;

/** Everything social that hangs off one class (used by the whole-class delete). */
export const socialPurgeStatements = (db, code) => [
  db.prepare(`DELETE FROM class_platform_take_reply WHERE take_id IN (${takesOf})`).bind(code),
  db.prepare(`DELETE FROM class_platform_take WHERE code = ?`).bind(code),
  db.prepare(`DELETE FROM class_platform_scene WHERE code = ?`).bind(code),
  db.prepare(`DELETE FROM class_platform_pairing WHERE code = ?`).bind(code),
];

/** One learner removed from a class: their takes, replies and scenes go with them. */
export const socialStudentStatements = (db, code, studentId) => [
  db
    .prepare(
      `DELETE FROM class_platform_take_reply WHERE student_id = ? AND take_id IN (${takesOf})`,
    )
    .bind(studentId, code),
  db
    .prepare(
      `DELETE FROM class_platform_take_reply WHERE take_id IN (SELECT take_id FROM class_platform_take WHERE code = ? AND student_id = ?)`,
    )
    .bind(code, studentId),
  db
    .prepare(`DELETE FROM class_platform_take WHERE code = ? AND student_id = ?`)
    .bind(code, studentId),
  db
    .prepare(`DELETE FROM class_platform_scene WHERE code = ? AND student_id = ?`)
    .bind(code, studentId),
];

/** Retention sweep: expired takes (and their replies), expired scene voice lines, and expired classes' rows. */
export const socialPruneStatements = (db, now, goneClassesSql) => [
  db
    .prepare(
      `DELETE FROM class_platform_take_reply WHERE take_id IN (SELECT take_id FROM class_platform_take WHERE expires_at < ? OR code IN (${goneClassesSql}))`,
    )
    .bind(now, now),
  db
    .prepare(`DELETE FROM class_platform_take WHERE expires_at < ? OR code IN (${goneClassesSql})`)
    .bind(now, now),
  db
    .prepare(
      `UPDATE class_platform_scene SET audio = NULL, audio_mime = NULL, audio_size = 0 WHERE audio IS NOT NULL AND audio_expires_at < ?`,
    )
    .bind(now),
  db.prepare(`DELETE FROM class_platform_scene WHERE code IN (${goneClassesSql})`).bind(now),
  db.prepare(`DELETE FROM class_platform_pairing WHERE code IN (${goneClassesSql})`).bind(now),
];
