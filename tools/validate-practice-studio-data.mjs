// Validates data/practice-studio/<lesson>.json against docs/specs/practice-studio-v2.md section 7.
//   node tools/validate-practice-studio-data.mjs [lessonId ...]     (no ids = every core lesson in Units 2-9)
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateLessonData } from "../scripts/lib/practice-studio-data.mjs";
import { listLessonDirs, REPO_ROOT } from "./lib/curriculum-source.mjs";

const STUDIO_UNITS = [2, 3, 5, 6, 7, 8, 9];
const worlds = JSON.parse(
  readFileSync(join(REPO_ROOT, "data/practice-studio/worlds.json"), "utf8"),
);
const all = listLessonDirs({ filter: /^\d+-\d+$/ })
  .filter((id) => STUDIO_UNITS.includes(Number(id.split("-")[0])))
  .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
const want = process.argv.slice(2);
const ids = want.length ? want : all;
let problems = 0;
let checked = 0;
for (const id of ids) {
  const file = join(REPO_ROOT, `data/practice-studio/${id}.json`);
  if (!existsSync(file)) {
    console.error(`MISSING data/practice-studio/${id}.json`);
    problems++;
    continue;
  }
  let data;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    console.error(`${id}: invalid JSON: ${e.message}`);
    problems++;
    continue;
  }
  checked++;
  for (const msg of validateLessonData(id, data, worlds)) {
    console.error(msg);
    problems++;
  }
}
if (problems) {
  console.error(`\n${problems} problem(s) in ${ids.length} lesson file(s).`);
  process.exit(1);
}
console.log(`practice-studio data: ${checked} lesson file(s) valid.`);
