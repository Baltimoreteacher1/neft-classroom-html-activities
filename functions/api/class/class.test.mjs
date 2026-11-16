/* Tests for /api/class — the class platform shared by Fluency Lab and The
 * Language Page. The REAL endpoint runs against a REAL SQL engine (node:sqlite)
 * behind a thin D1-shaped adapter, the pattern of functions/api/class-data.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { ALL_SKILLS, generateProblem, seededRandom } from "../../../math/fluency-lab/problem-bank.js";
import quizKey from "../../../shared/class-platform/quiz-key.js";
import { goalProgress, validateAlias, validateSummary } from "../../../shared/class-platform/contract.js";
import { REVIEW_SCHEMA } from "../../_lib/class-platform/store.js";
import { onRequest, SCHEMA } from "./[[path]].js";

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
  const sqlite = new DatabaseSync(":memory:");
  return { sqlite, env: { DB: d1(sqlite), TEACHER_KEY: KEY } };
}

async function call(w, route, { method = "GET", body, query = "", headers = {} } = {}) {
  const h = { "CF-Connecting-IP": `10.1.${Math.floor(++ip / 250)}.${ip % 250}`, ...headers };
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
const asStudent = (s) => ({ "x-class-student": `${s.studentId}.${s.studentKey}` });

async function newClass(w, app = "fluency") {
  const r = await call(w, "create", { method: "POST", headers: teacher, body: { app, title: "Period 3" } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  return r.json;
}
async function join(w, code, alias) {
  const r = await call(w, "join", { method: "POST", body: { code, alias } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  return r.json;
}

test("schema of record matches the migration", () => {
  const sql = readFileSync(fileURLToPath(new URL("../../../migrations/0011_class_platform.sql", import.meta.url)), "utf8");
  const norm = (s) => s.replace(/--[^\n]*/g, "").replace(/\s+/g, " ").trim();
  assert.equal(norm(sql), norm(SCHEMA.map((s) => `${s};`).join("\n")));
});

test("review schema of record matches migration 0012", () => {
  const sql = readFileSync(fileURLToPath(new URL("../../../migrations/0012_class_review.sql", import.meta.url)), "utf8");
  const norm = (s) => s.replace(/--[^\n]*/g, "").replace(/\s+/g, " ").trim();
  assert.equal(norm(sql), norm(REVIEW_SCHEMA.map((s) => `${s};`).join("\n")));
});

test("health answers without D1; data routes 503 without it", async () => {
  const w = { env: {} };
  assert.deepEqual((await call(w, "health")).json, { ok: true, d1: false, gated: false });
  assert.equal((await call(w, "info", { query: "?code=ABCDEF" })).status, 503);
});

test("creating a class needs the site teacher key", async () => {
  const w = world();
  assert.equal((await call(w, "create", { method: "POST", body: { app: "fluency", title: "x" } })).status, 401);
  assert.equal((await call(w, "create", { method: "POST", headers: teacher, body: { app: "chess", title: "x" } })).status, 400);
  const c = await newClass(w);
  assert.match(c.code, /^[A-HJ-NP-Z2-9]{6}$/);
  assert.match(c.teacherPasscode, /^[A-HJ-NP-Z2-9]{8}$/);
  const row = w.sqlite.prepare("SELECT teacher_hash FROM class_platform_class").get();
  assert.notEqual(row.teacher_hash, c.teacherPasscode, "passcode stored hashed");
});

test("aliases refuse names-with-surnames, contacts and odd characters", () => {
  assert.equal(validateAlias("Comet 7").ok, true);
  assert.equal(validateAlias("María").ok, true);
  assert.equal(validateAlias("a").error, "alias-too-short");
  assert.equal(validateAlias("Ana Maria Lopez").error, "alias-too-many-words");
  assert.equal(validateAlias("ana@school.org").error, "alias-contact");
  assert.equal(validateAlias("call 4105551212").error, "alias-contact");
  assert.equal(validateAlias("<script>").error, "alias-characters");
});

