// Grade → Topic → Skill hierarchy audit and the five-stage path. Every skill must be reachable, exactly once,
// under one consistent topic name, and no skill id, grade or URL may change.

import assert from "node:assert/strict";
import { ALL_SKILLS, GRADES } from "../math/fluency-lab/problem-bank.js";
import {
  DOMAINS,
  nextSkillAfter,
  STAGE_MODE,
  STAGES,
  skillPath,
  stageAfter,
  stageOfMode,
  TOPICS,
  topicIdFor,
  topicsFor,
  validLastVisit,
} from "../math/fluency-lab/skill-path.js";
import { TOTAL_SKILLS } from "./lib/fluency-skill-count.mjs";

assert.equal(ALL_SKILLS.length, TOTAL_SKILLS, `the lab still has ${TOTAL_SKILLS} skills`);

// Every skill belongs to exactly one topic of its own grade, and every topic names a real domain.
const domains = new Set(DOMAINS.map((domain) => domain.id));
for (const topic of TOPICS) assert.ok(domains.has(topic.domain), `${topic.id} has a real domain`);
assert.equal(new Set(TOPICS.map((topic) => topic.id)).size, TOPICS.length, "topic ids are unique");
assert.equal(
  new Set(TOPICS.map((topic) => topic.name)).size,
  TOPICS.length,
  "topic labels are unique",
);

let reachable = 0;
for (const grade of GRADES) {
  const topics = topicsFor(grade.grade);
  const seen = topics.flatMap((topic) => topic.skills.map((skill) => skill.id));
  assert.equal(seen.length, new Set(seen).size, `${grade.label}: no skill listed under two topics`);
  assert.deepEqual(
    [...seen].sort(),
    grade.skills.map((skill) => skill.id).sort(),
    `${grade.label}: every skill is discoverable`,
  );
  assert.ok(
    topics.length >= 3 && topics.length <= 9,
    `${grade.label}: ${topics.length} topics is a browsable number`,
  );
  for (const topic of topics)
    assert.ok(topic.skills.length <= 6, `${grade.label} ${topic.name}: a short list of skills`);
  reachable += seen.length;
}
assert.equal(reachable, ALL_SKILLS.length);
for (const skill of ALL_SKILLS)
  assert.ok(topicIdFor(skill), `${skill.grade}:${skill.id} has a topic`);

// Grade 3, the directive's example.
assert.deepEqual(
  topicsFor(3).map((topic) => topic.name),
  [
    "Place Value",
    "Add & Subtract",
    "Multiplication",
    "Division",
    "Fractions",
    "Measurement & Geometry",
  ],
);
assert.deepEqual(
  topicsFor(3)
    .find((topic) => topic.id === "multiplication")
    .skills.map((skill) => skill.id),
  ["mul-0-5", "mul-6-9", "mul-10-12"],
);
// Grade 5 "Operations" means multiply and divide, not add and subtract.
assert.equal(
  topicIdFor(ALL_SKILLS.find((s) => s.grade === 5 && s.id === "multiply-whole")),
  "multiplication",
);
assert.equal(
  topicIdFor(ALL_SKILLS.find((s) => s.grade === 6 && s.id === "gcf")),
  "factors-multiples",
);

// Next skill walks the topic, then the grade's next topic, then ends.
const g3 = topicsFor(3).flatMap((topic) => topic.skills);
for (let i = 0; i < g3.length - 1; i += 1)
  assert.ok(nextSkillAfter(g3[i]), `${g3[i].id} has a next skill`);
assert.equal(nextSkillAfter(g3.at(-1)), null, "the last skill of a grade has no next skill");

// Stages.
assert.deepEqual(
  STAGES.map((stage) => stage.name),
  ["Understand It", "See It", "Try It Together", "Try It Yourself", "Check & Continue"],
);
assert.equal(stageAfter("learn"), "try");
assert.equal(stageAfter("grow"), null);
for (const [mode, stage] of Object.entries({
  learn: "learn",
  visual: "try",
  guided: "play",
  quick: "practice",
  flashcard: "practice",
  practice: "practice",
  streak: "practice",
  adaptive: "practice",
})) {
  assert.equal(stageOfMode(mode), stage, mode);
}
assert.equal(STAGE_MODE.try, "visual");

// Stable URLs: the lab's own ?grade=&skill= form, with an optional stage.
assert.equal(skillPath(3, "mul-0-5"), "?grade=3&skill=mul-0-5");
assert.equal(skillPath(3, "mul-0-5", "practice"), "?grade=3&skill=mul-0-5&stage=practice");
assert.equal(skillPath(0, "patterns", "learn"), "?grade=0&skill=patterns");

// A remembered place is trusted only while its skill exists.
assert.equal(validLastVisit({ grade: 3, skillId: "mul-0-5", stage: "practice" }).stage, "practice");
assert.equal(validLastVisit({ grade: 3, skillId: "mul-0-5", stage: "bogus" }).stage, "learn");
assert.equal(validLastVisit({ grade: 3, skillId: "not-a-skill" }), null);
assert.equal(validLastVisit(null), null);

console.log(
  `fluency-skill-path: ${ALL_SKILLS.length} skills, ${GRADES.length} grades, hierarchy and stages pass`,
);
