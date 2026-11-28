// Both the Studio and print builder use the original Fluency Lab registry and answer rules.
import { ALL_SKILLS, generateProblem, seededRandom } from "../../../math/fluency-lab/problem-bank.js";
import { adaptiveProblem } from "../../../math/fluency-lab/tutor-engine.js";

export { validateAnswer } from "../../../math/fluency-lab/problem-bank.js";

export function sourceSkill(grade, sourceId) {
  return ALL_SKILLS.find((skill) => skill.grade === grade && skill.id === sourceId) || null;
}

// The entries use established generator options and stay in the same skill's mathematical scope.
// A tighter grade-specific fact (e.g. add within 10) keeps its own maximum.
const STRETCH = {
  "4:round-large": { places: [1000] },
  "5:decimal-add": { places: 3 },
  "5:decimal-sub": { places: 3 },
  "5:fraction-add": { maxDenominator: 14 },
  "6:ratios": { maxFactor: 14 },
  "6:divide-fractions": { maxDenominator: 14 },
  "6:triangle-area": { max: 24 },
  "7:proportions": { maxFactor: 12 },
  "8:linear-equations": { maxCoefficient: 16 },
  "8:exponents": { maxBase: 15 },
};
// The source's generic warm-up caps would drop the target number of digits for these skills.
const WARMUPS = {
  "4:round-large": { max: 100000, places: [100, 1000] },
  "6:multi-digit-division": { maxDivisor: 19, maxQuotient: 199 },
};
const keyOf = (skill) => `${skill.grade}:${skill.id}`;
const stretchFor = (skill) => STRETCH[keyOf(skill)];
export const hasStretchRange = (skill) => Boolean(stretchFor(skill));

export function practiceProblem(skill, seed, level = 2) {
  const rng = seededRandom(seed);
  const warmup = level === 1 && WARMUPS[keyOf(skill)];
  if (level === 1 && !warmup) return adaptiveProblem(skill, rng, 0);
  const config = warmup || (level === 3 && stretchFor(skill));
  const selection = config ? { ...skill, config: { ...skill.config, ...config } } : skill;
  return generateProblem(selection, rng);
}
