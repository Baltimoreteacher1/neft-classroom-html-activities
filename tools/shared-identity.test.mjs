#!/usr/bin/env node
/* =============================================================================
 * shared-identity.test.mjs — JSDOM tests for window.NTIdentity.
 *
 * NTIdentity is the single bridge between the two student records the platform
 * grew independently ("ewl-supports:v2:me" and "nt_student"). Its whole job is
 * to keep them in sync WITHOUT either side clobbering the other, so these tests
 * lean hard on the never-downgrade invariants — that is where a regression
 * would silently strip a student's accommodations or blank telemetry.
 * ========================================================================== */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = readFileSync(join(ROOT, "assets", "shared-identity.js"), "utf8");
const SUPPORTS_SRC = readFileSync(
  join(ROOT, "assets", "learning-supports", "learning-supports.js"),
  "utf8",
);

const ME_KEY = "ewl-supports:v2:me";
const STUDENT_KEY = "nt_student";

function load(url = "https://example.com/curriculum/") {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url,
    runScripts: "outside-only",
  });
  dom.window.eval(SRC);
  return dom.window;
}

const tests = [];
function test(name, fn) {
  tests.push([name, fn]);
}

// Objects built inside the JSDOM realm have a different Object.prototype, so
// assert.deepEqual reports "same structure but not reference-equal". Compare
// plain values instead of cross-realm identities.
function deepEqualAcrossRealms(actual, expected, message) {
  assert.deepEqual(JSON.parse(JSON.stringify(actual)), expected, message);
}

// ---- claiming an identity ---------------------------------------------------

test("set() writes BOTH records so one claim serves every consumer", () => {
  const w = load();
  w.NTIdentity.set({ section: "601", initials: "jn" });

  const me = JSON.parse(w.localStorage.getItem(ME_KEY));
  assert.equal(me.section, "601");
  assert.equal(me.initials, "JN", "initials are upper-cased to match the API validator");

  const stu = JSON.parse(w.localStorage.getItem(STUDENT_KEY));
  assert.equal(stu.section, "601");
  assert.equal(stu.alias, "JN", "alias is seeded so telemetry rows stop landing empty");
});

test("get() returns null until BOTH section and initials are known", () => {
  const w = load();
  assert.equal(w.NTIdentity.get(), null);
  w.NTIdentity.set({ section: "601" });
  assert.equal(w.NTIdentity.get(), null, "a section alone is not an identity");
  w.NTIdentity.set({ initials: "AB" });
  assert.equal(w.NTIdentity.get().initials, "AB");
});

test("label() renders the rail/chip label", () => {
  const w = load();
  assert.equal(w.NTIdentity.label(), "");
  w.NTIdentity.set({ section: "602", initials: "MK" });
  assert.equal(w.NTIdentity.label(), "MK · 602");
});

// ---- never-downgrade invariants --------------------------------------------

test("a real alias survives a later roster claim", () => {
  const w = load();
  w.NTIdentity.set({ alias: "Marisol K." });
  w.NTIdentity.set({ section: "601", initials: "MK" });
  const stu = JSON.parse(w.localStorage.getItem(STUDENT_KEY));
  assert.equal(stu.alias, "Marisol K.", "initials must never overwrite a typed display name");
});

test("setting an alias does not drop the roster identity", () => {
  const w = load();
  w.NTIdentity.set({ section: "603", initials: "TP" });
  w.NTIdentity.set({ alias: "Tomas P." });
  const me = w.NTIdentity.get();
  assert.equal(me.section, "603");
  assert.equal(me.initials, "TP");
  assert.equal(me.alias, "Tomas P.");
});

test("switching to a DIFFERENT student drops the previous alias", () => {
  // Shared-Chromebook / stamped-?me= case. Preserving the old alias here would
  // file the new student's telemetry and passport under someone else's name.
  const w = load();
  w.NTIdentity.set({ section: "601", initials: "JN", alias: "Jo N." });
  w.NTIdentity.set({ section: "602", initials: "MK" });
  const stu = JSON.parse(w.localStorage.getItem(STUDENT_KEY));
  assert.equal(stu.alias, "MK", "the incoming student must not inherit 'Jo N.'");
  assert.equal(stu.section, "602");
});

test("the alias is dropped even when v2:me was overwritten first", () => {
  // Reproduces the real call order in learning-supports.js v2SetMe(): the raw
  // "ewl-supports:v2:me" write lands BEFORE NTIdentity.set(), so a check that
  // diffed the previous record would see no switch and keep the stale name.
  const w = load();
  w.NTIdentity.set({ section: "601", initials: "JN", alias: "Jo N." });
  w.localStorage.setItem(
    ME_KEY,
    JSON.stringify({ section: "602", initials: "MK", at: Date.now() }),
  );
  w.NTIdentity.set({ section: "602", initials: "MK" });
  assert.equal(JSON.parse(w.localStorage.getItem(STUDENT_KEY)).alias, "MK");
});

