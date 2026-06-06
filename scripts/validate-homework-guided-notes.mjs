#!/usr/bin/env node
/**
 * Quality gate for generated family homework guided notes.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";

const root = join(import.meta.dirname, "..");
const lessonsDir = join(root, "lessons");
const LESSON_DIR_RE = /^(\d+)-(\d+)(-flagship)?$/;

const REQUIRED_MARKERS = [
  "Family Math Night",
  "Ayuda a tu estudiante",
  "What we're learning tonight",
  "Qué aprendemos hoy",
  "The big idea",
  "La idea principal",
  "Try this together",
  "Inténtenlo juntos",
  "Words to know",
  "Palabras clave",
  "If your student gets stuck",
  "Si se atora",
  "Quick check",
  "Repaso rápido",
  "You did it together",
  "Lo lograron juntos",
  "Check This Problem",
  "normalizeMath",
  'class="homework-tab-bar"',
  'data-tab-panel="play"',
  "external-resource-list",
  "help_modal_overlay",
  "switchHomeworkTab",
  "initHomeworkGame",
  "Learn more online",
  "Play together",
];

const BAD_SPANISH = [
  /Puedo use\b/i,
  /Puedo explain\b/i,
  /Puedo write\b/i,
  /Puedo find\b/i,
  /Puedo describe\b/i,
  /\bununa\b/i,
  /Exponenteee/i,
  /Volumenn\b/i,
  /Sigue el mismo patrón en cada fila/,
  /Mira cómo funciona paso a paso/,
];

const lessonIds = readdirSync(lessonsDir)
  .filter((d) => LESSON_DIR_RE.test(d) && existsSync(join(lessonsDir, d, "config.json")))
  .sort();

let issues = [];

for (const id of lessonIds) {
  const path = join(lessonsDir, id, "homework.html");
  const html = readFileSync(path, "utf8");

  for (const marker of REQUIRED_MARKERS) {
    if (!html.includes(marker)) {
      issues.push({ id, level: "CRITICAL", msg: `Missing marker: ${marker}` });
    }
  }

  const quickChecks = (html.match(/Quick Check \d/g) || []).length;
  if (quickChecks > 2) {
    issues.push({ id, level: "HIGH", msg: `Too many quick check problems: ${quickChecks}` });
  }
  if (quickChecks === 0) {
    issues.push({ id, level: "HIGH", msg: "No quick check problems" });
  }

  if (/\/curriculum\//i.test(html) || /Curriculum Hub/i.test(html) || /Back to curriculum/i.test(html)) {
    issues.push({ id, level: "CRITICAL", msg: "Contains curriculum/hub navigation link" });
  }

  const extLinks = (html.match(/class="external-resource-link"/g) || []).length;
  if (extLinks === 0) {
    issues.push({ id, level: "HIGH", msg: "No external resource links" });
  }

  for (const bad of BAD_SPANISH) {
    if (bad.test(html)) {
      issues.push({ id, level: "CRITICAL", msg: `Bad Spanish pattern: ${bad}` });
    }
  }

  const script = html.match(/<script>([\s\S]*)<\/script>/i)?.[1];
  if (!script) {
    issues.push({ id, level: "CRITICAL", msg: "Missing inline script" });
  } else {
    try {
      new vm.Script(script);
    } catch (e) {
      issues.push({ id, level: "CRITICAL", msg: `Script syntax error: ${e.message}` });
    }
    if (!html.includes('.replace(/\\s+/g, "")')) {
      issues.push({ id, level: "CRITICAL", msg: "normalizeMath whitespace regex may be broken" });
    }
  }
}

const critical = issues.filter((i) => i.level === "CRITICAL");
const high = issues.filter((i) => i.level === "HIGH");

console.log(`Checked ${lessonIds.length} lessons`);
console.log(`CRITICAL: ${critical.length}, HIGH: ${high.length}`);

if (issues.length) {
  for (const i of issues.slice(0, 40)) {
    console.log(`[${i.level}] ${i.id}: ${i.msg}`);
  }
  if (issues.length > 40) console.log(`...and ${issues.length - 40} more`);
  process.exit(critical.length ? 1 : 0);
}

console.log("All guided-notes quality checks passed.");
