#!/usr/bin/env node
// "How sure are you?": ratings are optional, never change correctness, and only add two readings —
// a guessed-but-right answer returns to spaced review, a sure-but-wrong answer is flagged. Counts only.
import assert from "node:assert/strict";
import test from "node:test";
import { dueForReview } from "../access-practice-lab/src/lang/adapt.js";
import {
  calibration,
  MIN_RATED,
  normalizeSure,
  ratedResults,
  sureFlag,
} from "../access-practice-lab/src/lang/calibration.js";
import { buildShare, normalize } from "../access-practice-lab/src/lang/share.js";

const r = (ok, sure, extra = {}) => ({
  ok,
  sure,
  skill: "main-idea",
  meaningful: true,
  date: "2026-10-01T10:00:00Z",
  ...extra,
});
const rec = (results) => [{ record: { results } }];

test("only 1, 2 and 3 are ratings; anything else stays unrated", () => {
  assert.deepEqual([1, 2, 3].map(normalizeSure), [1, 2, 3]);
  for (const v of [0, 4, "3", null, undefined, 2.5]) assert.equal(normalizeSure(v), null);
});

test("flags: sure+wrong and guess+right matter, everything else says nothing", () => {
  assert.equal(sureFlag(false, 3).flag, "sure-wrong");
  assert.equal(sureFlag(true, 1).flag, "lucky");
  assert.equal(sureFlag(true, 3).flag, "secure");
  for (const [ok, sure] of [
    [false, 1],
    [false, 2],
    [true, 2],
    [true, null],
    [false, undefined],
  ])
    assert.equal(sureFlag(ok, sure).flag, "");
  assert.ok(sureFlag(false, 3).es.length > 10, "Spanish sentence present");
});

test("calibration counts rated answers only and is withheld under the minimum", () => {
  const few = calibration(rec({ a: r(true, 3), b: r(false, 3), c: r(true, undefined) }));
  assert.equal(few.rated, 2);
  assert.equal(few.enough, false);
  const many = calibration(
    rec(
      Object.fromEntries(
        Array.from({ length: MIN_RATED }, (_, i) => [`q${i}`, r(i % 2 === 0, (i % 3) + 1)]),
      ),
    ),
  );
  assert.equal(many.enough, true);
  assert.equal(
    Object.values(many.cells).reduce((a, b) => a + b, 0),
    MIN_RATED,
  );
});

test("both record shapes read the same: local rows and a share's results map", () => {
  const results = { a: r(true, 1), b: r(false, 3) };
  assert.equal(ratedResults(rec(results)).length, 2);
  assert.equal(ratedResults({ "Reading:A": { results } }).length, 2);
  assert.equal(
    ratedResults(rec({ x: { ok: true, sure: 3, meaningful: false } })).length,
    0,
    "draft answers are not evidence",
  );
});

test("a share carries the rating and the teacher-side reader keeps it", () => {
  const records = [
    {
      band: "6-8",
      domain: "Reading",
      level: "A",
      record: {
        results: {
          q1: {
            ok: true,
            skill: "main-idea",
            sure: 1,
            date: "2026-10-01T10:00:00Z",
            meaningful: true,
          },
        },
      },
    },
  ];
  const share = buildShare(
    { alias: "Pat" },
    { entries: [] },
    { writing: {}, speaking: {}, missions: {}, detective: {}, portfolio: [] },
    records,
  );
  assert.equal(share.records["Reading:A"].results.q1.sure, 1);
  assert.equal(
    normalize(JSON.parse(JSON.stringify(share))).records["Reading:A"].results.q1.sure,
    1,
  );
});

test("a correct answer marked 'guessing' comes back for review; a sure one does not", () => {
  const day = 864e5;
  const now = Date.parse("2026-10-10T10:00:00Z");
  const made = (sure) => ({
    "Reading:A": {
      band: "6-8",
      domain: "Reading",
      level: "A",
      results: {
        q1: {
          ok: true,
          skill: "main-idea",
          supportUsed: false,
          date: new Date(now - 2 * day).toISOString(),
          ...(sure ? { sure } : {}),
        },
      },
    },
  });
  const due = (sure) => dueForReview([], now, { records: made(sure) });
  const guessed = due(1);
  assert.equal(guessed.length, 1, "guessed answer is due after one day");
  assert.match(guessed[0].reason, /guess/);
  assert.equal(due(3).length, 0, "sure and right is not due yet (3-day step)");
});
