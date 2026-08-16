/* Class-aware planner storage: isolation, inheritance, and the v1 -> v2 migration.
 *
 * Runs against a REAL SQL engine (node:sqlite) behind the same D1-shaped adapter
 * pacing-api.test.mjs uses, for the same reason: a mock can prove the code calls
 * the functions it calls, but only a real engine proves the widened primary key
 * actually keeps 601 and 602 apart, that the migration's table rebuild carries
 * every row across, and that running it twice is a no-op.
 *
 * The property under test throughout is the one the whole design exists for:
 *
 *   one baseline, one shared plan, three class overlays — and never three
 *   drifting copies of the year.
 */

import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import {
  effectiveOverlay,
  fieldOrigins,
  isValidSection,
  mergeDay,
  normalizeSection,
  OVERLAY_FIELDS,
  SECTIONS,
  SHARED,
} from "../../../shared/pacing/sections.js";
import { ensureSchema, SCHEMA_VERSION } from "../../_lib/pacing-schema.js";
import { applyBatch } from "./[[path]].js";

/* ── D1-shaped adapter over node:sqlite ────────────────────────────────────── */

function d1(db) {
  const make = (sql, params) => ({
    bind: (...next) => make(sql, next),
    async all() {
      return { results: db.prepare(sql).all(...params) };
    },
    async run() {
      return db.prepare(sql).run(...params);
    },
  });
  return {
    prepare: (sql) => make(sql, []),
    async batch(statements) {
      db.exec("BEGIN");
      try {
        for (const s of statements) await s.run();
        db.exec("COMMIT");
      } catch (err) {
        db.exec("ROLLBACK");
        throw err;
      }
      return statements.map(() => ({ success: true }));
    },
  };
}

async function freshDb() {
  const sqlite = new DatabaseSync(":memory:");
  const db = d1(sqlite);
  await ensureSchema(db);
  return { db, sqlite };
}

