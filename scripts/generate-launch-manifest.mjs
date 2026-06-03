#!/usr/bin/env node
// generate-launch-manifest.mjs
// Zero-dependency Node ESM script. Scans every lessons/<id>/ directory,
// reads each config.json, and probes the filesystem for each teacher resource.
// Emits data/launch-manifest.json, used by the Teacher Launch Mode page
// (/teacher-tools/launch/). Run: node scripts/generate-launch-manifest.mjs

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const LESSONS_DIR = join(ROOT, "lessons");
const OUT_FILE = join(ROOT, "data", "launch-manifest.json");

// A resource is included only when its target actually exists on disk.
function fileExists(absPath) {
  try {
    return existsSync(absPath) && statSync(absPath).isFile();
  } catch {
    return false;
  }
}

function dirExists(absPath) {
  try {
    return existsSync(absPath) && statSync(absPath).isDirectory();
  } catch {
    return false;
  }
}

function buildResources(id, lessonDir) {
  const resources = {};

  // Student activity entry
  if (fileExists(join(lessonDir, "index.html"))) {
    resources.student = `/lessons/${id}/`;
  }

  // Teacher guided notes (HTML)
  if (fileExists(join(lessonDir, "notes.html"))) {
    resources.notes = `/lessons/${id}/notes.html`;
  }

  // Guided/printable notes (DOCX + PDF) under downloads/
  const notesDocx = join(lessonDir, "downloads", `${id}-notes.docx`);
  if (fileExists(notesDocx)) {
    resources.notesDocx = `/lessons/${id}/downloads/${id}-notes.docx`;
  }
  const notesPdf = join(lessonDir, "downloads", `${id}-notes.pdf`);
  if (fileExists(notesPdf)) {
    resources.notesPdf = `/lessons/${id}/downloads/${id}-notes.pdf`;
  }

  // Homework
  if (fileExists(join(lessonDir, "homework.docx"))) {
    resources.homework = `/lessons/${id}/homework.docx`;
  }

  // Readiness / Get Ready (folder with an index.html)
  if (fileExists(join(lessonDir, "readiness", "index.html"))) {
    resources.readiness = `/lessons/${id}/readiness/`;
  }

  // Assessment: per-lesson assessments do not exist in this repo today
  // (assessments are unit-level under /mcap-review/). Wire here if one appears
  // on disk as assessment.html or assessment.docx.
  if (fileExists(join(lessonDir, "assessment.html"))) {
    resources.assessment = `/lessons/${id}/assessment.html`;
  } else if (fileExists(join(lessonDir, "assessment.docx"))) {
    resources.assessment = `/lessons/${id}/assessment.docx`;
  } else {
    resources.assessment = null;
  }

  return resources;
}

function objectiveOf(config) {
  return (
    config.contentObjective ||
    config.languageObjective ||
    ""
  );
}

function main() {
  if (!dirExists(LESSONS_DIR)) {
    console.error(`lessons directory not found: ${LESSONS_DIR}`);
    process.exit(1);
  }

  const entries = readdirSync(LESSONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    // Skip scaffolding/private dirs (e.g. _template).
    .filter((name) => !name.startsWith("_"));

  const lessons = [];
  const skipped = [];

  for (const id of entries) {
    const lessonDir = join(LESSONS_DIR, id);
    const configPath = join(lessonDir, "config.json");
    if (!fileExists(configPath)) {
      skipped.push(`${id} (no config.json)`);
      continue;
    }

    let config;
    try {
      config = JSON.parse(readFileSync(configPath, "utf8"));
    } catch (err) {
      skipped.push(`${id} (bad config.json: ${err.message})`);
      continue;
    }

    const flagship = id.includes("flagship");
    const unit = Number(config.unit);
    const lesson = Number(config.lesson);

    lessons.push({
      id,
      unit: Number.isFinite(unit) ? unit : null,
      lesson: Number.isFinite(lesson) ? lesson : null,
      title: config.title || id,
      standard: config.standard || "",
      themeEmoji: config.themeEmoji || "",
      contentObjective: config.contentObjective || "",
      languageObjective: config.languageObjective || "",
      objective: objectiveOf(config),
      flagship,
      resources: buildResources(id, lessonDir),
    });
  }

  // Sort by unit, then lesson, then flagship-first within a tie, then id.
  lessons.sort((a, b) => {
    if ((a.unit ?? 999) !== (b.unit ?? 999)) return (a.unit ?? 999) - (b.unit ?? 999);
    if ((a.lesson ?? 999) !== (b.lesson ?? 999)) return (a.lesson ?? 999) - (b.lesson ?? 999);
    if (a.flagship !== b.flagship) return a.flagship ? -1 : 1;
    return a.id.localeCompare(b.id);
  });

  const manifest = {
    generated: new Date().toISOString(),
    source: "scripts/generate-launch-manifest.mjs",
    note: "Teacher Launch Mode manifest. Regenerate with: npm run generate-launch",
    count: lessons.length,
    lessons,
  };

  writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  // Summary
  const units = new Set(lessons.map((l) => l.unit).filter((u) => u != null));
  const tally = {
    student: 0,
    notes: 0,
    notesDocx: 0,
    notesPdf: 0,
    homework: 0,
    readiness: 0,
    assessment: 0,
  };
  for (const l of lessons) {
    for (const key of Object.keys(tally)) {
      if (l.resources[key]) tally[key] += 1;
    }
  }

  console.log(`Launch manifest written: ${OUT_FILE}`);
  console.log(`  Lessons: ${lessons.length} across ${units.size} units`);
  console.log(
    `  Resources present -> student:${tally.student} notes:${tally.notes} ` +
      `docx:${tally.notesDocx} pdf:${tally.notesPdf} homework:${tally.homework} ` +
      `readiness:${tally.readiness} assessment:${tally.assessment}`
  );
  if (skipped.length) {
    console.log(`  Skipped: ${skipped.join(", ")}`);
  }
}

main();
