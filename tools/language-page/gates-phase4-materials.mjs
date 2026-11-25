// G-44 materials-classification (F-16, D3): every materials entry is classified by a documented classifier,
// the committed classification is reproducible from the live data, and rewritten activities hold no physical entry.
import fs from "node:fs";
import { loadLessons } from "../../functions/_lib/bcpss/lessons.js";
import { clone } from "./dataset.mjs";
import { classifyClassroom, classifyFamily, KNOWN_ANSWERS } from "./materials-classifier.mjs";
import {
  classifyScope,
  classroomEntries,
  classroomReport,
  familyReport,
  lessonReport,
  planSubstitutions,
  revisedActivities,
} from "./materials-report.mjs";

const COMMITTED = new URL(
  "../../data/language-page/materials-classification.json",
  import.meta.url,
);

/** Pure check. `classify` is injectable so a control can run a broken classifier through the same code. */
export function checkMaterials({ units, lessonDocs, committed, classify = classifyClassroom }) {
  const errors = [];
  for (const [text, want] of KNOWN_ANSWERS) {
    const got = classify(text).class;
    if (got !== want) errors.push(`known answer "${text}": ${got}, expected ${want}`);
  }
  const classroom = classifyScope(classroomEntries(units), classify);
  const lesson = lessonReport(lessonDocs);
  const family = familyReport(units);
  for (const [scope, r] of [
    ["classroom", classroom],
    ["lesson", lesson],
  ])
    for (const t of r.unclassified) errors.push(`${scope}: unclassified material "${t}"`);
  const fresh = JSON.stringify({
    classroom: classroomReport(units).entries,
    lesson: lesson.entries,
    family: family.entries,
  });
  const stored = JSON.stringify({
    classroom: committed.classroom,
    lesson: committed.lesson,
    family: committed.family,
  });
  if (fresh !== stored)
    errors.push("materials-classification.json is stale: node tools/build-materials-report.mjs");
  for (const r of revisedActivities(units)) {
    if (
      !/^draft:/.test(
        units.find((d) => d.unit.id === r.unit).studio.activities[r.index].materials_revision,
      )
    )
      errors.push(`${r.unit}#${r.index}: materials_revision is not labelled draft`);
    for (const m of r.now)
      if (classify(m).class === "physical_object")
        errors.push(`${r.unit}#${r.index} "${r.title}": rewritten activity still lists "${m}"`);
  }
  const pending = planSubstitutions(units);
  if (pending.length)
    errors.push(
      `${pending.length} safe substitutions not applied: node tools/apply-materials-substitutions.mjs`,
    );
  return { errors, classroom, lesson, family };
}

export const g44 = {
  id: "G-44",
  name: "materials-classification",
  async run({ data }) {
    const lessonDocs = [];
    for (const d of data.units) lessonDocs.push(await loadLessons(d.unit.id));
    const committed = JSON.parse(fs.readFileSync(COMMITTED, "utf8"));
    const { errors, classroom, lesson, family } = checkMaterials({
      units: data.units,
      lessonDocs,
      committed,
    });
    const before = committed.summary.classroom_before_substitutions;
    if (before.totals.physical_object < 0.9 * 94)
      errors.push(
        `before-substitution physical entries ${before.totals.physical_object} (baseline 94, floor 90%)`,
      );
    if (classroom.entryCount < 0.9 * 676)
      errors.push(`only ${classroom.entryCount} classroom entries (baseline 676)`);
    return {
      errors,
      info: {
        classroom: classroom.totals,
        lesson: lesson.totals,
        family: family.totals,
        classroomPhysicalBefore: before.totals.physical_object,
      },
    };
  },
  async controls({ data }) {
    const lessonDocs = [];
    for (const d of data.units) lessonDocs.push(await loadLessons(d.unit.id));
    const committed = JSON.parse(fs.readFileSync(COMMITTED, "utf8"));
    const base = { units: data.units, lessonDocs, committed };
    // Each control must trip its OWN check: only errors matching `want` count, so an unrelated failure proves nothing.
    const only = (input, want) => checkMaterials(input).errors.filter((e) => want.test(e));
    const withCube = clone(data.units);
    const revised = withCube.flatMap((d) => d.studio.activities).find((x) => x.materials_revision);
    revised.materials = ["Cubes"];
    const unknown = clone(data.units);
    unknown[0].studio.activities[0].materials = [
      ...(unknown[0].studio.activities[0].materials || []),
      "Zorblax resonator",
    ];
    const staleFile = clone(committed);
    staleFile.classroom[0].class =
      staleFile.classroom[0].class === "paper_pencil" ? "physical_object" : "paper_pencil";
    const paperEverything = (text) => ({ ...classifyClassroom(text), class: "paper_pencil" });
    return [
      {
        name: "rewritten activity still lists Cubes",
        errors: only({ ...base, units: withCube }, /still lists/),
      },
      {
        name: "a material no rule covers",
        errors: only({ ...base, units: unknown }, /unclassified material/),
      },
      {
        name: "committed classification edited by hand",
        errors: only({ ...base, committed: staleFile }, /stale/),
      },
      {
        name: "classifier that calls everything paper",
        errors: only({ ...base, classify: paperEverything }, /known answer/),
      },
    ];
  },
};
