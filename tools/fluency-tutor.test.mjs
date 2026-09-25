import assert from "node:assert/strict";
import { createLesson } from "../math/fluency-lab/lesson-content.js";
import {
  ALL_SKILLS,
  generateProblem,
  getSkill,
  seededRandom,
  validateAnswer,
} from "../math/fluency-lab/problem-bank.js";
import {
  assignmentQueue,
  cleanProgress,
  decodeAssignment,
  encodeAssignment,
  makeBackup,
  parseBackup,
  printablePacket,
  validateAssignment,
} from "../math/fluency-lab/school-tools.js";
import {
  adaptiveProblem,
  DAY,
  dailyPlan,
  diagnosticPlan,
  difficulty,
  emptyTutor,
  evidence,
  feedbackFor,
  findSkill,
  prerequisites,
  recordAnswer,
  rememberMistake,
  sanitizeTutor,
  skillKey,
} from "../math/fluency-lab/tutor-engine.js";
import { renderModel } from "../math/fluency-lab/visual-lab.js";

let checks = 0;
const check = (condition, message) => {
  assert.ok(condition, message);
  checks++;
};
const skill = findSkill("4:division");
const now = new Date(2026, 8, 24, 12).getTime();
const tutor = emptyTutor();
for (let i = 0; i < 10; i++)
  recordAnswer(tutor, skill, { correct: true, independent: false, level: 1 }, now + i);
check(!evidence(tutor, skill, now).secure, "Coached answers cannot establish independent mastery");
check(
  evidence(tutor, skill, now).independent === 0,
  "Coached answers stay out of independent accuracy",
);
for (let i = 0; i < 10; i++)
  recordAnswer(tutor, skill, { correct: true, independent: true, level: 1 }, now + i);
check(!evidence(tutor, skill, now).secure, "One successful day does not prove retention");
recordAnswer(tutor, skill, { correct: true, independent: true, level: 1 }, now + DAY);
check(
  evidence(tutor, skill, now + DAY).secure,
  "Repeated independent success across days establishes retention",
);
check(!evidence(tutor, skill, now + DAY).due, "A just-refreshed skill is not immediately due");
check(evidence(tutor, skill, now + DAY * 4).due, "Spaced review becomes due");
const support = emptyTutor();
recordAnswer(support, skill, { correct: false, independent: true, level: 1 }, now);
recordAnswer(support, skill, { correct: false, independent: true, level: 1 }, now + 1);
check(difficulty(support, skill) === 0, "Repeated difficulty introduces scaffolding");
for (let i = 0; i < 2; i++)
  recordAnswer(support, skill, { correct: true, independent: false, level: 0 }, now + 2 + i);
check(
  difficulty(support, skill) === 1,
  "Successful coached work fades support instead of trapping a learner",
);
for (let i = 0; i < 4; i++)
  recordAnswer(support, skill, { correct: true, independent: true, level: 1 }, now + 4 + i);
check(
  difficulty(support, skill) === 2,
  "Consistent independent success invites an explanation challenge",
);
const generated = generateProblem(skill, seededRandom(8));
rememberMistake(support, skill, generated, "12", now);
rememberMistake(support, skill, generated, "13", now + 1);
check(
  support.mistakes.length === 1,
  "Repeated tries do not duplicate the same open notebook entry",
);
check(
  feedbackFor(findSkill("3:mul-0-5"), { question: "4 × 6 = ?", answers: ["24"] }, "10").includes(
    "adds the factors",
  ),
  "Multiplication-as-addition receives targeted feedback",
);
check(
  feedbackFor(findSkill("8:exponents"), { question: "3^4 = ?", answers: ["81"] }, "12").includes(
    "counts factors",
  ),
  "Exponent misconception is detected",
);

