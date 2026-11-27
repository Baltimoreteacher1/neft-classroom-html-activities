#!/usr/bin/env node
/**
 * tour-room.test.mjs — the live audience room for /tour/, driven through the REAL onRequest (shared handler,
 * catch-all params) against a real SQL engine (node:sqlite behind a D1-shaped adapter).
 *
 * What it holds: only closed-list ids are ever stored; one answer per phone per question; only the presenter's
 * token moves the room (and only its hash is kept); another site cannot write; rooms expire and are swept;
 * one network cannot open rooms without limit; no database means 503, never a crash.
 */
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { PROMPTS, promptForStop, REACTIONS, STOP_COUNT, UPGRADE_RESULTS, validAnswer } from "../../../shared/tour-live/prompts.js";
import { handleTourRoom, OPENS_PER_HOUR, onRequest, PRESENT_MS, ROOM_TTL_MS, tally } from "./[[path]].js";

let passed = 0;
const t = async (name, fn) => {
  await fn();
  passed++;
  console.log(`  ok  ${name}`);
};

function d1(db) {
  const make = (sql, params) => ({
    bind: (...next) => make(sql, next),
    async all() {
      return { results: db.prepare(sql).all(...params) };
    },
    async run() {
      return db.prepare(sql).run(...params);
    },
  });
  return {
    prepare: (sql) => make(sql, []),
    async batch(statements) {
      db.exec("BEGIN");
      try {
        for (const s of statements) await s.run();
        db.exec("COMMIT");
      } catch (err) {
        db.exec("ROLLBACK");
        throw err;
      }
      return statements.map(() => ({ success: true }));
    },
  };
}
const fresh = () => {
  const sqlite = new DatabaseSync(":memory:");
  return { sqlite, env: { DB: d1(sqlite) } };
};

