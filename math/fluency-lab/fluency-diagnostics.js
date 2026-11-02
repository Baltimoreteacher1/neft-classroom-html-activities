import { ALL_SKILLS, GRADES, generateProblem, seededRandom } from "./problem-bank.js";
import { prerequisites } from "./tutor-engine.js";
import { renderInlineProblemModel } from "./visual-lab.js";

const GRADE_SKILLS = ALL_SKILLS.filter((skill) => skill.grade >= 1 && skill.grade <= 8);
export const CONFIG = Object.freeze({
  gradeBands: Object.freeze(GRADES.filter(({ grade }) => grade >= 1 && grade <= 8).map(({ grade, label, skills }) => Object.freeze({ grade, label, skillCount: skills.length }))),
  skillCount: GRADE_SKILLS.length,
  leitnerIntervalsDays: Object.freeze([1, 3, 7, 14]),
  ui: Object.freeze({ diagnosticVectorsPerSkill: 10, minimumTouchTargetPx: 44 }),
});

export function prerequisiteGraph() {
  return Object.fromEntries(GRADE_SKILLS.map((skill) => {
    const prereqs = prerequisites(skill).map((item) => `${item.grade}:${item.id}`);
    const enrichment = GRADE_SKILLS.filter((candidate) => candidate.grade > skill.grade && candidate.strand === skill.strand)
      .slice(0, 3).map((item) => `${item.grade}:${item.id}`);
    return [`${skill.grade}:${skill.id}`, { prerequisiteSkills: prereqs, enrichmentSkills: enrichment }];
  }));
}

export function validateConfig(config = CONFIG) {
  const errors = [];
  if (config.gradeBands.length !== 8 || config.gradeBands.some((band, index) => band.grade !== index + 1)) errors.push("Grade bands must cover grades 1 through 8 exactly once.");
  if (config.skillCount !== GRADE_SKILLS.length || GRADE_SKILLS.some((skill) => !skill.id || !skill.generator)) errors.push("Every Grade 1–8 skill needs a stable id and generator.");
  if (!Array.isArray(config.leitnerIntervalsDays) || config.leitnerIntervalsDays.some((day, index, days) => !Number.isFinite(day) || day <= 0 || (index > 0 && day <= days[index - 1]))) errors.push("Leitner intervals must be positive and strictly increasing.");
  const graph = prerequisiteGraph();
  if (Object.keys(graph).length !== GRADE_SKILLS.length) errors.push("Every Grade 1–8 skill must have a prerequisite graph node.");
  return { ok: errors.length === 0, errors };
}

export function runFluencySelfTest() {
  const errors = validateConfig().errors;
  let vectors = 0;
  let svgChecks = 0;
  GRADE_SKILLS.forEach((skill, skillIndex) => {
    for (let vector = 0; vector < CONFIG.ui.diagnosticVectorsPerSkill; vector += 1) {
      vectors += 1;
      try {
        const rng = seededRandom((skill.grade * 1000003 + skillIndex * 101 + vector + 1) >>> 0);
        const item = generateProblem(skill, rng);
        if (!item || !String(item.question || "").trim() || !Array.isArray(item.answers) || !item.answers.length) throw new Error("missing problem or answer");
        const serialized = JSON.stringify(item);
        if (/\b(?:NaN|undefined)\b/.test(serialized)) throw new Error("NaN or undefined in generated output");
        if (item.model) {
          const markup = renderInlineProblemModel(skill, item);
          if (typeof markup !== "string") throw new Error("model renderer did not return markup");
          if (markup && (!markup.includes("<p") || /\b(?:NaN|undefined)\b/.test(markup))) throw new Error("invalid model markup");
          const roots = [...markup.matchAll(/<svg\b([^>]*)>/gi)];
          for (const root of roots) {
            if (!/\bviewBox="[^"]+"/.test(root[1]) || !/\bwidth="[^"]+"/.test(root[1]) || !/\bheight="[^"]+"/.test(root[1])) throw new Error("invalid or underspecified SVG model");
            svgChecks += 1;
          }
        }
      } catch (error) {
        errors.push(`Grade ${skill.grade} ${skill.id} vector ${vector + 1}: ${error.message}`);
      }
    }
  });
  return { ok: errors.length === 0, skills: GRADE_SKILLS.length, vectors, svgChecks, errors };
}

export const selfTest = runFluencySelfTest;
