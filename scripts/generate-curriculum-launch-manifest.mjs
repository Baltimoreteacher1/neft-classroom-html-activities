#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = resolve(ROOT, "data/curriculum-manifest.json");
const LESSONS_DIR = resolve(ROOT, "lessons");
const OUTPUT = resolve(ROOT, "data/curriculum-launch-manifest.json");

const SAFE_RESOURCE_KEYS = [
  "lesson",
  "guidedNotes",
  "handout",
  "homework",
  "familyPage",
  "studentHelp",
  "exitTicket",
];
const FORBIDDEN_RESOURCE =
  /slides|teacher|answer(?:-|_)?key|gradebook|dashboard|docx|\.pdf(?:$|[?#])/i;

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function safeResources(resources, lessonId) {
  const output = {};
  for (const key of SAFE_RESOURCE_KEYS) {
    const resource = resources?.[key];
    if (!resource || resource.exists === false || !resource.path) continue;
    const path = cleanText(resource.path);
    if (!path.startsWith(`/lessons/${lessonId}/`) && path !== `/lessons/${lessonId}/`) {
      throw new Error(`Unsafe resource path for ${lessonId}.${key}: ${path}`);
    }
    if (FORBIDDEN_RESOURCE.test(`${key} ${path}`)) {
      throw new Error(`Forbidden student resource for ${lessonId}.${key}: ${path}`);
    }
    output[key] = path;
  }
  if (!output.lesson) throw new Error(`Lesson ${lessonId} has no safe primary lesson route`);
  return output;
}

const source = JSON.parse(readFileSync(SOURCE, "utf8"));
const lessons = (source.lessons || []).map((lesson) => ({
  id: cleanText(lesson.id),
  unit: Number(lesson.unit),
  lesson: Number(lesson.lesson),
  title: cleanText(lesson.title),
  standard: cleanText(lesson.standard),
  objective: cleanText(lesson.objective),
  languageObjective: cleanText(lesson.languageObjective),
  timeEstimate: cleanText(lesson.timeEstimate) || "45 minutes",
  vocabulary: Array.isArray(lesson.supports?.vocabulary)
    ? lesson.supports.vocabulary.map(cleanText).filter(Boolean)
    : [],
  sentenceFrames: Array.isArray(lesson.supports?.sentenceFrames)
    ? lesson.supports.sentenceFrames.map(cleanText).filter(Boolean)
    : [],
  resources: safeResources(lesson.resources, lesson.id),
}));

if (!lessons.length || lessons.some((lesson) => !lesson.id || !lesson.title)) {
  throw new Error("Curriculum launch manifest contains an incomplete lesson");
}
if (new Set(lessons.map((lesson) => lesson.id)).size !== lessons.length) {
  throw new Error("Curriculum launch manifest contains duplicate lesson IDs");
}

// ── Differentiated small-group lessons (Group 1 / Group 2) ──────────────────
// These live as their own compact-renderer lessons at /lessons/<base>-group[12]/
// and are excluded from curriculum-manifest.json by design, so we read their
// config directly. Emitted in a separate array so the 74-lesson core manifest
// (and every existing consumer of `lessons`) stays byte-for-byte compatible.
const GROUP_KINDS = [
  { suffix: "-group1", group: 1 },
  { suffix: "-group2", group: 2 },
];
const baseIds = new Set(lessons.filter((lesson) => !/-flagship$/.test(lesson.id)).map((l) => l.id));

function groupConfig(id) {
  const configPath = resolve(LESSONS_DIR, id, "config.json");
  if (!existsSync(configPath)) return null;
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  const vocabulary = Array.isArray(config.vocabulary)
    ? config.vocabulary.map((entry) => cleanText(entry?.term)).filter(Boolean)
    : [];
  return {
    id,
    unit: Number(config.unit),
    lesson: Number(config.lesson),
    title: cleanText(config.title) || id,
    standard: cleanText(config.standard),
    objective: cleanText(config.contentObjective),
    languageObjective: cleanText(config.languageObjective),
    timeEstimate: cleanText(config.timeEstimate) || "~30 min",
    vocabulary,
    sentenceFrames: [],
    resources: { lesson: `/lessons/${id}/` },
  };
}

const smallGroups = [];
for (const lesson of lessons) {
  if (!baseIds.has(lesson.id)) continue;
  for (const { suffix, group } of GROUP_KINDS) {
    const id = `${lesson.id}${suffix}`;
    const entry = groupConfig(id);
    if (!entry) continue;
    smallGroups.push({ kind: "smallGroup", group, parent: lesson.id, ...entry });
  }
}

// ── End-of-unit culminating projects ────────────────────────────────────────
const units = Array.from(new Set(lessons.map((lesson) => lesson.unit))).sort((a, b) => a - b);
const endOfUnit = units
  .filter((unit) => existsSync(resolve(ROOT, "math", `unit-${unit}`, "projects", "index.html")))
  .map((unit) => ({
    id: `unit-${unit}-project`,
    kind: "endOfUnit",
    unit,
    lesson: 999,
    title: `Unit ${unit} Culminating Project`,
    standard: "",
    objective: `Apply Unit ${unit} skills in a multi-day, real-world culminating project.`,
    languageObjective:
      "Explain and justify project decisions using unit vocabulary in writing and discussion.",
    timeEstimate: "Multi-day",
    vocabulary: [],
    sentenceFrames: [],
    resources: { lesson: `/math/unit-${unit}/projects/` },
  }));

const payload = {
  note: "GENERATED by scripts/generate-curriculum-launch-manifest.mjs — do not hand-edit.",
  schemaVersion: 2,
  lessonCount: lessons.length,
  smallGroupCount: smallGroups.length,
  endOfUnitCount: endOfUnit.length,
  lessons,
  smallGroups,
  endOfUnit,
};

const serialized = JSON.stringify(payload, null, 2) + "\n";
if (FORBIDDEN_RESOURCE.test(serialized)) {
  throw new Error("Generated launch manifest contains a forbidden teacher-only resource");
}

writeFileSync(OUTPUT, serialized);
console.log(`Wrote ${lessons.length} student-safe lessons to ${OUTPUT}`);
