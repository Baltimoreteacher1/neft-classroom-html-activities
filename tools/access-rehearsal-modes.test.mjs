#!/usr/bin/env node
// Practice-test modes (views/test.js), rehearsal settings (views/tools.js) and the formative
// breakdown (lang/composite.js). Pins: what each mode allows, that Guided supports never render in
// Independent Rehearsal, that guided work never lands in the independent result, that a mode switch
// restarts, and how outcomes are grouped by Domain, Key Language Use and Language Dimension.
import assert from "node:assert/strict";
import test from "node:test";
import { SCORE_CLAIM } from "./lib/access-studio-rules.mjs";

const values = new Map();
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
};
globalThis.window = { scrollTo() {} };
globalThis.document = { getElementById: () => null, querySelector: () => null };

const { loadTestRecord, saveTestRecord } = await import("../access-practice-lab/src/store.js");
const { toHtml } = await import("../access-practice-lab/src/util.js");
const composite = await import("../access-practice-lab/src/lang/composite.js");
const tools = await import("../access-practice-lab/src/views/tools.js");
const view = await import("../access-practice-lab/src/views/test.js");

const mc = (id, answer, skill) => ({
  id,
  type: "multipleChoice",
  skill,
  prompt: `Question ${id}`,
  options: [
    { id: "a", text: "A" },
    { id: "b", text: "B" },
  ],
  answer,
  correct: "Correct. Because B.",
  hint: "Listen for B.",
  support: "Think about the second choice.",
  listenFor: ["the word B"],
  script: ["The answer is B."],
});
const fixture = {
  id: "modes-fixture",
  title: "Modes fixture",
  band: "6-8",
  sections: [
    {
      domain: "Listening",
      items: [
        mc("l1", "b", "Listening for a reason"),
        mc("l2", "b", "Listening for key vocabulary"),
      ],
    },
    {
      domain: "Writing",
      items: [
        {
          id: "w1",
          type: "constructed",
          skill: "Writing an opinion with reasons",
          prompt: "Write.",
          frames: ["I think ___ because ___."],
          wordBank: ["because", "therefore"],
          writeFor: ["a reason"],
        },
      ],
    },
  ],
};
globalThis.fetch = async () => ({ ok: true, json: async () => fixture });
const ctx = { route: { testId: fixture.id }, prefs: {}, rerender: async () => {}, navigate() {} };
const target = (selector, data = {}) => ({
  closest: (s) => (s === selector ? { dataset: data } : null),
  matches: (s) => s === selector,
  dataset: data,
});
const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve();
};
const click = async (selector, data) => {
  await view.onClick({ target: target(selector, data) }, ctx);
  await settle();
};
async function reset(record = {}, search = "") {
  globalThis.location = { search };
  view.invalidate();
  saveTestRecord(fixture.id, record);
  return toHtml((await view.render(ctx)).html);
}
const page = async () => toHtml((await view.render(ctx)).html);

test("each mode states what it allows, and Independent Rehearsal allows no scaffold", () => {
  const { guided, independent } = view.MODES;
  for (const k of ["frames", "wordBank", "lookback", "rationales", "retry"]) {
    assert.equal(guided[k], true, `guided ${k}`);
    assert.equal(independent[k], false, `independent ${k}`);
  }
  assert.equal(guided.timer, false, "Guided Practice is untimed");
  assert.equal(independent.singlePassAudio, true);
  assert.equal(guided.singlePassAudio, false);
  for (const m of [guided, independent]) assert.ok(m.flagging && m.sectionReview);
  assert.equal(view.modeOf({}), "guided");
  assert.equal(view.modeOf({ conditions: true }), "independent");
});

test("Independent Rehearsal renders no frames, word bank, look-back, transcript or answer check", async () => {
  await reset({ conditions: true, phase: "intro" });
  await click("[data-start]");
  let html = await page();
  assert.match(html, /Independent Rehearsal Mode/, "mode is shown in the header");
  assert.doesNotMatch(html, /data-guided-check|class="lookback"/);
  await click("[data-jump]", { jump: "2" });
  html = await page();
  assert.match(html, /Question 3/);
  assert.doesNotMatch(html, /class="wordbank"|class="frames"|class="lookback"|I think ___/);
});

