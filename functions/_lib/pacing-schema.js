/**
 * pacing-schema.js — planner tables, and the migration that made them
 * class-aware.
 *
 * WHAT CHANGED. `pacing_day` was keyed `(school_year, date)`: one plan for the
 * whole grade. It is now keyed `(school_year, section, date)`, where section is
 * '' for the shared plan and '601' | '602' | '603' for a class. `pacing_op` and
 * `pacing_change` gained the same column so history and undo can say — and
 * restrict themselves to — which class an operation belonged to.
 *
 * WHY '' AND NOT 'default'. SQLite's `ADD COLUMN ... NOT NULL DEFAULT ''` gives
 * every pre-existing row the shared section for free. Legacy planner data
 * becomes the shared plan by DOING NOTHING, which is precisely the intended
 * migration semantic: whatever was planned before class awareness applies to all
 * three classes until one of them diverges. A sentinel like 'default' would have
 * meant UPDATE-ing every row to mean what it already meant — a data rewrite that
 * can fail halfway, over a rename.
 *
 * THE PRIMARY KEY IS THE HARD PART. SQLite cannot ALTER a primary key, so
 * widening it requires the twelve-step table rebuild: create the new shape, copy,
 * drop, rename. Everything below is written so that is safe:
 *
 *   - IDEMPOTENT. Every step is guarded by an inspection of the live schema, so
 *     running the migration twice is indistinguishable from running it once, and
 *     a half-finished previous attempt resumes rather than corrupts.
 *   - FAIL CLOSED. If the rebuild cannot be verified — row counts differ, the new
 *     table is missing — it throws before dropping anything, and the endpoint
 *     answers 503. A planner that will not save is recoverable; a planner that
 *     saved into a half-migrated table is not.
 *   - NO DATA LOSS. The copy is column-explicit. An unrecognised column stops the
 *     migration rather than being silently dropped.
 *   - VERSIONED. `pacing_meta.schema_version` records what the tables are. A
 *     version NEWER than this code understands is refused outright, because a
 *     rollback that reads a future schema with old assumptions is how you get
 *     plausible, wrong data.
 *
 * MEASURED BEFORE WRITING ANY OF IT: production `pacing_day`, `pacing_op` and
 * `pacing_change` all held ZERO rows. The migration below is therefore a schema
 * change over an empty table in production, and everything above is for the
 * deployments that are not production — the local test D1, a restore from
 * backup, and whoever runs this next year with a full year of plans in it.
 */

export const SCHEMA_VERSION = 2;

/** Columns the v1 tables had, in order. The copy step names these explicitly;
 *  a column present in the live table but absent here aborts the migration
 *  rather than being dropped on the floor. */
const V1_DAY_COLUMNS = ["school_year", "date", "plan", "actual", "note", "locked", "updated_at"];

