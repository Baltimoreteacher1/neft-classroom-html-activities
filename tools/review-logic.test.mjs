// Review workflow logic, pure: state machine, human-only reviewers, server-side hash, hash invalidation,
// bulk sample selection and tokens, hash-chain tamper detection. Every gate has a negative control: a known-bad
// input the check MUST refuse.
import assert from "node:assert/strict";
import { test } from "node:test";
import { loadBlock, subjectKey } from "../functions/_lib/review/blocks.js";
import {
  applyOverlay,
  DecisionError,
  decide,
  effectiveStates,
  humanReviewer,
  rollupBadge,
} from "../functions/_lib/review/decide.js";
import {
  chooseSample,
  issueSampleToken,
  itemKey,
  verifySampleToken,
} from "../functions/_lib/review/sample.js";
import {
  eventDigest,
  GENESIS_DIGEST,
  verifyEventChain,
} from "../shared/content-schema/review-chain.js";
import { contentHash, effectiveState, withContent } from "../shared/content-schema/v2.mjs";
import { createRng } from "../shared/fixtures/prng.js";

const TODAY = "2026-11-25";
const person = { name: "Pat Reviewer", role: "pedagogy", actor: "human" };
const { block: LESSON, unit: UNIT } = await loadBlock("g6-math-u1-l01");
const SUBJECT = subjectKey(UNIT);
const run = (over = {}) =>
  decide({
    block: LESSON,
    dimension: "pedagogy",
    state: "in_review",
    reviewer: person,
    subject: SUBJECT,
    today: TODAY,
    ...over,
  });
const refused = async (promise, code) =>
  assert.rejects(
    promise,
    (err) => err instanceof DecisionError && err.code === code,
    `expected ${code}`,
  );

test("state machine: draft -> in_review -> reviewed, and every illegal move is refused", async () => {
  const a = await run();
  assert.equal(a.event.fromState, "draft");
  assert.equal(a.event.toState, "in_review");
  const b = await run({ block: a.block, state: "reviewed" });
  assert.equal(effectiveState(b.block, "pedagogy"), "reviewed");
  assert.equal(b.block.review.pedagogy.reviewedHash, LESSON.provenance.contentHash);
  await refused(run({ state: "reviewed" }), "illegal-transition"); // draft -> reviewed skips review
  const retired = await run({ state: "retired", comment: "Replaced by a new lesson." });
  await refused(run({ block: retired.block, state: "in_review" }), "illegal-transition"); // retired is terminal
  await refused(run({ state: "draft" }), "unknown-state");
});

test("needs_changes and retired need a written reason", async () => {
  const a = await run();
  await refused(run({ block: a.block, state: "needs_changes" }), "comment-required");
  const ok = await run({
    block: a.block,
    state: "needs_changes",
    comment: "Sentence frame is too hard for level 1.",
  });
  assert.equal(ok.event.comment, "Sentence frame is too hard for level 1.");
  await refused(run({ comment: "x".repeat(501) }), "comment-too-long");
});

test("human-only: a model, bot or unnamed actor can never decide (negative controls)", async () => {
  for (const actor of ["model", "bot", "AI", "agent", "system"]) {
    await refused(run({ reviewer: { ...person, actor } }), "non-human-actor");
  }
  await refused(run({ reviewer: { name: "Pat", role: "pedagogy" } }), "actor-required");
  await refused(run({ reviewer: { ...person, actor: "robot-human" } }), "actor-required");
  for (const name of ["Claude", "GPT-5 Reviewer", "review bot", "Gemini", "Auto Approver", "AI"]) {
    await refused(run({ reviewer: { ...person, name } }), "non-human-actor");
  }
  await refused(run({ reviewer: { ...person, role: "robot" } }), "reviewer-role");
  await refused(run({ reviewer: { ...person, name: "   " } }), "reviewer-name");
  await refused(run({ reviewer: null }), "reviewer-required");
  assert.deepEqual(humanReviewer(person, TODAY), {
    name: "Pat Reviewer",
    role: "pedagogy",
    date: TODAY,
    actor: "human",
  });
});

