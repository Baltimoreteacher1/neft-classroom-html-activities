import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  applyPracticeReview,
  PRACTICE_REVIEW_FILE,
  stemFingerprint,
} from "../scripts/lib/homework-practice-review.mjs";
import { LESSONS_DIR } from "./lib/curriculum-source.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const review = JSON.parse(readFileSync(join(root, PRACTICE_REVIEW_FILE), "utf8")).lessons;

const mc = (stem, extra = {}) => ({
  type: "multiple-choice",
  stem,
  choices: ["a", "b"],
  correctIndex: 0,
  ...extra,
});

test("applyPracticeReview drops reviewed items, appends additions, never mutates", () => {
  const keep = mc("keep me");
  const drop = mc("drop me");
  const practice = { approaching: [keep], onLevel: [drop], optional: [], extending: [] };
  const added = mc("authored replacement");
  const out = applyPracticeReview("9-9", practice, {
    exclude: [
      { ref: "onLevel#0", stem: stemFingerprint(drop), reason: "off skill for the lesson" },
    ],
    add: { extending: [added] },
  });
  assert.deepEqual(out.approaching, [keep]);
  assert.deepEqual(out.onLevel, []);
  assert.deepEqual(out.extending, [added]);
  assert.equal(practice.onLevel.length, 1, "input must not be mutated");
});

test("applyPracticeReview throws when the pool no longer matches what was reviewed", () => {
  const practice = { onLevel: [mc("a different problem now")] };
  assert.throws(
    () =>
      applyPracticeReview("9-9", practice, {
        exclude: [
          { ref: "onLevel#0", stem: "the problem that was reviewed", reason: "x".repeat(20) },
        ],
      }),
    /no longer matches the reviewed problem/,
  );
});

test("review data is well-formed and points at real lessons", () => {
  const ids = Object.keys(review);
  assert.ok(ids.length > 0, "review file is empty");
  for (const id of ids) {
    assert.ok(existsSync(join(LESSONS_DIR, id, "config.json")), `${id} is not a lesson`);
    for (const ex of review[id].exclude || []) {
      assert.match(ex.ref, /^(approaching|onLevel|optional|extending)#\d+$/, `${id}: bad ref`);
      assert.ok(ex.stem && ex.stem.length >= 8, `${id} ${ex.ref}: missing stem fingerprint`);
      assert.ok(ex.reason && ex.reason.length >= 15, `${id} ${ex.ref}: needs a written reason`);
    }
    for (const [tier, items] of Object.entries(review[id].add || {})) {
      for (const it of items) {
        assert.ok(it.type, `${id} ${tier}: added item has no type`);
        if (it.type === "multiple-choice") {
          assert.ok(Array.isArray(it.choices) && it.choices.length >= 3, `${id}: too few choices`);
          assert.ok(Number.isInteger(it.correctIndex), `${id}: no correctIndex`);
          assert.ok(it.stemEs, `${id}: added item has no Spanish stem`);
        }
      }
    }
  }
});
