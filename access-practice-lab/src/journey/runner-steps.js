// Journey step runner: which engine parts make up a step, which are finished, and when the step completes.
// Pure data logic over the step record (S.data[<engineKey>].result marks a finished part).
import { commit, dataKey } from "./runner-env.js";

/** Heading for one part inside a step that has more than one (understand: listen, then read). */
export const PART_LABEL = {
  scene: ["Investigate", "Investiga"],
  listen: ["Listen", "Escucha"],
  read: ["Read with the X-ray", "Lee con los rayos X"],
  build: ["Build", "Construye"],
  converse: ["Talk it through", "Conversa"],
  compose: ["Write it", "Escríbelo"],
  mirror: ["Improve your response", "Mejora tu respuesta"],
};

const commPart = (task) => {
  if (!task) return [];
  const kind = task.kind === "converse" ? "converse" : "compose";
  return [{ key: kind, ui: kind, task }];
};

/** The engine UI parts of a step, in order. `task` is what the UI's render(task, env) receives. */
export function stepParts(stepId, pack) {
  if (!pack) return [];
  switch (stepId) {
    case "discover":
      return pack.discover ? [{ key: "scene", ui: "scene", task: pack.discover }] : [];
    case "understand":
      return [
        pack.understand?.listen && { key: "listen", ui: "listen", task: pack.understand.listen },
        pack.understand?.read && { key: "read", ui: "xray", task: pack.understand.read },
      ].filter(Boolean);
    case "build":
      return pack.build ? [{ key: "build", ui: "construct", task: pack.build }] : [];
    case "communicate":
      return commPart(pack.communicate);
    case "improve":
      // The Growth Mirror reads the whole pack (communicate, show and improve tasks), so it is handed the pack.
      return pack.improve ? [{ key: "mirror", ui: "mirror", task: pack }] : [];
    case "show":
      return commPart(pack.show);
    default:
      return [];
  }
}

export const shellOf = (S) => S?.data?.shell || {};
export const runOf = (S) => Number(shellOf(S).run) || 0;
/** `show` is always independent; every other step is independent only when the learner turned "On my own" on. */
export const isIndependent = (stepId, S) => stepId === "show" || shellOf(S).own === true;

export const partResult = (S, part, run) => S?.data?.[dataKey(part, run)]?.result;
export const pendingPart = (S, parts, run) => parts.find((p) => partResult(S, p, run) == null);

/**
 * Engines that call env.done() the moment the learner's last answer is accepted, so the page would jump to the
 * completion panel and the answer's own feedback (the partner's reply, the traced evidence, the built sentence)
 * would never be read. For these the runner keeps the engine on screen until the learner presses
 * "Finish this step". converse, compose and mirror already carry their own finish control.
 */
export const HOLD_PARTS = new Set(["scene", "read", "build"]);
export const isHeld = (S, parts, run) =>
  parts.length > 0 &&
  !pendingPart(S, parts, run) &&
  HOLD_PARTS.has(parts.at(-1).key) &&
  shellOf(S).ackRun !== run;

/** Result of the step's last part for the current run, or the newest earlier run that has one. */
export function latestResult(S, parts, run) {
  const last = parts.at(-1);
  if (!last) return null;
  for (let r = run; r >= 0; r--) {
    const result = partResult(S, last, r);
    if (result != null) return result;
  }
  return null;
}

/** Results of the earlier steps of this mission (`env.prior`). */
export function priorResults(deps, state, band, missionId, stepId, pack) {
  const out = {};
  for (const step of deps.curriculum.STEPS) {
    if (step.id === stepId) break;
    const S = deps.state.getStep(state, band, missionId, step.id);
    const result = latestResult(S, stepParts(step.id, pack), runOf(S));
    if (result != null) out[step.id] = result;
  }
  return out;
}

/**
 * Every part has a result: record the step as done. state.js keeps the better stage on a repeat, counts another
 * attempt, stores `summary` (the last part's result) at S.data.result and clears a matching teacher assignment.
 * The cursor moves to whatever follows the step.
 */
export function settleStep({ deps, band, missionId, stepId, S, parts }) {
  const St = deps.state;
  const independent = isIndependent(stepId, S) && !shellOf(S).helped;
  const summary = latestResult(S, parts, runOf(S));
  return commit(
    deps,
    (s) => St.completeStep(s, band, missionId, stepId, { independent, summary }),
    (s) => St.updateStepData(s, band, missionId, stepId, "shell", { repeating: false }),
    (s) => {
      const next = St.nextCursorAfter(s, band, missionId, stepId);
      return St.setCursor(s, band, next.mission, next.step);
    },
  );
}
