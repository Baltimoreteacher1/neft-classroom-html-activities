// Family-facing next step derived from the shared deterministic language-task recommender.
// The task ranking can read raw ledger signals; this boundary exposes only the selected task and
// a small, plain-language reason code. Learner text, identifiers and local measures stay private.
import { keyUseForSkill } from "../lang/purpose.js";
import { recommendTasks } from "../lang/adapt.js";

const REASON_ORDER = ["checkin", "dimension", "pattern", "keyUse", "world", "standard", "new"];

export function familyNextStep(rows, entries, band) {
  if (!Array.isArray(entries) || entries.length === 0) return null;
  const tasks = (Array.isArray(rows) ? rows : []).map((row) => ({
    ...row,
    keyUse: keyUseForSkill(row.skill),
  }));
  const choice = recommendTasks(tasks, entries, { n: 1, band })[0];
  if (!choice) return null;
  const reason = REASON_ORDER.find((factor) => choice.factors.some((item) => item.factor === factor));
  if (!reason) return null;
  return {
    task: choice.task,
    reason,
    use: choice.task.keyUse || "",
  };
}