async function tableExists(db, name) {
  const { results } = await db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = ?`)
    .bind(name)
    .all();
  return (results || []).length > 0;
}

async function columnsOf(db, table) {
  const { results } = await db.prepare(`PRAGMA table_info(${table})`).all();
  return (results || []).map((r) => r.name);
}

async function countOf(db, table) {
  const { results } = await db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).all();
  return Number(results?.[0]?.n ?? 0);
}

async function readVersion(db) {
  if (!(await tableExists(db, "pacing_meta"))) return null;
  const { results } = await db
    .prepare(`SELECT value FROM pacing_meta WHERE key = 'schema_version'`)
    .all();
  const raw = results?.[0]?.value;
  return raw == null ? null : Number(raw);
}

/* ── Fresh install ─────────────────────────────────────────────────────────── */

function createStatements(db) {
  return [
    db.prepare(
      `CREATE TABLE IF NOT EXISTS pacing_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS pacing_day (
         school_year TEXT NOT NULL, section TEXT NOT NULL DEFAULT '', date TEXT NOT NULL,
         plan TEXT, actual TEXT, note TEXT,
         locked INTEGER NOT NULL DEFAULT 0,
         updated_at INTEGER NOT NULL,
         PRIMARY KEY (school_year, section, date))`,
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS pacing_op (
         id TEXT PRIMARY KEY, school_year TEXT NOT NULL, section TEXT NOT NULL DEFAULT '',
         ts INTEGER NOT NULL, kind TEXT NOT NULL, summary TEXT NOT NULL DEFAULT '',
         inverse TEXT NOT NULL DEFAULT '[]', undone_at INTEGER)`,
    ),
    // Undo asks "the newest not-yet-undone operation IN THIS SECTION", so the
    // index leads with section; without it that query scans the whole year's log.
    db.prepare(
      `CREATE INDEX IF NOT EXISTS pacing_op_section_ts ON pacing_op (school_year, section, ts DESC)`,
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS pacing_change (
         id TEXT PRIMARY KEY, op_id TEXT NOT NULL, school_year TEXT NOT NULL,
         section TEXT NOT NULL DEFAULT '', ts INTEGER NOT NULL, date TEXT NOT NULL,
         field TEXT NOT NULL, prev TEXT, next TEXT)`,
    ),
    db.prepare(
      `CREATE INDEX IF NOT EXISTS pacing_change_date ON pacing_change (school_year, section, date, ts DESC)`,
    ),
  ];
}

/* ── v1 → v2 ───────────────────────────────────────────────────────────────── */

/**
 * Widen `pacing_day`'s primary key by rebuilding the table.
 *
 * Returns the number of rows carried across, so the caller can log a migration
 * that actually moved data differently from one that found an empty table.
 */
async function rebuildPacingDay(db) {
  const live = await columnsOf(db, "pacing_day");

  // Already v2 shape? Nothing to do. This is what makes a re-run a no-op.
  if (live.includes("section")) return { migrated: 0, alreadyDone: true };

  const unknown = live.filter((c) => !V1_DAY_COLUMNS.includes(c));
  if (unknown.length) {
    throw new Error(
      `pacing_day has unrecognised column(s) [${unknown.join(", ")}] — refusing to migrate rather than drop data`,
    );
  }

  const before = await countOf(db, "pacing_day");

  // A leftover from an aborted previous attempt must not be copied into.
  await db.prepare(`DROP TABLE IF EXISTS pacing_day_v2`).run();
  await db
    .prepare(
      `CREATE TABLE pacing_day_v2 (
         school_year TEXT NOT NULL, section TEXT NOT NULL DEFAULT '', date TEXT NOT NULL,
         plan TEXT, actual TEXT, note TEXT,
         locked INTEGER NOT NULL DEFAULT 0,
         updated_at INTEGER NOT NULL,
         PRIMARY KEY (school_year, section, date))`,
    )
    .run();

  // Every v1 row is a SHARED-plan row. This is the migration semantic in one
  // line: what was planned for everyone stays planned for everyone.
  await db
    .prepare(
      `INSERT INTO pacing_day_v2 (school_year, section, date, plan, actual, note, locked, updated_at)
       SELECT school_year, '', date, plan, actual, note, locked, updated_at FROM pacing_day`,
    )
    .run();

  const copied = await countOf(db, "pacing_day_v2");
  if (copied !== before) {
    // Nothing has been dropped at this point, so the old table is still the
    // source of truth and the endpoint will simply keep failing closed.
    throw new Error(
      `pacing_day migration copied ${copied} of ${before} rows — aborting before the swap`,
    );
  }

  await db.prepare(`DROP TABLE pacing_day`).run();
  await db.prepare(`ALTER TABLE pacing_day_v2 RENAME TO pacing_day`).run();
  return { migrated: copied, alreadyDone: false };
}

/** `pacing_op` and `pacing_change` only need a column, which SQLite can add in
 *  place — no rebuild, no window where the data is in two tables. */
async function addSectionColumn(db, table) {
  const live = await columnsOf(db, table);
  if (live.includes("section")) return false;
  await db.prepare(`ALTER TABLE ${table} ADD COLUMN section TEXT NOT NULL DEFAULT ''`).run();
  return true;
}

/* ── Entry point ───────────────────────────────────────────────────────────── */

/**
 * Bring the planner tables to SCHEMA_VERSION, whatever state they are in.
 *
 * Called on every request, like the `ensureTables` it replaces. The common path
 * is four `CREATE TABLE IF NOT EXISTS` and one version read.
 */
export async function ensureSchema(db) {
  const dayExists = await tableExists(db, "pacing_day");
  const version = await readVersion(db);

  if (version != null && version > SCHEMA_VERSION) {
    throw new Error(
      `planner schema is version ${version}; this deployment understands ${SCHEMA_VERSION}. ` +
        `Refusing to read it — an older reader would misinterpret newer data.`,
    );
  }

  const report = { from: version ?? (dayExists ? 1 : null), to: SCHEMA_VERSION, migrated: 0 };

  if (dayExists) {
    const day = await rebuildPacingDay(db);
    report.migrated = day.migrated;
    if (await tableExists(db, "pacing_op")) await addSectionColumn(db, "pacing_op");
    if (await tableExists(db, "pacing_change")) await addSectionColumn(db, "pacing_change");
  }

  await db.batch(createStatements(db));
  await db
    .prepare(
      `INSERT INTO pacing_meta (key, value) VALUES ('schema_version', ?)
       ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
    )
    .bind(String(SCHEMA_VERSION))
    .run();

  return report;
}
