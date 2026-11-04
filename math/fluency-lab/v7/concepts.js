// EduWonderLab 7.0 concept registry. It joins what the lab already owns — skills (problem-bank), prerequisite graph and
// models (e8/knowledge-graph), misconceptions (e8/misconception-library) — into one lookup the shell, workspace, tutor and
// learner model all share. It authors no mathematics: every field is read from those sources, so it cannot drift from them.
import { ALL_SKILLS } from "../problem-bank.js";
import { buildGraph, directPrerequisites, modelsForSkill, skillNode } from "../e8/knowledge-graph.js";
import { MISCONCEPTIONS } from "../e8/misconception-library.js";
import "../e8/models.js";
import { getModel } from "../e8/engine-core.js";

export const BANDS = [
  { id: "1-2", grades: [1, 2], name: { en: "Grades 1–2", es: "Grados 1–2" } },
  { id: "3-4", grades: [3, 4], name: { en: "Grades 3–4", es: "Grados 3–4" } },
  { id: "5-6", grades: [5, 6], name: { en: "Grades 5–6", es: "Grados 5–6" } },
  { id: "7-8", grades: [7, 8], name: { en: "Grades 7–8", es: "Grados 7–8" } },
];
export const bandFor = (grade) => BANDS.find((band) => band.grades.includes(Number(grade))) || BANDS[1];

export const keyOf = (skill) => `${skill.grade}:${skill.id}`;
export const skillByKey = (key) => ALL_SKILLS.find((skill) => keyOf(skill) === key) || null;

// The five flagship scenarios from the 7.0 brief. Grade 2 has no multiplication generator in the bank (its only
// multiplication-adjacent skill is skip counting), so the array lesson borrows the Grade 3 facts generator; the registry
// records that honestly instead of pretending a Grade 2 skill exists.
export const FLAGSHIPS = [
  { grade: 2, skill: "3:mul-0-5", model: "array", borrowed: true, title: { en: "Multiplication arrays", es: "Arreglos de multiplicación" } },
  { grade: 4, skill: "4:fraction-equiv", model: "fractionBar", title: { en: "Equivalent fractions", es: "Fracciones equivalentes" } },
  { grade: 6, skill: "6:ratios", model: "tapeRatio", title: { en: "Ratios", es: "Razones" } },
  { grade: 7, skill: "7:equations", model: "balanceScale", title: { en: "Solving equations", es: "Resolver ecuaciones" } },
  { grade: 8, skill: "8:slope", model: "linearGraph", title: { en: "Linear relationships", es: "Relaciones lineales" } },
];

export function misconceptionsFor(key, model = null) {
  return MISCONCEPTIONS.filter((m) => (m.skills || []).includes(key) || (model && (m.models || []).includes(model)));
}

// One record per skill: what it is, what it needs, which living model shows it, which ideas students commonly get wrong.
export function conceptFor(key) {
  const skill = skillByKey(key);
  const node = skillNode(key);
  if (!skill || !node) return null;
  const models = modelsForSkill(skill).filter((id) => getModel(id));
  return {
    key,
    skill,
    grade: skill.grade,
    band: bandFor(skill.grade),
    title: skill.title,
    standard: skill.standard,
    domain: node.domain,
    prerequisites: directPrerequisites(key),
    models,
    primaryModel: models[0] || null,
    misconceptions: misconceptionsFor(key, models[0]).map((m) => m.id),
  };
}

export function skillsForGrade(grade) {
  return ALL_SKILLS.filter((skill) => skill.grade === Number(grade));
}

// Honest coverage numbers for the report: how many skills at each grade have a living model and a known misconception.
export function coverage() {
  buildGraph();
  return Array.from({ length: 8 }, (_, i) => i + 1).map((grade) => {
    const concepts = skillsForGrade(grade).map((skill) => conceptFor(keyOf(skill)));
    return {
      grade,
      skills: concepts.length,
      withModel: concepts.filter((c) => c.models.length).length,
      withMisconception: concepts.filter((c) => c.misconceptions.length).length,
    };
  });
}

// Params that put THIS problem's givens into a living model, or null when the question does not map cleanly. Only the
// givens are placed, never the answer (a slope model would print the slope, so linearGraph deliberately returns null).
export function stageParams(modelId, question) {
  const q = String(question || "").replace(/[−–]/g, "-").replace(/×/g, "x").replace(/\s+/g, " ").trim();
  let m;
  if (modelId === "array" && (m = q.match(/^(\d+) x (\d+) = \?$/))) return { rows: Number(m[1]), cols: Number(m[2]) };
  if (modelId === "fractionBar" && (m = q.match(/^(\d+)\/(\d+) = /))) return Number(m[1]) <= Number(m[2]) && Number(m[2]) <= 12 ? { n: Number(m[1]), d: Number(m[2]) } : null;
  if (modelId === "tapeRatio" && (m = q.match(/^(\d+):(\d+) = /))) return { a: Number(m[1]), b: Number(m[2]), k: 1, names: ["first", "second"], short: ["first", "second"] };
  if (modelId === "balanceScale" && (m = q.match(/^(\d+)x ([+-]) (\d+) = (-?\d+)\./))) return { a: Number(m[1]), b: m[2] === "-" ? -Number(m[3]) : Number(m[3]), c: 0, d: Number(m[4]) };
  return null;
}
