#!/usr/bin/env node
/**
 * teacher-auth-endpoint.test.mjs — the sign-in contract, driven end to end.
 *
 * Distinct from _lib/teacher-auth.test.mjs, which covers the LIBRARY: identity
 * mapping and the teacherAuthorized predicate. This file covers what that one
 * cannot — the ENDPOINT and the round trip a teacher actually performs: login,
 * the Set-Cookie it returns, reading that cookie back as a session, and logout.
 * The gap between those two was the whole problem: every library-level fact was
 * verified and nothing ever signed a teacher in.
 *
 * WHY THIS EXISTS. Teacher sign-in stopped working in production and every
 * available signal said the system was healthy: the endpoint answered, a wrong
 * key returned a correct 401, `/session` reported `configured: true`, the page
 * gate redirected browsers to the sign-in form, and the deployed commit matched
 * source. There was no test that actually signed a teacher in. The one test
 * that does — tools/e2e-planner-classes.mjs — needs a hand-started
 * `wrangler pages dev` and therefore runs when someone remembers, which is not
 * a gate.
 *
 * These run in `npm test`, on every push, with throwaway keys defined here.
 * They import the SAME modules the Worker runs; nothing is re-implemented, so a
 * change to the real auth path is what breaks them.
 *
 * THE DISTINCTION THAT MATTERS MOST is 503 versus 401. A missing binding is an
 * OPS problem and must never present as "your key is wrong", because a teacher
 * who is told their key is wrong retypes it, gives up, and reports a broken
 * password — while the actual fault is a variable nobody set. That three-state
 * shape (`not-configured` / `ok` / `unauthorized`) is asserted here in both the
 * predicate and the endpoint.
 *
 * No production credential appears in this file, and none is needed: the test
 * supplies its own env.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { onRequest } from "./api/teacher-auth/[[path]].js";
import {
  acceptedKeys,
  clearedSessionCookie,
  credentialAvailability,
  hasCredentialConflict,
  identityForKey,
  mintSession,
  readCookie,
  resolveTeacherSession,
  sessionCookie,
  teacherAuthorized,
  TEACHER_COOKIE_NAME,
  verifySession,
} from "./_lib/teacher-auth.js";

/*
 * Throwaway fixtures. No production credential appears in this file and none is
 * needed — every test supplies its own env. The four slots below stand in for
 * the four approved production credentials without being them.
 */
const ENV = {
  TEACHER_KEY_NEFT: "test-only-neft-primary",
  TEACHER_KEY_NEFT_ALT: "test-only-neft-alternate",
  TEACHER_KEY_ALBA: "test-only-alba-primary",
  TEACHER_KEY_ALBA_ALT: "test-only-alba-alternate",
  TEACHER_KEY: "test-only-legacy-key",
};

let passed = 0;
async function t(name, fn) {
  await fn();
  passed++;
  console.log(`  ok  ${name}`);
}

