// Class and student deletion, receipts, retention and the restore dry-run, against the REAL migrations
// applied to node:sqlite and the REAL endpoint modules (no mock server). G-33: deleting a class removes
// every row that references it in every table, and the table list comes from migrations/, so a table
// added later fails here until functions/_lib/privacy/tables.js decides what a delete does to it.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { hashSecret } from "../functions/_lib/class-platform/store.js";
import { appendReceipt, deleteClass, deleteStudent } from "../functions/_lib/privacy/delete.js";
import {
  canonicalJson,
  checkReceipt,
  receiptFromRow,
  verifyChain,
} from "../functions/_lib/privacy/receipt.js";
import {
  expiredClasses,
  graceDaysFor,
  runRetention,
  schoolYearEnd,
} from "../functions/_lib/privacy/retention.js";
import { DELETE_PLAN, EXEMPT, scopeClauses } from "../functions/_lib/privacy/tables.js";
import { onRequest as deleteClassEndpoint } from "../functions/api/privacy/delete-class.js";
import { onRequest as deleteStudentEndpoint } from "../functions/api/privacy/delete-student.js";
import { onRequest as retentionEndpoint } from "../functions/api/privacy/retention.js";
import { countWhere, d1, freshDb, migrationTables, ROOT, seedClass } from "./privacy-d1-fake.mjs";

const A = "AAAAAA";
const B = "BBBBBB";
const S1 = "s000000001a";
const S2 = "s000000002b";
const PASS = "ABCD2345";
const NOW = Date.UTC(2027, 0, 15);

function world() {
  const sqlite = freshDb();
  const db = d1(sqlite);
  seedClass(sqlite, { code: A, studentId: S1, alias: "Maria Lopez" });
  seedClass(sqlite, { code: A, studentId: S2, alias: "Omar Haddad" });
  seedClass(sqlite, { code: B, studentId: S1, alias: "Maria Lopez" });
  return { sqlite, db };
}

const rowsFor = (sqlite, scope) =>
  Object.fromEntries(
    scopeClauses(scope).map(({ table, where, binds }) => [
      table,
      countWhere(sqlite, table, where, ...binds),
    ]),
  );

// ---- the plan covers every migration table (G-33) -------------------------------------------

test("every table in migrations/ is in the delete plan or exempt with a reason", () => {
  const planned = new Set(DELETE_PLAN.map((e) => e.table));
  for (const table of migrationTables().keys()) {
    const handled = planned.has(table) !== Object.hasOwn(EXEMPT, table);
    assert.ok(
      handled,
      `${table}: not in DELETE_PLAN and not EXEMPT (or in both). Decide what a delete does to it.`,
    );
  }
  for (const [table, reason] of Object.entries(EXEMPT)) {
    assert.ok(
      migrationTables().has(table),
      `EXEMPT names a table that no migration creates: ${table}`,
    );
    assert.ok(reason.length >= 25, `${table}: exempt reason is too short`);
  }
  for (const table of planned)
    assert.ok(migrationTables().has(table), `plan names unknown table ${table}`);
  assert.equal(planned.size, DELETE_PLAN.length, "a table is planned twice");
});

test("negative control: a table added to a migration but not the plan is caught", () => {
  const tables = migrationTables();
  tables.set("class_platform_brand_new", { columns: ["code"], file: "migrations/9999.sql" });
  const planned = new Set(DELETE_PLAN.map((e) => e.table));
  const unhandled = [...tables.keys()].filter((t) => !planned.has(t) && !Object.hasOwn(EXEMPT, t));
  assert.deepEqual(unhandled, ["class_platform_brand_new"]);
});

test("every plan statement is valid SQL against the real schema, in both scopes", () => {
  const sqlite = freshDb();
  for (const scope of [
    { type: "class", code: A },
    { type: "student", code: A, studentId: S1 },
  ]) {
    for (const { table, where, binds } of scopeClauses(scope)) {
      assert.doesNotThrow(() => countWhere(sqlite, table, where, ...binds), `${table}: ${where}`);
    }
  }
});

test("every table that carries a class code column is handled", () => {
  const planned = new Set(DELETE_PLAN.map((e) => e.table));
  for (const [table, { columns }] of migrationTables()) {
    if (!columns.some((c) => c === "code" || c === "class_code")) continue;
    assert.ok(
      planned.has(table) || Object.hasOwn(EXEMPT, table),
      `${table} has a code column and no decision`,
    );
  }
});

