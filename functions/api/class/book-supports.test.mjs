/* Tests for /api/class/bsupport/* — Book Studio language supports delivered per student. The REAL
 * endpoint runs against a REAL SQL engine (node:sqlite) behind the same thin D1 adapter as class.test.mjs. */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { BOOK_SCHEMA } from "../../_lib/class-platform/book-schema.js";
import { onRequest } from "./[[path]].js";
import { freshDb } from "../../../tools/privacy-d1-fake.mjs";

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
function world() {
  const sqlite = freshDb();
  return { sqlite, env: { DB: d1(sqlite), TEACHER_KEY: KEY } };
}

async function call(w, route, { method = "GET", body, query = "", headers = {} } = {}) {
  const h = { "CF-Connecting-IP": `10.2.${Math.floor(++ip / 250)}.${ip % 250}`, ...headers };
  if (body !== undefined) h["Content-Type"] = "application/json";
  const request = new Request(`https://example.test/api/class/${route}${query}`, {
    method,
    headers: h,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const res = await onRequest({ request, env: w.env, params: { path: route.split("/") } });
  const type = res.headers.get("Content-Type") || "";
  return { status: res.status, res, json: type.includes("json") ? await res.json() : null };
}

const teacher = { "x-teacher-key": KEY };
const as = (s) => ({ "x-class-student": `${s.studentId}.${s.studentKey}` });

async function setup(aliases = ["Comet", "River", "Star"]) {
  const w = world();
  const c = await call(w, "create", { method: "POST", headers: teacher, body: { app: "language", title: "P3" } });
  const code = c.json.code;
  const kids = [];
  for (const alias of aliases) kids.push((await call(w, "join", { method: "POST", body: { code, alias } })).json);
  return { w, code, kids };
}

const support = (id, title, levels, extra = {}) => ({ id, type: "frame", kind: "starter", title, levels, intensity: "moderate", content: { frames: [`${title} ___`] }, ...extra });
const assignment = (extra = {}) => ({
  title: "Mystery",
  task: "Write a mystery",
  book: { title: "Mystery", pages: [{ id: "page0001", elements: [] }] },
  supports: [support("sp0000l1", "ONE", [1], { intensity: "heavy" }), support("sp0000l3", "THREE", [3]), support("sp0000l5", "FIVE", [5], { intensity: "minimal" }), support("sp0000rq", "REQ", [], { required: true })],
  plan: { default: { profile: 5 }, groups: [{ id: "grpA", name: "Group A", plan: { profile: 1 } }], students: { comet: { group: "grpA" }, river: { plan: { profile: 3 } } } },
  ...extra,
});
const publish = async (w, code, extra) => (await call(w, "bsupport/publish", { method: "POST", headers: teacher, body: { code, assignment: assignment(extra) } })).json;
const mine = async (w, code, kid, id) => (await call(w, "bsupport/mine", { query: `?code=${code}&assignment=${id}`, headers: as(kid) })).json;

test("book support schema of record matches the migration", () => {
  const sql = readFileSync(fileURLToPath(new URL("../../../migrations/0014_class_book_supports.sql", import.meta.url)), "utf8");
  const norm = (s) => s.replace(/--[^\n]*/g, "").replace(/\s+/g, " ").trim();
  assert.equal(norm(sql), norm(BOOK_SCHEMA.map((s) => `${s};`).join("\n")));
});

test("each student receives only the supports resolved for them; no profile, no peers' plans", async () => {
  const { w, code, kids } = await setup();
  const pub = await publish(w, code);
  assert.equal(pub.ok, true);
  const [comet, river, star] = kids;
  const titles = (r) => r.supports.map((s) => s.title).sort();
  const a = await mine(w, code, comet, pub.assignmentId);
  assert.deepEqual(titles(a), ["ONE", "REQ"]);
  assert.deepEqual(titles(await mine(w, code, river, pub.assignmentId)), ["REQ", "THREE"]);
  assert.deepEqual(titles(await mine(w, code, star, pub.assignmentId)), ["FIVE", "REQ"]);
  const raw = JSON.stringify(a);
  assert.ok(!raw.includes("THREE") && !raw.includes("FIVE"), "other levels' supports never leave the server");
  assert.ok(a.supports.every((s) => s.levels.length === 0), "levels cleared");
  assert.equal(a.plan.profile, 0, "the profile number is not sent");
  assert.ok(!raw.includes("Group A") && !raw.includes("grpA"), "group names stay on the server");
  assert.equal(a.assignment.book.supports.length, 0);
});

test("authorization: students cannot publish, read evidence or read as someone else", async () => {
  const { w, code, kids } = await setup();
  const pub = await publish(w, code);
  const bad = await call(w, "bsupport/publish", { method: "POST", headers: as(kids[0]), body: { code, assignment: assignment() } });
  assert.equal(bad.status, 401);
  assert.equal((await call(w, "bsupport/evidence", { query: `?code=${code}&assignment=${pub.assignmentId}`, headers: as(kids[0]) })).status, 401);
  assert.equal((await call(w, "bsupport/roster", { query: `?code=${code}&assignment=${pub.assignmentId}`, headers: as(kids[0]) })).status, 401);
  assert.equal((await call(w, "bsupport/mine", { query: `?code=${code}&assignment=${pub.assignmentId}` })).status, 401);
  const forged = { studentId: kids[0].studentId, studentKey: "AAAAAAAA" };
  assert.equal((await call(w, "bsupport/mine", { query: `?code=${code}&assignment=${pub.assignmentId}`, headers: as(forged) })).status, 401);
});

test("events are recorded for known supports only and show up in the teacher's evidence", async () => {
  const { w, code, kids } = await setup();
  const pub = await publish(w, code);
  const ev = await call(w, "bsupport/event", { method: "POST", headers: as(kids[0]), body: { code, assignment: pub.assignmentId, events: [{ supportId: "sp0000l1", action: "opened" }, { supportId: "sp0000l1", action: "used" }, { supportId: "nosuch99", action: "used" }, { supportId: "sp0000l1", action: "bogus" }] } });
  assert.equal(ev.json.stored, 2);
  await call(w, "bsupport/work", { method: "POST", headers: as(kids[0]), body: { code, assignment: pub.assignmentId, work: { revisions: [{ elementId: "e1", before: "a", after: "b", by: "student" }], attempts: [{ elementId: "e1", text: "first" }] }, texts: [{ pageId: "page0001", elementId: "e1", text: "My text" }] } });
  const evd = await call(w, "bsupport/evidence", { query: `?code=${code}&assignment=${pub.assignmentId}`, headers: teacher });
  const row = evd.json.students.find((s) => s.alias === "Comet");
  assert.equal(row.usage.find((u) => u.supportId === "sp0000l1").used, 1);
  assert.equal(row.revisions[0].after, "b");
  assert.equal(row.plan.source, "group");
  assert.equal(evd.json.students.find((s) => s.alias === "Star"), undefined);
});

test("adjust needs a reason, is logged, and changes what that student receives", async () => {
  const { w, code, kids } = await setup();
  const pub = await publish(w, code);
  const none = await call(w, "bsupport/adjust", { method: "POST", headers: teacher, body: { code, assignment: pub.assignmentId, alias: "Comet", plan: { profile: 3 } } });
  assert.equal(none.status, 400);
  const ok = await call(w, "bsupport/adjust", { method: "POST", headers: teacher, body: { code, assignment: pub.assignmentId, alias: "Comet", plan: { profile: 3, intensity: "minimal" }, reason: "Independent on three tasks" } });
  assert.equal(ok.json.ok, true);
  const r = await mine(w, code, kids[0], pub.assignmentId);
  assert.deepEqual(r.supports.map((s) => s.title).sort(), ["REQ", "THREE"]);
  const roster = await call(w, "bsupport/roster", { query: `?code=${code}&assignment=${pub.assignmentId}`, headers: teacher });
  assert.ok(roster.json.plan.log.some((l) => l.reason === "Independent on three tasks"));
});

test("removing a student removes their events and work", async () => {
  const { w, code, kids } = await setup();
  const pub = await publish(w, code);
  await call(w, "bsupport/event", { method: "POST", headers: as(kids[0]), body: { code, assignment: pub.assignmentId, events: [{ supportId: "sp0000l1", action: "used" }] } });
  await call(w, "remove-student", { method: "POST", headers: teacher, body: { code, studentId: kids[0].studentId } });
  assert.equal(w.sqlite.prepare("SELECT COUNT(*) AS n FROM class_platform_bevent").get().n, 0);
});

test("oversized or malformed assignments are refused or normalized", async () => {
  const { w, code } = await setup();
  const bad = await call(w, "bsupport/publish", { method: "POST", headers: teacher, body: { code, assignment: "nope" } });
  assert.equal(bad.status, 400);
  const evil = await publish(w, code, { supports: [{ id: "sp0000xx", type: "<script>", title: "<img onerror=x>", levels: [99], content: { frames: ["ok"] } }] });
  assert.equal(evil.ok, true);
  const row = w.sqlite.prepare("SELECT supports_json FROM class_platform_bassign").get();
  const s = JSON.parse(row.supports_json)[0];
  assert.equal(s.type, "frame");
  assert.deepEqual(s.levels, []);
});
