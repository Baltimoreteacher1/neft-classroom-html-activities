#!/usr/bin/env node
/**
 * Contract tests for the unified teacher authentication.
 *
 * These pin the properties that made the original defect possible and the ones
 * that would make the fix dangerous if they regressed:
 *
 *   - a key the deployment does not accept is refused (the actual production
 *     bug was the opposite mistake — one credential checked against another)
 *   - BOTH configured teacher keys authenticate, as distinct identities
 *   - an unauthenticated request is "unauthorized", never "ok"
 *   - a missing configuration is "not-configured" (503), never "unauthorized"
 *     (401): an ops failure must not read to the teacher as a wrong password
 *   - a forged, tampered, truncated or expired token verifies as null
 *   - a session minted under one key set does not verify under another, so
 *     rotating a teacher key ends the sessions signed with it
 *   - the cookie is HttpOnly + Secure + SameSite
 *
 * Runs off-Workers on plain node: globalThis.crypto.subtle and btoa/atob are
 * standard in node 18+, which is what the module uses and all it uses.
 */
import assert from "node:assert/strict";
import {
  acceptedKeys,
  clearedSessionCookie,
  identityForKey,
  mintSession,
  readCookie,
  resolveTeacherSession,
  sessionCookie,
  teacherAuthorized,
  teacherIdentity,
  verifySession,
} from "./teacher-auth.js";

let passed = 0;
async function test(name, fn) {
  await fn();
  passed++;
  console.log(`   ✓ ${name}`);
}

// Test-only values. These are NOT the production keys and must never be: the
// point of this file is that the real ones live in the Pages environment.
const ENV = { TEACHER_KEY_NEFT: "test-key-neft", TEACHER_KEY_ALBA: "test-key-alba" };
const EMPTY = {};

const req = (headers = {}) => new Request("https://example.test/api/pacing/state", { headers });
const url = (search = "") => new URL(`https://example.test/api/pacing/state${search}`);

console.log("teacher-auth");

await test("both configured keys are accepted, as distinct identities", () => {
  assert.equal(identityForKey(ENV, "test-key-neft"), "Neft");
  assert.equal(identityForKey(ENV, "test-key-alba"), "Alba");
  assert.equal(acceptedKeys(ENV).size, 2);
});

await test("an unrecognized key is refused", () => {
  // The shape of the original production defect: a plausible-looking string
  // that the server has never been told about.
  assert.equal(identityForKey(ENV, "a-plausible-looking-pin"), null);
  assert.equal(identityForKey(ENV, ""), null);
  assert.equal(identityForKey(ENV, "test-key-neft "), "Neft"); // trimmed, not rejected
  assert.equal(identityForKey(ENV, "test-key-nef"), null);
});

await test("legacy TEACHER_KEY still authenticates non-browser callers", () => {
  const env = { TEACHER_KEY: "legacy" };
  assert.equal(identityForKey(env, "legacy"), "Teacher");
  assert.equal(teacherAuthorized(env, req({ "x-teacher-key": "legacy" }), url()), "ok");
});

await test("unconfigured reads as not-configured, never unauthorized", () => {
  assert.equal(teacherAuthorized(EMPTY, req(), url()), "not-configured");
  assert.equal(teacherAuthorized(EMPTY, req({ "x-teacher-key": "anything" }), url()), "not-configured");
});

await test("no credential is unauthorized", () => {
  assert.equal(teacherAuthorized(ENV, req(), url()), "unauthorized");
  assert.equal(teacherAuthorized(ENV, req({ "x-teacher-key": "wrong" }), url()), "unauthorized");
  assert.equal(teacherAuthorized(ENV, req(), url("?key=wrong")), "unauthorized");
});

await test("a raw key still authorizes tooling, by header or query", () => {
  assert.equal(teacherAuthorized(ENV, req({ "x-teacher-key": "test-key-alba" }), url()), "ok");
  assert.equal(teacherAuthorized(ENV, req(), url("?key=test-key-neft")), "ok");
});

await test("a verified session on context.data authorizes with no key present", () => {
  assert.equal(teacherAuthorized(ENV, req(), url(), { teacher: "Neft" }), "ok");
  assert.equal(teacherIdentity(ENV, req(), url(), { teacher: "Alba" }), "Alba");
  // …and an endpoint that forgets to pass data fails CLOSED, not open.
  assert.equal(teacherAuthorized(ENV, req(), url(), null), "unauthorized");
});

await test("a minted session round-trips to its identity", async () => {
  const token = await mintSession(ENV, "Alba");
  assert.ok(token.includes("."));
  assert.equal(await verifySession(ENV, token), "Alba");
});

await test("a tampered or forged token verifies as null", async () => {
  const token = await mintSession(ENV, "Neft");
  const [payload, sig] = token.split(".");
  assert.equal(await verifySession(ENV, `${payload}x.${sig}`), null);
  assert.equal(await verifySession(ENV, `${payload}.${sig.slice(0, -2)}AA`), null);
  assert.equal(await verifySession(ENV, payload), null);
  assert.equal(await verifySession(ENV, ""), null);
  assert.equal(await verifySession(ENV, "not.a.token"), null);
  // A self-signed payload with no signature secret cannot be forged.
  const forged = Buffer.from(JSON.stringify({ v: 1, t: "Neft", e: 9e9 })).toString("base64url");
  assert.equal(await verifySession(ENV, `${forged}.${forged}`), null);
});

await test("an expired token verifies as null", async () => {
  const token = await mintSession(ENV, "Neft", { ttlSeconds: -1 });
  assert.equal(await verifySession(ENV, token), null);
});

await test("rotating a teacher key invalidates sessions signed under the old set", async () => {
  const token = await mintSession(ENV, "Neft");
  const rotated = { TEACHER_KEY_NEFT: "test-key-neft-2", TEACHER_KEY_ALBA: "test-key-alba" };
  assert.equal(await verifySession(rotated, token), null);
  assert.equal(await verifySession(ENV, token), "Neft");
});

await test("an unconfigured deployment mints and verifies nothing", async () => {
  assert.equal(await mintSession(EMPTY, "Neft"), "");
  assert.equal(await verifySession(EMPTY, "anything.atall"), null);
});

await test("an explicit session secret is honoured and isolates deployments", async () => {
  const a = { ...ENV, TEACHER_SESSION_SECRET: "secret-a" };
  const b = { ...ENV, TEACHER_SESSION_SECRET: "secret-b" };
  const token = await mintSession(a, "Neft");
  assert.equal(await verifySession(a, token), "Neft");
  assert.equal(await verifySession(b, token), null);
});

await test("the session cookie is HttpOnly, Secure and SameSite", () => {
  const cookie = sessionCookie("abc.def");
  assert.match(cookie, /^nt_teacher=abc\.def;/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Path=\//);
  const cleared = clearedSessionCookie();
  assert.match(cleared, /Max-Age=0/);
  assert.match(cleared, /HttpOnly/);
});

await test("the cookie is read out of a realistic multi-cookie header", async () => {
  const token = await mintSession(ENV, "Alba");
  const request = new Request("https://example.test/curriculum/planning/", {
    headers: { Cookie: `nt_theme=dark; nt_teacher=${encodeURIComponent(token)}; other=1` },
  });
  assert.equal(readCookie(request), token);
  assert.equal(await resolveTeacherSession(ENV, request), "Alba");
});

await test("no cookie resolves to no session", async () => {
  assert.equal(await resolveTeacherSession(ENV, new Request("https://example.test/")), null);
});

console.log(`\n${passed} teacher-auth assertions passed.`);
