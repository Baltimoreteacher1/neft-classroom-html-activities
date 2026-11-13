#!/usr/bin/env node
/**
 * Inventory the Grade 6 curriculum for the publisher upgrade.
 * Writes docs/publisher-upgrade/coverage-matrix.json and coverage-report.md.
 *
 * node scripts/publisher-coverage.mjs
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, "docs/publisher-upgrade");

function listDirs(dir) {
  const full = join(ROOT, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full).filter((name) => {
    try {
      return statSync(join(full, name)).isDirectory();
    } catch {
      return false;
    }
  });
}

function coreLessons() {
  return listDirs("lessons").filter(
    (id) => /^\d+-\d+$/.test(id) && existsSync(join(ROOT, "lessons", id, "config.json")),
  );
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

const lessons = coreLessons();
const flagship = listDirs("lessons").filter((id) => id.endsWith("-flagship"));
const labs = listDirs("curriculum/learning-labs").filter(
  (id) => existsSync(join(ROOT, "curriculum/learning-labs", id, "index.html")) && id !== "shared",
);
const practice = existsSync(join(ROOT, "math/practice-studio"))
  ? listDirs("math/practice-studio").filter((id) => /^\d+-\d+$/.test(id))
  : [];
const smallGroups = listDirs("lessons").filter((id) => /-(group1|group2|catchup)$/.test(id));
const family = lessons.filter((id) => existsSync(join(ROOT, "lessons", id, "homework.html")));
const gameDirs = ["math/games", "curriculum/arcade"].flatMap((dir) =>
  existsSync(join(ROOT, dir)) ? listDirs(dir).map((name) => `${dir}/${name}`) : [],
);
const projects = existsSync(join(ROOT, "curriculum/projects/studio/projects.mjs")) ? 1 : 0;
const novels = listDirs("graphic-novels");

const teacherTools = [
  ["living-map", "/curriculum/map/", "curriculum/map/index.html"],
  ["forge", "/curriculum/forge/", "curriculum/forge/index.html"],
  ["runtime", "/curriculum/runtime/", "curriculum/runtime/index.html"],
  ["insight", "/teacher-tools/insight-brief/", "teacher-tools/insight-brief/index.html"],
  ["class-boss", "/curriculum/class-boss/", "curriculum/class-boss/index.html"],
  [
    "teach-the-machine",
    "/curriculum/teach-the-machine/",
    "curriculum/teach-the-machine/index.html",
  ],
  ["pacing", "/curriculum/planning/", "curriculum/planning/index.html"],
  ["class-board", "/math/student-board/", "math/student-board/index.html"],
  [
    "command-center",
    "/teacher-tools/canvas-command-center/",
    "teacher-tools/canvas-command-center/index.html",
  ],
  ["scorm", "/teacher-tools/canvas-scorm/", "teacher-tools/canvas-scorm/index.html"],
];

const rows = [];

function row(partial) {
  rows.push({
    feature_id: partial.feature_id,
    route: partial.route,
    lesson_id: partial.lesson_id || "",
    feature_family: partial.feature_family,
    instructional_goal: partial.instructional_goal,
    existing_capability: partial.existing_capability,
    verified_defects: partial.verified_defects || "",
    enhancements_required: partial.enhancements_required || "",
    implementation_status: partial.implementation_status,
    tests: partial.tests || "",
    evidence: partial.evidence || "",
  });
}

for (const id of lessons) {
  const cfg = readJson(join(ROOT, "lessons", id, "config.json")) || {};
  const touched = id === "6-4";
  row({
    feature_id: `lesson-${id}`,
    route: `/lessons/${id}/`,
    lesson_id: id,
    feature_family: "lessons",
    instructional_goal: cfg.contentObjective || cfg.title || "",
    existing_capability: "Engine-rendered lesson shell, hint ladder, save/resume, EN/ES stacks.",
    verified_defects: touched
      ? "Title emphasized exponents while standard 6.AT.6c is evaluating expressions at specific values. Target updated from the standard, the title's powers, and the launch substitution task."
      : "",
    enhancements_required: touched
      ? "Keep Part 2 separate. Generated printables that copy the objective were string-aligned."
      : "Individual lesson files were not rewritten.",
    implementation_status: touched ? "substantially-enhance" : "extend",
    tests: touched
      ? "engine/core/publisher-upgrade.test.mjs lesson 6-4"
      : "shared engine tests; not an individual lesson play-through",
    evidence: touched
      ? "lessons/6-4/config.json contentObjective"
      : "engine/core/app.js sidebar goal; engine/core/hint-ladder.js; engine/core/learning-events.js",
  });
}

for (const id of labs) {
  row({
    feature_id: `lab-${id}`,
    route: `/curriculum/learning-labs/${id}/`,
    lesson_id: "",
    feature_family: "learning-labs",
    instructional_goal: "Mission, Learn, Investigate, Practice, Create, Games.",
    existing_capability: "Shared lab runtime already mounts a manipulable model on Investigate.",
    verified_defects: "",
    enhancements_required: "Bespoke lab mathematics was not rebuilt one lab at a time.",
    implementation_status: "preserve-polish",
    tests: "existing learning-labs tests; this pass did not browser-play every lab",
    evidence: "curriculum/learning-labs/shared/progress.mjs; activities.mjs investigate copy",
  });
}

for (const id of practice) {
  row({
    feature_id: `practice-${id}`,
    route: `/math/practice-studio/${id}/`,
    lesson_id: id,
    feature_family: "practice",
    instructional_goal: "Prepare, explore, guided, independent, reason, apply, improve.",
    existing_capability: "Generated practice studios with hints, Spanish, and adaptive levels.",
    enhancements_required:
      "Studios were not regenerated. The shared clarity script adds the arc on load.",
    implementation_status: "extend",
    tests: "engine/core/publisher-upgrade.test.mjs hint roles",
    evidence: "assets/studio/clarity.js practice arc",
  });
}

for (const id of smallGroups) {
  const challenge = id.endsWith("group2");
  row({
    feature_id: `small-group-${id}`,
    route: `/lessons/${id}/`,
    lesson_id: id,
    feature_family: "small-groups",
    instructional_goal: challenge
      ? "Challenge adds reasoning depth, not only larger numbers."
      : "Support small group with a teacher launch card.",
    existing_capability:
      "Five stable stage ids. Teacher view already held objective, timing, and next step.",
    enhancements_required: "Student stage ids were not renamed.",
    implementation_status: "extend",
    tests: "engine/core/small-group-pathway.test.mjs still pins stage ids",
    evidence: "engine/core/small-group-teacher-view.js launch card",
  });
}

for (const id of family) {
  row({
    feature_id: `family-${id}`,
    route: `/lessons/${id}/homework.html`,
    lesson_id: id,
    feature_family: "family",
    instructional_goal:
      "What we are learning, see it, try it together, your turn, need help, finish. Optional and ungraded.",
    existing_capability:
      "Five-stop family mission already says optional and ungraded. EN/ES toggle does not clear answers.",
    verified_defects: "",
    enhancements_required:
      "Generated homework.html pages were not regenerated, so the new path sentence is in the generator source only.",
    implementation_status: "preserve-polish",
    tests: "engine/core/publisher-upgrade.test.mjs family optional-language guard",
    evidence: "scripts/lib/homework-mission.mjs; scripts/homework-guided-notes.mjs setLanguageMode",
  });
}

for (const dir of gameDirs) {
  row({
    feature_id: `game-${dir.replaceAll("/", "-")}`,
    route: `/${dir}/`,
    lesson_id: "",
    feature_family: "arcade-games",
    instructional_goal: "Math drives the mechanic where a shared engine exists.",
    existing_capability:
      "Shared fluency and canvas engines already exist for ratio, percent, area, equations, and data.",
    verified_defects: "",
    enhancements_required:
      "reviewed-not-rebuilt: this pass did not individually rebuild bespoke game cabinets.",
    implementation_status: "reviewed-not-rebuilt",
    tests: "not individually retested",
    evidence: "docs/publisher-upgrade/upgrade-register.md",
  });
}

row({
  feature_id: "project-studio",
  route: "/curriculum/projects/studio/?project=discovery",
  lesson_id: "",
  feature_family: "projects",
  instructional_goal: "Plan, build, test, revise, explain.",
  existing_capability: `Project studio catalogue present: ${projects === 1 ? "yes" : "no"}. Stage indexes unchanged.`,
  implementation_status: "extend",
  tests: "route file exists; studio stage labels updated in source",
  evidence: "curriculum/projects/studio/studio.js",
});

row({
  feature_id: "math-workbench",
  route: "/curriculum/math-workbench/",
  lesson_id: "",
  feature_family: "workbench",
  instructional_goal: "Plan, build, test, revise, explain on the existing workbench.",
  existing_capability: "Math Workbench already ships.",
  enhancements_required: "Workbench internals were not replaced.",
  implementation_status: "preserve-polish",
  tests: "not re-run as a browser suite in this pass",
  evidence: "curriculum/math-workbench/index.html",
});

for (const id of novels) {
  if (id.startsWith("_")) continue;
  row({
    feature_id: `graphic-novel-${id}`,
    route: `/graphic-novels/${id}/`,
    lesson_id: "",
    feature_family: "graphic-novels",
    instructional_goal: "Keep the existing story and characters readable.",
    existing_capability: "Existing graphic novel pages.",
    enhancements_required: "Stories and characters were not replaced.",
    implementation_status: "preserve-polish",
    tests: "route inventory only",
    evidence: `graphic-novels/${id}/`,
  });
}

for (const [id, route, file] of teacherTools) {
  const present = existsSync(join(ROOT, file));
  row({
    feature_id: `teacher-${id}`,
    route,
    lesson_id: "",
    feature_family: "teacher-tools",
    instructional_goal:
      id === "living-map"
        ? "Selecting a standard shows understanding, stored prerequisites, lessons, practice, support, challenge, and a next step."
        : "Keep the existing teacher tool reachable from the curriculum home.",
    existing_capability: present ? "Page exists." : "Page missing.",
    verified_defects: present ? "" : "Route file was not on disk.",
    enhancements_required:
      id === "living-map" ? "No dependencies were invented." : "Tool behavior was not rebuilt.",
    implementation_status: id === "living-map" || id === "pacing" ? "extend" : "preserve-polish",
    tests:
      id === "living-map"
        ? "engine/core/publisher-upgrade.test.mjs standard plan"
        : "route smoke list",
    evidence: file,
  });
}

row({
  feature_id: "teacher-home",
  route: "/curriculum/",
  lesson_id: "",
  feature_family: "teacher-tools",
  instructional_goal:
    "Teach today, Plan, Respond, and Resource library, with the rest of the hub still on the page.",
  existing_capability:
    "Curriculum hub already linked Forge, the map, Class Boss, pacing, SCORM, family, and the command center.",
  implementation_status: "extend",
  tests: "route smoke list",
  evidence: "curriculum/index.html #hub-home-organize",
});

row({
  feature_id: "ratio-canvas",
  route: "/curriculum/math-canvas/?scene=equivalent-ratios&lesson=3-3",
  lesson_id: "3-3",
  feature_family: "representations",
  instructional_goal:
    "One scale factor updates the quantity model, tape, double number line, table, and symbolic statement.",
  existing_capability: "Living Math Canvas already synced tape, double number line, and table.",
  implementation_status: "substantially-enhance",
  tests: "engine/core/publisher-upgrade.test.mjs ratio invariance",
  evidence: "assets/ewl/lens-ratio.js quantity and statement reps; data/ewl/canvas-scenes.json",
});

row({
  feature_id: "exponent-repair",
  route: "/curriculum/almost-right-lab/#exponent-repair",
  lesson_id: "6-4",
  feature_family: "misconceptions",
  instructional_goal:
    "3^2 is repeated multiplication. A product bug opens a repair and a fresh item.",
  existing_capability: "Misconception taxonomy already predicted exponent-as-multiplication.",
  implementation_status: "extend",
  tests: "engine/core/publisher-upgrade.test.mjs exponent",
  evidence:
    "engine/core/publisher-models.js; engine/core/misconceptions.js re-export; curriculum/almost-right-lab/index.html",
});

const counts = {};
for (const item of rows) {
  counts[item.implementation_status] = (counts[item.implementation_status] || 0) + 1;
  counts[`family:${item.feature_family}`] = (counts[`family:${item.feature_family}`] || 0) + 1;
}

const summary = {
  generated_at: new Date().toISOString(),
  core_lessons: lessons.length,
  flagship_excluded: flagship.length,
  rows: rows.length,
  counts,
  notes: [
    "Flagship lesson folders are excluded from the lesson rows.",
    "District teaching order is unchanged.",
    "reviewed-not-rebuilt means the surface was inventoried and left on its existing engine.",
    "Family homework HTML was not regenerated.",
  ],
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(
  join(OUT_DIR, "coverage-matrix.json"),
  `${JSON.stringify({ summary, rows }, null, 2)}\n`,
);

const lines = [
  "# Coverage report",
  "",
  `Generated by \`node scripts/publisher-coverage.mjs\` at ${summary.generated_at}.`,
  "",
  `- Core lesson launchers inventoried: ${lessons.length}`,
  `- Flagship folders excluded: ${flagship.length}`,
  `- Matrix rows: ${rows.length}`,
  `- Learning labs: ${labs.length}`,
  `- Practice studios: ${practice.length}`,
  `- Small-group variants: ${smallGroups.length}`,
  `- Family homework pages: ${family.length}`,
  `- Game directories inventoried: ${gameDirs.length}`,
  "",
  "## Status counts",
  "",
  ...Object.entries(counts)
    .filter(([key]) => !key.startsWith("family:"))
    .map(([key, value]) => `- ${key}: ${value}`),
  "",
  "## What was reviewed",
  "",
  "| Check | Count | Notes |",
  "| --- | ---: | --- |",
  `| Inventoried | ${rows.length} | Every row in coverage-matrix.json |`,
  `| Reviewed | ${rows.length} | Inventory plus the shared-engine pass |`,
  `| Modified via shared engine | ${lessons.length} lessons, ${practice.length} studios, ${smallGroups.length} small groups | Shell, hints, learning events, practice arc, teacher launch card |`,
  `| Modified individually | 1 lesson target (6-4 and its three sibling configs) plus copied objective strings | Not a per-lesson content rewrite |`,
  `| Math-validated in this pass | exponent, ratio scale, equation balance | See math-validation.md |`,
  `| Functionally tested | publisher-upgrade.test.mjs | Not a full browser sweep |`,
  `| A11y reviewed | shared focus, touch, reduced-motion, and feedback tokens | No full axe sweep this pass |`,
  `| Visually reviewed | not in a browser this pass | See ux-accessibility.md |`,
  `| Completed | shared foundations and the five demo routes as files | Large families remain on their previous pages |`,
  `| Blocked | family HTML regeneration, bespoke game rebuilds, full QA loop | Named in technical-regression.md |`,
  "",
  "District teaching order was not replaced with textbook unit order.",
  "",
];
writeFileSync(join(OUT_DIR, "coverage-report.md"), `${lines.join("\n")}\n`);
console.log(`publisher-coverage: ${lessons.length} core lessons, ${rows.length} rows`);
console.log(JSON.stringify(counts, null, 2));