test("join, rejoin on another device, wrong key, alias taken", async () => {
  const w = world();
  const c = await newClass(w);
  const s = await join(w, c.code.toLowerCase(), "Comet");
  assert.match(s.studentId, /^s[a-f0-9]{10}$/);
  assert.equal(s.rejoined, false);
  const taken = await call(w, "join", { method: "POST", body: { code: c.code, alias: "comet" } });
  assert.equal(taken.status, 409);
  assert.equal(taken.json.error, "alias-taken");
  const wrong = await call(w, "join", { method: "POST", body: { code: c.code, alias: "Comet", studentKey: "AAAAAAAA" } });
  assert.equal(wrong.json.error, "wrong-student-key");
  const again = await call(w, "join", { method: "POST", body: { code: c.code, alias: "COMET", studentKey: s.studentKey } });
  assert.equal(again.json.rejoined, true);
  assert.equal(again.json.studentId, s.studentId);
  assert.equal((await call(w, "join", { method: "POST", body: { code: "ZZZZZZ", alias: "X1" } })).status, 404);
});

test("progress sync is last-write-wins by client time, validated and size-capped", async () => {
  const w = world();
  const c = await newClass(w);
  const s = await join(w, c.code, "River");
  const h = asStudent(s);
  const now = Date.now();
  const put = (updatedAt, data, summary) =>
    call(w, "progress", { method: "POST", headers: h, body: { code: c.code, doc: "fluency", updatedAt, data, summary } });
  assert.equal((await call(w, "progress", { query: `?code=${c.code}&doc=fluency`, headers: h })).json.doc, null);
  assert.equal((await put(now - 1000, { v: 1 }, { grade: 6, mastered: ["ratio-1"] })).json.accepted, true);
  const stale = await put(now - 5000, { v: 0 });
  assert.equal(stale.status, 409);
  assert.equal(stale.json.updatedAt, now - 1000);
  assert.equal((await put(now - 1000, { v: 1 })).json.same, true);
  assert.equal((await put(now, { v: 2 })).json.accepted, true);
  const got = await call(w, "progress", { query: `?code=${c.code}&doc=fluency`, headers: h });
  assert.deepEqual(got.json.data, { v: 2 });
  assert.equal((await put(now + 60 * 60 * 1000, { v: 3 })).json.error, "updatedAt-in-future");
  assert.equal((await put(now + 1, { big: "x".repeat(300 * 1024) })).status, 413);
  assert.equal((await put(now + 2, { v: 4 }, { grade: 42 })).json.error, "summary-grade");
  assert.equal((await call(w, "progress", { query: `?code=${c.code}&doc=fluency` })).status, 401);
  assert.equal(
    (await call(w, "progress", { query: `?code=${c.code}&doc=fluency`, headers: { "x-class-student": `${s.studentId}.AAAAAAAA` } })).status,
    401,
  );
});

test("summary validation drops unknown keys and refuses bad shapes", () => {
  assert.deepEqual(validateSummary("fluency", { grade: 3, secret: "x" }).summary, { grade: 3 });
  assert.equal(validateSummary("fluency", { needsTeacher: [{ skill: "BAD SKILL" }] }).ok, false);
  assert.equal(validateSummary("language", { domains: { speaking: 3, math: 1 } }).ok, false);
  assert.equal(validateSummary("language", { domains: { speaking: 3, writing: 1 } }).ok, true);
});

test("teacher roster opens with the class passcode; goal meter pools independent mastery", async () => {
  const w = world();
  const c = await newClass(w);
  const a = await join(w, c.code, "Orbit");
  const b = await join(w, c.code, "Ocean");
  const now = Date.now();
  for (const [s, mastered] of [
    [a, ["add-10", "add-2"]],
    [b, ["mul-0-5"]],
  ])
    await call(w, "progress", {
      method: "POST",
      headers: asStudent(s),
      body: { code: c.code, doc: "fluency", updatedAt: now, data: {}, summary: { mastered, needsTeacher: s === b ? [{ skill: "mul-0-5", why: "reassess-failed" }] : [] } },
    });
  assert.equal((await call(w, "roster", { query: `?code=${c.code}` })).status, 401);
  assert.equal((await call(w, "roster", { query: `?code=${c.code}`, headers: { "x-class-teacher": "WRONGWRO" } })).status, 401);
  const set = await call(w, "settings", {
    method: "POST",
    headers: { "x-class-teacher": c.teacherPasscode },
    body: { code: c.code, settings: { goal: { metric: "mastered-skills", target: 4, label: "Skills" } } },
  });
  assert.equal(set.status, 200, JSON.stringify(set.json));
  const roster = await call(w, "roster", { query: `?code=${c.code}`, headers: { "x-class-teacher": c.teacherPasscode.toLowerCase() } });
  assert.equal(roster.status, 200);
  assert.equal(roster.json.role, "class");
  assert.equal(roster.json.students.length, 2);
  assert.equal(roster.json.students.find((s) => s.alias === "Ocean").docs.fluency.summary.needsTeacher[0].skill, "mul-0-5");
  assert.deepEqual([roster.json.goal.value, roster.json.goal.percent, roster.json.goal.reached], [3, 75, false]);
  const info = await call(w, "info", { query: `?code=${c.code}` });
  assert.equal(info.json.goal.value, 3);
  assert.equal(info.json.students, 2);
  assert.equal(JSON.stringify(info.json).includes("Orbit"), false, "public info names nobody");
  assert.equal(goalProgress(null, []), null);
});

