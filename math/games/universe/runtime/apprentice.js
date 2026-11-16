// Mathematical Apprentice — the companion's learning model. No DOM.
//
// The apprentice holds explicitly modelled misconceptions. It does not learn
// because a student told it an answer, and no language model decides anything
// here. Each concept lists the DISTINCTIONS a learner has to see (for
// "an exponent is repeated multiplication": that the base repeats, that the
// exponent counts the factors, that 2^3 and 3^2 differ). A demonstration the
// student performs in the game (building a model, showing a counterexample,
// changing a simulation, replaying a correct operation, comparing two
// strategies, a short justification, guiding the apprentice through a task) is
// validated by the game's own deterministic mathematics and then credited to
// the distinctions it actually shows.
//
// On a held-out transfer task the apprentice uses the correct rule only for
// distinctions it has evidence for; on any other it falls back to its
// misconception and gets the task visibly wrong, and the model names the
// distinction that is still missing. That is the whole learning rule, and it is
// testable.

/**
 * @typedef {Object} Distinction
 * @property {string} id
 * @property {{en: string, es: string}} label   named when it is still missing
 *
 * @typedef {Object} ConceptDef
 * @property {string} id
 * @property {string[]} lessons
 * @property {string} misconceptionTag           tag from the site's misconception vocabulary
 * @property {{en: string, es: string}} misconception   the incorrect conception, in the apprentice's words
 * @property {{en: string, es: string}} knowledge       the mathematics it has to come to hold
 * @property {Distinction[]} distinctions
 * @property {string[]} accepts                  demonstration kinds that can count
 * @property {number} [needKinds]                distinct kinds required before transfer (default 1)
 * @property {{en: string, es: string}} ability  cooperative ability unlocked when learned
 *
 * @typedef {Object} Demonstration
 * @property {string} kind      one of DEMO_KINDS
 * @property {boolean} valid    the game's deterministic check of the mathematics shown
 * @property {string[]} shows   distinction ids this demonstration makes visible
 * @property {string} [signature] identity of the example used (so transfer can avoid it)
 */

export const DEMO_KINDS = [
  "model", // constructed a valid mathematical model
  "counterexample", // showed a case the misconception gets wrong
  "simulation", // changed the simulation and let it run
  "replay", // replayed a correct operation
  "compare", // set two strategies side by side
  "explain", // wrote or recorded a justification (rubric-scored, never auto-mastery)
  "guide", // walked the apprentice through a new task
];

/** Telling the answer is recorded and never counts as evidence. */
export const TELL = "tell";

export const STATUS = {
  HOLDS: "holds",
  CHALLENGED: "challenged",
  READY: "ready",
  LEARNED: "learned",
};

export function newCompanionState() {
  return { v: 1, concepts: {}, abilities: [], mood: "curious" };
}

function conceptState(state, id) {
  if (!state.concepts[id])
    state.concepts[id] = {
      status: STATUS.HOLDS,
      covered: [],
      kinds: [],
      seen: [],
      tells: 0,
      transfers: 0,
      transferFails: 0,
    };
  return state.concepts[id];
}

export class Apprentice {
  /** @param {ConceptDef[]} concepts @param {ReturnType<typeof newCompanionState>} [state] */
  constructor(concepts, state) {
    this.defs = new Map(concepts.map((c) => [c.id, c]));
    this.state = state || newCompanionState();
  }

  def(id) {
    const d = this.defs.get(id);
    if (!d) throw new Error(`Apprentice: unknown concept "${id}"`);
    return d;
  }

  status(id) {
    return conceptState(this.state, id).status;
  }

  /** Distinctions the apprentice still has no evidence for. */
  missing(id) {
    const cs = conceptState(this.state, id);
    return this.def(id).distinctions.filter((d) => !cs.covered.includes(d.id));
  }

  /**
   * The student did something. Credit it only if it is an accepted kind, the
   * mathematics was valid, and it shows a distinction of this concept.
   * @param {string} id @param {Demonstration} demo
   * @returns {{credited: string[], status: string, reason: string}}
   */
  observe(id, demo) {
    const def = this.def(id);
    const cs = conceptState(this.state, id);
    if (cs.status === STATUS.LEARNED) return { credited: [], status: cs.status, reason: "learned" };
    if (demo.kind === TELL) {
      cs.tells++;
      this.state.mood = "confused";
      return { credited: [], status: cs.status, reason: "told" };
    }
    if (!def.accepts.includes(demo.kind) || !DEMO_KINDS.includes(demo.kind))
      return { credited: [], status: cs.status, reason: "kind" };
    if (!demo.valid) {
      this.state.mood = "worried";
      return { credited: [], status: cs.status, reason: "invalid" };
    }
    const known = new Set(def.distinctions.map((d) => d.id));
    const credited = [];
    for (const s of demo.shows) {
      if (known.has(s) && !cs.covered.includes(s)) {
        cs.covered.push(s);
        credited.push(s);
      }
    }
    if (!cs.kinds.includes(demo.kind)) cs.kinds.push(demo.kind);
    if (demo.signature && !cs.seen.includes(demo.signature)) cs.seen.push(demo.signature);
    if (cs.status === STATUS.HOLDS && cs.covered.length) cs.status = STATUS.CHALLENGED;
    if (
      cs.status === STATUS.CHALLENGED &&
      cs.covered.length === def.distinctions.length &&
      cs.kinds.length >= (def.needKinds || 1)
    )
      cs.status = STATUS.READY;
    this.state.mood = credited.length ? "surprised" : "thinking";
    return { credited, status: cs.status, reason: credited.length ? "credited" : "repeat" };
  }

  /**
   * How the apprentice answers a task right now.
   * @param {string} id
   * @param {{needs: string[], correct: any, misconceived: any}} task
   *   `needs` = distinctions the task exercises; the game computes both answers.
   * @returns {{answer: any, rule: "correct" | "misconception", missing: Distinction | null}}
   */
  attempt(id, task) {
    const cs = conceptState(this.state, id);
    const def = this.def(id);
    const gap = task.needs.find((n) => !cs.covered.includes(n));
    if (gap === undefined) return { answer: task.correct, rule: "correct", missing: null };
    return {
      answer: task.misconceived,
      rule: "misconception",
      missing: def.distinctions.find((d) => d.id === gap) || null,
    };
  }

  /** Examples the student already used; a transfer task must not repeat one. */
  seen(id) {
    return conceptState(this.state, id).seen.slice();
  }

  /**
   * The held-out check. Only offered once READY; passing it is the only way to LEARNED.
   * @returns {{passed: boolean, answer: any, missing: Distinction | null, ability: any}}
   */
  transfer(id, task) {
    const cs = conceptState(this.state, id);
    const def = this.def(id);
    if (task.signature && cs.seen.includes(task.signature))
      throw new Error(`Apprentice.transfer: task "${task.signature}" repeats a teaching example`);
    const a = this.attempt(id, task);
    cs.transfers++;
    const passed = cs.status === STATUS.READY && a.rule === "correct";
    if (passed) {
      cs.status = STATUS.LEARNED;
      if (!this.state.abilities.includes(id)) this.state.abilities.push(id);
      this.state.mood = "celebrate";
    } else {
      cs.transferFails++;
      this.state.mood = "concerned";
    }
    return {
      passed,
      answer: a.answer,
      missing: passed ? null : a.missing || this.missing(id)[0] || null,
      ability: passed ? def.ability : null,
    };
  }

  has(id) {
    return this.state.abilities.includes(id);
  }
}