const post = (path, body, headers = {}) =>
  new Request(`https://eduwonderlab.com/api/teacher-auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

const get = (path, headers = {}) =>
  new Request(`https://eduwonderlab.com/api/teacher-auth/${path}`, { method: "GET", headers });

const call = (request, env = ENV, data = {}) =>
  onRequest({ request, env, data, waitUntil() {}, next: async () => new Response("") });

/* ── Identity ──────────────────────────────────────────────────────────────── */

await t("each configured key maps to its own teacher, and nothing else does", () => {
  assert.equal(identityForKey(ENV, ENV.TEACHER_KEY_NEFT), "Neft");
  assert.equal(identityForKey(ENV, ENV.TEACHER_KEY_NEFT_ALT), "Neft");
  assert.equal(identityForKey(ENV, ENV.TEACHER_KEY_ALBA), "Alba");
  assert.equal(identityForKey(ENV, ENV.TEACHER_KEY_ALBA_ALT), "Alba");
  assert.equal(identityForKey(ENV, ENV.TEACHER_KEY), "Teacher");
  assert.equal(identityForKey(ENV, "not-a-key"), null);
  assert.equal(identityForKey(ENV, ""), null);
  assert.equal(identityForKey(ENV, null), null);
});

await t("surrounding whitespace does not make a correct key wrong", () => {
  // A secret set from a file or a piped echo commonly carries a trailing
  // newline, and a teacher pasting a key commonly brings a leading space.
  // Either one turning a valid credential into "not recognized" is the exact
  // failure this whole file exists to make visible.
  assert.equal(identityForKey({ TEACHER_KEY_NEFT: "abc\n" }, "abc"), "Neft");
  assert.equal(identityForKey({ TEACHER_KEY_NEFT: "abc" }, "  abc  "), "Neft");
});

await t("one teacher's key never authenticates as the other", () => {
  assert.notEqual(
    identityForKey(ENV, ENV.TEACHER_KEY_NEFT),
    identityForKey(ENV, ENV.TEACHER_KEY_ALBA),
  );
});

await t("an unconfigured deployment accepts nothing at all", () => {
  assert.equal(acceptedKeys({}).size, 0);
  assert.equal(identityForKey({}, "anything"), null);
});

/* ── Sessions ──────────────────────────────────────────────────────────────── */

await t("a minted session verifies back to the same teacher", async () => {
  const token = await mintSession(ENV, "Neft");
  assert.ok(token, "no token was minted");
  assert.equal(await verifySession(ENV, token), "Neft");
});

await t("a token signed for one deployment is rejected by another", async () => {
  const token = await mintSession(ENV, "Neft");
  const rotated = { ...ENV, TEACHER_KEY_NEFT: "rotated-key" };
  assert.equal(
    await verifySession(rotated, token),
    null,
    "rotating a key must invalidate sessions signed under the old one",
  );
});

await t("a tampered payload does not verify", async () => {
  const token = await mintSession(ENV, "Neft");
  const [payload, sig] = token.split(".");
  const forged = `${Buffer.from(JSON.stringify({ v: 1, t: "Neft", e: 9e9 })).toString("base64url")}.${sig}`;
  assert.equal(await verifySession(ENV, forged), null);
  assert.equal(await verifySession(ENV, `${payload}.AAAA`), null);
  assert.equal(await verifySession(ENV, "garbage"), null);
  assert.equal(await verifySession(ENV, ""), null);
});

await t("an expired session is not a session", async () => {
  const token = await mintSession(ENV, "Neft", { ttlSeconds: -1 });
  assert.equal(await verifySession(ENV, token), null);
});

await t("the cookie is HttpOnly, Secure, SameSite=Lax and path-wide", async () => {
  const cookie = sessionCookie(await mintSession(ENV, "Neft"));
  for (const attr of ["HttpOnly", "Secure", "SameSite=Lax", "Path=/"]) {
    assert.ok(cookie.includes(attr), `the session cookie lost ${attr}`);
  }
  assert.ok(clearedSessionCookie().includes("Max-Age=0"), "logout no longer clears the cookie");
});

await t("the cookie the endpoint sets is the cookie the reader reads", async () => {
  const token = await mintSession(ENV, "Alba");
  const request = new Request("https://eduwonderlab.com/x", {
    headers: { Cookie: `${TEACHER_COOKIE_NAME}=${encodeURIComponent(token)}` },
  });
  assert.equal(readCookie(request), token);
  assert.equal(await resolveTeacherSession(ENV, request), "Alba");
});

/* ── The endpoint ──────────────────────────────────────────────────────────── */

await t("every approved credential slot signs in as its own teacher", async () => {
  for (const [key, identity] of [
    [ENV.TEACHER_KEY_NEFT, "Neft"],
    [ENV.TEACHER_KEY_NEFT_ALT, "Neft"],
    [ENV.TEACHER_KEY_ALBA, "Alba"],
    [ENV.TEACHER_KEY_ALBA_ALT, "Alba"],
  ]) {
    const res = await call(post("login", { key }));
    assert.equal(res.status, 200, `${identity} could not sign in`);
    const body = await res.json();
    assert.equal(body.teacher, identity);
    assert.equal(body.authenticated, true);
    const cookie = res.headers.get("Set-Cookie") || "";
    assert.match(cookie, new RegExp(`^${TEACHER_COOKIE_NAME}=`), "no session cookie was set");
    assert.equal(await verifySession(ENV, decodeURIComponent(cookie.split(";")[0].split("=")[1])), identity);
  }
});

await t("a wrong key is refused, sets no cookie, and is never echoed", async () => {
  const res = await call(post("login", { key: "wrong-key-9000" }));
  assert.equal(res.status, 401);
  assert.equal(res.headers.get("Set-Cookie"), null, "a refused login set a cookie");
  const text = await res.text();
  assert.ok(!text.includes("wrong-key-9000"), "the supplied key was echoed back");
  assert.ok(!/TEACHER_KEY/.test(text), "the response named the environment variable");
});

await t("a missing binding is 503, never 401 — an ops problem is not a teacher problem", async () => {
  const res = await call(post("login", { key: "anything" }), {});
  assert.equal(
    res.status,
    503,
    "an unconfigured deployment told the teacher their key was wrong, which sends them to " +
      "retype a credential that was never going to work",
  );
  assert.equal((await res.json()).error, "not-configured");
});

await t("/session reports configuration and authentication separately", async () => {
  const anon = await call(get("session"));
  const body = await anon.json();
  assert.equal(body.configured, true, "configured must not depend on being signed in");
  assert.equal(body.authenticated, false);
  assert.equal(body.teacher, null);

  const signedIn = await call(get("session"), ENV, { teacher: "Neft" });
  assert.equal((await signedIn.json()).teacher, "Neft");

  const unconfigured = await call(get("session"), {});
  const bare = await unconfigured.json();
  assert.equal(bare.configured, false);
  assert.equal(bare.keys, 0);
});

await t("/session counts the configured keys, so a PARTIAL binding is visible", async () => {
  // `configured` is true when ANY of the three bindings is set, so "only the
  // legacy key is set and Alba's is missing" reported exactly the same health
  // as "all three are set" — while locking a teacher out. The count separates
  // them without naming a variable or revealing a value.
  assert.equal((await (await call(get("session"), ENV)).json()).keys, 5);
  const partial = { TEACHER_KEY: "test-only-legacy-key" };
  const body = await (await call(get("session"), partial)).json();
  assert.equal(body.configured, true, "a partial binding still reports configured");
  assert.equal(body.keys, 1, "the count must expose the partial binding");
});

await t("a session cookie alone authenticates /session, with no key in the request", async () => {
  const token = await mintSession(ENV, "Alba");
  const res = await call(
    get("session", { Cookie: `${TEACHER_COOKIE_NAME}=${encodeURIComponent(token)}` }),
    ENV,
    {},
  );
  assert.equal((await res.json()).teacher, "Alba");
});

await t("logout clears the cookie", async () => {
  const res = await call(post("logout", {}));
  assert.equal(res.status, 200);
  assert.match(res.headers.get("Set-Cookie") || "", /Max-Age=0/);
  assert.equal((await res.json()).authenticated, false);
});


/* ── Alternates are explicit, not a rule ───────────────────────────────────── */

await t("an alternate is one exact extra value, NOT case-insensitive matching", () => {
  // The point of a second binding rather than a comparison rule: authorizing a
  // specific second spelling must not authorize every spelling. Case folding
  // would silently enlarge the valid password space for every current and
  // future key, which is not what anyone chose.
  const variants = [
    ENV.TEACHER_KEY_NEFT.toUpperCase(),
    ENV.TEACHER_KEY_NEFT.toLowerCase(),
    `${ENV.TEACHER_KEY_NEFT}X`,
    ENV.TEACHER_KEY_NEFT.replace("neft", "Neft"),
  ].filter((v) => v !== ENV.TEACHER_KEY_NEFT && v !== ENV.TEACHER_KEY_NEFT_ALT);
  for (const v of variants) {
    assert.equal(identityForKey(ENV, v), null, `an unapproved variant was accepted: ${v}`);
  }
});

await t("nothing in the auth path lowercases or folds the supplied value", () => {
  const src = readFileSync(new URL("./_lib/teacher-auth.js", import.meta.url), "utf8");
  assert.ok(!/toLowerCase\(\)|toUpperCase\(\)|localeCompare|normalize\(/.test(src),
    "the credential path now normalizes case, which authorizes values nobody approved");
});

await t("a missing ALTERNATE still lets the primary work", async () => {
  const partial = { TEACHER_KEY_NEFT: ENV.TEACHER_KEY_NEFT, TEACHER_KEY_ALBA: ENV.TEACHER_KEY_ALBA };
  const res = await call(post("login", { key: partial.TEACHER_KEY_NEFT }), partial);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).teacher, "Neft");
});