test("Guided Practice offers look-back supports, an immediate rationale and a retry", async () => {
  await reset({ phase: "intro" });
  await click("[data-start]");
  let html = await page();
  assert.match(html, /Guided Practice Mode/);
  assert.match(html, /data-guided-check/);
  assert.match(html, /class="lookback"/);
  assert.doesNotMatch(html, /What you heard/, "no transcript before the first check");
  const rec = loadTestRecord(fixture.id);
  saveTestRecord(fixture.id, { ...rec, answers: { l1: "a" } });
  await view.render(ctx);
  await click("[data-start]"); // a restored record resumes from its intro
  await click("[data-guided-check]");
  html = await page();
  assert.match(html, /Not yet/);
  assert.match(html, /What you heard/, "transcript is a look-back after answering");
  saveTestRecord(fixture.id, { ...loadTestRecord(fixture.id), answers: { l1: "b" } });
  await view.render(ctx);
  await click("[data-start]");
  await click("[data-guided-check]");
  html = await page();
  assert.match(html, /✓ Correct/);
  assert.match(html, /Because B\./);
  assert.equal(loadTestRecord(fixture.id).guided.l1.first, false, "the first check is kept");
  await click("[data-jump]", { jump: "2" });
  html = await page();
  assert.match(html, /class="wordbank"/);
  assert.match(html, /class="frames"/);
});

test("a guided retry never raises the score: Supported Practice counts the first check", () => {
  const item = fixture.sections[0].items[0];
  const guidedRec = { answers: { l1: "b" }, guided: { l1: { first: false, ok: true, tries: 2 } } };
  assert.equal(view.rightFor(item, guidedRec), false);
  assert.equal(
    view.rightFor(item, { ...guidedRec, conditions: true }),
    true,
    "independent reads only the answer",
  );
  assert.equal(view.rightFor(item, { answers: { l1: "b" } }), true);
});

test("guided work never lands in the Independent Rehearsal result", async () => {
  values.clear();
  await reset({ phase: "intro", answers: {} });
  await click("[data-start]");
  saveTestRecord(fixture.id, {
    ...loadTestRecord(fixture.id),
    answers: { l1: "b", l2: "b", w1: "I think so because." },
  });
  await view.render(ctx);
  await click("[data-submit]");
  let rec = loadTestRecord(fixture.id);
  assert.ok(rec.formative.guided, "guided run saved as Supported Practice");
  assert.equal(rec.formative.independent, undefined);
  let html = await page();
  assert.match(html, /No Independent Rehearsal finished for this test yet/);
  assert.match(html, /Supported Practice/);

  await click("[data-switch-mode]", { switchMode: "independent" });
  rec = loadTestRecord(fixture.id);
  assert.equal(rec.conditions, true);
  assert.deepEqual(rec.answers, {});
  assert.ok(rec.formative.guided, "restart keeps the earlier mode's result");
  await click("[data-start]");
  saveTestRecord(fixture.id, { ...loadTestRecord(fixture.id), answers: { l1: "a" } });
  await view.render(ctx);
  await click("[data-submit]");
  rec = loadTestRecord(fixture.id);
  const ind = composite.formativeBreakdown(rec.formative.independent);
  const sup = composite.formativeBreakdown(rec.formative.guided);
  assert.equal(ind.byDomain.find((r) => r.key === "Listening").right, 0);
  assert.equal(sup.byDomain.find((r) => r.key === "Listening").right, 2);
  html = await page();
  assert.match(html, /Independent Rehearsal/);
  assert.match(html, /Supported Practice/);
  assert.match(html, /never added together/);
  assert.match(html, /Practice this skill next/);
  assert.match(html, /href="\/access-practice-lab\/worlds\/signal-station"/);
  assert.match(html, /Small sample/);
  assert.equal(SCORE_CLAIM.test(html.replace(/<[^>]+>/g, " ")), false);
});

test("switching mode mid-test is a restart, never an in-place change", async () => {
  await reset({ phase: "intro", answers: { l1: "b" }, startedAt: "2026-10-01T00:00:00Z" });
  let html = await page();
  assert.doesNotMatch(html, /data-conditions/, "no live mode radio once a test is under way");
  assert.match(html, /Changing mode restarts the test/);
  view.onChange({ target: { ...target("[data-conditions]"), value: "test" } }, ctx);
  assert.equal(loadTestRecord(fixture.id).conditions, undefined);
  await click("[data-switch-mode]", { switchMode: "independent" });
  const rec = loadTestRecord(fixture.id);
  assert.equal(rec.conditions, true);
  assert.deepEqual(rec.answers, {});
  assert.equal(rec.startedAt, undefined);
});

test("a mode link preselects the mode only for a test that has not started", async () => {
  await reset({}, "?rehearsal=independent");
  assert.equal(loadTestRecord(fixture.id).conditions, true);
  const html = await reset({ answers: { l1: "a" }, startedAt: "x" }, "?rehearsal=independent");
  assert.notEqual(
    loadTestRecord(fixture.id).conditions,
    true,
    "an in-progress test is not changed",
  );
  assert.match(html, /Restart in Independent Rehearsal Mode/);
  globalThis.location = { search: "" };
});

test("choosing Guided Practice turns the practice timer and replay setting off", async () => {
  await reset({ conditions: true, timer: true, replay: true });
  view.onChange({ target: { ...target("[data-conditions]"), value: "learning" } }, ctx);
  const rec = loadTestRecord(fixture.id);
  assert.equal(rec.conditions, false);
  assert.equal(rec.timer, false);
  assert.equal(rec.replay, false);
  assert.doesNotMatch(await page(), /data-timer/, "Guided Practice offers no timer");
});

