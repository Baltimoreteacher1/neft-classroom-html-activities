/** Where the Family Take-Home files live, and which lessons have them (every lesson with a family sidecar). */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { lessonPath, REPO_ROOT } from "../../tools/lib/curriculum-source.mjs";
import { readManifest } from "./student-pdf.mjs";

export const SIDECAR_DIR = join(REPO_ROOT, "data", "family-homework-notes");

export const listFamilyIds = () =>
  readdirSync(SIDECAR_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -5))
    .sort();

/** Absolute output paths for one lesson and language. English files carry no suffix, Spanish ends in -es. */
export function outputPaths(id, lang) {
  const s = lang === "es" ? "-es" : "";
  const dir = (name) => lessonPath(id, "downloads", `${id}-${name}`);
  return {
    sheetPdf: dir(`family-sheet${s}.pdf`),
    guidePdf: dir(`family-guide${s}.pdf`),
    docx: dir(`family-sheet${s}.docx`),
  };
}

/** How many practice items the sheet carries (4-6): the longer language decides, both print the same number. */
export function fittedItemCount(id) {
  const value = readManifest()[`${id}/family-items`];
  const n = Number(/:(\d)$/.exec(value ?? "")?.[1]);
  if (!(n >= 4 && n <= 6))
    throw new Error(
      `family-takehome: no fitted item count for ${id}; run node scripts/generate-family-takehome.mjs`,
    );
  return n;
}
