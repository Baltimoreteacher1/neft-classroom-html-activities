// ── Shared MSTAR item contract ───────────────────────────────────────────────
// Single source of truth for the authored `mstarPractice` item shapes and the
// honesty framing, used by BOTH MSTAR generators:
//   scripts/generate-mstar-practice.mjs   (unit tests, Form A/B + hub)
//   scripts/generate-mstar-worksheets.mjs (per-lesson printable worksheets)
// Extracted so a change to the item contract or the disclaimer lands once.

// The factual frame is kept conservative on purpose: MSDE has announced MSTAR
// (Maryland System of Testing Academic Readiness, grades 3-8 from 2026-27,
// three 40-minute math sessions, ~25% shorter than MCAP) but has not published
// final blueprints, so the pages state the announced shape and claim no more.
export const HONESTY =
  "These are MSTAR-style questions written for this curriculum to rehearse the format. They are not official Maryland assessment items. MSTAR — Maryland's new state test, first given in spring 2027 — uses the same kinds of questions you see here: selected response, select-all, two-part evidence questions, and written responses.";

export function itemProblems(item, where) {
  // Preflight: an item missing the fields its type promises would render a
  // broken question with no error. Fail the whole run loudly instead.
  const bad = (msg) => `${where}: ${msg}`;
  if (item.type === "ebsr") {
    for (const [part, p] of [
      ["partA", item.partA],
      ["partB", item.partB],
    ]) {
      if (!p) return bad(`ebsr missing ${part}`);
      if (!p.stem || !Array.isArray(p.choices) || p.choices.length < 2)
        return bad(`ebsr ${part} missing stem/choices`);
      if (
        !Number.isInteger(p.correctIndex) ||
        p.correctIndex < 0 ||
        p.correctIndex >= p.choices.length
      )
        return bad(`ebsr ${part} correctIndex out of range`);
    }
    return null;
  }
  if (item.type === "multi-select") {
    if (!item.stem || !Array.isArray(item.options) || item.options.length < 2)
      return bad("multi-select missing stem/options");
    if (!Array.isArray(item.correctIndices) || !item.correctIndices.length)
      return bad("multi-select missing correctIndices");
    if (item.correctIndices.some((i) => !Number.isInteger(i) || i < 0 || i >= item.options.length))
      return bad("multi-select correctIndices out of range");
    return null;
  }
  if (item.type === "error-analysis") {
    if (!item.scenario || !item.prompt) return bad("error-analysis missing scenario/prompt");
    if (!item.rubric || !item.correctAnswer)
      return bad("error-analysis missing rubric/correctAnswer");
    return null;
  }
  return bad(`unknown item type "${item.type}"`);
}

/** The authored MSTAR items for one lesson config, or null if none. */
export function lessonMstarItems(config) {
  const items = config?.reflect?.mstarPractice || config?.mstarPractice;
  return Array.isArray(items) && items.length ? items : null;
}