// ---- delete class ---------------------------------------------------------------------------

test("delete class removes every row in every planned table and leaves other classes alone", async () => {
  const { sqlite, db } = world();
  const before = rowsFor(sqlite, { type: "class", code: A });
  const otherBefore = rowsFor(sqlite, { type: "class", code: B });
  for (const { table } of DELETE_PLAN) {
    assert.ok(
      before[table] > 0,
      `seed put no row for class A in ${table}: the test would prove nothing`,
    );
    assert.ok(otherBefore[table] > 0, `seed put no row for class B in ${table}`);
  }
  const { receipt, counts } = await deleteClass(db, { code: A, actor: "teacher", now: NOW });
  assert.deepEqual(
    rowsFor(sqlite, { type: "class", code: A }),
    Object.fromEntries(DELETE_PLAN.map((e) => [e.table, 0])),
  );
  assert.deepEqual(rowsFor(sqlite, { type: "class", code: B }), otherBefore);
  assert.deepEqual(counts, before, "receipt counts equal what the class held");
  // Belt and braces: no column called code/class_code anywhere in a planned table still says A.
  for (const [table, { columns }] of migrationTables()) {
    for (const c of columns.filter((x) => x === "code" || x === "class_code")) {
      if (!DELETE_PLAN.some((e) => e.table === table)) continue;
      assert.equal(
        countWhere(sqlite, table, `${c} = ?`, A),
        0,
        `${table}.${c} still references ${A}`,
      );
    }
  }
  assert.equal(receipt.scope.code, A);
  assert.equal(await checkReceipt(receipt), null);
});

test("deleting the same class again is a no-op with no receipt", async () => {
  const { db } = world();
  await deleteClass(db, { code: A, actor: "teacher", now: NOW });
  const again = await deleteClass(db, { code: A, actor: "teacher", now: NOW + 1 });
  assert.equal(again.receipt, null);
  assert.equal(
    (await db.prepare("SELECT COUNT(*) AS n FROM privacy_deletion_receipt").first()).n,
    1,
  );
});

test("a failure mid-batch rolls the whole delete back and writes no receipt", async () => {
  const { sqlite, db } = world();
  const count = () =>
    Object.fromEntries(
      scopeClauses({ type: "class", code: A })
        .filter((c) => c.table !== "class_platform_class")
        .map(({ table, where, binds }) => [table, countWhere(sqlite, table, where, ...binds)]),
    );
  const before = count();
  sqlite.exec("DROP TABLE class_platform_class"); // the last statement in the plan will fail
  await assert.rejects(deleteClass(db, { code: A, actor: "teacher", now: NOW }), /no such table/);
  assert.deepEqual(count(), before, "earlier deletes were rolled back");
  assert.equal(
    (await db.prepare("SELECT COUNT(*) AS n FROM privacy_deletion_receipt").first()).n,
    0,
  );
});

test("without the receipts table nothing is deleted", async () => {
  const { sqlite, db } = world();
  sqlite.exec("DROP TABLE privacy_deletion_receipt");
  const before = rowsFor(sqlite, { type: "class", code: A });
  await assert.rejects(
    deleteClass(db, { code: A, actor: "teacher", now: NOW }),
    /no such table: privacy_deletion_receipt/,
  );
  assert.deepEqual(rowsFor(sqlite, { type: "class", code: A }), before);
});

test("invalid scope and actor are refused before any SQL runs", async () => {
  const { db } = world();
  await assert.rejects(deleteClass(db, { code: "bad", actor: "teacher" }), /invalid class code/);
  await assert.rejects(
    deleteStudent(db, { code: A, studentId: "nope", actor: "teacher" }),
    /invalid student id/,
  );
  await assert.rejects(deleteClass(db, { code: A, actor: "intruder" }), /invalid actor/);
});

// ---- delete student -------------------------------------------------------------------------