test("the review screen groups questions by section before submit", async () => {
  await reset({ phase: "review", flags: ["l2"] });
  const html = await page();
  assert.match(html, /Review each section before you submit/);
  assert.equal((html.match(/class="review-section"/g) || []).length, 2);
  assert.match(html, /1 flagged/);
});

test("Key Language Use and language dimension tags come from the skill name", () => {
  const k = (skill) => composite.keyLanguageUse({ skill });
  assert.equal(k("Giving an opinion with reasons"), "Argue");
  assert.equal(k("Recommending with reasons"), "Argue");
  assert.equal(k("Narrating a picture story"), "Narrate");
  assert.equal(k("Sequencing events you hear"), "Narrate");
  assert.equal(k("Explaining a process"), "Explain");
  assert.equal(k("Identifying cause and effect"), "Explain");
  assert.equal(k("Identifying the main idea"), "Inform");
  const d = (skill) => composite.languageDimension({ skill });
  assert.equal(d("Using context clues"), "Word/Phrase");
  assert.equal(d("Listening for key vocabulary"), "Word/Phrase");
  assert.equal(d("Using past-tense verbs"), "Sentence");
  assert.equal(d("Identifying the central idea"), "Discourse");
});

test("the breakdown groups outcomes three ways, never into one number", () => {
  const o = (domain, keyUse, dimension, right, scored = true, done = true) => ({
    domain,
    keyUse,
    dimension,
    scored,
    right,
    done,
  });
  const b = composite.formativeBreakdown({
    mode: "independent",
    outcomes: [
      o("Listening", "Inform", "Discourse", true),
      o("Listening", "Explain", "Word/Phrase", false),
      o("Reading", "Inform", "Discourse", true),
      o("Writing", "Argue", null, false, false, true),
      o("Speaking", "Narrate", null, false, false, false),
    ],
    ratings: {
      Writing: { lc: "building", vu: "strong", lctl: "early", by: "teacher" },
      Speaking: { lc: "strong", vu: "strong", lctl: "strong" },
    },
  });
  const row = (rows, key) => rows.find((r) => r.key === key);
  assert.deepEqual(
    [row(b.byDomain, "Listening").right, row(b.byDomain, "Listening").scored],
    [1, 2],
  );
  assert.deepEqual([row(b.byDomain, "Writing").open, row(b.byDomain, "Writing").openDone], [1, 1]);
  assert.deepEqual([row(b.byKeyUse, "Inform").right, row(b.byKeyUse, "Inform").scored], [2, 2]);
  assert.equal(row(b.byKeyUse, "Argue").open, 1);
  assert.equal(row(b.byDimension, "Discourse").scored, 2);
  assert.deepEqual(row(b.byDimension, "Sentence").ratings, [
    { domain: "Writing", band: "early", by: "teacher" },
  ]);
  assert.ok(
    !b.byDimension.some((r) => r.ratings.some((x) => x.domain === "Speaking")),
    "an unfinished response's rating is not evidence",
  );
  assert.equal(row(b.byDomain, "Listening").small, true);
  assert.equal(b.small, true);
  assert.equal(row(b.byDomain, "Narrate"), undefined);
  for (const key of ["value", "overall", "percent", "level", "score"])
    assert.equal(key in b, false, key);
  assert.doesNotMatch(JSON.stringify(b), /\blevel\b|scale/i);
});

test("rehearsal settings persist locally, fall back safely, and say they are not official", () => {
  values.clear();
  assert.deepEqual(tools.rehearsalPrefs(), {
    contrast: false,
    magnify: false,
    reader: false,
    scratch: false,
  });
  tools.setRehearsalPref("contrast", true);
  tools.setRehearsalPref("not-a-tool", true);
  assert.equal(tools.rehearsalPrefs().contrast, true);
  assert.equal("not-a-tool" in tools.rehearsalPrefs(), false);
  assert.match(tools.rehearsalClasses(), /rh-contrast/);
  values.set("accessPracticeLab:v1:rehearsal", "{not json");
  assert.equal(tools.rehearsalPrefs().contrast, false, "corrupt storage reads as all off");
  const full = toHtml(tools.rehearsalToolbarHTML());
  assert.match(full, /EduWonderLab rehearsal settings/);
  assert.match(
    full,
    /official test has its own accommodation settings that this rehearsal does not copy/,
  );
  assert.match(
    toHtml(tools.rehearsalToolbarHTML({ compact: true })),
    /not the official WIDA ACCESS accommodations/,
  );
  for (const id of ["contrast", "magnify", "reader", "scratch"])
    assert.match(full, new RegExp(`data-rh-toggle="${id}"`));
  values.clear();
});
