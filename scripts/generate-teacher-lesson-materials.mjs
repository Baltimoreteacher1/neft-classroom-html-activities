#!/usr/bin/env node
/** Small, teacher-gated index of lesson plans, keys, and editable documents. */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = JSON.parse(readFileSync(join(root, "data/curriculum-launch-manifest.json"), "utf8"));
const output = join(root, "teacher-tools/lesson-materials/materials.json");
const check = process.argv.includes("--check");
const format = { ".docx": "Word", ".pdf": "PDF", ".pptx": "PowerPoint" };
const byParent = new Map();
for (const variant of [...source.smallGroups, ...source.catchUps, ...source.partTwo]) {
  const siblings = byParent.get(variant.parent) || [];
  siblings.push(variant);
  byParent.set(variant.parent, siblings);
}

function link(id, relative, title) {
  const path = join(root, "lessons", id, relative);
  return existsSync(path) ? { title, href: `/lessons/${id}/${relative}` } : null;
}

function guide(id) {
  const name = `${id}-activity-teacher.docx`;
  return existsSync(join(root, "teacher-tools/activity-guides", name))
    ? { title: "Bonus activity guide · Word", href: `/teacher-tools/activity-guides/${name}` }
    : null;
}

function unitKey(unit) {
  const relative = `math/unit-${unit}/projects/answer-key/index.html`;
  return existsSync(join(root, relative))
    ? {
        title: `Unit ${unit} project · answer key`,
        href: `/math/unit-${unit}/projects/answer-key/`,
      }
    : null;
}

function publisher(id) {
  const folder = join(root, "lessons", id, "downloads/reveal/teacher");
  if (!existsSync(folder)) return [];
  return readdirSync(folder)
    .filter((name) => format[extname(name).toLowerCase()])
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((name) => {
      const ext = extname(name).toLowerCase();
      const title = name
        .slice(0, -ext.length)
        .replace(/^\d+[.-]\d+-?/, "")
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
      return {
        title: `${title || "Lesson document"} · ${format[ext]}`,
        href: `/lessons/${id}/downloads/reveal/teacher/${name}`,
      };
    });
}

function variantMaterials(variant) {
  const id = variant.id;
  const title =
    variant.kind === "smallGroup"
      ? `Small Group ${variant.group}`
      : variant.kind === "catchUp"
        ? "Catch-up"
        : "Part 2 · Apply";
  const links = [
    link(id, "worksheet-answer-key.html", "Practice sheet A · key"),
    link(id, "worksheet-2-answer-key.html", "Practice sheet B · key"),
    link(id, "practice-answer-key.html", "Activity practice · key"),
    guide(id),
  ].filter(Boolean);
  return { id, title, links };
}

const lessons = source.lessons.map((lesson) => {
  const id = lesson.id;
  const groups = {
    plan: [
      link(id, "teacher-notes/", "Teaching notes"),
      link(id, "slides.html", "Lesson slides"),
      link(id, "slides.pptx", "Editable slides · PowerPoint"),
      link(id, "notes-teacher.html", "Guided notes · teacher copy"),
      link(id, `downloads/${id}-notes-teacher.docx`, "Guided notes · Word"),
      guide(id),
    ].filter(Boolean),
    keys: [
      link(id, "worksheet-answer-key.html", "Practice sheet A · key"),
      link(id, "worksheet-2-answer-key.html", "Practice sheet B · key"),
      link(id, "worksheet-level-0-answer-key.html", "Supported practice · key"),
      link(id, "mstar-worksheet-answer-key.html", "MSTAR practice · key"),
    ].filter(Boolean),
    unit: [unitKey(lesson.unit)].filter(Boolean),
    publisher: publisher(id),
  };
  const variants = (byParent.get(id) || [])
    .map(variantMaterials)
    .filter((variant) => variant.links.length);
  return {
    id,
    unit: lesson.unit,
    title: lesson.title,
    standard: lesson.standard,
    groups,
    variants,
  };
});

if (lessons.length !== source.lessonCount || lessons.some((lesson) => !lesson.groups.plan.length)) {
  throw new Error("Teacher lesson index is incomplete");
}
const rendered = `${JSON.stringify({ generated: "scripts/generate-teacher-lesson-materials.mjs", lessons }, null, 2)}\n`;
if (check) {
  if (!existsSync(output) || readFileSync(output, "utf8") !== rendered) {
    console.error(
      "Teacher lesson materials index is stale. Run npm run generate:teacher-materials.",
    );
    process.exit(1);
  }
  console.log(`Teacher lesson materials: ${lessons.length} lessons fresh`);
} else {
  writeFileSync(output, rendered);
  console.log(`Teacher lesson materials: indexed ${lessons.length} lessons`);
}
