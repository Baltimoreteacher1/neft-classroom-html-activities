import assert from "node:assert/strict";
import { ALL_SKILLS } from "./problem-bank.js";
import { emptyTutor, findSkill, prerequisiteGraph, recordAnswer, sanitizeTutor, skillKey, withSkillEdges } from "./tutor-engine.js";

const skill = findSkill("3:mul-6-9");
assert.ok(skill, "test skill exists");

// Old version-2 backups migrate without losing their evidence or spacing state.
const legacy = sanitizeTutor({
  version: 2,
  records: {
    [skillKey(skill)]: {
      recent: [
        { correct: true, independent: true, level: 1, at: 100 },
        { correct: false, independent: true, level: 1, at: 200 },
        { correct: true, independent: false, level: 0, at: 300 },
      ],
      independentTotal: 9,
      supportedTotal: 2,
      interval: 3,
      dueAt: 500,
      lessonCompleted: true,
    },
  },
});
const migrated = legacy.records[skillKey(skill)];
assert.equal(migrated.independentTotal, 9);
assert.equal(migrated.interval, 3);
assert.equal(migrated.metrics.accuracy.correct, 1);
assert.equal(migrated.metrics.accuracy.total, 2);
assert.equal(migrated.metrics.accuracy.percent, 50);
assert.equal(migrated.metrics.pace.sampleCount, 0);
assert.deepEqual(migrated.metrics.strategyFlexibility.strategies, []);

// Strategy evidence is deduplicated and remains additive to existing records.
recordAnswer(legacy, skill, { correct: true, independent: true, level: 1, strategy: "visual" }, 400);
recordAnswer(legacy, skill, { correct: true, independent: true, level: 1, strategyTags: ["visual", "decomposition", "unknown"] }, 500);
assert.deepEqual(legacy.records[skillKey(skill)].metrics.strategyFlexibility.strategies, ["visual", "decomposition"]);
assert.equal(legacy.records[skillKey(skill)].metrics.strategyFlexibility.count, 2);

// Pace includes calm independent work only; unsupported timing and extremes do not enter the median.
const paced = emptyTutor();
for (const [responseMs, extra] of [
  [1000, {}], [1000, {}], [1000, {}],
  [1000, {}], [1000, {}], [1000, {}],
  [2000, {}], [2000, {}], [2000, {}],
  [2000, {}], [2000, {}], [2000, {}],
]) recordAnswer(paced, skill, { correct: true, independent: true, level: 1, responseMs, ...extra });
recordAnswer(paced, skill, { correct: true, independent: false, level: 0, responseMs: 900 });
recordAnswer(paced, skill, { correct: true, independent: true, level: 1, responseMs: 100 });
recordAnswer(paced, skill, { correct: true, independent: true, level: 1, responseMs: 400_000 });
recordAnswer(paced, skill, { correct: true, independent: true, level: 1, responseMs: 1400, calm: false });
const pace = paced.records[skillKey(skill)].metrics.pace;
assert.equal(pace.sampleCount, 12);
assert.equal(pace.medianResponseMs, 1500);
assert.equal(pace.trend, "more_time", "more time is descriptive and not scored as a mistake");

// Graph metadata is complete, bidirectional, and detached from the shared skill catalog.
for (const node of ALL_SKILLS) {
  const key = skillKey(node);
  assert.ok(Array.isArray(prerequisiteGraph[key]?.prerequisiteSkills), `${key} has prerequisite edges`);
  assert.ok(Array.isArray(prerequisiteGraph[key]?.enrichmentSkills), `${key} has enrichment edges`);
  assert.deepEqual(withSkillEdges(node).prerequisiteSkills, prerequisiteGraph[key].prerequisiteSkills);
  for (const prerequisite of prerequisiteGraph[key].prerequisiteSkills) {
    assert.ok(prerequisiteGraph[prerequisite]?.enrichmentSkills.includes(key), `${prerequisite} points forward to ${key}`);
  }
}
assert.equal(skill.prerequisiteSkills, undefined, "the imported skill catalog stays immutable");
assert.ok(prerequisiteGraph["3:mul-6-9"].prerequisiteSkills.includes("3:mul-0-5"));
assert.ok(prerequisiteGraph["3:mul-0-5"].enrichmentSkills.includes("3:mul-6-9"));

console.log("Fluency metrics migration, strategy flexibility, calm pace, and prerequisite graph passed.");
