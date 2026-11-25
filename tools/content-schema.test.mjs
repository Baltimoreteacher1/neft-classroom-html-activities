// G-25 schema v2 round trip and validation of every unit; G-26 provenance completeness and hash invalidation.
// Pure node. Every gate here has a negative control: a known-bad input it must reject.
import assert from "node:assert/strict";
import { test } from "node:test";
import { BCPSS_UNITS } from "../data/bcpss-curriculum-seed.mjs";
import { loadLessons } from "../functions/_lib/bcpss/lessons.js";
import { loadStudio } from "../functions/_lib/bcpss/studio.js";
import {
  lessonSetToV1,
  lessonSetToV2,
  studioToV1,
  studioToV2,
} from "../shared/content-schema/migrate.mjs";
import {
  applyReview,
  canonicalJson,
  effectiveState,
  emptyReview,
  isPublishReady,
  validateBlock,
  withContent,
} from "../shared/content-schema/v2.mjs";

const clone = (o) => JSON.parse(JSON.stringify(o));
const human = { name: "Test Reviewer", role: "pedagogy", date: "2026-11-25", actor: "human" };

// Load every unit once; the tests below share it.
const units = [];
for (const u of BCPSS_UNITS)
  units.push({ id: u.id, lessons: await loadLessons(u.id), studio: await loadStudio(u.id) });

test("G-25: all 162 units load and carry 1,584 lessons", () => {
  assert.equal(units.length, 162);
  assert.equal(
    units.reduce((n, u) => n + u.lessons.lessons.length, 0),
    1584,
  );
});

test("G-25: v1 -> v2 -> v1 reproduces every lesson set and studio unit exactly", async () => {
  for (const u of units) {
    const back = lessonSetToV1(await lessonSetToV2(u.lessons));
    assert.equal(canonicalJson(back), canonicalJson(u.lessons), `${u.id} lessons`);
    const studioBack = studioToV1(await studioToV2(u.id, u.studio));
    assert.equal(canonicalJson(studioBack), canonicalJson(u.studio), `${u.id} studio`);
  }
});

test("G-25: migration is idempotent", async () => {
  for (const u of units.slice(0, 20)) {
    const once = await lessonSetToV2(u.lessons);
    assert.equal(canonicalJson(await lessonSetToV2(once)), canonicalJson(once));
    const studio = await studioToV2(u.id, u.studio);
    assert.equal(canonicalJson(await studioToV2(u.id, studio)), canonicalJson(studio));
  }
});

test("G-25: every migrated block validates (schema, provenance, review, content hash)", async () => {
  let blocks = 0;
  for (const u of units) {
    const set = await lessonSetToV2(u.lessons);
    for (const b of [...set.blocks, await studioToV2(u.id, u.studio)]) {
      blocks++;
      assert.deepEqual(await validateBlock(b), [], b.id);
    }
  }
  assert.equal(blocks, 1584 + 162);
});

test("G-25 negative control: a lossy migration is detected by the round-trip comparison", async () => {
  const u = units[0];
  const v2 = await lessonSetToV2(u.lessons);
  v2.blocks[0].content.title = `${v2.blocks[0].content.title} (edited)`;
  assert.notEqual(canonicalJson(lessonSetToV1(v2)), canonicalJson(u.lessons));
});

test("G-25 negative control: migration refuses a v1 review state it cannot carry", async () => {
  const bad = clone(units[0].lessons);
  bad.lessons[0].review.pedagogy = "reviewed";
  await assert.rejects(() => lessonSetToV2(bad), /needs a human/);
});

test("G-26: provenance reflects v1 source (159 generated sets, 3 authored sets)", async () => {
  const origins = { generated: 0, authored: 0 };
  for (const u of units)
    for (const b of (await lessonSetToV2(u.lessons)).blocks) origins[b.provenance.origin]++;
  assert.equal(origins.generated, 1554);
  assert.equal(origins.authored, 30);
});

test("G-26: reviewed requires a human reviewer, a date and the content hash", async () => {
  const set = await lessonSetToV2(units[0].lessons);
  const b = clone(set.blocks[0]);
  b.review.pedagogy = { state: "reviewed", reviewers: [], reviewedHash: null };
  const errs = await validateBlock(b);
  assert.ok(
    errs.some((e) => /requires a reviewer/.test(e)),
    errs.join("\n"),
  );
  assert.ok(errs.some((e) => /reviewedHash/.test(e)));
});

test("G-26: editing reviewed content returns the dimension to in_review (hash invalidation)", async () => {
  const set = await lessonSetToV2(units[0].lessons);
  let b = set.blocks[0];
  b = await applyReview(b, { dimension: "pedagogy", state: "in_review", reviewer: human });
  b = await applyReview(b, { dimension: "pedagogy", state: "reviewed", reviewer: human });
  assert.equal(effectiveState(b, "pedagogy"), "reviewed");
  const edited = await withContent(b, { ...b.content, title: `${b.content.title} v2` });
  assert.equal(effectiveState(edited, "pedagogy"), "in_review");
  assert.deepEqual(await validateBlock(edited), []);
});

test("G-26: publish-ready needs every required dimension (math adds accuracy; translations per language)", async () => {
  let b = (await lessonSetToV2(units[0].lessons)).blocks[0];
  for (const dimension of ["pedagogy", "language_qa", "accessibility", "bias_sensitivity"]) {
    b = await applyReview(b, { dimension, state: "in_review", reviewer: human });
    b = await applyReview(b, { dimension, state: "reviewed", reviewer: human });
  }
  assert.equal(isPublishReady(b, { subject: "ela" }), true);
  assert.equal(isPublishReady(b, { subject: "math" }), false, "math needs math_science_accuracy");
  assert.equal(
    isPublishReady(b, { subject: "ela", languages: ["es"] }),
    false,
    "es translation not reviewed",
  );
});

test("G-26/G-37: no model can approve; state machine refuses skips", async () => {
  const b = (await lessonSetToV2(units[0].lessons)).blocks[0];
  await assert.rejects(
    () =>
      applyReview(b, {
        dimension: "pedagogy",
        state: "in_review",
        reviewer: { ...human, actor: "model" },
      }),
    /No model can approve/,
  );
  await assert.rejects(
    () => applyReview(b, { dimension: "pedagogy", state: "reviewed", reviewer: human }),
    /illegal review transition/,
  );
});

test("G-26 negative control: a block with a stale contentHash fails validation", async () => {
  const b = clone((await lessonSetToV2(units[0].lessons)).blocks[0]);
  b.content.title = `${b.content.title} !`;
  assert.ok((await validateBlock(b)).some((e) => /contentHash does not match/.test(e)));
});

test("emptyReview covers every dimension and the requested languages", () => {
  const r = emptyReview(["es"]);
  assert.equal(r.translation.es.state, "draft");
  assert.equal(r.math_science_accuracy.state, "draft");
});
