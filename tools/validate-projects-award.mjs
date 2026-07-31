#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const units = [...Array.from({ length: 10 }, (_, index) => `unit-${index + 1}`), "statistics"];
const failures = [];

/* Enumerate version folders from disk (version-a, version-b, version-c, …) so
   every shipped project page is checked — a hardcoded two-version list is what
   let unit-8/version-c drift out of this contract unnoticed. */
function versionsOf(unit) {
  try {
    return fs
      .readdirSync(path.join(ROOT, "math", unit, "projects"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^version-[a-z]$/.test(entry.name))
      .map((entry) => entry.name)
      .sort();
  } catch (_error) {
    return [];
  }
}

const expectedProjectCount = units.reduce((total, unit) => total + versionsOf(unit).length, 0);

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function requireFile(relativePath) {
  if (!fs.existsSync(path.join(ROOT, relativePath))) failures.push(`${relativePath}: missing`);
}

function count(text, token) {
  return text.split(token).length - 1;
}

const requiredFiles = [
  "shared/projects/projects-award.css",
  "shared/projects/projects-award.js",
  "shared/projects/projects-award-config.json",
  "tools/inject-projects-award.mjs",
  "evidence/index.html",
  "teacher-tools/project-award-kit/index.html",
  "docs/projects-award-implementation-guide.md",
  "docs/projects-award-evaluation-plan.md",
];
requiredFiles.forEach(requireFile);

const configPath = path.join(ROOT, "shared/projects/projects-award-config.json");
let config = {};
if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (error) {
    failures.push(`shared/projects/projects-award-config.json: invalid JSON (${error.message})`);
  }
}

const entries = config.projects || {};
for (const unit of units) {
  for (const version of versionsOf(unit)) {
    const route = `/math/${unit}/projects/${version}/`;
    const relativePath = `math/${unit}/projects/${version}/index.html`;
    if (!fs.existsSync(path.join(ROOT, relativePath))) {
      failures.push(`${relativePath}: missing project page`);
      continue;
    }
    const html = read(relativePath);
    for (const token of [
      "projects-award-head:begin",
      "projects-award-head:end",
      "projects-award-body:begin",
      "projects-award-body:end",
      "/shared/projects/projects-award.css?v=20260714",
      "/shared/projects/projects-award.js?v=20260714",
    ]) {
      if (count(html, token) !== 1) failures.push(`${relativePath}: expected one ${token}`);
    }
    const entry = entries[route];
    if (!entry) {
      failures.push(`${route}: missing award configuration`);
      continue;
    }
    for (const key of ["title", "mathTarget", "languageTarget", "client", "question", "transfer"])
      for (const language of ["en", "es"])
        if (!String(entry[key]?.[language] || "").trim())
          failures.push(`${route}: missing ${key}.${language}`);
    if (!Array.isArray(entry.constraints) || entry.constraints.length < 3)
      failures.push(`${route}: needs at least three project constraints`);
  }
}

if (Object.keys(entries).length !== expectedProjectCount)
  failures.push(
    `award configuration: expected ${expectedProjectCount} projects, found ${Object.keys(entries).length}`,
  );

const curriculum = read("curriculum/index.html");
const expectedLinks = [
  'href="/math/unit-8/projects/">Culminating Project',
  'href="/math/statistics/projects/">Culminating Project',
  'href="/math/unit-7/projects/">Culminating Project',
];
for (const expected of expectedLinks)
  if (!curriculum.includes(expected)) failures.push(`curriculum/index.html: missing ${expected}`);

/* answer-key-gate.js must carry no client-side teacher secret.
   This used to grep for the then-current PIN literal. A rotated PIN would have
   sailed straight past it — the check would keep passing while the very thing
   it guards against sat in the file under a new name. Read the live values out
   of teacher-mode.js instead, so the gate follows every future rotation
   without anyone remembering to update it here. */
const teacherModeSource = read("engine/core/teacher-mode.js");
/* Read EVERY value out of the TEACHER_PINS block, not just the keys literally
   named `master` and `coteacher`. The object also carries `masterAlt` and
   `coteacherAlt`, and the previous pattern skipped them silently — so a
   rotation onto the Alt pins would have left this gate green while the live
   secret sat in answer-key-gate.js, which is the exact failure the comment
   above says this check exists to prevent. */
const pinsBlock = teacherModeSource.match(/TEACHER_PINS\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\)/);
const livePins = pinsBlock ? [...pinsBlock[1].matchAll(/:\s*"([^"]+)"/g)].map((m) => m[1]) : [];
if (!livePins.length)
  failures.push("validate-projects-award: could not read TEACHER_PINS from teacher-mode.js");

/* A reader that quietly finds FEWER pins than are actually in use is the whole
   bug class here, so cross-check it instead of trusting the match.
   ACCEPTED_TEACHER_PINS is derived from TEACHER_PINS, so every key it
   references must have produced a value above. */
const acceptedBlock = teacherModeSource.match(/ACCEPTED_TEACHER_PINS\s*=\s*\[([\s\S]*?)\]/);
const acceptedKeys = acceptedBlock
  ? [...acceptedBlock[1].matchAll(/TEACHER_PINS\.(\w+)/g)].map((m) => m[1])
  : [];
if (acceptedKeys.length && livePins.length < acceptedKeys.length)
  failures.push(
    `validate-projects-award: read ${livePins.length} PIN(s) from TEACHER_PINS but ` +
      `ACCEPTED_TEACHER_PINS uses ${acceptedKeys.length} — the reader is missing some`,
  );

const answerGate = read("shared/projects/answer-key-gate.js");
if (/TEACHER_PIN/.test(answerGate) || livePins.some((pin) => answerGate.includes(pin)))
  failures.push("answer-key-gate.js: client-side teacher secret remains");

const packageJson = JSON.parse(read("package.json"));
if (!String(packageJson.scripts?.build || "").includes("inject-projects-award.mjs"))
  failures.push("package.json: build does not inject the award layer");
if (!String(packageJson.scripts?.validate || "").includes("validate:projects-award"))
  failures.push("package.json: validate does not enforce the award contract");

const smoke = read("tests/projects-smoke.spec.ts");
for (const expected of ["awardInit", "AxeBuilder", "community modeling", "language target"])
  if (!smoke.includes(expected)) failures.push(`tests/projects-smoke.spec.ts: missing ${expected}`);

if (failures.length) {
  console.error(`Award-readiness validation failed (${failures.length} issues):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Award-readiness validation passed: ${expectedProjectCount} projects, bilingual modeling contract, evidence pages, and QA coverage.`,
);