test("delete student removes that student's rows and keeps classmates and class-level rows", async () => {
  const { sqlite, db } = world();
  const mine = { type: "student", code: A, studentId: S1 };
  const theirs = { type: "student", code: A, studentId: S2 };
  const before = rowsFor(sqlite, mine);
  const classmateBefore = rowsFor(sqlite, theirs);
  const withRows = DELETE_PLAN.filter((e) => e.student).map((e) => e.table);
  for (const table of withRows) assert.ok(before[table] > 0, `no seeded row to delete in ${table}`);
  const { receipt, counts } = await deleteStudent(db, {
    code: A,
    studentId: S1,
    actor: "teacher",
    now: NOW,
  });
  assert.deepEqual(rowsFor(sqlite, mine), Object.fromEntries(withRows.map((t) => [t, 0])));
  assert.deepEqual(rowsFor(sqlite, theirs), classmateBefore, "the other student is untouched");
  assert.deepEqual(counts, before);
  assert.equal(
    countWhere(sqlite, "class_platform_class", "code = ?", A),
    1,
    "the class itself stays",
  );
  assert.equal(countWhere(sqlite, "class_platform_class", "code = ?", B), 1);
  assert.deepEqual(receipt.scope, { type: "student", code: A, studentId: S1 });
});

test("student ids never match another class's student with the same id", async () => {
  const { sqlite, db } = world();
  const otherBefore = rowsFor(sqlite, { type: "student", code: B, studentId: S1 });
  await deleteStudent(db, { code: A, studentId: S1, actor: "teacher", now: NOW });
  assert.deepEqual(rowsFor(sqlite, { type: "student", code: B, studentId: S1 }), otherBefore);
});

// ---- receipts -------------------------------------------------------------------------------

async function chain() {
  const { sqlite, db } = world();
  await deleteStudent(db, { code: A, studentId: S1, actor: "teacher", now: NOW });
  await deleteStudent(db, { code: A, studentId: S2, actor: "teacher", now: NOW + 1000 });
  await deleteClass(db, { code: A, actor: "site", now: NOW + 2000 });
  const rows = sqlite.prepare("SELECT * FROM privacy_deletion_receipt ORDER BY seq").all();
  return { sqlite, db, receipts: rows.map(receiptFromRow) };
}

test("receipts chain and verify", async () => {
  const { receipts } = await chain();
  assert.equal(receipts.length, 3);
  assert.equal(receipts[0].priorReceiptDigest, "");
  assert.equal(receipts[1].priorReceiptDigest, receipts[0].digest);
  assert.deepEqual(await verifyChain(receipts), []);
});

test("negative controls: every kind of tampering is detected", async () => {
  const { receipts } = await chain();
  const clone = () => structuredClone(receipts);
  const edits = {
    "a count": (r) => (r[1].counts.class_platform_doc += 1),
    "the scope": (r) => (r[0].scope.studentId = "s00000000ff"),
    "the time": (r) => (r[2].deletedAt += 1),
    "the stored digest": (r) => (r[1].digest = "0".repeat(64)),
    "the prior link": (r) => (r[2].priorReceiptDigest = r[0].digest),
  };
  for (const [name, edit] of Object.entries(edits)) {
    const tampered = clone();
    edit(tampered);
    assert.notDeepEqual(await verifyChain(tampered), [], `tampering with ${name} was not detected`);
  }
  const missing = clone();
  missing.splice(1, 1);
  assert.notDeepEqual(await verifyChain(missing), [], "a removed receipt was not detected");
  assert.equal(await checkReceipt(receipts[0]), null);
});

test("canonical JSON is key-order independent", () => {
  assert.equal(
    canonicalJson({ b: 1, a: { d: 2, c: [3, { z: 1, y: 2 }] } }),
    '{"a":{"c":[3,{"y":2,"z":1}],"d":2},"b":1}',
  );
});

test("the receipt table is append-only", async () => {
  const { sqlite } = await chain();
  assert.throws(
    () => sqlite.exec("UPDATE privacy_deletion_receipt SET actor = 'teacher'"),
    /append-only/,
  );
  assert.throws(() => sqlite.exec("DELETE FROM privacy_deletion_receipt"), /append-only/);
});

test("receipts hold no alias, no content and only integer counts", async () => {
  const { sqlite, receipts } = await chain();
  const dump = JSON.stringify(sqlite.prepare("SELECT * FROM privacy_deletion_receipt").all());
  for (const secret of ["Maria", "Lopez", "Omar", "Haddad", "Seed Alias"]) {
    assert.ok(!dump.includes(secret), `receipt table contains ${secret}`);
  }
  for (const r of receipts) {
    for (const n of Object.values(r.counts)) assert.ok(Number.isInteger(n) && n >= 0);
    assert.deepEqual(
      Object.keys(r.scope).sort(),
      r.scope.type === "student" ? ["code", "studentId", "type"] : ["code", "type"],
    );
  }
});

