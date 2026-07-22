#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const passes = [];

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function check(condition, message) {
  (condition ? passes : failures).push(message);
}

const hub = read("curriculum/index.html");
const guidedJs = read("assets/curriculum-guided-path.js");
const guidedCss = read("assets/curriculum-guided-path.css");
const sidebarJs = read("assets/curriculum-sidebar.js");
const launcher = read("assets/curriculum-student-launch.js");
const launcherCss = read("assets/curriculum-student-launch.css");
const launcherHtml = read("curriculum/student-launch/index.html");
const lessonI18n = read("engine/core/i18n.js");
const lessonApp = read("engine/core/app.js");
const teacherMode = read("engine/core/teacher-mode.js");
const workflow = JSON.parse(read("data/curriculum-teacher-workflow.json"));
const supports = JSON.parse(read("data/curriculum-supports.json"));
const launchData = JSON.parse(read("data/curriculum-launch-manifest.json"));

for (const marker of ["Teach today", "Plan the week", "Explore by unit", "How learning works here"])
  check(hub.includes(marker), `hub includes ${marker}`);
check((hub.match(/<h1\b/g) || []).length === 1, "hub exposes one page-level heading");
check(
  hub.includes("/evidence/") && hub.includes("/families/"),
  "hub surfaces evidence and family support",
);
check(
  hub.includes("curriculum-guided-path.css") && hub.includes("curriculum-guided-path.js"),
  "hub wires guided-path assets",
);
check(
  guidedJs.includes("curriculum-tools-disclosure"),
  "teacher tool inventory is progressively disclosed",
);
check(
  hub.includes("curriculum-sidebar.js") && sidebarJs.includes('btn.className = "curr-rail-item"'),
  "hub retains its canonical unit rail",
);
check(
  !guidedJs.includes("card.hidden") && !guidedJs.includes("curriculum-unit-nav"),
  "guided path does not compete with the canonical unit rail",
);
check(
  guidedJs.includes("details.unit") && guidedJs.includes("printUnits.appendChild(unit)"),
  "print-only units leave the interactive DOM until printing",
);
check(/min-height:\s*(?:48|52)px/.test(guidedCss), "guided actions use accessible target sizes");

check(
  launcher.includes('searchParams.set("student", "1")'),
  "student launcher forces student-safe lesson routes",
);
check(launcher.includes("updateNextStep"), "student progress produces a next instructional move");
check(
  launcherHtml.includes("first name and last initial"),
  "launcher states the lesson identity expectation",
);
check(
  /\[hidden\]\s*\{[^}]*display:\s*none\s*!important/s.test(launcherCss),
  "hidden launcher states stay out of view",
);
check(
  lessonI18n.includes("classroom submissions or exports"),
  "lesson explains identity data use before collection",
);
check(
  lessonApp.includes("Responses leave this site"),
  "external form disclosure appears at the links",
);
check(
  teacherMode.includes("route-level safety boundary") &&
    !teacherMode.includes('params.get("student") === "1") setStickyTeacher(false)'),
  "student-safe links do not erase teacher state in other tabs",
);

const resolveFamily = (lesson) => {
  const text = `${lesson.title} ${lesson.standard}`.toLowerCase();
  return (
    workflow.familyRules.find((rule) => new RegExp(rule.pattern, "i").test(text))?.family ||
    "general"
  );
};
const lessonsById = new Map(launchData.lessons.map((lesson) => [lesson.id, lesson]));
check(
  resolveFamily(lessonsById.get("1-1")) === "numberTheory",
  "Prime Factorization no longer receives decimal guidance",
);
check(
  resolveFamily(lessonsById.get("1-5")) === "decimals",
  "decimal lesson keeps decimal guidance",
);
check(
  Boolean(workflow.families.numberTheory && supports.families.numberTheory),
  "number-theory readiness and WIDA supports are complete",
);

console.log("curriculum guided-path validation");
passes.forEach((message) => console.log(`  PASS ${message}`));
failures.forEach((message) => console.log(`  FAIL ${message}`));
console.log(`\n${passes.length} passed, ${failures.length} failed`);
process.exit(failures.length ? 1 : 0);
