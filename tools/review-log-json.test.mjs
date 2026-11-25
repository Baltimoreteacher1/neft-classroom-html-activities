// log.json: same rows as log.csv, schema ewl-review-log/1, teacher-gated, paged, no snapshots.
import assert from "node:assert/strict";
import { test } from "node:test";
import { LOG_COLUMNS, parseCsv } from "../functions/_lib/review/csv.js";
import { checkLogCsv, checkLogJson, LOG_JSON_SCHEMA } from "../functions/_lib/review/log-json.js";
import {
  call,
  eventRows,
  legalSession,
  logCsvFn,
  logJsonFn,
} from "./language-page/review-fixture.mjs";

test("log.json equals the database and the CSV, row for row", async () => {
  const { env, sqlite } = await legalSession();
  const rows = eventRows(sqlite);
  const res = await call(logJsonFn, env, { path: "/api/review/log.json" });
  assert.equal(res.status, 200);
  assert.equal(res.json.schema, LOG_JSON_SCHEMA);
  assert.deepEqual(res.json.columns, LOG_COLUMNS);
  assert.equal(res.json.count, rows.length);
  assert.deepEqual(checkLogJson(res.json), []);
  const csv = parseCsv((await call(logCsvFn, env, { path: "/api/review/log.csv" })).text);
  for (const [i, e] of res.json.events.entries()) {
    assert.deepEqual(Object.keys(e), LOG_COLUMNS);
    for (const c of LOG_COLUMNS) assert.equal(String(e[c] ?? ""), csv[i][c], `row ${i} ${c}`);
  }
  assert.ok(!res.text.includes("snapshot"));
});

test("log.json is behind the teacher key and pages like the CSV", async () => {
  const { env } = await legalSession();
  for (const key of ["", "wrong"])
    assert.equal((await call(logJsonFn, env, { path: "/api/review/log.json", key })).status, 401);
  assert.equal(
    (await call(logJsonFn, env, { method: "POST", path: "/api/review/log.json" })).status,
    405,
  );
  const page = await call(logJsonFn, env, { path: "/api/review/log.json?limit=3" });
  assert.equal(page.json.events.length, 3);
  assert.equal(page.json.next_after_seq, page.json.events[2].seq);
  const rest = await call(logJsonFn, env, {
    path: `/api/review/log.json?afterSeq=${page.json.next_after_seq}`,
  });
  assert.equal(rest.json.next_after_seq, null);
  assert.equal(page.json.events.length + rest.json.events.length, 8);
});

test("the schema checks refuse malformed exports", async () => {
  const { env } = await legalSession();
  const doc = (await call(logJsonFn, env, { path: "/api/review/log.json" })).json;
  const bad = structuredClone(doc);
  bad.events[0].actor = "model";
  assert.ok(checkLogJson(bad).some((m) => /not human/.test(m)));
  assert.ok(checkLogCsv("seq,id\n1,2\n", []).some((m) => /header/.test(m)));
});