test("family digest opens only with the family token and is read-only", async () => {
  const w = world();
  const c = await newClass(w);
  const s = await join(w, c.code, "Sunrise");
  await call(w, "progress", { method: "POST", headers: asStudent(s), body: { code: c.code, doc: "fluency", updatedAt: Date.now(), data: { x: 1 }, summary: { weekDays: 3 } } });
  const me = await call(w, "me", { query: `?code=${c.code}`, headers: asStudent(s) });
  assert.match(me.json.familyToken, /^[a-f0-9]{20}$/);
  const bad = await call(w, "digest", { query: `?code=${c.code}&student=${s.studentId}&token=deadbeef` });
  assert.equal(bad.status, 401);
  const ok = await call(w, "digest", { query: `?code=${c.code}&student=${s.studentId}&token=${me.json.familyToken}` });
  assert.equal(ok.json.alias, "Sunrise");
  assert.equal(ok.json.docs.fluency.summary.weekDays, 3);
  assert.equal("data" in ok.json.docs.fluency, false, "the digest never returns the progress document");
  // A teacher key reset invalidates the old family link.
  await call(w, "reset-student", { method: "POST", headers: teacher, body: { code: c.code, studentId: s.studentId } });
  assert.equal((await call(w, "digest", { query: `?code=${c.code}&student=${s.studentId}&token=${me.json.familyToken}` })).status, 401);
});

test("delete purges everything; retention sweep removes expired classes", async () => {
  const w = world();
  const c = await newClass(w);
  await join(w, c.code, "Forest");
  assert.equal((await call(w, "delete", { method: "POST", headers: teacher, body: { code: c.code, confirm: "NOPE00" } })).json.error, "confirm-mismatch");
  assert.equal((await call(w, "delete", { method: "POST", headers: teacher, body: { code: c.code, confirm: c.code } })).status, 200);
  assert.equal(w.sqlite.prepare("SELECT COUNT(*) AS n FROM class_platform_student").get().n, 0);
  const old = await newClass(w);
  await join(w, old.code, "Old One");
  w.sqlite.prepare("UPDATE class_platform_class SET expires_at = 1 WHERE code = ?").run(old.code);
  assert.equal((await call(w, "info", { query: `?code=${old.code}` })).status, 404);
  await newClass(w); // create runs the sweep
  assert.equal(w.sqlite.prepare("SELECT COUNT(*) AS n FROM class_platform_class WHERE code = ?").get(old.code).n, 0);
  assert.equal(w.sqlite.prepare("SELECT COUNT(*) AS n FROM class_platform_student").get().n, 0);
});

// The right answer to problem N of a room, computed the way every device (and the server) does.
const truth = (skill, grade, seed, item) =>
  generateProblem(
    ALL_SKILLS.find((k) => k.id === skill && k.grade === grade),
    seededRandom((seed + item * 7919) >>> 0),
  ).answers[0];

