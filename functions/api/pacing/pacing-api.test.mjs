/* Persistence tests for /api/pacing.
 *
 * These run against a REAL SQL engine (node:sqlite) behind a thin D1-shaped
 * adapter, not a mock that returns whatever the test wants. A hand-rolled mock
 * proves the code calls the functions it calls; it cannot prove that the schema
 * accepts the rows, that the upsert merges instead of clobbering, or that an
 * undo restores exactly what was there — which are the three things a planner
 * loses a year's work to.
 *
 * The adapter implements only what the endpoint uses: prepare/bind/all/run and
 * batch. If the endpoint starts using more, these tests fail loudly rather than
 * passing on a shim that quietly does nothing.
 */

import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { applyBatch, ensureTables, validateWrite } from "./[[path]].js";

/* ── A D1-shaped adapter over node:sqlite ──────────────────────────────────── */

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
      /* D1's batch is one implicit transaction. Modelling that matters: a
       * half-applied pacing operation is worse than a rejected one. */
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
  await ensureTables(db);
  return { db, sqlite };
}

const rows = (sqlite, sql, ...p) => sqlite.prepare(sql).all(...p);
const dayRow = (sqlite, date) =>
  rows(sqlite, `SELECT * FROM pacing_day WHERE date = ?`, date)[0] ?? null;

/* ── Validation ────────────────────────────────────────────────────────────── */

test("a write with a canonical shape is accepted", () => {
  assert.equal(
    validateWrite({
      date: "2026-10-13",
      plan: { dayType: "Core Lesson", lessonId: "3-4" },
      actual: { status: "taught-as-planned" },
      note: "Fire drill ate 10 minutes.",
      locked: true,
    }),
    null,
  );
});

test("NEGATIVE: free-text lesson identity is refused", () => {
  const problem = validateWrite({
    date: "2026-10-13",
    plan: { dayType: "Core Lesson", lessonId: "Equivalent Ratios" },
  });
  assert.match(problem, /not a canonical id/);
});

test("NEGATIVE: an invented day type or actual status is refused", () => {
  assert.match(validateWrite({ date: "2026-10-13", plan: { dayType: "Fun Day" } }), /unknown day type/);
  assert.match(
    validateWrite({ date: "2026-10-13", actual: { status: "vibes" } }),
    /unknown actual status/,
  );
});

test("NEGATIVE: a malformed date is refused", () => {
  assert.match(validateWrite({ date: "Oct 13" }), /bad date/);
  assert.match(validateWrite({ date: "2026-10-13T00:00:00Z" }), /bad date/);
});

/* ── Save and restore ──────────────────────────────────────────────────────── */

test("a write is saved and reads back identically", async () => {
  const { db, sqlite } = await freshDb();
  await applyBatch(db, {
    writes: [{ date: "2026-10-13", plan: { dayType: "Lost Day", lessonId: null }, note: "Assembly" }],
    inverse: [],
    kind: "edit",
    summary: "Test",
    now: 1000,
  });
  const row = dayRow(sqlite, "2026-10-13");
  assert.deepEqual(JSON.parse(row.plan), { dayType: "Lost Day", lessonId: null });
  assert.equal(row.note, "Assembly");
  assert.equal(row.updated_at, 1000);
});

test("a second write merges rather than clobbering fields it did not send", async () => {
  const { db, sqlite } = await freshDb();
  await applyBatch(db, {
    writes: [{ date: "2026-10-13", plan: { dayType: "Flex" }, note: "keep me", locked: true }],
    inverse: [],
    kind: "edit",
    summary: "first",
    now: 1,
  });
  await applyBatch(db, {
    writes: [{ date: "2026-10-13", actual: { status: "skipped" } }],
    inverse: [],
    kind: "edit",
    summary: "second",
    now: 2,
  });
  const row = dayRow(sqlite, "2026-10-13");
  assert.deepEqual(JSON.parse(row.actual), { status: "skipped" });
  assert.equal(row.note, "keep me", "an untouched note survives an actuals write");
  assert.equal(row.locked, 1, "an untouched lock survives an actuals write");
  assert.deepEqual(JSON.parse(row.plan), { dayType: "Flex" });
});

test("the change log records only fields that actually changed", async () => {
  const { db, sqlite } = await freshDb();
  await applyBatch(db, {
    writes: [{ date: "2027-03-08", plan: { dayType: "Flex" }, note: "n" }],
    inverse: [],
    kind: "edit",
    summary: "first",
    now: 10,
  });
  await applyBatch(db, {
    writes: [{ date: "2027-03-08", plan: { dayType: "Flex" }, note: "n2" }],
    inverse: [],
    kind: "edit",
    summary: "second",
    now: 20,
  });
  const changes = rows(sqlite, `SELECT * FROM pacing_change WHERE date = ? ORDER BY ts`, "2027-03-08");
  const second = changes.filter((c) => c.ts === 20);
  assert.deepEqual(
    second.map((c) => c.field),
    ["note"],
    "an unchanged plan writes no change row",
  );
  assert.equal(JSON.parse(second[0].prev), "n");
  assert.equal(JSON.parse(second[0].next), "n2");
});

