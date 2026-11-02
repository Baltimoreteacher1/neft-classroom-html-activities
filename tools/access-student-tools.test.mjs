#!/usr/bin/env node
// Student-side tools: word cards and partner talk, the retell checks, and the family letter.
// Counts and plain sentences only; no score, level or prediction reaches a family.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildLetter,
  HOME_IDEAS,
  homeIdeaDomain,
} from "../access-practice-lab/src/lang/family-letter.js";
import { buildDeck, nextCard, pairTalk, rate } from "../access-practice-lab/src/lang/flashcards.js";
import { makeEntry } from "../access-practice-lab/src/lang/ledger.js";
import {
  RETELL_CHECKS,
  retellKey,
  toggleRetellCheck,
} from "../access-practice-lab/src/views/retell.js";

const level = JSON.parse(
  readFileSync(
    new URL("../access-practice-lab/content/g6-8/Reading.json", import.meta.url),
    "utf8",
  ),
).levels.A;

test("a deck is unique by term, keeps Spanish glosses and can be limited to one strand", () => {
  const all = buildDeck(level);
  assert.ok(all.length >= 20, "a real level has many words");
  assert.equal(new Set(all.map((c) => c.term.toLowerCase())).size, all.length);
  assert.ok(all.every((c) => c.def && c.activityId));
  assert.ok(all.filter((c) => c.es).length / all.length > 0.9, "Spanish glosses present");
  const strand = level.categories[0];
  const some = buildDeck(level, strand.id);
  assert.ok(some.length > 0 && some.length < all.length);
  assert.deepEqual(buildDeck(level, "no-such-strand"), []);
});

test("review follows 1 → 3 → 7 → 14 days; a miss returns tomorrow", () => {
  const day = 100;
  const first = rate(undefined, true, day);
  assert.deepEqual([first.box, first.due], [0, day + 1]);
  const second = rate(first, true, day + 1);
  assert.deepEqual([second.box, second.due], [1, day + 1 + 3]);
  assert.equal(
    rate({ box: 3, due: 0, seen: 5 }, true, day).due,
    day + 14,
    "the ladder stops at 14 days",
  );
  const missed = rate({ box: 2, due: 0, seen: 3 }, false, day);
  assert.deepEqual([missed.box, missed.due], [0, day + 1]);
});

test("next card: due first, then new, then caught up with the days to wait", () => {
  const cards = [{ term: "Alpha" }, { term: "Beta" }, { term: "Gamma" }];
  assert.equal(nextCard(cards, {}, 10).card.term, "Alpha");
  assert.equal(
    nextCard(cards, { alpha: { box: 0, due: 11 } }, 10).card.term,
    "Beta",
    "not yet due, so a new card",
  );
  assert.equal(
    nextCard(cards, { alpha: { box: 0, due: 9 }, beta: { box: 0, due: 5 } }, 10).card.term,
    "Beta",
    "most overdue first",
  );
  const done = nextCard(cards, { alpha: { due: 13 }, beta: { due: 12 }, gamma: { due: 20 } }, 10);
  assert.deepEqual([done.card, done.reason, done.waiting], [null, "caught-up", 2]);
});

test("partner talk is bilingual, uses the deck's words and swaps roles every other prompt", () => {
  const deck = buildDeck(level);
  const talk = pairTalk(deck, { count: 4 });
  assert.equal(talk.length, 4);
  assert.deepEqual(
    talk.map((t) => t.swap),
    [false, true, false, true],
  );
  for (const t of talk) {
    assert.ok(t.speaker.en.includes(t.word) || t.listener.en.includes(t.word));
    assert.ok(t.speaker.es && t.listener.es && !t.speaker.en.includes("{w}"));
  }
  assert.deepEqual(pairTalk([]), []);
});

