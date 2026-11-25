#!/usr/bin/env node
// Standards coverage report: which standards each unit lists, which lessons list them, and how many activities that is.
//   node tools/content/standards-coverage.mjs [--out report.md]
// Output is markdown (stdout, or --out). Standards are referenced by code and short name ONLY; no standard text is printed.
// Short names exist only where the repo has a reference list (Grade 6 Math, data/ccss-standards.json). Everywhere else the
// column says "no reference list" and no name is invented. A code a unit lists that no lesson lists is marked untouched.
// Activities: a lesson's activities are its arc steps (they inherit the lesson's standards); studio activities belong to the
// unit and are counted once per core standard of the unit.

import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { EXIT } from "./verifiers/b-common.mjs";
import { loadContext, loadSubjects } from "./verifiers-b.mjs";

const GRADE_ORDER = ["K", "1", "2", "3", "4", "5", "6", "7", "8"];

/** Rows per grade+subject: { code, shortName, units: Set, lessons, lessonActivities, studioActivities, untouchedIn: Set }. */
export function buildCoverage(subjects, refs) {
  const groups = new Map();
  const row = (unit, code) => {
    const key = `${unit.grade}|${unit.subject}`;
    if (!groups.has(key))
      groups.set(key, { grade: unit.grade, subject: unit.subject, rows: new Map() });
    const rows = groups.get(key).rows;
    if (!rows.has(code)) {
      const ref = unit.grade === "6" && unit.subject === "Math" ? refs.resolve(code) : null;
      rows.set(code, {
        code,
        shortName: ref?.shortName ?? null,
        units: new Set(),
        lessons: 0,
        lessonActivities: 0,
        studioActivities: 0,
        untouchedIn: new Set(),
      });
    }
    return rows.get(code);
  };
  for (const s of subjects.filter((x) => x.kind === "unit")) {
    const touched = new Set();
    for (const lesson of s.lessons) {
      for (const code of lesson.standards ?? []) {
        const r = row(s.unit, code);
        r.units.add(s.id);
        r.lessons += 1;
        r.lessonActivities += lesson.arc?.length ?? 0;
        touched.add(code);
      }
    }
    for (const code of s.unit.core_standards ?? []) {
      const r = row(s.unit, code);
      r.units.add(s.id);
      r.studioActivities += s.studio.activities?.length ?? 0;
      if (!touched.has(code)) r.untouchedIn.add(s.id);
    }
  }
  return [...groups.values()].sort(
    (a, b) =>
      GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade) ||
      (a.subject < b.subject ? -1 : 1),
  );
}

export function renderMarkdown(groups) {
  const out = [
    "# Standards coverage (BCPSS Language Studio)",
    "",
    'Codes and short names only; no standard text. "no reference list" means the repo holds no code list for that grade and subject, so no name is shown. Untouched = listed by the unit, listed by none of its lessons.',
    "",
  ];
  for (const g of groups) {
    out.push(
      `## Grade ${g.grade} ${g.subject}`,
      "",
      "| Code | Short name | Units | Lessons | Lesson activities | Studio activities | Untouched in |",
      "| --- | --- | --- | --- | --- | --- | --- |",
    );
    for (const r of [...g.rows.values()].sort((a, b) => (a.code < b.code ? -1 : 1))) {
      const name =
        r.shortName ??
        (g.grade === "6" && g.subject === "Math" ? "(no short name)" : "no reference list");
      out.push(
        `| ${r.code} | ${name} | ${[...r.units].sort().join(", ")} | ${r.lessons} | ${r.lessonActivities} | ${r.studioActivities} | ${[...r.untouchedIn].sort().join(", ") || "-"} |`,
      );
    }
    out.push("");
  }
  return `${out.join("\n")}\n`;
}

async function main(argv) {
  const outIdx = argv.indexOf("--out");
  const md = renderMarkdown(buildCoverage(await loadSubjects(), loadContext().standardsRefs));
  if (outIdx >= 0) writeFileSync(argv[outIdx + 1], md);
  else process.stdout.write(md);
  return EXIT.OK;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then(
    (c) => process.exit(c),
    (e) => {
      console.error(`ERROR ${e?.stack ?? e}`);
      process.exit(EXIT.ERROR);
    },
  );
}