test("why did this date change? — the log answers it for one date", async () => {
  const { db, sqlite } = await freshDb();
  await applyBatch(db, {
    writes: [
      { date: "2027-03-08", plan: { dayType: "Lost Day" } },
      { date: "2027-03-09", plan: { dayType: "Core Lesson", lessonId: "5-4" } },
    ],
    inverse: [],
    kind: "move-later",
    summary: "Move 5-4 forward from 2027-03-08",
    now: 55,
  });
  const forDate = rows(sqlite, `SELECT * FROM pacing_change WHERE date = ?`, "2027-03-09");
  assert.equal(forDate.length, 1);
  const op = rows(sqlite, `SELECT * FROM pacing_op WHERE id = ?`, forDate[0].op_id)[0];
  assert.equal(op.summary, "Move 5-4 forward from 2027-03-08");
  assert.equal(op.kind, "move-later");
});

/* ── Undo ──────────────────────────────────────────────────────────────────── */

test("undo restores exactly the state the operation replaced", async () => {
  const { db, sqlite } = await freshDb();
  await applyBatch(db, {
    writes: [{ date: "2026-11-12", plan: { dayType: "Core Lesson", lessonId: "4-3" } }],
    inverse: [],
    kind: "seed",
    summary: "seed",
    now: 1,
  });
  const before = JSON.parse(dayRow(sqlite, "2026-11-12").plan);

  const inverse = [{ date: "2026-11-12", plan: before }];
  await applyBatch(db, {
    writes: [{ date: "2026-11-12", plan: { dayType: "Lost Day", lessonId: null } }],
    inverse,
    kind: "move-later",
    summary: "Move 4-3 forward",
    now: 2,
  });
  assert.equal(JSON.parse(dayRow(sqlite, "2026-11-12").plan).dayType, "Lost Day");

  const op = rows(sqlite, `SELECT * FROM pacing_op WHERE kind = 'move-later'`)[0];
  await applyBatch(db, {
    writes: JSON.parse(op.inverse),
    inverse: [],
    kind: "undo",
    summary: `Undo: ${op.summary}`,
    now: 3,
  });
  assert.deepEqual(JSON.parse(dayRow(sqlite, "2026-11-12").plan), before);
});

test("a many-day cascade is one operation, so one undo reverses all of it", async () => {
  const { db, sqlite } = await freshDb();
  const dates = ["2026-11-12", "2026-11-13", "2026-11-16", "2026-11-17"];
  const writes = dates.map((date, i) => ({ date, plan: { dayType: "Core Lesson", lessonId: `6-${i + 1}` } }));
  const inverse = dates.map((date) => ({ date, plan: null }));
  await applyBatch(db, { writes, inverse, kind: "move-later", summary: "cascade", now: 7 });
  assert.equal(rows(sqlite, `SELECT * FROM pacing_op`).length, 1, "one operation, not four");

  const op = rows(sqlite, `SELECT * FROM pacing_op`)[0];
  await applyBatch(db, {
    writes: JSON.parse(op.inverse),
    inverse: [],
    kind: "undo",
    summary: "undo",
    now: 8,
  });
  for (const date of dates) {
    assert.equal(dayRow(sqlite, date).plan, null, `${date} is back on the baseline`);
  }
});

/* ── Failure ───────────────────────────────────────────────────────────────── */

test("NEGATIVE: a failed batch writes nothing at all", async () => {
  const { db, sqlite } = await freshDb();
  await applyBatch(db, {
    writes: [{ date: "2026-12-01", plan: { dayType: "Flex" } }],
    inverse: [],
    kind: "edit",
    summary: "good",
    now: 1,
  });

  /* Force the second statement of the batch to fail after the first succeeded.
   * If the endpoint ever stopped using db.batch, this would leave the operation
   * row committed with none of its day writes — a save that reports success and
   * changed nothing. */
  const broken = {
    prepare: db.prepare,
    batch: async (statements) => {
      const poisoned = [...statements];
      poisoned.splice(1, 0, {
        run: async () => {
          throw new Error("network");
        },
      });
      return db.batch(poisoned);
    },
  };

  await assert.rejects(
    applyBatch(broken, {
      writes: [{ date: "2026-12-01", plan: { dayType: "Core Lesson", lessonId: "7-1" } }],
      inverse: [],
      kind: "edit",
      summary: "doomed",
      now: 2,
    }),
    /network/,
  );

  assert.deepEqual(
    JSON.parse(dayRow(sqlite, "2026-12-01").plan),
    { dayType: "Flex" },
    "the failed write did not land",
  );
  assert.equal(
    rows(sqlite, `SELECT * FROM pacing_op WHERE summary = 'doomed'`).length,
    0,
    "and no operation was recorded for it",
  );
});
