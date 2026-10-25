#!/usr/bin/env node
// Language Intelligence Engine: text primitives, error detectors, response analysis, ledger/profile,
// speech-activity analysis. These tests pin the honesty rules as much as the behaviour:
// no composite score, no trend without evidence, independent attempts never mixed with supported ones.
import assert from "node:assert/strict";
import test from "node:test";
import {
  dueForReview,
  ELD_STANDARDS,
  loadAdaptSignals,
  missionSupport,
  recommendTasks,
  SUPPORT_TIERS,
  standardFor,
} from "../access-practice-lab/src/lang/adapt.js";
import { analyzeResponse, compareDrafts } from "../access-practice-lab/src/lang/analyze.js";
import { describeSpeech, summarizeEnvelope } from "../access-practice-lab/src/lang/audio.js";
import { checkRevision, DETECTOR_IDS, detect } from "../access-practice-lab/src/lang/errors.js";
import {
  appendEntry,
  buildProfile,
  focusAreas,
  MIN_POINTS,
  makeEntry,
  mergeLedgers,
  REVIEW_INTERVALS_DAYS,
  reviewSchedule,
  suggestStage,
  supportDependence,
  trend,
} from "../access-practice-lab/src/lang/ledger.js";
import {
  filterByKeyUse,
  KEY_LANGUAGE_USES,
  KLU_DOMAINS,
  KLU_REFERENCE,
  keyUseForSkill,
  kluReference,
} from "../access-practice-lab/src/lang/purpose.js";
import {
  addVersion,
  loadStudio,
  mergeStudio,
  writingState,
} from "../access-practice-lab/src/lang/studio.js";
import {
  diffWords,
  findPhrase,
  sentences,
  tokenize,
} from "../access-practice-lab/src/lang/text.js";
import { buildPracticePlan } from "../access-practice-lab/src/practice-plan.js";
import { SCORE_CLAIM } from "./lib/access-studio-rules.mjs";

const flagged = (text, id) => detect(text).some((f) => f.id === id);

test("text: sentences respect decimals, abbreviations and mixed end marks", () => {
  const s = sentences("Dr. Vance said the level was 2.5 ppm. It dropped! Why? Because of runoff.");
  assert.deepEqual(
    s.map((x) => x.text),
    ["Dr. Vance said the level was 2.5 ppm.", "It dropped!", "Why?", "Because of runoff."],
  );
  assert.equal(tokenize("don’t stop").length, 2);
  assert.equal(findPhrase("Dissolved-oxygen fell", "dissolved oxygen").length, 1);
});

test("text: word diff marks only what changed", () => {
  const d = diffWords("the fish died", "the fish died because of runoff");
  assert.deepEqual(
    d.map((x) => x.op),
    ["same", "add"],
  );
});

test("errors: each detector fires on its own pattern", () => {
  const cases = {
    "sv-agree-3sg": "She go to school every day.",
    "be-agree": "They is happy.",
    "past-marker": "Yesterday I go to the park.",
    "irregular-ed": "I goed to the store.",
    "plural-after-number": "I have two book.",
    "much-many": "There are much people.",
    "article-a-an": "I saw a apple.",
    "comparative-form": "This is more better.",
    "missing-expletive": "Is important to recycle.",
    "double-negative": "I don't have no money.",
    "modal-form": "She can to swim.",
    "do-support": "She doesn't likes pizza.",
    "question-order": "Why you did that?",
    "fragment-subordinate": "Because the water was dirty.",
    "comma-splice": "The experiment failed, it was too cold.",
    "capital-punct": "my sister went home",
    "confused-word": "I should of gone.",
    "preposition-choice": "I depend of my mom.",
    "l1-collocation": "I have 12 years.",
    "adjective-position": "The car red is fast.",
    "vague-word": "We found a lot of good stuff.",
    "connector-form": "Although it was cold, but we went.",
    "common-misspelling": "I recieve letters.",
    "missing-be": "She very tall.",
    "adjective-agreement": "The bigs houses were old.",
  };
  for (const [id, text] of Object.entries(cases))
    assert.ok(flagged(text, id), `${id}: "${text}" should be flagged`);
  for (const id of DETECTOR_IDS) assert.ok(cases[id], `detector ${id} has a self-test`);
});