test("teacher-paced session: pause, pace, anonymized wall, snapshots, nothing timed", async () => {
  const w = world();
  const c = await newClass(w);
  const a = await join(w, c.code, "Orbit");
  const b = await join(w, c.code, "Comet");
  const open = await call(w, "room/open", { method: "POST", headers: teacher, body: { code: c.code, kind: "session", config: { skill: "mul-0-5", grade: 3, count: 5, seed: 4242 } } });
  assert.equal(open.status, 200, JSON.stringify(open.json));
  const roomId = open.json.roomId;
  const right = truth("mul-0-5", 3, 4242, 0);
  const respond = (s, item, answer, correct) =>
    call(w, "room/respond", { method: "POST", headers: asStudent(s), body: { code: c.code, roomId, item, answer, correct } });
  assert.equal((await respond(a, 0, right, false)).json.error, "room-not-live");
  await call(w, "room/control", { method: "POST", headers: teacher, body: { code: c.code, roomId, status: "live" } });
  assert.equal((await respond(a, 0, right, false)).json.recorded, true);
  assert.equal((await respond(a, 0, "zz", true)).json.recorded, true, "a session answer can be revised before the reveal");
  await respond(b, 0, "zz", true);
  assert.equal((await respond(b, 3, "1", true)).json.error, "not-current-item");
  const active = await call(w, "room/active", { query: `?code=${c.code}`, headers: asStudent(a) });
  assert.deepEqual(active.json.rooms.map((r) => r.roomId), [roomId]);
  let st = await call(w, "room/state", { query: `?code=${c.code}&roomId=${roomId}`, headers: asStudent(a) });
  assert.deepEqual(st.json.wall, [], "no wall before the reveal");
  assert.equal(st.json.answered, 2);
  await call(w, "room/control", { method: "POST", headers: teacher, body: { code: c.code, roomId, reveal: true, snapshot: true } });
  st = await call(w, "room/state", { query: `?code=${c.code}&roomId=${roomId}`, headers: asStudent(b) });
  assert.deepEqual(st.json.wall, [{ answer: "zz", count: 2 }]);
  assert.equal(JSON.stringify(st.json).includes("Orbit"), false, "the wall names nobody");
  assert.equal(st.json.snapshots.length, 1);
  assert.equal(/deadline|timer|seconds|elapsed/i.test(JSON.stringify(st.json)), false);
  await call(w, "room/control", { method: "POST", headers: teacher, body: { code: c.code, roomId, status: "paused" } });
  assert.equal((await respond(a, 0, right, false)).json.error, "room-not-live");
  const paced = await call(w, "room/control", { method: "POST", headers: teacher, body: { code: c.code, roomId, status: "live", item: 3 } });
  assert.equal(paced.json.item, 3);
  assert.equal(paced.json.reveal, false, "moving on hides the wall again");
  assert.equal((await call(w, "room/control", { method: "POST", headers: teacher, body: { code: c.code, roomId, item: 9 } })).json.error, "invalid-item");
  const detail = await call(w, "room/detail", { query: `?code=${c.code}&roomId=${roomId}`, headers: teacher });
  assert.equal(detail.json.responses.length, 2);
  assert.ok(detail.json.responses.every((r) => r.alias));
  assert.equal((await call(w, "room/detail", { query: `?code=${c.code}&roomId=${roomId}`, headers: asStudent(a) })).status, 401);
});

test("class game: first answer counts, one class score, teams only add", async () => {
  const w = world();
  const c = await newClass(w);
  const players = [];
  for (const alias of ["P1", "P2", "P3", "P4"]) players.push(await join(w, c.code, alias));
  const open = await call(w, "room/open", { method: "POST", headers: teacher, body: { code: c.code, kind: "game", config: { skill: "add-10", grade: 1, count: 3, teams: 2, seed: 777 } } });
  const roomId = open.json.roomId;
  await call(w, "room/control", { method: "POST", headers: teacher, body: { code: c.code, roomId, status: "live" } });
  for (const p of players) await call(w, "room/respond", { method: "POST", headers: asStudent(p), body: { code: c.code, roomId, item: 0, answer: truth("add-10", 1, 777, 0), correct: false } });
  const again = await call(w, "room/respond", { method: "POST", headers: asStudent(players[0]), body: { code: c.code, roomId, item: 0, answer: "8", correct: false } });
  assert.equal(again.json.recorded, false, "a game answer is final");
  const st = await call(w, "room/state", { query: `?code=${c.code}&roomId=${roomId}`, headers: asStudent(players[1]) });
  assert.equal(st.json.classScore, 4);
  assert.equal(st.json.teamScores.reduce((x, y) => x + y, 0), 4);
  assert.ok([1, 2].includes(st.json.team));
  assert.equal((await call(w, "room/open", { method: "POST", headers: teacher, body: { code: c.code, kind: "quiz", config: { itemIds: ["a"] } } })).json.error, "invalid-kind");
});

