// curriculum-source.mjs — the one place tools and scripts learn where
// curriculum content lives and how it is enumerated.
//
// Phase 2b of the productization plan (docs/superpowers/specs/
// 2026-09-05-phase2b-curriculum-source-design.md): 217 files used to hardcode
// the lessons/ layout each in their own words; multi-tenancy needs the source
// swappable behind ONE seam, and this is the seam. New direct readers of
// lessons/ are refused by tools/curriculum-source-ratchet.test.mjs.
//
// Deliberately thin: no caching, no schema, no writes.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// REPO redirects the whole curriculum source at another root — sandbox tests
// (small-group-generator-idempotent) rely on it, and it is the seam's whole
// point: the source must be swappable without touching any consumer.
export const REPO_ROOT = process.env.REPO
  ? resolve(process.env.REPO)
  : fileURLToPath(new URL("../..", import.meta.url));
export const LESSONS_DIR = join(REPO_ROOT, "lessons");

// Core lesson id shape (variants carry suffixes: 2-6-group1, 3-1-part2, …).
export const CORE_ID_RE = /^\d+-\d+$/;

/**
 * Sorted lesson dir names under LESSONS_DIR that contain a config.json.
 * @param {{filter?: RegExp}} [opts] filter applies to the dir name.
 */
export function listLessonDirs(opts = {}) {
  const { filter } = opts;
  return readdirSync(LESSONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => (filter ? filter.test(name) : true))
    .filter((name) => existsSync(join(LESSONS_DIR, name, "config.json")))
    .sort();
}

/** join(LESSONS_DIR, id, ...segments) */
export function lessonPath(id, ...segments) {
  return join(LESSONS_DIR, id, ...segments);
}

/** Parsed config.json for a lesson id. Throws if absent or unparsable. */
export function loadLessonConfig(id) {
  return JSON.parse(readFileSync(lessonPath(id, "config.json"), "utf8"));
}

/** Like loadLessonConfig, but null when the config is absent or unparsable. */
export function tryLoadLessonConfig(id) {
  try {
    return loadLessonConfig(id);
  } catch {
    return null;
  }
}
