import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const errors = [];
const requiredFiles = [
  "assets/reveal-math-data.js",
  "assets/reveal-math-tools.css",
  "reveal-evidence-studio/index.html",
  "math-lab-missions/index.html",
  "misconception-museum/index.html",
  "index.html",
  "math/index.html",
];

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const fail = (message) => errors.push(message);

for (const relativePath of requiredFiles) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    fail(`Missing ${relativePath}`);
  }
}

let data = {};
if (fs.existsSync(path.join(root, "assets/reveal-math-data.js"))) {
  try {
    const context = { window: {} };
    vm.createContext(context);
    vm.runInContext(read("assets/reveal-math-data.js"), context, {
      filename: "assets/reveal-math-data.js",
    });
    data = context.window;
  } catch (error) {
    fail(`Could not evaluate assets/reveal-math-data.js: ${error.message}`);
  }
}

const units = data.REVEAL_MATH_UNITS || [];
const lessons = data.REVEAL_MATH_LESSONS || [];
const clusters = data.REVEAL_MATH_CLUSTERS || [];

if (units.length !== 10) fail(`Expected 10 units, found ${units.length}`);
if (lessons.length !== 64) fail(`Expected 64 lessons, found ${lessons.length}`);
if (clusters.length !== 26) fail(`Expected 26 clusters, found ${clusters.length}`);

for (const unit of units) {
  for (const field of ["id", "name"]) {
    if (!unit[field]) fail(`Unit is missing ${field}: ${JSON.stringify(unit)}`);
  }
}

for (const lesson of lessons) {
  for (const field of ["id", "title", "unit", "standard"]) {
    if (!lesson[field]) fail(`Lesson is missing ${field}: ${JSON.stringify(lesson)}`);
  }
}

const lessonIds = lessons.map((lesson) => lesson.id);
const lessonIdSet = new Set(lessonIds);
if (lessonIdSet.size !== lessonIds.length) fail("Lesson ids must be unique.");

const clusterIds = clusters.map((cluster) => cluster.id);
if (new Set(clusterIds).size !== clusterIds.length) fail("Cluster ids must be unique.");

const coveredLessons = new Map();
const requiredClusterFields = [
  "id",
  "title",
  "unit",
  "lessonIds",
  "bigIdea",
  "studentWin",
  "challenge",
  "modelKind",
  "scenario",
  "misconception",
  "repairMove",
  "hint",
];

for (const cluster of clusters) {
  for (const field of requiredClusterFields) {
    const value = cluster[field];
    if (Array.isArray(value) ? value.length === 0 : !value) {
      fail(`Cluster ${cluster.id || "(missing id)"} is missing ${field}`);
    }
  }

  if (!Array.isArray(cluster.prompts) || cluster.prompts.length === 0) {
    fail(`Cluster ${cluster.id} is missing generated prompts.`);
  }

  if (typeof cluster.modelKind !== "string" || cluster.modelKind.trim() === "") {
    fail(`Cluster ${cluster.id} has an empty modelKind.`);
  }

  for (const lessonId of cluster.lessonIds || []) {
    if (!lessonIdSet.has(lessonId)) {
      fail(`Cluster ${cluster.id} references unknown lesson ${lessonId}`);
      continue;
    }
    coveredLessons.set(lessonId, (coveredLessons.get(lessonId) || 0) + 1);
  }
}

for (const lessonId of lessonIds) {
  const count = coveredLessons.get(lessonId) || 0;
  if (count !== 1) fail(`Lesson ${lessonId} is covered ${count} time(s) by clusters.`);
}

const toolHrefs = [
  "/reveal-evidence-studio/",
  "/math-lab-missions/",
  "/misconception-museum/",
];
for (const dashboard of ["index.html", "math/index.html"]) {
  const html = fs.existsSync(path.join(root, dashboard)) ? read(dashboard) : "";
  for (const href of toolHrefs) {
    if (!html.includes(`href="${href}"`)) fail(`${dashboard} does not link to ${href}`);
  }
}

for (const activity of [
  "reveal-evidence-studio/index.html",
  "math-lab-missions/index.html",
  "misconception-museum/index.html",
]) {
  const html = fs.existsSync(path.join(root, activity)) ? read(activity) : "";
  if (!html.includes('href="/assets/reveal-math-tools.css"')) {
    fail(`${activity} does not use /assets/reveal-math-tools.css`);
  }
  if (!html.includes('src="/assets/reveal-math-data.js"')) {
    fail(`${activity} does not use /assets/reveal-math-data.js`);
  }
}

if (errors.length > 0) {
  console.error("Reveal Math tools validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Reveal Math tools validation passed.");
