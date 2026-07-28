#!/usr/bin/env node
/**
 * award-portfolio.test.mjs — unit tests for the shared award-portfolio runtime.
 *
 * Plain node assertions, run by `npm run test` (tools/run-tests.mjs). The
 * browser modules are IIFEs that attach to a global, so each one is loaded into
 * a jsdom window and exercised against a real localStorage.
 *
 * Covers the invariants that are easy to break silently:
 *   - evidence normalization and the versioned migration
 *   - storage isolation between synthetic mode and real data
 *   - the Number Realm adapter's read-only behaviour and idempotence
 *   - the support profile's seeding, migration, and banned-field ban
 *   - the instructional-need classifier's nine outcomes
 *   - the scaffold ladder's "same target at every rung" rule
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(resolve(ROOT, rel), "utf8");

let passed = 0;
function it(name, fn) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

/* The evidence layer's sync() is a Promise (the Thinking Trails adapter reads
 * IndexedDB), so anything exercising it needs an awaited variant. */
async function itAsync(name, fn) {
  await fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

/** A fresh jsdom window with the requested modules evaluated in order. */
function makeWindow(modules, { storage = {} } = {}) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "https://example.test/",
    runScripts: "outside-only",
  });
  const { window } = dom;
  for (const [key, value] of Object.entries(storage)) {
    window.localStorage.setItem(key, value);
  }
  for (const rel of modules) {
    window.eval(src(rel));
  }
  return window;
}

const EVIDENCE = "shared/evidence/learning-evidence.js";
const ADAPTER = "shared/evidence/adapters/number-realm-adapter.js";
const PROFILE = "shared/support/support-profile.js";
const NEED = "shared/evidence/instructional-need.js";
const SYNTHETIC = "shared/portfolio/synthetic-data.js";

console.log("\nlearning evidence");

it("drops an event with an unknown type instead of throwing", () => {
  const w = makeWindow([EVIDENCE]);
  assert.equal(w.EWLEvidence.record({ eventType: "not_a_real_type" }), null);
  assert.equal(w.EWLEvidence.record(null), null);
  assert.equal(w.EWLEvidence.all().length, 0);
});

it("normalizes a sparse event and fills only what it can", () => {
  const w = makeWindow([EVIDENCE]);
  const event = w.EWLEvidence.record({ eventType: "activity_completed" });
  assert.equal(event.eventType, "activity_completed");
  assert.equal(event.v, 1);
  // Unknown facts stay null rather than being invented.
  assert.equal(event.score, null);
  assert.equal(event.masteryLevel, null);
  assert.equal(event.standardIds.length, 0);
  assert.ok(event.timestamp);
  assert.ok(event.learnerId);
});

it("accepts a single standard as a string or an array", () => {
  const w = makeWindow([EVIDENCE]);
  const a = w.EWLEvidence.record({ eventType: "item_attempted", standard: "6.AT.3" });
  const b = w.EWLEvidence.record({ eventType: "item_attempted", standardIds: ["6.AT.3", "6.AT.1"] });
  assert.deepEqual([...a.standardIds], ["6.AT.3"]);
  assert.deepEqual([...b.standardIds], ["6.AT.3", "6.AT.1"]);
});

it("rejects an out-of-vocabulary mastery level rather than storing it", () => {
  const w = makeWindow([EVIDENCE]);
  const event = w.EWLEvidence.record({ eventType: "mastery_updated", masteryLevel: "wizard" });
  assert.equal(event.masteryLevel, null);
});

it("is idempotent on eventId", () => {
  const w = makeWindow([EVIDENCE]);
  w.EWLEvidence.record({ eventId: "fixed", eventType: "activity_completed" });
  w.EWLEvidence.record({ eventId: "fixed", eventType: "activity_completed" });
  assert.equal(w.EWLEvidence.all().length, 1);
});

it("derives a pseudonymous learner id and never stores the raw name", () => {
  const w = makeWindow([EVIDENCE], {
    storage: { "nsr:identity": JSON.stringify({ name: "Alex Rivera", section: "6B" }) },
  });
  const id = w.EWLEvidence.learnerId();
  assert.ok(id.startsWith("id:"), `expected a hashed id, got ${id}`);
  assert.ok(!id.includes("Alex"));
  assert.ok(!id.includes("Rivera"));
  assert.equal(w.EWLEvidence.classId(), "6B");
});

