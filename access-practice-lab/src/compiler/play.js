// Experience compiler: scripted play through the REAL simulation runtime (src/sim/runtime.js), used to prove that a
// compiled or edited experience can actually be finished and to tell the instructor which endings a learner can
// reach. Pure (no DOM): a scripted learner opens everything it can, answers the comparison the way the evidence
// reads, then follows one strategy for the decision (which option, how much evidence it cites).
// It is a bounded search (one run per decision option x two citing habits), not an exhaustive one; an ending no
// strategy reaches is reported as "no scripted path found", never as impossible.
import { act, judgePair, newState, outcomeOf, validActions } from "../sim/runtime.js";
import { evidenceOf, taskOf } from "../sim/schema.js";

const MAX_STEPS = 400;
const filler = (n, word) => Array.from({ length: n }, (_, i) => `${word}${i % 7}`).join(" ");

/** The action a scripted learner sends for one valid action, or null to skip it. */
function fill(def, state, a, strategy) {
  if (a.type === "compare") {
    const [x, y] = taskOf(def, a.task).pairs[a.pair];
    const truth = judgePair(def, x, y);
    return {
      ...a,
      relation: truth.relation,
      stronger: truth.stronger,
      reason: "the evidence shows it",
    };
  }
  if (a.type === "decide") {
    if (a.option !== strategy.option) return null;
    const option = taskOf(def, a.task).options.find((o) => o.id === a.option);
    const held = Object.keys(state.evidence);
    const fits = held.filter((id) =>
      (evidenceOf(def, id)?.supports || []).includes(option.explanation),
    );
    const cited =
      strategy.cite === "all"
        ? fits.length
          ? fits
          : held
        : (fits.length ? fits : held).slice(0, 1);
    return { ...a, cited, reason: "this evidence supports it" };
  }
  if (a.type === "submit") {
    const task = taskOf(def, a.task);
    return {
      ...a,
      text: filler((task.minWords || 5) + 3, task.type === "revise" ? "revised" : "word"),
    };
  }
  if (a.type === "help") return null; // a scripted learner works without supports
  return a;
}

/**
 * Play one strategy to the end.
 * @returns {{ state, steps: object[], complete: boolean, outcome: string | null, stuck: string }}
 */
export function playScript(def, strategy = {}) {
  let state = newState(def);
  const steps = [];
  const tried = new Set();
  for (let n = 0; n < MAX_STEPS && !state.complete; n++) {
    const options = validActions(def, state);
    // Everything in this scene first; moving on is the last resort, to the least-visited open scene.
    const here = options.filter(
      (a) =>
        a.type !== "move" &&
        !(a.type === "ask" && state.talk[a.character]?.asked.includes(a.topic)),
    );
    let done = false;
    for (const a of here) {
      const send = fill(def, state, a, strategy);
      if (!send) continue;
      const key = `${state.scene}|${state.step}|${JSON.stringify(send)}`;
      if (tried.has(key)) continue;
      tried.add(key);
      const res = act(def, state, send);
      if (res.error) continue;
      state = res.state;
      steps.push(send);
      done = true;
      break;
    }
    if (done) continue;
    const moves = options.filter((a) => a.type === "move");
    if (!moves.length) break;
    const visits = (id) => state.path.filter((s) => s === id).length;
    const next = [...moves].sort((x, y) => visits(x.scene) - visits(y.scene))[0];
    const key = `move|${state.scene}|${next.scene}|${Object.keys(state.evidence).length}|${Object.keys(state.tasks).length}|${JSON.stringify(state.talk).length}`;
    if (tried.has(key)) break; // walked this door in the same situation before: nothing new can happen
    tried.add(key);
    state = act(def, state, next).state;
    steps.push(next);
  }
  return {
    state,
    steps,
    complete: state.complete,
    outcome: outcomeOf(def, state)?.id || null,
    stuck: state.complete ? "" : state.scene,
  };
}

/** The strategies worth trying for a mission: every decision option, citing all fitting evidence or just one. */
export function strategiesFor(def) {
  const decide = (def.tasks || []).find((t) => t.type === "decide");
  if (!decide) return [{ option: null, cite: "all" }];
  return decide.options.flatMap((o) => [
    { option: o.id, cite: "all" },
    { option: o.id, cite: "one" },
  ]);
}

/**
 * Which endings a scripted learner reaches.
 * @returns {{ completable: boolean, outcomes: { [outcomeId]: { reachable: boolean, strategy?: object, steps?: number } }, runs: object[] }}
 */
export function reachOutcomes(def) {
  const outcomes = Object.fromEntries(
    (def.outcomes || []).map((o) => [o.id, { reachable: false }]),
  );
  const runs = [];
  for (const strategy of strategiesFor(def)) {
    let run;
    try {
      run = playScript(def, strategy);
    } catch (err) {
      run = { complete: false, outcome: null, steps: [], stuck: String(err?.message || err) };
    }
    runs.push({
      strategy,
      complete: run.complete,
      outcome: run.outcome,
      steps: run.steps.length,
      stuck: run.stuck,
    });
    if (run.outcome && outcomes[run.outcome] && !outcomes[run.outcome].reachable)
      outcomes[run.outcome] = { reachable: true, strategy, steps: run.steps.length };
  }
  return { completable: runs.some((r) => r.complete), outcomes, runs };
}
