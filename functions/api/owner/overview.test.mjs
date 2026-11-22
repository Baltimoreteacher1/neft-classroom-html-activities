/* Tests for /api/owner/overview — read-only owner telemetry & class-platform summary. */

import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { onRequest } from "./overview.js";

function d1(sqlite) {
  const make = (sql, params) => ({
    bind: (...next) => make(sql, next),
    async first() {
      return sqlite.prepare(sql).get(...params) ?? null;
    },
    async all() {
      return { results: sqlite.prepare(sql).all(...params) };
    },
    async run() {
      const r = sqlite.prepare(sql).run(...params);
      return { success: true, meta: { changes: Number(r.changes) } };
    },
  });
  return {
    prepare: (sql) => make(sql, []),
  };
}

const KEY = "owner-test-key";

function call(env, headers = {}, query = "") {
  return onRequest({
    request: new Request(`https://example.test/api/owner/overview${query}`, {
      method: "GET",
      headers,
    }),
    env,
  });
}

test("rejects missing TEACHER_KEY or DB with 503 and unauthorized callers with 401", async () => {
  const sqlite = new DatabaseSync(":memory:");
  const db = d1(sqlite);

  const noKey = await call({ DB: db });
  assert.equal(noKey.status, 503);

  const noAuth = await call({ DB: db, TEACHER_KEY: KEY });
  assert.equal(noAuth.status, 401);

  const wrongAuth = await call({ DB: db, TEACHER_KEY: KEY }, { "x-teacher-key": "wrong" });
  assert.equal(wrongAuth.status, 401);

  const noDb = await call({ TEACHER_KEY: KEY }, { "x-teacher-key": KEY });
  assert.equal(noDb.status, 503);
});

test("handles an empty database gracefully without throwing", async () => {
  const sqlite = new DatabaseSync(":memory:");
  const res = await call({ DB: d1(sqlite), TEACHER_KEY: KEY }, { "x-teacher-key": KEY });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.usage.views, 0);
  assert.equal(data.errors.total, 0);
  assert.equal(data.platform.totalClasses, 0);
  assert.equal(data.platform.studentSeats, 0);
});

test("returns aggregate telemetry and class counts with zero student PII", async () => {
  const sqlite = new DatabaseSync(":memory:");
  const today = new Date().toISOString().slice(0, 10);
  const now = Date.now();
  sqlite.exec(`
    CREATE TABLE usage_signal (path TEXT, area TEXT, day TEXT, device TEXT, views INTEGER);
    CREATE TABLE client_error (path TEXT, message TEXT, day TEXT, count INTEGER);
    CREATE TABLE web_vital (path TEXT, area TEXT, day TEXT, device TEXT, metric TEXT, rating TEXT, samples INTEGER);
    CREATE TABLE class_platform_class (code TEXT PRIMARY KEY, app TEXT, title TEXT, created_at INTEGER, last_active_at INTEGER, expires_at INTEGER);
    CREATE TABLE class_platform_student (code TEXT, student_id TEXT, alias TEXT, key_hash TEXT);
    CREATE TABLE class_platform_astatus (code TEXT, assignment_id TEXT, student_id TEXT, state TEXT);
    CREATE TABLE class_platform_teacher_library (code TEXT, kind TEXT, item_id TEXT, deleted INTEGER);
  `);
  sqlite.prepare(`INSERT INTO usage_signal VALUES (?, ?, ?, ?, ?)`).run(
    "/access-practice-lab/",
    "access-practice-lab",
    today,
    "desktop",
    42,
  );
  sqlite.prepare(`INSERT INTO web_vital VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    "/access-practice-lab/",
    "access-practice-lab",
    today,
    "desktop",
    "LCP",
    "good",
    15,
  );
  sqlite.prepare(`INSERT INTO class_platform_class VALUES (?, ?, ?, ?, ?, ?)`).run(
    "ABC123",
    "language",
    "Period 1",
    now,
    now,
    now + 86_400_000,
  );
  sqlite.prepare(`INSERT INTO class_platform_student VALUES (?, ?, ?, ?)`).run(
    "ABC123",
    "stu_secret_1",
    "SecretAlias",
    "hash123",
  );
  sqlite.prepare(`INSERT INTO class_platform_astatus VALUES (?, ?, ?, ?)`).run(
    "ABC123",
    "a1",
    "stu_secret_1",
    "submitted",
  );
  sqlite.prepare(`INSERT INTO class_platform_teacher_library VALUES (?, ?, ?, ?)`).run(
    "ABC123",
    "vocab_set",
    "vs_1",
    0,
  );

  const res = await call({ DB: d1(sqlite), TEACHER_KEY: KEY }, { "x-teacher-key": KEY });
  assert.equal(res.status, 200);
  const data = await res.json();
  const raw = JSON.stringify(data);
  assert.equal(data.usage.views, 42);
  assert.equal(data.vitals.LCP.good, 15);
  assert.equal(data.platform.totalClasses, 1);
  assert.equal(data.platform.studentSeats, 1);
  assert.equal(data.platform.assignmentStates.submitted, 1);
  assert.equal(data.platform.libraryByKind.vocab_set, 1);
  assert.equal(raw.includes("SecretAlias"), false);
  assert.equal(raw.includes("stu_secret_1"), false);
  assert.equal(raw.includes("hash123"), false);
});
