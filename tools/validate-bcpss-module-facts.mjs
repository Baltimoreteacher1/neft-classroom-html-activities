// validate-bcpss-module-facts — the district Wit & Wisdom module facts shown in the Language Studio are whole, in order
// and honest about what they are.
//
// Reads data/ela-modules.json (tools/extract-ela-modules.mjs) and db/seeds/bcpss/v2/module-facts/<unit>.mjs
// (tools/build-bcpss-module-facts.mjs) and fails when:
//   - the generated unit files are stale (the builder's --check),
//   - an ELA unit 1-3 has no module file, or any other unit has one (Module 4 is not in the district files),
//   - a module has no introduction or end-of-module task, or its dates are not school-year dates in order,
//     or Modules 1-3 of a grade overlap or run out of order,
//   - weeks are not numbered ascending, a dated week falls outside its module, or two weeks overlap,
//   - a lesson companion has no suggested week, the weeks go backwards as the lessons advance, a lesson lands in a
//     Module 0 (Start Strong) week, or "terms" evidence names a word the lesson does not teach / the week does not use,
//   - a source repair is listed without a reason (nothing is fixed silently).
// A sweep that covered fewer modules or lessons than data/sweep-floors.json pins also fails.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import * as seed from "../data/bcpss-curriculum-seed.mjs";
import { loadLessons } from "../functions/_lib/bcpss/lessons.js";
import { loadModuleFacts } from "../functions/_lib/bcpss/module-facts.js";
import { stem } from "./lib/bcpss-activity-lessons.mjs";
import { assertSweptEnough } from "./lib/sweep-guard.mjs";

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];
const bad = (id, msg) => problems.push(`${id}: ${msg}`);

try {
  execFileSync(
    process.execPath,
    [path.join(repo, "tools/build-bcpss-module-facts.mjs"), "--check"],
    {
      stdio: "pipe",
    },
  );
} catch (err) {
  bad(
    "generated files",
    String(err.stderr || err.message)
      .trim()
      .split("\n")[0],
  );
}

