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
  .map((u, index) => {
    const unitNum = typeof u === "object" && u !== null ? u.number : u;
    return { unit: unitNum, name: names[index] };
  })
  .sort((a, b) => teachingRank(a.unit) - teachingRank(b.unit) || a.unit - b.unit);

// Small, subject-specific chapter vignettes. Each model is decorative in the
// link name but mathematically intentional and remains legible at phone width.
const chapterArt = {
  1: '<path d="M18 48 42 12l24 36H18Z"/><circle cx="42" cy="35" r="13"/><path d="M72 16h30M72 27h20M72 38h25M72 49h15"/>',
  2: '<path d="M14 49H108M22 49V14"/><circle cx="37" cy="39" r="3"/><circle cx="48" cy="39" r="3"/><circle cx="59" cy="39" r="3"/><circle cx="70" cy="28" r="3"/><circle cx="81" cy="28" r="3"/><circle cx="92" cy="17" r="3"/><path d="M22 39h4M22 28h4M37 49v4M48 49v4M59 49v4M70 49v4M81 49v4M92 49v4"/>',
  3: '<rect x="12" y="20" width="35" height="28" rx="2" fill="currentColor" fill-opacity=".12"/><rect x="73" y="20" width="35" height="28" rx="2" fill="currentColor" fill-opacity=".2"/><text x="19" y="39" font-size="16" font-family="Fraunces, Georgia, serif" fill="currentColor" stroke="none">2:3</text><path d="M51 34h16m-5-5 5 5-5 5"/><text x="54" y="25" font-size="8" font-family="Hanken Grotesk, sans-serif" fill="currentColor" stroke="none">×2</text><text x="80" y="39" font-size="16" font-family="Fraunces, Georgia, serif" fill="currentColor" stroke="none">4:6</text>',
  4: '<g stroke-width="1.5"><path d="M30 12h48v48H30zM42 12v48M54 12v48M66 12v48M30 24h48M30 36h48M30 48h48"/><path d="M30 12h12v12H30zM42 12h12v12H42zM30 24h12v12H30zM42 24h12v12H42z" fill="currentColor" fill-opacity=".32"/></g><text x="86" y="39" font-size="14" font-family="Hanken Grotesk, sans-serif" fill="currentColor" stroke="none">25%</text>',
  5: '<path d="m25 22 29-12 38 11-29 13-38-12ZM25 22v31l38 12V34M63 65V34M92 21v31L63 65M54 10v31M25 53l29-12 38 11"/><path d="M17 58h15M83 61h15" stroke-dasharray="3 3"/>',
  6: '<rect x="14" y="14" width="48" height="40" rx="2" fill="currentColor" fill-opacity=".14"/><path d="M14 14h48v40H14z"/><text x="32" y="41" font-size="22" font-family="Fraunces, Georgia, serif" fill="currentColor" stroke="none">x</text><rect x="72" y="14" width="18" height="18"/><rect x="94" y="14" width="18" height="18"/><path d="M81 19v8M77 23h8M103 19v8M99 23h8"/>',
  7: '<path d="M15 34h92M61 8v52"/><path d="M31 30v8M46 30v8M76 30v8M91 30v8M57 19h8M57 49h8"/><circle cx="31" cy="19" r="4" fill="currentColor"/><circle cx="91" cy="49" r="4" fill="currentColor"/><path d="m102 30 5 4-5 4M57 13l4-5 4 5"/>',
  8: '<path d="M60 13v39M42 54h36M48 52 36 64M72 52l12 12M20 26h80M60 26l-3-13h6l-3 13Z"/><rect x="30" y="15" width="14" height="11"/><text x="33" y="24" font-size="9" font-family="Hanken Grotesk, sans-serif" fill="currentColor" stroke="none">x</text><rect x="22" y="31" width="10" height="10"/><rect x="35" y="31" width="10" height="10"/><rect x="75" y="31" width="10" height="10"/><rect x="88" y="31" width="10" height="10"/><rect x="75" y="44" width="10" height="10"/><rect x="88" y="44" width="10" height="10"/><rect x="101" y="31" width="10" height="10"/>',
  9: '<path d="M13 10h48v48H13zM13 22h48M13 34h48M13 46h48M37 10v48M69 55V12M69 55h43"/><text x="20" y="19" font-size="8" font-family="Hanken Grotesk, sans-serif" fill="currentColor" stroke="none">x</text><text x="44" y="19" font-size="8" font-family="Hanken Grotesk, sans-serif" fill="currentColor" stroke="none">y</text><text x="20" y="31" font-size="8" font-family="Hanken Grotesk, sans-serif" fill="currentColor" stroke="none">0</text><text x="44" y="31" font-size="8" font-family="Hanken Grotesk, sans-serif" fill="currentColor" stroke="none">1</text><text x="20" y="43" font-size="8" font-family="Hanken Grotesk, sans-serif" fill="currentColor" stroke="none">1</text><text x="44" y="43" font-size="8" font-family="Hanken Grotesk, sans-serif" fill="currentColor" stroke="none">3</text><text x="20" y="55" font-size="8" font-family="Hanken Grotesk, sans-serif" fill="currentColor" stroke="none">2</text><text x="44" y="55" font-size="8" font-family="Hanken Grotesk, sans-serif" fill="currentColor" stroke="none">5</text><path d="m76 47 12-12 12-12 8-8"/><circle cx="76" cy="47" r="2.5" fill="currentColor"/><circle cx="88" cy="35" r="2.5" fill="currentColor"/><circle cx="100" cy="23" r="2.5" fill="currentColor"/>',
  10: '<path d="M40 36 40 12A24 24 0 0 1 60.8 48Z" fill="currentColor" fill-opacity=".22"/><path d="M40 36 60.8 48A24 24 0 0 1 19.2 48Z"/><path d="M40 36 19.2 48A24 24 0 0 1 40 12Z"/><path d="m78 53 13-23 13 23H78Z"/><circle cx="91" cy="18" r="3" fill="currentColor"/>',
};

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
    const titleEn =
      typeof lesson.title === "object" && lesson.title ? lesson.title.en : lesson.title;
    const titleEs =
      typeof lesson.title === "object" && lesson.title
        ? lesson.title.es || titleEn
        : lesson.titleEs || lesson.title;
    pacingLessons[base] = [titleEn, titleEs];
    const part = /— Day (\d+)$/.exec(planTitle || "")?.[1];
    return [day.date, unit, dayType, lessonId, Number(part) > 1 ? Number(part) : null];
  })
  .filter(([, unit]) => !NOT_SCHEDULED.has(unit));

