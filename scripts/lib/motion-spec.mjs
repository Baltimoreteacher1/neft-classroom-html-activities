// The motion figure a lesson takes: { key, values } from its Practice bench (data/practice-studio*/<id>.json), or null.
// Shared by the Family card generator and the lesson-path generator.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { figureFor } from "../../shared/motion/figures/index.mjs";
import { figureKeyFor } from "../../shared/motion/lesson-keys.mjs";
import { blueprints } from "../../tools/learning-labs/blueprints.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** @param {string} lessonId part pages and small groups share their lesson's figure */
export function motionSpecFor(lessonId) {
  const base = String(lessonId || "")
    .replace(/^lesson-/, "")
    .replace(/-(part\d+|group\d+|catchup)$/, "");
  for (const dir of ["data/practice-studio", "data/practice-studio-u4"]) {
    const file = join(ROOT, dir, `${base}.json`);
    if (!existsSync(file)) continue;
    const m = JSON.parse(readFileSync(file, "utf8")).bench?.model;
    if (!m) return null;
    const key = figureKeyFor(base, `${m.kind}:${m.mode}`);
    if (!figureFor(key)) return null;
    // an overridden key brings its starting values from the lab that owns it, or from the figure itself when it has no lab
    const values =
      key === `${m.kind}:${m.mode}`
        ? m.values
        : (blueprints.find((b) => `${b.model.kind}:${b.model.mode}` === key)?.model.values ??
          figureFor(key)?.standalone?.values);
    return values ? { key, values } : null;
  }
  return null;
}
