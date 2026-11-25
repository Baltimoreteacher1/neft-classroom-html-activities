// Word encounters (access-practice-lab/src/lang/word-encounters.js). Pins the rules the Language Lens depends on:
// seeing a word is never using it, supported tries are not independent, only tested encounters schedule a review
// (by the ledger's own rule), a backup merges without double counting, bad data is dropped not thrown on, and the
// summary never carries a level, score or rank.
import assert from "node:assert/strict";
import test from "node:test";
import {
  blankWords,
  cleanWord,
  cleanWords,
  lensSummary,
  loadWords,
  MAX_WORDS,
  mergeWords,
  noteWords,
  recordEncounters,
  saveWords,
  TRY_USING_AFTER,
  trackedWordsIn,
  WORDS_KEY,
  wordSchedule,
} from "../access-practice-lab/src/lang/word-encounters.js";

const DAY = 864e5;
const T0 = Date.parse("2026-11-01T12:00:00Z");
const fresh = () => blankWords();

test("cleanWord keeps a word or a phrase of up to three words and refuses sentences, digits and junk", () => {
  assert.equal(cleanWord("  Analyze, "), "analyze");
  assert.equal(cleanWord("well-known"), "well-known");
  assert.equal(cleanWord("don’t"), "don’t");
  assert.equal(cleanWord("energía"), "energía");
  assert.equal(cleanWord("Unit  Rate."), "unit rate");
  assert.equal(cleanWord("point of view"), "point of view");
  for (const bad of [
    "",
    " ",
    "a",
    "a b c d",
    "one, two",
    "the cat sat down",
    "x2y",
    "123",
    "-",
    "x".repeat(41),
    null,
    undefined,
    {},
  ])
    assert.equal(cleanWord(bad), "", `refuses ${JSON.stringify(bad)}`);
});

test("each kind of encounter is counted on its own and seeing is never using", () => {
  const s = fresh();
  recordEncounters(s, ["pattern"], { src: "wordlab", mode: "saw", now: T0 });
  recordEncounters(s, ["pattern"], { src: "reading", mode: "heard", now: T0 });
  const rec = s.words.pattern;
  assert.deepEqual([rec.n.saw, rec.n.heard, rec.n.chose, rec.n.said, rec.n.wrote], [1, 1, 0, 0, 0]);
  assert.deepEqual(rec.ev, [], "exposure never enters the review schedule");
  const sum = lensSummary(s, T0);
  assert.deepEqual(sum.met, ["pattern"]);
  assert.deepEqual([sum.said, sum.wrote, sum.independent], [[], [], []]);
});

test("one call is one encounter per distinct word; unusable items are skipped", () => {
  const s = fresh();
  const n = recordEncounters(
    s,
    ["Claim", "claim", "CLAIM!", "this is not a word at all", "", 7, null, { w: "claim" }],
    {
      src: "arcade",
      mode: "saw",
      now: T0,
    },
  );
  assert.equal(n, 1);
  assert.equal(s.words.claim.n.saw, 1);
  assert.equal(
    recordEncounters(s, ["claim"], { mode: "mimed", now: T0 }),
    0,
    "unknown mode records nothing",
  );
  assert.equal(s.words.claim.n.saw, 1);
});

test("an unknown source is filed as other, not as a new bucket", () => {
  const s = fresh();
  recordEncounters(s, ["source"], { src: "made-up", mode: "saw", now: T0 });
  assert.deepEqual(Object.keys(s.words.source.s), ["other"]);
});

test("supported and independent uses are kept apart", () => {
  const s = fresh();
  recordEncounters(s, ["evidence"], { src: "teach-back", mode: "wrote", supported: true, now: T0 });
  assert.deepEqual(lensSummary(s, T0).wrote, ["evidence"]);
  assert.deepEqual(
    lensSummary(s, T0).independent,
    [],
    "a frame was open: supported, not independent",
  );
  recordEncounters(s, ["evidence"], { src: "writing", mode: "wrote", now: T0 + DAY });
  assert.deepEqual(lensSummary(s, T0 + DAY).independent, ["evidence"]);
  recordEncounters(s, ["factor"], { src: "arcade", mode: "chose", now: T0 });
  assert.ok(!lensSummary(s, T0).independent.includes("factor"), "choosing a word is not using it");
});

test("a missed choice is recorded as a miss, per word or for the call", () => {
  const s = fresh();
  recordEncounters(
    s,
    [
      { w: "cause", ok: false },
      { w: "effect", ok: true },
    ],
    { src: "arcade", mode: "chose", now: T0 },
  );
  recordEncounters(s, ["impact"], { src: "arcade", mode: "chose", ok: false, now: T0 });
  assert.equal(s.words.cause.ev[0].ok, 0);
  assert.equal(s.words.effect.ev[0].ok, 1);
  assert.equal(s.words.impact.ev[0].ok, 0);
});

