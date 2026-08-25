import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildFamilyWeekNote } from "../curriculum/family-connections/shared/family-week-note.js";
import { buildFamilyWeekNotes, serialize } from "../scripts/generate-family-week-notes.mjs";

const committed = await readFile(
  new URL("../data/family-week-notes.json", import.meta.url),
  "utf8",
);
const bank = JSON.parse(committed);

test("the committed bank is what the generator would write", async () => {
  assert.equal(
    serialize(await buildFamilyWeekNotes()),
    committed,
    "data/family-week-notes.json is stale — run `npm run generate:family-week-notes`",
  );
});

test("every lesson carries real Spanish, never a half-filled pair", () => {
  const ids = Object.keys(bank.lessons);
  assert.ok(ids.length >= 84, `expected the full lesson set, got ${ids.length}`);
  for (const [id, entry] of Object.entries(bank.lessons)) {
    for (const field of ["bigIdea", "learning"]) {
      if (!entry[field]) continue;
      assert.ok(entry[field].en?.trim(), `${id}.${field} is missing English`);
      assert.ok(entry[field].es?.trim(), `${id}.${field} is missing Spanish`);
      assert.notEqual(
        entry[field].en,
        entry[field].es,
        `${id}.${field}: the Spanish lane is a copy of the English one`,
      );
    }
    for (const term of entry.vocabulary ?? []) {
      assert.ok(term.en?.trim() && term.es?.trim(), `${id}: a vocabulary pair is half empty`);
    }
  }
});

test("a posted week writes a parallel note in both languages", () => {
  const days = [
    { day: "Monday", status: "lesson", lessonId: "3-1" },
    { day: "Tuesday", status: "lesson", lessonId: "3-1" },
    { day: "Wednesday", status: "lesson", lessonId: "3-2" },
    { day: "Thursday", status: "review", lessonId: "" },
    { day: "Friday", status: "no-class", lessonId: "" },
  ];
  const note = buildFamilyWeekNote(days, bank);
  assert.deepEqual(note.lessonIds, ["3-1", "3-2"], "a lesson taught twice is named once");
  assert.equal(note.missing.length, 0);
  assert.match(note.en, /^This week in math we are working with /);
  assert.match(note.es, /^Esta semana en matemáticas estamos trabajando con /);
  assert.match(note.en, /Ask your student to show you one example/);
  assert.match(note.es, /Pídale a su estudiante que le muestre un ejemplo/);
  assert.doesNotMatch(note.es, /This week|Ask your student/, "English must not leak into Spanish");
  assert.ok(note.en.length <= 500 && note.es.length <= 500);
});

test("every week of every lesson stays inside the published note limit", () => {
  const ids = Object.keys(bank.lessons);
  for (let index = 0; index + 4 < ids.length; index += 1) {
    const days = ids.slice(index, index + 5).map((lessonId, day) => ({
      day: String(day),
      status: "lesson",
      lessonId,
    }));
    const note = buildFamilyWeekNote(days, bank);
    assert.ok(note.en.length <= 500, `EN note too long for ${days.map((d) => d.lessonId)}`);
    assert.ok(note.es.length <= 500, `ES note too long for ${days.map((d) => d.lessonId)}`);
    assert.equal(Boolean(note.en), Boolean(note.es), "both lanes exist or neither does");
  }
});

test("a flagship lesson reuses its base lesson's curated notes", () => {
  const note = buildFamilyWeekNote(
    [{ day: "Monday", status: "lesson", lessonId: "3-1-flagship" }],
    bank,
  );
  assert.equal(note.missing.length, 0);
  assert.ok(note.es.length > 40);
});

test("a week with no posted lesson writes nothing rather than guessing", () => {
  const note = buildFamilyWeekNote([{ day: "Monday", status: "review", lessonId: "" }], bank);
  assert.equal(note.en, "");
  assert.equal(note.es, "");
});

test("an uncurated lesson is reported, not silently skipped", () => {
  const note = buildFamilyWeekNote(
    [
      { day: "Monday", status: "lesson", lessonId: "3-1" },
      { day: "Tuesday", status: "lesson", lessonId: "99-9" },
    ],
    bank,
  );
  assert.deepEqual(note.missing, ["99-9"]);
  assert.ok(note.en && note.es, "the curated lesson still produces a note");
});
