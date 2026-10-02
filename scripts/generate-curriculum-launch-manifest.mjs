#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = resolve(ROOT, "data/curriculum-manifest.json");
const LESSONS_DIR = resolve(ROOT, "lessons");
const OUTPUT = resolve(ROOT, "data/curriculum-launch-manifest.json");

const SAFE_RESOURCE_KEYS = [
  "lesson",
  "readiness",
  "guidedNotes",
  "handout",
  "worksheet",
  "worksheet2",
  "worksheetLevel0",
  "mstarWorksheet",
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

/** Join authored labs to known lessons. Exact routes reject external URLs,
 * encoded traversal, query overrides, and paths to teacher tools. Exported for
 * contract tests; importing this generator never writes generated data. */
export function learningLabResources(registry, coreLessons, root = ROOT) {
  if (!registry || !Array.isArray(registry.labs)) throw new Error("Invalid learning-lab registry");
  const knownLessons = new Set(coreLessons.map((lesson) => lesson.id));
  const labIds = new Set();
  const result = new Map();
  for (const lab of registry.labs) {
    if (!lab || typeof lab.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(lab.id)) {
      throw new Error("Invalid learning-lab ID");
    }
    if (labIds.has(lab.id)) throw new Error(`Duplicate learning-lab ID: ${lab.id}`);
    labIds.add(lab.id);
    const expected = `/curriculum/learning-labs/${lab.id}/`;
    if (lab.href !== expected) throw new Error(`Unsafe learning-lab path: ${lab.id}`);
    const file = resolve(root, expected.slice(1), "index.html");
    if (!existsSync(file) || !statSync(file).isFile()) {
      throw new Error(`Missing learning-lab page: ${lab.id}`);
    }
    if (!Array.isArray(lab.lessons) || !lab.lessons.length) {
      throw new Error(`Learning lab has no lessons: ${lab.id}`);
    }
    for (const lessonId of lab.lessons) {
      if (typeof lessonId !== "string" || !knownLessons.has(lessonId)) {
        throw new Error(`Unknown learning-lab lesson: ${lessonId}`);
      }
      if (result.has(lessonId)) throw new Error(`Duplicate learning-lab assignment: ${lessonId}`);
      result.set(lessonId, expected);
    }
  }
  return result;
}

const source = JSON.parse(readFileSync(SOURCE, "utf8"));
const labResources = learningLabResources(
  JSON.parse(readFileSync(resolve(ROOT, "data/learning-labs.json"), "utf8")),
  source.lessons || [],
);
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
  resources: {
    ...safeResources(lesson.resources, lesson.id),
    ...(labResources.has(lesson.id) ? { learningLab: labResources.get(lesson.id) } : {}),
  },
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

/* The printables a small-group or catch-up variant ships with, in the order the
 * teacher meets them at the table: the sheet the group writes on during the
 * session, then the packet that continues it afterwards. Presence is decided by
 * the file on disk — a lesson whose generator skipped it has no practice set,
 * and a button for a page that is not there is the dead button this manifest
 * refuses to carry. Answer keys are deliberately absent: this manifest feeds a
 * student-reachable surface, which is what FORBIDDEN_RESOURCE encodes above. */
const GROUP_PRINTABLES = [
  ["worksheet", "worksheet.html"],
  // Set B — the second practice form. Every lesson has one, and without a key
  // here the picker cannot offer it: the 364 Set B sheets would be live, linked
  // from /curriculum/units/, and invisible on /curriculum/, which is the page
  // the teacher actually opens. That is exactly how 168 small-group worksheets
  // went unreachable before 2026-08-24.
  ["worksheet2", "worksheet-2.html"],
  ["practice", "practice.html"],
  // The night that follows the session. Only Part 2 has one — a lesson taught
  // over two days teaches different mathematics on each, so it ships its own
  // family homework rather than repeating night one's — and small groups and
  // catch-ups have no homework.html, so this key is simply absent for them.
  // Without it the 76 Part 2 family homeworks are live, linked from
  // /curriculum/units/, and unreachable from /curriculum/, which is the page
  // the teacher actually opens: the 2026-08-24 small-group defect exactly.
  ["homework", "homework.html"],
];

function groupResources(id) {
  const resources = { lesson: `/lessons/${id}/` };
  for (const [key, file] of GROUP_PRINTABLES) {
    if (existsSync(resolve(LESSONS_DIR, id, file))) resources[key] = `/lessons/${id}/${file}`;
  }
  return resources;
}

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
    resources: groupResources(id),
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

// ── Band-review catch-up lessons ────────────────────────────────────────────
// One per 3-4 lesson band, living at /lessons/<band-end>-catchup/ (same compact
// renderer + config shape as small groups). Also excluded from the core manifest.
const catchUps = [];
for (const lesson of lessons) {
  if (!baseIds.has(lesson.id)) continue;
  const id = `${lesson.id}-catchup`;
  const entry = groupConfig(id);
  if (!entry) continue;
  catchUps.push({ kind: "catchUp", parent: lesson.id, ...entry });
}

// ── Part 2 · the Apply day ──────────────────────────────────────────────────
// One per core lesson that ships a Reveal "Apply" word problem, living at
// /lessons/<base>-part2/ and generated by scripts/generate-part-two.mjs. It is
// a real student-reachable pathway, so it is enumerated here — that is what
// makes it visible to validate:scorm-runtime and every other gate that
// reconciles disk against this manifest.
//
// It is emitted as its OWN set rather than folded into `lessons`, because the
// hub footer's "84 lessons · 214 pathways (168 small-group / 36 catch-up / 10
// unit projects)" enumerates exactly three parts, and re-defining a number a
// teacher reads is a deliberate decision, not a side effect of adding a page.
const partTwo = [];
for (const lesson of lessons) {
  if (!baseIds.has(lesson.id)) continue;
  const id = `${lesson.id}-part2`;
  const entry = groupConfig(id);
  if (!entry) continue;
  partTwo.push({ kind: "partTwo", parent: lesson.id, ...entry });
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

// ── MSTAR-style unit practice tests (Form A / Form B) ───────────────────────
// Generated by scripts/generate-mstar-practice.mjs from the lessons' own
// authored mstarPractice items. Offered in the Lesson dropdown after the final
// lesson and BEFORE the culminating project, which stays the unit's last row
// (tools/hub-lesson-picker.test.mjs pins that). Preflighted like the projects:
// a unit whose pages do not exist on disk gets no row rather than a dead one.
// The teacher answer keys are deliberately NOT here — FORBIDDEN_RESOURCE
// rejects answer-key paths because this manifest is student-reachable.
const unitAssessments = units
  .flatMap((unit) =>
    ["a", "b"].map((form, i) => ({
      dir: `unit-${unit}-form-${form}`,
      unit,
      form,
      lesson: 997 + i,
    })),
  )
  .filter((t) => existsSync(resolve(ROOT, "mstar-practice", t.dir, "index.html")))
  .map((t) => ({
    id: `unit-${t.unit}-mstar-form-${t.form}`,
    kind: "unitAssessment",
    unit: t.unit,
    lesson: t.lesson,
    title: `Unit ${t.unit} MSTAR Practice Test — Form ${t.form.toUpperCase()}`,
    standard: "",
    objective: `Rehearse Unit ${t.unit} skills in MSTAR item formats — two-part evidence questions, select-all, and explain-the-error — with instant feedback on selected responses.`,
    languageObjective: "",
    timeEstimate: "~30-40 min",
    vocabulary: [],
    sentenceFrames: [],
    resources: { lesson: `/mstar-practice/${t.dir}/` },
  }));

// Reuse the unit browser's authored end-of-unit links, including legacy routes
// whose folder numbers differ from their curriculum unit. Never infer URLs.
const unitDocument = new JSDOM(readFileSync(resolve(ROOT, "curriculum/units/index.html"), "utf8"))
  .window.document;
const unitResources = [];
for (const unitNode of unitDocument.querySelectorAll("details.unit")) {
  const unit = Number(unitNode.id.replace("unit-", ""));
  const seen = new Set(endOfUnit.filter((p) => p.unit === unit).map((p) => p.resources.lesson));
  for (const row of unitNode.querySelectorAll(":scope > .unit-body > .unit-res")) {
    if (!/end of unit/i.test(row.querySelector(".unit-res-label")?.textContent || "")) continue;
    for (const link of row.querySelectorAll("a.res[href]")) {
      const href = link.getAttribute("href");
      const title = link.textContent.replace(/\s+/g, " ").trim();
      if (!href.startsWith("/") || href.startsWith("//") || seen.has(href)) continue;
      if (
        FORBIDDEN_RESOURCE.test(href + " " + title) ||
        link.classList.contains("hub-teacher-only")
      )
        continue;
      const target = href.split(/[?#]/)[0];
      if (!existsSync(resolve(ROOT, target.slice(1), target.endsWith("/") ? "index.html" : ""))) {
        throw new Error(`Missing end-of-unit resource: ${href}`);
      }
      seen.add(href);
      unitResources.push({
        id: `unit-${unit}-resource-${createHash("sha256").update(href).digest("hex").slice(0, 10)}`,
        kind: "unitResource",
        unit,
        title: `End of Unit · ${title}`,
        resources: { lesson: href },
      });
    }
  }
}

const payload = {
  note: "GENERATED by scripts/generate-curriculum-launch-manifest.mjs — do not hand-edit.",
  schemaVersion: 2,
  lessonCount: lessons.length,
  smallGroupCount: smallGroups.length,
  catchUpCount: catchUps.length,
  partTwoCount: partTwo.length,
  endOfUnitCount: endOfUnit.length,
  unitAssessmentCount: unitAssessments.length,
  lessons,
  smallGroups,
  catchUps,
  partTwo,
  endOfUnit,
  unitAssessments,
  unitResources,
};

const serialized = JSON.stringify(payload, null, 2) + "\n";
if (FORBIDDEN_RESOURCE.test(serialized)) {
  throw new Error("Generated launch manifest contains a forbidden teacher-only resource");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  writeFileSync(OUTPUT, serialized);
  console.log(`Wrote ${lessons.length} student-safe lessons to ${OUTPUT}`);
}
