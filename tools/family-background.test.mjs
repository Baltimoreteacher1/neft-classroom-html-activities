// Background knowledge (data/family-background/<lesson>.json): every file passes its contract
// (tools/lib/family-background.mjs: 1-2 skills, bilingual, word limits, an answer recomputed exactly), and every
// lesson in Units 2-9 with a family homework page has one (Units 1 and 10 are not taught).
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { LESSONS_DIR, lessonPath } from "./lib/curriculum-source.mjs";
import { baseLessonOf, checkBackground } from "./lib/family-background.mjs";

const ROOT = new URL("../", import.meta.url);
const dir = new URL("data/family-background/", ROOT);
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));

test("every background file passes its contract", () => {
  const errors = files.flatMap((f) => {
    const id = f.replace(/\.json$/, "");
    return checkBackground(JSON.parse(readFileSync(new URL(f, dir), "utf8")), id);
  });
  assert.deepEqual(errors, []);
});

test("the contract rejects a wrong answer key, a copied translation and a broken calc", () => {
  const good = JSON.parse(readFileSync(new URL("6-10.json", dir), "utf8"));
  const bad = structuredClone(good);
  bad.skills[0].check.correctIdx = 1;
  bad.skills[1].why.es = bad.skills[1].why.en;
  bad.skills[1].check.calc.value = "3/8";
  const errors = checkBackground(bad, "6-10").join("\n");
  assert.match(errors, /does not show 7\/4/);
  assert.match(errors, /copy of the English/);
  assert.match(errors, /is not 3\/8/);
});

test("every Unit 2-9 lesson with a family homework page has background knowledge", () => {
  const lessons = readdirSync(LESSONS_DIR)
    .map(baseLessonOf)
    .filter((id) => id && Number(id.split("-")[0]) >= 2 && Number(id.split("-")[0]) <= 9);
  const pages = [...new Set(lessons)].filter((id) => {
    try {
      readFileSync(lessonPath(id, "homework.html"));
      return true;
    } catch {
      return false;
    }
  });
  const have = new Set(files.map((f) => f.replace(/\.json$/, "")));
  assert.ok(pages.length >= 70, `found ${pages.length} lessons`);
  assert.deepEqual(
    pages.filter((id) => !have.has(id)),
    [],
    "lessons with no background file",
  );
});