test("two writers racing for the chain head both land, in order", async () => {
  const { db } = world();
  const scope = { type: "class", code: A };
  const results = await Promise.all([
    appendReceipt(db, { scope, counts: { t: 1 }, deletedAt: 1, actor: "teacher" }),
    appendReceipt(db, { scope, counts: { t: 2 }, deletedAt: 2, actor: "teacher" }),
  ]);
  const rows = (await db.prepare("SELECT * FROM privacy_deletion_receipt ORDER BY seq").all())
    .results;
  assert.deepEqual(await verifyChain(rows.map(receiptFromRow)), []);
  assert.equal(new Set(results.map((r) => r.digest)).size, 2);
});

// ---- endpoints (class API teacher credentials) ----------------------------------------------

async function endpointWorld() {
  const w = world();
  const salt = "salty";
  w.sqlite
    .prepare(
      "UPDATE class_platform_class SET salt = ?, teacher_hash = ?, expires_at = ? WHERE code = ?",
    )
    .run(salt, await hashSecret(salt, PASS), NOW + 1e9, A);
  w.sqlite
    .prepare("UPDATE class_platform_student SET alias = 'Maria' WHERE code = ? AND student_id = ?")
    .run(A, S1);
  w.env = { DB: w.db, TEACHER_KEY: "site-key" };
  let n = 0;
  w.call = async (endpoint, body, headers = {}) => {
    const request = new Request("https://example.test/api/privacy/x", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "CF-Connecting-IP": `10.0.0.${++n}`,
        ...headers,
      },
      body: JSON.stringify(body),
    });
    const res = await endpoint({ request, env: w.env, params: {} });
    return { status: res.status, body: await res.json() };
  };
  return w;
}

test("endpoint: delete-class refuses without a teacher credential and deletes nothing", async () => {
  const w = await endpointWorld();
  for (const headers of [{}, { "x-class-teacher": "WRONG234" }, { "x-teacher-key": "nope" }]) {
    const r = await w.call(deleteClassEndpoint, { code: A, confirm: A }, headers);
    assert.equal(r.status, 401);
  }
  assert.equal(countWhere(w.sqlite, "class_platform_class", "code = ?", A), 1);
});

test("endpoint: delete-class needs the confirmation code and a real class", async () => {
  const w = await endpointWorld();
  const headers = { "x-class-teacher": PASS };
  assert.equal(
    (await w.call(deleteClassEndpoint, { code: A, confirm: B }, headers)).body.error,
    "confirm-mismatch",
  );
  assert.equal(
    (await w.call(deleteClassEndpoint, { code: "ZZZZZZ", confirm: "ZZZZZZ" }, headers)).status,
    404,
  );
  assert.equal(
    (await w.call(deleteClassEndpoint, { code: "x" }, headers)).body.error,
    "invalid-code",
  );
  assert.equal(countWhere(w.sqlite, "class_platform_class", "code = ?", A), 1);
});

test("endpoint: the class passcode deletes the class and returns a verifying receipt", async () => {
  const w = await endpointWorld();
  const r = await w.call(
    deleteClassEndpoint,
    { code: A, confirm: A },
    { "x-class-teacher": PASS.toLowerCase() },
  );
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.deleted, A);
  assert.equal(await checkReceipt(r.body.receipt), null);
  assert.equal(r.body.receipt.actor, "teacher");
  assert.equal(countWhere(w.sqlite, "class_platform_class", "code = ?", A), 0);
  assert.equal(countWhere(w.sqlite, "class_platform_class", "code = ?", B), 1);
});

test("endpoint: the site key can delete too and is recorded as the actor", async () => {
  const w = await endpointWorld();
  const r = await w.call(
    deleteClassEndpoint,
    { code: A, confirm: A },
    { "x-teacher-key": "site-key" },
  );
  assert.equal(r.status, 200);
  assert.equal(r.body.receipt.actor, "site");
});