it("prefers the resume code, which is already a pseudonym", () => {
  const w = makeWindow([EVIDENCE], {
    storage: { "nsr:identity": JSON.stringify({ name: "Alex", code: "math-7kq2" }) },
  });
  assert.equal(w.EWLEvidence.learnerId(), "code:MATH-7KQ2");
});

it("migrates a bare legacy array into the versioned envelope", () => {
  const legacy = JSON.stringify([
    { eventType: "activity_completed", eventId: "old-1", timestamp: "2026-01-01T00:00:00.000Z" },
  ]);
  const w = makeWindow([EVIDENCE], { storage: { "ewl:evidence:v1": legacy } });
  const all = w.EWLEvidence.all();
  assert.equal(all.length, 1);
  assert.equal(all[0].eventId, "old-1");
  assert.equal(all[0].v, 1);
});

it("refuses to downgrade a record written by a future schema version", () => {
  const future = JSON.stringify({ v: 99, events: [{ eventType: "activity_completed" }] });
  const w = makeWindow([EVIDENCE], { storage: { "ewl:evidence:v1": future } });
  assert.equal(w.EWLEvidence.all().length, 0);
  // and the untouched future record is still on disk
  assert.equal(JSON.parse(w.localStorage.getItem("ewl:evidence:v1")).v, 99);
});

it("aggregates a summary without inventing a percent from nothing", () => {
  const w = makeWindow([EVIDENCE]);
  w.EWLEvidence.record({ eventType: "activity_completed", completionStatus: "completed" });
  const empty = w.EWLEvidence.summary();
  assert.equal(empty.percent, null);
  assert.equal(empty.completed, 1);

  w.EWLEvidence.record({ eventType: "assessment_scored", score: 4, maxScore: 5 });
  assert.equal(w.EWLEvidence.summary().percent, 80);
});

console.log("\nsynthetic isolation");

it("synthetic mode neither reads nor writes real storage", () => {
  const w = makeWindow([EVIDENCE, SYNTHETIC]);
  w.EWLEvidence.record({ eventType: "activity_completed", activityId: "real-work" });
  const realBefore = w.localStorage.getItem("ewl:evidence:v1");
  assert.ok(realBefore.includes("real-work"));

  w.EWLEvidence.useSynthetic(w.EWLSyntheticData.dataset("number-realm"));
  assert.equal(w.EWLEvidence.isSynthetic(), true);

  // The real event is invisible while synthetic mode is on.
  assert.equal(w.EWLEvidence.all({ activityId: "real-work" }).length, 0);
  assert.ok(w.EWLEvidence.all().length > 0);
  assert.ok(w.EWLEvidence.all().every((e) => e.synthetic === true));

  w.EWLEvidence.record({ eventType: "activity_completed", activityId: "demo-only" });
  // Nothing written during the demo reached localStorage.
  assert.equal(w.localStorage.getItem("ewl:evidence:v1"), realBefore);

  w.EWLEvidence.clearSynthetic();
  assert.equal(w.EWLEvidence.isSynthetic(), false);
  assert.equal(w.EWLEvidence.all({ activityId: "real-work" }).length, 1);
  assert.equal(w.EWLEvidence.all({ activityId: "demo-only" }).length, 0);
});

it("every synthetic learner id is namespaced to the demo", () => {
  const w = makeWindow([EVIDENCE, SYNTHETIC]);
  const data = w.EWLSyntheticData.all();
  assert.ok(data.events.length > 0);
  for (const event of data.events) {
    assert.ok(
      event.learnerId.startsWith("demo:"),
      `synthetic learner id must start with demo: — got ${event.learnerId}`,
    );
    assert.equal(event.synthetic, true);
  }
});

it("the synthetic dataset is byte-identical across loads", () => {
  const a = makeWindow([EVIDENCE, SYNTHETIC]).EWLSyntheticData.all();
  const b = makeWindow([EVIDENCE, SYNTHETIC]).EWLSyntheticData.all();
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});

console.log("\nnumber realm adapter");

const HERO = JSON.stringify({
  v: 2,
  name: "Demo Hero",
  mastery: { "6.AT.A.1": { correct: 6, total: 7 }, "6.NOS.B.4": { correct: 2, total: 6 } },
  achievements: { "first-blood": true, "not-earned": false },
  stats: { hintsUsed: 3, problemsSolved: 21 },
});

