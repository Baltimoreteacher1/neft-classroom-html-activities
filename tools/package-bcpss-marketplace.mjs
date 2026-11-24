#!/usr/bin/env node
// Packages BCPSS ESOL Premium Lesson Companions into publisher-ready marketplace bundles
// (standalone HTML + DOCX per lesson across WIDA levels, plus answer key and manifest.json).
// Usage:
//   npm run package:marketplace -- [unitId ...] [--out=reports/marketplace]
// Default sample: the three hand-authored pilot units (g3-ela-u1, g6-math-u2, g8-sci-u1); pass --all for all 162 units.

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BCPSS_UNITS } from "../data/bcpss-curriculum-seed.mjs";
import {
  DISCLAIMER,
  lessonFilename,
  renderLessonHtml,
} from "../functions/_lib/bcpss/lesson-doc.js";
import { renderLessonDocx } from "../functions/_lib/bcpss/lesson-docx.js";
import { loadLessons } from "../functions/_lib/bcpss/lessons.js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const outArg = args.find((a) => a.startsWith("--out="))?.slice(6);
const OUT_DIR = path.resolve(ROOT, outArg || "reports/marketplace");
const all = args.includes("--all");
const unitArgs = args.filter((a) => !a.startsWith("--"));
const DEFAULT_UNITS = ["g3-ela-u1", "g6-math-u2", "g8-sci-u1"];
const targetIds = all ? BCPSS_UNITS.map((u) => u.id) : unitArgs.length ? unitArgs : DEFAULT_UNITS;

const unitById = new Map(BCPSS_UNITS.map((u) => [u.id, u]));
mkdirSync(OUT_DIR, { recursive: true });

const catalog = [];
let filesWritten = 0;

for (const unitId of targetIds) {
  const unit = unitById.get(unitId);
  if (!unit) {
    console.error(`Unknown unitId: ${unitId}`);
    process.exit(1);
  }
  const set = await loadLessons(unitId);
  if (!set?.lessons?.length) continue;
  const uDir = path.join(OUT_DIR, unitId);
  mkdirSync(uDir, { recursive: true });

  const unitFiles = [];
  for (const lesson of set.lessons) {
    const htmlName = lessonFilename(lesson, { level: "all", part: "lesson" }, "html");
    const docxName = lessonFilename(lesson, { level: "all", part: "lesson" }, "docx");
    const keyName = lessonFilename(lesson, { level: "all", part: "key" }, "html");

    writeFileSync(path.join(uDir, htmlName), renderLessonHtml(lesson, { level: "all" }));
    writeFileSync(path.join(uDir, docxName), renderLessonDocx(lesson, { level: "all" }));
    writeFileSync(
      path.join(uDir, keyName),
      renderLessonHtml(lesson, { level: "all", part: "key" }),
    );
    filesWritten += 3;
    unitFiles.push({
      lesson_id: lesson.id,
      sequence: lesson.sequence,
      title: lesson.title,
      klu: lesson.language_objective.klu,
      standards: lesson.standards,
      html: htmlName,
      docx: docxName,
      answer_key: keyName,
    });
  }

  const readme = [
    `# ${unit.unit_title} — Language Companion Pack (Grade ${unit.grade} ${unit.subject})`,
    "",
    `- **Unit ID:** \`${unit.id}\``,
    `- **Source:** \`${set.source}\``,
    `- **Lessons:** ${set.lessons.length}`,
    `- **Languages:** English and Spanish`,
    `- **Levels included:** WIDA L1–2, L3–4, L5–6, Newcomer Path, Exit Check, and Answer Key`,
    "",
    "## Included Files",
    "",
    ...unitFiles.map(
      (f) =>
        `- **Lesson ${f.sequence}: ${f.title}** (\`${f.klu}\`) — \`${f.html}\`, \`${f.docx}\`, \`${f.answer_key}\``,
    ),
    "",
    `---`,
    DISCLAIMER,
    "",
  ].join("\n");
  writeFileSync(path.join(uDir, "README.md"), readme);
  filesWritten++;

  catalog.push({
    unit_id: unit.id,
    grade: unit.grade,
    subject: unit.subject,
    title: unit.unit_title,
    source: set.source,
    lesson_count: set.lessons.length,
    lessons: unitFiles,
  });
}

const manifestPath = path.join(OUT_DIR, "manifest.json");
writeFileSync(
  manifestPath,
  `${JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      disclaimer: DISCLAIMER,
      units: catalog,
    },
    null,
    2,
  )}\n`,
);
console.log(
  `package:marketplace: packaged ${catalog.length} units (${filesWritten} files) -> ${path.relative(ROOT, OUT_DIR)}`,
);
