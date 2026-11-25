// Provenance of a unit's content, derived from its lesson set. Imported by the server (unit detail,
// exports) and the browser (Studio badge) so the wording cannot drift. Nothing here ever marks content
// "reviewed": that state comes only from lessons[].review set by a person.

export const DRAFT_NOTICE = "Draft: not yet reviewed by a teacher or language specialist.";

const REVIEW_FIELDS = ["pedagogy", "language_qa"];

function reviewState(lessons, field) {
  const states = new Set(lessons.map((l) => l.review?.[field] || "pending"));
  if (states.size === 1) return [...states][0];
  return "partial";
}

/** { state: "draft" | "authored" | "reviewed", source, pedagogy, language_qa, label, notice } */
export function provenanceOf(set) {
  const lessons = Array.isArray(set?.lessons) ? set.lessons : [];
  const source = set?.source || "unknown";
  const review = Object.fromEntries(REVIEW_FIELDS.map((f) => [f, reviewState(lessons, f)]));
  const reviewed = lessons.length > 0 && REVIEW_FIELDS.every((f) => review[f] === "reviewed");
  const drafted = source === "draft_standards_based";
  const state = reviewed ? "reviewed" : drafted ? "draft" : "authored";
  const label = {
    draft: "Draft: generated from the unit's standards, not yet reviewed",
    authored: "Authored lessons: review pending",
    reviewed: "Reviewed",
  }[state];
  return { state, source, ...review, label, notice: reviewed ? null : DRAFT_NOTICE };
}
