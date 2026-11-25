// Student-facing text projections shared by the readability and vocab-tier verifiers.
// studentText() from the studio schema is the single flattener for "every student-facing string".
import { studentText } from "../../../../db/seeds/bcpss/v2/schema.mjs";

export const BANDS = ["l1_2", "l3_4", "l5_6"];

// Not student prose: teacher notes, band-specific scaffolds (handled per band), glosses, art cues, ids.
const DROP = new Set([
  "tip",
  "support",
  "materials",
  "watchouts",
  "misconception",
  "es",
  "es_note",
  "cue",
  "family",
  "icon",
  "review",
  "wida",
  "standards",
  "teacher_card",
  "differentiation",
  "by_level",
  "frames",
  "connectors",
  "id",
  "unit_id",
  "kind",
  "domain",
  "grouping",
  "step",
  "source",
  "tone",
  "role",
  "type",
  "status",
  "klu",
  "function",
  "framework",
  "pld_targets",
  "new_or_review",
  "core_lesson_ref",
  "content_objective",
  "language_objective",
  "version",
  "sequence",
  "tier",
  "pos",
  "term",
  "title",
  "family_words",
  "label",
  "note",
]);

// A string repeated across lessons (shared stems, repeated supports) counts once, so repetition cannot dominate the score.
const distinct = (strings) => [...new Set(strings)];

function strip(v) {
  if (Array.isArray(v)) return v.map(strip);
  if (v && typeof v === "object")
    return Object.fromEntries(
      Object.entries(v)
        .filter(([k]) => !DROP.has(k))
        .map(([k, x]) => [k, strip(x)]),
    );
  return v;
}

/** Band-independent student text: questions, passages, missions, definitions, examples, models. */
export function unitStudentText(target) {
  return distinct(studentText(strip({ studio: target.studio, lessons: target.lessons || [] })));
}

/** Band-specific scaffold text: sentence frames, per-activity supports, per-lesson "I can" objectives. */
export function bandText(target, band) {
  const out = [...(target.studio?.frames?.[band] || [])];
  const take = (a) => a?.support?.[band] && out.push(a.support[band]);
  (target.studio?.activities || []).forEach(take);
  for (const l of target.lessons || []) {
    if (l.language_objective?.by_level?.[band]) out.push(l.language_objective.by_level[band]);
    for (const s of l.arc || []) take(s.activity);
    take(l.exit_check);
    take(l.extension);
    (l.newcomer_path || []).forEach(take);
  }
  return distinct(out);
}
