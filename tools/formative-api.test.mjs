// /api/formative against the REAL migrations (node:sqlite) and the REAL endpoint modules: auth, strict shapes,
// the PII screen (a name in ANY field is refused and stores nothing), upsert/clear, separate self scores, error
// tallies, size caps and rate limits, and G-33-style deletion (class delete and student delete).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { hashSecret } from "../functions/_lib/class-platform/store.js";
import { screenPII } from "../functions/_lib/formative/request.js";
import { deleteClass, deleteStudent } from "../functions/_lib/privacy/delete.js";
import { DELETE_PLAN } from "../functions/_lib/privacy/tables.js";
import { setLogSink } from "../functions/_lib/security/log.js";
import { onRequest as errors } from "../functions/api/formative/errors.js";
import { onRequest as score } from "../functions/api/formative/score.js";
import { onRequest as selfScore } from "../functions/api/formative/self-score.js";
import { onRequest as summary } from "../functions/api/formative/summary.js";
import { weekStart } from "../shared/formative/constants.js";
import { countWhere, d1, freshDb, migrationTables, ROOT } from "./privacy-d1-fake.mjs";

setLogSink(() => {}); // one log line per request would bury the results
const A = "AAAAAA";
const B = "BBBBBB";
const UNIT = "g6-ela-u1";
const TICKET = `${UNIT}:exit`;
const PASS = "ABCD2345";
const KEY = "WXYZ2345";
const ids = (n) => Array.from({ length: n }, (_, i) => `s${String(i + 1).padStart(10, "0")}`);

async function world(n = 28) {
  const sqlite = freshDb();
  const salt = "salty";
  for (const code of [A, B]) {
    sqlite
      .prepare(
        "INSERT INTO class_platform_class (code, app, title, salt, teacher_hash, created_at, last_active_at, expires_at) VALUES (?, 'language', 'T', ?, ?, 1, 1, ?)",
      )
      .run(code, salt, await hashSecret(salt, code === A ? PASS : "ZZZZ2222"), Date.now() + 1e10);
    for (const [i, id] of ids(n).entries())
      sqlite
        .prepare(
          "INSERT INTO class_platform_student (code, student_id, alias, key_hash, created_at, last_seen_at) VALUES (?, ?, ?, ?, 1, 1)",
        )
        .run(code, id, `Star ${i + 1}`, await hashSecret(salt, KEY));
  }
  const env = { DB: d1(sqlite), TEACHER_KEY: "site-key" };
  let ip = 0;
  const call = async (
    endpoint,
    { method = "POST", body, query = "", headers = { "x-class-teacher": PASS }, address } = {},
  ) => {
    const request = new Request(`https://test.local/api/formative/x${query}`, {
      method,
      headers: {
        "content-type": "application/json",
        "CF-Connecting-IP": address || `10.9.${Math.floor(++ip / 250)}.${ip % 250}`,
        ...headers,
      },
      body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    });
    const res = await endpoint({ request, env, params: {} });
    return { status: res.status, json: await res.json() };
  };
  const rows = (table, where = "1 = 1", ...b) => countWhere(sqlite, table, where, ...b);
  return { sqlite, env, call, rows };
}
const scoreBody = (entries, extra = {}) => ({
  code: A,
  unitId: UNIT,
  ticketId: TICKET,
  scores: entries,
  ...extra,
});