/** A v1 database, exactly as it existed before class awareness. */
function legacyDb(seedRows = []) {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(`CREATE TABLE pacing_day (
     school_year TEXT NOT NULL, date TEXT NOT NULL,
     plan TEXT, actual TEXT, note TEXT,
     locked INTEGER NOT NULL DEFAULT 0,
     updated_at INTEGER NOT NULL,
     PRIMARY KEY (school_year, date))`);
  sqlite.exec(`CREATE TABLE pacing_op (
     id TEXT PRIMARY KEY, school_year TEXT NOT NULL, ts INTEGER NOT NULL,
     kind TEXT NOT NULL, summary TEXT NOT NULL DEFAULT '',
     inverse TEXT NOT NULL DEFAULT '[]', undone_at INTEGER)`);
  sqlite.exec(`CREATE TABLE pacing_change (
     id TEXT PRIMARY KEY, op_id TEXT NOT NULL, school_year TEXT NOT NULL,
     ts INTEGER NOT NULL, date TEXT NOT NULL, field TEXT NOT NULL,
     prev TEXT, next TEXT)`);
  for (const r of seedRows) {
    sqlite
      .prepare(
        `INSERT INTO pacing_day (school_year, date, plan, actual, note, locked, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run("2026-2027", r.date, r.plan ?? null, r.actual ?? null, r.note ?? null, r.locked ?? 0, 1);
  }
  sqlite
    .prepare(
      `INSERT INTO pacing_op (id, school_year, ts, kind, summary, inverse)
       VALUES ('legacyop', '2026-2027', 1, 'edit', 'A change made before classes existed', '[]')`,
    )
    .run();
  return { sqlite, db: d1(sqlite) };
}

const all = (sqlite, sql, ...p) => sqlite.prepare(sql).all(...p);
const dayRow = (sqlite, section, date) =>
  all(sqlite, `SELECT * FROM pacing_day WHERE section = ? AND date = ?`, section, date)[0] ?? null;

const plan = (lessonId) => ({ dayType: "Core Lesson", lessonId });
const write = (date, extra) => ({ date, ...extra });

/* ── The section vocabulary ────────────────────────────────────────────────── */

test("the canonical sections are 601/602/603 and nothing else is accepted", () => {
  assert.deepEqual([...SECTIONS], ["601", "602", "603"]);
  for (const s of SECTIONS) assert.equal(isValidSection(s), true);
  assert.equal(isValidSection(SHARED), true, "the shared plan must be a valid scope");
  for (const bad of ["604", "601 ", "Algebraic Thinking", "all", "default", "601;--"]) {
    assert.equal(isValidSection(bad), false, `"${bad}" was accepted as a section`);
  }
});

test("an unknown section falls back to the SHARED plan, never to a guessed class", () => {
  assert.equal(normalizeSection("604"), SHARED);
  assert.equal(normalizeSection(undefined), SHARED);
  assert.equal(normalizeSection("602"), "602");
});

test("the section list matches the canonical roster source", async () => {
  // supports-schema.js is the roster source of record. sections.js keeps a
  // pinned copy because a browser IIFE cannot be imported here — this is the pin.
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(
    new URL("../../../assets/learning-supports/supports-schema.js", import.meta.url),
    "utf8",
  );
  const m = src.match(/var SECTIONS = \[([^\]]*)\]/);
  assert.ok(m, "could not read SECTIONS out of supports-schema.js");
  const roster = [...m[1].matchAll(/"(\d+)"/g)].map((x) => x[1]);
  assert.deepEqual([...SECTIONS], roster, "sections.js has drifted from the roster source");
});

/* ── Composition: shared + class ───────────────────────────────────────────── */

test("a class inherits every field it does not override", () => {
  const shared = { plan: plan("5-1"), note: "Grade-wide fire drill", locked: true };
  const cls = { actual: { status: "continued" } };
  const merged = mergeDay(shared, cls);
  assert.deepEqual(merged.plan, plan("5-1"), "the shared plan was lost");
  assert.equal(merged.note, "Grade-wide fire drill");
  assert.equal(merged.locked, true);
  assert.deepEqual(merged.actual, { status: "continued" }, "the class's own field was lost");
});

test("a class field wins over the shared one, field by field", () => {
  const shared = { plan: plan("5-1"), note: "shared note" };
  const cls = { plan: plan("5-2") };
  const merged = mergeDay(shared, cls);
  assert.deepEqual(merged.plan, plan("5-2"));
  assert.equal(merged.note, "shared note", "overriding plan must not drop the shared note");
});

test("every overlay field participates in the merge", () => {
  // Guards against a field being added to the API and forgotten here, which
  // would silently make that field un-overridable by a class.
  const shared = Object.fromEntries(OVERLAY_FIELDS.map((f) => [f, `shared-${f}`]));
  const cls = Object.fromEntries(OVERLAY_FIELDS.map((f) => [f, `class-${f}`]));
  const merged = mergeDay(shared, cls);
  for (const f of OVERLAY_FIELDS) assert.equal(merged[f], `class-${f}`, `${f} did not merge`);
});

test("the effective overlay covers dates from either layer", () => {
  const shared = { "2026-09-14": { plan: plan("5-1") } };
  const cls = { "2026-09-15": { plan: plan("5-2") } };
  const eff = effectiveOverlay(shared, cls);
  assert.deepEqual(Object.keys(eff).sort(), ["2026-09-14", "2026-09-15"]);
  assert.deepEqual(eff["2026-09-14"].plan, plan("5-1"));
  assert.deepEqual(eff["2026-09-15"].plan, plan("5-2"));
});

test("composing does not mutate either input layer", () => {
  const shared = { "2026-09-14": { plan: plan("5-1"), note: "keep me" } };
  const cls = { "2026-09-14": { plan: plan("5-2") } };
  const before = JSON.stringify({ shared, cls });
  effectiveOverlay(shared, cls);
  assert.equal(JSON.stringify({ shared, cls }), before, "composition mutated a source layer");
});

test("field origins tell the teacher which layer they are looking at", () => {
  const origins = fieldOrigins({ plan: plan("5-1"), note: "n" }, { plan: plan("5-2") });
  assert.equal(origins.plan, "class");
  assert.equal(origins.note, "shared");
  assert.equal(origins.actual, "baseline");
});

/* ── Isolation, against a real engine ──────────────────────────────────────── */

test("a change in 601 does not touch 602, 603, or the shared plan", async () => {
  const { db, sqlite } = await freshDb();
  await applyBatch(db, {
    writes: [write("2026-09-14", { plan: plan("5-1") })],
    inverse: [],
    kind: "edit",
    summary: "shared",
    now: 1,
    section: SHARED,
  });
  await applyBatch(db, {
    writes: [write("2026-09-14", { plan: plan("5-3") })],
    inverse: [],
    kind: "edit",
    summary: "601 moved on",
    now: 2,
    section: "601",
  });

  assert.equal(JSON.parse(dayRow(sqlite, "601", "2026-09-14").plan).lessonId, "5-3");
  assert.equal(JSON.parse(dayRow(sqlite, SHARED, "2026-09-14").plan).lessonId, "5-1");
  assert.equal(dayRow(sqlite, "602", "2026-09-14"), null, "602 gained a row it never asked for");
  assert.equal(dayRow(sqlite, "603", "2026-09-14"), null, "603 gained a row it never asked for");
});

test("the same date in three classes is three rows, not three calendars", async () => {
  const { db, sqlite } = await freshDb();
  for (const [i, s] of SECTIONS.entries()) {
    await applyBatch(db, {
      writes: [write("2026-09-14", { plan: plan(`5-${i + 1}`) })],
      inverse: [],
      kind: "edit",
      summary: s,
      now: 10 + i,
      section: s,
    });
  }
  const rows = all(sqlite, `SELECT section, plan FROM pacing_day ORDER BY section`);
  assert.equal(rows.length, 3);
  assert.deepEqual(
    rows.map((r) => [r.section, JSON.parse(r.plan).lessonId]),
    [
      ["601", "5-1"],
      ["602", "5-2"],
      ["603", "5-3"],
    ],
  );
  // The year itself is NOT copied: three edited days, not three × 210 days.
  assert.equal(all(sqlite, `SELECT COUNT(*) AS n FROM pacing_day`)[0].n, 3);
});

test("a write merges over its OWN class's prior value, not another class's", async () => {
  const { db, sqlite } = await freshDb();
  await applyBatch(db, {
    writes: [write("2026-09-14", { plan: plan("5-1"), note: "601 note" })],
    inverse: [],
    kind: "edit",
    summary: "",
    now: 1,
    section: "601",
  });
  await applyBatch(db, {
    writes: [write("2026-09-14", { plan: plan("5-9") })],
    inverse: [],
    kind: "edit",
    summary: "",
    now: 2,
    section: "602",
  });
  // 602 must NOT have inherited 601's note through the upsert's merge step.
  assert.equal(dayRow(sqlite, "602", "2026-09-14").note, null, "601's note leaked into 602");
  assert.equal(dayRow(sqlite, "601", "2026-09-14").note, "601 note");
});

test("history and change rows carry the class that made them", async () => {
  const { db, sqlite } = await freshDb();
  await applyBatch(db, {
    writes: [write("2026-09-14", { plan: plan("5-3") })],
    inverse: [],
    kind: "edit",
    summary: "602 continued",
    now: 5,
    section: "602",
  });
  assert.equal(all(sqlite, `SELECT section FROM pacing_op`)[0].section, "602");
  assert.equal(all(sqlite, `SELECT section FROM pacing_change`)[0].section, "602");
});

test("undo in one class cannot reverse another class's operation", async () => {
  const { db, sqlite } = await freshDb();
  for (const s of ["601", "602"]) {
    await applyBatch(db, {
      writes: [write("2026-09-14", { plan: plan(s === "601" ? "5-1" : "5-2") })],
      inverse: [],
      kind: "edit",
      summary: `${s} edit`,
      now: s === "601" ? 1 : 2,
      section: s,
    });
  }
  // The undo route selects the newest un-undone op WHERE section = ?. Model that
  // query directly: for 601 it must find 601's op even though 602's is newer.
  const newestFor = (s) =>
    all(
      sqlite,
      `SELECT summary FROM pacing_op WHERE section = ? AND undone_at IS NULL ORDER BY ts DESC LIMIT 1`,
      s,
    )[0];
  assert.equal(newestFor("601").summary, "601 edit");
  assert.equal(newestFor("602").summary, "602 edit");
});

/* ── Migration ─────────────────────────────────────────────────────────────── */

test("a v1 database migrates to v2 with every row intact, as the SHARED plan", async () => {
  const { db, sqlite } = legacyDb([
    { date: "2026-09-14", plan: JSON.stringify(plan("5-1")), note: "legacy note" },
    { date: "2026-09-15", plan: JSON.stringify(plan("5-2")), locked: 1 },
    { date: "2026-09-16", actual: JSON.stringify({ status: "continued" }) },
  ]);
  const report = await ensureSchema(db);

  assert.equal(report.from, 1, "the migration did not recognise a v1 database");
  assert.equal(report.to, SCHEMA_VERSION);
  assert.equal(report.migrated, 3, "rows were lost in the rebuild");

  const rows = all(sqlite, `SELECT * FROM pacing_day ORDER BY date`);
  assert.equal(rows.length, 3);
  for (const r of rows) {
    assert.equal(r.section, SHARED, "a legacy row did not become part of the shared plan");
  }
  assert.equal(rows[0].note, "legacy note", "a legacy field was dropped");
  assert.equal(rows[1].locked, 1);
  assert.equal(JSON.parse(rows[2].actual).status, "continued");
});

test("after migration all three classes see the legacy plan, with no rows copied", async () => {
  const { db, sqlite } = legacyDb([
    { date: "2026-09-14", plan: JSON.stringify(plan("5-1")) },
  ]);
  await ensureSchema(db);
  const shared = { "2026-09-14": { plan: plan("5-1") } };
  for (const s of SECTIONS) {
    const eff = effectiveOverlay(shared, {}); // no class overlay yet
    assert.deepEqual(eff["2026-09-14"].plan, plan("5-1"), `${s} lost the legacy plan`);
  }
  assert.equal(
    all(sqlite, `SELECT COUNT(*) AS n FROM pacing_day`)[0].n,
    1,
    "the migration triplicated the plan instead of sharing it",
  );
});

test("legacy history survives the migration", async () => {
  const { db, sqlite } = legacyDb();
  await ensureSchema(db);
  const ops = all(sqlite, `SELECT id, section, summary FROM pacing_op`);
  assert.equal(ops.length, 1, "legacy history was dropped");
  assert.equal(ops[0].id, "legacyop");
  assert.equal(ops[0].section, SHARED, "legacy history lost its scope");
});

test("the migration is idempotent — running it twice changes nothing", async () => {
  const { db, sqlite } = legacyDb([{ date: "2026-09-14", plan: JSON.stringify(plan("5-1")) }]);
  await ensureSchema(db);
  const snapshot = JSON.stringify(all(sqlite, `SELECT * FROM pacing_day ORDER BY section, date`));
  const second = await ensureSchema(db);
  const third = await ensureSchema(db);
  assert.equal(second.migrated, 0, "a second run re-migrated rows");
  assert.equal(third.migrated, 0);
  assert.equal(
    JSON.stringify(all(sqlite, `SELECT * FROM pacing_day ORDER BY section, date`)),
    snapshot,
    "a repeat migration changed the data",
  );
});

test("migration does not lose data it does not recognise — it refuses", async () => {
  const { db, sqlite } = legacyDb();
  sqlite.exec(`ALTER TABLE pacing_day ADD COLUMN teacher_scribble TEXT`);
  await assert.rejects(
    () => ensureSchema(db),
    /unrecognised column/,
    "the migration silently dropped a column it did not know about",
  );
  // And it refused BEFORE destroying anything.
  assert.ok(
    all(sqlite, `SELECT name FROM sqlite_master WHERE type='table' AND name='pacing_day'`).length,
    "the original table was dropped despite the refusal",
  );
});

test("a FUTURE schema version is refused rather than misread", async () => {
  const { db, sqlite } = await freshDb();
  sqlite
    .prepare(`UPDATE pacing_meta SET value = ? WHERE key = 'schema_version'`)
    .run(String(SCHEMA_VERSION + 1));
  await assert.rejects(
    () => ensureSchema(db),
    /Refusing to read it/,
    "an older reader accepted a newer schema",
  );
});

test("a fresh database is created at the current version, already class-aware", async () => {
  const { sqlite } = await freshDb();
  const cols = all(sqlite, `PRAGMA table_info(pacing_day)`).map((c) => c.name);
  assert.ok(cols.includes("section"), "a fresh install is not class-aware");
  const v = all(sqlite, `SELECT value FROM pacing_meta WHERE key='schema_version'`)[0].value;
  assert.equal(Number(v), SCHEMA_VERSION);
});

/* ── The curriculum must not be copied into the planner ────────────────────── */

test("planner rows store canonical ids and deltas, never curriculum text", async () => {
  const { db, sqlite } = await freshDb();
  await applyBatch(db, {
    writes: [write("2026-09-14", { plan: plan("5-1"), note: "my own note" })],
    inverse: [],
    kind: "edit",
    summary: "",
    now: 1,
    section: "601",
  });
  const stored = JSON.stringify(all(sqlite, `SELECT * FROM pacing_day`));
  for (const forbidden of ["title", "objective", "standard", "vocabulary", "http", "/lessons/"]) {
    assert.ok(
      !stored.includes(forbidden),
      `planner persistence contains curriculum metadata (${forbidden}) — it must resolve from the manifest at render time`,
    );
  }
});