test("retell checks are the learner's own, kept per activity, and ignore unknown ids", () => {
  const record = {};
  assert.equal(toggleRetellCheck(record, "rd-1", "main", new Date("2026-10-30T10:00:00Z")), true);
  assert.equal(toggleRetellCheck(record, "rd-1", "main"), false, "toggles back off");
  assert.equal(toggleRetellCheck(record, "rd-1", "bogus"), null);
  toggleRetellCheck(record, "rd-1", "detail");
  assert.deepEqual(record.retell["rd-1"].checks, { main: false, detail: true });
  assert.equal(retellKey("rd-1"), "rd-1~retell");
  assert.equal(RETELL_CHECKS.length, 3);
});

test("family letter: both languages, honest counts, one home idea, no score or level", () => {
  const entries = [1, 2, 3, 4].map((i) =>
    makeEntry({
      src: "writing",
      domain: "Writing",
      use: "Explain",
      kind: "first",
      stage: i > 2 ? "independent" : "supported",
      t: `2026-10-0${i}T10:00:00Z`,
      supports: i > 2 ? {} : { frames: true },
      m: { words: 40, link: i, errs: {} },
    }),
  );
  const letter = buildLetter({
    name: "Sam",
    counts: { Listening: 5, Reading: 4, Speaking: 1, Writing: 6 },
    entries,
    now: new Date("2026-10-30T00:00:00Z"),
  });
  assert.equal(letter.homeDomain, "Speaking", "the least practiced skill");
  for (const l of [letter.en, letter.es]) {
    assert.equal(l.date, "2026-10-30");
    assert.ok(l.sections.length >= 3 && l.sections.every((s) => s.h && s.p.length));
    assert.doesNotMatch(
      JSON.stringify(l),
      /\b(score of|level \d|nivel \d|proficiency level|predict)/i,
    );
  }
  assert.match(letter.en.greeting, /Sam/);
  assert.match(letter.es.greeting, /^Estimada familia de Sam/);
  assert.match(JSON.stringify(letter.en.sections), /Speaking: 1/);
  assert.match(JSON.stringify(letter.es.sections), /Hablar: 1/);
  assert.match(letter.en.note, /not a WIDA ACCESS score/);
  assert.match(
    JSON.stringify(letter.en.sections),
    /Ways of linking ideas|joining ideas in more ways/,
  );
  const thin = buildLetter({ counts: {}, entries: [] });
  assert.match(thin.en.greeting, /^Dear family,/);
  assert.match(JSON.stringify(thin.en.sections), /just started/);
  assert.equal(Object.keys(HOME_IDEAS).length, 4);
  assert.equal(homeIdeaDomain({ Listening: 2, Reading: 2, Speaking: 2, Writing: 2 }), "Speaking");
});

test("reading log: title required, minutes optional and bounded, summary by day, shared newest 30", async () => {
  const { addReadingLog, readingLogSummary } = await import(
    "../access-practice-lab/src/reading-state.js"
  );
  const { normalize } = await import("../access-practice-lab/src/lang/share.js");
  const state = { log: [] };
  assert.equal(addReadingLog(state, { title: "   " }), null);
  const now = new Date("2026-10-30T12:00:00Z");
  addReadingLog(
    state,
    { title: "Charlotte's Web", minutes: "20", note: "Wilbur is brave" },
    new Date("2026-10-29T12:00:00Z"),
  );
  addReadingLog(state, { title: "Bus sign", minutes: "999" }, new Date("2026-10-30T08:00:00Z"));
  addReadingLog(state, { title: "Old text", minutes: 15 }, new Date("2026-10-01T08:00:00Z"));
  assert.equal(state.log[1].minutes, null, "999 minutes is not a minute count");
  assert.deepEqual(readingLogSummary(state.log, now), { texts: 2, minutes: 20, days: 2 });
  const shared = normalize({
    alias: "Pat",
    readingLog: [...state.log, { t: 5, title: "bad" }, "junk"],
  });
  assert.equal(shared.readingLog.length, 3, "malformed rows are dropped");
  assert.equal(normalize({ alias: "Pat" }).readingLog.length, 0);
  const many = { log: [] };
  for (let i = 0; i < 80; i++)
    addReadingLog(many, { title: `Text ${i}` }, new Date(Date.UTC(2026, 9, 1, 0, i)));
  assert.equal(many.log.length, 60);
  assert.equal(normalize({ readingLog: many.log }).readingLog.length, 30);
});