const overview = `<!-- course-overview:begin -->
<section class="course-overview" id="course-overview" aria-labelledby="course-overview-title"><div class="course-overview__head"><h2 id="course-overview-title">Your Grade 6 course</h2><p>${manifest.units.length} units. ${manifest.lessons.length} lessons. Listed in the order your class learns them, with the dates for each. <span lang="es">Unidades en el orden en que tu clase las aprende, con sus fechas.</span></p></div><ol class="course-unit-list">${unitsInOrder
  .map(({ unit, name }) => {
    const dates = datesFor(unit);
    return `<li data-unit="${unit}"${dates.attrs}><a href="/curriculum/units/#unit-${unit}"><span class="course-unit-number">Unit ${unit}</span><svg class="course-unit-art" viewBox="0 0 120 72" aria-hidden="true" focusable="false">${chapterArt[unit]}</svg><strong class="course-unit-title">${name}</strong><span class="course-unit-count">${manifest.lessons.filter((lesson) => lesson.unit === unit).length} lessons</span>${dates.label}</a></li>`;
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
    /([ \t]*<main id="main-content" class="hub-page">)/,
    `$1\n      ${overview.trimStart()}`,
  );
if (current !== updated) {
  if (process.argv.includes("--check")) {
    console.error("Course overview needs syncing");
    process.exitCode = 1;
  } else writeFileSync(home, updated);
}

const sequencePath = resolve(REPO_ROOT, "assets/curriculum-lesson-sequence.json");
const sequence =
  JSON.stringify(
    manifest.lessons.map(({ id, unit, title }) => ({
      id,
      unit,
      title: typeof title === "object" && title ? title.en : title,
    })),
  ) + "\n";
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
