/* Tests for /api/class/astatus/* — per-learner assignment status. The REAL endpoint runs against a REAL SQL engine
 * (node:sqlite) behind the same thin D1 adapter as the other class tests. */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { ASSIGN_STATUS_SCHEMA } from "../../_lib/class-platform/assign-status-schema.js";
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
const world = () => {
  const sqlite = freshDb();
  return { sqlite, env: { DB: d1(sqlite), TEACHER_KEY: KEY } };
};
async function call(w, route, { method = "GET", body, query = "", headers = {} } = {}) {
  const h = { "CF-Connecting-IP": `10.3.${Math.floor(++ip / 250)}.${ip % 250}`, ...headers };
  if (body !== undefined) h["Content-Type"] = "application/json";
  const request = new Request(`https://example.test/api/class/${route}${query}`, {
    method,
    headers: h,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const res = await onRequest({ request, env: w.env, params: { path: route.split("/") } });
  const type = res.headers.get("Content-Type") || "";
  return { status: res.status, json: type.includes("json") ? await res.json() : null };
}
const teacher = { "x-teacher-key": KEY };
const as = (s) => ({ "x-class-student": `${s.studentId}.${s.studentKey}` });

async function setup(assignments, aliases = ["Comet", "River"]) {
  const w = world();
  const c = await call(w, "create", { method: "POST", headers: teacher, body: { app: "language", title: "P3" } });
  const code = c.json.code;
  const kids = [];
  for (const alias of aliases) kids.push((await call(w, "join", { method: "POST", body: { code, alias } })).json);
  const set = await call(w, "settings", { method: "POST", headers: teacher, body: { code, settings: { assignments } } });
  assert.equal(set.status, 200, JSON.stringify(set.json));
  return { w, code, kids };
}
const A = (id, extra = {}) => ({ id, title: `Task ${id}`, path: "/speak", due: null, ...extra });
const act = (t, who, assignmentId, action, extra = {}) =>
  call(t.w, "astatus/act", { method: "POST", headers: who === "teacher" ? teacher : as(who), body: { code: t.code, assignmentId, action, ...extra } });
const mine = (t, kid) => call(t.w, "astatus/mine", { query: `?code=${t.code}`, headers: as(kid) });
const board = (t) => call(t.w, "astatus/board", { query: `?code=${t.code}`, headers: teacher });

test("the status schema of record matches the migration", () => {
  const sql = readFileSync(fileURLToPath(new URL("../../../migrations/0016_class_assign_status.sql", import.meta.url)), "utf8");
  const norm = (s) => s.replace(/--[^\n]*/g, "").replace(/\s+/g, " ").trim();
  assert.equal(norm(sql), norm(ASSIGN_STATUS_SCHEMA.map((s) => `${s};`).join("\n")));
});

test("settings accept the lifecycle fields, reject bad ones, and an old-shaped assignment still works", async () => {
  const t = await setup([A("old"), A("new", { availableFrom: "2999-01-01", attempts: 2, draft: true, supports: { writing: 2 } })]);
  const roster = await call(t.w, "roster", { query: `?code=${t.code}`, headers: teacher });
  const saved = Object.fromEntries(roster.json.settings.assignments.map((a) => [a.id, a]));
  assert.equal(saved.old.draft, undefined, "an old assignment gains no fields");
  assert.equal(saved.old.attempts, undefined);
  assert.deepEqual({ availableFrom: saved.new.availableFrom, attempts: saved.new.attempts, draft: saved.new.draft, supports: saved.new.supports }, { availableFrom: "2999-01-01", attempts: 2, draft: true, supports: { writing: 2 } });
  for (const bad of [{ attempts: 9 }, { availableFrom: "soon" }, { draft: "yes" }, { supports: { writing: 9 } }]) {
    const r = await call(t.w, "settings", { method: "POST", headers: teacher, body: { code: t.code, settings: { assignments: [A("x", bad)] } } });
    assert.equal(r.status, 400, JSON.stringify(bad));
  }
});

test("a learner starts, submits and is reviewed, and the teacher board shows it", async () => {
  const t = await setup([A("a1")]);
  const [comet, river] = t.kids;
  let r = await act(t, comet, "a1", "start");
  assert.deepEqual([r.status, r.json.status.state, r.json.status.attempt], [200, "in_progress", 1]);
  r = await act(t, comet, "a1", "submit");
  assert.equal(r.json.status.state, "submitted");
  const b = await board(t);
  const a1 = b.json.assignments[0];
  assert.deepEqual(a1.summary.counts, { assigned: 1, in_progress: 0, submitted: 1, needs_revision: 0, reviewed: 0 });
  assert.equal(a1.summary.needsReview, 1);
  assert.deepEqual(a1.students.map((s) => [s.alias, s.state]), [["Comet", "submitted"], ["River", "assigned"]]);
  r = await act(t, "teacher", "a1", "review", { studentId: comet.studentId, comment: "Clear order of events." });
  assert.equal(r.json.status.state, "reviewed");
  const m = await mine(t, comet);
  assert.deepEqual(m.json.statuses.map((s) => [s.assignmentId, s.state, s.comment]), [["a1", "reviewed", "Clear order of events."]]);
  assert.equal((await mine(t, river)).json.statuses[0].state, "assigned", "the other learner is untouched");
});

test("authorization: no credentials, wrong role, wrong learner, wrong class", async () => {
  const t = await setup([A("a1")]);
  const [comet, river] = t.kids;
  assert.equal((await call(t.w, "astatus/act", { method: "POST", body: { code: t.code, assignmentId: "a1", action: "start" } })).status, 401);
  assert.equal((await call(t.w, "astatus/board", { query: `?code=${t.code}` })).status, 401);
  assert.equal((await call(t.w, "astatus/board", { query: `?code=${t.code}`, headers: as(comet) })).status, 401, "a learner cannot read the board");
  assert.equal((await call(t.w, "astatus/mine", { query: `?code=${t.code}`, headers: teacher })).status, 403, "mine is for learners");
  assert.equal((await act(t, comet, "a1", "review", { studentId: comet.studentId })).status, 403, "a learner cannot review");
  assert.equal((await act(t, comet, "a1", "start", { studentId: river.studentId })).status, 403, "a learner cannot move another's work");
  assert.equal((await act(t, "teacher", "a1", "start", { studentId: comet.studentId })).status, 403, "a teacher does not start a learner's work");
  assert.equal((await act(t, { studentId: comet.studentId, studentKey: "WRONGKEY" }, "a1", "start")).status, 401);
  const other = await setup([A("a1")], ["Moon"]);
  const crossed = await call(t.w, "astatus/act", { method: "POST", headers: as(other.kids[0]), body: { code: t.code, assignmentId: "a1", action: "start" } });
  assert.equal(crossed.status, 401, "a learner of another class is nobody here");
  const row = t.w.sqlite.prepare(`SELECT COUNT(*) AS n FROM class_platform_astatus`).get();
  assert.equal(Number(row.n), 0, "no refused call wrote anything");
});

test("teacher actions need a real learner in this class", async () => {
  const t = await setup([A("a1")]);
  assert.equal((await act(t, "teacher", "a1", "reassign", { studentId: "nope" })).status, 400);
  assert.equal((await act(t, "teacher", "a1", "reassign", { studentId: "s0123456789" })).status, 404);
  assert.equal((await act(t, "teacher", "ghost", "reassign", { studentId: t.kids[0].studentId })).status, 404);
});

test("draft and not-yet-started work is invisible to learners and cannot be started", async () => {
  const t = await setup([A("open"), A("draft", { draft: true }), A("later", { availableFrom: "2999-01-01" })]);
  const comet = t.kids[0];
  assert.deepEqual((await mine(t, comet)).json.statuses.map((s) => s.assignmentId), ["open"]);
  const info = await call(t.w, "info", { query: `?code=${t.code}` });
  assert.deepEqual(info.json.assignments.map((a) => a.id), ["open"], "the public class page hides them too");
  assert.equal((await act(t, comet, "draft", "start")).status, 409);
  assert.equal((await act(t, comet, "draft", "start")).json.error, "not-available");
  assert.equal((await act(t, comet, "later", "start")).status, 409);
  const b = await board(t);
  assert.deepEqual(b.json.assignments.map((a) => [a.id, a.draft]), [["open", false], ["draft", true], ["later", false]], "the teacher sees all of it");
  const roster = await call(t.w, "roster", { query: `?code=${t.code}`, headers: teacher });
  assert.equal(roster.json.settings.assignments.length, 3, "the teacher's settings keep the drafts");
});

test("the family digest never lists drafts or work that has not started", async () => {
  const t = await setup([A("open"), A("draft", { draft: true }), A("later", { availableFrom: "2999-01-01" })]);
  const comet = t.kids[0];
  const me = await call(t.w, "me", { query: `?code=${t.code}`, headers: as(comet) });
  const digest = await call(t.w, "digest", { query: `?code=${t.code}&student=${comet.studentId}&token=${me.json.familyToken}` });
  assert.equal(digest.status, 200);
  assert.deepEqual(digest.json.assignments.map((a) => a.id), ["open"]);
});

test("attempts: a learner may retry until the limit; a teacher's revision request and reassignment never run out", async () => {
  const t = await setup([A("a1", { attempts: 2 })]);
  const comet = t.kids[0];
  const sid = comet.studentId;
  await act(t, comet, "a1", "start");
  await act(t, comet, "a1", "submit");
  let r = await act(t, comet, "a1", "start");
  assert.equal(r.json.status.attempt, 2, "retry while attempts remain");
  assert.equal((await mine(t, comet)).json.statuses[0].attemptsLeft, 0);
  await act(t, comet, "a1", "submit");
  r = await act(t, comet, "a1", "start");
  assert.deepEqual([r.status, r.json.error], [409, "attempts-used"]);
  r = await act(t, "teacher", "a1", "request_revision", { studentId: sid, comment: "Add one more detail." });
  assert.equal(r.json.status.state, "needs_revision");
  r = await act(t, comet, "a1", "start");
  assert.deepEqual([r.status, r.json.status.state, r.json.status.attempt], [200, "in_progress", 3], "a teacher's request is honored past the limit");
  await act(t, comet, "a1", "submit");
  r = await act(t, "teacher", "a1", "reassign", { studentId: sid });
  assert.deepEqual([r.json.status.state, r.json.status.attempt], ["assigned", 4]);
});

test("late work is accepted and flagged, and the flag clears on reassignment", async () => {
  const t = await setup([A("old", { due: "2020-01-01" }), A("future", { due: "2999-01-01" })]);
  const comet = t.kids[0];
  await act(t, comet, "old", "start");
  const late = await act(t, comet, "old", "submit");
  assert.equal(late.status, 200);
  assert.equal(late.json.status.late, true);
  await act(t, comet, "future", "start");
  assert.equal((await act(t, comet, "future", "submit")).json.status.late, false);
  const b = await board(t);
  assert.equal(b.json.assignments[0].summary.late, 1);
  const again = await act(t, "teacher", "old", "reassign", { studentId: comet.studentId });
  assert.equal(again.json.status.late, false);
});

test("comments: only a teacher writes them, a learner keeps seeing them, reassign clears them, long ones are refused", async () => {
  const t = await setup([A("a1")]);
  const comet = t.kids[0];
  await act(t, comet, "a1", "start");
  await act(t, comet, "a1", "submit");
  const tooLong = await act(t, "teacher", "a1", "request_revision", { studentId: comet.studentId, comment: "x".repeat(281) });
  assert.deepEqual([tooLong.status, tooLong.json.error], [400, "comment-too-long"]);
  await act(t, "teacher", "a1", "request_revision", { studentId: comet.studentId, comment: "  Say why.  " });
  assert.equal((await mine(t, comet)).json.statuses[0].comment, "Say why.");
  await act(t, comet, "a1", "start", { comment: "learner wrote this" });
  assert.equal((await mine(t, comet)).json.statuses[0].comment, "Say why.", "starting again keeps the feedback and ignores a learner-supplied comment");
  await act(t, comet, "a1", "submit");
  await act(t, "teacher", "a1", "reassign", { studentId: comet.studentId });
  assert.equal((await mine(t, comet)).json.statuses[0].comment, "");
});

test("history is for the teacher, lists transitions in order, and is capped", async () => {
  const t = await setup([A("a1", { attempts: 5 })]);
  const comet = t.kids[0];
  const q = (id = "a1") => `?code=${t.code}&assignmentId=${id}&studentId=${comet.studentId}`;
  await act(t, comet, "a1", "start");
  await act(t, comet, "a1", "submit");
  await act(t, "teacher", "a1", "review", { studentId: comet.studentId });
  const h = await call(t.w, "astatus/history", { query: q(), headers: teacher });
  assert.deepEqual(h.json.events.map((e) => [e.actor, e.action, e.from, e.to]), [["student", "start", "assigned", "in_progress"], ["student", "submit", "in_progress", "submitted"], ["teacher", "review", "submitted", "reviewed"]]);
  assert.equal((await call(t.w, "astatus/history", { query: q(), headers: as(comet) })).status, 401);
  assert.equal((await call(t.w, "astatus/history", { query: "?code=" + t.code, headers: teacher })).status, 400);
  for (let i = 0; i < 30; i++) {
    await act(t, "teacher", "a1", "reassign", { studentId: comet.studentId });
    await act(t, comet, "a1", "start");
    await act(t, comet, "a1", "submit");
  }
  const capped = await call(t.w, "astatus/history", { query: q(), headers: teacher });
  assert.equal(capped.json.events.length, 40);
});

test("removing a learner or deleting the class removes their status rows", async () => {
  const t = await setup([A("a1")]);
  const [comet, river] = t.kids;
  for (const kid of t.kids) {
    await act(t, kid, "a1", "start");
    await act(t, kid, "a1", "submit");
  }
  const count = (table, extra = "") => Number(t.w.sqlite.prepare(`SELECT COUNT(*) AS n FROM ${table} ${extra}`).get().n);
  assert.deepEqual([count("class_platform_astatus"), count("class_platform_aevent")], [2, 4]);
  const rm = await call(t.w, "remove-student", { method: "POST", headers: teacher, body: { code: t.code, studentId: comet.studentId } });
  assert.equal(rm.status, 200);
  assert.deepEqual([count("class_platform_astatus"), count("class_platform_aevent")], [1, 2], "only that learner's rows went");
  assert.equal(count("class_platform_astatus", `WHERE student_id = '${river.studentId}'`), 1);
  const del = await call(t.w, "delete", { method: "POST", headers: teacher, body: { code: t.code, confirm: t.code } });
  assert.equal(del.status, 200);
  assert.deepEqual([count("class_platform_astatus"), count("class_platform_aevent")], [0, 0]);
});
