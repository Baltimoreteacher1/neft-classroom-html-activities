// ACCESS Practice Lab 2.0: practice test builder and results. Negative controls: a draft item reaching a student set,
// a repeated stimulus, a missing disclaimer, a bad viewer. The verifier MUST flag each hand-made bad test.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildPracticeTest,
  scorePracticeTest,
  verifyPracticeTest,
} from "../shared/access-lab2/builder.js";
import { DOMAIN_SHARES, DOMAINS, LENGTHS } from "../shared/access-lab2/constants.js";
import { DEMO_ITEMS } from "../shared/access-lab2/demo-items.js";
import { disclaimerOk, findMissingDisclaimers } from "../shared/access-lab2/disclaimer.js";
import { assertStudentSafe } from "../shared/access-lab2/profile.js";
import { bestAnswer, clone, reviewedDemo, withState, worstAnswer } from "./access-lab2-helpers.mjs";

const REVIEWED = reviewedDemo();
const build = (extra = {}) =>
  buildPracticeTest({
    items: REVIEWED,
    gradeBand: "3-5",
    length: "standard",
    seed: "seed-1",
    viewer: "student",
    ...extra,
  });

test("mini and standard tests are domain-balanced, complete and obey every rule", () => {
  for (const length of ["mini", "standard"]) {
    const t = build({ length });
    assert.equal(t.complete, true, `${length} should be complete`);
    assert.equal(t.itemIds.length, LENGTHS[length]);
    for (const s of t.sections) assert.equal(s.itemIds.length, DOMAIN_SHARES[length][s.domain]);
    assert.deepEqual(verifyPracticeTest(t, REVIEWED), []);
    assert.equal(t.untimed, true);
    assert.equal(t.stamina, null);
  }
});

test("a long test cannot be built from the small demo set and says so instead of padding", () => {
  const t = build({ length: "long" });
  assert.equal(t.complete, false);
  assert.equal(t.shortfalls.length, 4);
  assert.ok(t.shortfalls.every((s) => s.wanted === 15 && s.got === 9));
  assert.equal(new Set(t.itemIds).size, t.itemIds.length, "no item twice");
});

test("negative control: draft items never reach a student set, but teachers see them", () => {
  const allDraft = buildPracticeTest({
    items: DEMO_ITEMS,
    gradeBand: "3-5",
    length: "mini",
    seed: "s",
    viewer: "student",
  });
  assert.deepEqual(allDraft.itemIds, []);
  assert.equal(allDraft.complete, false);
  const mixed = [
    ...REVIEWED.filter((i) => i.domain !== "Listening"),
    ...withState(
      DEMO_ITEMS.filter((i) => i.domain === "Listening"),
      "draft",
    ),
  ];
  const student = buildPracticeTest({
    items: mixed,
    gradeBand: "3-5",
    length: "mini",
    seed: "s",
    viewer: "student",
  });
  assert.ok(
    student.itemIds.every((id) => !id.startsWith("demo-l-")),
    "no draft Listening id in a student test",
  );
  assert.deepEqual(
    student.shortfalls.map((s) => s.domain),
    ["Listening"],
  );
  const teacher = buildPracticeTest({
    items: mixed,
    gradeBand: "3-5",
    length: "mini",
    seed: "s",
    viewer: "teacher",
  });
  assert.equal(teacher.complete, true);
  assert.ok(teacher.itemIds.some((id) => id.startsWith("demo-l-")));
  const retired = withState(DEMO_ITEMS, "retired");
  assert.deepEqual(
    buildPracticeTest({
      items: retired,
      gradeBand: "3-5",
      length: "mini",
      seed: "s",
      viewer: "teacher",
    }).itemIds,
    [],
  );
});

test("negative control: the verifier flags a draft item in a student test and a repeated stimulus", () => {
  const good = build({ length: "mini" });
  const withDraft = clone(good);
  const items = clone(REVIEWED);
  items.find((i) => i.id === withDraft.itemIds[0]).reviewState = "draft";
  assert.ok(
    verifyPracticeTest(withDraft, items).some((e) => /draft item in a student test/.test(e)),
  );
  const listening = good.sections[0].itemIds;
  const fixed = clone(REVIEWED);
  fixed.find((i) => i.id === listening[1]).task.stimulus.id = fixed.find(
    (i) => i.id === listening[0],
  ).task.stimulus.id;
  assert.ok(verifyPracticeTest(good, fixed).some((e) => /repeated stimulus/.test(e)));
});

test("the builder never repeats a stimulus even when the pool tries to", () => {
  const pool = clone(REVIEWED);
  const first = pool.find((i) => i.domain === "Reading");
  for (const it of pool.filter((i) => i.domain === "Reading" && i.band === "early"))
    it.task.stimulus.id = first.task.stimulus.id;
  const t = buildPracticeTest({
    items: pool,
    gradeBand: "3-5",
    length: "standard",
    seed: "x",
    viewer: "student",
  });
  assert.deepEqual(verifyPracticeTest(t, pool), []);
  const reading = t.sections.find((s) => s.domain === "Reading").itemIds;
  assert.ok(reading.length < 8, "three early items share one stimulus, so at most one is used");
});

