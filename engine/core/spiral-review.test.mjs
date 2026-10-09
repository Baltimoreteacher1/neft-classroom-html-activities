#!/usr/bin/env node
/**
 * spiral-review.test.mjs — the warm-up's spiral review asks about the RIGHT
 * earlier lessons, chosen by district teaching order and paced dates.
 *
 * Lesson 4-1 is paced on 2026-10-09 (Unit 4 opens). Its spiral review must
 * reach back 2–4 weeks (2026-09-11 … 2026-09-25 → Unit 3 lessons 3-2 … 3-7)
 * for one question, and to an EARLIER unit than both today's and that one —
 * the Pre-Unit (2-6, 2-7, 6-1, 6-2; never 1-1 "Math is Mine", which has no
 * content) — for the other. Numeric adjacency would have said 3-10 and 3-9.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";

const read = (rel) => JSON.parse(readFileSync(new URL(`../../${rel}`, import.meta.url), "utf8"));
const { sequence } = read("data/retrieval-bank.json");

const dom = new JSDOM("<!doctype html><body></body>", { url: "https://eduwonderlab.com/lessons/4-1/" });
Object.defineProperty(globalThis, "localStorage", { value: dom.window.localStorage, configurable: true });

const {
  RECENT_WINDOW_DAYS,
  lessonMissRates,
  missedSpiralItems,
  pickSpiralItem,
  recordSpiralAnswer,
  selectSpiralSources,
  spiralItemKey,
  spiralItemsFrom,
} = await import("./spiral-review.js");

const byId = new Map(sequence.map((e) => [e.id, e]));
const dayDiff = (a, b) => Math.round((Date.parse(a) - Date.parse(b)) / 86400000);

test("the sequence carries paced dates in district order", () => {
  assert.equal(byId.get("4-1")?.date, "2026-10-09", "4-1's paced date");
  assert.equal(byId.get("6-1")?.date, "2026-08-28", "6-1 is taught in the Pre-Unit, in August");
  for (let i = 1; i < sequence.length; i++) {
    if (sequence[i].date && sequence[i - 1].date) assert.ok(sequence[i].date >= sequence[i - 1].date, sequence[i].id);
  }
});

test("4-1 on its paced date: one lesson 2–4 weeks back, one from an earlier unit", () => {
  const { recent, earlier } = selectSpiralSources(sequence, "4-1");
  assert.ok(recent && earlier, "both sources exist for 4-1");
  const back = dayDiff("2026-10-09", recent.date);
  assert.ok(back >= RECENT_WINDOW_DAYS[0] && back <= RECENT_WINDOW_DAYS[1], `${recent.id} is ${back} days back`);
  assert.ok(["3-2", "3-3", "3-4", "3-5", "3-6", "3-7"].includes(recent.id), recent.id);
  assert.ok(["2-6", "2-7", "6-1", "6-2"].includes(earlier.id), `earlier-unit pick was ${earlier.id}`);
  assert.equal(earlier.unit, "PRE");
  // Deterministic: the same lesson asks the same sources on every device.
  assert.deepEqual(selectSpiralSources(sequence, "4-1"), { recent, earlier });
  // A small-group variant reviews what its parent reviews.
  assert.deepEqual(selectSpiralSources(sequence, "4-1-group2"), { recent, earlier });
});

test("device history steers the pick toward the lesson the student missed", () => {
  const steered = selectSpiralSources(sequence, "4-1", { missRate: { "3-5": 0.6, "6-2": 0.5, "3-6": 0.1 } });
  assert.equal(steered.recent.id, "3-5");
  assert.equal(steered.earlier.id, "6-2");
});

test("nothing earlier → nothing asked (Unit 1 / course opener)", () => {
  assert.deepEqual(selectSpiralSources(sequence, "1-1"), { recent: null, earlier: null });
  assert.deepEqual(selectSpiralSources(sequence, "2-6"), { recent: null, earlier: null });
  assert.deepEqual(selectSpiralSources(sequence, "1-3"), { recent: null, earlier: null }, "unpaced lesson");
});

test("a lesson's own exit ticket and Connect checks are the item pool", () => {
  const cfg = read("lessons/3-3/config.json");
  const items = spiralItemsFrom(cfg);
  assert.ok(items.length >= 1, "3-3 has portable items");
  assert.ok(items.some((it) => it.source === "exit-ticket"));
  for (const it of items) {
    assert.equal(it.lesson, "3-3");
    assert.ok(Number.isInteger(it.correctIndex) && it.choices[it.correctIndex] != null);
  }
  const connect = items.find((it) => it.source === "connect");
  if (connect) {
    const authored = cfg.connect.check.find((q) => q.stem.trim() === connect.stem);
    assert.equal(connect.correctIndex, Number(authored.answer), "Connect's `answer` becomes correctIndex");
  }
});

test("an item the student missed comes back; a right answer clears it", () => {
  const items = spiralItemsFrom(read("lessons/3-3/config.json"));
  const target = items[items.length - 1];
  recordSpiralAnswer(target, false);
  assert.ok(missedSpiralItems().has(spiralItemKey(target)));
  assert.equal(pickSpiralItem(items, { missed: missedSpiralItems(), seed: "x" }), target);
  recordSpiralAnswer(target, true);
  assert.ok(!missedSpiralItems().has(spiralItemKey(target)));
});

test("saved lesson attempts on this device become a miss rate", () => {
  localStorage.setItem("rma_3-5_ana", JSON.stringify({ totalAttempts: 10, totalCorrect: 4 }));
  assert.deepEqual(lessonMissRates(["3-5", "3-6"], "ana"), { "3-5": 0.6 });
});