test("the server judges: a client claiming correct:true for a wrong answer scores nothing", async () => {
  const w = world();
  const c = await newClass(w);
  const cheat = await join(w, c.code, "Cheater");
  const fair = await join(w, c.code, "Honest");
  const open = await call(w, "room/open", { method: "POST", headers: teacher, body: { code: c.code, kind: "game", config: { skill: "add-10", grade: 1, count: 3, teams: 2, seed: 99 } } });
  const roomId = open.json.roomId;
  await call(w, "room/control", { method: "POST", headers: teacher, body: { code: c.code, roomId, status: "live" } });
  const send = (s, answer) => call(w, "room/respond", { method: "POST", headers: asStudent(s), body: { code: c.code, roomId, item: 0, answer, correct: true } });
  await send(cheat, "not-the-answer");
  await send(fair, truth("add-10", 1, 99, 0));
  const st = await call(w, "room/state", { query: `?code=${c.code}&roomId=${roomId}`, headers: asStudent(fair) });
  assert.equal(st.json.classScore, 1, "only the honest answer counts");
  assert.equal(st.json.mine.correct, null, "a game does not announce correctness before the reveal");
  assert.equal((await call(w, "room/open", { method: "POST", headers: teacher, body: { code: c.code, kind: "game", config: { skill: "no-such-skill", grade: 1, count: 3 } } })).json.error, "unknown-skill");
});

test("live class quiz: language classes only, items come from the bank, the key lives on the server", async () => {
  const w = world();
  const fluency = await newClass(w, "fluency");
  assert.equal((await call(w, "room/open", { method: "POST", headers: teacher, body: { code: fluency.code, kind: "quiz", config: { itemIds: [Object.keys(quizKey.items)[0]] } } })).json.error, "invalid-kind");
  const c = await newClass(w, "language");
  const s = await join(w, c.code, "Luna");
  const ids = Object.keys(quizKey.items).slice(0, 3);
  assert.equal((await call(w, "room/open", { method: "POST", headers: teacher, body: { code: c.code, kind: "quiz", config: { itemIds: ["made-up-item"] } } })).json.error, "invalid-items");
  const open = await call(w, "room/open", { method: "POST", headers: teacher, body: { code: c.code, kind: "quiz", config: { title: "Warm-up", itemIds: ids } } });
  assert.equal(open.status, 200, JSON.stringify(open.json));
  const roomId = open.json.roomId;
  await call(w, "room/control", { method: "POST", headers: teacher, body: { code: c.code, roomId, status: "live" } });
  const respond = (item, answer) => call(w, "room/respond", { method: "POST", headers: asStudent(s), body: { code: c.code, roomId, item, answer, correct: true } });
  const right = await respond(0, quizKey.items[ids[0]].answer);
  assert.deepEqual([right.json.recorded, right.json.correct], [true, true]);
  await call(w, "room/control", { method: "POST", headers: teacher, body: { code: c.code, roomId, item: 1 } });
  const wrong = await respond(1, "zz");
  assert.deepEqual([wrong.json.recorded, wrong.json.correct], [true, false]);
  assert.equal((await respond(1, quizKey.items[ids[1]].answer)).json.recorded, false, "the first answer is final");
  const st = await call(w, "room/state", { query: `?code=${c.code}&roomId=${roomId}`, headers: asStudent(s) });
  assert.equal(st.json.classScore, 1);
  assert.deepEqual(Object.keys(st.json.config).sort(), ["count", "itemIds", "title"], "the config names items, never answers");
  assert.equal("key" in st.json || "answers" in st.json, false);
});