const HOST = "https://thelanguagepage.com";
let ipCounter = 0;
async function call(env, action, { body, query = "", origin = HOST, ip, device } = {}) {
  const headers = { "Content-Type": "application/json", "CF-Connecting-IP": ip || `10.0.0.${++ipCounter % 250}` };
  if (origin) headers.Origin = origin;
  if (device) headers["X-Anon-Token"] = device;
  const request = new Request(`${HOST}/api/tour-room/${action}${query}`, {
    method: body === undefined ? "GET" : "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const res = await onRequest({ request, env, params: { path: action.split("/") }, data: {}, waitUntil() {} });
  return { status: res.status, body: await res.json() };
}
const dev = (n) => `device-${String(n).padStart(12, "0")}`;

await t("the prompt list is coherent: one prompt per stop, stops in range, ids answerable", () => {
  const stops = Object.values(PROMPTS).map((p) => p.stop);
  assert.equal(new Set(stops).size, stops.length, "two prompts share a stop");
  for (const [id, p] of Object.entries(PROMPTS)) {
    assert.ok(p.stop >= 0 && p.stop < STOP_COUNT, `${id} sits on a stop that does not exist`);
    assert.equal(promptForStop(p.stop), id);
    assert.ok(p.q.length > 10 && p.choices.length >= 3, `${id} needs a question and choices`);
    for (const [v] of p.choices) assert.ok(validAnswer(id, v));
  }
  assert.deepEqual(PROMPTS.upgrade.choices.map(([v]) => v), UPGRADE_RESULTS);
  assert.equal(validAnswer("need", "Speaking"), false, "labels are not ids");
  assert.equal(validAnswer("constructor", "x"), false);
});

await t("without the database every route answers 503 JSON", async () => {
  const r = await call({}, "open", { body: {} });
  assert.equal(r.status, 503);
  assert.equal(r.body.ok, false);
});

await t("opening a room returns a 5-character code and a token; only the token's hash is stored", async () => {
  const { sqlite, env } = fresh();
  const r = await call(env, "open", { body: {} });
  assert.equal(r.status, 200);
  assert.match(r.body.code, /^[A-HJKMNP-Z2-9]{5}$/);
  assert.match(r.body.token, /^[0-9a-f]{32}$/);
  const row = sqlite.prepare("SELECT * FROM tour_room").get();
  assert.notEqual(row.token_hash, r.body.token);
  assert.equal(row.token_hash.length, 64);
  assert.equal(JSON.stringify(row).includes(r.body.token), false, "the raw token reached the database");
});

await t("only the presenter's token moves the room, and the state is cleaned", async () => {
  const { env } = fresh();
  const { body: room } = await call(env, "open", { body: {} });
  const s0 = await call(env, "state", { query: `?code=${room.code}` });
  assert.deepEqual([s0.body.stop, s0.body.prompt, s0.body.version], [0, "", 1]);
  const bad = await call(env, "state", { body: { code: room.code, token: "0".repeat(32), stop: 4 } });
  assert.equal(bad.status, 401);
  const missing = await call(env, "state", { body: { code: room.code, stop: 4 } });
  assert.equal(missing.status, 401);
  const ok = await call(env, "state", {
    body: { code: room.code, token: room.token, stop: 99, build: 2, prompt: "nope", from: "remote" },
  });
  assert.equal(ok.body.version, 2);
  const s1 = await call(env, "state", { query: `?code=${room.code.toLowerCase()}` });
  assert.deepEqual([s1.body.stop, s1.body.build, s1.body.prompt, s1.body.from], [STOP_COUNT - 1, 2, "", "remote"]);
  await call(env, "state", { body: { code: room.code, token: room.token, stop: 4, prompt: "support" } });
  assert.equal((await call(env, "state", { query: `?code=${room.code}` })).body.prompt, "support");
});

await t("answers: closed ids only, one per phone per question, the latest wins", async () => {
  const { sqlite, env } = fresh();
  const { body: room } = await call(env, "open", { body: {} });
  const answer = (d, prompt, value) => call(env, "answer", { body: { code: room.code, device: d, prompt, value }, device: d });
  assert.equal((await answer(dev(1), "need", "speaking")).status, 200);
  assert.equal((await answer(dev(2), "need", "writing")).status, 200);
  assert.equal((await answer(dev(2), "need", "speaking")).status, 200, "changing an answer is allowed");
  assert.equal((await answer(dev(3), "need", "<script>")).status, 400);
  assert.equal((await answer(dev(3), "need", "Speaking")).status, 400, "a label is not an id");
  assert.equal((await answer(dev(3), "free-text", "hello")).status, 400);
  assert.equal((await answer("short", "need", "speaking")).status, 400, "a malformed device is refused");
  assert.equal((await answer(dev(4), "upgrade", "101")).status, 200);
  assert.equal((await answer(dev(5), "upgrade", "121")).status, 400);
  const rows = sqlite.prepare("SELECT prompt, value FROM tour_answer").all();
  assert.equal(rows.length, 3);
  for (const r of rows) assert.ok(validAnswer(r.prompt, r.value), `stored ${r.prompt}=${r.value}`);
  const res = await call(env, "results", { query: `?code=${room.code}` });
  assert.deepEqual(res.body.prompts.need, { total: 2, counts: { speaking: 2 } });
  assert.deepEqual(res.body.prompts.upgrade, { total: 1, counts: { 101: 1 } });
  assert.equal(res.body.people, 3, "answering counts as being present");
  assert.equal(JSON.stringify(res.body).includes("device-"), false, "results name no device");
});

await t("reactions are counted, never attributed, and only from the closed list", async () => {
  const { sqlite, env } = fresh();
  const { body: room } = await call(env, "open", { body: {} });
  const react = (kind) => call(env, "react", { body: { code: room.code, device: dev(7), kind }, device: dev(7) });
  for (let i = 0; i < 3; i++) assert.equal((await react("idea")).status, 200);
  assert.equal((await react(REACTIONS[0][0])).status, 200);
  assert.equal((await react("boo")).status, 400);
  const res = await call(env, "results", { query: `?code=${room.code}` });
  assert.deepEqual(res.body.reactions, { idea: 3, agree: 1 });
  assert.deepEqual(sqlite.prepare("PRAGMA table_info(tour_react)").all().map((c) => c.name), ["code", "kind", "n"]);
});

await t("presence counts phones seen in the last 75 seconds", async () => {
  const { env } = fresh();
  const now = Date.now();
  const req = (method, action, body, q = "") =>
    handleTourRoom({
      request: new Request(`${HOST}/api/tour-room/${action}${q}`, { method, headers: { Origin: HOST } }),
      env,
      body,
      action,
      now: body?.__now ?? now,
    });
  const room = await req("POST", "open", {});
  await req("POST", "join", { code: room.code, device: dev(1), __now: now - PRESENT_MS - 1000 });
  await req("POST", "join", { code: room.code, device: dev(2), __now: now - 1000 });
  await req("POST", "join", { code: room.code, device: dev(3), __now: now });
  await req("POST", "join", { code: room.code, device: dev(3), __now: now }, "");
  const s = await req("GET", "state", undefined, `?code=${room.code}`);
  assert.equal(s.people, 2);
});

await t("another site cannot write into a room", async () => {
  const { env } = fresh();
  const { body: room } = await call(env, "open", { body: {} });
  const r = await call(env, "answer", {
    body: { code: room.code, device: dev(1), prompt: "need", value: "reading" },
    origin: "https://evil.example",
  });
  assert.equal(r.status, 403);
  assert.equal((await call(env, "open", { body: {}, origin: "https://evil.example" })).status, 403);
});

await t("rooms expire after 6 hours and the next open sweeps them away", async () => {
  const { sqlite, env } = fresh();
  const t0 = Date.now() - ROOM_TTL_MS - 60_000;
  const mk = (action, body, now, q = "") =>
    handleTourRoom({
      request: new Request(`${HOST}/api/tour-room/${action}${q}`, { method: body ? "POST" : "GET", headers: { Origin: HOST } }),
      env,
      body,
      action,
      now,
    });
  const old = await mk("open", {}, t0);
  await mk("answer", { code: old.code, device: dev(1), prompt: "need", value: "reading" }, t0 + 1000);
  const gone = await mk("state", null, Date.now(), `?code=${old.code}`);
  assert.equal(gone.status, 404);
  await mk("open", {}, Date.now());
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM tour_answer").get().n, 0);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM tour_room WHERE code = ?").get(old.code).n, 0);
});