test("migration 0023 is additive and idempotent, and holds no free-text column", () => {
  const sql = readFileSync(`${ROOT}/migrations/0023_formative.sql`, "utf8");
  assert.doesNotMatch(sql.replace(/--.*$/gm, ""), /DROP |ALTER |DELETE /i);
  const { sqlite } = { sqlite: freshDb() };
  assert.doesNotThrow(() => sqlite.exec(sql), "second application");
  const tables = migrationTables();
  assert.deepEqual(tables.get("formative_score").columns.sort(), [
    "class_code",
    "created_at",
    "rubric_level",
    "scored_by",
    "student_id",
    "ticket_id",
    "unit_id",
    "updated_at",
  ]);
  assert.deepEqual(tables.get("formative_error").columns.sort(), [
    "class_code",
    "count",
    "error_type",
    "unit_id",
    "updated_at",
    "week_start",
  ]);
  assert.ok(DELETE_PLAN.some((e) => e.table === "formative_score" && e.student));
  assert.ok(DELETE_PLAN.some((e) => e.table === "formative_error" && e.student === null));
  assert.throws(
    () =>
      sqlite
        .prepare(
          "INSERT INTO formative_score VALUES ('AAAAAA','u:exit','u','s1','expert','teacher',1,1)",
        )
        .run(),
    /CHECK/,
  );
  assert.throws(
    () =>
      sqlite
        .prepare(
          "INSERT INTO formative_score VALUES ('AAAAAA','u:exit','u','s1','emerging','admin',1,1)",
        )
        .run(),
    /CHECK/,
  );
});

test("auth: no credential, wrong passcode, another class's passcode and a bad code all write nothing", async () => {
  const w = await world();
  const body = scoreBody([{ studentId: ids(1)[0], level: "emerging" }]);
  for (const headers of [
    {},
    { "x-class-teacher": "WRONG234" },
    { "x-class-teacher": "ZZZZ2222" },
    { "x-teacher-key": "nope" },
  ]) {
    assert.equal((await w.call(score, { body, headers })).status, 401);
    assert.equal(
      (
        await w.call(errors, {
          body: { code: A, unitId: UNIT, errors: [{ type: "misc:primary", count: 1 }] },
          headers,
        })
      ).status,
      401,
    );
    assert.equal(
      (await w.call(summary, { method: "GET", query: `?code=${A}&unitId=${UNIT}`, headers }))
        .status,
      401,
    );
  }
  assert.equal((await w.call(score, { body: { ...body, code: "abc" } })).status, 400);
  assert.equal((await w.call(score, { body: { ...body, code: "CCCCCC" } })).status, 404);
  assert.equal(w.rows("formative_score"), 0);
  assert.equal(
    (await w.call(score, { body, headers: { "x-teacher-key": "site-key" } })).status,
    200,
    "the site teacher key is the same credential /api/class accepts",
  );
});

test("scoring flow: 28 aliases in one call, re-score upserts, null clears, summary returns them", async () => {
  const w = await world();
  const all = ids(28);
  const levels = ["emerging", "developing", "proficient"];
  const res = await w.call(score, {
    body: scoreBody(all.map((studentId, i) => ({ studentId, level: levels[i % 3] }))),
  });
  assert.deepEqual([res.status, res.json.saved], [200, 28]);
  assert.equal(w.rows("formative_score", "class_code = ? AND scored_by = 'teacher'", A), 28);
  await w.call(score, { body: scoreBody([{ studentId: all[0], level: "proficient" }]) });
  assert.equal(
    w.rows("formative_score", "class_code = ?", A),
    28,
    "one row per student per scorer",
  );
  assert.equal(
    w.sqlite
      .prepare(
        "SELECT rubric_level, created_at <= updated_at AS ok FROM formative_score WHERE student_id = ?",
      )
      .get(all[0]).rubric_level,
    "proficient",
  );
  await w.call(score, { body: scoreBody([{ studentId: all[0], level: null }]) });
  assert.equal(w.rows("formative_score", "class_code = ? AND student_id = ?", A, all[0]), 0);
  const sum = await w.call(summary, { method: "GET", query: `?code=${A}&unitId=${UNIT}` });
  assert.equal(sum.status, 200);
  assert.equal(sum.json.scores.length, 27);
  assert.equal(sum.json.ticket.ticketId, TICKET);
  assert.deepEqual(Object.keys(sum.json.ticket.rubric), ["emerging", "developing", "proficient"]);
  assert.equal(sum.json.catalog[0].id, "misc:primary");
  assert.ok(sum.json.reteach["misc:primary"].title);
  assert.equal(sum.json.weeks.length, 8);
  assert.equal(w.rows("formative_score", "class_code = ?", B), 0, "another class is untouched");
});

