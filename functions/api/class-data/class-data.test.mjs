/* Tests for /api/class-data — the anonymous, append-only class dataset.
 *
 * These run the REAL endpoint against a REAL SQL engine (node:sqlite) behind a
 * thin D1-shaped adapter, like functions/api/pacing. A hand-rolled mock proves
 * the code calls the functions it calls; it cannot prove the schema accepts the
 * rows, that the atomic cap statement really refuses the 601st entry, or that a
 * resend is ignored instead of counted twice.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { LIMITS, randomHex } from "../../../assets/class-investigation/contract.js";
import { onRequest, SCHEMA } from "./[[path]].js";

/* ── D1-shaped adapter over node:sqlite ────────────────────────────────────── */

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
let ipCounter = 0;

function world(env = {}) {
  const sqlite = new DatabaseSync(":memory:");
  const db = d1(sqlite);
  return { sqlite, db, env: { DB: db, TEACHER_KEY: KEY, ...env } };
}

/** One request through the real handler, from a fresh IP unless one is given. */
async function call(w, route, { method = "GET", body, query = "", teacher = false, ip } = {}) {
  const headers = { "CF-Connecting-IP": ip ?? `10.0.${Math.floor(++ipCounter / 250)}.${ipCounter % 250}` };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (teacher) headers["x-teacher-key"] = typeof teacher === "string" ? teacher : KEY;
  const request = new Request(`https://example.test/api/class-data/${route}${query}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }),
  });
  const res = await onRequest({ request, env: w.env, params: { path: route.split("/") } });
  const type = res.headers.get("Content-Type") || "";
  return { res, status: res.status, json: type.includes("json") ? await res.json() : null, text: type.includes("json") ? null : await res.text() };
}

const newClass = async (w, templateId = "pencil-handspan", options) => {
  const r = await call(w, "create", { method: "POST", teacher: true, body: { templateId, options } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  return r.json.code;
};

const entry = (code, extra = {}) => ({
  code,
  templateId: "pencil-handspan",
  entryId: randomHex(12),
  clientId: randomHex(16),
  source: "class",
  values: { pencil: 15, handSpan: 18.5 },
  ...extra,
});

const contribute = (w, body, opts = {}) => call(w, "contribute", { method: "POST", body, ...opts });

/* ── availability ─────────────────────────────────────────────────────────── */

test("health answers even with no database", async () => {
  const w = world({ DB: undefined });
  const r = await call(w, "health");
  assert.equal(r.status, 200);
  assert.deepEqual([r.json.ok, r.json.d1], [true, false]);
});

test("NEGATIVE: with no D1 binding every data route is 503, never a crash", async () => {
  const w = world({ DB: undefined });
  for (const [route, init] of [
    ["info", { query: "?code=ABCDEF" }],
    ["entries", { query: "?code=ABCDEF&template=pencil-handspan" }],
    ["contribute", { method: "POST", body: entry("ABCDEF") }],
    ["create", { method: "POST", teacher: true, body: { templateId: "pencil-handspan" } }],
  ]) {
    const r = await call(w, route, init);
    assert.equal(r.status, 503, route);
    assert.equal(r.json.error, "class-data-unavailable");
  }
});

test("the endpoint's schema is exactly the migration's schema (one source of truth)", () => {
  const file = fileURLToPath(new URL("../../../migrations/0010_class_data.sql", import.meta.url));
  const norm = (sql) =>
    sql
      .replace(/\s+/g, " ")
      .replace(/\( /g, "(")
      .replace(/ \)/g, ")")
      .replace(/, /g, ",")
      .trim()
      .replace(/;$/, "");
  const migration = readFileSync(file, "utf8")
    .replace(/--[^\n]*/g, "")
    .split(";")
    .map(norm)
    .filter(Boolean);
  assert.deepEqual(SCHEMA.map(norm), migration);
});

/* ── teacher gate ─────────────────────────────────────────────────────────── */

test("NEGATIVE: teacher routes refuse an anonymous caller and a wrong key", async () => {
  const w = world();
  for (const [route, method] of [
    ["create", "POST"],
    ["activate", "POST"],
    ["close", "POST"],
    ["reopen", "POST"],
    ["purge", "POST"],
    ["export", "GET"],
  ]) {
    const body = method === "POST" ? {} : undefined;
    assert.equal((await call(w, route, { method, body })).status, 401, `${route} anonymous`);
    assert.equal((await call(w, route, { method, body, teacher: "wrong-key" })).status, 401, `${route} wrong key`);
    assert.equal((await call(w, route, { method, body, teacher: KEY.slice(0, -1) })).status, 401, `${route} prefix of key`);
  }
});

test("NEGATIVE: an unconfigured TEACHER_KEY fails closed (503), never open", async () => {
  const w = world({ TEACHER_KEY: undefined });
  const r = await call(w, "create", { method: "POST", teacher: true, body: { templateId: "pencil-handspan" } });
  assert.equal(r.status, 503);
  assert.equal(r.json.error, "teacher-not-configured");
});

test("NEGATIVE: the teacher key cannot be brute-forced past the teacher throttle", async () => {
  const w = world();
  const ip = "203.0.113.77";
  let blocked = 0;
  for (let i = 0; i < 40; i++) {
    const r = await call(w, "create", { method: "POST", body: { templateId: "pencil-handspan" }, ip });
    if (r.status === 429) blocked++;
  }
  assert.ok(blocked >= 15, `expected the throttle to engage, saw ${blocked} 429s`);
});

/* ── lifecycle ────────────────────────────────────────────────────────────── */

test("create makes a code in the unambiguous alphabet with the template open and active", async () => {
  const w = world();
  const code = await newClass(w);
  assert.match(code, /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  const info = await call(w, "info", { query: `?code=${code}` });
  assert.equal(info.status, 200);
  assert.equal(info.json.active, "pencil-handspan");
  assert.deepEqual(
    info.json.investigations.map((i) => [i.templateId, i.status, i.count]),
    [["pencil-handspan", "open", 0]],
  );
  assert.equal(info.json.investigations[0].options.armHeight, false, "arm span / height default OFF");
});

test("NEGATIVE: create refuses an unknown template and an unknown option", async () => {
  const w = world();
  for (const body of [{ templateId: "my-weight" }, { templateId: "pencil-handspan", options: { weight: true } }, { templateId: "pencil-handspan", options: { armHeight: "yes" } }]) {
    const r = await call(w, "create", { method: "POST", teacher: true, body });
    assert.equal(r.status, 400, JSON.stringify(body));
  }
});

test("a teacher can switch the active investigation; contributions follow the active one", async () => {
  const w = world();
  const code = await newClass(w);
  const a = await contribute(w, entry(code));
  assert.equal(a.status, 200);

  const sw = await call(w, "activate", { method: "POST", teacher: true, body: { code, templateId: "get-to-school" } });
  assert.equal(sw.status, 200);

  const stale = await contribute(w, entry(code));
  assert.equal(stale.status, 409);
  assert.equal(stale.json.error, "not-active");

  const school = await contribute(w, {
    ...entry(code, { templateId: "get-to-school" }),
    values: { mode: "bus" },
  });
  assert.equal(school.status, 200);

  const info = await call(w, "info", { query: `?code=${code}` });
  assert.equal(info.json.active, "get-to-school");
  assert.deepEqual(
    info.json.investigations.map((i) => [i.templateId, i.count]).sort(),
    [["get-to-school", 1], ["pencil-handspan", 1]],
  );
});

test("close stops contributions and keeps the data readable; reopen resumes", async () => {
  const w = world();
  const code = await newClass(w);
  await contribute(w, entry(code));
  const closed = await call(w, "close", { method: "POST", teacher: true, body: { code, templateId: "pencil-handspan" } });
  assert.equal(closed.json.status, "closed");

  const blocked = await contribute(w, entry(code));
  assert.equal(blocked.status, 409);
  assert.equal(blocked.json.error, "closed");

  const read = await call(w, "entries", { query: `?code=${code}&template=pencil-handspan` });
  assert.equal(read.json.status, "closed");
  assert.equal(read.json.entries.length, 1);

  await call(w, "reopen", { method: "POST", teacher: true, body: { code, templateId: "pencil-handspan" } });
  assert.equal((await contribute(w, entry(code))).status, 200);
});

test("options are fixed once anyone has contributed", async () => {
  const w = world();
  const code = await newClass(w);
  await contribute(w, entry(code));
  const r = await call(w, "activate", {
    method: "POST",
    teacher: true,
    body: { code, templateId: "pencil-handspan", options: { armHeight: true } },
  });
  assert.equal(r.status, 409);
  assert.equal(r.json.error, "options-locked");

  const same = await call(w, "activate", {
    method: "POST",
    teacher: true,
    body: { code, templateId: "pencil-handspan", options: { armHeight: false } },
  });
  assert.equal(same.status, 200, "re-sending the options it already has is not a change");
});

/* ── contributing: valid ──────────────────────────────────────────────────── */

test("a valid contribution is stored and reads back; the public read carries no contributor and no time", async () => {
  const w = world();
  const code = await newClass(w);
  const body = entry(code);
  const r = await contribute(w, body);
  assert.deepEqual([r.status, r.json.ok, r.json.duplicate, r.json.count], [200, true, false, 1]);

  const read = await call(w, "entries", { query: `?code=${code}&template=pencil-handspan` });
  assert.equal(read.json.total, 1);
  assert.deepEqual(read.json.entries[0], { id: body.entryId, v: { pencil: 15, handSpan: 18.5 }, s: "class" });
  assert.deepEqual(Object.keys(read.json.entries[0]).sort(), ["id", "s", "v"]);
});

test("IDEMPOTENT: a resend with the same entryId is acknowledged and never counted twice", async () => {
  const w = world();
  const code = await newClass(w);
  const body = entry(code);
  assert.equal((await contribute(w, body)).json.duplicate, false);
  const again = await contribute(w, body);
  assert.deepEqual([again.status, again.json.duplicate, again.json.count], [200, true, 1]);
  const total = w.sqlite.prepare("SELECT COUNT(*) AS n FROM class_data_entry").get().n;
  assert.equal(total, 1);
});

test("optional arm span and height are accepted only when the teacher switched them on", async () => {
  const w = world();
  const off = await newClass(w);
  const refused = await contribute(w, entry(off, { values: { pencil: 15, handSpan: 18, armSpan: 150 } }));
  assert.equal(refused.status, 400);
  assert.equal(refused.json.error, "unknown-field");

  const on = await newClass(w, "pencil-handspan", { armHeight: true });
  const skipBoth = await contribute(w, entry(on, { values: { pencil: 15, handSpan: 18 } }));
  assert.equal(skipBoth.status, 200, "every student may skip the optional boxes");
  const withBoth = await contribute(w, entry(on, { values: { pencil: 15, handSpan: 18, armSpan: 150, height: 152 } }));
  assert.equal(withBoth.status, 200);
});

/* ── contributing: invalid and abusive ────────────────────────────────────── */

const bad = [
  ["value below the hard range", { values: { pencil: 0.5, handSpan: 18 } }, "too-small"],
  ["value above the hard range", { values: { pencil: 15, handSpan: 300 } }, "too-large"],
  ["a number as a string", { values: { pencil: "15", handSpan: 18 } }, "not-a-number"],
  ["NaN-like null", { values: { pencil: null, handSpan: 18 } }, "missing-field"],
  ["off the half-centimetre step", { values: { pencil: 15.3, handSpan: 18 } }, "bad-step"],
  ["a missing required field", { values: { pencil: 15 } }, "missing-field"],
  ["a free-text name smuggled into values", { values: { pencil: 15, handSpan: 18, name: "Maria Lopez" } }, "unknown-field"],
  ["a choice id that is not on the list", { templateId: "get-to-school", values: { mode: "Maria's mom's car" } }, "bad-choice"],
  ["a number where a choice belongs", { templateId: "get-to-school", values: { mode: 3 } }, "bad-choice"],
  ["values that are an array", { values: [15, 18] }, "bad-values"],
  ["values that are a string", { values: "15,18" }, "bad-values"],
];
for (const [name, patch, error] of bad) {
  test(`NEGATIVE: ${name} -> ${error}`, async () => {
    const w = world();
    const code = await newClass(w, patch.templateId ?? "pencil-handspan");
    const r = await contribute(w, entry(code, patch));
    assert.equal(r.status, 400);
    assert.equal(r.json.error, error);
    assert.equal(w.sqlite.prepare("SELECT COUNT(*) AS n FROM class_data_entry").get().n, 0, "nothing stored");
  });
}

test("NEGATIVE: Infinity, NaN, __proto__ and constructor keys never reach the table", async () => {
  const w = world();
  const code = await newClass(w);
  const base = entry(code);
  const raws = [
    JSON.stringify({ ...base, values: { pencil: 1e999, handSpan: 18 } }),
    `{"code":"${code}","templateId":"pencil-handspan","entryId":"${base.entryId}","clientId":"${base.clientId}","source":"class","values":{"__proto__":{"pencil":15},"pencil":15,"handSpan":18}}`,
    JSON.stringify({ ...base, values: { constructor: 1, pencil: 15, handSpan: 18 } }),
  ];
  for (const raw of raws) {
    const r = await contribute(w, raw);
    assert.equal(r.status, 400, raw.slice(0, 80));
  }
  assert.equal(w.sqlite.prepare("SELECT COUNT(*) AS n FROM class_data_entry").get().n, 0);
});

test("NEGATIVE: an extra top-level key (name, email, ...) is a visible 400, not silently dropped", async () => {
  const w = world();
  const code = await newClass(w);
  for (const extra of [{ name: "Sam" }, { email: "a@b.c" }, { contributor: "x" }, { studentId: "12345" }]) {
    const r = await contribute(w, { ...entry(code), ...extra });
    assert.equal(r.status, 400);
    assert.equal(r.json.error, "unexpected-field");
  }
});

test("NEGATIVE: bad code, bad ids, bad source, bad JSON, empty body", async () => {
  const w = world();
  const code = await newClass(w);
  const cases = [
    [entry("ZZZZZZ"), 404],
    [entry("abc"), 400],
    [entry(code, { entryId: "short" }), 400],
    [entry(code, { entryId: `${"g".repeat(24)}` }), 400],
    [entry(code, { clientId: "Maria Lopez" }), 400],
    [entry(code, { source: "teacher" }), 400],
    [entry(code, { templateId: "../../etc/passwd" }), 400],
    ["{not json", 400],
    ["", 400],
    ["[]", 400],
    ["null", 400],
  ];
  for (const [body, status] of cases) {
    const r = await contribute(w, body);
    assert.equal(r.status, status, typeof body === "string" ? body : JSON.stringify(body).slice(0, 80));
  }
});

test("NEGATIVE: an oversized body is refused before it is parsed", async () => {
  const w = world();
  const code = await newClass(w);
  const r = await contribute(w, { ...entry(code), values: { pencil: 15, handSpan: 18, pad: "x".repeat(LIMITS.maxBodyBytes) } });
  assert.equal(r.status, 413);
});

test("a code is read case-insensitively and with a hyphen, as a student would type it", async () => {
  const w = world();
  const code = await newClass(w);
  const typed = `${code.slice(0, 3)}-${code.slice(3)}`.toLowerCase();
  const info = await call(w, "info", { query: `?code=${typed}` });
  assert.equal(info.status, 200);
});

/* ── caps ─────────────────────────────────────────────────────────────────── */

test("one browser id is capped per investigation; a different id is a different contributor", async () => {
  const w = world();
  const code = await newClass(w);
  const clientId = randomHex(16);
  assert.equal((await contribute(w, entry(code, { clientId }))).status, 200);
  const second = await contribute(w, entry(code, { clientId }));
  assert.equal(second.status, 409);
  assert.equal(second.json.error, "contributor-limit");
  assert.equal((await contribute(w, entry(code, { clientId: randomHex(16) }))).status, 200);
});

test("the class cap is enforced in SQL: the entry past the limit is refused", async () => {
  const w = world();
  const code = await newClass(w);
  // Fill to one below the cap directly, then drive the endpoint across the line.
  const insert = w.sqlite.prepare(
    `INSERT INTO class_data_entry (code, template_id, entry_id, contributor, values_json, source, created_at)
     VALUES (?, 'pencil-handspan', ?, ?, '{"pencil":15,"handSpan":18}', 'class', 1)`,
  );
  for (let i = 0; i < LIMITS.maxEntriesPerInvestigation - 1; i++) insert.run(code, `e${i}`, `c${i}`);
  assert.equal((await contribute(w, entry(code))).status, 200);
  const over = await contribute(w, entry(code));
  assert.equal(over.status, 409);
  assert.equal(over.json.error, "class-full");
});

test("NEGATIVE: the per-IP write throttle stops a flood from one address", async () => {
  const w = world();
  const code = await newClass(w);
  const ip = "198.51.100.9";
  let limited = 0;
  for (let i = 0; i < 170; i++) {
    const r = await contribute(w, { ...entry(code), values: { pencil: 0 } }, { ip });
    if (r.status === 429) limited++;
  }
  assert.ok(limited >= 15, `expected the write throttle to engage, saw ${limited}`);
});

test("a whole classroom behind one school IP is not throttled", async () => {
  const w = world();
  const code = await newClass(w);
  const ip = "192.0.2.50";
  for (let i = 0; i < 40; i++) {
    const r = await contribute(w, entry(code), { ip });
    assert.equal(r.status, 200, `student ${i + 1}`);
  }
});

/* ── no-PII invariant ─────────────────────────────────────────────────────── */

test("NO PII: nothing stored or returned contains the client id, and the hash is salted per class", async () => {
  const w = world();
  const a = await newClass(w);
  const b = await newClass(w);
  const clientId = randomHex(16);
  await contribute(w, entry(a, { clientId }));
  await contribute(w, entry(b, { clientId }));

  const rows = w.sqlite.prepare("SELECT * FROM class_data_entry").all();
  assert.equal(rows.length, 2);
  for (const row of rows) {
    assert.ok(!JSON.stringify(row).includes(clientId), "the raw client id is never stored");
    assert.match(row.contributor, /^[a-f0-9]{32}$/);
  }
  assert.notEqual(rows[0].contributor, rows[1].contributor, "same browser, two classes: unlinkable");

  const read = await call(w, "entries", { query: `?code=${a}&template=pencil-handspan` });
  const wire = JSON.stringify(read.json);
  assert.ok(!wire.includes(clientId));
  assert.ok(!wire.includes(rows[0].contributor), "the contributor hash is not exposed publicly");
  const info = await call(w, "info", { query: `?code=${a}` });
  assert.ok(!JSON.stringify(info.json).includes(rows[0].contributor));
});

test("NO PII: every stored value is a finite number or a declared choice id", async () => {
  const w = world();
  const code = await newClass(w, "get-to-school");
  await contribute(w, entry(code, { templateId: "get-to-school", values: { mode: "walk" } }));
  const code2 = await newClass(w);
  await contribute(w, entry(code2));
  for (const row of w.sqlite.prepare("SELECT values_json FROM class_data_entry").all()) {
    for (const v of Object.values(JSON.parse(row.values_json))) {
      assert.ok(typeof v === "number" ? Number.isFinite(v) : ["walk", "bus", "car", "bike", "other"].includes(v));
    }
  }
});

/* ── export, purge, retention ─────────────────────────────────────────────── */

test("export is teacher-only CSV with no device identifier", async () => {
  const w = world();
  const code = await newClass(w);
  await contribute(w, entry(code, { values: { pencil: 12, handSpan: 17 } }));
  await contribute(w, entry(code, { values: { pencil: 14.5, handSpan: 19.5 }, source: "home" }));
  const r = await call(w, "export", { teacher: true, query: `?code=${code}&template=pencil-handspan` });
  assert.equal(r.status, 200);
  assert.match(r.res.headers.get("Content-Type"), /text\/csv/);
  assert.match(r.res.headers.get("Cache-Control"), /no-store/);
  const lines = r.text.trim().split("\n");
  assert.equal(lines[0], "n,day,source,pencil,handSpan");
  assert.match(lines[1], /^1,\d{4}-\d{2}-\d{2},class,12,17$/);
  assert.match(lines[2], /^2,\d{4}-\d{2}-\d{2},home,14\.5,19\.5$/);
  assert.ok(!/[a-f0-9]{24}/.test(r.text), "no ids or hashes in the export");
});

test("purge needs the teacher key AND the class code repeated, then deletes for real", async () => {
  const w = world();
  const code = await newClass(w);
  await contribute(w, entry(code));

  const noConfirm = await call(w, "purge", { method: "POST", teacher: true, body: { code } });
  assert.equal(noConfirm.status, 400);
  assert.equal(noConfirm.json.error, "confirm-required");

  const one = await call(w, "purge", {
    method: "POST",
    teacher: true,
    body: { code, templateId: "pencil-handspan", confirm: code },
  });
  assert.deepEqual([one.json.scope, one.json.removed], ["investigation", 1]);
  assert.equal(w.sqlite.prepare("SELECT COUNT(*) AS n FROM class_data_entry").get().n, 0);
  assert.equal((await call(w, "info", { query: `?code=${code}` })).status, 200, "the class itself survives an investigation purge");

  await contribute(w, entry(code));
  const all = await call(w, "purge", { method: "POST", teacher: true, body: { code, confirm: code } });
  assert.equal(all.json.scope, "class");
  for (const table of ["class_data_class", "class_data_investigation", "class_data_entry"]) {
    assert.equal(w.sqlite.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n, 0, table);
  }
  assert.equal((await call(w, "info", { query: `?code=${code}` })).status, 404);
});

test("retention: a class unused past the window is invisible, and swept whole on the next create", async () => {
  const w = world();
  const code = await newClass(w);
  await contribute(w, entry(code));
  w.sqlite.prepare("UPDATE class_data_class SET expires_at = 5 WHERE code = ?").run(code);

  assert.equal((await call(w, "info", { query: `?code=${code}` })).status, 404, "expired = gone to readers");
  assert.equal((await contribute(w, entry(code))).status, 404, "and to writers");

  await newClass(w, "get-to-school");
  assert.equal(w.sqlite.prepare("SELECT COUNT(*) AS n FROM class_data_entry WHERE code = ?").get(code).n, 0);
  assert.equal(w.sqlite.prepare("SELECT COUNT(*) AS n FROM class_data_class WHERE code = ?").get(code).n, 0);
});

test("a contribution extends the class's retention window", async () => {
  const w = world();
  const code = await newClass(w);
  w.sqlite.prepare("UPDATE class_data_class SET expires_at = ? WHERE code = ?").run(Math.floor(Date.now() / 1000) + 60, code);
  await contribute(w, entry(code));
  const after = w.sqlite.prepare("SELECT expires_at FROM class_data_class WHERE code = ?").get(code).expires_at;
  assert.ok(after > Date.now() / 1000 + 200 * 24 * 3600);
});

test("unknown routes and wrong methods are rejected cleanly", async () => {
  const w = world();
  assert.equal((await call(w, "nope")).status, 404);
  assert.equal((await call(w, "contribute", { method: "GET" })).status, 404);
  assert.equal((await call(w, "info", { method: "POST", body: {} })).status, 404);
});
