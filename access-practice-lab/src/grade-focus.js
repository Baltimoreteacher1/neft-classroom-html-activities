// Grade focus: Grade 6, 7 or 8 inside the single 6-8 band.
//
// The band id, the content folder (content/g6-8/), every progress key and every shared link stay "6-8". An activity
// may carry `grades: ["7", "8"]`, the grades its text and task are written for; an activity with no `grades`
// works for every grade in the band. A learner (or teacher) may choose a focus; it only filters what rooms, the
// library and the home list. It never locks anything: "All grades" is always one tap away, and an activity opened
// from an old link opens whatever its tag says.
//
// Every tag also carries `gradesWhy`, one of the reason codes below. A code decides the grades, so the tag and
// its reason cannot drift apart (tools/validate-access-lab.mjs enforces it; content/CONTENT.md explains each rule).
// Pure data and functions, no DOM: the content tools import it.

/** The one band that has a focus. Other bands ignore it. */
export const FOCUS_BAND = "6-8";

/** Choosable focus values. "" is "All grades". */
export const GRADE_FOCUS = [
  { id: "", label: ["All grades", "Todos los grados"], short: ["All", "Todos"] },
  { id: "6", label: ["Grade 6", "6.º grado"], short: ["6", "6"] },
  { id: "7", label: ["Grade 7", "7.º grado"], short: ["7", "7"] },
  { id: "8", label: ["Grade 8", "8.º grado"], short: ["8", "8"] },
];

/** Reason code -> the grades it assigns. See CONTENT.md, "Grade tags for 6-8". */
export const GRADE_REASONS = {
  "g6-topic": ["6"],
  "g67-load": ["6", "7"],
  "g67-task": ["6", "7"],
  "g78-topic": ["7", "8"],
  "g78-load": ["7", "8"],
  "g78-task": ["7", "8"],
  "g8-stretch": ["8"],
};

const FOCUS_IDS = GRADE_FOCUS.map((f) => f.id);

/** A ?gradeFocus= or saved value as a focus id: "6", "7", "8", or "" for all grades and anything unknown. */
export function normalizeGradeFocus(value) {
  const v = String(value ?? "").trim();
  return FOCUS_IDS.includes(v) && v ? v : "";
}

/** True when the URL or saved value names a focus on purpose (including "all"), so "" can mean "clear it". */
export const namesGradeFocus = (value) =>
  value != null && (normalizeGradeFocus(value) !== "" || /^(all|)$/i.test(String(value).trim()));

/** Does an activity with these tags belong to this focus? Untagged activities belong to every focus. */
export function inGradeFocus(grades, focus) {
  if (!focus) return true;
  if (!Array.isArray(grades) || !grades.length) return true;
  return grades.includes(focus);
}

/** The focus in effect: only the 6-8 band has one. */
export const activeGradeFocus = (prefs, band) =>
  band === FOCUS_BAND ? normalizeGradeFocus(prefs?.gradeFocus) : "";

/** Items kept by the focus; `gradesOf` reads the tags from whatever shape the caller holds. */
export const byGradeFocus = (items, focus, gradesOf = (item) => item.grades) =>
  focus ? items.filter((item) => inGradeFocus(gradesOf(item), focus)) : items;

/** [en, es] label of a focus id. */
export const gradeFocusLabel = (id) =>
  (GRADE_FOCUS.find((f) => f.id === id) || GRADE_FOCUS[0]).label;

/**
 * Counts for content/index.json: how many activities each focus shows, built from the tag lists of a band's
 * activities (one entry per activity: its `grades` array or undefined).
 */
export function gradeFocusCounts(tagLists) {
  const counts = {};
  for (const f of GRADE_FOCUS)
    counts[f.id || "all"] = byGradeFocus(tagLists, f.id, (g) => g).length;
  return counts;
}

/** Problems with one activity's tags, as plain sentences (empty when fine). Used by the content validator. */
export function gradeTagProblems(activity, band) {
  const out = [];
  const { grades, gradesWhy } = activity;
  if (grades === undefined && gradesWhy === undefined) return out;
  if (band !== FOCUS_BAND) return [`grade tags belong to ${FOCUS_BAND} activities only`];
  if (!Array.isArray(grades) || !grades.length || grades.some((g) => !["6", "7", "8"].includes(g)))
    out.push('`grades` must be a non-empty list of "6", "7" or "8"');
  else if (new Set(grades).size !== grades.length || grades.join() !== [...grades].sort().join())
    out.push("`grades` must be sorted with no repeats");
  else if (grades.length === 3) out.push("`grades` lists all three grades: remove the tag instead");
  const expected = GRADE_REASONS[gradesWhy];
  if (!expected) out.push(`\`gradesWhy\` "${gradesWhy}" is not a known reason code`);
  else if (Array.isArray(grades) && grades.join() !== expected.join())
    out.push(`\`grades\` ${JSON.stringify(grades)} does not match reason ${gradesWhy}`);
  return out;
}

/** [en, es] label for an activity's tags ("Grades 7–8"), or null when it suits every grade. */
export function gradesLabel(grades) {
  if (!Array.isArray(grades) || !grades.length) return null;
  const span = grades.length > 1 ? `${grades[0]}–${grades[grades.length - 1]}` : grades[0];
  return grades.length > 1 ? [`Grades ${span}`, `Grados ${span}`] : [`Grade ${span}`, `${span}.º grado`];
}