test("server-side hash: the decision binds to the hash of the content the server holds", async () => {
  const { event } = await run();
  assert.equal(event.contentHash, await contentHash(LESSON.content));
  assert.deepEqual(event.snapshot, LESSON.content);
  // A block whose provenance hash disagrees with its content (a stale or forged block) is refused.
  const forged = { ...LESSON, provenance: { ...LESSON.provenance, contentHash: "0".repeat(64) } };
  await refused(run({ block: forged }), "stale-block");
  const tampered = { ...LESSON, content: { ...LESSON.content, title: "Changed after hashing" } };
  await refused(run({ block: tampered }), "stale-block");
});

test("hash invalidation: a reviewed dimension reads in_review again once the content changes", async () => {
  const a = await run();
  const b = await run({ block: a.block, state: "reviewed" });
  assert.equal(effectiveState(b.block, "pedagogy"), "reviewed");
  const edited = await withContent(b.block, { ...b.block.content, title: "A new title" });
  assert.equal(effectiveState(edited, "pedagogy"), "in_review");
  assert.equal(rollupBadge(effectiveStates(edited, SUBJECT)), "in_review");
  // control: an unedited block stays reviewed
  assert.equal(effectiveState(b.block, "pedagogy"), "reviewed");
  // and it can be re-approved
  const again = await run({ block: edited, state: "reviewed" });
  assert.equal(effectiveState(again.block, "pedagogy"), "reviewed");
});

test("dimension rules: accuracy only for math and science; translation needs an existing language", async () => {
  const ela = await loadBlock("gk-ela-u1-l01");
  const base = {
    block: ela.block,
    state: "in_review",
    reviewer: person,
    subject: subjectKey(ela.unit),
    today: TODAY,
  };
  await refused(decide({ ...base, dimension: "math_science_accuracy" }), "dimension-not-required");
  await refused(decide({ ...base, dimension: "no_such" }), "unknown-dimension");
  await refused(decide({ ...base, dimension: "translation", lang: "es" }), "unknown-language");
  await refused(decide({ ...base, dimension: "translation" }), "lang-required");
  await refused(decide({ ...base, dimension: "pedagogy", lang: "es" }), "lang-not-allowed");
  await run({ dimension: "math_science_accuracy" }); // math lesson: fine
});

test("overlay: stored state with a stale hash reads in_review; badge rolls up", async () => {
  const rows = [
    {
      block_id: LESSON.id,
      dimension: "pedagogy",
      lang: "",
      state: "reviewed",
      reviewed_hash: "a".repeat(64),
      reviewer_name: "Pat",
      reviewer_role: "pedagogy",
      reviewer_date: TODAY,
    },
  ];
  const overlaid = applyOverlay(LESSON, rows);
  assert.equal(overlaid.review.pedagogy.state, "reviewed");
  assert.equal(effectiveState(overlaid, "pedagogy"), "in_review");
  const all = [
    "pedagogy",
    "language_qa",
    "accessibility",
    "bias_sensitivity",
    "math_science_accuracy",
  ].map((d) => ({
    block_id: LESSON.id,
    dimension: d,
    lang: "",
    state: "reviewed",
    reviewed_hash: LESSON.provenance.contentHash,
    reviewer_name: "Pat",
    reviewer_role: "admin",
    reviewer_date: TODAY,
  }));
  assert.equal(rollupBadge(effectiveStates(applyOverlay(LESSON, all), SUBJECT)), "reviewed");
  assert.equal(rollupBadge(effectiveStates(LESSON, SUBJECT)), "draft");
});