test("endpoint: delete-student by alias (any case) removes only that student and never echoes the alias", async () => {
  const w = await endpointWorld();
  const headers = { "x-class-teacher": PASS };
  assert.equal(
    (await w.call(deleteStudentEndpoint, { code: A, alias: "nobody" }, headers)).status,
    404,
  );
  assert.equal(
    (await w.call(deleteStudentEndpoint, { code: A }, headers)).body.error,
    "invalid-student",
  );
  const r = await w.call(deleteStudentEndpoint, { code: A, alias: "mARIA" }, headers);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.deleted, S1);
  assert.ok(!JSON.stringify(r.body).includes("Maria"));
  assert.equal(
    countWhere(w.sqlite, "class_platform_student", "code = ? AND student_id = ?", A, S1),
    0,
  );
  assert.equal(
    countWhere(w.sqlite, "class_platform_student", "code = ? AND student_id = ?", A, S2),
    1,
  );
  assert.equal((await w.call(deleteStudentEndpoint, { code: A, studentId: S2 }, {})).status, 401);
});

test("endpoint: a missing receipts migration answers 503 and deletes nothing", async () => {
  const w = await endpointWorld();
  w.sqlite.exec("DROP TABLE privacy_deletion_receipt");
  const r = await w.call(deleteClassEndpoint, { code: A, confirm: A }, { "x-class-teacher": PASS });
  assert.equal(r.status, 503);
  assert.equal(countWhere(w.sqlite, "class_platform_class", "code = ?", A), 1);
});

test("endpoint: a teacher can shorten retention but never lengthen it", async () => {
  const w = await endpointWorld();
  const headers = { "x-class-teacher": PASS };
  assert.equal((await w.call(retentionEndpoint, { code: A, graceDays: 7 }, headers)).status, 200);
  for (const bad of [31, -1, 1.5, "7", null]) {
    assert.equal(
      (await w.call(retentionEndpoint, { code: A, graceDays: bad }, headers)).status,
      400,
      String(bad),
    );
  }
  const row = w.sqlite
    .prepare("SELECT settings_json FROM class_platform_class WHERE code = ?")
    .get(A);
  assert.equal(JSON.parse(row.settings_json).retentionGraceDays, 7);
});

// ---- retention ------------------------------------------------------------------------------

const day = (y, m, d) => Date.UTC(y, m - 1, d);

test("school year ends June 30 (UTC)", () => {
  assert.equal(schoolYearEnd(day(2026, 9, 1)), Date.UTC(2027, 5, 30, 23, 59, 59, 999));
  assert.equal(schoolYearEnd(day(2027, 3, 1)), Date.UTC(2027, 5, 30, 23, 59, 59, 999));
  assert.equal(schoolYearEnd(day(2027, 6, 30)), Date.UTC(2027, 5, 30, 23, 59, 59, 999));
  assert.equal(schoolYearEnd(day(2027, 7, 1)), Date.UTC(2028, 5, 30, 23, 59, 59, 999));
});

test("expiredClasses: default is June 30 plus 30 days", () => {
  const rows = [{ code: "CCCCCC", created_at: day(2026, 9, 1) }];
  assert.deepEqual(expiredClasses(rows, day(2027, 7, 30)), []);
  assert.deepEqual(expiredClasses(rows, day(2027, 7, 31)), ["CCCCCC"]);
  assert.deepEqual(expiredClasses(rows, day(2027, 1, 1)), []);
});

test("expiredClasses: a teacher can shorten, never lengthen", () => {
  const made = day(2026, 9, 1);
  const short = [{ code: "CCCCCC", created_at: made, settings_json: '{"retentionGraceDays":0}' }];
  assert.deepEqual(expiredClasses(short, day(2027, 7, 1)), ["CCCCCC"]);
  for (const bad of [
    '{"retentionGraceDays":90}',
    '{"retentionGraceDays":-5}',
    '{"retentionGraceDays":"1"}',
    "not json",
    null,
  ]) {
    const row = { code: "DDDDDD", created_at: made, settings_json: bad };
    assert.equal(graceDaysFor(row), 30, `a value of ${bad} must fall back to the default`);
    assert.deepEqual(expiredClasses([row], day(2027, 7, 30)), [], String(bad));
  }
  assert.deepEqual(
    expiredClasses(
      [{ code: "EEEEEE", created_at: made, retentionGraceDays: 10 }],
      day(2027, 7, 11),
    ),
    ["EEEEEE"],
  );
  assert.deepEqual(
    expiredClasses([{ code: "EEEEEE", created_at: "junk" }], day(2099, 1, 1)),
    [],
    "bad rows are skipped, not deleted",
  );
});