test("errors: correct English is not flagged (precision corpus)", () => {
  const clean = [
    "The teacher helps students solve problems. Let him go to the library. Make it work for everyone.",
    "She read the book yesterday. They played soccer after school. It is important to recycle.",
    "There are two students in the lab. The temperature rose by 2 percent last week.",
    "My brother plays soccer every day, and he practices on Saturdays.",
    "We should check the data before we decide. If the water is dirty, fish cannot breathe.",
    "Is it raining today? What does the chart show? Does he go home after school?",
    "Why did the oxygen level drop? Because the fertilizer washed into the creek.",
    "An hour later, the team measured the creek again. A university scientist joined them.",
    "Dr. Vance said the level was 2.5 parts per million. According to the table, Station 2 was worse than Station 1.",
    "They are building a new bridge, but it is not finished yet. Although it rained, we went outside.",
    "She can swim faster than her sister. This is the best solution because it costs less.",
    "I went to the store yesterday and bought three apples. We were late because the bus broke down.",
    "The children walked to school. Two women and one man answered the questions.",
    "The city council voted on Monday. He did not see anyone at the station. Nobody knew the answer.",
    "The students work hard and she goes home. I like the picture very much.",
  ];
  for (const text of clean) {
    const high = detect(text).filter((f) => f.confidence === "high");
    assert.deepEqual(
      high.map((f) => `${f.id}:${f.text}`),
      [],
      text,
    );
  }
});

test("errors: revision check requires the pattern fixed, no new errors, same message", () => {
  const ok = checkRevision("She go to school.", "She goes to school.", "sv-agree-3sg");
  assert.equal(ok.fixed, true);
  assert.equal(ok.sameMessage, true);
  const deleted = checkRevision("My brother play soccer every day.", "Hi.", "sv-agree-3sg");
  assert.equal(deleted.fixed, true);
  assert.equal(deleted.sameMessage, false, "deleting the sentence is not a fix");
  const unchanged = checkRevision("She go home.", "She go home.", "sv-agree-3sg");
  assert.equal(unchanged.fixed, false);
  const worse = checkRevision(
    "She go to school.",
    "She goes to school yesterday I goed.",
    "sv-agree-3sg",
  );
  assert.ok(worse.introduced.length > 0);
});

const SOURCE = [
  "Station 2 oxygen was 2 parts per million",
  "Dissolved oxygen below 4 is hazardous",
  "Fertilizer runoff causes algae blooms",
];
const OPTS = {
  keyUse: "Explain",
  sourceText: SOURCE,
  sourceTerms: ["dissolved oxygen", "Station 2", "2 parts per million", "runoff", "fertilizer"],
  wordBank: ["runoff", "bioswales"],
  expected: { minWords: 50, maxWords: 120 },
};
const WEAK = "the fish die. Station 2 is bad. oxygen low.";
const STRONG =
  "According to the data, dissolved oxygen at Station 2 fell to 2 parts per million, which is unsafe for fish. This happened because fertilizer from nearby lawns washed into the creek during the storm. As a result, algae grew quickly and used up the oxygen. Therefore, the city should build bioswales to filter runoff.";

test("analysis: points at the learner's own text and returns no composite score", () => {
  const a = analyzeResponse(STRONG, OPTS);
  assert.ok(a.cohesion.variety >= 3);
  assert.equal(a.evidence.sourceCoverage, 1);
  assert.ok(a.purpose.moves.every((m) => m.present));
  assert.ok(a.strengths.length >= 4);
  for (const key of ["score", "level", "rating", "band", "complexityRating", "proficiency"])
    assert.equal(key in a, false, `no ${key}`);
  for (const s of a.strengths.flatMap((x) => x.spans))
    assert.equal(STRONG.slice(s.start, s.end).length > 0, true);
});