test("bulk sample: seeded and reproducible, distinct, size 3, token is bound to set, reviewer and time", async () => {
  const items = Array.from({ length: 12 }, (_, i) => ({
    blockId: `g6-math-u1-l${String(i + 1).padStart(2, "0")}`,
    dimension: "pedagogy",
    lang: "",
  }));
  const pick = (seed) => chooseSample(items, createRng(seed).next).map(itemKey);
  assert.deepEqual(pick("s1"), pick("s1"));
  assert.notDeepEqual(pick("s1"), pick("s2"));
  assert.equal(new Set(pick("s1")).size, 3);
  assert.ok(pick("s1").every((k) => items.map(itemKey).includes(k)));
  assert.equal(chooseSample(items.slice(0, 2), createRng("x").next).length, 2);

  const secret = "k";
  const sample = chooseSample(items, createRng("s1").next);
  const { token, payload } = await issueSampleToken({
    secret,
    items,
    sample,
    reviewerName: "Pat",
    now: 1000,
  });
  const ok = await verifySampleToken({ secret, token, items, reviewerName: "Pat", now: 2000 });
  assert.deepEqual(ok.ids, payload.ids);
  const code = (p) =>
    p.then(
      () => null,
      (e) => e.code,
    );
  assert.equal(
    await code(
      verifySampleToken({ secret: "other", token, items, reviewerName: "Pat", now: 2000 }),
    ),
    "sample-invalid",
  );
  assert.equal(
    await code(
      verifySampleToken({
        secret,
        token: `${token.slice(0, -2)}AA`,
        items,
        reviewerName: "Pat",
        now: 2000,
      }),
    ),
    "sample-invalid",
  );
  assert.equal(
    await code(
      verifySampleToken({ secret, token, items: items.slice(1), reviewerName: "Pat", now: 2000 }),
    ),
    "sample-invalid",
  );
  assert.equal(
    await code(verifySampleToken({ secret, token, items, reviewerName: "Sam", now: 2000 })),
    "sample-invalid",
  );
  assert.equal(
    await code(
      verifySampleToken({ secret, token, items, reviewerName: "Pat", now: 1000 + 31 * 60_000 }),
    ),
    "sample-expired",
  );
  assert.equal(
    await code(
      verifySampleToken({ secret, token: undefined, items, reviewerName: "Pat", now: 2000 }),
    ),
    "sample-required",
  );
});

async function chain(n) {
  const rows = [];
  let prior = GENESIS_DIGEST;
  for (let i = 0; i < n; i++) {
    const snapshot = { title: `lesson ${i}` };
    const row = {
      id: `e${i}`,
      block_id: "g6-math-u1-l01",
      kind: "decide",
      dimension: "pedagogy",
      lang: "",
      from_state: "draft",
      to_state: "in_review",
      reviewer_name: "Pat",
      reviewer_role: "pedagogy",
      reviewer_date: TODAY,
      actor: "human",
      content_hash: await contentHash(snapshot),
      snapshot_json: JSON.stringify(snapshot),
      comment: "",
      bulk_id: null,
      created_at: 1000 + i,
      prior_digest: prior,
    };
    row.digest = await eventDigest(row);
    prior = row.digest;
    rows.push(row);
  }
  return rows;
}

test("hash chain: an intact chain verifies; every kind of tampering is detected (negative controls)", async () => {
  const rows = await chain(4);
  assert.deepEqual(await verifyEventChain(rows), []);
  const clone = () => rows.map((r) => ({ ...r }));
  const flagged = async (mutate, why) => {
    const c = clone();
    mutate(c);
    assert.ok((await verifyEventChain(c)).length > 0, `not detected: ${why}`);
  };
  await flagged((c) => (c[1].to_state = "reviewed"), "state edited");
  await flagged((c) => (c[2].reviewer_name = "Someone Else"), "reviewer edited");
  await flagged((c) => (c[0].comment = "added"), "comment edited");
  await flagged((c) => (c[1].created_at = 5), "time edited");
  await flagged((c) => c.splice(1, 1), "row removed");
  await flagged((c) => c.reverse(), "rows reordered");
  await flagged(
    (c) => (c[3].snapshot_json = JSON.stringify({ title: "forged" })),
    "snapshot edited",
  );
  await flagged((c) => (c[2].content_hash = "f".repeat(64)), "content hash edited");
  await flagged((c) => (c[3].actor = "model"), "actor edited");
  // a truncated tail is still a valid prefix; resuming from the right prior digest verifies the rest
  assert.deepEqual(await verifyEventChain(rows.slice(2), rows[1].digest), []);
});
