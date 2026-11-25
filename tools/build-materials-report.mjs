#!/usr/bin/env node
// Writes data/language-page/materials-classification.json and materials-proposals.json (audit F-16, decision D3).
// Classifier rules and limits: tools/language-page/materials-classifier.mjs. Plan: tools/language-page/materials-substitutions.mjs.
// To apply the planned classroom edits to the unit seeds: node tools/apply-materials-substitutions.mjs
//   node tools/build-materials-report.mjs
import fs from "node:fs";
import { loadLessons } from "../functions/_lib/bcpss/lessons.js";
import { loadDataset } from "./language-page/dataset.mjs";
import {
  classroomReport,
  familyReport,
  lessonReport,
  planSubstitutions,
  proposals,
  revisedActivities,
} from "./language-page/materials-report.mjs";

const OUT = new URL("../data/language-page/", import.meta.url);
const { units } = await loadDataset();
const lessonDocs = [];
for (const d of units) lessonDocs.push(await loadLessons(d.unit.id));

const classroom = classroomReport(units);
const before = classroomReport(units, { original: true });
const revised = revisedActivities(units);
const lesson = lessonReport(lessonDocs);
const family = familyReport(units);
const plan = planSubstitutions(units);

const summary = (r) => ({
  entries: r.entryCount,
  distinct: r.distinct,
  totals: r.totals,
  activitiesOrTasksWithPhysical: r.activitiesWithPhysical,
  unitsWithPhysical: r.unitsWithPhysical,
});
const write = (name, value) =>
  fs.writeFileSync(new URL(name, OUT), `${JSON.stringify(value, null, 1)}\n`);
write("materials-classification.json", {
  note: "Every materials entry classified by tools/language-page/materials-classifier.mjs. Scope per D3: classroom = studio activities, lesson = lesson documents (teacher card, arc, newcomer path), family = take-home tasks (reported separately; household items may be allowed).",
  status: "draft",
  summary: {
    classroom: summary(classroom),
    classroom_before_substitutions: summary(before),
    lesson: summary(lesson),
    family: summary(family),
  },
  classroom: classroom.entries,
  lesson: lesson.entries,
  family: family.entries,
});
write("materials-proposals.json", {
  note: "Paper-based substitutes (D3 default: classroom activities). `applied` lists the activities rewritten in the unit seeds by tools/apply-materials-substitutions.mjs (each carries materials_revision in the seed); `pending_plan` is what the planner would still rewrite (empty once applied); everything else is a proposal for Joel. All draft.",
  status: "draft",
  proposals: proposals(classroom, lesson, revised),
  applied: revised,
  pending_plan: plan,
});
console.log(
  JSON.stringify(
    {
      classroom: summary(classroom),
      lesson: summary(lesson),
      family: summary(family),
      before: summary(before),
      applied: revised.length,
      pending: plan.length,
    },
    null,
    1,
  ),
);
