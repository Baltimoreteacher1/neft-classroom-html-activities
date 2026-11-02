// The mini-lesson data model: Learn It, Watch It, Try It, Explain It for any of the 96 skills. Pure data (no DOM),
// so every number, hint and frame can be tested without a browser. The player in mini-lesson.js draws it.
import { kidLearnFor } from "../kid-learn.js";
import { languageProfile } from "../language-terms.js";
import { generateProblem, seededRandom } from "../problem-bank.js";
import { questionEs } from "../question-es.js";
import { leakCap, peekCap } from "../step-leak.js";
import { explainModel } from "./explain-model.js";
import { tryProblems } from "./practice.js";
import { visualsFor } from "./skill-visuals.js";

export const STEP_IDS = Object.freeze(["learn", "watch", "try", "explain"]);
export const skillKeyOf = (skill) => `${skill.grade}:${skill.id}`;

// A stable seed per skill, so the same lesson opens the same way until the player asks for a new one.
export function seedFor(skill, variant = 0) {
  let hash = 2166136261;
  for (const char of `${skillKeyOf(skill)}#${variant}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

// A worked example about zero or times one shows nothing, so prefer a draw with real numbers.
const trivial = (item) => String(item.displayAnswer) === "0" || /(^|[^\d.])0([^\d.]|$)|(^|[^\d.])1 ×|× 1([^\d.]|$)/.test(item.question);

export function workedExample(skill, seed) {
  const rng = seededRandom(seed);
  const draws = Array.from({ length: 24 }, () => generateProblem(skill, rng));
  // Prefer an example whose steps all stay answer-free until the last one (step-leak.js), then real numbers.
  const clean = draws.filter((item) => leakCap(item) === item.steps.length - 1);
  const pool = clean.length ? clean : draws;
  const real = pool.filter((item) => !trivial(item));
  const item = (real.length ? real : pool).reduce((best, next) => (next.steps.length > best.steps.length ? next : best));
  return {
    question: item.question,
    questionEs: questionEs(item),
    answers: item.answers,
    displayAnswer: String(item.displayAnswer ?? item.answers[0]),
    kind: item.kind,
    unit: item.unit || "",
    steps: item.steps,
    // Steps before this index never state the answer (step-leak.js); the last step does.
    safeSteps: peekCap(item),
    model: item.model || null,
    item,
  };
}

const learnLines = (skill) => {
  const row = kidLearnFor(skill, skill.grade);
  return row ? { idea: row.idea, watch: row.watch } : { idea: { en: skill.learn.rule, es: skill.learn.rule }, watch: { en: skill.learn.watch, es: skill.learn.watch } };
};

// buildMiniLesson(skill, { supportLevel 1-4, lang, seed, missed })
// -> { key, grade, skillId, title, supportLevel, lang, seed, steps: [learn, watch, try, explain] }
export function buildMiniLesson(skill, { supportLevel = 2, lang = "en", seed = seedFor(skill), missed = false } = {}) {
  const level = Math.min(4, Math.max(1, Math.round(Number(supportLevel)) || 2));
  const visuals = visualsFor(skill);
  const example = workedExample(skill, seed);
  const { terms } = languageProfile(skill);
  const { idea, watch } = learnLines(skill);
  return {
    key: skillKeyOf(skill),
    grade: skill.grade,
    skillId: skill.id,
    title: skill.title,
    supportLevel: level,
    lang: lang === "es" ? "es" : "en",
    seed,
    steps: [
      {
        id: "learn",
        idea,
        watch,
        // Younger learners get fewer word cards. Meanings hold no digits (language-terms.js), so a card never echoes an answer.
        words: terms.slice(0, skill.grade <= 3 ? 3 : 4).map((term) => ({ id: term.id, en: term.en, es: term.es, defEn: term.defEn, defEs: term.defEs, cognate: term.cognate })),
        example,
        visual: visuals,
      },
      { id: "watch", animation: visuals.animation, graphic: visuals.graphic, example },
      { id: "try", problems: tryProblems(skill, { supportLevel: level, seed, avoid: [example.question] }), graphic: visuals.graphic },
      { id: "explain", model: explainModel(skill, { supportLevel: level, missed }) },
    ],
  };
}
