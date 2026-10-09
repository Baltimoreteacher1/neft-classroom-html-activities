// Lesson identity for the readiness (Get Ready) generators.
//
// A readiness data file (scripts/readiness/data/<id>.json) owns its CONTENT
// only: why, skills, diagnostic, learn, tiers, exit. The lesson's number, title
// and standard are NOT stored there — they come from the curriculum launch
// manifest, the single source of truth for what students see a lesson called.
//
// Why: until 2026-10-08 each data file carried its own "title" and
// "unitName". The 2026-08-10 Reveal-TOC renumbering moved every lesson
// directory (and the readiness page inside it) but not the data, so all 64
// Get Ready pages kept announcing the OLD lesson number and 45 of them another
// lesson's title (2-1's said "Lesson 8-1 … Unit 8 · Lesson 1"). Reading the
// identity from the manifest makes that drift impossible.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const LAUNCH_MANIFEST = join(ROOT, "data", "curriculum-launch-manifest.json");

let cache = null;
function lessons() {
  if (!cache) {
    const m = JSON.parse(readFileSync(LAUNCH_MANIFEST, "utf8"));
    cache = new Map(m.lessons.map((l) => [l.id, l]));
  }
  return cache;
}

/**
 * @param {string} id  base lesson id, e.g. "2-1"
 * @returns {{ id: string, unit: number, lesson: number, title: string, standard: string, unitLabel: string }}
 */
export function lessonIdentity(id) {
  const l = lessons().get(id);
  if (!l) {
    throw new Error(
      `readiness: lesson "${id}" is not in data/curriculum-launch-manifest.json — ` +
        "re-key the data file to the lesson's current id (data/toc-migration.json maps old ids).",
    );
  }
  if (!l.title || !Number.isInteger(l.unit) || !Number.isInteger(l.lesson)) {
    throw new Error(`readiness: manifest entry for "${id}" lacks title/unit/lesson`);
  }
  return {
    id,
    unit: l.unit,
    lesson: l.lesson,
    title: l.title,
    standard: l.standard || "",
    unitLabel: `Unit ${l.unit} · Lesson ${l.lesson}`,
  };
}
