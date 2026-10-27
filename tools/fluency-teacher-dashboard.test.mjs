import assert from "node:assert/strict";
import {
  buildTeacherReport,
  groupTeacherInterventions,
  masteryStage,
} from "../math/fluency-lab/teacher-dashboard.js";
import { emptyTutor, findSkill, skillKey } from "../math/fluency-lab/tutor-engine.js";

const now = 1_800_000_000_000;
const addSkill = findSkill("1:add-20");
const tutor = emptyTutor();
tutor.records[skillKey(addSkill)] = {
  recent: [
    { correct: false, independent: true, level: 1, at: now - 60_000 },
    { correct: false, independent: true, level: 1, at: now - 30_000 },
  ],
  independentTotal: 2,
  supportedTotal: 1,
  dueAt: now - 1,
  lastAt: now - 30_000,
};
tutor.mistakes = [
  {
    key: skillKey(addSkill),
    question: "7 + 5 = ?",
    submitted: "2",
    category: "subtractInsteadOfAdding",
    at: now - 30_000,
    resolvedAt: null,
  },
];
tutor.sessions = [{ grade: 1, at: now - 30_000, answered: 3, correct: 1 }];

const report = buildTeacherReport(
  [
    { label: "Learner 1", tutor },
    { label: "Learner 2", tutor: structuredClone(tutor) },
    { label: "Learner 3", tutor: emptyTutor() },
  ],
  1,
  now,
);
assert.equal(report.learnerCount, 2, "profiles without relevant evidence are omitted");
assert.equal(report.sessions, 2, "session totals derive from actual saved sessions");
assert.equal(report.rows.length, 2, "each included profile has one evidence-backed skill row");
assert.equal(report.rows[0].stage, "Developing");
assert.equal(report.rows[0].status.independent, 2);
assert.equal(report.rows[0].status.supportedTotal, 1);
assert.equal(report.rows[0].likelyPattern[0], "subtractInsteadOfAdding");
assert.equal(report.groups.length, 1, "matching response evidence creates one instructional group");
assert.deepEqual(report.groups[0].learners, ["Learner 1", "Learner 2"]);
assert.equal(report.groups[0].need, "possible misconception");
assert.match(report.groups[0].evidence.join(" "), /recorded response/);

const twoSkillTutor = emptyTutor();
const ratioSkill = findSkill("6:ratios");
const proportionSkill = findSkill("7:proportions");
assert.ok(ratioSkill && proportionSkill, "prerequisite sample skills exist in the K–8 map");
twoSkillTutor.records[skillKey(ratioSkill)] = {
  recent: [
    { correct: false, independent: true, level: 1, at: now - 40_000 },
    { correct: false, independent: true, level: 1, at: now - 20_000 },
  ],
};
twoSkillTutor.records[skillKey(proportionSkill)] = {
  recent: [{ correct: false, independent: true, level: 1, at: now - 10_000 }],
};
twoSkillTutor.diagnostics[7] = { results: { [skillKey(proportionSkill)]: false } };
const prerequisiteGroup = groupTeacherInterventions(
  buildTeacherReport([{ label: "Learner 4", tutor: twoSkillTutor }], 7, now).rows,
).find((group) => group.need === "prerequisite check");
assert.equal(
  prerequisiteGroup?.skill.id,
  "ratios",
  "group routing points to a measured prerequisite gap",
);

assert.equal(masteryStage({ recent: [], lessonCompleted: false }), "Not checked");
assert.equal(masteryStage({ recent: [], lessonCompleted: true }), "Exploring");
assert.equal(
  masteryStage({
    recent: Array.from({ length: 8 }, (_, index) => ({
      independent: true,
      correct: true,
      at: now - index * 86400000,
    })),
    independent: 8,
    ratio: 1,
    secure: true,
  }),
  "Retained",
);

console.log(
  "Teacher dashboard: evidence-derived reports, support distinction, possible misconception grouping, prerequisite routing, and mastery stage rules passed.",
);
