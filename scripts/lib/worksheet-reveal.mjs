/**
 * worksheet-reveal.mjs — the district Reveal practice-sheet snapshots, keyed
 * by lesson id, for the printed worksheets.
 *
 * `data/reveal-session1-source.json` (tools/import-session1-practice.mjs) and
 * `data/part-two-session2-source.json` (tools/import-session2-practice.mjs)
 * are committed extracts of `~/Desktop/Reveal Math by Unit and Lesson/`. A core
 * lesson and its small-group variants read Session 1; an Apply Day lesson
 * (`-part2`) reads Session 2. A lesson the district folder does not cover
 * (Units 1 and 10, the bridge practice lessons) gets `null` and the generator
 * falls back to the lesson's own config.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const load = (file) => JSON.parse(readFileSync(join(ROOT, "data", file), "utf8"));

const SESSION_1 = new Map(load("reveal-session1-source.json").lessons.map((l) => [l.id, l]));
const SESSION_2 = new Map(load("part-two-session2-source.json").lessons.map((l) => [l.id, l]));

const UNIT_LABELS = (() => {
  const names = {};
  for (const u of load("pacing-unit-ranges.json").units) {
    if (!u.curriculumUnit || names[u.curriculumUnit]) continue;
    const label = String(u.districtLabel || "");
    names[u.curriculumUnit] = /^Pre-Unit/i.test(label)
      ? "Pre-Unit"
      : label.replace(/^[^:]*:\s*/, "");
  }
  return names;
})();

/** The Reveal sheet this lesson's packet opens with, or null. */
export function revealFor(lessonId) {
  const id = String(lessonId || "");
  if (/^\d+-\d+-part2$/.test(id)) return SESSION_2.get(id) || null;
  const m = /^(\d+)-(\d+)(?:-(?:group1|group2|catchup))?$/.exec(id);
  return m ? SESSION_1.get(`${m[1]}-${m[2]}`) || null : null;
}

/** "Unit 3: Ratios & Rates" — the district's own unit name. */
export function unitLabel(cfg) {
  const n = Number(cfg?.unit);
  if (!n) return "";
  const name = UNIT_LABELS[n];
  if (!name) return `Unit ${n}`;
  return name === "Pre-Unit" ? "Pre-Unit" : `Unit ${n}: ${name}`;
}

/** "Lesson 3.1" from a config, tolerant of ids like 3-1-group1. */
export function lessonLabel(cfg) {
  const m = /^(\d+)-(\d+)/.exec(String(cfg?.lessonId || ""));
  if (m) return `Lesson ${m[1]}.${m[2]}`;
  return cfg?.unit && cfg?.lesson ? `Lesson ${cfg.unit}.${cfg.lesson}` : "";
}
