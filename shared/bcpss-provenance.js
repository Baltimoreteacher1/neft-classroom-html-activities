// Provenance of a unit's content, derived from its lesson set. Imported by the server (unit detail,
// exports) and the browser (Studio badge) so the wording cannot drift. Nothing here ever marks content
// "reviewed": that state comes only from lessons[].review set by a person.

// Short form for page footers (print and Word); the full notice appears once in the document.
export const DRAFT_FOOTER = "Draft: not yet reviewed";
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

// ── Badges ────────────────────────────────────────────────────────────────────────────────────
// One vocabulary for every card, kit and export. "Reviewed" appears only when a state says so: the static
// state below comes from lessons[].review (set by a person), the live state from the review API (Wave 2),
// whose only writer is a named human decision. Nothing in this file ever produces "reviewed" on its own.
export const BADGE_TEXT = Object.freeze({
  draft: "Draft: not yet reviewed",
  authored: "Authored: review pending",
  in_review: "In review",
  reviewed: "Reviewed",
  retired: "Retired",
});
export const BADGE_TIP = Object.freeze({
  draft: "Generated from the unit's standards. No person has reviewed it yet.",
  authored: "Written for this unit. No person has reviewed it yet.",
  in_review: "A named reviewer has started a review, or the content changed after it was approved.",
  reviewed: "A named reviewer approved every required check on the current content.",
  retired: "Retired from use.",
});

/** Static state of one lesson from its own fields: "draft" | "authored" | "reviewed". */
export function lessonProvenance(lesson) {
  const reviewed = REVIEW_FIELDS.every((f) => lesson?.review?.[f] === "reviewed");
  if (reviewed) return "reviewed";
  return lesson?.source === "draft_standards_based" ? "draft" : "authored";
}

/**
 * The state to show. `live` is the review API's badge ("draft" | "in_review" | "reviewed" | "retired") or
 * null when it could not be loaded. An unknown live state never downgrades what is known statically, and a
 * live "draft" keeps the more specific static "draft" / "authored" wording. A static "reviewed" with a live
 * state that disagrees is not shown as reviewed: the log, not the seed, is the record of a review.
 */
export function effectiveBadge(staticState, live) {
  if (!live || !BADGE_TEXT[live]) return staticState;
  if (live === "draft") return staticState === "reviewed" ? "draft" : staticState;
  return live;
}

/**
 * Chip markup (constants only, so nothing to escape). `staticState` is what the content says about itself (kept
 * on the chip so the live overlay can recompute); `blockId` marks a lesson chip the overlay can update.
 */
export function provenanceChipHtml(
  state,
  { blockId = "", scope = "unit", staticState = state } = {},
) {
  const shown = BADGE_TEXT[state] ? state : "draft";
  const base = BADGE_TEXT[staticState] ? staticState : "draft";
  const block = blockId ? ` data-prov-block="${blockId.replace(/[^a-z0-9:-]/gi, "")}"` : "";
  return `<span class="prov-chip" data-provenance="${shown}" data-prov-scope="${scope}"${block} data-prov-static="${base}" title="${BADGE_TIP[shown]}">${BADGE_TEXT[shown]}</span>`;
}
