import assert from "node:assert/strict";
import { familyWeeklyReport } from "../math/fluency-lab/family/family-report.js";
import { GRADES } from "../math/fluency-lab/problem-bank.js";
import { emptyTutor, skillKey } from "../math/fluency-lab/tutor-engine.js";

const now = Date.UTC(2026, 9, 26, 12);
const grade = 8;
const skills = GRADES.find((entry) => entry.grade === grade).skills;
const slope = skills.find((skill) => skill.id === "slope");
const equations = skills.find((skill) => skill.id === "linear-equations");
assert.ok(slope && equations, "fixture skills exist in Grade 8");

const empty = familyWeeklyReport(emptyTutor(), grade, { now });
assert.equal(empty.available, false);
assert.deepEqual(empty.totals, { independent: 0, correct: 0, supported: 0, skills: 0 });
assert.deepEqual(empty.skills, []);

const tutor = emptyTutor();
tutor.records[skillKey(slope)] = {
  recent: [
    { correct: true, independent: true, level: 1, at: now - 1000 },
    { correct: false, independent: true, level: 1, at: now - 2000 },
    { correct: true, independent: false, level: 1, at: now - 3000 },
    { correct: true, independent: true, level: 0, at: now - 4000 },
    { correct: true, independent: true, level: 1, at: now - 7 * 24 * 60 * 60 * 1000 },
    { correct: false, independent: true, level: 1, at: now - 7 * 24 * 60 * 60 * 1000 - 1 },
    { correct: false, independent: true, level: 1, at: now + 1 },
  ],
};
tutor.records[skillKey(equations)] = {
  recent: [{ correct: false, independent: false, level: 0, at: now - 5000 }],
};
const report = familyWeeklyReport(tutor, grade, { now });
assert.equal(report.available, true);
assert.deepEqual(report.totals, { independent: 3, correct: 2, supported: 3, skills: 2 });
assert.equal(report.skills[0].key, skillKey(slope));
assert.equal(report.skills[0].checks, 3);
assert.equal(report.skills[0].correct, 2);
assert.equal(report.skills[0].supported, 2);
assert.equal(report.skills[1].checks, 0);
assert.equal(report.skills[1].supported, 1);
assert.ok(report.suggested);
assert.ok(Array.isArray(report.due));
assert.throws(() => familyWeeklyReport(emptyTutor(), 9, { now }), RangeError);
console.log(
  "Family weekly report includes only valid seven-day evidence and separates independent from supported checks.",
);