test("analysis: weak response gets specific next moves, evidence-based and capped at three", () => {
  const a = analyzeResponse(WEAK, OPTS);
  assert.ok(a.nextMoves.length >= 1 && a.nextMoves.length <= 3);
  assert.ok(a.nextMoves.some((m) => m.id === "develop"));
  for (const m of a.nextMoves)
    assert.ok(m.why && m.ask, "every move carries its evidence and a question");
});

test("analysis: independent stage never offers frames or word suggestions", () => {
  const supported = analyzeResponse(
    "Fish are dying. The creek has a lot of good things. The creek has things. The creek has stuff.",
    { ...OPTS, stage: "guided" },
  );
  const independent = analyzeResponse(
    "Fish are dying. The creek has a lot of good things. The creek has things. The creek has stuff.",
    { ...OPTS, stage: "independent" },
  );
  assert.ok(supported.nextMoves.some((m) => m.frame || m.suggestions?.length));
  for (const m of independent.nextMoves) {
    assert.equal(m.frame ?? null, null, `${m.id} must not carry a frame`);
    assert.equal((m.suggestions || []).length, 0, `${m.id} must not suggest words`);
  }
});

test("analysis: numbers that are not in the source are questioned, not corrected", () => {
  const a = analyzeResponse(
    "Dissolved oxygen at Station 2 fell to 7 parts per million because fertilizer washed in.",
    OPTS,
  );
  assert.ok(a.nextMoves.some((m) => m.id === "check-number"));
});

test("analysis: speaking transcripts skip written-only conventions", () => {
  const a = analyzeResponse("um the fish die because oxygen low", {
    ...OPTS,
    modality: "speaking",
  });
  assert.equal(
    a.errors.some((e) => e.id === "capital-punct"),
    false,
  );
});

test("compare drafts reports what changed and what was fixed", () => {
  const d = compareDrafts(WEAK, STRONG, OPTS);
  assert.ok(d.changes.some((c) => c.key === "words" && c.better));
  assert.ok(d.gainedMoves.length > 0);
});

test("ledger: a stage claims 'independent' only when no support was used", () => {
  assert.equal(
    makeEntry({ src: "writing", stage: "independent", supports: { bank: true } }).stage,
    "supported",
  );
  assert.equal(
    makeEntry({ src: "writing", stage: "independent", supports: {} }).stage,
    "independent",
  );
});

function seed(series) {
  const ledger = { entries: [] };
  for (const [stage, link, words] of series)
    appendEntry(ledger, {
      src: "writing",
      use: "Explain",
      stage,
      kind: "first",
      supports: stage === "independent" ? {} : { bank: true },
      m: {
        words,
        link,
        cites: link,
        complex: link,
        academic: link,
        errs: {},
        moves: { cause: link ? 1 : 0 },
      },
    });
  return ledger;
}

test("ledger: trends need enough evidence and never guess", () => {
  assert.equal(trend([1, 2]).status, "insufficient");
  assert.equal(trend([1, 1, 2, 3]).direction, "improving");
  assert.equal(trend([3, 3, 1, 1], "higher").direction, "slipping");
  assert.equal(trend([3, 1, 1, 3], "lower").direction, "steady");
  const p = buildProfile(
    seed([
      ["guided", 1, 30],
      ["guided", 2, 40],
    ]).entries,
  );
  assert.equal(p.features.link.all.status, "insufficient");
});