test("workspace room: students post, only the teacher sees them", async () => {
  const w = world();
  const c = await newClass(w);
  const s = await join(w, c.code, "Ocean");
  const { json: open } = await call(w, "room/open", { method: "POST", headers: teacher, body: { code: c.code, kind: "workspace", config: { skill: "decimal-add", grade: 5 } } });
  await call(w, "room/control", { method: "POST", headers: teacher, body: { code: c.code, roomId: open.roomId, status: "live" } });
  const post = await call(w, "room/workspace", { method: "POST", headers: asStudent(s), body: { code: c.code, roomId: open.roomId, workspace: { problem: "1/2 + 1/4", lines: ["2/4 + 1/4"] } } });
  assert.equal(post.status, 200);
  const big = await call(w, "room/workspace", { method: "POST", headers: asStudent(s), body: { code: c.code, roomId: open.roomId, workspace: { x: "y".repeat(20000) } } });
  assert.equal(big.status, 413);
  const detail = await call(w, "room/detail", { query: `?code=${c.code}&roomId=${open.roomId}`, headers: teacher });
  assert.deepEqual(detail.json.responses[0].workspace.lines, ["2/4 + 1/4"]);
  const st = await call(w, "room/state", { query: `?code=${c.code}&roomId=${open.roomId}`, headers: asStudent(s) });
  assert.equal("responses" in st.json, false);
});

test("voice notes: student shares a recording, teacher answers, caps hold", async () => {
  const w = world();
  const c = await newClass(w, "language");
  const s = await join(w, c.code, "Luna");
  const other = await join(w, c.code, "Sol");
  const audio = Buffer.alloc(2000, 7).toString("base64");
  assert.equal((await call(w, "audio/share", { method: "POST", headers: asStudent(s), body: { code: c.code, mime: "text/html", data: audio } })).json.error, "invalid-mime");
  const share = await call(w, "audio/share", { method: "POST", headers: asStudent(s), body: { code: c.code, label: "Speaking task 2", mime: "audio/webm;codecs=opus", data: audio } });
  assert.equal(share.status, 200, JSON.stringify(share.json));
  const tooBig = Buffer.alloc(800 * 1024, 1).toString("base64");
  assert.equal((await call(w, "audio/share", { method: "POST", headers: asStudent(s), body: { code: c.code, mime: "audio/webm", data: tooBig } })).status, 413);
  const note = await call(w, "audio/note", { method: "POST", headers: teacher, body: { code: c.code, parentId: share.json.audioId, label: "Nice linking words", mime: "audio/webm", data: audio } });
  assert.equal(note.status, 200, JSON.stringify(note.json));
  const mine = await call(w, "audio/list", { query: `?code=${c.code}`, headers: asStudent(s) });
  assert.deepEqual(mine.json.items.map((i) => i.kind).sort(), ["note", "recording"]);
  assert.equal((await call(w, "audio/list", { query: `?code=${c.code}`, headers: asStudent(other) })).json.items.length, 0);
  const file = await call(w, "audio/file", { query: `?code=${c.code}&audioId=${note.json.audioId}`, headers: asStudent(s) });
  assert.equal(file.status, 200);
  assert.equal(file.res.headers.get("Content-Type"), "audio/webm");
  assert.equal((await file.res.arrayBuffer()).byteLength, 2000);
  assert.equal((await call(w, "audio/file", { query: `?code=${c.code}&audioId=${note.json.audioId}`, headers: asStudent(other) })).status, 404);
  await call(w, "audio/heard", { method: "POST", headers: asStudent(s), body: { code: c.code, audioId: note.json.audioId } });
  const after = await call(w, "audio/list", { query: `?code=${c.code}`, headers: teacher });
  assert.equal(after.json.items.find((i) => i.kind === "note").heard, true);
  const fluency = await newClass(w, "fluency");
  const fs = await join(w, fluency.code, "Max");
  assert.equal((await call(w, "audio/share", { method: "POST", headers: asStudent(fs), body: { code: fluency.code, mime: "audio/webm", data: audio } })).json.error, "invalid-app");
});

