#!/usr/bin/env node
/**
 * Contract tests for the shared API plumbing. These run off-Workers, so the
 * module must stay dependency-free — that is deliberate, not incidental.
 */
import assert from "node:assert/strict";
import {
  badRequest,
  clientIp,
  createRateLimiter,
  handler,
  json,
  tooManyRequests,
} from "./http.js";

let passed = 0;
async function test(name, fn) {
  await fn();
  passed++;
  console.log(`   ✓ ${name}`);
}

const req = (method = "GET", body = null, headers = {}) =>
  new Request("https://example.test/api/thing", {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    ...(body === null ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }),
  });

console.log("functions/_lib/http.js");

await test("json() sets the shared header block", async () => {
  const r = json({ a: 1 });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("Content-Type"), "application/json");
  assert.equal(r.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await r.json(), { a: 1 });
});

await test("error helpers carry a stable shape", async () => {
  assert.equal(badRequest("nope").status, 400);
  assert.deepEqual(await badRequest("nope").json(), { ok: false, error: "nope" });
  const rl = tooManyRequests(30);
  assert.equal(rl.status, 429);
  assert.equal(rl.headers.get("Retry-After"), "30");
});

await test("OPTIONS preflight is answered without running the handler", async () => {
  let ran = false;
  const h = handler({
    handle: () => {
      ran = true;
      return { ok: true };
    },
  });
  const r = await h({ request: req("OPTIONS") });
  assert.equal(r.status, 204);
  assert.equal(ran, false);
  assert.match(r.headers.get("Access-Control-Allow-Methods"), /OPTIONS/);
});

await test("disallowed methods get 405 and an Allow header", async () => {
  const h = handler({ methods: ["GET"], handle: () => ({ ok: true }) });
  const r = await h({ request: req("DELETE") });
  assert.equal(r.status, 405);
  assert.equal(r.headers.get("Allow"), "GET, OPTIONS");
  assert.deepEqual(await r.json(), { ok: false, error: "method not allowed" });
});

await test("a plain object return is serialized as JSON 200", async () => {
  const h = handler({ handle: () => ({ hello: "world" }) });
  const r = await h({ request: req("GET") });
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { hello: "world" });
});

await test("a returned Response passes through untouched", async () => {
  const h = handler({ handle: () => new Response("raw", { status: 201 }) });
  const r = await h({ request: req("GET") });
  assert.equal(r.status, 201);
  assert.equal(await r.text(), "raw");
});

await test("JSON bodies are parsed and handed to the handler", async () => {
  let seen;
  const h = handler({
    methods: ["POST"],
    handle: ({ body }) => {
      seen = body;
      return { ok: true };
    },
  });
  await h({ request: req("POST", { id: 7 }) });
  assert.deepEqual(seen, { id: 7 });
});

await test("malformed JSON is a 400, not a 500", async () => {
  const h = handler({ methods: ["POST"], handle: () => ({ ok: true }) });
  const r = await h({ request: req("POST", "{not json") });
  assert.equal(r.status, 400);
  assert.deepEqual(await r.json(), { ok: false, error: "body must be valid JSON" });
});

await test("oversized bodies are refused with 413", async () => {
  const h = handler({ methods: ["POST"], maxBodyBytes: 10, handle: () => ({ ok: true }) });
  const r = await h({ request: req("POST", { padding: "x".repeat(100) }) });
  assert.equal(r.status, 413);
});

await test("a throwing handler returns JSON 500 and leaks nothing", async () => {
  const errs = [];
  const realError = console.error;
  console.error = (...a) => errs.push(a.join(" "));
  const h = handler({
    handle: () => {
      throw new Error("DB_PASSWORD=hunter2 connection failed");
    },
  });
  const r = await h({ request: req("GET") });
  console.error = realError;
  assert.equal(r.status, 500);
  const payload = await r.json();
  assert.deepEqual(payload, { ok: false, error: "internal error" });
  assert.ok(!JSON.stringify(payload).includes("hunter2"), "internal detail must not reach caller");
  assert.ok(errs.join(" ").includes("hunter2"), "internal detail must reach the log");
});

await test("rate limiter allows up to max, then blocks inside the window", () => {
  const limited = createRateLimiter({ max: 3, windowMs: 1000 });
  const t = 1_000_000;
  assert.equal(limited("1.2.3.4", t), false);
  assert.equal(limited("1.2.3.4", t + 1), false);
  assert.equal(limited("1.2.3.4", t + 2), false);
  assert.equal(limited("1.2.3.4", t + 3), true, "4th request in window is limited");
  assert.equal(limited("5.6.7.8", t + 3), false, "a different IP is unaffected");
  assert.equal(limited("1.2.3.4", t + 5000), false, "window slides open again");
});

await test("rate limiting is enforced by the wrapper", async () => {
  const h = handler({ rateLimit: { max: 1, windowMs: 60_000 }, handle: () => ({ ok: true }) });
  const ip = { "CF-Connecting-IP": "9.9.9.9" };
  assert.equal((await h({ request: req("GET", null, ip) })).status, 200);
  assert.equal((await h({ request: req("GET", null, ip) })).status, 429);
});

await test("clientIp prefers CF-Connecting-IP and falls back safely", () => {
  assert.equal(clientIp(req("GET", null, { "CF-Connecting-IP": "1.1.1.1" })), "1.1.1.1");
  assert.equal(clientIp(req("GET", null, { "X-Forwarded-For": "2.2.2.2" })), "2.2.2.2");
  assert.equal(clientIp(req("GET")), "anon");
});

console.log(`   ${passed} passed`);