it("normalizes cluster-qualified standards to canonical codes", () => {
  const w = makeWindow([EVIDENCE, ADAPTER]);
  assert.equal(w.EWLNumberRealmAdapter.canonicalStandard("6.AT.A.1"), "6.AT.1");
  assert.equal(w.EWLNumberRealmAdapter.canonicalStandard("6.NOS.B.4"), "6.NOS.4");
  // Already-canonical codes pass through untouched.
  assert.equal(w.EWLNumberRealmAdapter.canonicalStandard("6.GR.2"), "6.GR.2");
});

it("mirrors Number Realm's own mastery tier rule", () => {
  const w = makeWindow([EVIDENCE, ADAPTER]);
  const tier = w.EWLNumberRealmAdapter.tierFor;
  assert.equal(tier({ correct: 5, total: 5 }), "master");
  assert.equal(tier({ correct: 4, total: 5 }), "master"); // 80% at 5 attempts is the threshold
  assert.equal(tier({ correct: 3, total: 5 }), "apprentice");
  assert.equal(tier({ correct: 1, total: 5 }), "novice");
  assert.equal(tier({ correct: 0, total: 0 }), null);
  // total < 5 cannot reach master no matter how accurate.
  assert.equal(tier({ correct: 3, total: 3 }), "apprentice");
});

it("produces nothing for a learner who has never played", () => {
  const w = makeWindow([EVIDENCE, ADAPTER]);
  assert.equal(w.EWLNumberRealmAdapter.collect().length, 0);
});

it("normalizes a hero profile without modifying it", () => {
  const w = makeWindow([EVIDENCE, ADAPTER], {
    storage: { "mrpg:hero": HERO, "mrpg:unit3": JSON.stringify({ cleared: { u3c1: true }, done: true }) },
  });
  const events = w.EWLNumberRealmAdapter.collect();
  const types = events.map((e) => e.eventType);
  assert.ok(types.includes("mastery_updated"));
  assert.ok(types.includes("hint_requested"));
  assert.ok(types.includes("badge_earned"));
  assert.ok(types.includes("activity_completed"));

  // An un-earned achievement is not reported.
  assert.equal(types.filter((t) => t === "badge_earned").length, 1);

  const mastery = events.find((e) => e.standardIds && e.standardIds[0] === "6.AT.1");
  assert.equal(mastery.score, 6);
  assert.equal(mastery.maxScore, 7);
  assert.equal(mastery.masteryLevel, "proficient");

  // The source store is untouched — this is the whole contract of the adapter.
  assert.equal(w.localStorage.getItem("mrpg:hero"), HERO);
});

await itAsync("is idempotent: syncing twice does not duplicate events", async () => {
  const w = makeWindow([EVIDENCE, ADAPTER], { storage: { "mrpg:hero": HERO } });
  const first = (await w.EWLEvidence.sync()).length;
  const second = (await w.EWLEvidence.sync()).length;
  assert.ok(first > 0);
  assert.equal(second, 0, "a second sync with unchanged data must record nothing new");
});

await itAsync("records a new event when real progress happens", async () => {
  const w = makeWindow([EVIDENCE, ADAPTER], { storage: { "mrpg:hero": HERO } });
  await w.EWLEvidence.sync();
  const before = w.EWLEvidence.all().length;
  w.localStorage.setItem(
    "mrpg:hero",
    JSON.stringify({ ...JSON.parse(HERO), mastery: { "6.AT.A.1": { correct: 7, total: 8 } } }),
  );
  await w.EWLEvidence.sync();
  assert.ok(w.EWLEvidence.all().length > before);
});

console.log("\nportfolio adapter");

const PORTFOLIO = "shared/evidence/adapters/portfolio-adapter.js";
const ASSESSMENT = "shared/evidence/adapters/assessment-adapter.js";
const TRAILS = "shared/evidence/adapters/thinking-trails-adapter.js";

const COMPLETIONS = JSON.stringify({
  "/math/unit-3/projects/version-a/": {
    unit: 3,
    version: "a",
    title: "Ratio City Build",
    completedAt: "2026-05-04T13:15:00.000Z",
    stars: 3,
    rubricTotal: 17,
    rubricMax: 20,
    level: 1,
  },
});

