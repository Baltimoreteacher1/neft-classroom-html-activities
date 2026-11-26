#!/usr/bin/env node
/**
 * Abuse tests for the public BCPSS write endpoints (telemetry, plans, deconstruct, csp-report).
 * Each case sends hostile input to the REAL handler and asserts BOTH the status AND that nothing
 * was stored (a recording D1 fake counts INSERTs) and nothing sensitive was logged.
 * Positive controls prove the fake records real writes, so "nothing stored" cannot pass vacuously.
 */
import assert from "node:assert/strict";
import { setLogSink } from "../functions/_lib/security/log.js";
import { LIMITS } from "../functions/_lib/security/schema.js";
import { onRequest as deconstruct } from "../functions/api/bcpss/deconstruct.js";
import { onRequest as plans } from "../functions/api/bcpss/plans.js";
import { onRequest as telemetry } from "../functions/api/bcpss/telemetry.js";
import { onRequest as cspReport } from "../functions/api/csp-report.js";

const logged = [];
setLogSink((line) => logged.push(line));

function fakeEnv() {
  const inserts = [];
  const db = {
    prepare(sql) {
      const stmt = (args) => ({
        run: async () => {
          if (/^\s*INSERT/i.test(sql)) inserts.push({ sql, args });
          return { success: true };
        },
        first: async () => null,
        all: async () => ({ results: [] }),
      });
      return { ...stmt([]), bind: (...args) => stmt(args) };
    },
  };
  return { env: { DB: db }, inserts };
}

let ipCounter = 0;
const freshIp = () => `10.20.${Math.floor(ipCounter / 250)}.${(ipCounter++ % 250) + 1}`;

