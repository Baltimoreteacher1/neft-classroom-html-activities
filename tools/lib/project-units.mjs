/**
 * The single list of folders under math/ that hold culminating-project pages.
 *
 * Every projects-* layer used to build this list for itself, as
 * `Array.from({ length: 10 }, (_, i) => \`unit-${i + 1}\`)`. That is the same
 * failure shape as the hardcoded ["version-a","version-b"] list which made
 * unit-8/version-c invisible to nearly every layer: a project folder that is
 * not a numbered unit simply never gets injected, and the omission is silent.
 *
 * Members:
 *   • pre-unit   — the district's ASSEMBLED Pre-Unit (1-1, 2-6, 2-7, 6-1, 6-2).
 *                  It is not a curriculum unit and never will be numbered, so
 *                  a `length: 10` loop can never reach it.
 *   • unit-1 … unit-10 — the canonical units.
 *   • statistics — canonical Unit 2 (Data Detectives); math/unit-2/projects
 *                  mirrors it byte for byte.
 *
 * Import this. Do not re-derive it.
 */
export const PROJECT_UNITS = Object.freeze([
  "pre-unit",
  ...Array.from({ length: 10 }, (_, i) => `unit-${i + 1}`),
  "statistics",
]);

/** The same list as repo-relative project directories. */
export const PROJECT_DIRS = Object.freeze(PROJECT_UNITS.map((u) => `math/${u}/projects`));

/** Glob patterns covering every culminating-project wizard page. */
export const PROJECT_PAGE_GLOBS = Object.freeze(
  PROJECT_UNITS.map((u) => `math/${u}/projects/version-*/index.html`),
);
