// The coverage table (skill x type) rendered from the live registry, so the documented table can never drift
// from the code. problem-types/README.md holds the rendered copy; the test compares them.
import { ALL_SKILLS } from "../problem-bank.js";
import { TYPES, levelRange, variantsFor } from "../problem-types-4.js";
import { NOT_APPLICABLE } from "./not-applicable.js";

const cell = (skill, type) => {
  if (!variantsFor(skill).includes(type)) return "n/a";
  const [lo, hi] = levelRange(skill, type);
  return lo === 1 && hi === 5 ? "1-5" : `${lo}-${hi}`;
};

export function renderCoverage() {
  const head = `| skill | ${TYPES.join(" | ")} |`;
  const rule = `| --- | ${TYPES.map(() => "---").join(" | ")} |`;
  const rows = ALL_SKILLS.map((skill) => `| ${skill.grade}:${skill.id} | ${TYPES.map((type) => cell(skill, type)).join(" | ")} |`);
  const reasons = Object.entries(NOT_APPLICABLE).map(([type, why]) => `- **${type}** is n/a when ${why}`);
  return [head, rule, ...rows, "", "Cells show the levels (1-5) at which a type is generated; n/a means the type is not generated for that skill.", "", ...reasons, ""].join("\n");
}