test("strict shapes: unknown students, duplicates, bad levels, extra fields, other units, caps", async () => {
  const w = await world();
  const [s1] = ids(1);
  const bad = [
    scoreBody([{ studentId: "s00000000ff", level: "emerging" }]), // not on the roster
    scoreBody([
      { studentId: s1, level: "emerging" },
      { studentId: s1, level: "proficient" },
    ]),
    scoreBody([{ studentId: s1, level: "expert" }]),
    scoreBody([{ studentId: s1, level: "emerging", note: "x" }]),
    scoreBody([{ studentId: s1, level: "emerging" }], { comment: "x" }),
    scoreBody([]),
    scoreBody(
      ids(28)
        .concat(ids(28))
        .slice(0, 61)
        .map((studentId) => ({ studentId, level: "emerging" })),
    ),
    scoreBody([{ studentId: s1, level: "emerging" }], { ticketId: "g6-ela-u2:exit" }), // ticket of another unit
    scoreBody([{ studentId: s1, level: "emerging" }], { ticketId: `${UNIT}:quiz` }),
  ];
  for (const body of bad)
    assert.equal((await w.call(score, { body })).status, 400, JSON.stringify(body).slice(0, 80));
  assert.equal(
    (
      await w.call(score, {
        body: scoreBody([{ studentId: s1, level: "emerging" }], { unitId: "no-such-unit" }),
      })
    ).status,
    422,
  );
  assert.equal((await w.call(score, { body: "{not json" })).status, 400);
  assert.equal(
    (
      await w.call(score, {
        body: JSON.stringify(
          scoreBody(
            ids(28).map((studentId) => ({ studentId, level: "emerging", pad: "x".repeat(400) })),
          ),
        ),
      })
    ).status,
    413,
  );
  assert.equal(w.rows("formative_score"), 0, "nothing stored by any refused call");
});

test("no PII: a name in ANY field is refused with 422 and nothing is stored", async () => {
  const w = await world();
  const [s1] = ids(1);
  const name = "Maria Lopez";
  const attempts = [
    [score, scoreBody([{ studentId: name, level: "emerging" }])],
    [score, scoreBody([{ studentId: s1, level: "emerging" }], { note: `${name} was absent` })],
    [score, scoreBody([{ studentId: s1, level: "emerging" }], { ticketId: name })],
    [score, { ...scoreBody([{ studentId: s1, level: "emerging" }]), [name]: 1 }], // a name as a key
    [errors, { code: A, unitId: UNIT, errors: [{ type: name, count: 1 }] }],
    [
      errors,
      {
        code: A,
        unitId: UNIT,
        errors: [{ type: "misc:primary", count: 1, comment: "email maria@example.com" }],
      },
    ],
    [
      selfScore,
      { code: A, unitId: UNIT, ticketId: TICKET, band: "5_6", level: "emerging", alias: name },
    ],
  ];
  for (const [endpoint, body] of attempts) {
    const r = await w.call(endpoint, {
      body,
      headers: { "x-class-teacher": PASS, "x-class-student": `${s1}.${KEY}` },
    });
    assert.equal(r.status, 422, JSON.stringify(body).slice(0, 90));
    assert.doesNotMatch(
      JSON.stringify(r.json),
      /Maria|Lopez|example\.com/,
      "the refusal never echoes the text",
    );
  }
  assert.equal(w.rows("formative_score") + w.rows("formative_error"), 0);
  assert.equal(
    screenPII({ ok: "Star 12", deep: { list: ["fine", { level: "emerging" }] } }),
    null,
    "aliases and enums pass",
  );
  assert.ok(
    screenPII({ deep: { list: ["fine", name] } }),
    "negative control: a nested name is found",
  );
});

