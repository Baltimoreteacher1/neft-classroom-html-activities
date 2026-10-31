// Why a type is not generated for some skills. Shown under the coverage table (coverage.js); every "n/a" cell
// in the table falls under one of these reasons. compute, error-analysis and explain are never n/a.
export const NOT_APPLICABLE = {
  "missing-number": "the skill has no relation with a term that can be hidden without making the key ambiguous (counting and recognising, classification, measurement reading, data and picture-first skills).",
  "number-line": "no quantity in the skill sits naturally on a line, or the numbers are too large or too many to mark honestly (categories, shapes, statistics tables, symbolic algebra, large-number arithmetic).",
  "visual-model": "no graphic kind in the registry shows the skill's idea honestly, or the picture would state the answer (symbolic manipulation, procedure-only skills, large-number arithmetic beyond one block picture).",
  "real-world": "the skill is a pure fact or notation skill with no authentic context at its grade (counting words, symbol comparison, basic fact recall).",
  "word-problem": "the skill has no equal-groups or join/separate story structure story-problems.js can wrap, or the numbers exceed what the stories handle.",
  "multi-step": "the skill is a single mathematical idea with no natural second step at its grade, or a second step would be a different skill.",
  equation: "the skill has no situation that is modelled by choosing between equations.",
};
