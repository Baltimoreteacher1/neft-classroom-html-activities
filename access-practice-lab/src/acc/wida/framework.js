// Inspectable mapping from a practice task to the WIDA ELD Standards Framework (2020 edition) and onward to the evidence
// the lab records. Nothing here computes a proficiency level: it only says WHICH framework entries a task is practice for,
// whether the combination is one the framework represents explicitly, and what evidence the lab observed.
//
//   Task -> Domain -> Key Language Use -> Academic Context -> Language Expectation family -> Observable evidence
//        -> Feedback -> Revision -> New attempt
//
// Expectation ids come from catalog.js (the framework's published pattern, e.g. ELD-SC.6-8.Explain.Expressive). Item-level
// Language Expectation text is not reproduced and no code is invented. Grades 3-5 span two WIDA clusters (2-3 and 4-5), so a
// 3-5 task maps to both and says so.
import { WIDA_LANGUAGE_EXPECTATIONS, WIDA_SOURCE } from "./catalog.js";

export const CONTEXT_STANDARD = Object.freeze({ Mathematics: "ELD-MA", Science: "ELD-SC", "Social Studies": "ELD-SS", "Language Arts": "ELD-LA", "Social and Instructional": "ELD-SI" });
export const STANDARD_LABEL = Object.freeze({ "ELD-SI": "Social and Instructional Language", "ELD-LA": "Language of Language Arts", "ELD-MA": "Language of Mathematics", "ELD-SC": "Language of Science", "ELD-SS": "Language of Social Studies" });
export const MODE_OF = Object.freeze({ Listening: "Interpretive", Reading: "Interpretive", Speaking: "Expressive", Writing: "Expressive" });
export const GRADE_CLUSTERS = Object.freeze({ "3-5": ["2-3", "4-5"], "6-8": ["6-8"] });

const inCluster = (entry, clusters) => (entry.gradeClusters || [entry.gradeCluster]).some((c) => clusters.includes(c));

/** @returns {{ standard, clusters, mode, ids: string[], explicit: boolean, source: string }} */
export function mapItem({ domain, klu, context }, grade) {
  const standard = CONTEXT_STANDARD[context] || null;
  const clusters = GRADE_CLUSTERS[grade] || [];
  const mode = MODE_OF[domain] || null;
  const matches = WIDA_LANGUAGE_EXPECTATIONS.filter((e) => e.standard === standard && e.keyUse === klu && inCluster(e, clusters) && (e.standard === "ELD-SI" || e.mode === mode));
  return { standard, standardLabel: STANDARD_LABEL[standard] || "", clusters, mode, ids: matches.map((e) => e.id), explicit: matches.length > 0, source: WIDA_SOURCE };
}

/** The nine-link chain for one observed result, as plain facts the teacher can check. */
export function evidenceChain(row, task = {}) {
  const map = mapItem(row, row.grade);
  const supportWord = ["none", "a strategic clue", "language support", "a mentor model"][Math.min(3, row.supportTier || 0)];
  return [
    ["Task", task.stem || row.itemId],
    ["Domain", row.domain],
    ["Key Language Use", row.klu],
    ["Academic context", row.context],
    ["Language Expectation family", map.ids.length ? map.ids.join(", ") : "No explicit framework entry for this combination (supplementary practice)"],
    ["Observable evidence", row.status === "needs-review" ? "Response saved for teacher review (not scored by the lab)" : row.correct ? (row.independent ? "Correct on the first try, no support" : "Correct, with support or revision") : "Not yet correct"],
    ["Feedback", row.mode === "formative" ? `Targeted feedback; support used: ${supportWord}` : "None during a test simulation"],
    ["Revision", row.attempts > 1 ? `${row.attempts - 1} revision${row.attempts > 2 ? "s" : ""}` : "None"],
    ["New attempt", row.attempts > 1 ? "A later attempt was made after feedback" : "No fresh attempt recorded"],
  ];
}

/** Which framework combinations (standard x Key Language Use) a set of items covers, and which are only supplementary. */
export function coverageOf(items, grade) {
  const out = new Map();
  for (const item of items) {
    const m = mapItem(item, grade);
    const key = `${item.domain}|${item.klu}|${item.context}`;
    const cur = out.get(key) || { domain: item.domain, klu: item.klu, context: item.context, items: 0, explicit: m.explicit, ids: m.ids };
    cur.items += 1;
    out.set(key, cur);
  }
  return [...out.values()];
}
