// "Explain it" assignments: a Teach It Back concept or a Misconception Detective case, assigned to a class by its link.
// Rows have the same shape as every other assignable row (id, title, path, band), so the builder, the saved assignment
// and the student's "Assigned practice" list need no special case. The two content banks are loaded only when a teacher
// opens this choice, so they never weigh on the roster panel.
import { BASE, safeJson, storage } from "../util.js";

export const EXPLAIN_ASSIGN = "Explain";
const MAX_ID = 40;

const row = (prefix, item, band, route) => ({
  id: `${prefix}-${item.id}`,
  title: `${prefix === "tb" ? "Teach It Back" : "Detective"}: ${item.title.en}`,
  path: `${BASE}/${route}/${item.id}?grades=${band}`,
  band,
  unit: true,
});

/** Rows a teacher can assign for one grade band: every Teach It Back concept, then every Detective case. */
export async function explainAssignRows(band) {
  if (band !== "3-5" && band !== "6-8") return [];
  const [{ CONCEPTS }, { CASES }] = await Promise.all([
    import("../teachback/concepts.js"),
    import("../claimcheck/cases.js"),
  ]);
  return [
    ...CONCEPTS.filter((c) => c.band === band).map((c) => row("tb", c, band, "teach-back")),
    ...CASES.filter((c) => c.band === band).map((c) => row("cc", c, band, "claim-check")),
  ];
}

// Where the two tools keep their finished work. tools/explain-assign.test.mjs proves these equal the stores' own KEY.
export const TB_KEY = "accessPracticeLab:v1:teach-back";
export const CC_KEY = "accessPracticeLab:v1:claim-check";
export const MAX_ASSIGN_ID = MAX_ID;

/** Has this device finished the assigned concept or case? Reads the stores' own keys; ids that are not ours are never done. */
export function explainDone(id) {
  const rest = String(id).slice(3);
  if (String(id).startsWith("tb-")) return Boolean(safeJson(storage.get(TB_KEY), null)?.explained?.[rest]);
  if (String(id).startsWith("cc-")) return Boolean(safeJson(storage.get(CC_KEY), null)?.done?.[rest]);
  return false;
}