test("starting support: strict validation, merged per student, each learner reads only their own", async () => {
  const w = world();
  const c = await newClass(w, "language");
  const a = await join(w, c.code, "Luna");
  const b = await join(w, c.code, "Sol");
  const set = (settings, headers = teacher) => call(w, "settings", { method: "POST", headers, body: { code: c.code, settings } });
  assert.equal((await set({ support: { [a.studentId]: { stages: { writing: "B" } } } }, {})).status, 401);
  for (const bad of [
    { [a.studentId]: { stages: { writing: "D" } } },
    { [a.studentId]: { stages: { math: "A" } } },
    { [a.studentId]: { stages: {}, level: 3 } },
    { notastudent: { stages: { writing: "A" } } },
    { [a.studentId]: { stages: { writing: "A" }, roadWeek: 0 } },
    [],
  ])
    assert.equal((await set({ support: bad })).status, 400, JSON.stringify(bad));
  assert.equal((await set({ roadWeek: 99 })).json.error, "invalid-road-week");
  assert.equal((await set({ support: { [a.studentId]: { stages: { writing: "B", speaking: "A" }, roadWeek: 4 } } })).status, 200);
  assert.equal((await set({ support: { [b.studentId]: { stages: { reading: "C" } } }, roadWeek: 2 })).status, 200);
  const both = (await call(w, "roster", { query: `?code=${c.code}`, headers: teacher })).json.settings;
  assert.deepEqual(Object.keys(both.support).sort(), [a.studentId, b.studentId].sort());
  const meA = (await call(w, "me", { query: `?code=${c.code}`, headers: asStudent(a) })).json;
  assert.deepEqual(meA.support, { stages: { writing: "B", speaking: "A" }, roadWeek: 4 });
  assert.equal(meA.roadWeek, 2);
  assert.doesNotMatch(JSON.stringify(meA), new RegExp(b.studentId));
  const info = (await call(w, "info", { query: `?code=${c.code}` })).json;
  assert.equal(info.support, undefined, "the public class info never carries per-student support");
  assert.equal((await set({ support: { [a.studentId]: null }, roadWeek: null })).status, 200);
  const after = (await call(w, "roster", { query: `?code=${c.code}`, headers: teacher })).json.settings;
  assert.deepEqual(Object.keys(after.support), [b.studentId]);
  assert.equal(after.roadWeek, undefined);
  const fluency = await newClass(w, "fluency");
  const f = await call(w, "settings", { method: "POST", headers: teacher, body: { code: fluency.code, settings: { support: {} } } });
  assert.equal(f.json.error, "invalid-support");
});