test("error tallies: catalog ids only, current Monday week, undo, floor at zero, class scoped", async () => {
  const w = await world();
  const post = (list, code = A) => w.call(errors, { body: { code, unitId: UNIT, errors: list } });
  const week = weekStart(Date.now());
  let r = await post([
    { type: "misc:primary", count: 3 },
    { type: "frame:no-connector", count: 1 },
  ]);
  assert.deepEqual([r.status, r.json.weekStart], [200, week]);
  await post([{ type: "misc:primary", count: 2 }]);
  assert.equal(
    w.sqlite.prepare("SELECT count FROM formative_error WHERE error_type = 'misc:primary'").get()
      .count,
    5,
  );
  await post([{ type: "misc:primary", count: -2 }]);
  assert.equal(
    w.sqlite.prepare("SELECT count FROM formative_error WHERE error_type = 'misc:primary'").get()
      .count,
    3,
  );
  await post([{ type: "misc:primary", count: -50 }]);
  assert.equal(
    w.sqlite.prepare("SELECT count FROM formative_error WHERE error_type = 'misc:primary'").get()
      .count,
    0,
    "never below zero",
  );
  await post([{ type: "frame:incomplete", count: -5 }]);
  assert.equal(
    w.sqlite
      .prepare("SELECT count FROM formative_error WHERE error_type = 'frame:incomplete'")
      .get().count,
    0,
  );
  for (const list of [
    [{ type: "doctor:not-a-real-type", count: 1 }],
    [{ type: "frame:maria", count: 1 }],
    [{ type: "misc:primary", count: 0 }],
    [{ type: "misc:primary", count: 51 }],
    [{ type: "misc:primary", count: 1.5 }],
    [
      { type: "misc:primary", count: 1 },
      { type: "misc:primary", count: 1 },
    ],
    [],
    Array.from({ length: 13 }, () => ({ type: "misc:primary", count: 1 })),
  ])
    assert.equal((await post(list)).status, 400, JSON.stringify(list).slice(0, 60));
  assert.equal(w.rows("formative_error", "class_code = ?", B), 0);
  const sum = await w.call(summary, { method: "GET", query: `?code=${A}&unitId=${UNIT}` });
  assert.ok(sum.json.errors.every((e) => e.weekStart === week && e.count >= 0));
  assert.ok(sum.json.errors.some((e) => e.errorType === "frame:no-connector" && e.count === 1));
});

test("self-score: older band only, own row only, separate from the teacher's score", async () => {
  const w = await world();
  const [s1, s2] = ids(2);
  const as = (id, key = KEY) => ({ "x-class-student": `${id}.${key}` });
  const body = { code: A, unitId: UNIT, ticketId: TICKET, band: "5_6", level: "developing" };
  await w.call(score, { body: scoreBody([{ studentId: s1, level: "proficient" }]) });
  assert.equal((await w.call(selfScore, { body, headers: {} })).status, 401);
  assert.equal((await w.call(selfScore, { body, headers: as(s1, "WRONG234") })).status, 401);
  assert.equal((await w.call(selfScore, { body, headers: as("s00000000ff") })).status, 401);
  assert.equal(
    (await w.call(selfScore, { body: { ...body, band: "1_2" }, headers: as(s1) })).status,
    403,
    "not offered to the younger bands",
  );
  assert.equal(
    (await w.call(selfScore, { body: { ...body, studentId: s2 }, headers: as(s1) })).status,
    400,
    "the body cannot name another student",
  );
  assert.equal(
    (await w.call(selfScore, { body: { ...body, level: "expert" }, headers: as(s1) })).status,
    400,
  );
  const ok = await w.call(selfScore, { body, headers: as(s1) });
  assert.deepEqual([ok.status, ok.json.level], [200, "developing"]);
  assert.equal(w.rows("formative_score", "class_code = ? AND scored_by = 'self'", A), 1);
  assert.equal(w.rows("formative_score", "student_id = ? AND scored_by = 'self'", s2), 0);
  assert.equal(
    w.sqlite
      .prepare(
        "SELECT rubric_level FROM formative_score WHERE student_id = ? AND scored_by = 'teacher'",
      )
      .get(s1).rubric_level,
    "proficient",
    "the teacher's score is untouched",
  );
  await w.call(selfScore, { body: { ...body, level: "emerging" }, headers: as(s1) });
  assert.equal(
    w.rows("formative_score", "class_code = ? AND scored_by = 'self'", A),
    1,
    "re-scoring upserts",
  );
  const sum = await w.call(summary, { method: "GET", query: `?code=${A}&unitId=${UNIT}` });
  assert.deepEqual(
    sum.json.scores.map((s) => [s.studentId, s.by, s.level]),
    [
      [s1, "self", "emerging"],
      [s1, "teacher", "proficient"],
    ],
  );
});

