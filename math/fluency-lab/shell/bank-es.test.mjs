// Spanish for the practice bank's hints, steps and explanations (bank-es.js).
//
// A skill's generator writes its hint, worked steps and explanation in English. In Spanish mode a picture rung
// replaces them when the problem has one; where it does not, English reached a Spanish reader marked "en inglés".
// This sweeps all skills and fails on any English sentence that can still reach a Spanish reader without a Spanish
// version: the texts shown when a problem has no picture rung (hint, steps) and when it has no solved picture
// (steps, explanation). Also proves every translated sentence keeps its numbers, leaves no {n} unfilled, adds no
// doubled comma, and carries no English word apart from the cognates listed below.
import assert from "node:assert/strict";
import { ALL_SKILLS, generateProblem, seededRandom } from "../problem-bank.js";
import { framesOf, lessonFor } from "../studio/engines.js";
import { helpLadder } from "./content.js";
import { bankEs, sentenceKey, stepsEs } from "./bank-es.js";
import { BANK_ES } from "./bank-es-data.js";

const ITEMS_PER_SKILL = 400;
// Words spelled the same in Spanish: a Spanish sentence may contain them. Anything else that is also an English
// word of the data keys is an untranslated word.
const COGNATES = new Set(["divide", "factor", "total", "base", "pizza", "divisor", "vertical", "horizontal", "decide", "decimal", "variable", "circular", "color", "come", "divides", "final", "original"]);
const wordsOf = (text) => text.replace(/\{\d+\}/g, " ").toLowerCase().match(/\p{L}{3,}/gu) || [];
const placeholders = (text) => [...new Set(text.match(/\{\d+\}/g) || [])].sort();

// ---------- The dictionary itself ----------
const english = new Set(Object.keys(BANK_ES).flatMap(wordsOf));
assert.ok(Object.keys(BANK_ES).length >= 250, `the dictionary is real (${Object.keys(BANK_ES).length} sentences)`);
const dictionaryProblems = [];
for (const [en, es] of Object.entries(BANK_ES)) {
  if (placeholders(en).join() !== placeholders(es).join()) dictionaryProblems.push(`placeholders differ: "${en}" -> "${es}"`);
  const left = wordsOf(es).filter((w) => english.has(w) && !COGNATES.has(w));
  if (left.length) dictionaryProblems.push(`English word ${left.join(", ")} in "${es}"`);
  if (/,,|, ,/.test(es)) dictionaryProblems.push(`doubled comma in "${es}"`);
  if (es === en) dictionaryProblems.push(`not translated: "${en}"`);
  if (/\d/.test(en.replace(/\{\d+\}/g, ""))) dictionaryProblems.push(`a key holds a number: "${en}"`);
}
assert.deepEqual(dictionaryProblems.slice(0, 20), [], `${dictionaryProblems.length} dictionary problems`);

// ---------- The rules ----------
assert.equal(bankEs("3 × 4 = 12"), "3 × 4 = 12", "a line without words is language-neutral");
assert.equal(bankEs("The answer is B."), "La respuesta es B.");
assert.equal(bankEs("The answer is c ≤ 12."), "La respuesta es c ≤ 12.");
assert.equal(bankEs("The answer is −3 1/2, 4, 5 1/3."), "La respuesta es −3 1/2, 4, 5 1/3.");
assert.equal(bankEs("Test 2, 3, 4 and 5. Does any of them divide 60 evenly?"), "Prueba con 2, 3, 4 y 5. ¿Alguno divide a 60 exactamente?");
assert.equal(bankEs("Subtract: 31 − 28 = 3"), "Resta: 31 − 28 = 3");
assert.equal(bankEs("A sentence no skill ever writes, so it has no Spanish."), null, "an unknown sentence is reported, not guessed");
assert.equal(bankEs("The answer is a cat."), null, "the answer rule does not swallow words");
assert.equal(stepsEs(["Multiply: 7 × 4 = 28", "Subtract: 31 − 28 = 3"]).join("|"), "Multiplica: 7 × 4 = 28|Resta: 31 − 28 = 3");
assert.equal(stepsEs(["Multiply: 7 × 4 = 28", "Not a known sentence here."]), null, "steps are all Spanish or not at all");

// ---------- The sweep: every sentence a Spanish reader can reach ----------
const uncovered = new Map();
const outputs = [];
let reached = 0;
let items = 0;
for (const skill of ALL_SKILLS) {
  const rng = seededRandom(11 + skill.grade * 97 + skill.id.length);
  for (let n = 0; n < ITEMS_PER_SKILL; n += 1) {
    const item = generateProblem(skill, rng);
    items += 1;
    const hasPicture = helpLadder(skill, item).some((rung) => rung.kind === "visual");
    const lesson = item.transfer ? null : lessonFor(item);
    const solved = lesson?.modeled ? framesOf(lesson, lesson.spec.reps?.[0] || "main") : [];
    const texts = [];
    if (!hasPicture) texts.push(item.hint, ...(item.steps || []));
    if (!solved.length) texts.push(...(item.steps || []), item.explanation);
    for (const text of texts.filter(Boolean)) {
      reached += 1;
      const es = bankEs(text);
      if (es === null) uncovered.set(sentenceKey(text).key, `${skill.id}: ${text}`);
      else outputs.push({ text, es });
    }
  }
}
assert.deepEqual([...uncovered.values()].slice(0, 15), [], `${uncovered.size} English sentences reach a Spanish reader with no Spanish`);

const outputProblems = [];
for (const { text, es } of outputs) {
  const nums = (t) => (t.match(/-?\d+(?:\.\d+)?/g) || []).sort().join(" ");
  if (/\{\d+\}/.test(es)) outputProblems.push(`unfilled placeholder: ${es}`);
  if (/,,|, ,/.test(es)) outputProblems.push(`doubled comma: ${es}`);
  if (new Set(nums(text).split(" ")).size !== new Set(nums(es).split(" ")).size) outputProblems.push(`numbers differ: "${text}" -> "${es}"`);
}
assert.deepEqual([...new Set(outputProblems)].slice(0, 15), [], `${outputProblems.length} Spanish sentence problems`);
assert.ok(reached > 10000 && outputs.length > 5000, `the sweep reached ${reached} sentences`);

console.log(
  `bank-es: ${Object.keys(BANK_ES).length} sentence shapes + the answer rule; ${items} items from ${ALL_SKILLS.length} skills, ` +
    `${reached} sentences that can reach a Spanish reader, 0 without Spanish, numbers kept, no doubled commas`,
);
