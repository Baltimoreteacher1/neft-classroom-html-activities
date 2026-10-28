// WCAG 2.2 AA on the family homework pages, measured in a real browser.
//
// Usage: node tools/verify-family-a11y.mjs [--all | --lesson=4-5,6-1] [--langs=en,es] [--jobs=4]
//   default: a fixed stratified sample (one page per unit and kind), what qa:fast runs
//   --all:   every generated lessons/*/homework.html (166), run before a release
//   --base=https://eduwonderlab.com checks a deployed site (read-only)
//
// For each page, in English and Spanish, at 390 and 1280 CSS px: axe (WCAG 2.2 A/AA, serious and
// critical fail) on the start screen and every stop, plus the in-page probes of
// tools/lib/family-a11y-probe.mjs (unnamed controls, duplicate ids, heading outline, the
// inactive language out of the accessibility tree, skip link, landmarks, text and target sizes,
// live regions, tap alternatives to drag and canvas, focus ring), and, on the phone, forced
// colors, reduced motion, 200% zoom and 400% reflow. The probes are proved against seeded
// defects first; a sweep that measured nothing FAILS.
import { existsSync } from "node:fs";
import { lessonPath, listLessonDirs, REPO_ROOT } from "./lib/curriculum-source.mjs";
import {
  openHomework,
  runAxe,
  runDrawingText,
  runFocus,
  runPreferences,
  runStructure,
  runZoom,
  STOPS,
  showStop,
  VIEWPORTS,
} from "./lib/family-a11y-run.mjs";
import { selfTest } from "./lib/family-a11y-selftest.mjs";
import { launchBrowser, parseArgs, startStaticServer } from "./lib/lesson-gate-kit.mjs";
import { exitSkipped } from "./lib/skip-exit.mjs";

const args = parseArgs(process.argv.slice(2));

export const allLessons = () =>
  listLessonDirs()
    .filter((d) => existsSync(lessonPath(d, "homework.html")))
    .sort();

/** A fixed, evenly spread sample of the per-unit, per-kind picks (base, -part2, -part3, practice). */
export function stratifiedSample(ids) {
  const pick = new Map();
  for (const id of ids) {
    const unit = id.match(/^(\d+)-/)?.[1] || "x";
    const kind = /-part3$/.test(id)
      ? "part3"
      : /-part2$/.test(id)
        ? "part2"
        : /practice|review/.test(id)
          ? "practice"
          : "base";
    const key = `${unit}:${kind}`;
    const list = pick.get(key) || [];
    list.push(id);
    pick.set(key, list);
  }
  const out = [];
  for (const [key, list] of pick) {
    const [unit, kind] = key.split(":");
    // Unit 4 and 6 carry the drawing and sorting widgets; take the middle lesson, not the first.
    if (kind === "base" && ["3", "6"].includes(unit)) out.push(list[Math.floor(list.length / 2)]);
    else if (kind !== "base" || ["1", "4", "8"].includes(unit))
      out.push(list[Math.floor(list.length / 2)]);
  }
  // Every kind of page and every unit is represented, but a pre-commit run must stay minutes, not an
  // hour: keep an evenly spread eight. --all is the exhaustive sweep.
  const all = [...new Set(out)].sort();
  return Array.from(
    { length: Math.min(8, all.length) },
    (_, i) => all[Math.floor((i * all.length) / 8)],
  );
}

const everyLesson = allLessons();
const lessons = args.lesson
  ? String(args.lesson).split(",")
  : args.all
    ? everyLesson
    : stratifiedSample(everyLesson);
const langs = String(args.langs || "en,es").split(",");
const jobs = Number(args.jobs) || (args.all ? 6 : 4);

const browser = await launchBrowser();
if (!browser) exitSkipped("no Chromium available", "Set PW_CHROMIUM_PATH to a system Chromium");

console.log("self-test: seeding each defect and its clean twin…");
const proof = await selfTest(browser);
if (proof.broken.length) {
  console.error(`FAIL self-test (${proof.broken.length} of ${proof.cases} controls misbehaved):`);
  for (const b of proof.broken) console.error(`  ${b}`);
  await browser.close();
  process.exit(1);
}
console.log(`self-test: ${proof.cases} controls fire and stay quiet as designed`);

