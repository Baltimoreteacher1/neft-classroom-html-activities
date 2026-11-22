/* Tests for /api/class/library/* — cross-device teacher library. */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { LIBRARY_SCHEMA } from "../../_lib/class-platform/library-schema.js";
import { onRequest } from "./[[path]].js";

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
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const out = [];
        for (const s of statements) out.push(await s.run());
        sqlite.exec("COMMIT");
        return out;
      } catch (err) {
        sqlite.exec("ROLLBACK");
        throw err;
      }
    },
  };
}

const KEY = "teacher-secret-for-tests";
let ip = 0;

function makeEnv() {
  const sqlite = new DatabaseSync(":memory:");
  return { DB: d1(sqlite), TEACHER_KEY: KEY };
}

async function call(env, path, { method = "GET", body, headers = {} } = {}) {
  const res = await onRequest({
    request: new Request(`https://example.test/api/class/${path}`, {
      method,
      headers: {
        "cf-connecting-ip": `10.0.0.${++ip % 250}`,
        ...(body ? { "content-type": "application/json" } : {}),
        ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
    env,
    params: { path: path.split("?")[0].split("/").filter(Boolean) },
  });
  return { status: res.status, data: await res.json() };
}

async function makeClass(env) {
  const created = await call(env, "create", {
    method: "POST",
    headers: { "x-teacher-key": KEY },
    body: { app: "language", title: "Period 2" },
  });
  assert.equal(created.status, 200);
  const { code, teacherPasscode } = created.data;
  const joined = await call(env, "join", {
    method: "POST",
    body: { code, alias: "Mina" },
  });
  assert.equal(joined.status, 200);
  return {
    code,
    passcode: teacherPasscode,
    studentHeader: `${joined.data.studentId}.${joined.data.studentKey}`,
  };
}

test("migration 0017_teacher_library.sql matches LIBRARY_SCHEMA", () => {
  const sql = readFileSync(
    fileURLToPath(new URL("../../../migrations/0017_teacher_library.sql", import.meta.url)),
    "utf8",
  )
    .replace(/--.*$/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  const runtime = LIBRARY_SCHEMA.map((s) => s.replace(/\s+/g, " ").trim()).join("; ") + ";";
  assert.equal(sql, runtime);
});

test("library routes reject anonymous and student callers with 401", async () => {
  const env = makeEnv();
  const { code, studentHeader } = await makeClass(env);
  const anon = await call(env, `library/list?code=${code}`);
  assert.equal(anon.status, 401);
  const stud = await call(env, `library/list?code=${code}`, {
    headers: { "x-class-student": studentHeader },
  });
  assert.equal(stud.status, 401);
  const studWrite = await call(env, "library/save", {
    method: "POST",
    headers: { "x-class-student": studentHeader },
    body: { code, kind: "vocab_set", itemId: "vs_1", title: "X", payload: { items: [] } },
  });
  assert.equal(studWrite.status, 401);
});

test("save, list, LWW sync, tombstone delete, and class purge", async () => {
  const env = makeEnv();
  const { code, passcode } = await makeClass(env);
  const th = { "x-class-teacher": passcode };

  const saved = await call(env, "library/save", {
    method: "POST",
    headers: th,
    body: {
      code,
      kind: "vocab_set",
      itemId: "vs_1",
      title: "Unit 2 Words",
      payload: { id: "vs_1", title: "Unit 2 Words", items: [{ term: "claim" }] },
      updatedAt: 2000,
    },
  });
  assert.equal(saved.status, 200);
  assert.equal(saved.data.item.title, "Unit 2 Words");

  // Older timestamp does not overwrite newer item
  const stale = await call(env, "library/save", {
    method: "POST",
    headers: th,
    body: {
      code,
      kind: "vocab_set",
      itemId: "vs_1",
      title: "Stale Title",
      payload: { id: "vs_1", title: "Stale Title", items: [] },
      updatedAt: 1000,
    },
  });
  assert.equal(stale.status, 200);
  assert.equal(stale.data.item.title, "Unit 2 Words");

  // Sync pushes a support_config and returns both
  const synced = await call(env, "library/sync", {
    method: "POST",
    headers: th,
    body: {
      code,
      items: [
        {
          kind: "support_config",
          itemId: "sup_p2",
          title: "Period 2 Supports",
          payload: { reading: 2, writing: 1 },
          updatedAt: 3000,
        },
      ],
    },
  });
  assert.equal(synced.status, 200);
  assert.equal(synced.data.items.length, 2);

  // Filter by kind
  const onlyVocab = await call(env, `library/list?code=${code}&kind=vocab_set`, { headers: th });
  assert.equal(onlyVocab.status, 200);
  assert.equal(onlyVocab.data.items.length, 1);
  assert.equal(onlyVocab.data.items[0].itemId, "vs_1");

  // Delete creates tombstone so list omits it
  const del = await call(env, "library/delete", {
    method: "POST",
    headers: th,
    body: { code, kind: "vocab_set", itemId: "vs_1" },
  });
  assert.equal(del.status, 200);
  const afterDel = await call(env, `library/list?code=${code}&kind=vocab_set`, { headers: th });
  assert.equal(afterDel.data.items.length, 0);

  // Class delete purges library rows too
  const purged = await call(env, "delete", {
    method: "POST",
    headers: th,
    body: { code, confirm: code },
  });
  assert.equal(purged.status, 200);
});