test("scoring queue: writing and recordings, strict review input, the learner sees only their own reviews", async () => {
  const w = world();
  const c = await newClass(w, "language");
  const s = await join(w, c.code, "Luna");
  const other = await join(w, c.code, "Sol");
  const pass = { "x-class-teacher": c.teacherPasscode };
  const share = (body, headers = asStudent(s)) => call(w, "review/share", { method: "POST", headers, body: { code: c.code, ...body } });
  assert.equal((await share({ text: "   " })).json.error, "empty-writing");
  assert.equal((await share({ text: "x".repeat(4001) })).status, 413);
  assert.equal((await share({ text: "hi" }, teacher)).status, 403);
  assert.equal((await share({ text: "hi" }, {})).status, 401);
  const work = await share({ label: "Argue: school lunch", text: "Schools should start later.\n\nStudents sleep more." });
  assert.equal(work.status, 200, JSON.stringify(work.json));
  assert.match(work.json.workId, /^w[a-f0-9]{12}$/);
  const audio = Buffer.alloc(2000, 7).toString("base64");
  const rec = await call(w, "audio/share", { method: "POST", headers: asStudent(other), body: { code: c.code, label: "Retell", mime: "audio/webm", data: audio } });
  assert.equal((await call(w, "review/queue", { query: `?code=${c.code}`, headers: asStudent(s) })).status, 401);
  const queue = await call(w, "review/queue", { query: `?code=${c.code}`, headers: pass });
  assert.equal(queue.status, 200);
  assert.deepEqual(queue.json.items.map((i) => i.kind).sort(), ["recording", "writing"]);
  const writing = queue.json.items.find((i) => i.kind === "writing");
  assert.equal(writing.text, "Schools should start later.\n\nStudents sleep more.");
  assert.equal(writing.review, null);
  const mark = (body, headers = pass) => call(w, "review/mark", { method: "POST", headers, body: { code: c.code, ...body } });
  for (const [body, error] of [
    [{ itemId: work.json.workId, rubric: "wida", chips: { task: 2 } }, "invalid-rubric"],
    [{ itemId: work.json.workId, rubric: "writing-practice", chips: { task: 4 } }, "invalid-chips"],
    [{ itemId: work.json.workId, rubric: "writing-practice", chips: { elaboration: 2 } }, "invalid-chips"],
    [{ itemId: work.json.workId, rubric: "writing-practice", chips: {}, comment: "" }, "empty-review"],
    [{ itemId: work.json.workId, rubric: "writing-practice", comment: "x".repeat(281) }, "comment-too-long"],
    [{ itemId: "../etc", rubric: "writing-practice", comment: "ok" }, "invalid-item"],
  ])
    assert.equal((await mark(body)).json.error, error, JSON.stringify(body));
  assert.equal((await mark({ itemId: work.json.workId, rubric: "writing-practice", comment: "ok" }, asStudent(s))).status, 401);
  assert.equal((await mark({ itemId: "w000000000000", rubric: "writing-practice", comment: "ok" })).status, 404);
  const ok = await mark({ itemId: work.json.workId, rubric: "writing-practice", chips: { task: 2, organization: 1 }, comment: "Clear claim. Add one reason." });
  assert.equal(ok.status, 200, JSON.stringify(ok.json));
  assert.equal((await mark({ itemId: rec.json.audioId, rubric: "speaking-practice", chips: { clarity: 3 } })).status, 200);
  const after = (await call(w, "review/queue", { query: `?code=${c.code}`, headers: teacher })).json.items;
  assert.ok(after.every((i) => i.review), "both items are marked reviewed");
  const mine = (await call(w, "review/mine", { query: `?code=${c.code}`, headers: asStudent(s) })).json.reviews;
  assert.equal(mine.length, 1);
  assert.deepEqual(mine[0].chips, { task: 2, organization: 1 });
  assert.equal(mine[0].comment, "Clear claim. Add one reason.");
  assert.equal((await call(w, "review/mine", { query: `?code=${c.code}`, headers: asStudent(other) })).json.reviews[0].kind, "recording");
  await call(w, "remove-student", { method: "POST", headers: teacher, body: { code: c.code, studentId: s.studentId } });
  assert.equal(w.sqlite.prepare("SELECT COUNT(*) AS n FROM class_platform_work").get().n, 0);
  assert.equal(w.sqlite.prepare("SELECT COUNT(*) AS n FROM class_platform_review WHERE student_id = ?").get(s.studentId).n, 0);
  await call(w, "delete", { method: "POST", headers: teacher, body: { code: c.code, confirm: c.code } });
  assert.equal(w.sqlite.prepare("SELECT COUNT(*) AS n FROM class_platform_review").get().n, 0);
  const fluency = await newClass(w, "fluency");
  const fs = await join(w, fluency.code, "Max");
  assert.equal((await call(w, "review/share", { method: "POST", headers: asStudent(fs), body: { code: fluency.code, text: "hi there" } })).json.error, "invalid-app");
});

test("language summary accepts Key Language Use counts and refuses bad shapes", () => {
  assert.equal(validateSummary("language", { byUse: { Argue: { writing: 3, speaking: 1 } } }).ok, true);
  assert.equal(validateSummary("language", { byUse: { Persuade: { writing: 1 } } }).ok, false);
  assert.equal(validateSummary("language", { byUse: { Argue: { math: 1 } } }).ok, false);
  assert.equal(validateSummary("language", { byUse: { Argue: { writing: -1 } } }).ok, false);
  assert.equal(validateSummary("language", { byUse: [] }).ok, false);
});

test("Book Studio writing coach: on by default, the teacher can turn it off, the learner reads it from /me", async () => {
  const w = world();
  const c = await newClass(w, "language");
  const s = await join(w, c.code, "Luna");
  const me = async () => (await call(w, "me", { query: `?code=${c.code}`, headers: asStudent(s) })).json;
  assert.equal((await me()).aiCoach, true);
  const set = (settings) => call(w, "settings", { method: "POST", headers: teacher, body: { code: c.code, settings } });
  assert.equal((await set({ aiCoach: "off" })).json.error, "invalid-ai-coach");
  assert.equal((await set({ aiCoach: false })).status, 200);
  assert.equal((await me()).aiCoach, false);
  assert.equal((await set({ aiCoach: true })).status, 200);
  assert.equal((await me()).aiCoach, true);
});