it("normalizes a project completion without inventing a standard", () => {
  const w = makeWindow([EVIDENCE, PORTFOLIO], {
    storage: { "nt-project-complete:v1": COMPLETIONS },
  });
  const events = w.EWLPortfolioAdapter.collect();
  const submit = events.find((e) => e.eventType === "project_submitted");
  assert.ok(submit);
  assert.equal(submit.score, 17);
  assert.equal(submit.maxScore, 20);
  assert.equal(submit.unitId, "unit-3");
  assert.equal(submit.portfolioRef, "/math/unit-3/projects/version-a/");
  // A completion record names a unit and a project, never a standard. Claiming
  // one would manufacture per-standard evidence the student did not generate.
  assert.equal(submit.standardIds, undefined);
  assert.ok(events.some((e) => e.eventType === "portfolio_saved"));
});

it("reports an unscored project as unknown rather than zero", () => {
  const noRubric = JSON.stringify({
    "/math/unit-5/projects/version-a/": {
      unit: 5,
      completedAt: "2026-05-05T00:00:00.000Z",
      rubricTotal: null,
      rubricMax: null,
    },
  });
  const w = makeWindow([EVIDENCE, PORTFOLIO], {
    storage: { "nt-project-complete:v1": noRubric },
  });
  const submit = w.EWLPortfolioAdapter.collect().find((e) => e.eventType === "project_submitted");
  assert.equal(submit.score, null);
  assert.equal(submit.maxScore, null);
});

it("carries a reflection across as a written explanation", () => {
  const w = makeWindow([EVIDENCE, PORTFOLIO], {
    storage: {
      "nt-project-complete:v1": COMPLETIONS,
      "nt-project-reflect:/math/unit-3/projects/version-a/":
        "I shortened the wall because my first plan was over budget.",
    },
  });
  const explain = w.EWLPortfolioAdapter.collect().find(
    (e) => e.eventType === "explanation_written",
  );
  assert.ok(explain);
  assert.match(explain.writtenExplanation, /over budget/);
});

it("reports a re-completion as a revision", () => {
  const revised = JSON.stringify({
    "/math/unit-3/projects/version-a/": {
      unit: 3,
      completedAt: "2026-05-06T00:00:00.000Z",
      firstCompletedAt: "2026-05-04T00:00:00.000Z",
      rubricTotal: 19,
      rubricMax: 20,
    },
  });
  const w = makeWindow([EVIDENCE, PORTFOLIO], {
    storage: { "nt-project-complete:v1": revised },
  });
  const events = w.EWLPortfolioAdapter.collect();
  const revision = events.find((e) => e.eventType === "project_checkpoint");
  assert.ok(revision);
  assert.equal(revision.answerRevisions, 1);
});

it("produces nothing when no project has been completed", () => {
  const w = makeWindow([EVIDENCE, PORTFOLIO]);
  assert.equal(w.EWLPortfolioAdapter.collect().length, 0);
});

console.log("\nassessment adapter");

const RESULTS_LOG = JSON.stringify([
  {
    "Student Name": "Alex Rivera",
    Class: "6B",
    Assessment: "Unit 3 Review",
    Score: 4,
    Percent: 80,
    Standard: "6.AT.3",
    Skill: "Vocabulary",
    "Question/Item": "5 items",
    Date: "2026-05-04",
    "ESOL Level": "3",
    "IEP/504": "Yes",
    Teacher: "Mr. Neft",
  },
  {
    "Student Name": "Alex Rivera",
    Class: "6B",
    Assessment: "Unit 3 Review",
    Score: 16,
    Percent: 80,
    Standard: "6.AT.3",
    Skill: "Overall",
    "Question/Item": "20 items",
    Date: "2026-05-04",
    "ESOL Level": "3",
    "IEP/504": "Yes",
    Teacher: "Mr. Neft",
  },
]);

it("records one event per assessment, not one per section", () => {
  const w = makeWindow([EVIDENCE, ASSESSMENT], { storage: { nt_results_log: RESULTS_LOG } });
  const events = w.EWLAssessmentAdapter.collect();
  // Two rows in, one event out — the section row would double-count the total.
  assert.equal(events.length, 1);
  assert.equal(events[0].eventType, "assessment_scored");
  assert.equal(events[0].score, 16);
  assert.equal(events[0].maxScore, 20);
  assert.deepEqual([...events[0].standardIds], ["6.AT.3"]);
});

