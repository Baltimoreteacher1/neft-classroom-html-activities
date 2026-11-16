// Learning evidence for the Math Gaming Runtime. No DOM.
//
// What a teacher is shown is what the student DID with the mathematics, kept in
// six separate strands so a finished level is never mistaken for understanding:
//   completion    reached the end of a level
//   accuracy      mathematical decisions the world accepted / all decisions
//   reasoning     predictions made before a change, explanations given
//   independence  decisions made with no support open
//   supports      which scaffolds were opened
//   transfer      held-out tasks (the apprentice's, or a level's transfer room)
//
// Nothing here measures speed. An event has no duration and no timestamp
// beyond its order; reaction time and time-on-task are deliberately absent, so
// they cannot be turned into a mastery signal later.

/**
 * @typedef {Object} LearningEvidence
 * @property {number} n            order of the event in this session
 * @property {string} gameId
 * @property {string} level
 * @property {string} lesson       curriculum lesson id, e.g. "6-3"
 * @property {string} mechanic     MathMechanic id, e.g. "exponent-power"
 * @property {string} strand       one of STRANDS
 * @property {boolean} [ok]
 * @property {string} [support]    scaffold in use, "" when none
 * @property {string} [misconception]
 * @property {any} [detail]        small JSON: the expression built, the ratio chosen, ...
 */

export const STRANDS = [
  "completion",
  "accuracy",
  "reasoning",
  "independence",
  "supports",
  "transfer",
];

const FORBIDDEN = /^(ms|elapsed|duration|seconds|speed|reaction|time)/i;

export class EvidenceLog {
  /** @param {{gameId: string, max?: number}} o */
  constructor(o) {
    this.gameId = o.gameId;
    this.max = o.max || 400;
    /** @type {LearningEvidence[]} */
    this.events = [];
    this.n = 0;
  }

  /** @param {Omit<LearningEvidence, "n" | "gameId">} e */
  record(e) {
    if (!STRANDS.includes(e.strand)) throw new Error(`EvidenceLog: unknown strand "${e.strand}"`);
    for (const key of Object.keys(e))
      if (FORBIDDEN.test(key)) throw new Error(`EvidenceLog: "${key}" is a speed measure`);
    if (e.detail && typeof e.detail === "object")
      for (const key of Object.keys(e.detail))
        if (FORBIDDEN.test(key)) throw new Error(`EvidenceLog: detail "${key}" is a speed measure`);
    const event = { n: this.n++, gameId: this.gameId, ...e };
    this.events.push(event);
    if (this.events.length > this.max) this.events.shift();
    return event;
  }

  /** A mathematical decision and what the world did with it. */
  decision(level, lesson, mechanic, ok, o = {}) {
    this.record({
      level,
      lesson,
      mechanic,
      strand: "accuracy",
      ok,
      support: o.support || "",
      misconception: o.misconception,
      detail: o.detail,
    });
    if (ok && !o.support)
      this.record({ level, lesson, mechanic, strand: "independence", ok: true });
  }

  /** Per-strand counts a teacher view (or the existing reporting system) can show. */
  summary() {
    const s = {
      levelsCompleted: [],
      decisions: 0,
      accepted: 0,
      revised: 0,
      predictions: 0,
      predictionsHeld: 0,
      explanations: 0,
      demonstrations: 0,
      independent: 0,
      supports: {},
      transferTried: 0,
      transferPassed: 0,
      misconceptions: {},
      byLesson: {},
    };
    let lastMiss = "";
    for (const e of this.events) {
      const lesson = (s.byLesson[e.lesson] ||= { decisions: 0, accepted: 0, transferPassed: 0 });
      if (e.strand === "completion" && e.ok && !s.levelsCompleted.includes(e.level))
        s.levelsCompleted.push(e.level);
      if (e.strand === "accuracy") {
        s.decisions++;
        lesson.decisions++;
        if (e.ok) {
          s.accepted++;
          lesson.accepted++;
          if (lastMiss === e.mechanic) s.revised++;
          lastMiss = "";
        } else {
          lastMiss = e.mechanic;
          if (e.misconception)
            s.misconceptions[e.misconception] = (s.misconceptions[e.misconception] || 0) + 1;
        }
      }
      if (e.strand === "reasoning") {
        const kind = e.detail?.kind;
        if (kind === "prediction") {
          s.predictions++;
          if (e.ok) s.predictionsHeld++;
        } else if (kind === "explanation") s.explanations++;
        else s.demonstrations++;
      }
      if (e.strand === "independence") s.independent++;
      if (e.strand === "supports" && e.support)
        s.supports[e.support] = (s.supports[e.support] || 0) + 1;
      if (e.strand === "transfer") {
        s.transferTried++;
        if (e.ok) {
          s.transferPassed++;
          lesson.transferPassed++;
        }
      }
    }
    return s;
  }

  serialize() {
    return { v: 1, n: this.n, events: this.events };
  }

  static revive(gameId, data) {
    const log = new EvidenceLog({ gameId });
    if (data && data.v === 1) {
      log.events = data.events || [];
      log.n = data.n | 0;
    }
    return log;
  }
}