test("ledger: support dependence compares independent vs supported first attempts", () => {
  const dependent = seed([
    ["guided", 4, 60],
    ["guided", 4, 60],
    ["supported", 4, 60],
    ["independent", 1, 30],
    ["independent", 1, 30],
    ["independent", 1, 30],
  ]);
  const d = supportDependence(dependent.entries, "link");
  assert.equal(d.status, "ok");
  assert.equal(d.dependent, true);
  const flat = seed([
    ["guided", 2, 60],
    ["guided", 2, 60],
    ["supported", 2, 60],
    ["independent", 2, 60],
    ["independent", 2, 60],
    ["independent", 2, 60],
  ]);
  assert.equal(supportDependence(flat.entries, "link").dependent, false);
  assert.equal(
    supportDependence(seed([["independent", 2, 40]]).entries, "link").status,
    "insufficient",
  );
  assert.ok(MIN_POINTS >= 3);
});

test("ledger: revisions are not first attempts", () => {
  const ledger = seed([
    ["independent", 1, 30],
    ["independent", 1, 30],
    ["independent", 1, 30],
  ]);
  appendEntry(ledger, {
    src: "writing",
    use: "Explain",
    stage: "independent",
    kind: "revision",
    supports: {},
    m: { words: 90, link: 5 },
  });
  const p = buildProfile(ledger.entries);
  assert.equal(p.firstAttempts, 3);
  assert.equal(p.revisions, 1);
});

test("ledger: stage suggestion follows demonstrated performance", () => {
  assert.equal(suggestStage(buildProfile([]), "Argue").stage, "guided");
  const strong = buildProfile(
    seed([
      ["supported", 2, 50],
      ["independent", 3, 60],
      ["independent", 3, 60],
    ]).entries,
  );
  assert.equal(suggestStage(strong, "Explain").stage, "independent");
  const helped = buildProfile(
    seed([
      ["guided", 1, 30],
      ["guided", 1, 30],
    ]).entries,
  );
  assert.equal(suggestStage(helped, "Explain").stage, "supported");
});

test("ledger: a pattern counts once per piece of work, in its latest state", () => {
  const ledger = { entries: [] };
  // one piece revised three times: the error is fixed in the final version
  for (const errs of [{ "sv-agree-3sg": 2 }, { "sv-agree-3sg": 1 }, {}])
    appendEntry(ledger, {
      src: "writing",
      task: "essay",
      use: "Explain",
      stage: "supported",
      kind: "first",
      supports: { bank: true },
      m: { words: 50, errs },
    });
  assert.equal(
    buildProfile(ledger.entries).errors.length,
    0,
    "fixed by the final version, so not recurring",
  );
  // the same error across four different pieces IS recurring
  const other = { entries: [] };
  for (let i = 0; i < 4; i++)
    appendEntry(other, {
      src: "writing",
      task: `piece${i}`,
      use: "Explain",
      stage: "supported",
      kind: "first",
      supports: { bank: true },
      m: { words: 50, errs: { "sv-agree-3sg": 2 } },
    });
  const p = buildProfile(other.entries);
  assert.equal(p.errors[0].drafts, 4);
  assert.equal(focusAreas(p)[0].id, "sv-agree-3sg");
});

test("ledger: mastery needs independent transfer passes on different days and prompts", () => {
  const ledger = { entries: [] };
  for (let i = 0; i < 3; i++)
    appendEntry(ledger, {
      src: "writing",
      task: `p${i}`,
      use: "Explain",
      stage: "supported",
      kind: "first",
      supports: { bank: true },
      m: { words: 50, errs: { "sv-agree-3sg": 1 } },
    });
  const pass = (t, prompt) =>
    appendEntry(ledger, {
      t,
      src: "detective",
      stage: "independent",
      kind: "transfer",
      m: { pattern: "sv-agree-3sg", ok: true, prompt },
    });
  pass("2026-10-01T10:00:00Z", "t1");
  pass("2026-10-01T11:00:00Z", "t2");
  let e = buildProfile(ledger.entries).errors.find((x) => x.id === "sv-agree-3sg");
  assert.equal(e.mastered, false, "two passes on the same day are not durable");
  // newer writing without the error, then a pass on another day
  for (let i = 0; i < 12; i++)
    appendEntry(ledger, {
      src: "writing",
      task: `n${i}`,
      use: "Explain",
      stage: "independent",
      kind: "first",
      m: { words: 50, errs: {} },
    });
  pass("2026-10-08T10:00:00Z", "t1");
  e = buildProfile(ledger.entries).errors.find((x) => x.id === "sv-agree-3sg");
  assert.equal(e, undefined, "once it stops appearing in recent work it leaves the recurring list");
});