for (const current of ALL_SKILLS) {
  check(
    prerequisites(current).every((foundation) => skillKey(foundation) !== skillKey(current)),
    `${current.id}: no self prerequisites`,
  );
  for (let variant = 0; variant < 5; variant++) {
    const content = createLesson(current, variant);
    check(
      content.steps.length === 3 &&
        content.steps.every((step) => validateAnswer(step.answers[0], step)),
      `${current.grade}/${current.id}: valid visual steps`,
    );
    check(
      !/NaN|undefined/.test(renderModel(content.model)),
      `${current.grade}/${current.id}: complete visual model`,
    );
  }
  for (let level = 0; level <= 2; level++) {
    const rng = seededRandom(current.grade * 1999 + current.id.length * 31 + level);
    for (let i = 0; i < 100; i++) {
      const item = adaptiveProblem(current, rng, level);
      check(validateAnswer(item.answers[0], item), `${current.id}: canonical answer accepted`);
      check(
        !validateAnswer("definitely not an answer", item),
        `${current.id}: invalid answer rejected`,
      );
      if (current.generator === "fact") {
        const parts = item.question.replaceAll(",", "").match(/^(\d+) ([+−×÷]) (\d+)/);
        const a = Number(parts[1]);
        const b = Number(parts[3]);
        const result =
          parts[2] === "+" ? a + b : parts[2] === "−" ? a - b : parts[2] === "×" ? a * b : a / b;
        check(
          result === Number(item.answers[0]),
          `${current.id}: independently recomputed arithmetic`,
        );
        check(result >= 0, `${current.id}: elementary arithmetic stays nonnegative`);
      }
      if (current.generator === "decimalPlace") {
        const decimal = item.question.match(/(\d+\.\d+)/)[1];
        const place = item.question.includes("thousandths")
          ? 2
          : item.question.includes("hundredths")
            ? 1
            : 0;
        check(
          item.answers[0] === decimal.split(".")[1][place],
          "Decimal digit comes from displayed decimal, without floating-point truncation",
        );
      }
    }
  }
}
for (let grade = 1; grade <= 8; grade++) {
  const plan = dailyPlan(support, grade, now);
  check(plan.length === 10, `Grade ${grade}: daily plan has ten questions`);
  check(
    plan.every((entry) => findSkill(entry.key)?.grade === grade),
    `Grade ${grade}: daily plan stays within grade`,
  );
  check(
    new Set(plan.map((entry) => entry.key)).size >= 2,
    `Grade ${grade}: daily plan interleaves skills`,
  );
  check(
    new Set(diagnosticPlan(grade).map((entry) => entry.key)).size === 10,
    `Grade ${grade}: diagnostic samples every skill exactly once`,
  );
}
const assignment = {
  version: 1,
  grade: 4,
  keys: ["4:division", "4:multiply-1digit"],
  count: 10,
  mode: "adaptive",
  label: "Family practice <test>",
};
assert.deepEqual(decodeAssignment(encodeAssignment(assignment)), assignment);
check(decodeAssignment("broken%%token") === null, "Malformed assignment links fail safely");
check(
  validateAssignment({ ...assignment, keys: ["8:slope"] }) === null,
  "Assignments reject mismatched grades",
);
const queue = assignmentQueue(assignment, seededRandom(3));
check(
  queue.length === 10 && queue.filter((entry) => entry.key === "4:division").length === 5,
  "Assignment selection balances skill coverage",
);
const packet = printablePacket(assignment, { seed: 7 });
check((packet.match(/<li>/g) || []).length === 40, "Five-day packet has forty practice questions");
check(!packet.includes("Teacher answer key"), "Student packets omit answer keys by default");
check(packet.includes("&lt;test&gt;"), "Assignment titles are escaped in print views");
check(
  printablePacket(assignment, { includeKey: true, seed: 7 }).includes("Teacher answer key"),
  "Teacher key is generated separately when requested",
);
const restored = parseBackup(makeBackup({ tutor: support, progress: {}, settings: {}, grade: 4 }));
assert.deepEqual(restored.tutor.records, sanitizeTutor(support).records);
check(
  !Object.hasOwn(cleanProgress({ __invalid: {} }), "__invalid"),
  "Progress import only accepts known skill keys",
);
assert.throws(() => parseBackup({ version: 2 }), /Choose a Fluency Lab/);
check(
  !validateAnswer("1/2/3", { kind: "fraction", answers: ["1/2"] }),
  "Malformed fractions are rejected",
);
const divisionLesson = createLesson(getSkill(4, "division"));
assert.deepEqual(
  divisionLesson.steps.map((step) => step.answers[0]),
  ["60", "4", "64"],
);
console.log(
  `Fluency tutor: ${checks} checks passed; 80 visual lessons × 5 variants; 24,000 adaptive problems.`,
);
