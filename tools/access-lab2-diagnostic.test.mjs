// ACCESS Practice Lab 2.0: adaptive-lite diagnostic. Negative controls: a student view that shows a band word, a
// diagnostic that is not finished, draft items reaching a student session.
import assert from "node:assert/strict";
import { test } from "node:test";
import { DOMAINS } from "../shared/access-lab2/constants.js";
import { DEMO_ITEMS } from "../shared/access-lab2/demo-items.js";
import {
  answerDiagnosticItem,
  estimateMinutes,
  finishDiagnostic,
  MAX_PER_DOMAIN,
  MIN_PER_DOMAIN,
  nextDiagnosticItem,
  startDiagnostic,
} from "../shared/access-lab2/diagnostic.js";
import { disclaimerOk, findMissingDisclaimers } from "../shared/access-lab2/disclaimer.js";
import { assertStudentSafe } from "../shared/access-lab2/profile.js";
import { bestAnswer, clone, worstAnswer } from "./access-lab2-helpers.mjs";

/** Runs a whole session; `answerWith(item)` decides each answer. Returns the final state and the items served in order. */
function run(items, answerWith, opts = {}) {
  let state = startDiagnostic({ gradeBand: "3-5", seed: "d1", viewer: "teacher", ...opts });
  const served = [];
  for (;;) {
    const next = nextDiagnosticItem(state, items);
    state = next.state;
    if (!next.item) break;
    served.push(next.item);
    state = answerDiagnosticItem(state, items, answerWith(next.item));
  }
  return { state, served };
}

test("4 to 6 items per domain; Listening and Reading are keyed, Speaking and Writing are self-check only", () => {
  const { state, served } = run(DEMO_ITEMS, bestAnswer);
  for (const d of DOMAINS) {
    const mine = served.filter((i) => i.domain === d);
    assert.ok(
      mine.length >= MIN_PER_DOMAIN && mine.length <= MAX_PER_DOMAIN,
      `${d} served ${mine.length}`,
    );
    const want = d === "Speaking" || d === "Writing" ? "selfcheck" : "key";
    assert.ok(
      mine.every((i) => i.scoring.type === want),
      `${d} must use ${want} items`,
    );
    assert.equal(
      new Set(mine.map((i) => i.task.stimulus.id)).size,
      mine.length,
      "no repeated stimulus",
    );
  }
  assert.equal(state.phase, "done");
  assert.ok(estimateMinutes(state) <= 25, "about 15 minutes of planning guidance");
});

test("it steps up after a streak of successes and down after a streak of struggles", () => {
  const up = run(DEMO_ITEMS, bestAnswer).state;
  const down = run(DEMO_ITEMS, worstAnswer).state;
  for (const d of DOMAINS) {
    assert.equal(up.domains[d].band, "strong", `${d} ends strong after all successes`);
    assert.equal(down.domains[d].band, "early", `${d} ends early after all struggles`);
  }
  const best = run(DEMO_ITEMS, bestAnswer).served.filter((i) => i.domain === "Listening");
  assert.equal(best[0].band, "building", "starts mid-band");
  assert.ok(
    best.some((i) => i.band === "strong"),
    "serves a strong item after a streak of successes",
  );
  const worst = run(DEMO_ITEMS, worstAnswer).served.filter((i) => i.domain === "Reading");
  assert.equal(worst[0].band, "building", "starts mid-band");
  assert.ok(
    worst.some((i) => i.band === "early"),
    "serves an early item after a streak of struggles",
  );
});

test("a steady middle band stops at the minimum", () => {
  let n = 0;
  const alternate = (item) => (n++ % 2 === 0 ? bestAnswer(item) : worstAnswer(item));
  const { served } = run(DEMO_ITEMS, alternate);
  for (const d of DOMAINS)
    assert.equal(served.filter((i) => i.domain === d).length, MIN_PER_DOMAIN);
});

test("the output seeds a profile and the Road: teacher summary by alias, friendly student view, mandatory disclaimer", () => {
  const { state } = run(DEMO_ITEMS, worstAnswer);
  const out = finishDiagnostic({ state, alias: "Star 8" });
  assert.equal(out.profile.kind, "skill-profile");
  assert.deepEqual(out.roadSeed.priority.length, 4);
  assert.ok(out.teacherSummary.lines[0].startsWith("Star 8"));
  assert.ok(out.teacherSummary.lines.some((l) => /practice next/i.test(l)));
  assert.ok(
    disclaimerOk(out.disclaimer) &&
      disclaimerOk(out.teacherSummary.disclaimer) &&
      disclaimerOk(out.studentView.disclaimer),
  );
  assert.deepEqual(findMissingDisclaimers(out), []);
  assertStudentSafe(out.studentView);
  assert.ok(out.studentView.nextSteps.length > 0);
  assert.ok(
    !/[0-9]/.test(JSON.stringify(out.studentView.nextSteps)),
    "no numbers in the student view",
  );
});

test("negative control: a student view that shows a band, level or program word is refused", () => {
  const { state } = run(DEMO_ITEMS, bestAnswer);
  const view = clone(finishDiagnostic({ state, alias: "Star 8" }).studentView);
  assertStudentSafe(view);
  for (const bad of [
    "You are in the building band.",
    "Your level is strong.",
    "You are an ELL student.",
    "Placement: beginner",
    "You scored 12 out of 20.",
  ]) {
    const v = clone(view);
    v.strengths = [bad];
    assert.throws(() => assertStudentSafe(v), /student view shows/, bad);
  }
});

test("negative control: finishing early and answering nothing are refused", () => {
  const started = startDiagnostic({ gradeBand: "3-5", seed: "d", viewer: "teacher" });
  assert.throws(() => finishDiagnostic({ state: started, alias: "Star 1" }), /not finished/);
  assert.throws(() => answerDiagnosticItem(started, DEMO_ITEMS, null), /no item is waiting/);
  const first = nextDiagnosticItem(started, DEMO_ITEMS);
  assert.throws(() => nextDiagnosticItem(first.state, DEMO_ITEMS), /answer the current item/);
  const { state } = run(DEMO_ITEMS, bestAnswer);
  assert.throws(() => finishDiagnostic({ state, alias: "Maria Lopez" }), /alias/);
  assert.throws(() => startDiagnostic({ gradeBand: "3-5", seed: "" }), /seed/);
  assert.throws(() => startDiagnostic({ gradeBand: "3-5", seed: "s", viewer: "parent" }), /viewer/);
});

test("negative control: draft items never reach a student session", () => {
  const { served, state } = run(DEMO_ITEMS, bestAnswer, { viewer: "student" });
  assert.equal(served.length, 0);
  const out = finishDiagnostic({ state, alias: "Star 2" });
  for (const d of DOMAINS) assert.equal(out.profile.domains[d].band, null);
  assert.ok(out.studentView.strengths.length > 0, "still friendly with no evidence");
});

test("pure: asking for an item does not change the state that was passed in", () => {
  const s0 = startDiagnostic({ gradeBand: "3-5", seed: "p", viewer: "teacher" });
  const before = clone(s0);
  nextDiagnosticItem(s0, DEMO_ITEMS);
  assert.deepEqual(s0, before);
  const a = nextDiagnosticItem(s0, DEMO_ITEMS);
  const b = nextDiagnosticItem(s0, DEMO_ITEMS);
  assert.equal(a.item.id, b.item.id, "deterministic for a seed");
});

test("a skipped item counts as served but does not move the band", () => {
  const { state } = run(DEMO_ITEMS, () => null);
  for (const d of DOMAINS) assert.equal(state.domains[d].band, "building");
});