await t("a missing PRIMARY still lets the alternate work", async () => {
  const partial = { TEACHER_KEY_NEFT_ALT: ENV.TEACHER_KEY_NEFT_ALT };
  const res = await call(post("login", { key: partial.TEACHER_KEY_NEFT_ALT }), partial);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).teacher, "Neft");
});

await t("a teacher with NO binding at all cannot sign in, and it is not a 401 lie", async () => {
  const onlyAlba = { TEACHER_KEY_ALBA: ENV.TEACHER_KEY_ALBA };
  const avail = credentialAvailability(onlyAlba);
  assert.deepEqual(avail.Neft, { primary: false, alternate: false });
  assert.deepEqual(avail.Alba, { primary: true, alternate: false });
  // Alba can still sign in; the diagnostics say plainly that Neft has nothing.
  assert.equal((await (await call(post("login", { key: ENV.TEACHER_KEY_ALBA }), onlyAlba)).json()).teacher, "Alba");
});

await t("one value for two teachers authenticates NOBODY, and reports a config error", async () => {
  // Picking one would attribute a teacher's edits to their colleague; picking
  // by binding order would make that depend on the order of a list in a file.
  const clash = { TEACHER_KEY_NEFT: "same-value", TEACHER_KEY_ALBA: "same-value" };
  assert.equal(hasCredentialConflict(clash), true);
  assert.equal(identityForKey(clash, "same-value"), null);
  const res = await call(post("login", { key: "same-value" }), clash);
  assert.equal(res.status, 503, "a conflicted credential was reported as a teacher error");
  assert.equal((await res.json()).error, "credential-conflict");
});

