// Grades 6-8 publisher pass: the added Listening, Speaking and Writing activities and the added Reading Room
// lessons are built from specs, current on disk, and keep the lab's content rules.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  LESSON_PREFIX,
  mergeDomain,
  PREFIX,
  STRAND_SUFFIX,
  staleG68Files,
} from "./build-access-g68-content.mjs";
import { lintLessons, lintSpecs } from "./lib/access-g68-lint.mjs";
import { allActivities, CONTENT_DIR, loadBand } from "./lib/access-lab-content.mjs";

const DOMAINS = ["Listening", "Speaking", "Writing"];
const specs = {};
for (const d of DOMAINS) specs[d] = await loadSpecsFor(d.toLowerCase());
const lessons = await loadSpecsFor("reading");
async function loadSpecsFor(kind) {
  const { loadSpecs } = await import("./build-access-g68-content.mjs");
  return loadSpecs(kind);
}
const bank = new Map(
  allActivities()
    .filter((x) => x.band === "6-8")
    .map((x) => [x.activity.id, x]),
);
const doc = JSON.parse(readFileSync(join(CONTENT_DIR, "reading-room", "lessons.json"), "utf8"));
const built = doc.lessons.filter((l) => l.id.startsWith(LESSON_PREFIX));
const clock = /\b(timer|countdown|stopwatch|seconds? left|race the clock|beat the clock)\b/i;

test("the built files match the specs and the build is idempotent", async () => {
  assert.deepEqual(await staleG68Files(), []);
  for (const d of DOMAINS) {
    const data = loadBand("6-8").find((f) => f.domain === d).data;
    assert.deepEqual(mergeDomain(data, d, specs[d]), data, `${d} merge is a no-op on built data`);
  }
});

test("the specs pass lint, and the lint catches the defects it exists for", () => {
  const all = DOMAINS.flatMap((d) => specs[d].map((s) => ({ ...s, domain: d })));
  assert.deepEqual(lintSpecs(all), []);
  assert.deepEqual(lintLessons(lessons), []);
  const sample = all.find((s) => s.type === undefined && s.domain === "Listening");
  const broken = { ...sample, opts: [sample.opts[0], "short", "tiny"], why: ["Nope.", "No."] };
  assert.ok(
    lintSpecs([broken]).some((p) => /why|longest/.test(p)),
    "a thin distractor note or a length cue fails",
  );
  assert.ok(
    lintSpecs([{ ...sample, es: ["x", sample.dir] }]).some((p) => /not translated/.test(p)),
  );
  assert.ok(
    lintSpecs([{ ...sample, q: `${sample.q} Beat the clock.` }]).some((p) => /timer/.test(p)),
  );
  assert.ok(
    lintLessons([{ ...lessons[0], qs: lessons[0].qs.slice(0, 3) }]).some((p) => /5-7/.test(p)),
  );
});

test("every domain gained activities at every level and each added id lives in the bank once", () => {
  for (const d of DOMAINS) {
    assert.equal(
      new Set(specs[d].map((s) => s.id)).size,
      specs[d].length,
      `${d} spec ids are unique`,
    );
    for (const lk of ["A", "B", "C"])
      assert.ok(specs[d].filter((s) => s.level === lk).length >= 4, `${d} ${lk} has added specs`);
    for (const s of specs[d]) assert.ok(bank.has(`${PREFIX}${s.id}`), s.id);
  }
  assert.ok(built.length >= lessons.length && lessons.length >= 10);
  assert.equal(new Set(built.map((l) => l.id)).size, built.length);
});

