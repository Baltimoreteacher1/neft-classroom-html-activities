#!/usr/bin/env node
// Standards coverage report: for each grade, which CCSS-M standards the Language Studio's Math units list ("in the
// Studio") and which they do not ("not in the Studio"). Grade 6 first, then K-8. Writes data/bcpss-standards-coverage.json.
//   node tools/content/standards-coverage-report.mjs            write the report
//   node tools/content/standards-coverage-report.mjs --check    fail if the committed file is stale
//
// Sources: the denominator is math/fluency-lab/content/ccss-k8.json (229 standard-level CCSS-M codes, K-8; paraphrased
// text, not reproduced here). The numerator is core_standards on each Math unit in data/bcpss-curriculum-seed.mjs. "In"
// means a unit LISTS the code, nothing about depth or mastery. ELA, Science and Social Studies are not covered: the repo
// holds no code list for them, so none is invented. Grade 6 also carries the 2025 Maryland (MCCRS) code from the
// MSDE crosswalk in data/standards-crosswalk-2025.json where it has an entry (the Studio itself still lists CCSS codes).
// Draft: the unit-to-standard assignments are generated seed data that no person has reviewed.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const REPORT_PATH = path.join(ROOT, "data/bcpss-standards-coverage.json");
export const GRADE_ORDER = ["6", "K", "1", "2", "3", "4", "5", "7", "8"];
const readJson = (rel) => JSON.parse(readFileSync(path.join(ROOT, rel), "utf8"));
const gradeKey = (g) => (Number(g) === 0 ? "K" : String(g));
const byCode = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** Pure. `units` are seed units, `reference` is ccss-k8.json, `crosswalk` is standards-crosswalk-2025.json. */
export function buildReport({ units, reference, crosswalk }) {
  const mccrs = new Map(crosswalk.entries.map((e) => [e.oldId, e.newId]));
  const refByGrade = new Map();
  for (const s of reference.standards) {
    const g = gradeKey(s.grade);
    if (!refByGrade.has(g)) refByGrade.set(g, []);
    refByGrade.get(g).push(s.code);
  }
  const grades = GRADE_ORDER.map((grade) => {
    const refs = (refByGrade.get(grade) ?? []).slice().sort(byCode);
    const unitsByCode = new Map();
    for (const u of units.filter((x) => x.subject === "Math" && gradeKey(x.grade) === grade))
      for (const code of u.core_standards ?? []) {
        if (!unitsByCode.has(code)) unitsByCode.set(code, []);
        unitsByCode.get(code).push(u.id);
      }
    const inStudio = refs.filter((c) => unitsByCode.has(c));
    const out = refs.filter((c) => !unitsByCode.has(c));
    const row = (code) => ({
      code,
      ...(grade === "6" ? { mccrs2025: mccrs.get(code) ?? null } : {}),
      units: (unitsByCode.get(code) ?? []).slice().sort(),
    });
    return {
      grade,
      reference_count: refs.length,
      in_studio_count: inStudio.length,
      not_in_studio_count: out.length,
      in_studio: inStudio.map(row),
      not_in_studio: out.map(row),
      listed_not_in_reference: [...unitsByCode.keys()]
        .filter((c) => !refs.includes(c))
        .sort(byCode),
    };
  });
  return {
    schema: "ewl-standards-coverage/1",
    status: "draft",
    generated_by: "tools/content/standards-coverage-report.mjs",
    scope:
      "Math, grades K-8. ELA, Science and Social Studies are not covered: the repo holds no code list for them.",
    meaning:
      "In the Studio = at least one unit lists the code in core_standards. It says nothing about depth, lesson coverage or mastery.",
    sources: {
      reference: "math/fluency-lab/content/ccss-k8.json (CCSS-M 2010 code structure)",
      studio: "data/bcpss-curriculum-seed.mjs core_standards",
      mccrs2025: "data/standards-crosswalk-2025.json (Grade 6 only)",
    },
    grades,
  };
}

export async function buildFromRepo() {
  const { BCPSS_UNITS } = await import(
    pathToFileURL(path.join(ROOT, "data/bcpss-curriculum-seed.mjs")).href
  );
  return buildReport({
    units: BCPSS_UNITS,
    reference: readJson("math/fluency-lab/content/ccss-k8.json"),
    crosswalk: readJson("data/standards-crosswalk-2025.json"),
  });
}

const text = (report) => `${JSON.stringify(report, null, 2)}\n`;

async function main(argv) {
  const report = await buildFromRepo();
  if (argv.includes("--check")) {
    let onDisk = "";
    try {
      onDisk = readFileSync(REPORT_PATH, "utf8");
    } catch {
      /* missing counts as stale */
    }
    if (onDisk !== text(report)) {
      console.error(
        "FAIL data/bcpss-standards-coverage.json is stale: run node tools/content/standards-coverage-report.mjs",
      );
      return 1;
    }
    console.log("OK data/bcpss-standards-coverage.json is current");
    return 0;
  }
  writeFileSync(REPORT_PATH, text(report));
  for (const g of report.grades)
    console.log(
      `Grade ${g.grade}: ${g.in_studio_count} of ${g.reference_count} in the Studio, ${g.not_in_studio_count} not`,
    );
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main(process.argv.slice(2)).then((c) => process.exit(c));
