import { currentOutcome, init, setControl } from "./scene.js";

/** Compare two authored settings that change exactly one variable. */
export function compareCause(task, caseId, prediction, scene) {
  const trial = task.causalComparisons?.find((item) => item.id === caseId);
  if (!trial || !task.outcomes.some((outcome) => outcome.key === prediction)) return null;
  const ids = task.controls.map((control) => control.id);
  const valid = (values) => ids.every((id) => task.controls.find((control) => control.id === id).options.some((option) => option.id === values[id]));
  if (!valid(trial.before) || !valid(trial.after) || ids.filter((id) => trial.before[id] !== trial.after[id]).length !== 1) return null;
  const before = currentOutcome(task, { ...init(task), controls: trial.before });
  const after = currentOutcome(task, { ...init(task), controls: trial.after });
  if (before.neutral || after.neutral) return null;
  let next = scene;
  for (const id of ids) next = setControl(next, id, trial.before[id], task);
  for (const id of ids) next = setControl(next, id, trial.after[id], task);
  return { before: before.state, after: after.state, held: trial.held, matched: prediction === after.key, scene: next };
}
