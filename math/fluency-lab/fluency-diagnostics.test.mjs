import assert from "node:assert/strict";
import { CONFIG, prerequisiteGraph, runFluencySelfTest, selfTest, validateConfig } from "./fluency-diagnostics.js";
import { ALL_SKILLS, generateProblem, seededRandom } from "./problem-bank.js";
import { classifyMistake } from "./mistake-notes.js";
import { emptyTutor, rememberMistake, sanitizeTutor } from "./tutor-engine.js";

assert.equal(CONFIG.gradeBands.length, 8);
assert.equal(validateConfig().ok, true);
assert.equal(selfTest, runFluencySelfTest);
const gradeFourSingleDigitProduct = ALL_SKILLS.find((skill) => skill.grade === 4 && skill.id === "multiply-1digit");
assert.ok(gradeFourSingleDigitProduct, "Grade 4 has the expected one-digit multiplication skill");
assert.equal(gradeFourSingleDigitProduct.title, "Multiply a three-digit number by a one-digit number");
assert.match(gradeFourSingleDigitProduct.learn.rule, /three-digit number by a one-digit number/i);
for (let seed = 0; seed < 20; seed += 1) {
  const item = generateProblem(gradeFourSingleDigitProduct, seededRandom(seed + 100), 0);
  assert.match(item.question, /^\d{3} × [2-9] = \?$/, `Grade 4 item matches three-digit × one-digit scope: ${item.question}`);
}
const gradeOneAddTen = ALL_SKILLS.find((skill) => skill.grade === 1 && skill.id === "add-10");
assert.ok(gradeOneAddTen, "Grade 1 has the expected addition-with-sums-to-10 skill");
assert.equal(gradeOneAddTen.title, "Addition facts: sums of 10 or less");
assert.match(gradeOneAddTen.learn.rule, /sum is 10 or less/i);
for (let seed = 0; seed < 50; seed += 1) {
  const item = generateProblem(gradeOneAddTen, seededRandom(seed + 400), 0);
  const [left, right] = item.question.match(/\d+/g).map(Number);
  assert.ok(left + right <= 10, `Grade 1 addition sum stays within 10: ${item.question}`);
}
const graph = prerequisiteGraph();
assert.equal(Object.keys(graph).length, CONFIG.skillCount);
assert.ok(Object.values(graph).every((node) => Array.isArray(node.prerequisiteSkills) && Array.isArray(node.enrichmentSkills)));
const result = runFluencySelfTest();
assert.equal(result.vectors, CONFIG.skillCount * 10);
assert.ok(result.svgChecks > 0, "generated model problems should exercise SVG rendering");
assert.deepEqual(result.errors, []);
assert.equal(classifyMistake({ kind: "fraction", question: "1/4 + 1/2 = ?", answers: ["3/4"] }, "2/6")?.id, "addedDenominators");
assert.equal(classifyMistake({ kind: "coordinate", question: "Plot point (3, 5)", answers: ["(3, 5)"] }, "(5, 3)")?.id, "swappedCoordinates");
assert.equal(classifyMistake({ kind: "number", question: "Find the greatest common factor of 12 and 18 = ?", answers: ["6"] }, "36")?.id, "confusedGcfLcm");
const tutor = emptyTutor();
const skill = { grade: 5, id: "fraction-add" };
rememberMistake(tutor, skill, { question: "1/4 + 1/2 = ?", kind: "fraction", answers: ["3/4"] }, "2/6", 1000);
const restored = sanitizeTutor(tutor).mistakes[0];
assert.equal(restored.misconceptionCode, "addedDenominators");
assert.equal(restored.problemPrompt, "1/4 + 1/2 = ?");
assert.equal(restored.studentInput, "2/6");
assert.equal(restored.expectedAnswer, "3/4");
assert.equal(restored.repairStatus, "open");
console.log(`Fluency diagnostics passed: ${result.skills} skills, ${result.vectors} deterministic vectors, ${result.svgChecks} SVG models`);
