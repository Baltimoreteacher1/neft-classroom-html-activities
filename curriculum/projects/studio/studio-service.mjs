import { PROJECTS } from "./projects.mjs";
import { model } from "./math.mjs";
import { visualMarkup } from "./visuals.mjs";

export function validateConfig(project) {
  const errors = [];
  if (!project?.id || !project.title) errors.push("Mission id and title are required.");
  if (!Array.isArray(project?.choices) || project.choices.length !== 3) errors.push("Each mission needs exactly three context choices.");
  if (!Array.isArray(project?.evidence) || !project.evidence.length) errors.push("Mission evidence prompts are required.");
  if (!Array.isArray(project?.discourse) || project.discourse.length !== 2 || project.discourse.some((s) => !s)) errors.push("Bilingual Tier 2/3 discourse frames are required.");
  if (!project?.crosswalk?.ccss?.length || !project?.crosswalk?.smp?.length) errors.push("CCSS-M and SMP crosswalks are required.");
  return { valid: errors.length === 0, errors };
}

export function deltaMetrics(project, baseline, revised) {
  return Object.fromEntries(Object.keys(revised || {}).map((key) => {
    const before = Number(baseline?.[key]), after = Number(revised[key]);
    return [key, { before, after, delta: Number.isFinite(before) && Number.isFinite(after) ? after - before : null }];
  }));
}

export function selfTestProjectStudio() {
  const errors = [];
  const ids = new Set();
  for (const project of PROJECTS) {
    if (ids.has(project.id)) errors.push(`${project.id}: duplicate id`);
    ids.add(project.id);
    const config = validateConfig(project);
    errors.push(...config.errors.map((error) => `${project.id}: ${error}`));
    for (const [index, context] of project.choices.entries()) {
      const design = project.contextDesigns?.[index] || project.defaults;
      const result = model(project, design);
      if (result.errors.length) errors.push(`${project.id}/${context}: ${result.errors.join("; ")}`);
      if (result.checks.length !== 6) errors.push(`${project.id}/${context}: expected six math checks, got ${result.checks.length}`);
      if (result.checks.some((check) => !Number.isFinite(check.answer))) errors.push(`${project.id}/${context}: non-finite answer`);
      const svg = visualMarkup(result);
      if (svg && (!svg.includes("<svg") || !svg.includes("</svg>") || /NaN|undefined/.test(svg))) errors.push(`${project.id}/${context}: invalid SVG markup`);
    }
  }
  if (PROJECTS.length !== 30) errors.push(`Expected 30 missions, got ${PROJECTS.length}`);
  return { passed: errors.length === 0, missionCount: PROJECTS.length, errors };
}
