// The deploy verdict must never say "fine" when it did not actually look.
//
// This check exists to be trusted while nobody is watching it, so the tests
// that matter are the ones about ambiguity: a mismatch during Cloudflare's
// promotion window is NOT a failure, a mismatch an hour later IS, and anything
// unreadable is neither — it is unknown, loudly.

import assert from "node:assert/strict";
import test from "node:test";

import { evaluateDeploy, sameCommit } from "./deploy-status.js";

const NOW = Date.parse("2026-08-06T21:00:00.000Z");
const ago = (ms) => new Date(NOW - ms).toISOString();
const MIN = 60_000;

test("matching commits are ok, compared by prefix", () => {
  const full = "e4cecc4988b706156d0d28e003e937b5c10c70a4";
  for (const stamp of [full, "e4cecc498", "e4cecc4"]) {
    const r = evaluateDeploy({
      stampCommit: stamp,
      headCommit: full,
      headCommittedAt: ago(MIN),
      now: NOW,
    });
    assert.equal(r.status, "ok", `${stamp} should match ${full}`);
  }
});

test("a mismatch inside the promotion window is settling, not a failure", () => {
  // Cloudflare promotes across edge nodes over seconds. Failing here is how a
  // healthy deploy gets reported as degraded.
  const r = evaluateDeploy({
    stampCommit: "aaaaaaaaaaaa",
    headCommit: "bbbbbbbbbbbb",
    headCommittedAt: ago(30_000),
    now: NOW,
  });
  assert.equal(r.status, "settling");
  assert.match(r.detail, /promotion window/);
});

test("a mismatch that outlives the window is drift", () => {
  const r = evaluateDeploy({
    stampCommit: "aaaaaaaaaaaa",
    headCommit: "bbbbbbbbbbbb",
    headCommittedAt: ago(60 * MIN),
    now: NOW,
  });
  assert.equal(r.status, "drift");
  assert.match(r.detail, /did not promote/);
});

test("the boundary is the grace window, and it is configurable", () => {
  const args = {
    stampCommit: "aaaaaaaaaaaa",
    headCommit: "bbbbbbbbbbbb",
    now: NOW,
    graceMs: 10 * MIN,
  };
  assert.equal(evaluateDeploy({ ...args, headCommittedAt: ago(9 * MIN) }).status, "settling");
  assert.equal(evaluateDeploy({ ...args, headCommittedAt: ago(11 * MIN) }).status, "drift");
});

test("anything unreadable is unknown — never ok", () => {
  const base = { headCommit: "bbbbbbbbbbbb", headCommittedAt: ago(MIN), now: NOW };
  for (const stampCommit of [null, "", undefined]) {
    assert.equal(evaluateDeploy({ ...base, stampCommit }).status, "unknown");
  }
  assert.equal(
    evaluateDeploy({ stampCommit: "aaaaaaaaaaaa", headCommit: null, now: NOW }).status,
    "unknown",
  );
  // Known mismatch, unreadable date: we cannot judge how long, so we do not.
  const noDate = evaluateDeploy({
    stampCommit: "aaaaaaaaaaaa",
    headCommit: "bbbbbbbbbbbb",
    headCommittedAt: "not-a-date",
    now: NOW,
  });
  assert.equal(noDate.status, "unknown");
});

test("sameCommit refuses to guess from too-short input", () => {
  // "e4c" vs "e4cecc4" agreeing on three characters is not evidence.
  assert.equal(sameCommit("e4c", "e4cecc4988b7"), false);
  assert.equal(sameCommit("", "e4cecc4988b7"), false);
  assert.equal(sameCommit(null, undefined), false);
  assert.equal(sameCommit("E4CECC4988B7", "e4cecc4988b7"), true, "case-insensitive");
});

test("a truly different commit of the same length is not a match", () => {
  assert.equal(sameCommit("aaaaaaaaaaaa", "aaaaaaaaaaab"), false);
});