test("ledger merge is a union by id and keeps order", () => {
  const a = { entries: [makeEntry({ id: "a", t: "2026-01-02", src: "writing" })] };
  const b = {
    entries: [
      makeEntry({ id: "b", t: "2026-01-01", src: "writing" }),
      makeEntry({ id: "a", t: "2026-01-02", src: "writing" }),
    ],
  };
  assert.deepEqual(
    mergeLedgers(a, b).entries.map((e) => e.id),
    ["b", "a"],
  );
});

test("studio: versions keep the first draft; merge unions by id", () => {
  const s = loadStudio(() => null);
  const w = writingState(s, "t1");
  for (let i = 0; i < 20; i++) addVersion(w, `draft ${i}`);
  assert.equal(w.versions[0].text, "draft 0", "first draft is never dropped");
  assert.ok(w.versions.length <= 12);
  assert.equal(addVersion(w, "draft 19").text, "draft 19");
  const other = loadStudio(() => null);
  writingState(other, "t1").versions.push({ id: "z", t: "2099", kind: "final", text: "x" });
  assert.ok(mergeStudio(s, other).writing.t1.versions.some((v) => v.id === "z"));
});

test("audio: pauses, active speech and longest run come from the loudness envelope", () => {
  const env = [];
  for (let i = 0; i < 300; i++) env.push(i < 40 || (i > 120 && i < 150) || i > 260 ? 0.01 : 0.5);
  const sum = summarizeEnvelope(env, 20);
  assert.equal(sum.ok, true);
  assert.equal(sum.pauseCount, 1);
  assert.ok(sum.longestRun >= 5 && sum.longestRun <= 6);
  assert.ok(describeSpeech(sum).length >= 2);
  assert.equal(summarizeEnvelope(new Array(300).fill(0.01), 20).ok, false);
  assert.equal(summarizeEnvelope([0.5, 0.5], 20).reason, "too-short");
});

// ── spaced review, explainable recommendations, Key Language Use engine ──────
const DAY = 864e5;
const NOW = Date.parse("2026-10-20T15:00:00Z");
const daysAgo = (d) => new Date(NOW - d * DAY).toISOString();
const writingEntry = (d, patch = {}) =>
  makeEntry({
    src: "writing",
    task: `w${d}`,
    band: "6-8",
    domain: "Writing",
    use: "Explain",
    t: daysAgo(d),
    m: { words: 60, link: 1, cites: 0, complex: 1, academic: 1, moves: { cause: 1 }, errs: {} },
    ...patch,
  });
const noSignals = { checkinMissed: {}, worlds: {} };

test("review: intervals expand 1 → 3 → 7 → 14 days on independent success and reset on supported work", () => {
  assert.deepEqual(REVIEW_INTERVALS_DAYS, [1, 3, 7, 14]);
  const ev = (d, independent, ok = true) => ({ t: daysAgo(d), independent, ok });
  assert.equal(reviewSchedule([], NOW), null);
  assert.equal(reviewSchedule([ev(1, false)], NOW).interval, 1);
  assert.equal(reviewSchedule([ev(1, false)], NOW).due, true);
  assert.equal(reviewSchedule([ev(0, false)], NOW).due, false, "practiced today: not due yet");
  const one = reviewSchedule([ev(5, false), ev(2, true)], NOW);
  assert.deepEqual([one.step, one.interval, one.due], [1, 3, false]);
  assert.equal(reviewSchedule([ev(5, false), ev(3, true)], NOW).due, true);
  const three = reviewSchedule([ev(30, true), ev(20, true), ev(14, true)], NOW);
  assert.deepEqual([three.step, three.interval, three.due], [3, 14, true]);
  assert.equal(
    reviewSchedule([ev(30, true), ev(30, true)], NOW).step,
    1,
    "two successes on one day count once",
  );
  assert.equal(
    reviewSchedule([ev(40, true), ev(30, true), ev(20, true), ev(5, true)], NOW).retired,
    true,
  );
  assert.equal(
    reviewSchedule([ev(30, true), ev(20, true), ev(5, false)], NOW).interval,
    1,
    "a supported try resets the ladder",
  );
});

