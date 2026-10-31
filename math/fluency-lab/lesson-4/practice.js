// Try It: three fresh problems with a hint ladder that can never state the answer.
// Support fades with the level: 1 = the first move is shown, hints and the picture are open; 4 = on my own, with
// hints and steps available only after a miss.
import { kidLearnFor } from "../kid-learn.js";
import { seededRandom } from "../problem-bank.js";
import { choicesEs, questionEs } from "../question-es.js";
import { peekCap, stepLeaks } from "../step-leak.js";
import { adaptiveProblem } from "../tutor-engine.js";

export const TRY_COUNT = 3;

// What each support level opens up front. `frame` = the first move is shown; `picture` = the model starts open.
export const TRY_SUPPORT = Object.freeze({
  1: { frame: true, picture: "open", hints: "ready" },
  2: { frame: false, picture: "open", hints: "ready" },
  3: { frame: false, picture: "closed", hints: "ready" },
  4: { frame: false, picture: "none", hints: "after-miss" },
});
export const supportFor = (level) => TRY_SUPPORT[level] || TRY_SUPPORT[2];

// Hints never state the answer: a generic nudge from the skill's own "watch out" line, then the guided steps the
// leak rule says can be shown, one at a time. A line that holds the answer is dropped.
// "Count back 3: 4, 3, 2" is a list the leak rule allows, but its last number is the answer to 5 − 3, and "Count up:
// 3, 4, 5" holds the answer as an item and as the number of items. A hint stops before a list like that.
const numbers = (text) => String(text).replace(/(\d),(?=\d{3}\b)/g, "$1").match(/-?\d+(?:\.\d+)?/g) || [];
function listGivesAnswer(step, item) {
  if (!/:\s*[-\d.,\s…]+$/.test(step)) return false;
  const list = numbers(step.slice(step.lastIndexOf(":") + 1));
  return item.answers.some((answer) => list.includes(String(answer).replace(/,/g, "")) || list.length === Number(answer));
}

export function hintLadder(item, skill) {
  const row = kidLearnFor(skill, skill.grade);
  const ladder = [];
  if (row && !stepLeaks(row.watch.en, item)) ladder.push({ en: row.watch.en, es: row.watch.es, kind: "idea" });
  const safe = peekCap(item);
  for (const text of item.steps.slice(0, safe)) {
    if (listGivesAnswer(text, item)) break;
    ladder.push({ en: text, es: null, kind: "step" });
  }
  if (item.hint && !ladder.some((hint) => hint.en === item.hint) && !stepLeaks(item.hint, item) && !listGivesAnswer(item.hint, item)) ladder.push({ en: item.hint, es: null, kind: "idea" });
  return ladder;
}

function shape(item, skill, index) {
  const hints = hintLadder(item, skill);
  return {
    index,
    question: item.question,
    questionEs: questionEs(item),
    choicesEs: choicesEs(item),
    answers: item.answers,
    displayAnswer: String(item.displayAnswer ?? item.answers[0]),
    kind: item.kind,
    choices: item.choices || null,
    unit: item.unit || "",
    model: item.model || null,
    steps: item.steps,
    safeSteps: peekCap(item),
    hints,
    // The first move is the first hint that is a guided step, or the skill's idea line when no step is safe.
    startFrame: hints.find((hint) => hint.kind === "step") || hints[0] || null,
    item,
  };
}

export function tryProblems(skill, { supportLevel = 2, seed = 1, avoid = [] } = {}) {
  const seen = new Set(avoid);
  const problems = [];
  for (let draw = 0; problems.length < TRY_COUNT && draw < 120; draw += 1) {
    // Starter uses the easier number range; a skill with too few easy problems (Pythagorean triples) widens it.
    const level = supportLevel === 1 && draw < 60 ? 0 : 1;
    const item = adaptiveProblem(skill, seededRandom((seed + 7919 * (draw + 1)) >>> 0), level);
    if (seen.has(item.question)) continue;
    seen.add(item.question);
    problems.push(shape(item, skill, problems.length));
  }
  return problems;
}
