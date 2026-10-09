import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { readingSupportPages, shellPages, withCurriculumShell } from "./lib/curriculum-shell.mjs";
import { loadCurriculumManifest, REPO_ROOT } from "./lib/curriculum-source.mjs";

let stale = 0;
for (const [path, active] of shellPages) {
  const file = resolve(REPO_ROOT, path);
  const original = readFileSync(file, "utf8");
  const updated = withCurriculumShell(original, active, {
    readingSupports: readingSupportPages.has(path),
  });
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
// Unit 10 stays in the course (its lessons exist) but is not taught this year
// (Joel, 2026-10-07: "Unit 10 is not taught"). The district plan still pencils
// it in for June, so presenting those dates as upcoming would be a promise the
// class will not keep.
const NOT_SCHEDULED = new Set([10]);
const datesFor = (unit) => {
  if (NOT_SCHEDULED.has(unit))
    return {
      attrs: ' data-unscheduled=""',
      label:
        '<span class="course-unit-dates">Not scheduled this year <span lang="es">· No programada este año</span></span>',
    };
  const range = rangeFor(unit);
  if (!range?.startDate || !range?.endDate) return { attrs: "", label: "" };
  return {
    attrs: ` data-start="${range.startDate}" data-end="${range.endDate}"`,
    label: `<span class="course-unit-dates">${shortDate(range.startDate)} – ${shortDate(range.endDate)}</span>`,
  };
};
// Cards follow the order the class is taught (the district plan), not unit
// number: 1, 3, 4, 6, 7, 8, 9, 5, 2, then anything the plan does not schedule.
const teachingRank = (unit) => {
  const range = rangeFor(unit);
  return NOT_SCHEDULED.has(unit) || !range?.startDate ? Infinity : range.sequence;
};
const unitsInOrder = manifest.units
  .map((unit, index) => ({ unit, name: names[index] }))
  .sort((a, b) => teachingRank(a.unit) - teachingRank(b.unit) || a.unit - b.unit);

// The day-by-day plan, compacted for the hub's Now / Next card:
//   days:    [date, unit, dayType, lessonId, detail]
//   lessons: { id: [title, titleEs] } for every lesson a day names
// School days only, and none for a unit that is not scheduled. `detail` is the
// day number of a multi-day lesson, or the plan's own title for a day with no
// lesson (review, assessment, project). Lesson titles come from the manifest —
// the baseline deliberately stores none of its own.
const baseline = JSON.parse(
  readFileSync(resolve(REPO_ROOT, "data/pacing-baseline-2026-27.json"), "utf8"),
);
const unitOfKey = new Map(ranges.units.map((range) => [range.key, range.curriculumUnit]));
const lessonById = new Map(manifest.lessons.map((lesson) => [lesson.id, lesson]));
const pacingLessons = {};
const pacingDays = baseline.days
  .filter((day) => day.schoolStatus === "school" && day.plan?.dayType)
  .map((day) => {
    const { dayType, lessonId, planTitle, unitKey } = day.plan;
    const unit = unitOfKey.get(unitKey) ?? null;
    if (!lessonId) return [day.date, unit, dayType, null, planTitle || dayType];
    const base = lessonId.replace(/-catchup$/, "");
    const lesson = lessonById.get(base);
    if (!lesson) throw new Error(`Pacing day ${day.date} names unknown lesson ${lessonId}`);
    pacingLessons[base] = [lesson.title, lesson.titleEs || lesson.title];
    const part = /— Day (\d+)$/.exec(planTitle || "")?.[1];
    return [day.date, unit, dayType, lessonId, Number(part) > 1 ? Number(part) : null];
  })
  .filter(([, unit]) => !NOT_SCHEDULED.has(unit));

const overview = `<!-- course-overview:begin -->
<section class="course-overview" id="course-overview" aria-labelledby="course-overview-title"><div class="course-overview__head"><h2 id="course-overview-title">Your Grade 6 course</h2><p>${manifest.units.length} units. ${manifest.lessons.length} lessons. Listed in the order your class learns them, with the dates for each. <span lang="es">Unidades en el orden en que tu clase las aprende, con sus fechas.</span></p></div><ol class="course-unit-list">${unitsInOrder
  .map(({ unit, name }) => {
    const dates = datesFor(unit);
    return `<li data-unit="${unit}"${dates.attrs}><a href="/curriculum/units/#unit-${unit}"><span class="course-unit-number">Unit ${unit}</span><strong class="course-unit-title">${name}</strong><span class="course-unit-count">${manifest.lessons.filter((lesson) => lesson.unit === unit).length} lessons</span>${dates.label}</a></li>`;
  })
  .join("")}</ol></section>
<!-- course-overview:end -->
`;
// The plan ships as its own small script (not inline: the hub caps inline
// script size) and is read by assets/curriculum-home.js.
const pacingPath = resolve(REPO_ROOT, "assets/pacing-days.generated.js");
// Formatted the way Biome would, so `npm run check` passes on the output.
const pacingSource = `/* GENERATED by tools/sync-curriculum-shell.mjs from data/pacing-baseline-2026-27.json
 * and the curriculum manifest — do not hand-edit. Read by the hub's Now / Next card.
 * days: [date, unit, dayType, lessonId, detail]; lessons: { id: [title, titleEs] } */
window.__NT_PACING_DAYS = ${JSON.stringify({ days: pacingDays, lessons: pacingLessons })};
`;
const pacingScript = execFileSync("npx", ["biome", "format", `--stdin-file-path=${pacingPath}`], {
  cwd: REPO_ROOT,
  input: pacingSource,
  encoding: "utf8",
});
let previousPacing = "";
try {
  previousPacing = readFileSync(pacingPath, "utf8");
} catch {}
if (previousPacing !== pacingScript) {
  if (process.argv.includes("--check")) {
    console.error("Hub pacing days need syncing");
    process.exitCode = 1;
  } else writeFileSync(pacingPath, pacingScript);
}

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
