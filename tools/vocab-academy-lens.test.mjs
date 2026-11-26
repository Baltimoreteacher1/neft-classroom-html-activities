// Vocabulary Academy -> My Words. Pure mapping only: what an Academy result is recorded as, and that the shape
// `planResults` produces (reading) is one `recordResult` accepts, which the reading callers got wrong until 2026-11.
import assert from "node:assert/strict";
import test from "node:test";
import {
  lensSummary,
  loadWords,
  noteWords,
} from "../access-practice-lab/src/lang/word-encounters.js";
import { lensEncounter } from "../access-practice-lab/src/vocab-academy/lens.js";
import { blankProgress, recordResult } from "../access-practice-lab/src/vocab-academy/model.js";
import { planResults } from "../access-practice-lab/src/vocab-academy/reading/flow.js";

const store = () => {
  let raw = null;
  return { read: () => raw, write: (_k, v) => (raw = v), get: () => raw };
};

test("a graded answer is chosen, not written or said, unless the item says so", () => {
  assert.equal(lensEncounter({ ok: true, dim: "prod" }, "factor").opts.mode, "chose");
  assert.equal(lensEncounter({ ok: true, mode: "match" }, "factor").opts.mode, "chose");
  assert.equal(lensEncounter({ ok: true, mode: "typed" }, "factor").opts.mode, "wrote");
  assert.equal(lensEncounter({ ok: false, mode: "write" }, "factor").opts.mode, "wrote");
  assert.equal(lensEncounter({ ok: true, mode: "speak" }, "factor").opts.mode, "said");
});

test("a support or a hint makes it supported; none makes it independent", () => {
  assert.equal(lensEncounter({ ok: true, sup: ["wordBank"] }, "factor").opts.supported, true);
  assert.equal(lensEncounter({ ok: true, hints: 1 }, "factor").opts.supported, true);
  assert.equal(lensEncounter({ ok: true, sup: [], hints: 0 }, "factor").opts.supported, false);
});

test("no headword means nothing is recorded", () => {
  assert.equal(lensEncounter({ ok: true }, ""), null);
  assert.equal(lensEncounter({ ok: true }, undefined), null);
  assert.equal(lensEncounter(null, "factor"), null);
});

test("the result carries the correctness and the source, and nothing the learner typed", () => {
  const e = lensEncounter({ ok: false, mode: "write", response: "my private sentence" }, "factor");
  assert.deepEqual(Object.keys(e.opts).sort(), ["mode", "ok", "src", "supported"]);
  assert.equal(e.opts.src, "vocab-academy");
  assert.equal(e.opts.ok, false);
});

test("a wrong typed answer is a tested, missed, written event and a seen card is not tested", () => {
  const io = store();
  const e = lensEncounter({ ok: false, mode: "typed" }, "evidence");
  noteWords([e.w], e.opts, io);
  noteWords(["pattern"], { src: "vocab-academy", mode: "saw" }, io);
  const summary = lensSummary(loadWords(io.read));
  assert.ok(summary.wrote.includes("evidence"));
  assert.ok(!summary.wrote.includes("pattern"));
  assert.equal(
    summary.independent.includes("evidence"),
    false,
    "a missed attempt is not independent use",
  );
});

test("reading's plan items go through recordResult in its object form", () => {
  const plan = planResults(
    { qs: [{ id: "q1", skill: "vocab", q: "What does factor mean here?" }] },
    [{ id: "va.factor.n", hw: "factor", forms: ["factor"] }],
    { q1: { first: true } },
  );
  for (const item of plan) {
    const p = blankProgress();
    recordResult(p, { wordId: item.wordId, dim: item.dim, ok: item.ok, sup: [], type: "reading" });
    assert.ok(p.words[item.wordId]);
  }
});

test("the old (progress, wordId, {correct, heavy}) shape is not accepted, so it cannot come back unnoticed", () => {
  assert.throws(() => recordResult(blankProgress(), "va.factor.n", { dim: "mean", correct: true }));
});
