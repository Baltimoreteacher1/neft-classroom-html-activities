// Validates BCPSS Language Studio v2 authored content. Usage:
//   node tools/validate-bcpss-studio.mjs                # every v2 file present
//   node tools/validate-bcpss-studio.mjs g6-math-u1 g6-math-u2   # specific unit ids
//   node tools/validate-bcpss-studio.mjs --coverage     # also fail if any of the 162 units has no studio
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { BCPSS_UNITS } from "../data/bcpss-curriculum-seed.mjs";
import { validateFamily, validateStudio } from "../db/seeds/bcpss/v2/schema.mjs";

const unitsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../db/seeds/bcpss/v2/units",
);
const args = process.argv.slice(2);
const coverage = args.includes("--coverage");
const ids = args.filter((a) => !a.startsWith("--"));
const files = readdirSync(unitsDir)
  .filter((f) => f.endsWith(".mjs"))
  .map((f) => f.replace(/\.mjs$/, ""))
  .filter((id) => !ids.length || ids.includes(id));
const byId = new Map(BCPSS_UNITS.map((u) => [u.id, u]));
const seen = new Set();
const problems = [];
let acts = 0;
for (const id of files) {
  const unit = byId.get(id);
  if (!unit) {
    problems.push(`${id}: unknown unit id`);
    continue;
  }
  const studio = (await import(pathToFileURL(path.join(unitsDir, `${id}.mjs`)).href)).default;
  seen.add(id);
  acts += studio?.activities?.length || 0;
  problems.push(...validateStudio(unit, studio));
}
const famDir = path.join(unitsDir, "../family");
let famCount = 0;
if (existsSync(famDir)) {
  for (const f of readdirSync(famDir).filter((x) => x.endsWith(".mjs"))) {
    const id = f.replace(/\.mjs$/, "");
    if (ids.length && !ids.includes(id)) continue;
    const unit = byId.get(id);
    if (!unit) {
      problems.push(`${id}: unknown unit id (family)`);
      continue;
    }
    const studio = seen.has(id)
      ? (await import(pathToFileURL(path.join(unitsDir, `${id}.mjs`)).href)).default
      : null;
    famCount++;
    problems.push(
      ...validateFamily(
        unit,
        studio,
        (await import(pathToFileURL(path.join(famDir, f)).href)).default,
      ),
    );
  }
}
if (coverage)
  for (const u of BCPSS_UNITS)
    if (!existsSync(path.join(famDir, `${u.id}.mjs`))) problems.push(`${u.id}: no family guide`);
if (coverage)
  for (const u of BCPSS_UNITS) if (!seen.has(u.id)) problems.push(`${u.id}: no v2 studio content`);
console.log(
  `${seen.size} units, ${acts} activities, ${famCount} family guides, ${problems.length} problems`,
);
for (const p of problems) console.log(" -", p);
process.exit(problems.length ? 1 : 0);
