// Validates every lesson companion: JSON Schema (Ajv), per-kind payloads and answer keys, template leaks,
// duplication, coverage and the IP denylist.  node tools/validate-bcpss-lessons.mjs [unitId ...]
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Ajv from "ajv/dist/2020.js";
import { BCPSS_UNITS } from "../data/bcpss-curriculum-seed.mjs";
import { checkCoverage, checkLesson } from "../db/seeds/bcpss/v2/lesson-checks.mjs";
import { loadLessons } from "../functions/_lib/bcpss/lessons.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const readJson = (f) => JSON.parse(readFileSync(path.join(root, f), "utf8"));
const ajv = new Ajv({ allErrors: true, strict: false });
ajv.addSchema(readJson("schemas/activity.schema.json"));
const validate = ajv.compile(readJson("schemas/lesson.schema.json"));
const deny = readFileSync(path.join(root, "config/ip-denylist.txt"), "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"))
  .map((l) => l.toLowerCase());
const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const problems = [];
const add = (m) => problems.push(m);
const missions = new Map();
let lessons = 0;
let activities = 0;
for (const unit of BCPSS_UNITS) {
  if (only.length && !only.includes(unit.id)) continue;
  const set = await loadLessons(unit.id);
  if (!set) {
    add(`${unit.id}: no lessons`);
    continue;
  }
  checkCoverage(unit, set.lessons, add);
  for (const l of set.lessons) {
    lessons += 1;
    if (!validate(l))
      for (const e of validate.errors.slice(0, 4))
        add(`${l.id}: schema ${e.instancePath || "/"} ${e.message}`);
    else checkLesson(l, unit, add);
    const all = [
      ...l.arc.map((s) => s.activity),
      ...l.newcomer_path,
      l.exit_check,
      ...(l.extension ? [l.extension] : []),
    ];
    activities += all.length;
    for (const a of all) {
      const k = `${a.kind}|${norm(a.mission)}`;
      (missions.get(k) || missions.set(k, new Set()).get(k)).add(unit.id);
    }
    const blob = JSON.stringify(l).toLowerCase();
    for (const d of deny) if (blob.includes(d)) add(`${l.id}: IP denylist phrase "${d}"`);
  }
}
for (const [k, units] of missions)
  if (units.size > 3) add(`mission reused in ${units.size} units: ${k.slice(0, 90)}`);
console.log(`${lessons} lessons, ${activities} activities, ${problems.length} problems`);
const groups = new Map();
for (const p of problems) {
  const key = p
    .replace(/^[a-z0-9-]+: /, "")
    .replace(/"[^"]*"/g, '"…"')
    .replace(/\d+/g, "N")
    .slice(0, 120);
  const g = groups.get(key) || { n: 0, first: p };
  g.n += 1;
  groups.set(key, g);
}
for (const [, g] of [...groups].sort((x, y) => y[1].n - x[1].n).slice(0, 25))
  console.log(` - x${g.n} ${g.first}`);
process.exit(problems.length ? 1 : 0);
