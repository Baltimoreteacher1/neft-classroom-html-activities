#!/usr/bin/env node
/**
 * Contract tests for the shared API plumbing. These run off-Workers, so the
 * module must stay dependency-free — that is deliberate, not incidental.
 */
import assert from "node:assert/strict";
import { logEvent, redact, requestIdFrom, routeOf, setLogSink } from "./security/log.js";
import {
  badRequest,
  clientIp,
  createRateLimiter,
  handler,
  json,
  readBodyCapped,
  tooManyRequests,
} from "./http.js";

// Request logging is exercised below; keep the suite's own output readable.
const logLines = [];
setLogSink((line) => logLines.push(JSON.parse(line)));

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

await test("a throwing handler returns JSON 500 and leaks nothing, to the caller or the log", async () => {
  logLines.length = 0;
  const h = handler({
    handle: () => {
      throw new Error("DB_PASSWORD=hunter2 connection failed");
    },
  });
  const r = await h({ request: req("GET") });
  assert.equal(r.status, 500);
  const payload = await r.json();
  assert.deepEqual(payload, { ok: false, error: "internal error" });
  assert.ok(!JSON.stringify(payload).includes("hunter2"), "internal detail must not reach caller");
  const logged = JSON.stringify(logLines);
  assert.ok(!logged.includes("hunter2"), "error message text must never reach the log");
  const errLine = logLines.find((l) => l.event === "api_error");
  assert.equal(errLine.error_name, "Error");
  assert.match(errLine.error_at, /http\.test\.mjs:\d+:\d+$/, "the first stack frame locates the fault");
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

await test("request id: generated, propagated from a safe header, always on the response", async () => {
  const h = handler({ handle: () => ({ ok: true }) });
  const r1 = await h({ request: req("GET") });
  assert.match(r1.headers.get("X-Request-Id"), /^[0-9a-f-]{36}$/);
  const r2 = await h({ request: req("GET", null, { "X-Request-Id": "trace_abcdef123456" }) });
  assert.equal(r2.headers.get("X-Request-Id"), "trace_abcdef123456");
  const r3 = await h({ request: req("GET", null, { "X-Request-Id": "my name is Maria" }) });
  assert.notEqual(r3.headers.get("X-Request-Id"), "my name is Maria", "unsafe ids are replaced");
  const proxied = handler({ handle: () => fetchedLike() });
  const r4 = await proxied({ request: req("GET") });
  assert.ok(r4.headers.get("X-Request-Id"), "immutable-header responses still get an id");
});

/** A Response whose headers refuse mutation, like one returned straight from fetch(). */
function fetchedLike() {
  const response = new Response("x");
  const frozen = new Headers();
  frozen.set = () => {
    throw new TypeError("immutable");
  };
  return Object.defineProperty(response, "headers", { value: frozen });
}

await test("each request writes one structured log line with route, status and duration", async () => {
  logLines.length = 0;
  const h = handler({ handle: () => ({ ok: true }) });
  await h({
    request: new Request("https://example.test/api/bcpss/plans/abcd1234?teacher_note=secret+words"),
    params: { id: "abcd1234" },
  });
  const line = logLines.find((l) => l.event === "request");
  assert.equal(line.route, "/api/bcpss/plans/:id");
  assert.equal(line.status, 200);
  assert.equal(line.method, "GET");
  assert.equal(typeof line.duration_ms, "number");
  assert.ok(!JSON.stringify(line).includes("secret"), "query strings are never logged");
});

await test("log redaction: unknown keys dropped, sentences redacted, tokens kept", () => {
  const out = redact({
    route: "/api/x",
    status: 200,
    teacher_note: "my name is Maria",
    unit_id: "my name is Maria",
    event_type: "lab_launch",
    nested: { a: 1 },
  });
  assert.deepEqual(out, { route: "/api/x", status: 200, unit_id: "[redacted]", event_type: "lab_launch" });
  const line = logEvent({ event: "x", body: "free text here", error_name: "a b c" });
  assert.ok(!JSON.stringify(line).includes("free text"));
  assert.equal(line.error_name, "[redacted]");
  assert.equal(routeOf("/api/a/b/c", { path: ["b", "c"] }), "/api/a/:path/:path");
  assert.equal(requestIdFrom(req("GET", null, { "X-Request-Id": "short" })).length, 36);
});

await test("token + ip rate limit keys: tokens separate users behind one IP, ipMax caps rotation", async () => {
  const h = handler({
    rateLimit: { max: 2, ipMax: 5, windowMs: 60_000 },
    handle: () => ({ ok: true }),
  });
  const hdr = (token) => ({ "CF-Connecting-IP": "7.7.7.7", "X-Anon-Token": token });
  const A = "a".repeat(20);
  const B = "b".repeat(20);
  assert.equal((await h({ request: req("GET", null, hdr(A)) })).status, 200);
  assert.equal((await h({ request: req("GET", null, hdr(A)) })).status, 200);
  assert.equal((await h({ request: req("GET", null, hdr(A)) })).status, 429, "token A exhausted");
  assert.equal((await h({ request: req("GET", null, hdr(B)) })).status, 200, "token B unaffected");
  // 4 requests have passed the ip limiter so far (A,A,A counted, B counted); rotate to hit ipMax.
  const rotating = [];
  for (let i = 0; i < 4; i++) {
    rotating.push((await h({ request: req("GET", null, hdr(String(i).repeat(20))) })).status);
  }
  assert.ok(rotating.includes(429), "rotating tokens cannot escape the per-IP cap");
  const bad = await h({ request: req("GET", null, { "CF-Connecting-IP": "8.8.8.8", "X-Anon-Token": "x y" }) });
  assert.equal(bad.status, 200, "a malformed token is ignored, not an error");
});

await test("body cap holds for chunked bodies with no Content-Length and for lying lengths", async () => {
  const stream = (n) =>
    new ReadableStream({
      start(c) {
        for (let i = 0; i < n; i++) c.enqueue(new TextEncoder().encode("x".repeat(100)));
        c.close();
      },
    });
  const chunked = new Request("https://example.test/api/x", { method: "POST", body: stream(50), duplex: "half" });
  const r = await readBodyCapped(chunked, 1000);
  assert.equal(r.response.status, 413);
  const lying = req("POST", "x".repeat(10), { "Content-Length": "99999" });
  assert.equal((await readBodyCapped(lying, 1000)).response.status, 413);
  const nan = { headers: new Headers({ "Content-Length": "abc" }), body: null };
  assert.equal((await readBodyCapped(nan, 1000)).response.status, 400);
  const fine = await readBodyCapped(req("POST", { a: 1 }), 1000);
  assert.equal(fine.raw, '{"a":1}');
});

await test("requireObjectBody rejects arrays, primitives and null", async () => {
  const h = handler({ methods: ["POST"], requireObjectBody: true, handle: () => ({ ok: true }) });
  for (const body of ["[1]", "5", "null", '"str"']) {
    assert.equal((await h({ request: req("POST", body) })).status, 400, body);
  }
  assert.equal((await h({ request: req("POST", "{}") })).status, 200);
  assert.equal((await h({ request: req("POST", "") })).status, 400, "an empty body is not an object");
});

console.log(`   ${passed} passed`);