test("review: due items carry a trace built from the stored evidence", () => {
  const entries = [writingEntry(4, { stage: "supported", supports: { frames: true } })];
  const due = dueForReview(entries, NOW);
  assert.ok(due.length >= 1);
  assert.equal(
    due.filter((d) => d.kind === "skill").length,
    1,
    "one draft yields one skill review, not ten",
  );
  const item = due.find((d) => d.kind === "skill");
  assert.equal(item.domain, "Writing");
  assert.match(
    item.reason,
    /with sentence frames 4 days ago; try a quick independent check today\.$/,
  );
  assert.ok(item.reason.includes(item.name.charAt(0).toLowerCase() + item.name.slice(1)));
  assert.deepEqual(due, dueForReview(entries, NOW), "deterministic");
  // independent and successful yesterday → next check in 3 days, not due today
  const strong = {
    words: 80,
    link: 3,
    cites: 2,
    complex: 2,
    academic: 3,
    moves: { a: 1, b: 1 },
    errs: {},
  };
  assert.equal(dueForReview([writingEntry(1, { stage: "independent", m: strong })], NOW).length, 0);
  assert.ok(
    dueForReview([writingEntry(3, { stage: "independent", m: strong })], NOW).every((d) =>
      /after 3 days/.test(d.reason),
    ),
  );
});

test("review: error patterns use errors.js ids and Error Detective evidence", () => {
  const entries = [
    writingEntry(6, { stage: "independent", m: { words: 50, errs: { "past-marker": 2 } } }),
    makeEntry({
      src: "detective",
      task: "det-past-marker",
      band: "6-8",
      stage: "supported",
      kind: "practice",
      supports: { hint: true },
      t: daysAgo(2),
      m: { pattern: "past-marker", ok: true },
    }),
  ];
  const item = dueForReview(entries, NOW).find((d) => d.kind === "pattern");
  assert.equal(item.id, "past-marker");
  assert.ok(DETECTOR_IDS.includes(item.id));
  assert.match(
    item.reason,
    /in Error Detective with hints 2 days ago; try a quick independent check today\.$/,
  );
  // a later piece of independent work without the pattern counts as a success
  const fixed = [entries[0], writingEntry(1, { stage: "independent", m: { words: 50, errs: {} } })];
  assert.equal(
    dueForReview(fixed, NOW).some((d) => d.kind === "pattern"),
    false,
  );
});

test("review: practice-record evidence and empty or corrupt input never throw", () => {
  for (const bad of [
    null,
    undefined,
    "x",
    [null, 1, {}],
    [{ t: "not a date", src: "writing", m: { errs: 5 } }],
  ])
    assert.deepEqual(dueForReview(bad, NOW, { records: "corrupt" }), []);
  const records = {
    "Reading:A": {
      domain: "Reading",
      results: {
        r1: { ok: true, skill: "Identify main idea", supportUsed: true, date: daysAgo(2) },
      },
    },
  };
  const [item] = dueForReview([], NOW, { records });
  assert.equal(item.id, "reading.main-idea");
  assert.match(
    item.reason,
    /^You practiced “identify a main idea” with help 2 days ago; try a quick independent check today\.$/,
  );
});

