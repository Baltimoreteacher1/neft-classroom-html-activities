import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ALL_SKILLS,
  GRADES,
  generateProblem,
  seededRandom,
  validateAnswer,
} from "../math/fluency-lab/problem-bank.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(resolve(root, "math/fluency-lab/index.html"), "utf8");
const app = readFileSync(resolve(root, "math/fluency-lab/app.js"), "utf8");
const hub = readFileSync(resolve(root, "math/index.html"), "utf8");
const catalogGenerator = readFileSync(resolve(root, "scripts/generate-catalog.mjs"), "utf8");
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

check(GRADES.length === 8, `Expected 8 grades; found ${GRADES.length}.`);
check(
  GRADES.map((grade) => grade.grade).join(",") === "1,2,3,4,5,6,7,8",
  "Grades must run consecutively from 1 through 8.",
);
check(ALL_SKILLS.length === 80, `Expected 80 skills; found ${ALL_SKILLS.length}.`);

for (const grade of GRADES) {
  check(grade.skills.length === 10, `${grade.label} must contain 10 skills.`);
  const ids = new Set(grade.skills.map((skill) => skill.id));
  check(ids.size === grade.skills.length, `${grade.label} contains duplicate skill IDs.`);

  for (const skill of grade.skills) {
    check(
      Boolean(skill.title && skill.strand && skill.standard),
      `${grade.label}/${skill.id} is missing metadata.`,
    );
    check(
      skill.learn?.steps?.length === 3,
      `${grade.label}/${skill.id} needs exactly three learning steps.`,
    );
    check(
      Boolean(skill.learn?.rule && skill.learn?.example && skill.learn?.watch),
      `${grade.label}/${skill.id} has incomplete teaching copy.`,
    );

    const rng = seededRandom(grade.grade * 1009 + skill.id.length * 97);
    const questions = new Set();
    for (let index = 0; index < 250; index += 1) {
      let item;
      try {
        item = generateProblem(skill, rng);
      } catch (error) {
        failures.push(`${grade.label}/${skill.id} generator threw: ${error.message}`);
        break;
      }
      check(Boolean(item.question), `${grade.label}/${skill.id} generated a blank question.`);
      check(
        Array.isArray(item.answers) && item.answers.length > 0,
        `${grade.label}/${skill.id} generated no answer.`,
      );
      check(
        ["number", "fraction", "text", "choice"].includes(item.kind),
        `${grade.label}/${skill.id} generated unsupported kind ${item.kind}.`,
      );
      check(
        validateAnswer(item.answers[0], item),
        `${grade.label}/${skill.id} rejected its canonical answer for “${item.question}”.`,
      );
      check(
        !/\b(?:answer|solution)\s+(?:is|=)\b/i.test(item.hint),
        `${grade.label}/${skill.id} hint explicitly labels the answer.`,
      );
      questions.add(item.question);
    }
    check(
      questions.size >= 5,
      `${grade.label}/${skill.id} generated too little problem variety (${questions.size}).`,
    );
  }
}

for (const id of [
  "grade-tabs",
  "skill-grid",
  "workspace-view",
  "learn-panel",
  "drill-panel",
  "answer-form",
  "guided-coach",
  "guided-steps",
  "guided-next-step",
  "session-summary",
  "independent-practice",
  "print-sheet",
]) {
  check(html.includes(`id="${id}"`), `Fluency Lab HTML is missing #${id}.`);
}

check(html.includes('type="module" src="./app.js"'), "Fluency Lab must load its module app.");
check(
  html.includes("/shared/save-resume/save-resume-engine.js") &&
    html.includes("/shared/save-resume/save-resume-styles.css"),
  "Fluency Lab must include the shared save/resume contract.",
);
check(
  html.includes("Your progress stays on this device"),
  "Fluency Lab must disclose local-only progress storage.",
);
check(hub.includes('href="/math/fluency-lab/"'), "Math hub must link to the Fluency Lab.");
check(
  catalogGenerator.includes('"fluency-lab"'),
  "Catalog generator must classify Fluency Lab as a hub.",
);
check(
  app.includes('["guided", "Guided practice"]') && app.includes('mode === "guided" ? 5 : 10'),
  "Every skill must expose a five-problem guided-practice mode.",
);
check(
  app.includes("guidedProblems") && html.includes("Continue to Practice 10"),
  "Guided practice must save progress and hand off to independent practice.",
);
check(
  app.includes("registerStateProvider") && app.includes("registerStateRestorer"),
  "Fluency progress must round-trip through the shared save/resume engine.",
);

const fractionProbe = { kind: "fraction", answers: ["1/2"] };
const numberProbe = { kind: "number", answers: ["1200"] };
const textProbe = { kind: "text", answers: ["(-4,3)"] };
check(validateAnswer("2/4", fractionProbe), "Equivalent fraction answers must be accepted.");
check(validateAnswer("1,200", numberProbe), "Comma-formatted numeric answers must be accepted.");
check(
  validateAnswer("(-4, 3)", textProbe),
  "Coordinate answers must ignore spaces without losing commas.",
);

if (failures.length) {
  console.error(`Fluency Lab validation failed (${failures.length}):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `Fluency Lab validation passed: ${GRADES.length} grades, ${ALL_SKILLS.length} skills, ${ALL_SKILLS.length * 250} generated problems checked.`,
);