const server = args.base ? null : await startStaticServer(REPO_ROOT);
const origin = args.base ? String(args.base).replace(/\/$/, "") : server.base;
const problems = [];
let measured = 0;
const fail = (where, what) => problems.push(`${where}: ${what}`);
const warnings = new Set();

/** Everything measured on one page in one language and viewport. */
async function sweep(lesson, lang, vpName) {
  const where = `${lesson} ${lang} @${VIEWPORTS[vpName].width}`;
  const ctx = await browser.newContext({
    viewport: VIEWPORTS[vpName],
    locale: lang === "es" ? "es-US" : "en-US",
  });
  const { page, errors } = await openHomework(ctx, origin, lesson, lang);
  // Phones get every stop; the desktop pass samples the start, the work stop and the last.
  const stops = vpName === "phone" ? ["start", ...STOPS] : ["start", "check", "done"];
  for (const stop of stops) {
    await showStop(page, stop);
    measured++;
    for (const [name, list] of Object.entries(await runStructure(page)))
      for (const msg of list.slice(0, 4)) fail(`${where} ${stop}`, `${name}: ${msg}`);
    for (const msg of (await runAxe(page)).slice(0, 4)) fail(`${where} ${stop}`, msg);
    for (const msg of await runDrawingText(page)) warnings.add(msg);
  }
  await showStop(page, "start");
  for (const msg of (await runFocus(page, 40)).slice(0, 4)) fail(where, msg);
  const fatal = errors.filter((e) => !/web-vitals/.test(e));
  for (const e of fatal.slice(0, 2)) fail(where, `page error: ${e}`);
  await ctx.close();
  if (vpName === "phone") {
    for (const [name, list] of Object.entries(await runPreferences(browser, origin, lesson, lang)))
      for (const msg of list.slice(0, 4)) fail(`${where}`, `${name}: ${msg}`);
    for (const msg of (await runZoom(browser, origin, lesson, lang)).slice(0, 4)) fail(where, msg);
  }
}

const queue = lessons.flatMap((l) =>
  langs.flatMap((lang) => ["phone", "desktop"].map((vp) => [l, lang, vp])),
);
let next = 0;
async function worker() {
  while (next < queue.length) {
    const [lesson, lang, vp] = queue[next++];
    try {
      await sweep(lesson, lang, vp);
    } catch (e) {
      fail(`${lesson} ${lang} ${vp}`, `could not be measured: ${String(e.message).split("\n")[0]}`);
    }
  }
}
const started = Date.now();
await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, worker));
await browser.close();
await server?.close();

const minimum = args.lesson ? 1 : args.all ? 150 : 8;
if (lessons.length < minimum)
  fail(
    "sweep",
    `only ${lessons.length} pages swept (floor ${minimum}); a sweep that measured nothing proves nothing`,
  );
if (!measured) fail("sweep", "no state was measured");

const secs = Math.round((Date.now() - started) / 1000);
for (const w of warnings)
  console.warn(`  warning (see docs/family-homework-v3/a11y-manual-checks.md): ${w}`);
if (problems.length) {
  console.error(
    `FAIL validate:family-a11y: ${problems.length} finding(s) across ${lessons.length} page(s)`,
  );
  const byKind = new Map();
  for (const p of problems) {
    const kind = p
      .replace(/^[^:]+: /, "")
      .replace(/["(].*$/, "")
      .replace(/\d+/g, "N")
      .slice(0, 60);
    byKind.set(kind, (byKind.get(kind) || 0) + 1);
  }
  for (const [k, n] of [...byKind].sort((a, b) => b[1] - a[1]).slice(0, 25))
    console.error(`  ${n} x ${k}`);
  console.error("first findings:");
  for (const p of problems.slice(0, args.verbose ? 200 : 12)) console.error(`  ${p}`);
  process.exit(1);
}
console.log(
  `PASS validate:family-a11y ${lessons.length} page(s) x ${langs.join("+")} x 390+1280, ${measured} states measured in ${secs}s`,
);
