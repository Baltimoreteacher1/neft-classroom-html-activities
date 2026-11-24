// Validates BCPSS Writing Lab (TWR) authored content. Usage:
//   node tools/validate-bcpss-writing.mjs                 # every writing file present
//   node tools/validate-bcpss-writing.mjs g4-sci-u2 ...   # specific unit ids
//   node tools/validate-bcpss-writing.mjs --coverage      # also fail if any of the 162 units has no writing file
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { BCPSS_UNITS } from "../data/bcpss-curriculum-seed.mjs";
import { validateWriting } from "../db/seeds/bcpss/v2/writing-schema.mjs";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../db/seeds/bcpss/v2/writing");
const args = process.argv.slice(2);
const coverage = args.includes("--coverage");
const ids = args.filter((a) => !a.startsWith("--"));
const byId = new Map(BCPSS_UNITS.map((u) => [u.id, u]));
const files = existsSync(dir)
  ? readdirSync(dir)
      .filter((f) => f.endsWith(".mjs"))
      .map((f) => f.replace(/\.mjs$/, ""))
      .filter((id) => !ids.length || ids.includes(id))
  : [];
const problems = [];
for (const id of ids) if (!files.includes(id)) problems.push(`${id}: no writing file`);
for (const id of files) {
  const unit = byId.get(id);
  if (!unit) {
    problems.push(`${id}: unknown unit id (writing)`);
    continue;
  }
  const w = (await import(pathToFileURL(path.join(dir, `${id}.mjs`)).href)).default;
  problems.push(...validateWriting(unit, w));
}
if (coverage)
  for (const u of BCPSS_UNITS) if (!files.includes(u.id)) problems.push(`${u.id}: no writing file`);
console.log(`${files.length} writing units, ${problems.length} problems`);
for (const p of problems) console.log(" -", p);
process.exit(problems.length ? 1 : 0);