it("never copies the student name or any sensitive column into evidence", () => {
  const w = makeWindow([EVIDENCE, ASSESSMENT], { storage: { nt_results_log: RESULTS_LOG } });
  w.EWLAssessmentAdapter.collect().forEach((event) => {
    const serialized = JSON.stringify(event);
    assert.ok(!serialized.includes("Alex"), "student first name leaked into an evidence event");
    assert.ok(!serialized.includes("Rivera"), "student surname leaked into an evidence event");
    assert.ok(!serialized.includes("Mr. Neft"), "teacher name leaked into an evidence event");
    // The ESOL level and IEP/504 marker must never leave the results log.
    assert.ok(!/"(ESOL|IEP)/.test(serialized));
  });
});

it("parses the item count and tolerates a malformed one", () => {
  const w = makeWindow([EVIDENCE, ASSESSMENT]);
  assert.equal(w.EWLAssessmentAdapter.itemCount("20 items"), 20);
  assert.equal(w.EWLAssessmentAdapter.itemCount("1 item"), 1);
  assert.equal(w.EWLAssessmentAdapter.itemCount("lots"), null);
  assert.equal(w.EWLAssessmentAdapter.itemCount(undefined), null);
});

it("ignores a log that is not an array", () => {
  const w = makeWindow([EVIDENCE, ASSESSMENT], { storage: { nt_results_log: '{"not":"an array"}' } });
  assert.equal(w.EWLAssessmentAdapter.collect().length, 0);
});

console.log("\nthinking trails adapter");

const SESSION = {
  sessionId: "s-1",
  studentNameOrCode: "Alex Rivera",
  lessonId: "3-2",
  activityId: "ratio-tables",
  standard: "6.AT.3",
  languageSupport: "es",
  startedAt: "2026-05-04T13:00:00.000Z",
  endedAt: "2026-05-04T13:20:00.000Z",
  attempts: [
    {
      problemId: "p1",
      prompt: "What is the missing value?",
      studentAnswer: "9",
      correctAnswer: "12",
      result: "incorrect",
      hintUsed: true,
      attempts: 1,
      explanation: "",
      misconceptionTag: "ratio-table-additive",
      timestamp: "2026-05-04T13:05:00.000Z",
    },
    {
      problemId: "p2",
      prompt: "Explain your reasoning.",
      studentAnswer: "12",
      correctAnswer: "12",
      result: "correct",
      hintUsed: false,
      attempts: 2,
      explanation: "I multiplied both numbers by three.",
      misconceptionTag: "",
      timestamp: "2026-05-04T13:10:00.000Z",
    },
  ],
};

it("turns attempts into per-item, hint, and explanation evidence", () => {
  const w = makeWindow([EVIDENCE, TRAILS]);
  const events = w.EWLThinkingTrailsAdapter.eventsForSession(SESSION);
  const types = events.map((e) => e.eventType);
  assert.equal(types.filter((t) => t === "item_attempted").length, 2);
  assert.equal(types.filter((t) => t === "hint_requested").length, 1);
  assert.equal(types.filter((t) => t === "explanation_written").length, 1);

  const wrong = events.find((e) => e.eventType === "item_attempted");
  assert.equal(wrong.score, 0);
  assert.equal(wrong.maxScore, 1);
  assert.deepEqual([...wrong.misconceptionCodes], ["ratio-table-additive"]);
  assert.equal(wrong.lessonId, "lesson-3-2");
  assert.equal(wrong.languageSetting, "es");
});

it("rolls a finished session up into one completion event", () => {
  const w = makeWindow([EVIDENCE, TRAILS]);
  const done = w.EWLThinkingTrailsAdapter.eventsForSession(SESSION).find(
    (e) => e.eventType === "activity_completed",
  );
  assert.ok(done);
  assert.equal(done.score, 1);
  assert.equal(done.maxScore, 2);
  assert.equal(done.hintCount, 1);
});

it("leaves the student name and the item content behind", () => {
  const w = makeWindow([EVIDENCE, TRAILS]);
  const serialized = JSON.stringify(w.EWLThinkingTrailsAdapter.eventsForSession(SESSION));
  assert.ok(!serialized.includes("Alex"), "student name leaked out of Thinking Trails");
  assert.ok(!serialized.includes("Rivera"));
  // Item content is the question bank, not evidence about the learner.
  assert.ok(!serialized.includes("What is the missing value?"));
  assert.ok(!serialized.includes("correctAnswer"));
  // The student's own reasoning is the one free-text field that does cross.
  assert.ok(serialized.includes("I multiplied both numbers by three."));
});

it("emits nothing for a session with no attempts", () => {
  const w = makeWindow([EVIDENCE, TRAILS]);
  const empty = w.EWLThinkingTrailsAdapter.eventsForSession({ sessionId: "s-0", attempts: [] });
  assert.equal(empty.length, 0);
});

it("prefers whichever store holds the fuller copy of a session", () => {
  const w = makeWindow([EVIDENCE, TRAILS]);
  const thin = { sessionId: "s-1", attempts: [{ result: "correct" }] };
  const merged = w.EWLThinkingTrailsAdapter.mergeSessions([thin], [SESSION]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].attempts.length, 2);
});

