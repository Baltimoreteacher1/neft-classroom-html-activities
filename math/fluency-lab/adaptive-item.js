// One place that turns a tier (1-5) into a problem. The generators workstream's generateVariant() supplies
// varied, validated items; when it has none for a skill/tier (it returns null) the existing adaptiveProblem()
// scaffold levels step in. The result carries both: `tier` 1-5 for the new engine, `level` 0-2 for stored entries.
import { tierToLevel } from "./difficulty-levels.js";
import { generateVariant } from "./problem-types-4.js";
import { adaptiveProblem } from "./tutor-engine.js";

const usable = (item) => item && typeof item.question === "string" && item.question && Array.isArray(item.answers) && item.answers.length > 0;
const TIER_TYPES = {
  1: ["visual-model", "number-line"],
  2: ["real-world", "word-problem"],
  3: ["compute", "missing-number"],
  4: ["multi-step", "error-analysis"],
  5: ["equation", "explain", "error-analysis"],
};

export function adaptiveItem(skill, rng, tier, { type } = {}) {
  const level = tierToLevel(tier);
  const variant = generateVariant(skill, rng, { level: tier, type });
  if (usable(variant) && TIER_TYPES[tier]?.includes(variant.type)) return { ...variant, skill, tier, level };
  // A skill can lack the formats preferred for a tier. Keep its established
  // problem shape and tools instead of silently substituting a different format.
  return { ...adaptiveProblem(skill, rng, level), skill, tier, level, type: "compute" };
}
