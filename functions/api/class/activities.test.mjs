/* Tests for /api/class/activity/* — Activity Studio storage, publishing and anonymous evidence. The REAL endpoint
 * runs against a REAL SQL engine (node:sqlite) behind the same thin D1 adapter as experiences.test.mjs. */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { answerText } from "../../../access-practice-lab/src/studio/core/check.js";
import { allFormats } from "../../../access-practice-lab/src/studio/core/fixtures.js";
import { questionsOf } from "../../../access-practice-lab/src/studio/core/schema.js";
import {
  ACTIVITY_ID_RE,
  ACTIVITY_LIMITS,
  studentCopyFor,
} from "../../_lib/class-platform/activities.js";
import { ACTIVITY_SCHEMA } from "../../_lib/class-platform/activity-schema.js";
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
  const h = { "CF-Connecting-IP": `10.7.${Math.floor(++ip / 250)}.${ip % 250}`, ...headers };
  if (body !== undefined) h["Content-Type"] = "application/json";
  const request = new Request(`https://example.test/api/class/${route}${query}`, {
    method,
    headers: h,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const res = await onRequest({ request, env: w.env, params: { path: route.split("/") } });
  const type = res.headers.get("Content-Type") || "";
  return {
    status: res.status,
    cache: res.headers.get("Cache-Control"),
    json: type.includes("json") ? await res.json() : null,
  };
}

const teacher = { "x-teacher-key": KEY };
const post = (w, route, headers, body) => call(w, route, { method: "POST", headers, body });

async function setup() {
  const w = world();
  const c = await post(w, "create", teacher, { app: "language", title: "P4" });
  assert.equal(c.status, 200);
  const kid = (await post(w, "join", {}, { code: c.json.code, alias: "Comet" })).json;
  return { w, code: c.json.code, passcode: c.json.teacherPasscode, kid };
}

const sample = (kind = "interactive", extra = {}) => ({ ...allFormats(kind), ...extra });
const saved = async (w, code, activity, baseRev = 0) => {
  const r = await post(w, "activity/save", teacher, { code, activity, baseRev });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  return r.json;
};
const play = (w, id) => call(w, "activity/play", { query: `?id=${id}` });
const count = (w, table) => w.sqlite.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
const answer = (q, extra = {}) => ({ q, first: "correct", final: "correct", hints: 0, revised: false, ...extra });

test("lifecycle: save, conflict, refuse invalid, publish, play, edit draft, republish, unpublish", async () => {
  const { w, code } = await setup();
  const first = await saved(w, code, sample());
  assert.match(first.id, ACTIVITY_ID_RE);
  assert.equal(first.rev, 1);
  assert.equal(first.state, "draft");
  assert.equal(first.updated, false);
  assert.equal((await play(w, first.id)).status, 404, "a draft has no student page");

  // A stale baseRev is refused with the current rev; the client's own rev/state are ignored.
  const second = await saved(w, code, { ...sample(), id: first.id, rev: 99, state: "published", title: "Garden" }, 1);
  assert.equal(second.rev, 2);
  assert.equal(second.state, "draft");
  const stale = await post(w, "activity/save", teacher, { code, activity: { ...sample(), id: first.id }, baseRev: 1 });
  assert.equal(stale.status, 409);
  assert.equal(stale.json.error, "conflict");
  assert.deepEqual(Object.keys(stale.json.current).sort(), ["rev", "title", "updatedAt"]);
  assert.equal(stale.json.current.rev, 2);
  assert.equal(stale.json.current.title, "Garden");

  // Publishing refuses invalid content with the issue list and stores nothing.
  const broken = sample();
  broken.blocks = broken.blocks.map((b) => (b.id === "q-choice" ? { ...b, answer: "zzz" } : b));
  const bad = await saved(w, code, { ...broken, id: first.id }, 2);
  const refused = await post(w, "activity/publish", teacher, { code, id: first.id });
  assert.equal(refused.status, 422);
  assert.equal(refused.json.error, "invalid-activity");
  assert.ok(refused.json.issues.errors.some((e) => e.code === "no-answer"));
  assert.equal((await play(w, first.id)).status, 404);

  const fixed = await saved(w, code, { ...sample(), id: first.id, title: "Garden v3" }, bad.rev);
  const pub = await post(w, "activity/publish", teacher, { code, id: first.id });
  assert.equal(pub.status, 200, JSON.stringify(pub.json));
  assert.deepEqual(
    { path: pub.json.path, state: pub.json.state, publishedRev: pub.json.publishedRev },
    { path: `/do/${first.id}`, state: "published", publishedRev: fixed.rev },
  );

  // Students read it with no key; it never carries the teacher's notes.
  const open = await play(w, first.id);
  assert.equal(open.status, 200);
  assert.equal(open.cache, "no-store");
  assert.equal(open.json.title, "Garden v3");
  assert.equal(open.json.publishedRev, fixed.rev);
  assert.equal(open.json.activity.notes.teacher, "");
  assert.ok(!open.json.activity.blocks.some((b) => b.type === "note"));
  assert.doesNotMatch(JSON.stringify(open.json), new RegExp(KEY));

  // Editing the draft never changes what students see; the list says "updated".
  const edit = await saved(w, code, { ...sample(), id: first.id, title: "Garden v4" }, fixed.rev);
  assert.equal((await play(w, first.id)).json.title, "Garden v3");
  const listed = await call(w, "activity/list", { query: `?code=${code}`, headers: teacher });
  assert.equal(listed.json.activities[0].updated, true);
  assert.equal(listed.json.activities[0].rev, edit.rev);
  assert.equal(listed.json.activities[0].publishedRev, fixed.rev);

  const again = await post(w, "activity/publish", teacher, { code, id: first.id });
  assert.equal(again.json.publishedRev, edit.rev);
  assert.equal((await play(w, first.id)).json.title, "Garden v4");

  const off = await post(w, "activity/unpublish", teacher, { code, id: first.id });
  assert.equal(off.json.state, "unpublished");
  const gone = await play(w, first.id);
  assert.equal(gone.status, 404);
  assert.match(gone.json.message, /not available/i);
  assert.equal((await post(w, "activity/unpublish", teacher, { code, id: first.id })).status, 409);
  assert.equal((await play(w, "../../etc")).status, 404);
});

test("play also needs the owning class to be live", async () => {
  const { w, code } = await setup();
  const a = await saved(w, code, sample());
  await post(w, "activity/publish", teacher, { code, id: a.id });
  assert.equal((await play(w, a.id)).status, 200);
  w.sqlite.prepare("UPDATE class_platform_class SET expires_at = 1").run();
  assert.equal((await play(w, a.id)).status, 404);
});

test("auth: site key and class passcode work; students, nobody, wrong keys and other classes do not", async () => {
  const { w, code, passcode, kid } = await setup();
  const a = await saved(w, code, sample());
  const other = await post(w, "create", teacher, { app: "language", title: "Other" });
  const otherPass = { "x-class-teacher": other.json.teacherPasscode };
  const student = { "x-class-student": `${kid.studentId}.${kid.studentKey}` };

  const routes = [
    ["GET", "list", undefined],
    ["GET", "get", { id: a.id }],
    ["GET", "revisions", { id: a.id }],
    ["GET", "evidence", { id: a.id }],
    ["POST", "save", { activity: sample(), baseRev: 0 }],
    ["POST", "duplicate", { id: a.id }],
    ["POST", "publish", { id: a.id }],
    ["POST", "unpublish", { id: a.id }],
    ["POST", "restore", { id: a.id, rev: 1 }],
    ["POST", "delete", { id: a.id }],
  ];
  const send = (method, route, extra, headers, forCode = code) =>
    method === "GET"
      ? call(w, `activity/${route}`, {
          query: `?code=${forCode}${extra?.id ? `&id=${extra.id}` : ""}`,
          headers,
        })
      : post(w, `activity/${route}`, headers, { code: forCode, ...extra });
  for (const [method, route, extra] of routes) {
    for (const headers of [{}, student, { "x-teacher-key": "wrong" }, { "x-class-teacher": "WRONGPASS" }, otherPass])
      assert.equal((await send(method, route, extra, headers)).status, 401, `${method} ${route}`);
  }
  // The other class's teacher cannot reach this activity through their own code either.
  for (const [method, route, extra] of routes.filter(([, , e]) => e?.id && e.id !== undefined)) {
    if (route === "delete") continue;
    const r = await send(method, route, extra, otherPass, other.json.code);
    assert.equal(r.status, 404, `${method} ${route} other class`);
  }
  assert.equal((await send("GET", "list", undefined, { "x-class-teacher": passcode })).status, 200);
  assert.equal((await send("POST", "save", { activity: sample(), baseRev: 0 }, { "x-class-teacher": passcode })).status, 200);

  // An id from another class is never overwritten (403), and never deleted.
  const steal = await post(w, "activity/save", otherPass, { code: other.json.code, activity: { ...sample(), id: a.id }, baseRev: 1 });
  assert.equal(steal.status, 403);
  assert.equal(steal.json.error, "not-yours");
  assert.equal((await post(w, "activity/delete", otherPass, { code: other.json.code, id: a.id })).status, 404);
  assert.equal((await call(w, "activity/get", { query: `?code=${code}&id=${a.id}`, headers: teacher })).status, 200);
});

test("worksheet student copy carries no answers anywhere", async () => {
  const { w, code } = await setup();
  const source = sample("worksheet");
  const a = await saved(w, code, source);
  await post(w, "activity/publish", teacher, { code, id: a.id });
  const copy = (await play(w, a.id)).json.activity;
  const originals = new Map(questionsOf(source).map((q) => [q.id, q]));
  const body = JSON.stringify(copy);
  assert.equal(copy.options.answerKey, false);
  for (const q of questionsOf(copy)) {
    const o = originals.get(q.id);
    // The key is gone or blanked, never merely hidden.
    const blank = answerText(q).replace(/[-→|;:,.()=\s\d]/g, "");
    if (!["short", "match", "sort", "order", "build"].includes(q.format)) assert.equal(blank, "", q.format);
    assert.equal(q.hint + q.explanation + q.misconception, "", q.format);
    for (const field of ["answer", "answers", "errorStep", "fixAnswer", "sample", "accept", "rubric", "points", "expr"])
      if (field in q) assert.ok(["", 0].includes(q[field]) || (Array.isArray(q[field]) && !q[field].length), `${q.format}.${field}`);
    if (o.format === "short") assert.equal(q.sample, "");
  }
  // Specific answer texts do not survive outside the options that must show them.
  assert.doesNotMatch(body, /The passage says seeds need water/);
  assert.doesNotMatch(body, /Watch for students who add/);
  assert.doesNotMatch(body, /Multiply top and bottom/);
  assert.doesNotMatch(JSON.stringify(copy.blocks.filter((b) => b.format !== "choice")).replace(/"prompt":"[^"]*"/g, ""), /"answer":"[a-z0-9]/);
  const matchQ = questionsOf(copy).find((q) => q.format === "match");
  const matchO = originals.get(matchQ.id);
  assert.ok(matchQ.pairs.every((p, i) => p.right !== matchO.pairs[i].right), "no pair is left matched");
  assert.deepEqual([...matchQ.pairs.map((p) => p.right)].sort(), [...matchO.pairs.map((p) => p.right)].sort());
  const orderQ = questionsOf(copy).find((q) => q.format === "order");
  const orderO = originals.get(orderQ.id);
  assert.ok(orderQ.items.every((it, i) => it.id !== orderO.items[i].id), "order is not the key");
  const sortQ = questionsOf(copy).find((q) => q.format === "sort");
  assert.ok(sortQ.items.every((it) => it.category === ""));
  const blankQ = questionsOf(copy).find((q) => q.format === "blank");
  assert.doesNotMatch(blankQ.text, /\[\[[^\]\s]/);
  // Other kinds keep their answers (the player checks in the browser) but never notes.
  const interactive = studentCopyFor(sample("check"));
  assert.ok(questionsOf(interactive).find((q) => q.format === "choice").answer);
  assert.ok(!interactive.blocks.some((b) => b.type === "note"));
  assert.equal(interactive.notes.teacher, "");
});

test("a word bank question keeps its words in the prompt, not the key", () => {
  const a = sample("worksheet");
  a.blocks = a.blocks.map((b) => (b.format === "blank" ? { ...b, bank: true, text: "A [[seed]] needs [[water|H2O]]." } : b));
  const q = questionsOf(studentCopyFor(a)).find((x) => x.format === "blank");
  assert.match(q.prompt, /Word bank \/ Banco de palabras: (seed, water|water, seed)$/);
  assert.equal(q.text, "A [[ ]] needs [[ ]].");
  assert.equal(q.bank, false);
});

test("save: caps, size, validation and rate limits", async () => {
  const { w, code } = await setup();
  assert.equal((await post(w, "activity/save", teacher, { code, activity: "x", baseRev: 0 })).status, 400);
  assert.equal((await post(w, "activity/save", teacher, { code, activity: sample(), baseRev: -1 })).status, 400);
  assert.equal((await post(w, "activity/save", teacher, { code, activity: sample(), baseRev: "1" })).status, 400);
  const huge = sample();
  huge.notes = { teacher: "x".repeat(ACTIVITY_LIMITS.maxBytes), misconceptions: [] };
  const big = await post(w, "activity/save", teacher, { code, activity: huge, baseRev: 0 });
  assert.equal(big.status, 413);
  assert.equal(count(w, "class_platform_activity"), 0);

  // Per-class cap.
  for (let i = 0; i < ACTIVITY_LIMITS.maxPerClass; i++)
    w.sqlite
      .prepare(
        `INSERT INTO class_platform_activity (code, activity_id, kind, draft_json, rev, created_at, updated_at) VALUES (?, ?, 'check', '{}', 1, 1, 1)`,
      )
      .run(code, `s${i.toString(16).padStart(10, "0")}`);
  const full = await post(w, "activity/save", teacher, { code, activity: sample(), baseRev: 0 });
  assert.equal(full.status, 409);
  assert.equal(full.json.error, "too-many-activities");
  assert.equal((await post(w, "activity/duplicate", teacher, { code, id: "s0000000000" })).status, 409);

  // Rate limit: a bucket at its ceiling refuses; an expired one is cleared.
  const hit = (hits, expires) =>
    w.sqlite
      .prepare(`INSERT OR REPLACE INTO class_platform_guard (bucket_key, hits, expires_at) VALUES (?, ?, ?)`)
      .run(`as:${code}`, hits, expires);
  w.sqlite.prepare("DELETE FROM class_platform_activity").run();
  hit(ACTIVITY_LIMITS.savesPerHour, Date.now() + 3_600_000);
  const limited = await post(w, "activity/save", teacher, { code, activity: sample(), baseRev: 0 });
  assert.equal(limited.status, 429);
  hit(ACTIVITY_LIMITS.savesPerHour, 1);
  assert.equal((await post(w, "activity/save", teacher, { code, activity: sample(), baseRev: 0 })).status, 200);

  hit(0, Date.now() + 3_600_000);
  w.sqlite.prepare(`INSERT OR REPLACE INTO class_platform_guard VALUES (?, ?, ?)`).run(`ap:${code}`, ACTIVITY_LIMITS.publishesPerHour, Date.now() + 3_600_000);
  const id = (await call(w, "activity/list", { query: `?code=${code}`, headers: teacher })).json.activities[0].id;
  assert.equal((await post(w, "activity/publish", teacher, { code, id })).status, 429);
});

test("two saves from the same baseRev: exactly one wins", async () => {
  const { w, code } = await setup();
  const a = await saved(w, code, sample());
  const [x, y] = await Promise.all([
    post(w, "activity/save", teacher, { code, activity: { ...sample(), id: a.id, title: "X" }, baseRev: 1 }),
    post(w, "activity/save", teacher, { code, activity: { ...sample(), id: a.id, title: "Y" }, baseRev: 1 }),
  ]);
  assert.deepEqual([x.status, y.status].sort(), [200, 409]);
  assert.equal(count(w, "class_platform_activity_rev"), 2);
});

test("revisions keep the last ten; restore makes a new rev; duplicate is a private draft copy", async () => {
  const { w, code } = await setup();
  let a = await saved(w, code, { ...sample(), title: "Rev 1" });
  for (let r = 2; r <= 12; r++) a = await saved(w, code, { ...sample(), id: a.id, title: `Rev ${r}` }, a.rev);
  const revs = await call(w, "activity/revisions", { query: `?code=${code}&id=${a.id}`, headers: teacher });
  assert.deepEqual(revs.json.revisions.map((r) => r.rev), [12, 11, 10, 9, 8, 7, 6, 5, 4, 3]);
  assert.equal(revs.json.revisions[0].title, "Rev 12");

  const old = await post(w, "activity/restore", teacher, { code, id: a.id, rev: 5, baseRev: 12 });
  assert.equal(old.status, 200);
  assert.equal(old.json.rev, 13);
  assert.equal(old.json.title, "Rev 5");
  assert.equal(old.json.activity.rev, 13);
  assert.equal((await post(w, "activity/restore", teacher, { code, id: a.id, rev: 1 })).status, 404, "pruned");
  assert.equal((await post(w, "activity/restore", teacher, { code, id: a.id, rev: 5, baseRev: 3 })).status, 409);

  await post(w, "activity/publish", teacher, { code, id: a.id });
  const withContext = { ...sample(), id: a.id, context: { grade: "6", subject: "Math", unitId: "u3", source: { origin: "curriculum", note: "Lesson 3-1" } } };
  const keep = await saved(w, code, withContext, 13);
  const copy = await post(w, "activity/duplicate", teacher, { code, id: a.id });
  assert.equal(copy.status, 200);
  assert.notEqual(copy.json.id, a.id);
  assert.match(copy.json.id, ACTIVITY_ID_RE);
  assert.deepEqual({ rev: copy.json.rev, state: copy.json.state, title: copy.json.title }, { rev: 1, state: "draft", title: `Copy of ${keep.title}` });
  assert.equal(copy.json.activity.context.source.note, "Lesson 3-1");
  assert.equal(copy.json.activity.context.unitId, "u3");
  assert.equal((await play(w, copy.json.id)).status, 404, "a copy is private until published");
  const orig = await call(w, "activity/get", { query: `?code=${code}&id=${a.id}`, headers: teacher });
  assert.equal(orig.json.state, "published");
  assert.equal(orig.json.rev, keep.rev);
});

test("delete removes the activity, its revisions and its counters", async () => {
  const { w, code } = await setup();
  const a = await saved(w, code, sample());
  await post(w, "activity/publish", teacher, { code, id: a.id });
  await post(w, "activity/response", {}, { id: a.id, session: "session-aaaa", answers: [answer("q-choice")] });
  assert.equal(count(w, "class_platform_activity_stat"), 1);
  assert.equal((await post(w, "activity/delete", teacher, { code, id: a.id })).status, 200);
  for (const t of ["activity", "activity_rev", "activity_stat"]) assert.equal(count(w, `class_platform_${t}`), 0);
  assert.equal((await post(w, "activity/delete", teacher, { code, id: a.id })).status, 404);
});

async function publishedWithResponses() {
  const ctx = await setup();
  const a = await saved(ctx.w, ctx.code, sample());
  assert.equal((await post(ctx.w, "activity/publish", teacher, { code: ctx.code, id: a.id })).status, 200);
  return { ...ctx, id: a.id };
}
const send = (w, id, session, answers, headers = {}) => post(w, "activity/response", headers, { id, session, answers });

test("responses: anonymous totals only, hard validation, only for published activities", async () => {
  const { w, code, id } = await publishedWithResponses();
  const ok = await send(w, id, "session-0001", [
    answer("q-choice", { first: "incorrect", wrongChoice: "b", hints: 2, revised: true }),
    answer("q-multi", { first: "partial", final: "incorrect" }),
    { q: "q-short", first: "review", final: "review" },
    answer("q-number", { first: "empty", final: "empty" }),
    answer("not-a-question"),
  ]);
  assert.equal(ok.status, 200);
  assert.equal(ok.json.accepted, 3, "unknown questions and unanswered ones are not counted");
  const row = w.sqlite.prepare("SELECT * FROM class_platform_activity_stat WHERE question_id = 'q-choice'").get();
  assert.deepEqual(
    { n: row.n, fc: row.first_correct, fin: row.final_correct, rev: row.revised, hints: row.hints, wrong: row.wrong_json },
    { n: 1, fc: 0, fin: 1, rev: 1, hints: 2, wrong: '{"b":1}' },
  );
  // Nothing identifying is stored: only the declared stat columns and hashed guard buckets.
  const dump = JSON.stringify(w.sqlite.prepare("SELECT * FROM class_platform_activity_stat").all());
  assert.doesNotMatch(dump, /session-0001|10\.7\./);
  assert.doesNotMatch(JSON.stringify(w.sqlite.prepare("SELECT * FROM class_platform_guard").all()), /session-0001|10\.7\./);

  const bad = [
    { id: "nope", session: "session-0002", answers: [answer("q-choice")] },
    { id, session: "x", answers: [answer("q-choice")] },
    { id, session: "session-0002", answers: [] },
    { id, session: "session-0002", answers: "q-choice" },
    { id, session: "session-0002", answers: Array.from({ length: 81 }, (_, i) => answer(`q${i}`)) },
    { id, session: "session-0002", answers: [answer("q-choice"), answer("q-choice")] },
    { id, session: "session-0002", answers: [answer("q-choice", { first: "right" })] },
    { id, session: "session-0002", answers: [answer("q-choice", { hints: 21 })] },
    { id, session: "session-0002", answers: [answer("q-choice", { hints: 1.5 })] },
    { id, session: "session-0002", answers: [answer("q-choice", { hints: -1 })] },
    { id, session: "session-0002", answers: [answer("q-choice", { revised: "yes" })] },
    { id, session: "session-0002", answers: [answer("q-choice", { wrongChoice: "<script>" })] },
    { id, session: "session-0002", answers: [answer("q-choice", { wrongChoice: 4 })] },
    { id, session: "session-0002", answers: [answer("bad id!")] },
  ];
  for (const body of bad) assert.equal((await post(w, "activity/response", {}, body)).status, 400, JSON.stringify(body).slice(0, 80));
  assert.equal(count(w, "class_platform_activity_stat"), 3);

  // A wrong choice that is not one of the question's options is ignored; a correct first try never records one.
  await send(w, id, "session-0003", [answer("q-choice", { first: "incorrect", wrongChoice: "zz" })]);
  await send(w, id, "session-0004", [answer("q-choice", { first: "correct", wrongChoice: "b" })]);
  assert.equal(w.sqlite.prepare("SELECT wrong_json FROM class_platform_activity_stat WHERE question_id = 'q-choice'").get().wrong_json, '{"b":1}');

  assert.equal((await send(w, "s0000000000", "session-0005", [answer("q-choice")])).status, 404);
  await post(w, "activity/unpublish", teacher, { code, id });
  assert.equal((await send(w, id, "session-0006", [answer("q-choice")])).status, 404);
});

test("responses: strict per session, generous per IP, distinct wrong choices capped", async () => {
  const { w, id } = await publishedWithResponses();
  const same = { "CF-Connecting-IP": "203.0.113.9" };
  for (let i = 0; i < ACTIVITY_LIMITS.responsesPerSessionHour; i++)
    assert.equal((await send(w, id, "session-same1", [answer("q-choice")], same)).status, 200);
  assert.equal((await send(w, id, "session-same1", [answer("q-choice")], same)).status, 429);
  // A whole class on one IP is fine with distinct sessions.
  for (let i = 0; i < 40; i++)
    assert.equal((await send(w, id, `session-kid${i}`, [answer("q-choice")], same)).status, 200);
  w.sqlite
    .prepare("UPDATE class_platform_guard SET hits = ? WHERE bucket_key LIKE 'ar:i:%'")
    .run(ACTIVITY_LIMITS.responsesPerIpHour);
  assert.equal((await send(w, id, "session-late1", [answer("q-choice")], same)).status, 429);

  // The wrong-choice map cannot grow without bound.
  const act = JSON.parse(w.sqlite.prepare("SELECT published_json FROM class_platform_activity").get().published_json);
  const q = questionsOf(act).find((x) => x.format === "choice");
  q.options = Array.from({ length: 8 }, (_, i) => ({ id: `o${i}`, text: `T${i}` }));
  w.sqlite.prepare("UPDATE class_platform_activity SET published_json = ?").run(JSON.stringify(act));
  w.sqlite.prepare("DELETE FROM class_platform_guard").run();
  w.sqlite.prepare("DELETE FROM class_platform_activity_stat").run();
  w.sqlite.prepare("UPDATE class_platform_activity_stat SET wrong_json = ?").run("{}");
  const ids = q.options.map((o) => o.id);
  const wide = Array.from({ length: ACTIVITY_LIMITS.maxWrongChoices }, (_, i) => `x${i}`);
  q.options = [...q.options, ...wide.map((x) => ({ id: x, text: x }))];
  w.sqlite.prepare("UPDATE class_platform_activity SET published_json = ?").run(JSON.stringify(act));
  for (const [n, choice] of [...wide, ids[0]].entries())
    await send(w, id, `session-cap${String(n).padStart(2, "0")}`, [answer(q.id, { first: "incorrect", final: "incorrect", wrongChoice: choice })]);
  const stored = JSON.parse(w.sqlite.prepare("SELECT wrong_json FROM class_platform_activity_stat WHERE question_id = ?").get(q.id).wrong_json);
  assert.equal(Object.keys(stored).length, ACTIVITY_LIMITS.maxWrongChoices);
  assert.equal(stored[ids[0]], undefined);
  assert.equal(w.sqlite.prepare("SELECT n FROM class_platform_activity_stat WHERE question_id = ?").get(q.id).n, wide.length + 1);
});

test("evidence: percentages, wrong choices, plain suggestions; too few responses say so", async () => {
  const { w, code, id } = await publishedWithResponses();
  const evidence = () => call(w, "activity/evidence", { query: `?code=${code}&id=${id}`, headers: teacher });
  assert.equal((await call(w, "activity/evidence", { query: `?code=${code}&id=${id}` })).status, 401);

  let s = 0;
  const batch = async (list) => {
    for (const a of list) await send(w, id, `session-ev${String(++s).padStart(4, "0")}`, [a]);
  };
  await batch([answer("q-choice", { first: "incorrect", wrongChoice: "b" }), answer("q-choice", { first: "incorrect", wrongChoice: "b", final: "correct", revised: true, hints: 2 })]);
  let ev = (await evidence()).json;
  const few = ev.questions.find((q) => q.id === "q-choice");
  assert.equal(few.n, 2);
  assert.ok(ev.suggestions.some((t) => /Question 4: too few responses to say/.test(t) || /too few responses to say/.test(t)));
  assert.ok(!ev.suggestions.some((t) => /chose/.test(t)), "no claim from two responses");

  await batch([
    ...Array.from({ length: 9 }, () => answer("q-choice", { first: "incorrect", final: "incorrect", wrongChoice: "b", hints: 2 })),
    ...Array.from({ length: 2 }, () => answer("q-choice")),
    ...Array.from({ length: 6 }, () => answer("q-multi")),
  ]);
  ev = (await evidence()).json;
  const q = ev.questions.find((x) => x.id === "q-choice");
  assert.equal(q.n, 13);
  assert.equal(q.firstTryPct, 15);
  assert.equal(q.finalPct, 31);
  assert.equal(q.revised, 1);
  assert.equal(q.avgHints, 1.5);
  assert.deepEqual(q.topWrong, [{ choice: "b", text: "Only snow", count: 11 }]);
  assert.ok(ev.suggestions.includes('Question 1: in these responses, 11 of 13 chose "Only snow" first. Review the idea behind this question.'));
  const multi = ev.questions.find((x) => x.id === "q-multi");
  assert.equal(multi.firstTryPct, 100);
  assert.ok(ev.suggestions.some((t) => /^Question 2: 100% were correct on the first try in these responses/.test(t)));
  assert.match(ev.note, /anonymous/);
  assert.ok(ev.suggestions.every((t) => !/\b(Maria|struggl|misconception|your student)\b/i.test(t)));
  const short = ev.questions.find((x) => x.format === "short");
  assert.equal(short.graded, false);
});

test("deleting the class deletes its activities, revisions and counters", async () => {
  const { w, code, id } = await publishedWithResponses();
  await send(w, id, "session-purge1", [answer("q-choice")]);
  assert.equal(count(w, "class_platform_activity_stat"), 1);
  assert.equal((await post(w, "delete", teacher, { code, confirm: code })).status, 200);
  for (const t of ["activity", "activity_rev", "activity_stat"]) assert.equal(count(w, `class_platform_${t}`), 0, t);
  assert.equal((await play(w, id)).status, 404);
});

test("expired classes are pruned with their activities", async () => {
  const { w, code, id } = await publishedWithResponses();
  await send(w, id, "session-prune1", [answer("q-choice")]);
  w.sqlite.prepare("UPDATE class_platform_class SET expires_at = 1").run();
  const { pruneExpired } = await import("../../_lib/class-platform/store.js");
  await pruneExpired(w.env.DB, Date.now());
  for (const t of ["activity", "activity_rev", "activity_stat"]) assert.equal(count(w, `class_platform_${t}`), 0, t);
  assert.equal(code.length > 0, true);
});

test("text in titles and prompts is stored as text and returned as JSON only", async () => {
  const { w, code } = await setup();
  const evil = '<img src=x onerror=alert(1)><script>alert(2)</script>';
  const a = sample();
  a.title = evil;
  a.description = evil;
  a.blocks[3] = { ...a.blocks[3], prompt: evil };
  const r = await saved(w, code, a);
  assert.equal(r.title, evil);
  await post(w, "activity/publish", teacher, { code, id: r.id });
  const res = await play(w, r.id);
  assert.equal(res.json.title, evil);
  const request = new Request(`https://example.test/api/class/activity/play?id=${r.id}`, { headers: { "CF-Connecting-IP": "10.9.9.9" } });
  const raw = await onRequest({ request, env: w.env, params: { path: ["activity", "play"] } });
  assert.match(raw.headers.get("Content-Type"), /^application\/json/);
  assert.equal(raw.headers.get("X-Content-Type-Options") ?? "nosniff", "nosniff");
});

test("migration 0019_activity_studio.sql matches ACTIVITY_SCHEMA", () => {
  const sql = readFileSync(fileURLToPath(new URL("../../../migrations/0019_activity_studio.sql", import.meta.url)), "utf8")
    .replace(/--.*$/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  const runtime = `${ACTIVITY_SCHEMA.map((s) => s.replace(/\s+/g, " ").trim()).join("; ")};`;
  assert.equal(sql, runtime);
});