await itAsync("resolves to an array even with no IndexedDB available", async () => {
  const w = makeWindow([EVIDENCE, TRAILS]);
  const events = await w.EWLThinkingTrailsAdapter.collect();
  assert.ok(Array.isArray(events));
});

console.log("\nadapter composition");

await itAsync("one broken adapter does not stop the others", async () => {
  const w = makeWindow([EVIDENCE, PORTFOLIO], {
    storage: { "nt-project-complete:v1": COMPLETIONS },
  });
  w.EWLEvidence.registerAdapter("explodes", () => {
    throw new Error("boom");
  });
  w.EWLEvidence.registerAdapter("rejects", () => Promise.reject(new Error("nope")));
  const recorded = await w.EWLEvidence.sync();
  assert.ok(recorded.length > 0, "the healthy adapter still recorded");
});

await itAsync("sync() is always a Promise, even with only sync adapters", async () => {
  const w = makeWindow([EVIDENCE, PORTFOLIO], {
    storage: { "nt-project-complete:v1": COMPLETIONS },
  });
  const result = w.EWLEvidence.sync();
  assert.equal(typeof result.then, "function");
  assert.ok(Array.isArray(await result));
});

console.log("\nsupport profile");

it("defaults to no supports on", () => {
  const w = makeWindow([PROFILE]);
  assert.equal(w.EWLSupportProfile.isDefault(), true);
  const profile = w.EWLSupportProfile.get();
  assert.equal(profile.readAloud, false);
  assert.equal(profile.sentenceSupportTier, 0);
  assert.equal(profile.interfaceLanguage, "en");
});

it("seeds from the existing in-lesson supports store without deleting it", () => {
  const legacy = JSON.stringify({
    profiles: { tts: true, frames: true, translate: true },
    language: "es",
    highContrast: true,
    textScale: 1.2,
  });
  const w = makeWindow([PROFILE], { storage: { "ewl-supports:v1:preferences": legacy } });
  const profile = w.EWLSupportProfile.get();
  assert.equal(profile.readAloud, true);
  assert.equal(profile.writingSupport, true);
  assert.equal(profile.sentenceSupportTier, 2);
  assert.equal(profile.translatedDirections, true);
  assert.equal(profile.interfaceLanguage, "es");
  assert.equal(profile.highContrast, true);
  assert.equal(profile.largerText, true);
  // The lesson layer's own store is left exactly as it was.
  assert.equal(w.localStorage.getItem("ewl-supports:v1:preferences"), legacy);
});

it("seeds the home language from Math Workbench when nothing else is set", () => {
  const w = makeWindow([PROFILE], { storage: { mw_lang: "es" } });
  const profile = w.EWLSupportProfile.get();
  assert.equal(profile.interfaceLanguage, "es");
  assert.equal(profile.homeLanguageSupport, "es");
});

it("persists a patch and reflects passive supports onto the document", () => {
  const w = makeWindow([PROFILE]);
  w.EWLSupportProfile.set({ largerText: true, readAloud: true, sentenceSupportTier: 3 });
  const root = w.document.documentElement;
  assert.equal(root.getAttribute("data-ewl-larger-text"), "on");
  assert.equal(root.getAttribute("data-ewl-read-aloud"), "on");
  // Non-passive fields do not become attributes.
  assert.equal(root.getAttribute("data-ewl-sentence-support-tier"), null);

  w.EWLSupportProfile.set({ largerText: false });
  assert.equal(root.getAttribute("data-ewl-larger-text"), null);
});

it("coerces a bad value instead of storing it", () => {
  const w = makeWindow([PROFILE]);
  const profile = w.EWLSupportProfile.set({ sentenceSupportTier: "banana", readAloud: "yes" });
  assert.equal(profile.sentenceSupportTier, 0);
  assert.equal(profile.readAloud, true);
});

