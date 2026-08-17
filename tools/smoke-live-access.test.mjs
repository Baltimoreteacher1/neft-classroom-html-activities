#!/usr/bin/env node
import assert from "node:assert/strict";
import test from "node:test";
import { TARGETS } from "../scripts/diagnose-student-access.mjs";
import {
  ACCESS_CLASS,
  classifyResponse,
  isCloudflareAccess,
} from "../scripts/lib/cloudflare-access.mjs";

test("the live Access interstitial is recognised", () => {
  const body = `<!DOCTYPE html><html><head><title>Sign in ・ Cloudflare Access</title></head><body></body></html>`;
  assert.equal(isCloudflareAccess(body), true);
});

test("a real lesson page is not Access", () => {
  assert.equal(
    isCloudflareAccess("<!DOCTYPE html><html><head><title>Lesson 1-1</title></head></html>"),
    false,
  );
});

test("empty or non-string is not Access", () => {
  assert.equal(isCloudflareAccess(""), false);
  assert.equal(isCloudflareAccess(null), false);
});

test("a 200 Access interstitial is ACCESS, never PUBLIC", () => {
  const body = `<!DOCTYPE html><html><head><title>Sign in ・ Cloudflare Access</title></head></html>`;
  assert.equal(classifyResponse({ status: 200, body }), ACCESS_CLASS.ACCESS);
});

test("a 302 to cloudflareaccess.com is ACCESS", () => {
  assert.equal(
    classifyResponse({
      status: 302,
      headers: { location: "https://eduwonderlab.cloudflareaccess.com/cdn-cgi/access/login" },
      body: "",
    }),
    ACCESS_CLASS.ACCESS,
  );
});

test("a 302 to a Cloudflare One team login host is ACCESS", () => {
  assert.equal(
    classifyResponse({
      status: 302,
      headers: {
        location:
          "https://flat-haze-aa5c.cloudflareaccess.com/cdn-cgi/access/login/eduwonderlab.com",
      },
      body: "",
    }),
    ACCESS_CLASS.ACCESS,
  );
});

test("www → apex 308 is CANONICAL, never PUBLIC", () => {
  assert.equal(
    classifyResponse({
      status: 308,
      headers: { location: "https://eduwonderlab.com/lessons/1-1/" },
      body: "",
    }),
    ACCESS_CLASS.CANONICAL,
  );
});

test("HTTP Basic 401 is APP AUTH", () => {
  assert.equal(
    classifyResponse({
      status: 401,
      headers: { "www-authenticate": 'Basic realm="Neft Teacher"' },
      body: "Unauthorized",
    }),
    ACCESS_CLASS.APP_AUTH,
  );
});

test("a real 200 lesson page is PUBLIC", () => {
  assert.equal(
    classifyResponse({
      status: 200,
      body: "<!DOCTYPE html><html><head><title>Lesson 1-1</title></head></html>",
    }),
    ACCESS_CLASS.PUBLIC,
  );
});

test("a fetch failure is NETWORK", () => {
  assert.equal(classifyResponse({ error: new Error("fetch failed") }), ACCESS_CLASS.NETWORK);
});

test("a 403 with no Access markers is UNEXPECTED", () => {
  assert.equal(classifyResponse({ status: 403, body: "blocked" }), ACCESS_CLASS.UNEXPECTED);
});

test("the diagnostic probes student pages, assets, a public API, and one teacher surface", () => {
  const paths = TARGETS.map((t) => t.path);
  for (const need of [
    "/",
    "/curriculum/",
    "/lessons/1-1/",
    "/assets/app.js",
    "/assets/shared.css",
    "/api/settings/today",
  ]) {
    assert.ok(paths.includes(need), `missing student probe ${need}`);
  }
  assert.ok(TARGETS.some((t) => t.audience === "teacher"));
  assert.ok(TARGETS.filter((t) => t.audience === "student").length >= 6);
});

test("production-access probes every SCORM family plus teacher surfaces", async () => {
  const { STUDENT_TARGETS, TEACHER_TARGETS, WWW_TARGETS } = await import(
    "../scripts/diagnose-production-access.mjs"
  );
  const student = STUDENT_TARGETS.map((t) => t.path);
  for (const need of [
    "/lessons/1-1/",
    "/lessons/5-1/",
    "/lessons/1-1/homework.html",
    "/ratio-color-mixer/",
    "/lessons/1-1/config.json",
    "/assets/app.js",
    "/assets/shared.css",
    "/api/progress/health",
  ]) {
    assert.ok(student.includes(need), `missing student runtime probe ${need}`);
  }
  const teacher = TEACHER_TARGETS.map((t) => t.path);
  for (const need of ["/teacher-tools/", "/curriculum/planning/", "/api/pacing/current"]) {
    assert.ok(teacher.includes(need), `missing teacher probe ${need}`);
  }
  assert.ok(WWW_TARGETS.some((t) => t.path === "/lessons/1-1/"));
});
