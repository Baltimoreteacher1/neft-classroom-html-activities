#!/usr/bin/env node
/** GET /api/health: build stamp, D1 ping with try/catch and timeout, no secrets, never cached. */
import assert from "node:assert/strict";
import { setLogSink } from "../_lib/security/log.js";
import { onRequest } from "./health.js";

setLogSink(() => {});
let ip = 0;
const call = (env, method = "GET") =>
  onRequest({
    request: new Request("https://example.test/api/health", {
      method,
      headers: { "CF-Connecting-IP": `10.9.0.${++ip}` },
    }),
    env,
    params: {},
  });
const assets = (stamp, ok = true) => ({
  fetch: async () => (ok ? new Response(JSON.stringify(stamp)) : new Response("nope", { status: 404 })),
});
const db = (first) => ({ prepare: () => ({ first }) });

let passed = 0;
const check = async (name, fn) => {
  await fn();
  passed++;
  console.log(`   ✓ ${name}`);
};
console.log("functions/api/health.js");

await check("healthy: 200, build stamp, d1 ok, no-store", async () => {
  const res = await call({
    ASSETS: assets({ commit: "81ac4cb43abcdef0123456789", builtAt: "2026-11-25T10:00:00Z", branch: "main" }),
    DB: db(async () => ({ ok: 1 })),
    SITE_PASSWORD: "hunter2-secret",
    DATABASE_URL: "postgres://user:pw@host/db",
  });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("Cache-Control"), "no-store");
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.d1, "ok");
  assert.deepEqual(body.build, { commit: "81ac4cb43abc", built_at: "2026-11-25T10:00:00Z" });
  const raw = JSON.stringify(body);
  assert.ok(!raw.includes("hunter2") && !raw.includes("postgres") && !raw.includes("branch"), "no secrets or extra stamp fields");
});

await check("no D1 bound: still healthy, d1 absent", async () => {
  const res = await call({ ASSETS: assets({ commit: "abcdef1" }) });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).d1, "absent");
});

await check("D1 throws: 503 with d1 error and no error text", async () => {
  const res = await call({
    ASSETS: assets({ commit: "abcdef1" }),
    DB: db(async () => {
      throw new Error("D1_ERROR: secret detail");
    }),
  });
  assert.equal(res.status, 503);
  const raw = await res.text();
  assert.equal(JSON.parse(raw).d1, "error");
  assert.ok(!raw.includes("secret detail"));
});

await check("D1 hangs: 503 within the ping timeout", async () => {
  const started = Date.now();
  const res = await call({ ASSETS: assets({ commit: "abcdef1" }), DB: db(() => new Promise(() => {})) });
  assert.equal(res.status, 503);
  assert.ok(Date.now() - started < 3000, "ping must time out");
});

await check("build stamp missing, malformed or hostile: commit is unknown, request still succeeds", async () => {
  for (const env of [
    { ASSETS: assets(null, false) },
    { ASSETS: { fetch: async () => new Response("<html>") } },
    { ASSETS: { fetch: async () => Promise.reject(new Error("boom")) } },
    { ASSETS: assets({ commit: "not a sha; <script>" }) },
    {},
  ]) {
    const res = await call(env);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).build.commit, "unknown");
  }
});

await check("HEAD allowed, POST refused", async () => {
  assert.equal((await call({}, "HEAD")).status, 200);
  assert.equal((await call({}, "POST")).status, 405);
});

console.log(`\n✓ health: ${passed} checks`);
