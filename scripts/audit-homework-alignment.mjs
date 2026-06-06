#!/usr/bin/env node
/**
 * Audit all family homework.html files for tab UI, games, links, alignment, and no curriculum nav.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { scoreHomeworkAlignment, detectVisualMismatch } from "./homework-alignment.mjs";

const root = join(import.meta.dirname, "..");
const lessonsDir = join(root, "lessons");
const LESSON_DIR_RE = /^(\d+)-(\d+)(-flagship)?$/;

const REQUIRED_MARKERS = [
  { id: "tab-bar", test: (h) => h.includes('class="homework-tab-bar"') && h.includes("switchHomeworkTab") },
  { id: "all-tabs", test: (h) => ["learn", "words", "together", "check", "help", "more", "play", "done"].every((t) => h.includes(`data-tab-panel="${t}"`)) },
  { id: "play-game", test: (h) => h.includes('data-tab-panel="play"') && (h.includes("hw-game") || h.includes("initHomeworkGame")) },
  { id: "external-links", test: (h) => h.includes("external-resource-list") && h.includes("external-resource-link") },
  { id: "help-modal", test: (h) => h.includes("help_modal_overlay") && h.includes("openHelpModalFromBtn") },
  { id: "bilingual", test: (h) => h.includes('lang="es"') && h.includes("Ayuda a tu estudiante") },
  { id: "no-curriculum", test: (h) => !/\/curriculum\//i.test(h) && !/Back to curriculum/i.test(h) && !/Curriculum Hub/i.test(h) },
];

function loadLessons() {
  return readdirSync(lessonsDir)
    .filter((d) => LESSON_DIR_RE.test(d) && existsSync(join(lessonsDir, d, "config.json")))
    .sort((a, b) => {
      const [, u1, l1] = a.match(LESSON_DIR_RE);
      const [, u2, l2] = b.match(LESSON_DIR_RE);
      return Number(u1) - Number(u2) || Number(l1) - Number(l2);
    })
    .map((id) => ({
      id,
      config: JSON.parse(readFileSync(join(lessonsDir, id, "config.json"), "utf8")),
      html: readFileSync(join(lessonsDir, id, "homework.html"), "utf8"),
    }));
}

const lessons = loadLessons();
const expectedCount = 74;
const failures = [];
const alignmentRows = [];

console.log(`\nHomework alignment audit — ${lessons.length} lessons\n`);

if (lessons.length !== expectedCount) {
  console.warn(`⚠ Expected ${expectedCount} lessons, found ${lessons.length}`);
}

for (const { id, config, html } of lessons) {
  const lessonFails = [];

  for (const marker of REQUIRED_MARKERS) {
    if (!marker.test(html)) {
      lessonFails.push(marker.id);
    }
  }

  const { score, issues } = scoreHomeworkAlignment(config, html);
  const { wrongTopic } = detectVisualMismatch(config, html);
  const aligned = score >= 70 && !wrongTopic;

  alignmentRows.push({ id, score, aligned, issues });

  if (!aligned) {
    lessonFails.push(`alignment(score=${score}${issues.length ? `: ${issues.join("; ")}` : ""})`);
  }

  if (lessonFails.length) {
    failures.push({ id, fails: lessonFails });
  }
}

const passCount = lessons.length - failures.length;
const alignedCount = alignmentRows.filter((r) => r.aligned).length;

console.log("Structure & policy checks:");
for (const marker of REQUIRED_MARKERS) {
  const ok = lessons.filter((l) => marker.test(l.html)).length;
  console.log(`  ${ok === lessons.length ? "✓" : "✗"} ${marker.id}: ${ok}/${lessons.length}`);
}

console.log(`\nTopic alignment: ${alignedCount}/${lessons.length} aligned (score ≥70, no wrong-topic visual)`);

if (failures.length) {
  console.log(`\n❌ FAIL — ${passCount}/${lessons.length} pass\n`);
  for (const f of failures.slice(0, 20)) {
    console.log(`  ${f.id}: ${f.fails.join(", ")}`);
  }
  if (failures.length > 20) {
    console.log(`  … and ${failures.length - 20} more`);
  }
  process.exit(1);
}

console.log(`\n✅ PASS — ${passCount}/${lessons.length} lessons fully compliant\n`);
process.exit(0);