it("stores no diagnosis, IEP, or disability field", () => {
  const w = makeWindow([PROFILE]);
  const banned = w.EWLSupportProfile.BANNED_FIELDS;
  const fields = Object.keys(w.EWLSupportProfile.FIELDS).map((f) => f.toLowerCase());
  for (const field of fields) {
    for (const token of banned) {
      assert.ok(
        !field.includes(token.toLowerCase()),
        `support profile field "${field}" contains banned token "${token}"`,
      );
    }
  }
  // And an attempt to set one is simply ignored.
  const profile = w.EWLSupportProfile.set({ diagnosis: "anything" });
  assert.equal(profile.diagnosis, undefined);
});

it("exposes only non-sensitive fields to the evidence layer", () => {
  const w = makeWindow([PROFILE]);
  w.EWLSupportProfile.set({ sentenceSupportTier: 2, interfaceLanguage: "es", readAloud: true });
  const snapshot = w.EWLSupportProfile.evidenceSnapshot();
  assert.deepEqual([...Object.keys(snapshot).sort()], [
    "languageSetting",
    "readAloudUsed",
    "supportLevel",
    "vocabularySupportUsed",
  ]);
  assert.equal(snapshot.supportLevel, "tier-2");
});

console.log("\ninstructional need");

function classify(events, opts = {}) {
  const w = makeWindow([EVIDENCE, NEED]);
  return w.EWLInstructionalNeed.classify({ standardId: "6.AT.3", events, ...opts });
}

const base = (extra) => ({
  standardIds: ["6.AT.3"],
  eventType: "assessment_scored",
  timestamp: "2026-05-01T00:00:00.000Z",
  misconceptionCodes: [],
  ...extra,
});

it("declines to classify when there is almost no evidence", () => {
  const result = classify([base({ score: 1, maxScore: 2 })]);
  assert.equal(result.need, "insufficient-evidence");
  assert.equal(result.confidence, "low");
});

it("names a prerequisite gap ahead of the current standard", () => {
  const result = classify(
    [
      base({ score: 2, maxScore: 5 }),
      base({ score: 2, maxScore: 5 }),
      base({ standardIds: ["6.AT.1"], score: 1, maxScore: 5 }),
      base({ standardIds: ["6.AT.1"], score: 1, maxScore: 5 }),
    ],
    { prerequisiteStandards: ["6.AT.1"] },
  );
  assert.equal(result.need, "prerequisite-gap");
  assert.match(result.studentReason, /6\.AT\.1/);
  assert.match(result.teacherReason, /Reteach the prerequisite/);
});

it("names low confidence despite correct work", () => {
  const result = classify([
    base({ score: 5, maxScore: 5, confidenceBefore: 2 }),
    base({ score: 4, maxScore: 5 }),
  ]);
  assert.equal(result.need, "low-confidence-correct");
  assert.match(result.studentReason, /you know more than you think/i);
  assert.match(result.teacherGuidance, /own correct work/);
});

it("names high confidence despite incorrect work", () => {
  const result = classify([
    base({ score: 1, maxScore: 5, confidenceBefore: 5 }),
    base({ score: 1, maxScore: 5 }),
  ]);
  assert.equal(result.need, "high-confidence-incorrect");
  assert.match(result.teacherGuidance, /counter-example/);
});

it("names a vocabulary barrier when language support clusters on misses", () => {
  const result = classify([
    base({ score: 2, maxScore: 5, vocabularySupportUsed: true }),
    base({ score: 2, maxScore: 5, vocabularySupportUsed: true }),
  ]);
  assert.equal(result.need, "vocabulary-barrier");
});

it("names representation difficulty from the misconception codes", () => {
  const result = classify([
    base({ score: 2, maxScore: 5, misconceptionCodes: ["ratio-table-additive"] }),
    base({ score: 3, maxScore: 5 }),
  ]);
  assert.equal(result.need, "representation-difficulty");
});

it("names a calculation error from unhinted late corrections", () => {
  const result = classify([
    base({ eventType: "item_attempted", score: 1, maxScore: 1, attemptCount: 2, hintCount: 0 }),
    base({ score: 6, maxScore: 9, hintCount: 0 }),
  ]);
  assert.equal(result.need, "calculation-error");
});

it("names explanation difficulty when the work is right and the writing is thin", () => {
  const result = classify([
    base({ score: 5, maxScore: 5, writtenExplanation: "i did it" }),
    base({ score: 5, maxScore: 5 }),
  ]);
  assert.equal(result.need, "explanation-difficulty");
});

