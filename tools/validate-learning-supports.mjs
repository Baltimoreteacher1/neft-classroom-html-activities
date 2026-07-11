#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");
const MANIFEST_PATH = join(ROOT, "assets", "learning-supports", "manifest.json");
const PROFILE_KEYS = new Set([
  "read-understand",
  "focus-organize",
  "build-math",
  "express-thinking",
  "language-support",
  "challenge-extend",
]);
const REQUIRED = [
  "lessonId",
  "title",
  "standard",
  "contentObjective",
  "languageObjective",
  "vocabulary",
  "workedExample",
  "sentenceFrames",
  "wordBank",
  "readinessHref",
  "profiles",
];
const FORBIDDEN_KEYS = new Set([
  "correctIndex",
  "sampleAnswer",
  "kernel",
  "listenFor",
  "explanation",
  "choiceFeedback",
  "studentName",
  "diagnosis",
  "disability",
  "iep",
]);

function canonicalLessonIds() {
  return readdirSync(LESSONS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d+-\d+$/.test(entry.name))
    .filter((entry) => existsSync(join(LESSONS, entry.name, "config.json")))
    .map((entry) => entry.name)
    .sort((a, b) => {
      const [au, al] = a.split("-").map(Number);
      const [bu, bl] = b.split("-").map(Number);
      return au - bu || al - bl;
    });
}

function walk(value, visit, path = "manifest") {
  visit(value, path);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visit, `${path}[${index}]`));
  else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) walk(child, visit, `${path}.${key}`);
  }
}

function validateManifest(manifest, ids) {
  assert.equal(manifest.schemaVersion, 1, "manifest schemaVersion must be 1");
  assert.ok(Array.isArray(manifest.lessons), "manifest.lessons must be an array");
  assert.equal(manifest.lessons.length, 64, "manifest must contain exactly 64 lessons");
  assert.deepEqual(
    manifest.lessons.map((lesson) => lesson.lessonId),
    ids,
    "manifest lesson IDs must match canonical lesson directories",
  );

  for (const lesson of manifest.lessons) {
    for (const key of REQUIRED) assert.ok(key in lesson, `${lesson.lessonId} missing ${key}`);
    assert.ok(Array.isArray(lesson.vocabulary) && lesson.vocabulary.length > 0);
    assert.ok(Array.isArray(lesson.workedExample) && lesson.workedExample.length > 0);
    assert.ok(Array.isArray(lesson.sentenceFrames) && lesson.sentenceFrames.length > 0);
    assert.ok(Array.isArray(lesson.wordBank) && lesson.wordBank.length > 0);
    assert.equal(lesson.readinessHref, `/lessons/${lesson.lessonId}/readiness/`);
    assert.ok(Array.isArray(lesson.profiles) && lesson.profiles.length === PROFILE_KEYS.size);
    for (const profile of lesson.profiles) {
      assert.ok(PROFILE_KEYS.has(profile), `${lesson.lessonId} has unknown profile ${profile}`);
    }
  }

  walk(manifest, (value, path) => {
    const key = path
      .split(".")
      .at(-1)
      ?.replace(/\[\d+\]$/, "");
    assert.ok(!FORBIDDEN_KEYS.has(key), `forbidden key at ${path}`);
    if (typeof value !== "string") return;
    assert.ok(!/<\/?[a-z][^>]*>/i.test(value), `raw HTML at ${path}`);
    assert.ok(!/^https?:\/\//i.test(value), `external URL at ${path}`);
    assert.ok(value.length <= 900, `oversized string at ${path}`);
  });
}

function validateIntegrations(ids) {
  const errors = [];
  for (const id of ids) {
    const path = join(LESSONS, id, "index.html");
    const html = readFileSync(path, "utf8");
    const attr = `data-ewl-supports-lesson="${id}"`;
    if ((html.match(new RegExp(attr, "g")) || []).length !== 1)
      errors.push(`${id}: lesson ID integration`);
    if ((html.match(/learning-supports\.css/g) || []).length !== 1)
      errors.push(`${id}: stylesheet integration`);
    if ((html.match(/learning-supports\.js/g) || []).length !== 1)
      errors.push(`${id}: script integration`);
    if (
      !html.includes("ewl-supports-injected:begin") ||
      !html.includes("ewl-supports-injected:end")
    ) {
      errors.push(`${id}: integration markers`);
    }
  }
  assert.deepEqual(errors, [], `Learning Supports integration failures:\n${errors.join("\n")}`);
}

function validateHubEntry() {
  const html = readFileSync(join(ROOT, "curriculum", "index.html"), "utf8");
  assert.ok(
    html.includes('id="learning-supports-feature-title"'),
    "curriculum hub missing Learning Supports entry",
  );
  assert.match(html, /access without lowering the learning target/i);
  assert.match(html, /no IEP data is stored/i);
  assert.match(html, /\/lessons\/1-1\/#ewl-supports=/);
}

const ids = canonicalLessonIds();
assert.equal(ids.length, 64, `expected 64 canonical lessons, found ${ids.length}`);
assert.ok(existsSync(MANIFEST_PATH), "assets/learning-supports/manifest.json does not exist");
const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
validateManifest(manifest, ids);
validateIntegrations(ids);
validateHubEntry();
console.log(
  `Learning Supports validation PASS — ${ids.length}/${ids.length} canonical lessons covered`,
);
