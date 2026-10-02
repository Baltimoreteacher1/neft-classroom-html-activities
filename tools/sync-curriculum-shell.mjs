import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { shellPages, withCurriculumShell } from "./lib/curriculum-shell.mjs";
import { loadCurriculumManifest, REPO_ROOT } from "./lib/curriculum-source.mjs";

let stale = 0;
for (const [path, active] of shellPages) {
  const file = resolve(REPO_ROOT, path);
  const original = readFileSync(file, "utf8");
  const updated = withCurriculumShell(original, active);
  if (updated === original) continue;
  if (process.argv.includes("--check")) {
    console.error(`Curriculum navigation needs syncing: ${path}`);
    stale++;
  } else {
    writeFileSync(file, updated);
    console.log(`Updated curriculum navigation: ${path}`);
  }
}
if (stale) process.exitCode = 1;

// The authored units own their names; the manifest owns core lesson counts.
const source = readFileSync(resolve(REPO_ROOT, "curriculum/units/index.html"), "utf8");
const names = [...source.matchAll(/<span class="unit-name">([^<]+)<\/span>/g)].map(
  (match) => match[1],
);
const manifest = loadCurriculumManifest();
if (names.length !== manifest.units.length)
  throw new Error("Unit overview does not match the course.");

// Unit dates come from the generated pacing ranges (the original plan), so the
// cards can say when each unit is taught and mark the current one on load.
const ranges = JSON.parse(readFileSync(resolve(REPO_ROOT, "data/pacing-unit-ranges.json"), "utf8"));
const rangeFor = (unit) => ranges.units.find((entry) => entry.curriculumUnit === unit);
const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
const shortDate = (iso) => {
  const [, month, day] = iso.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}`;
};
const datesFor = (unit) => {
  const range = rangeFor(unit);
  if (!range?.startDate || !range?.endDate) return { attrs: "", label: "" };
  return {
    attrs: ` data-start="${range.startDate}" data-end="${range.endDate}"`,
    label: `<span class="course-unit-dates">${shortDate(range.startDate)} – ${shortDate(range.endDate)}</span>`,
  };
};
const overview = `<!-- course-overview:begin -->
<section class="course-overview" id="course-overview" aria-labelledby="course-overview-title"><div class="course-overview__head"><h2 id="course-overview-title">Your Grade 6 course</h2><p>${manifest.units.length} units. ${manifest.lessons.length} lessons. Units are listed by number; the dates show when each one is taught.</p></div><ol class="course-unit-list">${manifest.units
  .map((unit, index) => {
    const dates = datesFor(unit);
    return `<li data-unit="${unit}"${dates.attrs}><a href="/curriculum/units/#unit-${unit}"><span class="course-unit-number">Unit ${unit}</span><strong class="course-unit-title">${names[index]}</strong><span class="course-unit-count">${manifest.lessons.filter((lesson) => lesson.unit === unit).length} lessons</span>${dates.label}</a></li>`;
  })
  .join("")}</ol></section>
<!-- course-overview:end -->
`;
const home = resolve(REPO_ROOT, "curriculum/index.html");
const current = readFileSync(home, "utf8");
const updated = current
  .replace(/<!-- course-overview:begin -->[\s\S]*?<!-- course-overview:end -->\s*/g, "")
  .replace(
    /[ \t]*<section id="curriculum-resources"/,
    overview + '      <section id="curriculum-resources"',
  );
if (current !== updated) {
  if (process.argv.includes("--check")) {
    console.error("Course overview needs syncing");
    process.exitCode = 1;
  } else writeFileSync(home, updated);
}

const sequencePath = resolve(REPO_ROOT, "assets/curriculum-lesson-sequence.json");
const sequence =
  JSON.stringify(manifest.lessons.map(({ id, unit, title }) => ({ id, unit, title }))) + "\n";
let previousSequence = "";
try {
  previousSequence = readFileSync(sequencePath, "utf8");
} catch {}
if (previousSequence !== sequence) {
  if (process.argv.includes("--check")) {
    console.error("Lesson sequence needs syncing");
    process.exitCode = 1;
  } else writeFileSync(sequencePath, sequence);
}
