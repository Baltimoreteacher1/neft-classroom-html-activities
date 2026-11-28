import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  fluencyHref,
  fluencyLaunch,
  fluencyReturn,
} from "../access-practice-lab/src/mls/fluency-launch.js";
import {
  fluencyForGrade,
  fluencyForSkill,
  getFluencyMapping,
  studioSkillsForFluency,
} from "../access-practice-lab/src/mls/fluency-map.js";
import {
  practiceProblem,
  sourceSkill,
  validateAnswer as validateStudio,
} from "../access-practice-lab/src/mls/fluency-problems.js";
import {
  ALL_SKILLS,
  generateProblem,
  seededRandom,
  validateAnswer as validateSource,
} from "../math/fluency-lab/problem-bank.js";

const report = JSON.parse(
  readFileSync(new URL("../docs/math-literacy/fluency-inventory.json", import.meta.url), "utf8"),
);
const inventory = JSON.parse(
  readFileSync(
    new URL("../access-practice-lab/content/mls/inventory.json", import.meta.url),
    "utf8",
  ),
);
const key = ({ grade, id }) => `${grade}:${id}`;

test("every active grade and skill has one launch and all mapping relationships are reversible", () => {
  const sourceKeys = ALL_SKILLS.map(key).sort();
  assert.deepEqual(report.sourceSkills.map(key).sort(), sourceKeys);
  assert.deepEqual(
    inventory.skills.map(({ id }) => id).sort(),
    report.destinationSkills.map(({ id }) => id).sort(),
  );
  const destById = new Map(inventory.skills.map((skill) => [skill.id, skill]));
  for (let grade = 0; grade <= 8; grade += 1) {
    const active = fluencyForGrade(grade);
    const expected = ALL_SKILLS.filter((skill) => skill.grade === grade);
    assert.deepEqual(active.map(key), expected.map(key));
    assert.equal(active.length, report.countsByGrade[grade].source);
    const catalog = fluencyForGrade(grade, { unmatchedOnly: true });
    assert.equal(catalog.length, report.countsByGrade[grade].catalogOnly);
    for (const item of active) {
      assert.equal(getFluencyMapping(grade, item.id), item);
      assert.equal(sourceSkill(grade, item.id)?.title, item.title);
      assert.ok(
        fluencyHref(grade, item.id).startsWith(
          `/access-practice-lab/math-literacy/fluency/${grade}/${item.id}?`,
        ),
      );
      for (const foundation of item.prerequisites)
        assert.ok(getFluencyMapping(foundation.grade, foundation.id));
      const ids = studioSkillsForFluency(grade, item.id);
      if (ids.length === 0)
        assert.ok(report.sourceSkills.find((row) => key(row) === key(item)).catalogOnlyReason);
      for (const id of ids) {
        assert.equal(destById.get(id).grade, grade);
        assert.ok(fluencyForSkill(id).includes(item));
      }
    }
  }
  for (const row of report.destinationSkills)
    assert.deepEqual(
      fluencyForSkill(row.id).map(key),
      row.fluency.map((ref) => ref.key),
    );
  assert.deepEqual(
    fluencyForSkill("g6.ratios").map(({ id }) => id),
    ["ratios"],
  );
  assert.deepEqual(
    fluencyForSkill("g6.percents").map(({ id }) => id),
    ["percent", "percent-whole"],
  );
  assert.deepEqual(studioSkillsForFluency(8, "compare-functions"), ["g8.functions", "g8.slope"]);
  assert.equal(getFluencyMapping(6, "fraction-compare"), null);
  assert.deepEqual(fluencyForSkill("constructor"), []);
});

test("standard Studio practice is byte-for-byte source practice for seeded questions and checks", () => {
  for (const skill of ALL_SKILLS) {
    for (let n = 1; n <= 12; n += 1) {
      const seed = n * 431;
      const source = generateProblem(skill, seededRandom(seed));
      const studio = practiceProblem(sourceSkill(skill.grade, skill.id), seed, 2);
      assert.deepEqual(studio, source, `${key(skill)} at seed ${seed}`);
      assert.ok(
        source.answers.some((answer) => validateStudio(answer, studio)),
        `${key(skill)} at seed ${seed} must be answerable`,
      );
      assert.equal(validateStudio("", studio), false);
      for (const answer of [
        ...source.answers,
        ...(source.choices || []),
        "not an answer",
        "0",
        "1/2",
      ]) {
        assert.equal(
          validateStudio(answer, studio),
          validateSource(answer, source),
          `${key(skill)} at seed ${seed}`,
        );
      }
    }
  }
});

test("launch links preserve exact grade and safe return and strip private fields", () => {
  const href = fluencyHref("2", "add-100", {
    studio: "g2.addsub",
    stage: "model",
    level: 1,
    support: "extension",
    lang: "es",
    seed: 340,
    grades: "6-8",
    return: "https://example.com/",
    answers: "private learner answer",
    teacherKey: true,
  });
  const url = new URL(href, "https://thelanguagepage.com");
  assert.equal(url.pathname, "/access-practice-lab/math-literacy/fluency/2/add-100");
  assert.deepEqual([...url.searchParams.keys()].sort(), [
    "lang",
    "level",
    "seed",
    "stage",
    "studio",
    "support",
  ]);
  const config = fluencyLaunch("2", "add-100", Object.fromEntries(url.searchParams));
  assert.equal(config.grade, 2);
  assert.equal(config.level, 1);
  assert.equal(config.support, "extension");
  assert.equal(config.lang, "es");
  assert.equal(config.stage, "model");
  assert.equal(config.seed, 340);
  assert.match(fluencyReturn(config), /^\/access-practice-lab\/math-literacy\/skill\/g2-addsub\?/);

  const foreign = fluencyLaunch(2, "add-100", { studio: "g6.ratios", from: "family" });
  assert.match(fluencyReturn(foreign), /^\/access-practice-lab\/math-literacy\/teach\?/);
  assert.equal(foreign.resume, true);
  assert.equal(fluencyLaunch("02", "add-100"), null);
  assert.equal(fluencyLaunch(6, "add-100"), null);
  const family = fluencyLaunch("6", "ratios", { studio: "g6.ratios", from: "family", lang: "es" });
  assert.equal(
    fluencyReturn(family),
    "/access-practice-lab/math-literacy/family/g6-ratios?lang=es",
  );
  assert.equal(family.resume, false);
  assert.equal(family.count, 3);
});