await t(`one network can open at most ${OPENS_PER_HOUR} rooms an hour`, async () => {
  const { env } = fresh();
  for (let i = 0; i < OPENS_PER_HOUR; i++) assert.equal((await call(env, "open", { body: {}, ip: "192.0.2.9" })).status, 200);
  const over = await call(env, "open", { body: {}, ip: "192.0.2.9" });
  assert.equal(over.status, 429);
  assert.equal((await call(env, "open", { body: {}, ip: "192.0.2.10" })).status, 200);
});

await t("unknown room codes and actions are refused", async () => {
  const { env } = fresh();
  assert.equal((await call(env, "state", { query: "?code=ZZZZZ" })).status, 404);
  assert.equal((await call(env, "state", { query: "?code=../x" })).status, 404);
  const { body: room } = await call(env, "open", { body: {} });
  assert.equal((await call(env, "delete", { body: { code: room.code } })).status, 404);
});

await t("tally drops anything outside the closed lists", () => {
  const out = tally([
    { prompt: "need", value: "reading", n: 2 },
    { prompt: "need", value: "<b>", n: 5 },
    { prompt: "nope", value: "x", n: 1 },
  ]);
  assert.deepEqual(out, { need: { total: 2, counts: { reading: 2 } } });
});

console.log(`tour-room: ${passed} checks passed`);
