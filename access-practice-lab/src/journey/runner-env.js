// Journey step runner: state writes and the `env` handed to every engine UI module (JOURNEY.md, "Engine UI modules").
// Nothing here imports another worker's file: `deps` carries the state, ledger and curriculum modules, so the
// runner can be driven in tests with in-memory fakes.

/**
 * Load the journey state, apply each write in order, save once, and return the new state.
 * state.js writers may mutate and/or return the state; only a returned object that looks like a state
 * (it has `bands`) replaces the working copy, so a writer that returns a step record is harmless.
 */
export function commit(deps, ...writes) {
  let state = deps.state.loadJourney();
  for (const write of writes) {
    const out = write(state);
    if (out && typeof out === "object" && out.bands) state = out;
  }
  deps.state.saveJourney(state);
  return state;
}

/** The step's resumable data is namespaced per run: a repeated step starts blank and the first run stays as evidence. */
export const dataKey = (part, run) => (run > 0 ? `${part.key}@${run}` : part.key);

const DOMAIN_OF = {
  scene: "",
  listen: "Listening",
  read: "Reading",
  build: "",
  converse: "Speaking",
  compose: "Writing",
  mirror: "",
};

/** Writes that record help was opened, for this step and for this run. */
export const helpWrites = (deps, band, missionId, stepId, helpId) => [
  (s) => deps.state.noteHelp(s, band, missionId, stepId, helpId),
  (s) => deps.state.updateStepData(s, band, missionId, stepId, "shell", { helped: true }),
];

/**
 * Build the env for one engine part.
 * `update(patch, { silent: true })` persists without redrawing (typing, drafts); the default redraws.
 */
export function makeEnv({
  ctx,
  deps,
  I,
  band,
  support,
  missionId,
  stepId,
  part,
  run,
  S,
  pack,
  prior,
  independent,
}) {
  const mission = deps.curriculum.MISSIONS[missionId];
  const key = dataKey(part, run);
  return {
    I,
    band,
    support,
    independent,
    missionId,
    step: stepId,
    mission,
    pack,
    task: part.task,
    prior,
    data: S.data?.[key] || {},
    update(patch, opts = {}) {
      commit(deps, (s) => deps.state.updateStepData(s, band, missionId, stepId, key, patch));
      if (!opts.silent) ctx.rerender();
    },
    help(id) {
      commit(deps, ...helpWrites(deps, band, missionId, stepId, id));
    },
    done(result) {
      commit(deps, (s) =>
        deps.state.updateStepData(s, band, missionId, stepId, key, { result: result ?? {} }),
      );
      ctx.rerender();
    },
    ledger(entry = {}) {
      const ledger = deps.ledger.loadLedger();
      deps.ledger.appendEntry(ledger, {
        src: "mission",
        task: `${missionId}.${stepId}`,
        band,
        domain: DOMAIN_OF[part.key] || "",
        use: mission?.klu || "",
        stage: independent ? "independent" : "supported",
        ...entry,
      });
      deps.ledger.saveLedger(ledger);
    },
    announce: deps.announce,
    navigate: ctx.navigate,
  };
}
