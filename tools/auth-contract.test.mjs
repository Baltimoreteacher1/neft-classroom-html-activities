#!/usr/bin/env node
/**
 * auth-contract.test.mjs — the auth model's BEHAVIOUR, against the real module.
 *
 * validate-auth-contract.mjs proves the source still SAYS the right things.
 * This proves the middleware still DOES them, by calling onRequest directly
 * with a controlled environment. Between them they cover the two ways the
 * 2026-08-16 outage stayed invisible: source that read correctly, and a model
 * nobody was executing end to end.
 *
 * The one thing neither can do is type a password into a real browser — that is
 * tools/e2e-auth.mjs, in Chromium AND WebKit.
 */
import { strict as assert } from "node:assert";
import test from "node:test";
import { mintToken, SESSION_COOKIE } from "../functions/_lib/teacher-session.js";
import { isTeacherSurface } from "../functions/_lib/teacher-surface.js";
import { canonicalRedirect, onRequest } from "../functions/_middleware.js";

const PW = "test-password-not-a-real-secret";
const ok = () => new Response("<html><body>page</body></html>", { status: 200 });

const call = (
  path,
  { env = { SITE_PASSWORD: PW }, headers = {}, host = "eduwonderlab.com" } = {},
) =>
  onRequest({
    request: new Request(`https://${host}${path}`, { headers }),
    env,
    next: async () => ok(),
    data: {},
  });

/** The `name=value` pair out of a Set-Cookie, ready to send back as `Cookie`. */
const cookieFrom = (res) => (res.headers.get("set-cookie") || "").split(";")[0];

const basic = (password, user = "teacher") => ({
  Authorization: `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`,
});

/* ── §1 canonical host ─────────────────────────────────────────────────────── */

test("www canonicalizes to the apex with a 308, before anything else", async () => {
  const res = await call("/curriculum/planning/", { host: "www.eduwonderlab.com" });
  assert.equal(res.status, 308);
  assert.equal(res.headers.get("location"), "https://eduwonderlab.com/curriculum/planning/");
});

test("canonicalization happens WITHOUT a credential being requested", async () => {
  // The bug: www issued its own challenge, the teacher typed the password
  // there, and the browser filed it under the wrong host. The redirect must
  // come back instead of a 401.
  const res = await call("/teacher-tools/", { host: "www.eduwonderlab.com" });
  assert.equal(res.status, 308);
  assert.equal(res.headers.get("www-authenticate"), null);
});

test("the apex and preview hosts are left alone", () => {
  assert.equal(canonicalRedirect(new URL("https://eduwonderlab.com/x")), null);
  assert.equal(
    canonicalRedirect(new URL("https://abc.neft-classroom-html-activities.pages.dev/x")),
    null,
  );
});

/* ── §2 the Basic gate ─────────────────────────────────────────────────────── */

test("a student page is open, anonymously", async () => {
  const res = await call("/lessons/1-1/");
  assert.equal(res.status, 200);
});

test("a teacher page challenges with Basic and the expected realm", async () => {
  const res = await call("/teacher-tools/");
  assert.equal(res.status, 401);
  assert.match(res.headers.get("www-authenticate") || "", /^Basic realm="EduWonderLab"/);
});

test("the correct password opens it, and any username is accepted", async () => {
  for (const user of ["teacher", "neft", ""]) {
    const res = await call("/teacher-tools/", { headers: basic(PW, user) });
    assert.equal(res.status, 200, `username ${JSON.stringify(user)} was refused`);
  }
});

test("a wrong password is refused", async () => {
  const res = await call("/teacher-tools/", { headers: basic("wrong") });
  assert.equal(res.status, 401);
});

test("an authenticated teacher response is not cacheable", async () => {
  const res = await call("/teacher-tools/", { headers: basic(PW) });
  assert.equal(res.headers.get("cache-control"), "private, no-store");
});

/* ── §6 fail closed ────────────────────────────────────────────────────────── */

test("an unset SITE_PASSWORD returns 503 — never a public teacher surface", async () => {
  for (const env of [{}, { SITE_PASSWORD: "" }, { SITE_PASSWORD: undefined }]) {
    const res = await call("/teacher-tools/", { env });
    assert.equal(res.status, 503, `env ${JSON.stringify(env)} did not fail closed`);
    assert.notEqual(res.status, 200);
  }
});

test("an unset SITE_PASSWORD still leaves student pages open", async () => {
  const res = await call("/lessons/1-1/", { env: {} });
  assert.equal(res.status, 200);
});

/* ── §5 protected routes ───────────────────────────────────────────────────── */

test("the gated set is exactly what the contract describes", () => {
  for (const p of [
    "/teacher-tools/",
    "/lessons/1-1/teacher-notes/",
    "/math/unit-1/projects/answer-key/",
    "/curriculum/planning/",
    "/curriculum/plan-notes/",
    "/admin/",
    "/games/dashboard/",
  ]) {
    assert.equal(isTeacherSurface(p), true, `${p} should be gated`);
  }
});

test("shared assets, curriculum data and /api are never gated by the page rule", () => {
  // Gating these by filename substring 401s every student on /curriculum/ —
  // curriculum-teacher-workflow.js is fetched unconditionally by the public hub.
  for (const p of [
    "/assets/curriculum-teacher-workflow.js",
    "/data/curriculum-manifest.json",
    "/api/pacing/day",
    "/lessons/1-1/",
    "/curriculum/",
  ]) {
    assert.equal(isTeacherSurface(p), false, `${p} must stay open to students`);
  }
});