test("review follows the ledger's expanding rule, and a supported try or a miss resets it", () => {
  const s = fresh();
  const rec = () => s.words.analyze;
  const at = (days) => T0 + days * DAY;
  recordEncounters(s, ["analyze"], { src: "wordlab", mode: "chose", supported: true, now: at(0) });
  assert.deepEqual(
    [wordSchedule(rec(), at(0)).step, wordSchedule(rec(), at(0)).due],
    [0, false],
    "tried today: not due yet",
  );
  assert.equal(
    wordSchedule(rec(), at(1)).due,
    true,
    "no independent success yet: back after 1 day",
  );
  recordEncounters(s, ["analyze"], { src: "wordlab", mode: "wrote", now: at(1) });
  assert.equal(wordSchedule(rec(), at(1)).step, 1);
  assert.equal(
    wordSchedule(rec(), at(3)).due,
    false,
    "first independent success: next review after 3 days",
  );
  assert.equal(wordSchedule(rec(), at(4)).due, true);
  assert.equal(lensSummary(s, at(4)).due[0].w, "analyze");
  recordEncounters(s, ["analyze"], { src: "writing", mode: "wrote", now: at(4) });
  assert.equal(wordSchedule(rec(), at(4)).step, 2, "independent on a second day: interval grows");
  assert.equal(wordSchedule(rec(), at(10)).due, false);
  assert.equal(wordSchedule(rec(), at(11)).due, true, "7 days");
  recordEncounters(s, ["analyze"], { src: "arcade", mode: "chose", ok: false, now: at(11) });
  assert.equal(wordSchedule(rec(), at(11)).step, 0, "a miss resets the step");
  recordEncounters(s, ["analyze"], { src: "writing", mode: "wrote", supported: true, now: at(12) });
  assert.equal(wordSchedule(rec(), at(12)).step, 0, "a supported try does not advance it");
});

test("a word with no tested encounter has no schedule and is never due", () => {
  const s = fresh();
  recordEncounters(s, ["context"], { mode: "saw", now: T0 });
  assert.equal(wordSchedule(s.words.context, T0 + 30 * DAY), null);
  assert.deepEqual(lensSummary(s, T0 + 30 * DAY).due, []);
});

test("a word met several times but never used is offered as try-using; using it removes it", () => {
  const s = fresh();
  for (let i = 0; i < TRY_USING_AFTER; i++)
    recordEncounters(s, ["factor"], { mode: i % 2 ? "heard" : "saw", now: T0 + i * DAY });
  assert.deepEqual(lensSummary(s, T0 + 5 * DAY).tryUsing, ["factor"]);
  recordEncounters(s, ["factor"], { mode: "said", now: T0 + 5 * DAY });
  assert.deepEqual(lensSummary(s, T0 + 5 * DAY).tryUsing, []);
  assert.deepEqual(lensSummary(s, T0 + 5 * DAY).said, ["factor"]);
});

test("the summary has plain lists and counts, never a level, score, rank or mastery claim", () => {
  const s = fresh();
  recordEncounters(s, ["claim", "reason"], { src: "teach-back", mode: "wrote", now: T0 });
  const text = JSON.stringify(lensSummary(s, T0 + 3 * DAY));
  assert.doesNotMatch(text, /score|level|rank|master|proficien|grade|streak|points|percent/i);
  assert.deepEqual(
    Object.keys(s.words.claim).sort(),
    ["ev", "first", "last", "n", "s"],
    "no text field exists to hold a sentence",
  );
});

test("a backup merges by the larger counter, so importing it twice changes nothing", () => {
  const a = fresh();
  const b = fresh();
  recordEncounters(a, ["system"], { src: "wordlab", mode: "saw", now: T0 });
  recordEncounters(a, ["system"], { src: "wordlab", mode: "wrote", now: T0 });
  recordEncounters(b, ["system"], { src: "wordlab", mode: "saw", now: T0 });
  recordEncounters(b, ["system"], { src: "reading", mode: "saw", now: T0 + DAY });
  recordEncounters(b, ["trend"], { src: "arcade", mode: "chose", now: T0 + DAY });
  const once = mergeWords(a, b);
  assert.equal(once.words.system.n.saw, 2, "larger of 1 and 2");
  assert.equal(once.words.system.n.wrote, 1);
  assert.deepEqual(once.words.system.s, { wordlab: 2, reading: 1 });
  assert.ok(once.words.trend);
  assert.deepEqual(mergeWords(once, b), once, "same backup again: no change");
  assert.deepEqual(mergeWords(once, a), once);
  assert.equal(once.words.system.first, Math.floor(T0 / DAY), "earliest first-met day kept");
});

test("merging with nothing or with junk keeps what is there", () => {
  const a = fresh();
  recordEncounters(a, ["sequence"], { mode: "saw", now: T0 });
  assert.deepEqual(mergeWords(a, null), a);
  assert.deepEqual(mergeWords(null, a), a);
  assert.deepEqual(mergeWords(a, { v: 9, words: { x: 1 } }), a);
});

