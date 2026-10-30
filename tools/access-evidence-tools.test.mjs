#!/usr/bin/env node
// Teacher and family evidence tools: supports report, fade, goal bank, official scores, check-in
// calendar. Each one reports counts from what the learner did or what a teacher typed, never a level.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { checkinCalendar, checkinDates } from "../access-practice-lab/src/lang/checkin-calendar.js";
import { fadeDirection, fadeTrajectory } from "../access-practice-lab/src/lang/fade.js";
import {
  GOAL_STATUS,
  goalContext,
  goalEvidence,
  goalsForDomain,
  validateGoalBank,
} from "../access-practice-lab/src/lang/goals.js";
import { makeEntry } from "../access-practice-lab/src/lang/ledger.js";
import {
  growth,
  makeResult,
  parseLevel,
  parseYear,
  upsertResult,
} from "../access-practice-lab/src/lang/official-scores.js";
import { supportsReport } from "../access-practice-lab/src/lang/supports-report.js";

const json = (p) =>
  JSON.parse(readFileSync(new URL(`../access-practice-lab/content/${p}`, import.meta.url), "utf8"));
let tick = 0;
const attempt = (stage, extra = {}) =>
  makeEntry({
    src: "writing",
    domain: "Writing",
    use: "Explain",
    kind: "first",
    stage,
    t: new Date(Date.UTC(2026, 9, 1 + tick++)).toISOString(),
    supports: stage === "independent" ? {} : { frames: true, bank: stage === "guided" },
    m: { words: 40, link: 1, errs: {} },
    ...extra,
  });

test("supports report counts first attempts and withholds under three", () => {
  assert.equal(supportsReport({ entries: [attempt("guided")] }).enough, false);
  const entries = [
    attempt("guided"),
    attempt("supported"),
    attempt("independent"),
    attempt("independent"),
    { ...attempt("supported"), kind: "revision" },
  ];
  const r = supportsReport({
    entries,
    records: {
      "Reading:A": {
        domain: "Reading",
        level: "A",
        results: {
          a: { ok: true, supportUsed: false },
          b: { ok: false, supportUsed: true },
          c: { ok: true, supportUsed: false },
        },
      },
    },
  });
  assert.equal(r.n, 4, "the revision is not a first attempt");
  assert.deepEqual(r.byStage, { independent: 2, supported: 1, guided: 1 });
  assert.equal(r.opened.frames, 2);
  assert.equal(r.selected.Reading.onOwn, 2);
  assert.ok(r.lines.length >= 2);
  assert.ok(r.lines.every((l) => l.en && l.es && !/\b(level|score)\b/i.test(l.en)));
});

test("fade direction needs three attempts and reads the two halves", () => {
  assert.equal(fadeDirection(["guided", "supported"]), "not-enough");
  assert.equal(fadeDirection(["guided", "guided", "supported", "independent"]), "up");
  assert.equal(fadeDirection(["independent", "independent", "supported", "guided"]), "down");
  assert.equal(fadeDirection(["supported", "supported", "supported"]), "steady");
  const rows = fadeTrajectory([
    attempt("guided"),
    attempt("supported"),
    attempt("independent"),
    attempt("independent", { use: "Narrate" }),
  ]);
  assert.equal(rows[0].use, "Explain");
  assert.deepEqual(rows[0].sequence, ["guided", "supported", "independent"]);
});

test("goal bank is sound: distinct bilingual wording, real evidence refs, no level or score words", () => {
  const bank = json("goal-bank.json");
  const patterns = json("detective/patterns.json").patterns;
  assert.deepEqual(validateGoalBank(bank, { patterns }), []);
  for (const d of ["Listening", "Reading", "Speaking", "Writing"])
    assert.ok(goalsForDomain(bank, d).length >= 6, d);
  assert.ok(
    validateGoalBank({
      goals: [
        {
          id: "x",
          domains: ["Writing"],
          en: "Reach level 4",
          es: "Llega al nivel 4",
          evidence: { kind: "skill", ref: "writing.task" },
        },
      ],
    }).some((e) => /level or score/.test(e)),
  );
});

test("goal evidence is counts and a plain status, honest about thin evidence", () => {
  const bank = json("goal-bank.json");
  const goal = bank.goals.find((g) => g.evidence.ref === "cohesion-explain");
  const thin = goalEvidence(
    goal,
    goalContext({ ledger: { entries: [attempt("independent")] }, records: {}, band: "6-8" }),
  );
  assert.equal(thin.status, "not-enough");
  const strong = goalContext({
    ledger: {
      entries: [1, 2, 3, 4].map(() =>
        attempt("independent", { m: { words: 40, link: 3, errs: {} } }),
      ),
    },
    records: {},
    band: "6-8",
  });
  const ev = goalEvidence(goal, strong);
  assert.equal(ev.status, "on-own");
  assert.ok(Object.hasOwn(GOAL_STATUS, ev.status) && ev.en && ev.es);
});

test("official scores: strict entry, one result per year, plain differences", () => {
  assert.equal(parseLevel("4.2"), 4.2);
  for (const bad of ["7", "0.9", "4.25", "four", "4,2", ""])
    assert.equal(parseLevel(bad), null, bad);
  assert.equal(parseYear("2025-26"), "2025-26");
  assert.equal(parseYear("2025-2026"), "2025-26");
  assert.equal(parseYear("2025-27"), null);
  assert.equal(makeResult({ year: "2025-26", levels: {} }).ok, false);
  assert.equal(makeResult({ year: "2025-26", levels: { Listening: "9" } }).ok, false);
  const a = makeResult({
    year: "2024-25",
    levels: { Listening: "3.0", Reading: "3.4" },
    overall: "3.2",
  });
  const b = makeResult({
    year: "2025-26",
    levels: { Listening: "4.1", Reading: "3.1" },
    overall: "3.6",
  });
  assert.ok(a.ok && b.ok);
  const list = upsertResult(upsertResult([], b.value), a.value);
  assert.deepEqual(
    list.map((r) => r.year),
    ["2024-25", "2025-26"],
  );
  assert.equal(upsertResult(list, { ...b.value, overall: 4 }).length, 2, "same year replaces");
  const [pair] = growth(list);
  assert.equal(pair.domains.Listening.change, 1.1);
  assert.equal(pair.domains.Reading.direction, "down");
  assert.equal(
    pair.domains.Writing.direction,
    "none",
    "a domain missing in either year has no difference",
  );
  assert.equal(pair.overall.change, 0.4);
});

test("check-in calendar: valid dates, off weekends, no student data, folded lines", () => {
  assert.equal(checkinDates({ start: "2026-13-40" }), null);
  assert.equal(checkinDates({ start: "2026-11-02", everyDays: 3 }), null);
  const dates = checkinDates({ start: "2026-11-07", everyDays: 28, count: 3 });
  assert.equal(dates[0], "2026-11-09", "Saturday moves to Monday");
  const ics = checkinCalendar({
    start: "2026-11-02",
    everyDays: 14,
    count: 4,
    label: "Period 3",
    now: new Date("2026-10-30T00:00:00Z"),
  });
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 4);
  assert.equal(new Set(ics.match(/^UID:.*$/gm)).size, 4, "unique ids");
  assert.ok(ics.split("\r\n").every((l) => new TextEncoder().encode(l).length <= 75));
  assert.match(ics, /DTSTART;VALUE=DATE:20261102/);
  assert.equal(checkinCalendar({ start: "nope" }), null);
});