it("names enrichment readiness for accurate, unsupported, confident work", () => {
  const result = classify([
    base({ score: 5, maxScore: 5, confidenceBefore: 5 }),
    base({ score: 5, maxScore: 5 }),
  ]);
  assert.equal(result.need, "enrichment-ready");
});

it("falls back to a current-lesson gap", () => {
  const result = classify([base({ score: 2, maxScore: 5 }), base({ score: 2, maxScore: 5 })]);
  assert.equal(result.need, "current-lesson-gap");
  assert.match(result.studentReason, /missed 6 questions/);
});

it("every need carries a student reason, a teacher reason, and its signals", () => {
  const w = makeWindow([EVIDENCE, NEED]);
  const result = w.EWLInstructionalNeed.classify({
    standardId: "6.AT.3",
    events: [base({ score: 2, maxScore: 5 }), base({ score: 2, maxScore: 5 })],
  });
  assert.ok(result.studentReason.length > 20);
  assert.ok(result.teacherReason.length > 20);
  assert.equal(typeof result.signals.accuracy, "number");
  assert.equal(result.rulesVersion, 1);
  // The reason must be derivable from the reported signals — no hidden inputs.
  assert.equal(result.signals.correct, 4);
  assert.equal(result.signals.possible, 10);
});

it("closes the loop by comparing evidence before and after a recommendation", () => {
  const w = makeWindow([EVIDENCE, NEED]);
  const events = [
    base({ score: 2, maxScore: 5, timestamp: "2026-05-01T00:00:00.000Z" }),
    base({ score: 5, maxScore: 5, timestamp: "2026-05-10T00:00:00.000Z" }),
  ];
  const outcome = w.EWLInstructionalNeed.interventionResult({
    standardId: "6.AT.3",
    events,
    since: "2026-05-05T00:00:00.000Z",
  });
  assert.equal(outcome.result, "improved");

  const noFollowup = w.EWLInstructionalNeed.interventionResult({
    standardId: "6.AT.3",
    events: [events[0]],
    since: "2026-05-05T00:00:00.000Z",
  });
  assert.equal(noFollowup.result, "no-followup");
});

console.log("\nscaffold ladder");

it("shows the identical prompt at every rung", () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
       <div data-ewl-scaffold
            data-prompt="Explain why 4:6 and 6:9 are equivalent ratios."
            data-target="I can explain equivalent ratios using multiplication."
            data-vocab="ratio, equivalent"
            data-starter="These are equivalent because…"></div>
     </body></html>`,
    { url: "https://example.test/", runScripts: "outside-only" },
  );
  const w = dom.window;
  w.eval(src("shared/support/scaffold-ladder.js"));
  w.EWLScaffoldLadder.init();

  const prompt = w.document.querySelector(".ewl-scaffold-prompt").textContent;
  const rungs = [...w.document.querySelectorAll(".ewl-scaffold-rung")];
  assert.equal(rungs.length, 5, "the ladder must offer all five rungs");

  for (const rung of rungs) {
    rung.dispatchEvent(new w.Event("click", { bubbles: true }));
    assert.equal(
      w.document.querySelector(".ewl-scaffold-prompt").textContent,
      prompt,
      "changing the support level must not change the question",
    );
    assert.match(
      w.document.querySelector(".ewl-scaffold-target").textContent,
      /equivalent ratios using multiplication/,
      "the learning target must be identical at every rung",
    );
  }
});

it("never overwrites work the student already typed", () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
       <div data-ewl-scaffold data-prompt="Explain." data-frame="___ because ___."></div>
     </body></html>`,
    { url: "https://example.test/", runScripts: "outside-only" },
  );
  const w = dom.window;
  w.eval(src("shared/support/scaffold-ladder.js"));
  w.EWLScaffoldLadder.init();

  const textarea = w.document.querySelector(".ewl-scaffold-input");
  textarea.value = "My own explanation.";
  const frameRung = [...w.document.querySelectorAll(".ewl-scaffold-rung")].find(
    (b) => b.getAttribute("data-level") === "2",
  );
  frameRung.dispatchEvent(new w.Event("click", { bubbles: true }));
  assert.equal(textarea.value, "My own explanation.");
});

console.log(`\naward-portfolio: ${passed} assertions passed ✅\n`);
