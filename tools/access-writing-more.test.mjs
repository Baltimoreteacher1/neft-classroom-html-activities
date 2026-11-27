#!/usr/bin/env node
/**
 * Writing Studio engagement and teaching extras (access-practice-lab/src/views/write.js).
 *   - every quick-write prompt is bilingual, and a picture prompt names a drawing that exists and describes it
 *   - quick writes live in the studio document in a task's shape and never count as task writing
 *   - badges are facts about what a writer did; none can be read as a score, and a new one is named once
 *   - a teacher's focus is one of a fixed list: free text in a link is never shown to a student
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  BADGES,
  FOCUS,
  QUICK,
  GOALS,
  badgeFacts,
  focusFrom,
  goalProgress,
  goalsFor,
  isQuickKey,
  newBadges,
  quickKey,
  quickWrites,
  surpriseTask,
  studioStats,
} from "../access-practice-lab/src/views/write.js";

const lab = new URL("../access-practice-lab/", import.meta.url);
const tasks = JSON.parse(readFileSync(new URL("content/studio/writing.json", lab))).tasks;

test("quick-write prompts are bilingual and their pictures exist with a description", () => {
  assert.ok(QUICK.length >= 12);
  assert.equal(new Set(QUICK.map((p) => p.id)).size, QUICK.length);
  for (const p of QUICK) {
    assert.ok(p.en && p.es && p.en !== p.es, p.id);
    assert.ok(p.en.split(/\s+/).length <= 20, `${p.id}: the prompt is long`);
    assert.ok(!tasks.some((t) => t.id === quickKey(p.id)), `${p.id} collides with a task id`);
    if (!p.pic) continue;
    assert.ok(existsSync(new URL(`pictures/${p.pic}`, lab)), `${p.id}: ${p.pic} is missing`);
    assert.ok(
      p.alt.length > 30 && p.altEs.length > 30 && p.alt !== p.altEs,
      `${p.id}: picture description`,
    );
  }
});

test("a saved quick write is kept in a task's shape and stays out of task totals", () => {
  const studio = {
    writing: {
      [quickKey("kite")]: {
        versions: [{ text: "A girl flew a kite." }],
        updatedAt: "2026-11-02T10:00:00Z",
      },
      [quickKey("place")]: { versions: [], draft: "not saved yet" },
      "wrt-mulch-cer": { versions: [{ text: "Mulch helps.", kind: "draft" }] },
    },
  };
  const saved = quickWrites(studio);
  assert.deepEqual(
    saved.map((s) => [s.prompt.id, s.text]),
    [["kite", "A girl flew a kite."]],
  );
  assert.ok(isQuickKey(quickKey("kite")) && !isQuickKey("wrt-mulch-cer"));
  assert.equal(
    studioStats(
      studio,
      tasks.map((t) => t.id),
    ).started,
    1,
  );
});

test("badges read what the writer did", () => {
  const cer = tasks.find((t) => t.id === "wrt-mulch-cer");
  const none = badgeFacts({ writing: {} }, tasks);
  assert.ok(Object.values(none).every((v) => v === false));
  assert.deepEqual(Object.keys(none).sort(), BADGES.map(([id]) => id).sort());
  const plan = Object.fromEntries(cer.organizer.map((s) => [s.id, "a note"]));
  const studio = {
    writing: {
      [cer.id]: {
        stage: "independent",
        organizer: plan,
        evidence: [{ text: "a" }, { text: "b" }],
        versions: [
          { text: "one", kind: "draft" },
          { text: "one two", kind: "revision" },
        ],
        partner: { glow: "the numbers", wonder: "why" },
        finishedAt: "2026-11-02",
      },
      "not-a-task": { versions: [{ text: "x" }], finishedAt: "x", stage: "independent" },
    },
  };
  const f = badgeFacts(studio, tasks);
  for (const id of ["draft", "reviser", "evidence", "planner", "published", "own", "partner"])
    assert.equal(f[id], true, id);
  for (const id of ["three", "explorer", "quick"]) assert.equal(f[id], false, id);
  delete plan[cer.organizer[0].id];
  assert.equal(badgeFacts(studio, tasks).planner, false);
  assert.deepEqual(
    newBadges(none, f)
      .map(([en]) => en)
      .sort(),
    BADGES.filter(([id]) => f[id])
      .map(([, , en]) => en)
      .sort(),
  );
  assert.deepEqual(newBadges(f, f), []);
});

test("no badge reads as a score or a level", () => {
  for (const [id, , en, es, how, howEs] of BADGES) {
    assert.ok(en && es && how && howEs && how !== howEs, id);
    assert.doesNotMatch(`${en} ${how}`, /score|level|grade|best|perfect|points|streak|fast/i, id);
  }
});

test("surprise prefers a task that is not started", () => {
  const three = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.equal(surpriseTask(three, { writing: { a: {}, c: {} } }, () => 0.99).id, "b");
  assert.equal(surpriseTask(three, { writing: { a: {}, b: {}, c: {} } }, () => 0).id, "a");
  assert.equal(surpriseTask([], { writing: {} }), null);
});

test("a focus in a link is one of a fixed list", () => {
  assert.equal(focusFrom("?grades=6-8&focus=evidence"), "evidence");
  assert.equal(focusFrom("?focus=%3Cb%3Ehello"), "");
  assert.equal(focusFrom("?focus=constructor"), "");
  assert.equal(focusFrom(""), "");
  const used = new Set(tasks.flatMap((t) => (t.revisionPrompts || []).map((p) => p.focus)));
  for (const f of used) assert.ok(FOCUS[f], `tasks use the focus "${f}" but it has no label`);
  for (const [en, es, how, howEs] of Object.values(FOCUS)) assert.ok(en !== es && how !== howEs);
});

test("a chosen goal is checked from the draft, never scored", () => {
  const task = tasks.find((t) => t.id === "wrt-mulch-cer");
  const st = { versions: [] };
  const p = (id, text, state = st) => goalProgress(id, task, state, "guided", text);
  assert.deepEqual(p("sentences", "One. Two. Three. Four."), { now: 4, need: 5, done: false });
  assert.equal(p("sentences", "One. Two. Three. Four. Five.").done, true);
  assert.equal(p("length", "word ".repeat(task.expected.minWords)).done, true);
  assert.equal(p("length", "too short").done, false);
  assert.equal(p("topic", "Erosion and runoff and mulch.").done, true);
  assert.equal(p("topic", "Erosion only.").done, false);
  assert.equal(p("number", "It lost 410 grams.").done, true);
  assert.equal(p("number", "It said “mulch helps”.").done, true);
  assert.equal(p("number", "No numbers here.").done, false);
  assert.deepEqual(p("reasons", "It works because rain hits chips, so soil stays."), {
    now: 2,
    need: 2,
    done: true,
  });
  assert.equal(p("revise", "", { versions: [{ kind: "draft" }] }).done, false);
  assert.equal(p("revise", "", { versions: [{ kind: "draft" }, { kind: "revision" }] }).done, true);
  assert.equal(p("unknown", "x").done, false);
  for (const g of GOALS) {
    assert.ok(g.en && g.es && g.en !== g.es, g.id);
    assert.doesNotMatch(g.en, /score|level|grade|perfect|points|streak|fast/i, g.id);
  }
  const own = goalsFor("independent").map((g) => g.id);
  assert.ok(!own.includes("topic"), "on my own offers no topic-word goal");
  assert.ok(own.length >= 4);
});
