/* Tests for /api/class/pairs/* and /api/class/scenes/* — peer listening pairs and student-made scenes. The REAL
 * endpoint runs against a REAL SQL engine (node:sqlite) behind the same thin D1 adapter as class.test.mjs. */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { LIMITS } from "../../../shared/class-platform/contract.js";
import { SOCIAL_SCHEMA } from "../../_lib/class-platform/social-schema.js";
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
function world() {
  const sqlite = new DatabaseSync(":memory:");
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
const audio = (n = 512) => Buffer.alloc(n, 7).toString("base64");

async function setup(aliases = ["Comet", "River", "Star"]) {
  const w = world();
  const c = await call(w, "create", { method: "POST", headers: teacher, body: { app: "language", title: "P3" } });
  assert.equal(c.status, 200);
  const code = c.json.code;
  const kids = [];
  for (const alias of aliases) {
    const r = await call(w, "join", { method: "POST", body: { code, alias } });
    assert.equal(r.status, 200);
    kids.push(r.json);
  }
  return { w, code, kids };
}

const take = (code, extra = {}) => ({
  code,
  taskId: "spk-seedlings-retell",
  taskTitle: "Retell the Seedling Experiment",
  questionId: "first-step",
  seconds: 42,
  mime: "audio/webm;codecs=opus",
  data: audio(),
  ...extra,
});

test("social schema of record matches the migration", () => {
  const sql = readFileSync(
    fileURLToPath(new URL("../../../migrations/0013_class_pairs_scenes.sql", import.meta.url)),
    "utf8",
  );
  const norm = (s) => s.replace(/--[^\n]*/g, "").replace(/\s+/g, " ").trim();
  assert.equal(norm(sql), norm(SOCIAL_SCHEMA.map((s) => `${s};`).join("\n")));
});

test("pairs: off by default, teacher turns on and pairs, take reaches the partner only", async () => {
  const { w, code, kids } = await setup(["Comet", "River", "Star", "Moon"]);
  const [a, b, c, d] = kids;
  assert.equal((await call(w, "pairs/take", { method: "POST", headers: as(a), body: take(code) })).json.error, "pairs-off");
  // Students cannot configure pairs.
  assert.equal((await call(w, "pairs/config", { method: "POST", headers: as(a), body: { code, enabled: true } })).status, 401);
  const groups = [[a.studentId, b.studentId], [c.studentId, d.studentId]];
  const cfg = await call(w, "pairs/config", { method: "POST", headers: teacher, body: { code, enabled: true, groups } });
  assert.equal(cfg.status, 200, JSON.stringify(cfg.json));
  assert.deepEqual(cfg.json.groups, groups);
  // Bad groups: unknown id, duplicates, singletons.
  for (const bad of [[[a.studentId, "s0000000000"]], [[a.studentId, a.studentId]], [[a.studentId]]])
    assert.equal((await call(w, "pairs/config", { method: "POST", headers: teacher, body: { code, groups: bad } })).status, 400);

  const posted = await call(w, "pairs/take", { method: "POST", headers: as(a), body: take(code) });
  assert.equal(posted.status, 200, JSON.stringify(posted.json));
  const { takeId } = posted.json;
  assert.match(takeId, /^p[a-f0-9]{12}$/);

  const bState = (await call(w, "pairs/state", { query: `?code=${code}`, headers: as(b) })).json;
  assert.equal(bState.partners[0].alias, "Comet");
  assert.equal(bState.inbox.length, 1);
  assert.equal(bState.inbox[0].questionId, "first-step");
  const cState = (await call(w, "pairs/state", { query: `?code=${code}`, headers: as(c) })).json;
  assert.equal(cState.inbox.length, 0, "not shared outside the pair");

  const file = (who) => call(w, "pairs/file", { query: `?code=${code}&takeId=${takeId}`, headers: who });
  assert.equal((await file(as(b))).status, 200);
  assert.equal((await file(as(a))).status, 200);
  assert.equal((await file(teacher)).status, 200);
  assert.equal((await file(as(c))).status, 404, "a non-partner cannot fetch the bytes");
  assert.equal((await file({})).status, 401);

  // Replies: partner only, guarded text, fixed reactions.
  const reply = (who, body) => call(w, "pairs/reply", { method: "POST", headers: who, body: { code, takeId, ...body } });
  assert.equal((await reply(as(c), { answer: "They planted seeds.", reaction: "clear" })).status, 404);
  assert.equal((await reply(as(a), { answer: "x", reaction: "clear" })).status, 403, "not your own take");
  assert.equal((await reply(as(b), { answer: "mail me at a@b.co", reaction: "clear" })).json.error, "text-contact");
  assert.equal((await reply(as(b), { answer: "see www.example.com", reaction: "clear" })).json.error, "text-link");
  assert.equal((await reply(as(b), { answer: "call 410 555 1212", reaction: "clear" })).json.error, "text-contact");
  assert.equal((await reply(as(b), { answer: "They planted seeds.", reaction: "you rock!!" })).json.error, "invalid-reaction");
  assert.equal((await reply(as(b), { answer: "x".repeat(101), reaction: "clear" })).json.error, "text-too-long");
  assert.equal((await reply(as(b), { answer: "First they planted bean seeds.", reaction: "clear" })).status, 200);

  const aState = (await call(w, "pairs/state", { query: `?code=${code}`, headers: as(a) })).json;
  assert.equal(aState.takes[0].replies[0].answer, "First they planted bean seeds.");
  assert.equal(aState.takes[0].replies[0].alias, "River");
  const landed = await call(w, "pairs/landed", { method: "POST", headers: as(a), body: { code, takeId, listenerId: b.studentId, landed: true } });
  assert.equal(landed.status, 200);
  assert.equal((await call(w, "pairs/landed", { method: "POST", headers: as(b), body: { code, takeId, listenerId: b.studentId, landed: true } })).status, 403);

  // Re-pairing: the old partner loses access at once.
  await call(w, "pairs/config", { method: "POST", headers: teacher, body: { code, groups: [[a.studentId, c.studentId], [b.studentId, d.studentId]] } });
  assert.equal((await file(as(b))).status, 404);
  assert.equal((await file(as(c))).status, 200);

  // Teacher sees everything and removes a take.
  const t = (await call(w, "pairs/state", { query: `?code=${code}`, headers: teacher })).json;
  assert.equal(t.takes.length, 1);
  assert.equal(t.takes[0].alias, "Comet");
  assert.equal(t.retentionDays, 14);
  assert.equal((await call(w, "pairs/delete", { method: "POST", headers: teacher, body: { code, takeId } })).status, 200);
  assert.equal((await file(as(a))).status, 404);
  assert.equal(w.sqlite.prepare("SELECT COUNT(*) AS n FROM class_platform_take_reply").get().n, 0);
});

test("pairs: auto-pair, take limits, expiry on read", async () => {
  const { w, code, kids } = await setup(["Comet", "River", "Star"]);
  const cfg = await call(w, "pairs/config", { method: "POST", headers: teacher, body: { code, enabled: true, auto: true } });
  assert.equal(cfg.json.groups.length, 1);
  assert.equal(cfg.json.groups[0].length, 3, "odd learner joins a trio, nobody left out");
  const [a] = kids;
  const post = (extra) => call(w, "pairs/take", { method: "POST", headers: as(a), body: take(code, extra) });
  assert.equal((await post({ mime: "video/mp4" })).json.error, "invalid-mime");
  assert.equal((await post({ seconds: 95 })).json.error, "take-too-long");
  assert.equal((await post({ questionId: "rate-me" })).json.error, "invalid-question");
  assert.equal((await post({ taskTitle: "visit https://x.io" })).json.error, "invalid-task");
  assert.equal((await post({ data: audio(LIMITS.maxAudioBytes + 10) })).status, 413);
  const ok = await post({});
  assert.equal(ok.status, 200);
  // Expired takes are gone from every read.
  w.sqlite.prepare("UPDATE class_platform_take SET expires_at = 1").run();
  const st = (await call(w, "pairs/state", { query: `?code=${code}`, headers: as(kids[1]) })).json;
  assert.equal(st.inbox.length, 0);
  assert.equal((await call(w, "pairs/file", { query: `?code=${code}&takeId=${ok.json.takeId}`, headers: teacher })).status, 404);
});

const goodScene = {
  title: "Asking for a pencil",
  place: "classroom",
  character: "ms-patel",
  situation: "You forgot your pencil and the test is starting.",
  lines: ["Is everything okay?", "We start in one minute."],
  good: ["Excuse me, could I borrow a pencil, please?", "I forgot my pencil. May I borrow one?"],
  rude: { say: "Give me a pencil.", why: "It sounds like an order. Add please and ask." },
};

test("scenes: teacher sees pending scenes first; approval publishes to the class", async () => {
  const { w, code, kids } = await setup(["Comet", "River"]);
  const [a, b] = kids;
  const submit = (who, scene, extra = {}) => call(w, "scenes/submit", { method: "POST", headers: who, body: { code, scene, ...extra } });
  // Guarded fields name themselves.
  const bad = await submit(as(a), { ...goodScene, situation: "Text me at 410-555-1212" });
  assert.equal(bad.status, 400);
  assert.deepEqual([bad.json.error, bad.json.field], ["text-contact", "situation"]);
  assert.equal((await submit(as(a), { ...goodScene, place: "moon" })).json.error, "invalid-place");
  assert.equal((await submit(as(a), { ...goodScene, character: "dracula" })).json.error, "invalid-character");
  assert.equal((await submit(as(a), { ...goodScene, good: ["Only one"] })).json.error, "count-good");
  assert.equal((await submit(as(a), { ...goodScene, lines: ["a", "b", "c", "d"] })).json.error, "count-lines");
  assert.equal((await submit(as(a), { ...goodScene, situation: "x".repeat(201) })).json.error, "text-too-long");
  assert.equal((await submit(as(a), { ...goodScene, rude: { say: "You are a pendejo.", why: "Rude." } })).json.error, "text-language");
  assert.equal((await submit(teacher, goodScene)).status, 403);

  const made = await submit(as(a), goodScene, { audio: { mime: "audio/webm", data: audio() } });
  assert.equal(made.status, 200, JSON.stringify(made.json));
  const { sceneId } = made.json;

  // A classmate sees nothing before approval: not in the list, not the voice line.
  const bList = (await call(w, "scenes/list", { query: `?code=${code}`, headers: as(b) })).json;
  assert.deepEqual([bList.mine.length, bList.library.length], [0, 0]);
  const audioOf = (who) => call(w, "scenes/audio", { query: `?code=${code}&sceneId=${sceneId}`, headers: who });
  assert.equal((await audioOf(as(b))).status, 404);
  assert.equal((await audioOf(as(a))).status, 200);
  assert.equal((await call(w, "scenes/review", { method: "POST", headers: as(b), body: { code, sceneId, action: "approve" } })).status, 404, "a pending scene does not exist for classmates");

  const tList = (await call(w, "scenes/list", { query: `?code=${code}`, headers: teacher })).json;
  assert.equal(tList.scenes[0].status, "pending");
  assert.equal(tList.scenes[0].alias, "Comet");
  assert.equal(tList.scenes[0].hasAudio, true);

  // Send back with a note; the author sees it and resubmits.
  assert.equal((await call(w, "scenes/review", { method: "POST", headers: teacher, body: { code, sceneId, action: "return", note: "Make the why kinder, see www.x.com" } })).json.error, "text-link");
  assert.equal((await call(w, "scenes/review", { method: "POST", headers: teacher, body: { code, sceneId, action: "return", note: "Add one more line." } })).status, 200);
  const aList = (await call(w, "scenes/list", { query: `?code=${code}`, headers: as(a) })).json;
  assert.deepEqual([aList.mine[0].status, aList.mine[0].note], ["returned", "Add one more line."]);
  const again = await call(w, "scenes/submit", { method: "POST", headers: as(a), body: { code, sceneId, scene: { ...goodScene, lines: [...goodScene.lines, "Do you need something?"] } } });
  assert.equal(again.json.status, "pending");
  assert.equal((await call(w, "scenes/submit", { method: "POST", headers: as(b), body: { code, sceneId, scene: goodScene } })).status, 404, "only the author resubmits");

  assert.equal((await call(w, "scenes/review", { method: "POST", headers: teacher, body: { code, sceneId, action: "approve" } })).status, 200);
  const lib = (await call(w, "scenes/list", { query: `?code=${code}`, headers: as(b) })).json.library;
  assert.equal(lib.length, 1);
  assert.equal(lib[0].scene.lines.length, 3);
  assert.equal(lib[0].note, undefined, "the teacher's note is not shown to classmates");
  assert.equal((await audioOf(as(b))).status, 200);
  assert.equal((await call(w, "scenes/submit", { method: "POST", headers: as(a), body: { code, sceneId, scene: goodScene } })).json.error, "already-approved");

  // Voice lines expire with class audio retention; the scene text stays.
  w.sqlite.prepare("UPDATE class_platform_scene SET audio_expires_at = 1").run();
  assert.equal((await audioOf(as(b))).status, 404);

  assert.equal((await call(w, "scenes/delete", { method: "POST", headers: as(b), body: { code, sceneId } })).status, 404);
  assert.equal((await call(w, "scenes/delete", { method: "POST", headers: teacher, body: { code, sceneId } })).status, 200);
  assert.equal((await call(w, "scenes/list", { query: `?code=${code}`, headers: as(b) })).json.library.length, 0);
});

test("removing a learner or deleting the class takes their social data too", async () => {
  const { w, code, kids } = await setup(["Comet", "River"]);
  const [a, b] = kids;
  await call(w, "pairs/config", { method: "POST", headers: teacher, body: { code, enabled: true, auto: true } });
  const t = await call(w, "pairs/take", { method: "POST", headers: as(a), body: take(code) });
  await call(w, "pairs/reply", { method: "POST", headers: as(b), body: { code, takeId: t.json.takeId, answer: "Seeds first.", reaction: "brave" } });
  await call(w, "scenes/submit", { method: "POST", headers: as(a), body: { code, scene: goodScene } });
  const count = (table) => w.sqlite.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
  assert.equal((await call(w, "remove-student", { method: "POST", headers: teacher, body: { code, studentId: a.studentId } })).status, 200);
  assert.deepEqual([count("class_platform_take"), count("class_platform_take_reply"), count("class_platform_scene")], [0, 0, 0]);
  await call(w, "scenes/submit", { method: "POST", headers: as(b), body: { code, scene: goodScene } });
  assert.equal((await call(w, "delete", { method: "POST", headers: teacher, body: { code, confirm: code } })).status, 200);
  assert.deepEqual([count("class_platform_scene"), count("class_platform_pairing")], [0, 0]);
});

test("pairs and scenes are Language Page only", async () => {
  const w = world();
  const c = await call(w, "create", { method: "POST", headers: teacher, body: { app: "fluency", title: "F" } });
  assert.equal((await call(w, "pairs/state", { query: `?code=${c.json.code}`, headers: teacher })).json.error, "invalid-app");
  assert.equal((await call(w, "scenes/list", { query: `?code=${c.json.code}`, headers: teacher })).json.error, "invalid-app");
});