test("rate limits: scoring is capped per client, and failed credentials are capped sooner", async () => {
  const w = await world(3);
  const body = scoreBody([{ studentId: ids(1)[0], level: "emerging" }]);
  const codes = [];
  for (let i = 0; i < 245; i++)
    codes.push((await w.call(score, { body, address: "10.77.0.1" })).status);
  assert.equal(codes[0], 200);
  assert.equal(codes[244], 429, "the 245th call from one client is refused");
  const wrong = [];
  for (let i = 0; i < 40; i++)
    wrong.push(
      (
        await w.call(summary, {
          method: "GET",
          query: `?code=${A}&unitId=${UNIT}`,
          headers: { "x-class-teacher": "WRONG234" },
          address: "10.88.0.1",
        })
      ).status,
    );
  assert.deepEqual([wrong[0], wrong[39]], [401, 429]);
  const good = await w.call(summary, {
    method: "GET",
    query: `?code=${A}&unitId=${UNIT}`,
    address: "10.88.0.2",
  });
  assert.equal(good.status, 200, "another client with the right passcode is not locked out");
});

test("privacy delete (G-33): student delete removes that student's scores, class delete removes everything", async () => {
  const w = await world();
  const [s1, s2] = ids(2);
  const NOW = Date.now();
  for (const code of [A, B]) {
    for (const id of [s1, s2])
      for (const by of ["teacher", "self"])
        w.sqlite
          .prepare("INSERT INTO formative_score VALUES (?, ?, ?, ?, 'emerging', ?, 1, 1)")
          .run(code, TICKET, UNIT, id, by);
    w.sqlite
      .prepare("INSERT INTO formative_error VALUES (?, ?, 'misc:primary', '2026-11-23', 4, 1)")
      .run(code, UNIT);
  }
  await deleteStudent(w.env.DB, { code: A, studentId: s1, actor: "teacher", now: NOW });
  assert.equal(
    w.rows("formative_score", "class_code = ? AND student_id = ?", A, s1),
    0,
    "both scorers' rows for the student are gone",
  );
  assert.equal(
    w.rows("formative_score", "class_code = ? AND student_id = ?", A, s2),
    2,
    "a classmate is untouched",
  );
  assert.equal(
    w.rows("formative_score", "class_code = ? AND student_id = ?", B, s1),
    2,
    "the same id in another class is untouched",
  );
  assert.equal(
    w.rows("formative_error", "class_code = ?", A),
    1,
    "an aggregate that names nobody stays",
  );
  await deleteClass(w.env.DB, { code: A, actor: "teacher", now: NOW });
  assert.equal(
    w.rows("formative_score", "class_code = ?", A) + w.rows("formative_error", "class_code = ?", A),
    0,
  );
  assert.equal(w.rows("formative_score", "class_code = ?", B), 4);
  assert.equal(w.rows("formative_error", "class_code = ?", B), 1);
});
