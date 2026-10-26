import assert from "node:assert/strict";
import { makeProblem, TRAILS } from "../math/fluency-lab/fact-trail.js";
import { createLesson } from "../math/fluency-lab/lesson-content.js";
import {
  GRADES,
  generateProblem,
  getGrade,
  seededRandom,
  validateAnswer,
} from "../math/fluency-lab/problem-bank.js";
import { emptyTutor, sanitizeTutor, skillForItem } from "../math/fluency-lab/tutor-engine.js";

const kindergarten = getGrade(0);
assert.equal(kindergarten.label, "Kindergarten");
assert.equal(GRADES.length, 9);
assert.equal(getGrade(99).grade, 1, "invalid grade still falls back to Grade 1");
assert.deepEqual(
  kindergarten.skills.map((skill) => skill.standard),
  [
    "K.NOS.A.2",
    "K.NOS.B.6",
    "K.NOS.B.8",
    "K.NOS.C.10",
    "K.NOS.D.11",
    "K.AT.A.1",
    "K.AT.A.2",
    "K.AT.B.3",
  ],
);
for (const skill of kindergarten.skills) {
  for (let seed = 1; seed <= 100; seed += 1) {
    const item = generateProblem(skill, seededRandom(seed * 997 + skill.id.length * 101));
    assert.ok(
      item.question && item.steps.length >= 2,
      `${skill.id} has usable practice and explanation`,
    );
    assert.equal(
      validateAnswer(item.answers[0], item),
      true,
      `${skill.id} accepts its generated answer`,
    );
    assert.equal(
      skillForItem(0, item)?.id,
      skill.id,
      `${skill.id} evidence is attributed to the right K skill`,
    );
  }
  assert.ok(createLesson(skill, 2).steps.length >= 3, `${skill.id} has a visual lesson`);
}
assert.ok(TRAILS[0]);
for (const station of TRAILS[0].stations) {
  if (!station.mix) assert.ok(makeProblem(0, station, () => 0.37).question);
}
const tutor = emptyTutor();
tutor.sessions.push({ at: 1, answered: 1, correct: 1, grade: 0, mode: "practice" });
assert.equal(sanitizeTutor(tutor).sessions[0].grade, 0);
console.log(
  `Kindergarten content, answer generation, attribution, trail, and grade persistence passed (${kindergarten.skills.length} skills).`,
);
