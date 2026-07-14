#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const units = [...Array.from({ length: 10 }, (_, index) => `unit-${index + 1}`), "statistics"];
const versions = ["version-a", "version-b"];
const failures = [];

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
  for (const version of versions) {
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

if (Object.keys(entries).length !== 22)
  failures.push(`award configuration: expected 22 projects, found ${Object.keys(entries).length}`);

const curriculum = read("curriculum/index.html");
const expectedLinks = [
  'href="/math/unit-8/projects/">Culminating Project',
  'href="/math/statistics/projects/">Culminating Project',
  'href="/math/unit-7/projects/">Culminating Project',
];
for (const expected of expectedLinks)
  if (!curriculum.includes(expected)) failures.push(`curriculum/index.html: missing ${expected}`);

const answerGate = read("shared/projects/answer-key-gate.js");
if (/TEACHER_PIN|TeacherNeft/.test(answerGate))
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
  "Award-readiness validation passed: 22 projects, bilingual modeling contract, evidence pages, and QA coverage.",
);