await t("an alternate colliding with the OTHER teacher is a conflict too", () => {
  const clash = { TEACHER_KEY_NEFT: "shared", TEACHER_KEY_ALBA_ALT: "shared" };
  assert.equal(hasCredentialConflict(clash), true);
  assert.equal(identityForKey(clash, "shared"), null);
});

await t("the legacy key sharing a named teacher's value resolves to the TEACHER, not a conflict", () => {
  // TEACHER_KEY predates the split, so it plausibly still holds a named
  // teacher's string. Failing on that would take the site down to punish a
  // historical artifact; attributing it to the named human is more correct than
  // "Teacher" anyway.
  const legacyShared = { TEACHER_KEY_NEFT: "one-value", TEACHER_KEY: "one-value" };
  assert.equal(hasCredentialConflict(legacyShared), false);
  assert.equal(identityForKey(legacyShared, "one-value"), "Neft");
});

await t("/session names which slot is missing, without naming a value", async () => {
  const body = await (await call(get("session"), ENV)).json();
  assert.deepEqual(body.credentials.Neft, { primary: true, alternate: true });
  assert.deepEqual(body.credentials.Alba, { primary: true, alternate: true });
  assert.equal(body.credentials.conflict, false);
  const text = JSON.stringify(body);
  for (const value of Object.values(ENV)) {
    assert.ok(!text.includes(value), "a configured credential value reached the response");
  }
});

/* ── The predicate every gated endpoint uses ───────────────────────────────── */

await t("teacherAuthorized keeps ops failures and teacher failures apart", () => {
  const url = new URL("https://eduwonderlab.com/api/pacing");
  const bare = new Request(url);
  assert.equal(teacherAuthorized({}, bare, url), "not-configured");
  assert.equal(teacherAuthorized(ENV, bare, url), "unauthorized");
  assert.equal(teacherAuthorized(ENV, bare, url, { teacher: "Neft" }), "ok");
  const withKey = new Request(url, { headers: { "x-teacher-key": ENV.TEACHER_KEY_NEFT } });
  assert.equal(teacherAuthorized(ENV, withKey, url), "ok", "non-browser callers must still work");
});

console.log(`teacher auth: ${passed} assertions passed.`);
