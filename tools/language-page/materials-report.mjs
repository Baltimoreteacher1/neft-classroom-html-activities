// Classification report + substitution plan for every `materials` entry (audit F-16). Pure functions over the 162 unit
// documents (and the lesson documents), shared by tools/build-materials-report.mjs and gate G-44.
import { classifyClassroom, classifyFamily } from "./materials-classifier.mjs";
import {
  MANIPULATIVE_LEFT,
  MATERIAL_SUBSTITUTES,
  PHYSICAL_WORDS,
  PROPOSED_ONLY,
  rewrite,
} from "./materials-substitutions.mjs";

const bump = (map, key, by = 1) => map.set(key, (map.get(key) || 0) + by);

/** Activities whose materials were swapped for paper-based ones (seed field materials_revision, "... was A + B"). */
export function revisedActivities(units) {
  return units.flatMap((d) =>
    d.studio.activities.flatMap((a, index) => {
      const was = /was (.+)$/.exec(a.materials_revision || "")?.[1];
      return was
        ? [
            {
              unit: d.unit.id,
              index,
              title: a.title,
              status: "draft",
              was: was.split(" + "),
              now: a.materials,
            },
          ]
        : [];
    }),
  );
}

/** Every classroom (studio activity) materials entry; `original` restores the entries before the substitutions. */
export function classroomEntries(units, { original = false } = {}) {
  return units.flatMap((d) =>
    d.studio.activities.flatMap((a, index) => {
      const was = original ? /was (.+)$/.exec(a.materials_revision || "")?.[1] : null;
      return (was ? was.split(" + ") : a.materials || []).map((text) => ({
        unit: d.unit.id,
        index,
        text,
      }));
    }),
  );
}

/** Lesson-level entries: teacher card, arc activities and newcomer path of every lesson document. */
export function lessonEntries(lessonDocs) {
  return lessonDocs.flatMap((set) =>
    set.lessons.flatMap((l) =>
      [
        ...(l.teacher_card?.materials || []),
        ...l.arc.flatMap((s) => s.activity.materials || []),
        ...(l.newcomer_path || []).flatMap((a) => a.materials || []),
      ].map((text) => ({ unit: set.unit_id, index: l.id, text })),
    ),
  );
}

export const familyEntries = (units) =>
  units.flatMap((d) =>
    (d.family.try_at_home || []).map((t, index) => ({
      unit: d.unit.id,
      index,
      text: t.materials?.en,
    })),
  );

/** {entries: distinct rows with counts, totals, unclassified} for one scope. */
export function classifyScope(rows, classify) {
  const counts = new Map();
  for (const r of rows) bump(counts, r.text);
  const entries = [...counts]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([text, count]) => ({ text, count, ...classify(text) }));
  const totals = {};
  for (const e of entries) totals[e.class] = (totals[e.class] || 0) + e.count;
  const physical = new Set(
    entries
      .filter((e) => e.class === "physical_object" || e.class === "household_object")
      .map((e) => e.text),
  );
  const rowsWithPhysical = rows.filter((r) => physical.has(r.text));
  return {
    entries,
    totals,
    entryCount: rows.length,
    distinct: entries.length,
    unclassified: entries.filter((e) => e.class === "unclassified").map((e) => e.text),
    activitiesWithPhysical: new Set(rowsWithPhysical.map((r) => `${r.unit}#${r.index}`)).size,
    unitsWithPhysical: new Set(rowsWithPhysical.map((r) => r.unit)).size,
  };
}

/** Which classroom activities can be rewritten safely, and the exact edits. */
export function planSubstitutions(units) {
  const plan = [];
  for (const d of units)
    d.studio.activities.forEach((a, index) => {
      const physical = (a.materials || []).filter(
        (m) => classifyClassroom(m).class === "physical_object",
      );
      if (!physical.length) return;
      if (!physical.every((m) => MATERIAL_SUBSTITUTES[m])) return;
      if (
        PHYSICAL_WORDS.test(JSON.stringify(a.payload)) ||
        PHYSICAL_WORDS.test(`${a.title} ${a.mission}`)
      )
        return;
      const edits = [];
      const materials = (a.materials || []).map((m) => MATERIAL_SUBSTITUTES[m] || m);
      edits.push({ field: "materials", from: a.materials, to: materials });
      const tip = rewrite(a.tip);
      if (tip !== a.tip) edits.push({ field: "tip", from: a.tip, to: tip });
      const support = Object.fromEntries(
        Object.entries(a.support || {}).map(([k, v]) => [k, rewrite(v)]),
      );
      for (const [k, v] of Object.entries(a.support || {}))
        if (support[k] !== v) edits.push({ field: `support.${k}`, from: v, to: support[k] });
      const after = JSON.stringify([materials, tip, support]);
      if (MANIPULATIVE_LEFT.test(after)) return; // a manipulative word survived: leave for a human
      plan.push({ unit: d.unit.id, index, title: a.title, kind: a.kind, status: "draft", edits });
    });
  return plan;
}

/** One proposal row per distinct physical classroom or lesson entry. */
export function proposals(classroom, lesson, revised) {
  const applied = new Set(revised.flatMap((r) => r.was));
  const rows = [];
  for (const [scope, report] of [
    ["classroom", classroom],
    ["lesson", lesson],
  ])
    for (const e of report.entries.filter((x) => x.class === "physical_object")) {
      const auto = MATERIAL_SUBSTITUTES[e.text];
      rows.push({
        scope,
        text: e.text,
        count: e.count,
        has_paper_alternative: e.hasPaperAlternative,
        substitute:
          auto || PROPOSED_ONLY[e.text] || "needs a teacher decision (no substitute proposed)",
        action:
          scope === "classroom" && auto && applied.has(e.text)
            ? "applied-where-safe"
            : "proposal-only",
      });
    }
  return rows;
}

export const classroomReport = (units, opts) =>
  classifyScope(classroomEntries(units, opts), classifyClassroom);
export const familyReport = (units) => classifyScope(familyEntries(units), classifyFamily);
export const lessonReport = (lessonDocs) =>
  classifyScope(lessonEntries(lessonDocs), classifyClassroom);