test("practice plan surfaces due review with its trace, and is unchanged without evidence", () => {
  const rows = ["Reading", "Writing"].flatMap((domain) =>
    [1, 2].map((n) => ({
      band: "6-8",
      domain,
      level: "A",
      id: `${domain}-${n}`,
      title: `T${n}`,
      skill: n === 2 ? "Identify main idea" : "Compare two details",
    })),
  );
  const empty = () => ({ complete: [], answers: {}, notes: {}, results: {} });
  const plain = buildPracticePlan(rows, {}, empty);
  assert.equal(plain.due, undefined);
  const records = {
    "Reading:A": {
      domain: "Reading",
      results: { r9: { ok: true, skill: "main idea", supportUsed: true, date: daysAgo(3) } },
    },
  };
  const plan = buildPracticePlan(rows, { review: { entries: [], records, now: NOW } }, empty);
  assert.equal(plan.due.length, 1);
  assert.equal(plan[0].id, "Reading-2", "the activity practicing the due skill comes first");
  assert.equal(plan[0].status, "review");
  assert.equal(plan[0].reason, plan.due[0].reason);
  assert.equal(plan.length, plain.length);
});

test("recommendations: every result carries an observable reason from standards, KLU, check-in and worlds", () => {
  const tasks = [
    { id: "s1", keyUse: "Narrate", contentArea: "Science", taskType: "retell" },
    { id: "s2", keyUse: "Explain", contentArea: "Social Studies", taskType: "explain" },
    { id: "w1", keyUse: "Argue", contentArea: "Math", form: "argument", dimensions: ["Sentence"] },
  ];
  assert.equal(standardFor(tasks[0]), "ELD-SC");
  assert.equal(standardFor({ contentArea: "School Life" }), "ELD-SI");
  assert.equal(standardFor({ standards: ["ELD-LA"], contentArea: "Science" }), "ELD-LA");
  assert.equal(Object.keys(ELD_STANDARDS).length, 5);
  const recs = recommendTasks(tasks, [], { n: 3, signals: noSignals });
  assert.ok(recs.every((r) => r.reason && r.reason === r.why));
  assert.ok(recs.some((r) => /WIDA ELD Standard 4/.test(r.reason)));
  const signals = { checkinMissed: { "cause-effect": ["Listening"] }, worlds: {} };
  const withCheckin = recommendTasks(tasks, [], { n: 3, signals });
  assert.equal(withCheckin[0].task.id, "s2");
  assert.match(
    withCheckin[0].reason,
    /your Listening check-in suggested practicing cause and effect/,
  );
  const worlds = recommendTasks(tasks, [], {
    n: 3,
    signals: { checkinMissed: {}, worlds: { storyworks: 2 } },
  });
  assert.match(worlds.find((r) => r.task.id === "w1").reason, /2 StoryWorks transfer missions/);
  for (const r of [...recs, ...withCheckin, ...worlds])
    assert.equal(SCORE_CLAIM.test(r.reason), false);
});

test("adapt signals: missing or corrupt storage gives empty evidence", () => {
  assert.deepEqual(
    loadAdaptSignals("6-8", () => null),
    noSignals,
  );
  assert.deepEqual(
    loadAdaptSignals("6-8", () => "{not json"),
    noSignals,
  );
  assert.deepEqual(
    loadAdaptSignals("6-8", () => {
      throw new Error("blocked");
    }),
    noSignals,
  );
  const store = {
    "accessPracticeLab:v1:diagnostic": JSON.stringify({
      "6-8:Reading": {
        answers: [
          { skill: "evidence", correct: false },
          { skill: "main-idea", correct: true },
          null,
        ],
      },
      "3-5:Reading": { answers: [{ skill: "sequence", correct: false }] },
    }),
    "accessPracticeLab:v1:world-missions": JSON.stringify({
      "6-8:storyworks:m1": { completed: true },
      "6-8:storyworks:m2": { completed: true },
      "6-8:nowhere:x": { completed: true },
      "3-5:evidence-city:m1": { completed: true },
    }),
  };
  assert.deepEqual(
    loadAdaptSignals("6-8", (k) => store[k] ?? null),
    { checkinMissed: { evidence: ["Reading"] }, worlds: { storyworks: 2 } },
  );
});

