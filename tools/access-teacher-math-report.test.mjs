import assert from "node:assert/strict";
import { normalizeFluencyReport } from "../access-teacher/math-fluency-report.js";

const source = {
  app: "EduWonderLab Fluency Lab",
  kind: "class-report",
  version: 1,
  generatedAt: "2026-11-08T12:00:00.000Z",
  grade: 6,
  totals: {
    learners: 4,
    skillRecords: 9,
    answers: 30,
    independentAnswers: 20,
    supportedAnswers: 10,
  },
  learners: [{ label: "Private learner", rawAnswer: "private response" }],
  skills: [
    {
      skill: { title: "Equivalent ratios", standard: "6.RP.A.3" },
      learners: 4,
      checkedLearners: 3,
      lowLearners: 1,
      avgScore: 67.45,
      independentAnswers: 12,
      independentWrong: 4,
      supportedAnswers: 5,
      due: 2,
      overdue: 1,
      learnerLabels: ["Private learner"],
    },
  ],
  retention: { due: 2, overdue: 1, retainedSkills: 3 },
  growth: { learners: 2, avgDelta: 4.25, improved: 1, declined: 0 },
};

const aggregate = normalizeFluencyReport(source);
assert.deepEqual(aggregate.totals, {
  learners: 4,
  skillRecords: 9,
  answers: 30,
  independentAnswers: 20,
  supportedAnswers: 10,
});
assert.equal(aggregate.skills[0].avgScore, 67.5);
assert.equal(aggregate.skills[0].title, "Equivalent ratios");
const serialized = JSON.stringify(aggregate);
assert.ok(!serialized.includes("Private learner"));
assert.ok(!serialized.includes("private response"));
assert.ok(!serialized.includes("learnerLabels"));
assert.equal(aggregate.grade, 6);
assert.throws(() => normalizeFluencyReport({ ...source, version: 2 }), /version 1/);
assert.throws(() => normalizeFluencyReport({ ...source, skills: null }), /version 1/);
assert.equal(
  normalizeFluencyReport({ ...source, grade: 99, totals: { learners: -2 } }).grade,
  null,
);
assert.equal(normalizeFluencyReport({ ...source, totals: { learners: -2 } }).totals.learners, 0);
console.log("Teacher math report: aggregate-only import and validation passed");
