/**
 * project-registry.mjs — the one reader of data/project-registry.json.
 *
 * Every number a public Projects page prints is derived here, never typed:
 *   - tools/generate-project-studio.mjs writes `missions` onto both index pages;
 *   - validate:projects-registry checks the portfolio page's fallback text
 *     against `projectSets` and `portfolioProjects`.
 * Pure: reads one JSON file and computes.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./projects-inventory.mjs";

export const REGISTRY_PATH = "data/project-registry.json";

export const loadRegistry = (path = join(ROOT, REGISTRY_PATH)) =>
  JSON.parse(readFileSync(path, "utf8"));

export function registryCounts(reg = loadRegistry()) {
  const byClass = {};
  for (const p of reg.projects) byClass[p.classification] = (byClass[p.classification] || 0) + 1;
  return {
    missions: reg.projects.length,
    projectSets: reg.hubs.length,
    portfolioProjects: reg.projects.filter((p) => p.portfolio.listed).length,
    versionPages: reg.projects.filter((p) => p.files.page && p.hubUrl).length,
    byClassification: byClass,
    companions: reg.companions.length,
  };
}
