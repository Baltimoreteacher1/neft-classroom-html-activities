// Single source of truth for the never-collect list (G-44). A data field name that contains any of
// these terms, as whole words, is a finding. Names are split on snake_case, kebab-case, camelCase
// and digits boundaries first, so "incomplete" never matches "income" and "stepsIepFlag" matches
// "iep". Multi-word terms are token sequences.

export const FORBIDDEN_TERMS = Object.freeze([
  ["birthplace"],
  ["birth", "place"],
  ["place", "of", "birth"],
  ["country", "of", "birth"],
  ["birth", "country"],
  ["immigration"],
  ["immigrant"],
  ["immigrated"],
  ["visa"],
  ["asylum"],
  ["citizenship"],
  ["citizen", "status"],
  ["caste"],
  ["income"],
  ["family", "income"],
  ["household", "income"],
  ["free", "lunch"],
  ["reduced", "lunch"],
  ["disability"],
  ["disabilities"],
  ["iep"],
  ["504"],
  ["sped"],
  ["special", "ed"],
  ["special", "education"],
  ["passport"],
  ["ssn"],
  ["social", "security"],
  ["gov", "id"],
  ["government", "id"],
  ["national", "id"],
  ["drivers", "license"],
]);

/** Lower-case word tokens of an identifier. */
export function tokens(name) {
  return String(name)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])([0-9])/g, "$1 $2")
    .replace(/([0-9])([A-Za-z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** The forbidden term (joined with "_") found in `name`, or null. */
export function forbiddenTermIn(name) {
  const t = tokens(name);
  for (const term of FORBIDDEN_TERMS) {
    for (let i = 0; i + term.length <= t.length; i++) {
      if (term.every((word, k) => t[i + k] === word)) return term.join("_");
    }
  }
  return null;
}
