// node --test functions/api/studio/ai.test.mjs
// Optional AI drafting for Activity Studio. The model is a stub (the Workers AI binding): no network. The model's
// reply is untrusted, so these tests drive hostile and malformed replies and assert on what the stub was sent.
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { allFormats } from "../../../access-practice-lab/src/studio/core/fixtures.js";
import { questionsOf } from "../../../access-practice-lab/src/studio/core/schema.js";
import { onRequest as classRequest } from "../class/[[path]].js";
import { STUDIO_AI_LIMITS, onRequest } from "./ai.js";

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

const KEY = "site-key-for-tests";
let ipN = 0;
const base = allFormats("check");
const choiceQ = base.blocks.find((b) => b.id === "q-choice");
const numberQ = base.blocks.find((b) => b.format === "number");
const GOOD = {
  title: "Seeds and Sun",
  description: "A quick check.",
  kind: "check",
  blocks: [
    { type: "text", text: "Answer each question.", role: "directions" },
    choiceQ,
    { ...numberQ, id: "q-two" },
  ],
};
const aiEnv = (reply, seen = [], extra = {}) => {
  const sqlite = new DatabaseSync(":memory:");
  return {
    TEACHER_KEY: KEY,
    DB: d1(sqlite),
    sqlite,
    seen,
    AI: {
      run: async (_model, input) => {
        seen.push(input);
        return { response: typeof reply === "string" ? reply : JSON.stringify(reply) };
      },
    },
    ...extra,
  };
};
const request = (env, { method = "POST", body, headers = {}, signal } = {}) =>
  onRequest({
    request: new Request("https://x.test/api/studio/ai", {
      method,
      headers: { "content-type": "application/json", "CF-Connecting-IP": `198.51.100.${++ipN % 250}`, ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      ...(signal ? { signal } : {}),
    }),
    env,
  });
const body = async (res) => ({ status: res.status, json: await res.json() });
const teacher = { "x-teacher-key": KEY };
const makeClass = async (env, title) => {
  const res = await classRequest({
    request: new Request("https://x.test/api/class/create", {
      method: "POST",
      headers: { "content-type": "application/json", ...teacher, "CF-Connecting-IP": `192.0.2.${++ipN % 250}` },
      body: JSON.stringify({ app: "language", title }),
    }),
    env,
    params: { path: ["create"] },
  });
  return res.json();
};
const draft = (code, extra = {}) => ({ code, mode: "draft", prompt: "Three questions about plant needs", ...extra });

test("GET reports availability only; credentials are never revealed", async () => {
  assert.deepEqual(await body(await request({ TEACHER_KEY: KEY }, { method: "GET" })).then((r) => r.json), { ok: true, available: false });
  const withAi = await body(await request(aiEnv(GOOD), { method: "GET" }));
  assert.deepEqual(withAi.json, { ok: true, available: true });
  const claude = await body(await request({ ANTHROPIC_API_KEY: "sk-ant-secret" }, { method: "GET" }));
  assert.deepEqual(claude.json, { ok: true, available: true });
  assert.doesNotMatch(JSON.stringify(claude), /sk-ant|claude|workers/i);
});

test("unavailable model: 503 ai-unavailable with a plain message", async () => {
  const env = { TEACHER_KEY: KEY, DB: d1(new DatabaseSync(":memory:")) };
  const { code } = await makeClass(env, "A");
  const out = await body(await request(env, { body: draft(code), headers: teacher }));
  assert.equal(out.status, 503);
  assert.equal(out.json.error, "ai-unavailable");
  assert.match(out.json.message, /by hand/);
});

test("auth: no key, a wrong key, another class's passcode and a student are 401; site key and class passcode work", async () => {
  const env = aiEnv(GOOD);
  const a = await makeClass(env, "A");
  const b = await makeClass(env, "B");
  const join = await classRequest({
    request: new Request("https://x.test/api/class/join", {
      method: "POST",
      headers: { "content-type": "application/json", "CF-Connecting-IP": "192.0.2.250" },
      body: JSON.stringify({ code: a.code, alias: "Comet" }),
    }),
    env,
    params: { path: ["join"] },
  });
  const kid = await join.json();
  const send = (headers, code = a.code) => request(env, { body: draft(code), headers }).then(body);
  assert.equal((await send({})).status, 401);
  assert.equal((await send({ "x-teacher-key": "wrong" })).status, 401);
  assert.equal((await send({ "x-class-teacher": b.teacherPasscode })).status, 401);
  assert.equal((await send({ "x-class-student": `${kid.studentId}.${kid.studentKey}` })).status, 401);
  assert.equal((await send({ "x-class-teacher": "" })).status, 401);
  assert.equal(env.seen.length, 0, "the model is never called for an unauthorized caller");
  assert.equal((await send(teacher)).status, 200);
  assert.equal((await send({ "x-class-teacher": a.teacherPasscode })).status, 200);
  assert.equal(env.seen.length, 2);
});

test("draft: a good reply becomes a normalized, validated activity; context comes from the teacher", async () => {
  const env = aiEnv(`Here you go:\n\`\`\`json\n${JSON.stringify(GOOD)}\n\`\`\``);
  const { code } = await makeClass(env, "A");
  const out = await body(
    await request(env, {
      headers: teacher,
      body: draft(code, { kind: "check", context: { grade: "3", subject: "Science", unitTitle: "Plants", objective: "Name what plants need", vocab: [{ term: "habitat", def: "where a thing lives" }] } }),
    }),
  );
  assert.equal(out.status, 200, JSON.stringify(out.json));
  const a = out.json.activity;
  assert.equal(a.schema, "lp-activity/1");
  assert.equal(a.title, "Seeds and Sun");
  assert.equal(a.kind, "check");
  assert.equal(questionsOf(a).length, 2);
  assert.deepEqual(out.json.issues.errors, []);
  assert.equal(a.context.grade, "3");
  assert.equal(a.context.source.origin, "idea");
  assert.deepEqual(a.context.standards, []);
  assert.equal(a.options.timer, false);
  assert.match(JSON.stringify(env.seen[0]), /Name what plants need/);
  assert.match(JSON.stringify(env.seen[0]), /habitat/);
});

test("malformed replies are dropped whole with a clear error; nothing raw is returned", async () => {
  for (const reply of ["I cannot do that.", "{}", '{"blocks": []}', '{"blocks": "x"}', '{"title":"x"}', "[1,2,3]", '{"activity": null}', '{"blocks":[{"type":"exec","text":"x"}]}']) {
    const env = aiEnv(reply);
    const { code } = await makeClass(env, "A");
    const out = await body(await request(env, { headers: teacher, body: draft(code) }));
    assert.equal(out.status, 502, reply);
    assert.equal(out.json.error, "ai-bad-reply");
    assert.match(out.json.message, /could not be used/);
    assert.equal(out.json.activity, undefined);
    assert.doesNotMatch(JSON.stringify(out.json), /cannot do that/);
  }
});

test("hostile reply: HTML stays inert text; fields the schema does not define are dropped; the model cannot set metadata", async () => {
  const evil = "<img src=x onerror=alert(1)><script>alert(2)</script>";
  const reply = {
    title: evil,
    description: evil,
    kind: "check",
    notes: { teacher: "model notes" },
    context: { grade: "99", standards: [{ code: "6.RP.1", origin: "curriculum" }], source: { origin: "curriculum" } },
    supports: { spanish: true },
    options: { timer: true },
    look: { accent: "red" },
    __proto__: { polluted: true },
    blocks: [
      { type: "script", text: "alert(1)" },
      { type: "question", format: "choice", prompt: evil, options: [{ id: "a", text: evil, onclick: "x()" }, { id: "b", text: "Two" }], answer: "a", html: evil, rev: 99 },
      { type: "image", src: "javascript:alert(1)", alt: evil },
      { type: "image", src: "https://evil.example/x.png", alt: "far" },
      { type: "text", text: evil },
    ],
  };
  const env = aiEnv(reply);
  const { code } = await makeClass(env, "A");
  const out = await body(await request(env, { headers: teacher, body: draft(code, { context: { grade: "3" } }) }));
  assert.equal(out.status, 200);
  const a = out.json.activity;
  assert.equal(a.title, evil, "stored and returned as text only");
  assert.equal(a.notes.teacher, "");
  assert.equal(a.context.grade, "3");
  assert.deepEqual(a.context.standards, []);
  assert.equal(a.context.source.origin, "idea");
  assert.equal(a.options.timer, false);
  assert.equal(a.supports.spanish, false);
  assert.equal(a.look.accent, "");
  assert.ok(!a.blocks.some((b) => b.type === "script" || b.html || b.onclick));
  const options = a.blocks.find((b) => b.type === "question").options;
  assert.deepEqual(Object.keys(options[0]).sort(), ["id", "text"]);
  assert.ok(a.blocks.filter((b) => b.type === "image").every((b) => b.src === ""));
  assert.ok(out.json.issues.errors.some((e) => e.code === "bad-image"), "unusable pictures are reported, not rendered");
  assert.equal(a.polluted, undefined);
  assert.equal(a.rev, 0);
});

test("a repeated block id from the model gets a fresh id", async () => {
  const env = aiEnv({ ...GOOD, blocks: [choiceQ, { ...numberQ, id: choiceQ.id }] });
  const { code } = await makeClass(env, "A");
  const out = await body(await request(env, { headers: teacher, body: draft(code) }));
  const ids = out.json.activity.blocks.map((b) => b.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("edit: returns the revised full activity; notes, teacher-note blocks and pictures never reach the model and are kept", async () => {
  const pixel = allFormats("check").blocks.find((b) => b.image)?.image;
  const original = allFormats("check", {
    id: "a-local1",
    rev: 7,
    context: { grade: "6", subject: "Math", standards: [{ code: "6.RP.A.1", origin: "curriculum" }], source: { origin: "curriculum", note: "Lesson 3-1" } },
    notes: { teacher: "Maria Lopez struggles with fractions", misconceptions: ["Jordan adds instead"] },
    studentName: "Maria Lopez",
  });
  assert.ok(original.blocks.some((b) => b.type === "note"));
  const withImage = original.blocks.find((b) => b.type === "image" || b.image || b.format === "hotspot");
  const reply = { ...GOOD, title: "Revised", blocks: original.blocks.filter((b) => b.type !== "note").map((b) => ({ ...b, image: undefined, src: b.type === "image" ? "" : b.src })) };
  const seen = [];
  const env = aiEnv(reply, seen);
  const { code } = await makeClass(env, "A");
  const out = await body(
    await request(env, {
      headers: teacher,
      body: {
        code,
        mode: "edit",
        prompt: "Add three more questions",
        activity: original,
        students: [{ alias: "Comet", studentId: "st1" }],
        roster: ["Comet"],
        teacherPasscode: "SECRET1",
        context: { grade: "6", studentId: "st9", alias: "Comet", vocab: [{ term: "ratio", def: "x", studentName: "Maria" }] },
      },
    }),
  );
  assert.equal(out.status, 200, JSON.stringify(out.json).slice(0, 300));
  const sent = JSON.stringify(seen[0]);
  for (const secret of ["Maria", "Lopez", "Jordan", "Comet", "st1", "st9", "SECRET1", "studentName", "teacherPasscode", "roster", "Lesson 3-1", KEY, code, "data:image"]) assert.ok(!sent.includes(secret), secret);
  assert.ok(!/"type":"note"/.test(sent));
  assert.match(sent, /Add three more questions/);
  const a = out.json.activity;
  assert.equal(a.title, "Revised");
  assert.equal(a.id, "a-local1");
  assert.equal(a.rev, 7);
  assert.equal(a.notes.teacher, "Maria Lopez struggles with fractions", "the teacher's own notes come back untouched");
  assert.equal(a.context.standards[0].origin, "curriculum", "metadata is the teacher's, not the model's");
  assert.equal(a.context.source.note, "Lesson 3-1");
  assert.ok(a.blocks.some((b) => b.type === "note"));
  assert.ok(withImage && pixel);
  assert.equal(a.blocks.find((b) => b.format === "hotspot").image.src, pixel.src, "pictures are restored");
});

test("request validation: oversize prompt, empty prompt, mode, code, kind, edit without activity, oversize activity", async () => {
  const env = aiEnv(GOOD);
  const { code } = await makeClass(env, "A");
  const cases = [
    [draft(code, { prompt: "x".repeat(STUDIO_AI_LIMITS.prompt + 1) }), 400, "prompt-too-long"],
    [draft(code, { prompt: "   " }), 400, "invalid-prompt"],
    [draft(code, { prompt: 5 }), 400, "invalid-prompt"],
    [draft(code, { mode: "rewrite" }), 400, "invalid-mode"],
    [{ ...draft(code), code: "nope" }, 400, "invalid-code"],
    [draft(code, { kind: "quiz" }), 400, "invalid-kind"],
    [{ ...draft(code), mode: "edit" }, 400, "invalid-activity"],
    [{ ...draft(code), mode: "edit", activity: { title: "x".repeat(STUDIO_AI_LIMITS.activityBytes) } }, 413, "activity-too-large"],
  ];
  for (const [payload, status, error] of cases) {
    const out = await body(await request(env, { headers: teacher, body: payload }));
    assert.deepEqual([out.status, out.json.error], [status, error]);
  }
  assert.equal((await body(await request(env, { headers: teacher, body: draft(code, { prompt: "x".repeat(STUDIO_AI_LIMITS.prompt) }) }))).status, 200);
  assert.equal(env.seen.length, 1, "refused requests never reach the model");
  const noJson = await request(env, { headers: teacher, body: undefined });
  assert.equal(noJson.status, 400);
});

test("caps: a class over its hourly cap and an IP over its cap are refused before the model is called", async () => {
  const env = aiEnv(GOOD);
  const { code } = await makeClass(env, "A");
  env.sqlite
    .prepare("INSERT INTO class_platform_guard (bucket_key, hits, expires_at) VALUES (?, ?, ?)")
    .run(`ai:${code}`, STUDIO_AI_LIMITS.perClassHourly, Date.now() + 3_600_000);
  const over = await body(await request(env, { headers: teacher, body: draft(code) }));
  assert.equal(over.status, 429);
  assert.equal(env.seen.length, 0);

  const env2 = aiEnv(GOOD);
  const { code: code2 } = await makeClass(env2, "B");
  const store = new Map();
  const realCaches = globalThis.caches;
  globalThis.caches = {
    default: {
      async match(req) {
        const v = store.get(req.url);
        return v ? new Response(v) : undefined;
      },
      async put(req, res) {
        store.set(req.url, await res.text());
      },
    },
  };
  const as = (ip) => ({ ...teacher, "CF-Connecting-IP": ip });
  try {
    assert.equal((await request(env2, { headers: as("198.51.100.77"), body: draft(code2) })).status, 200);
    const ipKeys = [...store.keys()].filter((k) => k.includes("/studio-ai/ip/"));
    assert.equal(ipKeys.length, 1);
    for (const k of ipKeys) store.set(k, String(STUDIO_AI_LIMITS.perIpHourly));
    assert.equal((await request(env2, { headers: as("198.51.100.77"), body: draft(code2) })).status, 429);
    assert.equal(env2.seen.length, 1, "the model is not called over the per-IP cap");
    assert.equal((await request(env2, { headers: as("198.51.100.78"), body: draft(code2) })).status, 200);
    for (const k of store.keys()) if (k.includes("/day/")) store.set(k, String(STUDIO_AI_LIMITS.dailyCap));
    assert.equal((await request(env2, { headers: as("198.51.100.79"), body: draft(code2) })).status, 429);
    assert.equal(env2.seen.length, 2, "nor over the daily cap");
  } finally {
    globalThis.caches = realCaches;
  }
});

test("cancellation: an aborted request stops waiting for the model", async () => {
  const env = aiEnv(GOOD);
  env.AI.run = () => new Promise(() => {});
  const { code } = await makeClass(env, "A");
  const controller = new AbortController();
  const pending = request(env, { headers: teacher, body: draft(code), signal: controller.signal });
  setTimeout(() => controller.abort(), 20);
  const out = await body(await pending);
  assert.equal(out.status, 499);
  assert.equal(out.json.error, "cancelled");
});
