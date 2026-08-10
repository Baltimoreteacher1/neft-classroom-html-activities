#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const passes = [];

function check(condition, message) {
  (condition ? passes : failures).push(message);
}

function read(relativePath) {
  const path = join(ROOT, relativePath);
  if (!existsSync(path)) {
    failures.push(`missing ${relativePath}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

const hub = read("curriculum/index.html");
const workflowJs = read("assets/curriculum-teacher-workflow.js");
const workflowCss = read("assets/curriculum-teacher-workflow.css");
const launcherHtml = read("curriculum/student-launch/index.html");
const launcherJs = read("assets/curriculum-student-launch.js");
const launcherCss = read("assets/curriculum-student-launch.css");
const generator = read("scripts/generate-curriculum-launch-manifest.mjs");
const workflowDataRaw = read("data/curriculum-teacher-workflow.json");
const supportDataRaw = read("data/curriculum-supports.json");
const launchDataRaw = read("data/curriculum-launch-manifest.json");

check(hub.includes("curriculum-teacher-workflow.css"), "hub wires teacher workflow CSS");
check(hub.includes("curriculum-teacher-workflow.js"), "hub wires teacher workflow JS");
check(
  /classList\.contains\(["']teacher-mode["']\)/.test(workflowJs) &&
    /MutationObserver/.test(workflowJs),
  "workflow is synchronized to existing Teacher Mode",
);

for (const marker of [
  "Today's Teaching",
  "Weekly Pacing",
  "Student Playlist",
  "Unit Map",
  "Next-Day Plan",
]) {
  check(workflowJs.includes(marker), `workflow includes ${marker}`);
}

check(/localStorage/.test(workflowJs), "teacher workflow persists locally");
check(
  !/fetch\([^)]*(?:api|worker|forms)/i.test(workflowJs),
  "teacher workflow has no remote data submission",
);
check(/curriculum\/student-launch/.test(workflowJs), "workflow creates student-safe launch links");
check(/qrcode|qrCanvas|renderQr/i.test(workflowJs), "workflow renders a local QR code");

check(/<main\b/.test(launcherHtml), "student launcher has a main landmark");
check(/<ol\b/.test(launcherHtml), "student launcher has numbered directions");
check(/aria-live/.test(launcherHtml), "student launcher has a live status region");
check(/curriculum-student-launch\.css/.test(launcherHtml), "student launcher wires CSS");
check(/curriculum-student-launch\.js/.test(launcherHtml), "student launcher wires JS");
check(/speechSynthesis/.test(launcherJs), "student launcher has local read-aloud support");
check(/localStorage/.test(launcherJs), "student launcher stores completion locally");
check(
  !/innerHTML\s*=\s*(?:params|query|lessonId)/.test(launcherJs),
  "query values are not injected as HTML",
);
check(/min-height:\s*44px/.test(workflowCss), "teacher controls meet 44px target size");
check(/min-height:\s*48px/.test(launcherCss), "student controls meet 48px target size");
check(
  /:focus-visible/.test(workflowCss) && /:focus-visible/.test(launcherCss),
  "both surfaces have visible focus styles",
);
check(
  /@media\s+print/.test(workflowCss) && /@media\s+print/.test(launcherCss),
  "both surfaces have print styles",
);
check(/prefers-reduced-motion/.test(launcherCss), "student launcher respects reduced motion");

let workflowData = null;
let supportData = null;
let launchData = null;
try {
  workflowData = JSON.parse(workflowDataRaw);
} catch (error) {
  failures.push(`invalid workflow JSON: ${error.message}`);
}
try {
  supportData = JSON.parse(supportDataRaw);
} catch (error) {
  failures.push(`invalid support JSON: ${error.message}`);
}
try {
  launchData = JSON.parse(launchDataRaw);
} catch (error) {
  failures.push(`invalid launch manifest JSON: ${error.message}`);
}

if (workflowData) {
  const families = workflowData.families || {};
  const familyRules = workflowData.familyRules || [];
  const required = [
    "materials",
    "prerequisite",
    "misconception",
    "responseMove",
    "successCriteria",
  ];
  check(Object.keys(families).length >= 10, "workflow data covers at least 10 skill families");
  check(
    familyRules.length >= 10 && familyRules.every((rule) => families[rule.family] && rule.pattern),
    "workflow family rules resolve only to defined skill families",
  );
  check(
    Object.values(families).every((family) => required.every((key) => family[key])),
    "every workflow family has readiness guidance",
  );
  check(
    Array.isArray(workflowData.sequences?.minutes45) &&
      Array.isArray(workflowData.sequences?.minutes90),
    "workflow data includes 45- and 90-minute sequences",
  );
}

if (workflowData && supportData && launchData) {
  const resolveFamily = (lesson) => {
    const text = `${lesson.title} ${lesson.standard}`.toLowerCase();
    const match = (workflowData.familyRules || []).find((rule) =>
      new RegExp(rule.pattern, "i").test(text),
    );
    return match?.family || "general";
  };
  const lessonsById = new Map((launchData.lessons || []).map((lesson) => [lesson.id, lesson]));
  check(
    resolveFamily(lessonsById.get("6-13")) === "numberTheory",
    "Prime Factorization uses number-theory readiness",
  );
  check(
    resolveFamily(lessonsById.get("2-11")) === "decimals",
    "decimal operations use decimal readiness",
  );
  check(
    (launchData.lessons || []).every((lesson) => {
      const family = resolveFamily(lesson);
      return workflowData.families?.[family] && supportData.families?.[family];
    }),
    "every lesson resolves to complete readiness and language supports",
  );
}

if (launchData) {
  const lessons = launchData.lessons || [];
  check(lessons.length >= 64, "launch manifest contains all curriculum lessons");
  check(
    new Set(lessons.map((lesson) => lesson.id)).size === lessons.length,
    "launch lesson IDs are unique",
  );
  check(
    lessons.every((lesson) => lesson.resources && lesson.resources.lesson),
    "every launch lesson includes a primary student lesson",
  );
  const serialized = JSON.stringify(launchData).toLowerCase();
  for (const forbidden of [
    "slides",
    "teachernotes",
    "answerkey",
    "gradebook",
    "dashboard",
    "docx",
    ".pdf",
  ]) {
    check(!serialized.includes(forbidden.toLowerCase()), `launch manifest excludes ${forbidden}`);
  }
  check(
    lessons.every((lesson) =>
      Object.values(lesson.resources || {}).every(
        (path) => typeof path === "string" && path.startsWith("/lessons/"),
      ),
    ),
    "every launch resource uses a canonical lesson route",
  );
}

check(
  /FORBIDDEN_RESOURCE/.test(generator),
  "manifest generator enforces forbidden-resource policy",
);

console.log("curriculum teacher workflow validation");
passes.forEach((message) => console.log(`  PASS ${message}`));
failures.forEach((message) => console.log(`  FAIL ${message}`));
console.log(`\n${passes.length} passed, ${failures.length} failed`);
process.exit(failures.length ? 1 : 0);