test("storage: round-trip, corrupt data reads as blank, and a failing store never throws", () => {
  const s = fresh();
  recordEncounters(s, ["method"], { src: "demand", mode: "heard", now: T0 });
  let raw = null;
  saveWords(s, (k, v) => {
    assert.equal(k, WORDS_KEY);
    raw = v;
  });
  assert.deepEqual(
    loadWords(() => raw),
    s,
  );
  for (const bad of [null, "", "{", "[]", '{"v":2,"words":{}}', '{"v":1,"words":[]}'])
    assert.deepEqual(
      loadWords(() => bad),
      blankWords(),
      `blank for ${bad}`,
    );
  const boom = () => {
    throw new Error("quota");
  };
  assert.equal(noteWords(["method"], { mode: "saw" }, { read: () => null, write: boom }), false);
  assert.equal(noteWords(["method"], { mode: "saw" }, { read: boom, write: boom }), false);
  assert.equal(
    noteWords([], { mode: "saw" }, { read: () => null, write: boom }),
    false,
    "nothing to record",
  );
  let saved = null;
  assert.equal(
    noteWords(
      ["method"],
      { src: "wordlab", mode: "saw", now: T0 },
      { read: () => saved, write: (_k, v) => (saved = v) },
    ),
    true,
  );
  assert.equal(loadWords(() => saved).words.method.n.saw, 1);
});

test("cleanWords drops bad words, clamps counts and keeps the most recently met up to the cap", () => {
  const raw = {
    v: 1,
    words: {
      "this is a bad entry": { n: { saw: 1 } },
      "-": { n: { saw: 1 } },
      zero: { n: {} },
      ok: {
        n: { saw: -5, wrote: 9e9 },
        s: { nope: 3, wordlab: 2 },
        last: 5,
        ev: [
          { t: "garbage" },
          { t: "2026-11-02T10:00", m: "wrote", i: 1, ok: 1 },
          { t: "2026-11-02", m: "saw" },
        ],
      },
    },
  };
  const clean = cleanWords(raw);
  assert.deepEqual(Object.keys(clean.words), ["ok"]);
  assert.equal(clean.words.ok.n.saw, 0);
  assert.equal(clean.words.ok.n.wrote, 100000);
  assert.deepEqual(clean.words.ok.s, { wordlab: 2 });
  assert.deepEqual(clean.words.ok.ev, [{ t: "2026-11-02", m: "wrote", i: 1, ok: 1 }]);
  const big = { v: 1, words: {} };
  const names = (i) =>
    `w${String.fromCharCode(97 + (i % 26))}${String.fromCharCode(97 + (Math.floor(i / 26) % 26))}${String.fromCharCode(97 + Math.floor(i / 676))}`;
  for (let i = 0; i < MAX_WORDS + 50; i++) big.words[names(i)] = { n: { saw: 1 }, last: i + 1 };
  const capped = cleanWords(big);
  assert.equal(Object.keys(capped.words).length, MAX_WORDS);
  assert.ok(capped.words[names(MAX_WORDS + 49)], "newest kept");
  assert.ok(!capped.words[names(0)], "oldest dropped");
});

test("recording past the cap drops the least recently met word", () => {
  const s = fresh();
  for (let i = 0; i < MAX_WORDS; i++)
    s.words[
      `x${String.fromCharCode(97 + (i % 26))}${String.fromCharCode(97 + (Math.floor(i / 26) % 26))}${String.fromCharCode(97 + Math.floor(i / 676))}`
    ] = { n: { saw: 1, heard: 0, chose: 0, said: 0, wrote: 0 }, s: {}, first: 1, last: 1, ev: [] };
  recordEncounters(s, ["newest"], { mode: "saw", now: T0 });
  assert.equal(Object.keys(s.words).length, MAX_WORDS);
  assert.ok(s.words.newest);
});

test("trackedWordsIn matches phrases longest-first, within a sentence, and a plural finds its singular", () => {
  const list = new Set([
    "negative number",
    "number line",
    "unit rate",
    "rate",
    "point of view",
    "opposite",
  ]);
  const found = trackedWordsIn(
    "Negative numbers are less than zero. On a number line they go left. The unit rate and the point of view.",
    list,
  );
  assert.deepEqual(found.sort(), ["negative number", "number line", "point of view", "unit rate"]);
  assert.ok(!found.includes("rate"), "the longer phrase takes the word");
  assert.deepEqual(
    trackedWordsIn("a number. line here", list),
    [],
    "a phrase never crosses a sentence break",
  );
});

test("trackedWordsIn finds list words in text and returns only words", () => {
  const list = new Set(["analyze", "evidence", "cause"]);
  const found = trackedWordsIn(
    "We Analyze the evidence. Evidence is the cause; analyzing is not it.",
    list,
  );
  assert.deepEqual(found.sort(), ["analyze", "cause", "evidence"]);
  assert.deepEqual(trackedWordsIn("", list), []);
  assert.deepEqual(trackedWordsIn(null, list), []);
  assert.ok(
    trackedWordsIn("The pattern shows a trend.").includes("pattern"),
    "defaults to the lab's academic list",
  );
});