const data = JSON.parse(readFileSync(path.join(repo, "data/ela-modules.json"), "utf8"));
const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8"];
const addDays = (iso, n) =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const stems = (text) =>
  String(text)
    .toLowerCase()
    .split(/[^a-z']+/)
    .map(stem)
    .filter((w) => w.length > 2);

// The data file: every grade has Modules 1-3, school-year dates, in order and apart.
for (const g of GRADES) {
  let prevEnd = "";
  for (const m of [1, 2, 3]) {
    const id = `grade ${g} module ${m}`;
    const mod = data.modules.find((x) => x.grade === g && x.module === m);
    if (!mod) {
      bad(id, "missing from data/ela-modules.json");
      continue;
    }
    if (!mod.introduction || mod.introduction.length < 40)
      bad(id, "introduction missing or too short");
    if (!mod.endOfModuleTask || mod.endOfModuleTask.length < 40)
      bad(id, "end-of-module task missing or too short");
    if (!mod.dates || mod.dates.start >= mod.dates.end)
      bad(id, `dates not in order (${JSON.stringify(mod.dates)})`);
    else {
      if (mod.dates.start < "2025-08-01" || mod.dates.end > "2026-07-01")
        bad(id, "dates outside school year 2025-26");
      if (prevEnd && mod.dates.start <= prevEnd)
        bad(id, `starts ${mod.dates.start}, before the previous module ends ${prevEnd}`);
      prevEnd = mod.dates.end;
    }
    let lastN = 0;
    let lastEnd = "";
    for (const w of mod.weeks) {
      if (w.n <= lastN) bad(id, `week ${w.n} is not after week ${lastN}`);
      lastN = w.n;
      if (w.start) {
        // The guides' last week can run past the printed module end (6 of 27 do: "March 2-6" under a March 4 end), so a
        // week may start up to a week after the module ends; it may never start before the module does.
        if (w.start < mod.dates.start || w.start > addDays(mod.dates.end, 7))
          bad(id, `week ${w.n} ${w.label} falls outside the module dates`);
        if (w.start > w.end) bad(id, `week ${w.n} runs backwards (${w.start} to ${w.end})`);
        if (lastEnd && w.start <= lastEnd) bad(id, `week ${w.n} overlaps the week before it`);
        lastEnd = w.end;
      }
    }
    for (const r of mod.repairs)
      if (!r.why || r.why.length < 20) bad(id, "a source repair has no reason");
  }
}

let modules = 0;
let lessonsPlaced = 0;
let termPlacements = 0;
for (const unit of seed.BCPSS_UNITS) {
  const facts = await loadModuleFacts(unit.id);
  const expected = unit.subject === "ELA" && unit.unit_number <= 3;
  if (!expected) {
    if (facts) bad(unit.id, "has module facts but is not an ELA unit 1-3");
    continue;
  }
  if (!facts) {
    bad(unit.id, "no module-facts file");
    continue;
  }
  modules++;
  const mod = data.modules.find((x) => x.grade === unit.grade && x.module === unit.unit_number);
  if (facts.module !== unit.unit_number) bad(unit.id, `module number ${facts.module}`);
  if (facts.introduction !== mod.introduction || facts.end_of_module_task !== mod.endOfModuleTask)
    bad(unit.id, "introduction or end-of-module task differs from data/ela-modules.json");
  if (facts.essential_question && !facts.essential_question.endsWith("?"))
    bad(unit.id, "essential question is not a question");
  const zero = new Set(facts.module_zero_weeks);
  const set = await loadLessons(unit.id);
  const weekNums = new Set(facts.weeks.map((w) => w.n));
  const bySeq = [...facts.lesson_weeks].sort((a, b) => a.sequence - b.sequence);
  for (const lesson of set.lessons) {
    const row = facts.lesson_weeks.find((l) => l.id === lesson.id);
    if (!row) {
      bad(unit.id, `lesson ${lesson.id} has no suggested week`);
      continue;
    }
    lessonsPlaced++;
    if (row.sequence !== lesson.sequence)
      bad(unit.id, `lesson ${lesson.id} sequence ${row.sequence} differs from ${lesson.sequence}`);
    if (!weekNums.has(row.week))
      bad(
        unit.id,
        `lesson ${lesson.id} is placed in week ${row.week}, which the guide does not have`,
      );
    if (zero.has(row.week))
      bad(unit.id, `lesson ${lesson.id} is placed in Start Strong week ${row.week}`);
    if (!["terms", "order"].includes(row.how))
      bad(unit.id, `lesson ${lesson.id} has reason "${row.how}"`);
    if ((row.how === "terms") !== Boolean(row.terms?.length))
      bad(unit.id, `lesson ${lesson.id}: reason and evidence disagree`);
    if (row.how === "terms") {
      termPlacements++;
      const week = mod.weeks.find((w) => w.n === row.week);
      const used = new Set(stems(week.terms));
      for (const t of row.terms) {
        if (!lesson.vocab.some((v) => v.term === t))
          bad(unit.id, `lesson ${lesson.id} cites "${t}", which it does not teach`);
        if (!stems(t).every((s) => used.has(s)))
          bad(unit.id, `lesson ${lesson.id} cites "${t}", which week ${row.week} does not use`);
      }
    }
  }
  for (let i = 1; i < bySeq.length; i++)
    if (bySeq[i].week < bySeq[i - 1].week)
      bad(
        unit.id,
        `lesson ${bySeq[i].sequence} is in an earlier week than lesson ${bySeq[i - 1].sequence}`,
      );
  if (facts.lesson_weeks.length !== set.lessons.length)
    bad(unit.id, "placement count differs from the lesson count");
}
if (termPlacements < 0.25 * lessonsPlaced)
  bad("coverage", `only ${termPlacements} of ${lessonsPlaced} lessons are placed by their words`);

assertSweptEnough(
  "validate:bcpss-module-facts",
  lessonsPlaced,
  "lessons come from loadLessons for the 27 ELA unit 1-3 files",
);

if (problems.length) {
  console.error(`FAIL validate:bcpss-module-facts — ${problems.length} problem(s):`);
  for (const p of problems.slice(0, 30)) console.error(`  ${p}`);
  if (problems.length > 30) console.error(`  … and ${problems.length - 30} more`);
  process.exit(1);
}
console.log(
  `PASS validate:bcpss-module-facts — ${modules} modules, ${lessonsPlaced} lessons placed (${termPlacements} by their words)`,
);
