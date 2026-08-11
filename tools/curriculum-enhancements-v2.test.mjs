// @ts-nocheck
import assert from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");

console.log("Running curriculum enhancements v2 assertions...");

// 1. Assert preset file exists and has valid preset entries
const presetPath = join(root, "assets", "math-workbench-presets.js");
assert(existsSync(presetPath), "assets/math-workbench-presets.js must exist");
const presetContent = readFileSync(presetPath, "utf8");
assert(presetContent.includes("3D Net Cube"), "must contain netfold-cube preset");
assert(presetContent.includes("Equation Balance Scale"), "must contain balance scale preset");
assert(presetContent.includes("Ratio Color Mixer"), "must contain ratio mixer preset");

// 2. Assert project readiness file exists and maps prerequisites
const readinessPath = join(root, "assets", "project-readiness-pathways.js");
assert(existsSync(readinessPath), "assets/project-readiness-pathways.js must exist");
const readinessContent = readFileSync(readinessPath, "utf8");
assert(readinessContent.includes("world-architect"), "must map world-architect prerequisite");
assert(readinessContent.includes("cartesian-odyssey"), "must map cartesian-odyssey prerequisite");
assert(readinessContent.includes("ratio-lab"), "must map ratio-lab prerequisite");

// 3. Assert curriculum/index.html loads preset and readiness scripts
const hubHtml = readFileSync(join(root, "curriculum", "index.html"), "utf8");
assert(
  hubHtml.includes("math-workbench-presets.js"),
  "curriculum/index.html must load math-workbench-presets.js",
);
assert(
  hubHtml.includes("project-readiness-pathways.js"),
  "curriculum/index.html must load project-readiness-pathways.js",
);

console.log("✓ All 3 curriculum enhancement v2 assertions passed cleanly.");
