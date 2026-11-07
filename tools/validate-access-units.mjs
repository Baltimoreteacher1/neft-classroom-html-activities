#!/usr/bin/env node
// Thematic-unit content gate: every unit file against tools/lib/access-units-rules.mjs, and every activity id a lesson
// sequences must exist in that band's bank.
//   node tools/validate-access-units.mjs                       both bands (8 units for 6-8, 6 for 3-5)
//   node tools/validate-access-units.mjs --file <json> --band 6-8   one part file while authoring (any number of units)
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { allActivities, CONTENT_DIR } from "./lib/access-lab-content.mjs";
import { UNIT_COUNTS, validateUnitsFile } from "./lib/access-units-rules.mjs";

export const UNITS_DIR = join(CONTENT_DIR, "units");
export const unitsPath = (band) => join(UNITS_DIR, `g${band}.json`);

export function activityMap() {
  return new Map(
    allActivities().map(({ band, domain, level, activity }) => [
      activity.id,
      { band, domain, level, type: activity.type },
    ]),
  );
}

export function checkAll(activities = activityMap()) {
  const problems = [];
  const seen = new Map();
  for (const band of Object.keys(UNIT_COUNTS)) {
    const file = unitsPath(band);
    if (!existsSync(file)) {
      problems.push(`${band}: ${file} is missing`);
      continue;
    }
    const data = JSON.parse(readFileSync(file, "utf8"));
    problems.push(...validateUnitsFile(data, { band, activities }));
    for (const u of data.units || []) {
      if (seen.has(u.id))
        problems.push(`unit id ${u.id} is used in both ${seen.get(u.id)} and ${band}`);
      seen.set(u.id, band);
      if (["task", "packet", "certificate"].includes(u.id))
        problems.push(`unit id ${u.id} is a reserved route name`);
    }
  }
  return problems;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const at = (flag) => args[args.indexOf(flag) + 1];
  const activities = activityMap();
  let problems;
  if (args.includes("--file")) {
    const band = at("--band");
    if (!UNIT_COUNTS[band]) throw new Error("--band must be 6-8 or 3-5");
    problems = validateUnitsFile(JSON.parse(readFileSync(at("--file"), "utf8")), {
      band,
      activities,
      partial: true,
    });
  } else problems = checkAll(activities);
  if (problems.length) {
    console.error(problems.map((p) => `  - ${p}`).join("\n"));
    console.error(`\nFAIL validate-access-units: ${problems.length} problem(s)`);
    process.exit(1);
  }
  console.log("PASS validate-access-units");
}
