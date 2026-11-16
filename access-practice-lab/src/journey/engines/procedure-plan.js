import { currentOutcome, setControl } from "./scene.js";

/** Carry out one authored sequence using the existing scene model. */
export function runProcedure(task, planId, scene) {
  const plan = task.procedurePlans?.find((item) => item.id === planId);
  if (!plan || !Array.isArray(plan.steps) || !plan.steps.length) return null;
  const controls = task.controls || [];
  if (!controls.every((control) => control.options.some((option) => option.id === plan.controls?.[control.id]))) return null;
  let next = scene;
  for (const control of controls) next = setControl(next, control.id, plan.controls[control.id], task);
  const outcome = currentOutcome(task, next);
  if (outcome.neutral) return null;
  return { scene: next, steps: plan.steps, result: outcome.state };
}
