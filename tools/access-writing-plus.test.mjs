#!/usr/bin/env node
/**
 * Writing Studio, the parts around the draft (access-practice-lab/src/views/write.js).
 *   - progress status and totals are counts of what is saved, taken from the studio document
 *   - the task filter matches on subject, language purpose, status and every search word
 *   - a frame dropped into a draft gets the spaces a writer would type and its first blank selected
 *   - "on my own" gets a proofreading check that names no part of the response, so an independent
 *     attempt stays independent; every other check has Spanish that is not a copy of the English
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CONNECTORS,
  cardData,
  checksFor,
  cheer,
  draftStats,
  insertion,
  matches,
  planText,
  resumeTask,
  stuckStep,
  topicWordsUsed,
  studioStats,
  tableSeries,
  taskStatus,
} from "../access-practice-lab/src/views/write.js";

const tasks = JSON.parse(
  readFileSync(new URL("../access-practice-lab/content/studio/writing.json", import.meta.url)),
).tasks;

test("status follows what the writer has saved", () => {
  assert.equal(taskStatus(undefined).id, "new");
  assert.equal(taskStatus({ versions: [], organizer: {} }).id, "new");
  assert.equal(taskStatus({ versions: [], organizer: { claim: "Mulch helps." } }).id, "draft");
  assert.deepEqual(taskStatus({ versions: [], draft: "Mulch protects soil." }), {
    id: "draft",
    words: 3,
  });
  assert.equal(taskStatus({ versions: [{ text: "one two", kind: "draft" }] }).id, "feedback");
  assert.equal(
    taskStatus({ versions: [{ text: "one two" }], finishedAt: "2026-11-01" }).id,
    "done",
  );
});

test("totals count pieces, words and revisions and nothing else", () => {
  const studio = {
    writing: {
      a: {
        versions: [
          { text: "one two", kind: "draft" },
          { text: "one two three", kind: "revision" },
        ],
        finishedAt: "x",
      },
      b: { versions: [], draft: "four words are here" },
      c: { versions: [], organizer: {} },
    },
  };
  assert.deepEqual(studioStats(studio, ["a", "b", "c", "missing"]), {
    started: 2,
    finished: 1,
    words: 7,
    revisions: 1,
  });
});

test("resume picks the unfinished piece touched last", () => {
  const studio = {
    writing: {
      a: { versions: [], draft: "old", updatedAt: "2026-11-01T10:00:00Z" },
      b: { versions: [{ text: "new" }], updatedAt: "2026-11-02T10:00:00Z" },
      c: { versions: [{ text: "done" }], finishedAt: "x", updatedAt: "2026-11-03T10:00:00Z" },
    },
  };
  assert.equal(resumeTask(studio, [{ id: "a" }, { id: "b" }, { id: "c" }]).task.id, "b");
  assert.equal(resumeTask({ writing: {} }, [{ id: "a" }]), null);
});

test("the filter narrows real tasks and an empty filter keeps them all", () => {
  const cards = tasks.filter((t) => t.band === "6-8").map((t) => cardData(t, { id: "new" }));
  const none = { q: "", subject: "", use: "", status: "" };
  assert.equal(cards.filter((c) => matches(c, none)).length, cards.length);
  const science = cards.filter((c) => matches(c, { ...none, subject: "Science" }));
  assert.ok(science.length > 0 && science.length < cards.length);
  assert.ok(science.every((c) => c.subject === "Science"));
  assert.ok(
    cards
      .filter((c) => matches(c, { ...none, q: "MULCH soil" }))
      .some((c) => c.wrt === "wrt-mulch-cer"),
  );
  assert.equal(cards.filter((c) => matches(c, { ...none, q: "zzzz" })).length, 0);
  assert.equal(cards.filter((c) => matches(c, { ...none, status: "done" })).length, 0);
});

test("a frame goes in with a writer's spacing and its first blank selected", () => {
  const frame = "I claim that mulch ___ erosion.";
  const empty = insertion("", 0, 0, frame);
  assert.equal(empty.value, frame);
  assert.equal(empty.value.slice(empty.selStart, empty.selEnd), "___");
  const after = insertion("First.", 6, 6, "because");
  assert.equal(after.value, "First. because");
  assert.equal(after.selStart, after.value.length);
  const middle = insertion("Soil washed away.", 4, 4, "quickly");
  assert.equal(middle.value, "Soil quickly washed away.");
  assert.equal(insertion("It rained", 9, 9, "because").value, "It rained because");
  assert.equal(insertion("It rained .", 10, 10, "hard").value, "It rained hard.");
});

test("draft counts", () => {
  assert.deepEqual(draftStats(""), { words: 0, sentences: 0, paragraphs: 0 });
  assert.deepEqual(draftStats("One here. Two here.\n\nThree here."), {
    words: 6,
    sentences: 3,
    paragraphs: 2,
  });
});

test("the self-check is bilingual, and on my own it names no part of the response", () => {
  const forms = [...new Set(tasks.map((t) => t.form))];
  for (const form of forms) {
    const items = checksFor({ form }, "guided");
    assert.ok(items.length >= 3, form);
    assert.equal(new Set(items.map(([id]) => id)).size, items.length, form);
    for (const [, en, es] of items) {
      assert.ok(en && es && en !== es, `${form}: ${en}`);
      assert.ok(en.split(/\s+/).length <= 14, `${form}: "${en}" is long for a check`);
    }
  }
  const own = checksFor({ form: "cer" }, "independent");
  assert.deepEqual(own, checksFor({ form: "narrative" }, "independent"));
  for (const [, en] of own)
    assert.doesNotMatch(en, /claim|evidence|reason|main idea|topic|beginning|conclusion|greet/i);
});

test("a table becomes a picture only when it is plain numbers in one unit", () => {
  const mulch = tasks.find((t) => t.id === "wrt-mulch-cer").sources.find((x) => x.table).table;
  const d = tableSeries(mulch);
  assert.equal(d.max, 430);
  assert.deepEqual(d.cols, ["Bare soil", "Soil covered with mulch"]);
  assert.deepEqual(
    d.rows[0].values.map((v) => v.text),
    ["410 grams", "95 grams"],
  );
  assert.equal(
    tableSeries({
      headers: ["Plan", "A", "B"],
      rows: [
        ["Fee", "$0", "$18"],
        ["Rides", "4", "9"],
      ],
    }),
    null,
  );
  assert.equal(
    tableSeries({ headers: ["Place", "Surface", "Heat"], rows: [["Lot", "Asphalt", "98°F"]] }),
    null,
  );
  assert.equal(tableSeries({ headers: ["Trial", "Soil"], rows: [["1", "about 400 grams"]] }), null);
  // every table in the bank either draws exactly its own cells or is left as a table
  for (const t of tasks)
    for (const src of t.sources || []) {
      if (!src.table) continue;
      const s = tableSeries(src.table);
      if (s)
        assert.deepEqual(
          s.rows.map((r) => r.values.map((v) => v.text)),
          src.table.rows.map((r) => r.slice(1).map((c) => String(c).trim())),
          t.id,
        );
    }
});

test("use my plan gives back the writer's own notes, in plan order", () => {
  const task = { organizer: [{ id: "claim" }, { id: "evidence" }, { id: "reasoning" }] };
  assert.equal(
    planText(task, { organizer: { evidence: " 410 grams ", claim: "mulch helps" } }),
    "mulch helps 410 grams",
  );
  assert.equal(planText(task, { organizer: {} }), "");
});

test("help follows the step, and encouragement describes length only", () => {
  assert.equal(stuckStep({ organizer: {}, evidence: [] }, "", false), "read");
  assert.equal(stuckStep({ organizer: {}, evidence: [{ text: "x" }] }, "", false), "plan");
  assert.equal(stuckStep({ organizer: { claim: "x" } }, "", false), "write");
  assert.equal(stuckStep({ organizer: {} }, "one two three four", true), "revise");
  assert.deepEqual(cheer(0, 70), ["", ""]);
  const lines = [5, 20, 50, 70].map((n) => cheer(n, 70)[0]);
  assert.equal(new Set(lines).size, 4);
  for (const n of [5, 20, 50, 70]) {
    const [en, es] = cheer(n, 70);
    assert.ok(en && es && en !== es);
    assert.doesNotMatch(en, /score|level|grade|correct|perfect/i);
  }
});

test("connecting words are grouped by what they do, each with Spanish", () => {
  const seen = new Set();
  for (const [en, es, words] of CONNECTORS) {
    assert.ok(en && es && en !== es);
    assert.ok(words.length >= 2);
    for (const [w, g] of words) {
      assert.ok(w && g, w);
      assert.ok(!seen.has(w), `${w} is listed twice`);
      seen.add(w);
    }
  }
});

test("topic words count a term once its words are used, with common endings", () => {
  const vocab = [
    { term: "erosion" },
    { term: "runoff" },
    { term: "bare soil" },
    { term: "trial" },
    { term: "slope" },
  ];
  assert.deepEqual(
    topicWordsUsed(
      vocab,
      "Erosion happened. The runoffs were big in two trials on the bare soils.",
    ),
    ["erosion", "runoff", "bare soil", "trial"],
  );
  assert.deepEqual(topicWordsUsed(vocab, "The soil was bare."), []);
  assert.deepEqual(topicWordsUsed(vocab, "slopes and slope"), ["slope"]);
  assert.deepEqual(topicWordsUsed(vocab, ""), []);
  for (const t of tasks)
    for (const v of t.vocab || [])
      assert.deepEqual(
        topicWordsUsed([v], `We wrote ${v.term} here.`),
        [v.term],
        `${t.id}: ${v.term}`,
      );
});

test("speech to text has a learner-facing support name", async () => {
  const { supportsUsed } = await import("../access-practice-lab/src/lang/ledger.js");
  assert.deepEqual(supportsUsed({ supports: { dictation: true, coach: false } }), [
    "speech to text",
  ]);
});

test("the Writing Studio stylesheet URL carries the hash of its current bytes", async () => {
  const { createHash } = await import("node:crypto");
  const css = readFileSync(new URL("../access-practice-lab/write-studio.css", import.meta.url));
  const src = readFileSync(new URL("../access-practice-lab/src/views/write.js", import.meta.url), "utf8");
  const pinned = /WRITE_STYLES_VERSION = "([0-9a-f]{12})"/.exec(src)?.[1];
  assert.equal(
    pinned,
    createHash("sha256").update(css).digest("hex").slice(0, 12),
    "write-studio.css changed: set WRITE_STYLES_VERSION in src/views/write.js to the first 12 hex of its sha256",
  );
});