function post(path, body, { ip = freshIp(), headers = {} } = {}) {
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  return new Request(`https://example.test${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "CF-Connecting-IP": ip, ...headers },
    body: raw,
  });
}

let passed = 0;
async function check(name, fn) {
  await fn();
  passed++;
  console.log(`   ✓ ${name}`);
}

const valid = { unit_id: "gk-ela-u1", wida_tier: "3_4", event_type: "lab_launch" };
const validPlan = {
  unit_id: "gk-ela-u1",
  wida_tier: "3_4",
  teacher_note: "Preview the vocabulary first.",
};

async function expectRejected(endpoint, path, body, status, store = fakeEnv(), opts) {
  const before = logged.length;
  const res = await endpoint({ request: post(path, body, opts), env: store.env, params: {} });
  assert.equal(res.status, status, `${path} ${JSON.stringify(body).slice(0, 60)} -> ${res.status}`);
  assert.equal(store.inserts.length, 0, "nothing may be stored");
  const text = await res.text();
  return { text, logs: logged.slice(before).join("\n") };
}

console.log("abuse: public BCPSS write endpoints");

await check(
  "positive controls: valid telemetry and plan ARE stored (the fake records writes)",
  async () => {
    const t = fakeEnv();
    const r1 = await telemetry({
      request: post("/api/bcpss/telemetry", valid),
      env: t.env,
      params: {},
    });
    assert.equal(r1.status, 202);
    assert.deepEqual(
      await r1.json(),
      { ok: true, grade: "K" },
      "grade is derived from the registry",
    );
    assert.equal(t.inserts.length, 1);
    assert.deepEqual(t.inserts[0].args.slice(0, 3), ["gk-ela-u1", "3_4", "lab_launch"]);
    const p = fakeEnv();
    const r2 = await plans({
      request: post("/api/bcpss/plans", validPlan),
      env: p.env,
      params: {},
    });
    assert.equal(r2.status, 201);
    assert.equal(p.inserts.length, 1);
  },
);

await check(
  "oversized payload: 413 by Content-Length and by actual body, nothing stored",
  async () => {
    const big = { ...valid, padding: "x".repeat(LIMITS.telemetry.maxBodyBytes + 100) };
    await expectRejected(telemetry, "/api/bcpss/telemetry", big, 413);
    const note = { ...validPlan, teacher_note: "a".repeat(LIMITS.plans.maxBodyBytes + 1) };
    await expectRejected(plans, "/api/bcpss/plans", note, 413);
    // A client that lies about Content-Length low still cannot exceed the cap while streaming.
    const store = fakeEnv();
    const chunks = new ReadableStream({
      start(c) {
        for (let i = 0; i < 100; i++) c.enqueue(new TextEncoder().encode("y".repeat(200)));
        c.close();
      },
    });
    const req = new Request("https://example.test/api/bcpss/telemetry", {
      method: "POST",
      headers: { "CF-Connecting-IP": freshIp() },
      body: chunks,
      duplex: "half",
    });
    const res = await telemetry({ request: req, env: store.env, params: {} });
    assert.equal(res.status, 413);
    assert.equal(store.inserts.length, 0);
  },
);

await check("malformed JSON and non-object bodies: 400 not 500, nothing stored", async () => {
  for (const body of ["{not json", "", "[1,2]", "null", '"text"', "42"]) {
    await expectRejected(telemetry, "/api/bcpss/telemetry", body, 400);
    await expectRejected(plans, "/api/bcpss/plans", body, 400);
    await expectRejected(deconstruct, "/api/bcpss/deconstruct", body, 400);
  }
});

await check("enum violations: wida_tier and event_type outside the shared enums", async () => {
  for (const wida_tier of ["9_9", "Entering", "", "1_2; DROP TABLE x", 3, null, ["3_4"]]) {
    const body = { ...valid, wida_tier };
    await expectRejected(telemetry, "/api/bcpss/telemetry", body, 400);
    await expectRejected(plans, "/api/bcpss/plans", { ...validPlan, wida_tier }, 400);
  }
  for (const event_type of ["evil", "", "LAB_LAUNCH", 7, {}]) {
    await expectRejected(telemetry, "/api/bcpss/telemetry", { ...valid, event_type }, 400);
  }
  await expectRejected(
    deconstruct,
    "/api/bcpss/deconstruct",
    { passage: "A short passage.", l1: "Klingon" },
    400,
  );
});

await check(
  "unit_id spoofing: unregistered ids and injection shapes never reach storage",
  async () => {
    await expectRejected(
      telemetry,
      "/api/bcpss/telemetry",
      { ...valid, unit_id: "g99-fake-u1" },
      422,
    );
    await expectRejected(
      telemetry,
      "/api/bcpss/telemetry",
      { ...valid, unit_id: "x'; DROP TABLE t;--" },
      400,
    );
    await expectRejected(telemetry, "/api/bcpss/telemetry", { ...valid, unit_id: "a" }, 400);
    await expectRejected(
      telemetry,
      "/api/bcpss/telemetry",
      { ...valid, unit_id: "../../etc/passwd" },
      400,
    );
    await expectRejected(telemetry, "/api/bcpss/telemetry", { ...valid, unit_id: 12 }, 400);
    await expectRejected(plans, "/api/bcpss/plans", { ...validPlan, unit_id: "g99-fake-u1" }, 404);
  },
);

// Telemetry v2 (6f17376432) accepts an optional grade K-8 as a dimension, so a VALID grade is no longer an extra; an
// invalid one, and every identity-style field, is still refused.
await check("client-supplied grade/tier-style extras are refused, never trusted", async () => {
  for (const extra of [
    { grade: "99" },
    { student_name: "Maria" },
    { wida_level: "6" },
    { class_id: "c1" },
  ]) {
    await expectRejected(telemetry, "/api/bcpss/telemetry", { ...valid, ...extra }, 400);
    await expectRejected(plans, "/api/bcpss/plans", { ...validPlan, ...extra }, 400);
  }
});

await check(
  "PII text in a stored free-text field: 422, not stored, never echoed or logged",
  async () => {
    const notes = [
      "Maria Lopez struggled with the vocabulary.",
      "Call me at 410-555-0134 about this unit.",
      "My student ID is 4471829 for reference.",
      "She has an IEP so slow down.",
      "We are on food stamps and she needs extra help.",
      "He was born in another country and is new.",
    ];
    for (const teacher_note of notes) {
      const { text, logs } = await expectRejected(
        plans,
        "/api/bcpss/plans",
        { ...validPlan, teacher_note },
        422,
      );
      const payload = JSON.parse(text);
      assert.equal(payload.field, "teacher_note");
      assert.ok(Array.isArray(payload.kinds) && payload.kinds.length > 0);
      for (const needle of [
        "Maria",
        "410-555",
        "4471829",
        "IEP",
        "food stamps",
        "another country",
      ]) {
        assert.ok(!text.includes(needle), `response echoed "${needle}"`);
        assert.ok(!logs.includes(needle), `log contained "${needle}"`);
      }
    }
    const alias = await plans({
      request: post("/api/bcpss/plans", {
        ...validPlan,
        teacher_note: "Star 4 and Star 9 can pair up.",
      }),
      env: fakeEnv().env,
      params: {},
    });
    assert.equal(alias.status, 201, "aliases pass");
  },
);

await check(
  "rate-limit exhaustion: 429 with Retry-After once the window cap is hit, rejected calls store nothing",
  async () => {
    const store = fakeEnv();
    const ip = freshIp();
    const max = LIMITS.plans.rateLimit.max;
    const statuses = [];
    let retryAfter = null;
    for (let i = 0; i < max + 5; i++) {
      const res = await plans({
        request: post("/api/bcpss/plans", validPlan, { ip }),
        env: store.env,
        params: {},
      });
      statuses.push(res.status);
      if (res.status === 429) retryAfter = res.headers.get("Retry-After");
    }
    assert.equal(statuses.filter((s) => s === 201).length, max, `exactly ${max} admitted`);
    assert.equal(statuses.filter((s) => s === 429).length, 5);
    assert.equal(retryAfter, "60");
    assert.equal(store.inserts.length, max, "429 responses stored nothing");
  },
);

await check(
  "anonymous tokens: one exhausted token does not block another on the same IP; rotation hits ipMax",
  async () => {
    const store = fakeEnv();
    const ip = freshIp();
    const { max, ipMax } = LIMITS.plans.rateLimit;
    const tokenHeader = (n) => ({ "X-Anon-Token": String(n).padStart(20, "t") });
    for (let i = 0; i < max; i++) {
      await plans({
        request: post("/api/bcpss/plans", validPlan, { ip, headers: tokenHeader(1) }),
        env: store.env,
        params: {},
      });
    }
    const blocked = await plans({
      request: post("/api/bcpss/plans", validPlan, { ip, headers: tokenHeader(1) }),
      env: store.env,
      params: {},
    });
    assert.equal(blocked.status, 429);
    const other = await plans({
      request: post("/api/bcpss/plans", validPlan, { ip, headers: tokenHeader(2) }),
      env: store.env,
      params: {},
    });
    assert.equal(other.status, 201, "a second browser behind the same school IP is unaffected");
    let rotationBlocked = false;
    for (let i = 10; i < 10 + ipMax + 5; i++) {
      const res = await plans({
        request: post("/api/bcpss/plans", validPlan, { ip, headers: tokenHeader(i) }),
        env: store.env,
        params: {},
      });
      if (res.status === 429) rotationBlocked = true;
    }
    assert.ok(rotationBlocked, "rotating tokens cannot bypass the per-IP cap");
  },
);

await check(
  "csp-report: oversized and malformed reports are refused; accepted reports log directive and origin only",
  async () => {
    await expectRejected(
      cspReport,
      "/api/csp-report",
      { "csp-report": { x: "y".repeat(LIMITS.cspReport.maxBodyBytes) } },
      413,
    );
    await expectRejected(cspReport, "/api/csp-report", "{bad", 400);
    const before = logged.length;
    const res = await cspReport({
      request: post("/api/csp-report", {
        "csp-report": {
          "violated-directive": "script-src-elem",
          "blocked-uri": "https://evil.example/x.js?token=SECRET",
          "document-uri": "https://eduwonderlab.com/bcpss-teachers/?q=my+name+is+Maria",
          "script-sample": "alert('Maria Lopez')",
        },
      }),
      env: {},
      params: {},
    });
    assert.equal(res.status, 204);
    const line = logged.slice(before).join("\n");
    assert.ok(line.includes("script-src-elem") && line.includes("https://evil.example"));
    for (const needle of ["SECRET", "Maria", "document-uri", "alert"])
      assert.ok(!line.includes(needle), needle);
  },
);

await check("method abuse: GET/PUT/DELETE on write endpoints are 405", async () => {
  for (const method of ["GET", "PUT", "DELETE", "PATCH"]) {
    for (const endpoint of [telemetry, plans, deconstruct, cspReport]) {
      const res = await endpoint({
        request: new Request("https://example.test/x", { method }),
        env: {},
        params: {},
      });
      assert.equal(res.status, 405, `${method} must be refused`);
    }
  }
});

console.log(`\n✓ abuse: ${passed} checks`);
