// Varied, validated problem types for all 96 skills (workstream "generators").
//   variantsFor(skill)                      -> type ids the skill supports
//   generateVariant(skill, rng, { level, type?, avoid? }) -> item | null
// A skill is an ALL_SKILLS entry or a "grade:id" key. Levels: 1 concrete visual foundations, 2 foundational
// application, 3 grade-level proficiency, 4 multi-step reasoning, 5 advanced transfer and challenge. Difficulty
// comes from structure (picture, steps, context, transfer), not from bigger numbers.
// Types: compute, missing-number, number-line, visual-model, real-world, error-analysis, word-problem,
// multi-step, equation, explain. Every skill supports compute and error-analysis; the rest follow the maths.
// An item is a problem-bank item ({ question, answers, hint, explanation, steps, kind, choices?, unit?, expr? })
// plus { level, type, questionEs, model?: { graphic, config }, meta }. meta holds what an independent checker needs.
// `avoid` is a list of question texts already shown in the run; a variant is redrawn until it is new.
// null means "no variant for this skill, level or type": callers fall back to adaptiveProblem.
import { FAMILIES } from "./problem-types/families.js";
import { errorAnalysisDraft } from "./problem-types/error-analysis.js";
import { finish } from "./problem-types/kit.js";

export const TYPES = ["compute", "missing-number", "number-line", "visual-model", "real-world", "error-analysis", "word-problem", "multi-step", "equation", "explain"];
export { TYPES as PROBLEM_VARIANT_TYPES };

const skillKey = (skill) => (typeof skill === "string" ? skill : `${skill.grade}:${skill.id}`);
const INDEX = new Map();
for (const family of FAMILIES) for (const [key, spec] of Object.entries(family.skills)) INDEX.set(key, { family, spec });

// Which draft builder serves a type for a skill (error-analysis is shared by every skill).
function builderFor(entry, type) {
  if (type === "error-analysis") return errorAnalysisDraft;
  const { family, spec } = entry;
  const build = family.types[type];
  if (!build || (family.supports?.[type] && !family.supports[type](spec))) return null;
  return build;
}
const levelsOf = (entry, type) => (type === "error-analysis" ? [1, 5] : entry.family.range?.[type] || [1, 5]);
// The [min, max] levels a skill supports for a type, or null when it does not support the type.
export function levelRange(skill, type) {
  const entry = INDEX.get(skillKey(skill));
  return entry && builderFor(entry, type) ? levelsOf(entry, type) : null;
}

export function variantsFor(skill, level = null) {
  const entry = INDEX.get(skillKey(skill));
  if (!entry) return [];
  return TYPES.filter((type) => {
    if (!builderFor(entry, type)) return false;
    if (level == null) return true;
    const [lo, hi] = levelsOf(entry, type);
    return level >= lo && level <= hi;
  });
}

// How likely each type is at each level when the caller does not name one (index = level - 1).
const AFFINITY = {
  compute: [3, 2, 3, 2, 1],
  "missing-number": [1, 2, 2, 2, 2],
  "number-line": [3, 2, 2, 1, 1],
  "visual-model": [3, 3, 2, 1, 1],
  "real-world": [0, 2, 2, 2, 2],
  "word-problem": [2, 3, 2, 1, 1],
  "error-analysis": [0, 1, 1, 2, 3],
  equation: [0, 1, 2, 2, 2],
  "multi-step": [0, 1, 1, 3, 3],
  explain: [1, 1, 1, 2, 3],
};
function chooseType(types, level, rng) {
  const weights = types.map((type) => AFFINITY[type][level - 1]);
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (!total) return types[Math.floor(rng() * types.length)];
  let at = rng() * total;
  for (let i = 0; i < types.length; i += 1) {
    at -= weights[i];
    if (at < 0) return types[i];
  }
  return types.at(-1);
}

export const lastError = { message: "" };
const clampLevel = (level) => Math.min(5, Math.max(1, Math.round(Number(level) || 3)));

export function generateVariant(skill, rng, options = {}) {
  const entry = INDEX.get(skillKey(skill));
  const level = clampLevel(options.level);
  if (!entry || typeof rng !== "function") return null;
  const allowed = variantsFor(skill, level);
  const type = options.type ?? chooseType(allowed, level, rng);
  if (!allowed.includes(type)) return null;
  const build = builderFor(entry, type);
  const skillObject = typeof skill === "string" ? { id: skill.split(":")[1], grade: Number(skill.split(":")[0]) } : skill;
  const avoid = new Set(options.avoid || []);
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const ctx = { rng, level, spec: entry.spec, skill: skillObject, type };
      const item = finish(build(ctx), ctx);
      if (!avoid.has(item.question)) return item;
      lastError.message = "repeated question";
    } catch (error) {
      lastError.message = String(error?.message || error);
    }
  }
  return null;
}
