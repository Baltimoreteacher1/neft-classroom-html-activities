/* =============================================================================
 * Schema for Activity Studio (teacher activity storage, publishing, anonymous response evidence).
 * Schema of record: migrations/0019_activity_studio.sql; the endpoint also creates these lazily
 * (store.js ensureSchema), and functions/api/class/activities.test.mjs fails if the two differ.
 *
 * class_platform_activity       one row per activity: the teacher's draft and the published student copy
 * class_platform_activity_rev   the last 10 saved revisions of each draft
 * class_platform_activity_stat  anonymous per-question counters from students (no text, names or identifiers)
 * ========================================================================== */

export const ACTIVITY_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS class_platform_activity (
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
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS class_platform_activity_id ON class_platform_activity (activity_id)`,
  `CREATE TABLE IF NOT EXISTS class_platform_activity_rev (
    code TEXT NOT NULL,
    activity_id TEXT NOT NULL,
    rev INTEGER NOT NULL,
    saved_at INTEGER NOT NULL,
    json TEXT NOT NULL,
    PRIMARY KEY (code, activity_id, rev)
  )`,
  `CREATE TABLE IF NOT EXISTS class_platform_activity_stat (
    activity_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    n INTEGER NOT NULL DEFAULT 0,
    first_correct INTEGER NOT NULL DEFAULT 0,
    final_correct INTEGER NOT NULL DEFAULT 0,
    revised INTEGER NOT NULL DEFAULT 0,
    hints INTEGER NOT NULL DEFAULT 0,
    wrong_json TEXT NOT NULL DEFAULT '{}',
    PRIMARY KEY (activity_id, question_id)
  )`,
];

export const activityPruneStatements = (db, now, goneClassesSql) => [
  db
    .prepare(
      `DELETE FROM class_platform_activity_stat WHERE activity_id IN
       (SELECT activity_id FROM class_platform_activity WHERE code IN (${goneClassesSql}))`,
    )
    .bind(now),
  db.prepare(`DELETE FROM class_platform_activity_rev WHERE code IN (${goneClassesSql})`).bind(now),
  db.prepare(`DELETE FROM class_platform_activity WHERE code IN (${goneClassesSql})`).bind(now),
];