test("added bank activities carry the contract, Spanish, answer keys and distractor notes", () => {
  const guide = JSON.parse(readFileSync(join(CONTENT_DIR, "es-guide.json"), "utf8")).activities;
  for (const d of DOMAINS)
    for (const s of specs[d]) {
      const id = `${PREFIX}${s.id}`;
      const { activity: a, level } = bank.get(id);
      for (const f of [
        "title",
        "skill",
        "directions",
        "prompt",
        "hint",
        "correct",
        "support",
        "extension",
        "teacher",
        "wida",
      ])
        assert.ok(a[f], `${id} ${f}`);
      assert.ok(
        a.vocabulary.length >= 2 && a.vocabulary.every((v) => /^[^:]+:\s*\S/.test(v[2])),
        `${id} Spanish glosses`,
      );
      assert.ok(guide[id]?.skill && guide[id]?.directions, `${id} Spanish goal and directions`);
      const data = loadBand("6-8").find((f) => f.domain === d).data;
      assert.ok(
        data.levels[level].categories.some(
          (c) => c.id.endsWith(STRAND_SUFFIX) && c.activityIds.includes(id),
        ),
        `${id} strand`,
      );
      if (a.type === "multipleChoice" || a.type === "multiSelect") {
        const keys = a.type === "multiSelect" ? a.answers : [a.answer];
        const wrong = a.options.filter((o) => !keys.includes(o.id));
        assert.deepEqual(
          Object.keys(a.distractorFeedback).sort(),
          wrong.map((o) => o.id).sort(),
          `${id} explains every wrong option`,
        );
        for (const note of Object.values(a.distractorFeedback))
          assert.ok(note.split(/\s+/).length >= 5, `${id} note`);
      }
      if (a.type === "constructed") {
        assert.ok(
          a.models.A && a.models.B && a.models.C && a.successCriteria.length >= 3,
          `${id} models and criteria`,
        );
      }
      assert.doesNotMatch(
        JSON.stringify([a.directions, a.prompt, a.hint, a.support, a.script]),
        clock,
        id,
      );
    }
});

test("added Reading Room lessons have Spanish family support, keys, per-choice notes and the required question mix", () => {
  for (const l of built) {
    assert.equal(l.gradeCluster, "6-8");
    assert.ok(["A", "B", "C"].includes(l.supportLevel), l.id);
    assert.ok(
      l.familySupport.directions.en &&
        l.familySupport.directions.es &&
        l.familySupport.directions.en !== l.familySupport.directions.es,
      l.id,
    );
    assert.ok(
      l.vocabulary.length >= 3 && l.vocabulary.every((v) => v.spanish),
      `${l.id} vocabulary Spanish`,
    );
    assert.ok(
      l.activities.length >= 6 && l.activities.length <= 8,
      `${l.id} has ${l.activities.length} tasks`,
    );
    assert.ok(
      l.activities.some((a) => a.type === "short") && l.activities.some((a) => a.id === "transfer"),
      l.id,
    );
    for (const a of l.activities.filter((x) => x.type === "choice" || x.type === "multi")) {
      const keys = a.answerId ? [a.answerId] : a.answerIds;
      assert.ok(
        a.choices.length >= 3 && keys.every((k) => a.choices.some((c) => c.id === k)),
        `${l.id}/${a.id}`,
      );
      for (const c of a.choices)
        assert.equal(
          Boolean(c.why),
          !keys.includes(c.id),
          `${l.id}/${a.id}/${c.id} note on wrong choices only`,
        );
    }
    assert.doesNotMatch(JSON.stringify([l.paragraphs, l.beforeReading]), clock, l.id);
  }
});

test("the answer position of added multiple-choice items is spread over the positions", () => {
  for (const d of DOMAINS) {
    const items = specs[d].filter(
      (s) =>
        (s.type || (d === "Listening" ? "multipleChoice" : "constructed")) === "multipleChoice",
    );
    if (items.length < 8) continue;
    const counts = [0, 0, 0, 0];
    for (const s of items) {
      const a = bank.get(`${PREFIX}${s.id}`).activity;
      counts[a.options.findIndex((o) => o.id === a.answer)]++;
    }
    assert.ok(Math.max(...counts) / items.length <= 0.5, `${d}: ${counts}`);
  }
});