test("runRetention deletes only expired classes, one receipt each, and keeps going after a failure", async () => {
  const sqlite = freshDb();
  const db = d1(sqlite);
  for (const [code, createdAt] of [
    [A, day(2025, 9, 1)],
    [B, day(2026, 9, 1)],
  ]) {
    seedClass(sqlite, { code, studentId: S1 });
    sqlite
      .prepare("UPDATE class_platform_class SET created_at = ? WHERE code = ?")
      .run(createdAt, code);
  }
  const out = await runRetention({ DB: db }, day(2026, 12, 1));
  assert.deepEqual(
    out.deleted.map((d) => d.code),
    [A],
  );
  assert.equal(out.checked, 2);
  assert.equal(countWhere(sqlite, "class_platform_class", "code = ?", A), 0);
  assert.equal(countWhere(sqlite, "class_platform_class", "code = ?", B), 1);
  const receipt = sqlite.prepare("SELECT actor FROM privacy_deletion_receipt").get();
  assert.equal(receipt.actor, "retention");
  await assert.rejects(runRetention({}, NOW), /no D1 binding/);
});

// ---- command-line tools ---------------------------------------------------------------------

const tool = (name, args, input) =>
  spawnSync(process.execPath, [join(ROOT, `tools/${name}.mjs`), ...args], {
    encoding: "utf8",
    input,
  });

test("privacy-verify-receipt: passes a good chain, fails a tampered one, exits 3 on bad input", async () => {
  const { receipts } = await chain();
  const dir = mkdtempSync(join(tmpdir(), "privacy-receipts-"));
  try {
    const good = join(dir, "good.json");
    writeFileSync(good, JSON.stringify(receipts));
    assert.equal(tool("privacy-verify-receipt", [good]).status, 0);
    const bad = structuredClone(receipts);
    bad[1].counts.class_platform_doc += 1;
    const badPath = join(dir, "bad.json");
    writeFileSync(badPath, JSON.stringify(bad));
    const r = tool("privacy-verify-receipt", [badPath]);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /digest mismatch/);
    assert.equal(tool("privacy-verify-receipt", [join(dir, "missing.json")]).status, 3);
    assert.equal(tool("privacy-verify-receipt", []).status, 3);
    const stdin = tool("privacy-verify-receipt", ["-"], JSON.stringify(receipts[0]));
    assert.equal(stdin.status, 0, stdin.stderr);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("privacy-reapply-receipts --dry-run lists what a restore resurrected and changes nothing", async () => {
  const { receipts } = await chain();
  const dir = mkdtempSync(join(tmpdir(), "privacy-restore-"));
  try {
    const dbPath = join(dir, "restored.sqlite");
    const restored = freshDb(dbPath); // a backup taken before the deletions
    seedClass(restored, { code: A, studentId: S1 });
    seedClass(restored, { code: A, studentId: S2 });
    seedClass(restored, { code: B, studentId: S1 });
    const before = restored.prepare("SELECT COUNT(*) AS n FROM class_platform_doc").get().n;
    restored.close();
    const receiptsPath = join(dir, "receipts.json");
    writeFileSync(receiptsPath, JSON.stringify(receipts));
    const r = tool("privacy-reapply-receipts", [
      "--dry-run",
      "--receipts",
      receiptsPath,
      "--db",
      dbPath,
    ]);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /WOULD DELETE/);
    assert.match(r.stdout, new RegExp(`class ${A}`));
    assert.doesNotMatch(r.stdout, new RegExp(`class ${B}`));
    const after = freshDbCount(dbPath);
    assert.equal(after, before, "dry run must not change the database");
    assert.equal(
      tool("privacy-reapply-receipts", ["--receipts", receiptsPath, "--db", dbPath]).status,
      3,
      "only --dry-run exists",
    );
    const broken = structuredClone(receipts);
    broken[0].counts.class_platform_doc += 5;
    writeFileSync(receiptsPath, JSON.stringify(broken));
    assert.equal(
      tool("privacy-reapply-receipts", ["--dry-run", "--receipts", receiptsPath, "--db", dbPath])
        .status,
      1,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

function freshDbCount(path) {
  const db = new DatabaseSync(path);
  const n = db.prepare("SELECT COUNT(*) AS n FROM class_platform_doc").get().n;
  db.close();
  return n;
}