test("mission support: the learner's override wins and every answer has a reason", () => {
  assert.deepEqual(
    SUPPORT_TIERS.map((t) => t.label),
    ["Starting", "Growing", "Expanding", "Independent"],
  );
  for (const t of SUPPORT_TIERS) {
    const s = missionSupport([], "Argue", { override: t.id, signals: noSignals });
    assert.equal(s.stage, t.stage);
    assert.equal(s.override, true);
    assert.match(s.reason, new RegExp(`You chose ${t.label} support`));
    assert.equal(SCORE_CLAIM.test(s.reason), false);
  }
  assert.equal(missionSupport([], "Argue", { override: "", signals: noSignals }).stage, "guided");
  assert.equal(
    missionSupport([], "Argue", { override: "bogus", signals: noSignals }).override,
    false,
  );
  const checkin = missionSupport([], "Argue", {
    override: "",
    signals: { checkinMissed: { evidence: ["Reading"] }, worlds: {} },
  });
  assert.match(checkin.reason, /Reading check-in/);
  const worlds = missionSupport([], "Argue", {
    override: "",
    signals: { checkinMissed: {}, worlds: { storyworks: 2 } },
  });
  assert.equal(worlds.stage, "supported");
  assert.doesNotThrow(() => missionSupport(null, "Argue"));
});

test("KLU engine: moves, functions and signal words for all four uses in both grade bands", () => {
  assert.deepEqual(KEY_LANGUAGE_USES, ["Narrate", "Inform", "Explain", "Argue"]);
  for (const k of KEY_LANGUAGE_USES)
    for (const band of ["3-5", "6-8"]) {
      const r = kluReference(k, band);
      assert.equal(r.band, band);
      assert.ok(
        r.moves.length >= 3 && r.functions.length >= 3 && r.signals.length >= 5,
        `${k} ${band}`,
      );
      for (const d of KLU_DOMAINS) assert.ok(r.domains[d], `${k} ${d}`);
    }
  assert.notDeepEqual(kluReference("Argue", "3-5").signals, kluReference("Argue", "6-8").signals);
  assert.equal(kluReference("Describe"), null);
  assert.equal(SCORE_CLAIM.test(JSON.stringify(KLU_REFERENCE)), false);
  assert.equal(keyUseForSkill("Recognize sequence"), "Narrate");
  assert.equal(keyUseForSkill("Interpret cause and effect"), "Explain");
  assert.equal(keyUseForSkill("Identify main idea in a short text"), "Inform");
  assert.equal(keyUseForSkill("Evaluate a claim"), "Argue");
  assert.equal(keyUseForSkill(""), null);
  const items = [
    { id: "a", domain: "Speaking", keyUse: "Argue" },
    { id: "b", domain: "Writing", keyUse: "Argue" },
    { id: "c", domain: "Reading", skill: "Recognize sequence" },
    { id: "m", keyUses: ["Explain", "Argue"] },
  ];
  assert.deepEqual(
    filterByKeyUse(items, "Argue").map((i) => i.id),
    ["a", "b", "m"],
  );
  assert.deepEqual(
    filterByKeyUse(items, "Argue", "Writing").map((i) => i.id),
    ["b", "m"],
  );
  assert.deepEqual(
    filterByKeyUse(items, "Narrate", "Reading").map((i) => i.id),
    ["c"],
  );
  assert.deepEqual(filterByKeyUse(null, "Argue"), []);
  assert.deepEqual(filterByKeyUse(items, "Describe"), []);
});
