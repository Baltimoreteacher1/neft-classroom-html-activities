import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  FLUENCY_ROOT,
  fluencyHref,
  fluencyLaunch,
  fluencyReturn,
} from "../access-practice-lab/src/mls/fluency-launch.js";
import {
  fluencyForGrade,
  studioSkillsForFluency,
} from "../access-practice-lab/src/mls/fluency-map.js";

test("every active source has a safe direct launch with the route's exact grade", () => {
  let total = 0;
  for (let grade = 0; grade <= 8; grade++) {
    for (const skill of fluencyForGrade(grade)) {
      total++;
      const studio = studioSkillsForFluency(grade, skill.id)[0];
      const config = fluencyLaunch(grade, skill.id, {
        studio,
        grades: "6-8",
        stage: "model",
        support: "more",
        level: 3,
        lang: "bi",
        seed: 4294967295,
      });
      assert.equal(config.grade, grade);
      assert.equal(config.level, 3);
      assert.equal(config.seed, 4294967295);
      assert.equal(config.lang, "bi");
      assert.equal(config.support, "more");
      assert.match(
        fluencyReturn(config),
        /^\/access-practice-lab\/math-literacy\/(?:skill\/g[1-8]-[a-z]+\?|teach\?)/,
      );
      assert.ok(
        fluencyHref(grade, skill.id, config).startsWith(
          `${FLUENCY_ROOT}/fluency/${grade}/${skill.id}?`,
        ),
      );
    }
  }
  assert.ok(total > 100);
  assert.equal(fluencyLaunch(2, "ratios"), null);
  assert.equal(fluencyLaunch("02", "place-1000"), null);
});

test("launch settings are allowlisted, and family returns require a verified mapping", () => {
  const request = {
    studio: "g8.functions",
    stage: "unknown",
    level: 81,
    seed: "1e6",
    support: "invalid",
    from: "family",
    learnerId: "private",
    response: "private",
    answer: "private",
    return: "https://example.com",
  };
  const config = fluencyLaunch(6, "ratios", request);
  const url = fluencyHref(6, "ratios", request);
  assert.equal(config.studio, "");
  assert.equal(config.stage, "practice");
  assert.equal(config.level, 2);
  assert.equal(config.seed, 1);
  assert.doesNotMatch(url, /example|private|from=|learner|answer|response/);
  assert.match(fluencyReturn(config), /\/teach\?grade=6&/);
  const family = fluencyLaunch(6, "ratios", { studio: "g6.ratios", from: "family", lang: "es" });
  assert.equal(family.count, 3);
  assert.equal(fluencyReturn(family), `${FLUENCY_ROOT}/family/g6-ratios?lang=es`);
});

test("both teacher entry pages offer the two direct choices", () => {
  for (const path of ["access-teacher/index.html", "access-teacher/classroom/index.html"]) {
    const page = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
    const nav = page.match(/<nav[^>]+aria-label="Teacher programs"[\s\S]*?<\/nav>/)?.[0];
    assert.ok(nav, path);
    assert.equal((nav.match(/<a /g) ?? []).length, 2, path);
    assert.match(nav, /href="\/bcpss-teachers\/"[\s\S]*I'm a BCPSS Teacher/);
    assert.match(nav, /href="\/access-practice-lab\/math-literacy"[\s\S]*Math Literacy Studio/);
  }
});

test("the race stage needs the generated race capability and returns to the same practice focus", () => {
  let raced = 0;
  let fallback = 0;
  for (let grade = 0; grade <= 8; grade++) {
    for (const skill of fluencyForGrade(grade)) {
      const stage = fluencyLaunch(grade, skill.id, { stage: "game" }).stage;
      if (skill.capabilities.race) {
        raced++;
        assert.equal(stage, "game", `${grade}:${skill.id}`);
        assert.match(fluencyHref(grade, skill.id, { stage: "game" }), /[?&]stage=game(&|$)/);
      } else {
        fallback++;
        assert.equal(stage, "practice", `${grade}:${skill.id}`);
      }
    }
  }
  assert.ok(raced > 0 && fallback > 0, "both race and fallback skills exist");
  const config = fluencyLaunch(6, "ratios", { studio: "g6.ratios", lang: "es" });
  assert.match(fluencyReturn(config), /\/skill\/g6-ratios\?.*focus=ratios(&|$)/);
  assert.doesNotMatch(fluencyReturn(fluencyLaunch(6, "ratios", {})), /focus=/);
});