test("an alias written by another module (no owner) is left alone", () => {
  const w = load();
  w.localStorage.setItem(STUDENT_KEY, JSON.stringify({ alias: "Typed Earlier" }));
  w.NTIdentity.set({ section: "601", initials: "JN" });
  assert.equal(JSON.parse(w.localStorage.getItem(STUDENT_KEY)).alias, "Typed Earlier");
});

test("re-picking the SAME student keeps their typed name", () => {
  const w = load();
  w.NTIdentity.set({ section: "601", initials: "JN", alias: "Jo N." });
  w.NTIdentity.set({ section: "601", initials: "JN" });
  assert.equal(JSON.parse(w.localStorage.getItem(STUDENT_KEY)).alias, "Jo N.");
});

test("unrelated fields on either record are preserved", () => {
  const w = load();
  w.localStorage.setItem(STUDENT_KEY, JSON.stringify({ alias: "X", avatar: "fox" }));
  w.NTIdentity.set({ section: "601", initials: "XY" });
  const stu = JSON.parse(w.localStorage.getItem(STUDENT_KEY));
  assert.equal(stu.avatar, "fox", "we only own alias + section on nt_student");
});

// ---- "not now" ---------------------------------------------------------------

test("skip() records a dismissal that expires, so new students get re-asked", () => {
  const w = load();
  w.NTIdentity.skip();
  assert.equal(w.NTIdentity.get().skipped, true);

  const stale = JSON.parse(w.localStorage.getItem(ME_KEY));
  stale.at = Date.now() - (w.NTIdentity.SKIP_TTL_MS + 1000);
  w.localStorage.setItem(ME_KEY, JSON.stringify(stale));
  assert.equal(w.NTIdentity.get(), null, "an expired skip is the same as no identity");
});

test("clear() forgets the roster identity but keeps the student's name", () => {
  const w = load();
  w.NTIdentity.set({ section: "601", initials: "JN", alias: "Jo N." });
  w.NTIdentity.clear();
  assert.equal(w.NTIdentity.get(), null);
  assert.equal(JSON.parse(w.localStorage.getItem(STUDENT_KEY)).alias, "Jo N.");
});

// ---- identity in a link -------------------------------------------------------

test("fromUrl() reads ?me= and #me=, and rejects junk", () => {
  deepEqualAcrossRealms(load("https://x.test/lessons/1-1/?me=601.jn").NTIdentity.fromUrl(), {
    section: "601",
    initials: "JN",
  });
  deepEqualAcrossRealms(load("https://x.test/lessons/1-1/#me=602.AB").NTIdentity.fromUrl(), {
    section: "602",
    initials: "AB",
  });
  assert.equal(load("https://x.test/lessons/1-1/").NTIdentity.fromUrl(), null);
  assert.equal(load("https://x.test/?me=601").NTIdentity.fromUrl(), null, "needs both halves");
  assert.equal(load("https://x.test/?me=.JN").NTIdentity.fromUrl(), null, "empty section");
});

// ---- lockstep with the lesson engine ------------------------------------------

test("assignedKey() matches the cache key learning-supports.js writes", () => {
  const w = load();
  assert.equal(w.NTIdentity.assignedKey("601", "JN"), "ewl-supports:v2:assigned:601:JN");
  // learning-supports.js builds the same string in v2CacheKey(). If that ever
  // drifts, the hub would warm a cache the lesson never reads and students
  // would see the identity modal twice again.
  assert.match(
    SUPPORTS_SRC,
    /"ewl-supports:v2:assigned:"\s*\+\s*section\s*\+\s*":"\s*\+\s*initials/,
    "v2CacheKey drifted from NTIdentity.assignedKey",
  );
});

test("the lesson engine still accepts the ?me= identity transport", () => {
  // The hub stamps ?me= onto every lesson link; if the engine stops reading it,
  // the whole carry-over story silently reverts to per-device self-pick.
  assert.match(SUPPORTS_SRC, /function v2IdentityFromUrl/);
  assert.match(SUPPORTS_SRC, /const urlMe = v2IdentityFromUrl\(\)/);
});

test("getAssigned/setAssigned round-trip under the current identity", () => {
  const w = load();
  assert.equal(w.NTIdentity.setAssigned({ items: ["tts"] }), false, "no identity -> no write");
  w.NTIdentity.set({ section: "601", initials: "JN" });
  w.NTIdentity.setAssigned({ items: ["tts"], lessons: ["1-1"] });
  deepEqualAcrossRealms(w.NTIdentity.getAssigned(), { items: ["tts"], lessons: ["1-1"] });
});

// ---- runner -------------------------------------------------------------------

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL  ${name}\n        ${err.message}`);
  }
}
console.log(`\nshared-identity: ${tests.length - failed}/${tests.length} passed.`);
process.exit(failed > 0 ? 1 : 0);
