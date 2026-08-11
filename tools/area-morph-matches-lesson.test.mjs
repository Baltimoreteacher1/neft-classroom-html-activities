#!/usr/bin/env node
/**
 * The area explorer must show the LESSON'S OWN measurements.
 *
 * Lesson 5-3 teaches a triangular garden with a base of 12 ft and a height of
 * 8 ft. The interactive tool beside it drew the component's built-in 8 × 5
 * default, unitless — a different triangle from the one the paragraph above it
 * describes. It had been that way for every 6.GR.1 lesson at once, because
 * nothing connected the two: `resolveInteractiveToolForLesson` picked the
 * figure but never the dimensions, and `seedVisualFromWorkedExample` handled
 * only the arithmetic tools.
 *
 * A student trusts the picture. One that disagrees with the words is worse
 * than no picture, which is the same reasoning behind validate:learn-figures.
 *
 * This pins BOTH halves of the fix, because either alone silently regresses:
 *   1. The authored explore.diagram carries dimensions that appear in the
 *      lesson's own worked example.
 *   2. seedAreaMorph still reads those dimensions out of the worked example,
 *      for lessons that author no diagram at all.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const AREA_STANDARD = "6.GR.1";

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`  ✗ ${msg}`);
};

/* Load the two pure helpers straight out of the engine source, so this test
   exercises the shipped implementation rather than a copy of it. They sit
   between these two markers and depend on nothing but String/RegExp. */
function loadSeeder() {
  const src = readFileSync(join(ROOT, "engine/components/vocab-learn-panel.js"), "utf8");
  const start = src.indexOf("function unitFromText");
  const end = src.indexOf("function seedVisualFromWorkedExample");
  if (start < 0 || end < 0 || end <= start) {
    throw new Error(
      "Could not find unitFromText…seedVisualFromWorkedExample in vocab-learn-panel.js — " +
        "if those were renamed, update this test rather than deleting it.",
    );
  }
  const body = src.slice(start, end);
  // eslint-disable-next-line no-new-func
  return new Function(`${body}; return { seedAreaMorph, unitFromText };`)();
}

const { seedAreaMorph } = loadSeeder();

const lessons = readdirSync(join(ROOT, "lessons")).filter((d) =>
  existsSync(join(ROOT, "lessons", d, "config.json")),
);

let checked = 0;
const exempt = [];
for (const id of lessons) {
  const cfg = JSON.parse(readFileSync(join(ROOT, "lessons", id, "config.json"), "utf8"));
  if (cfg.standard !== AREA_STANDARD) continue;

  const lines = cfg.launch?.conceptIntro?.iDo?.lines;
  if (!Array.isArray(lines) || !lines.length) continue;
  const text = lines.join(" ");

  const diagram = cfg.explore?.diagram;
  if (!diagram || diagram.kind !== "area-morph") continue;

  // Catch-up lessons are the one shape this test cannot judge. Their "worked
  // example" is a prose summary of two or three lessons' key ideas with no
  // measurements in it, so there is no single problem for the figure to agree
  // with — the diagram is inherited from the lesson being reviewed instead.
  // Exempted by name rather than by "states no numbers", because that looser
  // rule silently swallowed a real 5-5-catchup mismatch.
  if (/-catchup$/.test(id)) {
    exempt.push(id);
    continue;
  }
  checked++;

  // The student-facing words next to the tool — the worked example and the
  // explore instructions both describe the figure they are looking at.
  const stated = `${text} ${cfg.explore?.instructions || ""}`;

  // 1. Every dimension the figure prints must be a number the lesson states.
  for (const key of ["a", "b", "h"]) {
    const v = diagram[key];
    if (v == null) continue;
    const pattern = new RegExp(`(^|[^\\d.])${String(v).replace(".", "\\.")}([^\\d.]|$)`);
    if (!pattern.test(stated)) {
      fail(
        `${id}: explore.diagram ${key} = ${v}, but ${v} never appears in the worked ` +
          `example. The tool would draw a different figure than the lesson describes.`,
      );
    }
  }

  // 2. The seeder must still recover those dimensions unaided.
  const seeded = seedAreaMorph({ kind: "area-morph", figure: diagram.figure }, text);
  for (const key of ["b", "h"]) {
    if (diagram[key] == null) continue;
    if (seeded[key] !== diagram[key]) {
      fail(
        `${id}: seedAreaMorph read ${key} = ${seeded[key] ?? "nothing"} from the worked ` +
          `example but the lesson authors ${key} = ${diagram[key]}. A lesson that ` +
          `authors no diagram would get the wrong figure.`,
      );
    }
  }
}

// A test that silently checks nothing reports a clean repo forever.
if (checked === 0) {
  fail(`No ${AREA_STANDARD} lessons with an area-morph explore diagram were found to check.`);
}

if (failures) {
  console.error(`\narea-morph ↔ lesson: ${failures} problem(s) across ${checked} lesson(s).`);
  process.exit(1);
}
console.log(
  `area-morph ↔ lesson: ${checked} lesson(s) draw the numbers their lesson teaches` +
    (exempt.length ? ` (${exempt.length} catch-up review(s) exempt: ${exempt.join(", ")})` : "") +
    ".",
);