test("a gated path cannot be reached by respelling it", () => {
  // The predicate normalizes case, repeated percent-encoding, duplicate slashes
  // and traversal first, so these are all the same path.
  for (const p of [
    "/Lessons/1-1/Teacher-Notes/",
    "/lessons/1-1/%74eacher-notes/",
    "/lessons/1-1/%2574eacher-notes/",
    "/lessons//1-1///teacher-notes/",
    "/lessons/1-1/x/../teacher-notes/",
  ]) {
    assert.equal(isTeacherSurface(p), true, `${p} slipped past the gate`);
  }
});

test("a query string cannot make a student path look teacher-only, or the reverse", () => {
  assert.equal(isTeacherSurface("/lessons/1-1/?next=/teacher-tools/"), false);
  assert.equal(isTeacherSurface("/teacher-tools/?x=/lessons/"), true);
});

/* ── §11 the 24-hour receipt ───────────────────────────────────────────────── */

test("a successful Basic sign-in issues a 24-hour receipt", async () => {
  const res = await call("/teacher-tools/", { headers: basic(PW) });
  assert.equal(res.status, 200);
  const cookie = res.headers.get("set-cookie") || "";
  assert.match(cookie, /^nt_teacher_day=/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Max-Age=86400\b/);
});

test("the receipt opens a teacher surface with no challenge at all", async () => {
  const cookie = cookieFrom(await call("/teacher-tools/", { headers: basic(PW) }));
  const res = await call("/teacher-tools/", { headers: { Cookie: cookie } });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("www-authenticate"), null);
  assert.equal(res.headers.get("cache-control"), "private, no-store");
});

test("a receipt is worthless once the password rotates", async () => {
  const cookie = cookieFrom(await call("/teacher-tools/", { headers: basic(PW) }));
  const res = await call("/teacher-tools/", {
    headers: { Cookie: cookie },
    env: { SITE_PASSWORD: "rotated-password" },
  });
  assert.equal(res.status, 401);
});

test("a forged or tampered receipt is refused", async () => {
  const real = cookieFrom(await call("/teacher-tools/", { headers: basic(PW) }));
  const forged = [
    `nt_teacher_day=${Date.now() + 86400000}.not-a-signature`,
    `nt_teacher_day=${real.replace(/.$/, (c) => (c === "A" ? "B" : "A"))}`,
    "nt_teacher_day=9999999999999.",
    "nt_teacher_day=.sig",
  ];
  for (const cookie of forged) {
    const res = await call("/teacher-tools/", { headers: { Cookie: cookie } });
    assert.equal(res.status, 401, `${cookie} was accepted`);
  }
});

test("an expired receipt is refused", async () => {
  const stale = await mintToken(PW, Date.now() - 25 * 60 * 60 * 1000);
  const res = await call("/teacher-tools/", {
    headers: { Cookie: `${SESSION_COOKIE}=${stale}` },
  });
  assert.equal(res.status, 401);
});

/* ── §12 the Curriculum Hub console ────────────────────────────────────────── */

test("the hub index is the teacher console, and a student is sent to the picker", async () => {
  for (const p of ["/curriculum", "/curriculum/", "/curriculum/index.html"]) {
    const res = await call(p);
    assert.equal(res.status, 302, `${p} did not redirect`);
    assert.equal(res.headers.get("location"), "/curriculum/units/");
    // Never a password prompt: ~600 pages link here, including SCORM launches.
    assert.equal(res.headers.get("www-authenticate"), null);
    assert.match(res.headers.get("cache-control") || "", /no-store/);
  }
});

test("an authorized request gets the hub itself", async () => {
  for (const headers of [
    basic(PW),
    { Cookie: cookieFrom(await call("/curriculum/", { headers: basic(PW) })) },
  ]) {
    const res = await call("/curriculum/", { headers });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("cache-control"), "private, no-store");
  }
});

test("?teacher=1 reaches the password prompt instead of the redirect", async () => {
  const res = await call("/curriculum/?teacher=1");
  assert.equal(res.status, 401);
  assert.match(res.headers.get("www-authenticate") || "", /^Basic realm="EduWonderLab"/);
});

test("everything else under /curriculum/ stays open to students", async () => {
  for (const p of [
    "/curriculum/units/",
    "/curriculum/arcade/",
    "/curriculum/projects/",
    "/curriculum/student-launch/",
    "/curriculum/family-connections/",
    "/curriculum/my-progress/",
  ]) {
    const res = await call(p);
    assert.equal(res.status, 200, `${p} is no longer open to students`);
  }
});

test("the hub fails closed to the STUDENT PICKER when SITE_PASSWORD is unset", async () => {
  // A 503 here would break a link that every lesson page carries; serving the
  // console would leak it. The third option is the only correct one.
  const res = await call("/curriculum/", { env: {} });
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("location"), "/curriculum/units/");
});

test("the hub redirect cannot be turned into an open redirect", async () => {
  for (const p of [
    "/curriculum/?teacher=https://evil.example.com",
    "/curriculum/?next=//evil.example.com",
  ]) {
    const res = await call(p);
    assert.equal(res.status, 302);
    assert.match(res.headers.get("location") || "", /^\/curriculum\/units\//);
  }
});