test("negative control: the verifier flags a wrong ramp, missing disclaimer and a timed test", () => {
  const t = build({ length: "mini" });
  const ramp = clone(t);
  ramp.sections[0].itemIds.reverse();
  assert.ok(verifyPracticeTest(ramp, REVIEWED).some((e) => /does not ramp up/.test(e)));
  const noDisc = clone(t);
  delete noDisc.disclaimer;
  assert.ok(verifyPracticeTest(noDisc, REVIEWED).some((e) => /disclaimer/.test(e)));
  const timed = clone(t);
  timed.untimed = false;
  assert.ok(verifyPracticeTest(timed, REVIEWED).some((e) => /untimed/.test(e)));
});

test("difficulty ramps early to strong and Key Language Use coverage stays balanced inside each domain", () => {
  const t = build();
  for (const d of DOMAINS) {
    const counts = Object.values(t.coverage[d]);
    assert.ok(
      Math.max(...counts) - Math.min(...counts) <= 2,
      `${d} KLU spread ${JSON.stringify(t.coverage[d])}`,
    );
    assert.equal(Object.keys(t.coverage[d]).length, 4, `${d} covers all four KLUs`);
  }
});

test("the same seed rebuilds the same test; other seeds vary", () => {
  assert.deepEqual(build({ seed: "abc" }), build({ seed: "abc" }));
  const orders = new Set(
    ["a", "b", "c", "d", "e", "f"].map((seed) => build({ seed, length: "mini" }).itemIds.join()),
  );
  assert.ok(orders.size > 1, "different seeds should not all give one test");
});

test("argument errors fail fast", () => {
  assert.throws(() => build({ viewer: "parent" }), /viewer must be/);
  assert.throws(() => build({ viewer: undefined }), /viewer must be/);
  assert.throws(() => build({ seed: "" }), /seed is required/);
  assert.throws(() => build({ length: "huge" }), /length must be/);
  assert.throws(() => build({ gradeBand: "9-12" }), /gradeBand must be/);
  assert.throws(() => build({ domains: [] }), /domains must be/);
  assert.throws(
    () =>
      buildPracticeTest({
        items: null,
        gradeBand: "3-5",
        length: "mini",
        seed: "s",
        viewer: "student",
      }),
    /items must be/,
  );
});

test("items with another grade band are left out and invalid items are excluded, not served", () => {
  const pool = clone(REVIEWED);
  pool[0].task.prompt = "";
  const t = buildPracticeTest({
    items: pool,
    gradeBand: "3-5",
    length: "mini",
    seed: "s",
    viewer: "student",
  });
  assert.ok(t.excluded.some((e) => e.id === pool[0].id));
  assert.ok(!t.itemIds.includes(pool[0].id));
  assert.deepEqual(
    buildPracticeTest({
      items: REVIEWED,
      gradeBand: "6-8",
      length: "mini",
      seed: "s",
      viewer: "student",
    }).itemIds,
    [],
  );
});

test("stamina mode shows elapsed time to the student only and never reports it", () => {
  const t = build({ length: "mini", stamina: true });
  assert.deepEqual(t.stamina, {
    mode: "stamina",
    showElapsedToStudent: true,
    shareElapsedWithTeacher: false,
  });
  assert.equal(t.untimed, true, "still no countdown");
  const results = scorePracticeTest({ test: t, items: REVIEWED, answers: {}, alias: "Star 3" });
  assert.ok(
    !/elapsed|seconds|minutes|duration/i.test(JSON.stringify(results)),
    "results carry no timing",
  );
});

test("results: coarse bands, practice-next, friendly student view, mandatory disclaimer, no official-sounding number", () => {
  const t = build({ length: "standard" });
  const byId = new Map(REVIEWED.map((i) => [i.id, i]));
  const best = Object.fromEntries(t.itemIds.map((id) => [id, bestAnswer(byId.get(id))]));
  const worst = Object.fromEntries(t.itemIds.map((id) => [id, worstAnswer(byId.get(id))]));
  const high = scorePracticeTest({ test: t, items: REVIEWED, answers: best, alias: "Star 4" });
  const low = scorePracticeTest({ test: t, items: REVIEWED, answers: worst, alias: "Star 5" });
  for (const d of DOMAINS) {
    assert.equal(high.profile.domains[d].band, "strong", `${d} with every answer right`);
    assert.equal(low.profile.domains[d].band, "early", `${d} with every answer wrong`);
  }
  assert.equal(high.profile.practiceNext.length, 0);
  assert.equal(low.profile.practiceNext.length, 4);
  assert.ok(low.profile.practiceNext.every((n) => n.exercises.length > 0));
  for (const r of [high, low]) {
    assert.ok(disclaimerOk(r.disclaimer));
    assert.deepEqual(findMissingDisclaimers(r), []);
    assertStudentSafe(r.studentView);
    assert.ok(
      !/"(score|scaleScore|percent|percentage|proficiencyLevel|level)"\s*:/i.test(
        JSON.stringify(r),
      ),
      "no official-sounding number",
    );
  }
});

test("results keep too little evidence honest: unanswered domains get no band", () => {
  const t = build({ length: "mini" });
  const r = scorePracticeTest({ test: t, items: REVIEWED, answers: {}, alias: "Star 6" });
  for (const d of DOMAINS) assert.equal(r.profile.domains[d].band, null);
  assert.equal(r.answeredCount, 0);
});

test("results are alias-only: a real name is refused", () => {
  const t = build({ length: "mini" });
  assert.throws(
    () => scorePracticeTest({ test: t, items: REVIEWED, answers: {}, alias: "Maria Lopez" }),
    /alias/,
  );
  assert.throws(
    () => scorePracticeTest({ test: t, items: REVIEWED, answers: {}, alias: "maria@example.com" }),
    /alias/,
  );
});
