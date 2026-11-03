// Math Reality engine: the seven-step learning cycle as a pure reducer, the idea interpreter, progressive hints,
// evidence, and the versioned save schema. No DOM, no storage, no randomness: the same actions always give the same
// session, so every journey is testable without a browser.
import { MISSIONS, bandOf } from "./stadium-missions.js";
import { clean, consequences, setField } from "./stadium-math.js";

export const STEPS = [
  "create",
  "predict",
  "experiment",
  "observe",
  "explain",
  "apply",
  "reflect",
  "done",
];
export const STEP_LABELS = {
  create: "Create",
  predict: "Predict",
  experiment: "Experiment",
  observe: "Observe",
  explain: "Explain",
  apply: "Apply",
  reflect: "Reflect",
};
export const SAVE_VERSION = 1;
export const MAX_LOG = 200;
export const MAX_HISTORY = 20;
export const MAX_REFLECTION = 600;

// Worlds. Only a world marked ready is playable; the others are honest about it.
export const WORLDS = [
  {
    id: "stadium",
    ready: true,
    words: ["soccer", "stadium", "football", "field", "pitch", "sport", "sports", "arena", "game"],
  },
  {
    id: "pizza",
    ready: false,
    words: ["pizza", "restaurant", "food", "cook", "recipe", "cafe", "bakery", "kitchen"],
  },
  {
    id: "space",
    ready: false,
    words: ["space", "rocket", "planet", "moon", "mars", "astronaut", "mission", "galaxy"],
  },
];
const CLOSEST = {
  garden: "stadium",
  park: "stadium",
  "theme park": "stadium",
  zoo: "stadium",
  city: "stadium",
};

// Match a student's own words to a supported world. Never pretends: reports whether the world is playable and
// whether the match was exact, a near neighbour, or nothing.
export function interpretIdea(text) {
  const words =
    String(text || "")
      .toLowerCase()
      .match(/[a-záéíóúñ]+/g) || [];
  if (!words.length) return { match: "none" };
  const phrase = words.join(" ");
  for (const world of WORLDS)
    if (world.words.some((word) => words.includes(word)))
      return { match: "exact", worldId: world.id, ready: world.ready };
  for (const [key, worldId] of Object.entries(CLOSEST))
    if (phrase.includes(key)) return { match: "near", worldId, ready: true };
  return { match: "none" };
}

export const missionFor = (worldId, grade) =>
  worldId === "stadium" ? MISSIONS[bandOf(grade)] : null;

export function newSession(mission, grade) {
  return {
    v: SAVE_VERSION,
    missionId: mission.id,
    band: mission.band,
    grade,
    step: "create",
    state: clean(mission.start),
    base: null,
    prediction: null,
    observed: null,
    explain: { choice: null, attempts: 0, correct: false },
    apply: {
      seed: 0,
      attempts: 0,
      hints: 0,
      earlier: 0,
      correct: false,
      given: null,
      before: null,
      setup: null,
    },
    reflection: "",
    log: [],
    history: [],
  };
}

const note = (session, entry) => ({
  ...session,
  log: [...session.log, { ...entry, step: session.step }].slice(-MAX_LOG),
});
const snapshot = (session) => ({
  ...session,
  history: [...session.history, { step: session.step, state: session.state }].slice(-MAX_HISTORY),
});

// Which fields a student may change at each step. Predicting and reading are not editing steps.
export const editable = (step) => step === "create" || step === "experiment" || step === "apply";

function enterApply(session, mission) {
  const seed = session.apply.seed;
  const problem = mission.apply(seed, session.base ?? session.state);
  const state = problem.setup ? clean({ ...session.state, ...problem.setup }) : session.state;
  return {
    ...session,
    step: "apply",
    state,
    apply: {
      ...session.apply,
      correct: false,
      given: null,
      attempts: 0,
      hints: 0,
      before: session.base ?? session.state,
      setup: problem.setup || null,
    },
  };
}

// One action in, one new session out. `mission` is the active mission definition.
export function reduce(session, action, mission) {
  switch (action.type) {
    case "set": {
      if (!editable(session.step)) return session;
      const result = action.scale
        ? action.scale(session.state)
        : setField(session.state, action.key, action.value);
      if (result.error)
        return note(session, { t: "refused", key: action.key, reason: result.error });
      let next = snapshot({ ...session, state: result.state });
      next = note(next, { t: "set", key: action.key ?? "scale", value: action.value ?? null });
      if (session.step === "experiment" && mission.experiment.done(session.base, result.state)) {
        next = {
          ...next,
          step: "observe",
          observed: {
            before: session.base,
            after: result.state,
            consequences: consequences(session.base, result.state),
          },
        };
      }
      return next;
    }
    case "continue": {
      if (session.step === "create" && mission.create.done(session.state))
        return note({ ...session, step: "predict" }, { t: "create-done" });
      if (session.step === "observe") return { ...session, step: "explain" };
      if (session.step === "explain" && session.explain.correct)
        return enterApply(session, mission);
      if (session.step === "apply" && session.apply.correct) return { ...session, step: "reflect" };
      return session;
    }
    case "predict": {
      if (session.step !== "predict") return session;
      const choice = mission.predict(session.state).choices.find((c) => c.id === action.id);
      if (!choice) return session;
      const next = {
        ...session,
        step: "experiment",
        base: session.state,
        prediction: { id: choice.id, correct: choice.correct, tag: choice.tag || null },
      };
      return note(next, {
        t: "predict",
        id: choice.id,
        correct: choice.correct,
        tag: choice.tag || null,
      });
    }
    case "explain": {
      if (session.step !== "explain" || session.explain.correct) return session;
      const choice = mission.explain.choices.find((c) => c.id === action.id);
      if (!choice) return session;
      const explain = {
        choice: choice.id,
        attempts: session.explain.attempts + 1,
        correct: choice.correct,
        tag: choice.tag || null,
      };
      return note(
        { ...session, explain },
        { t: "explain", id: choice.id, correct: choice.correct, tag: choice.tag || null },
      );
    }
    case "answer": {
      if (session.step !== "apply" || session.apply.correct) return session;
      const problem = mission.apply(session.apply.seed, session.apply.before);
      const ok =
        problem.kind === "number"
          ? Number(action.value) === problem.answer
          : problem.done(session.state);
      const apply = {
        ...session.apply,
        attempts: session.apply.attempts + 1,
        correct: ok,
        given: action.value ?? null,
      };
      return note(
        { ...session, apply },
        {
          t: "apply",
          ok,
          hints: session.apply.hints,
          independent: ok && session.apply.hints === 0,
        },
      );
    }
    case "hint": {
      if (session.step !== "apply" || session.apply.correct) return session;
      const problem = mission.apply(session.apply.seed, session.apply.before);
      const hints = Math.min(problem.hints.length, session.apply.hints + 1);
      return note({ ...session, apply: { ...session.apply, hints } }, { t: "hint", level: hints });
    }
    case "another": {
      if (session.step !== "apply" || session.apply.correct) return session;
      return enterApply(
        {
          ...session,
          apply: {
            ...session.apply,
            seed: session.apply.seed + 1,
            earlier: session.apply.earlier + 1,
          },
        },
        mission,
      );
    }
    case "reflect": {
      if (session.step !== "reflect") return session;
      return { ...session, reflection: String(action.text || "").slice(0, MAX_REFLECTION) };
    }
    case "finish":
      return session.step === "reflect"
        ? note({ ...session, step: "done" }, { t: "finish" })
        : session;
    case "undo": {
      if (!session.history.length || !editable(session.step)) return session;
      const history = session.history.slice(0, -1);
      return { ...session, state: session.history[session.history.length - 1].state, history };
    }
    default:
      return session;
  }
}

// Evidence is built only from what the student did. Reflection text is stored but never scored.
export function evidenceOf(session) {
  const apply = session.apply;
  return {
    missionId: session.missionId,
    band: session.band,
    grade: session.grade,
    prediction: session.prediction
      ? { correct: session.prediction.correct, tag: session.prediction.tag }
      : null,
    explain: { attempts: session.explain.attempts, correct: session.explain.correct },
    apply: {
      attempts: apply.attempts,
      hints: apply.hints,
      earlierMisses: apply.earlier,
      correct: apply.correct,
      independent: apply.correct && apply.hints === 0 && apply.attempts === 1,
    },
    reflection: { written: session.reflection.trim().length > 0, graded: false },
    kind: "observed",
  };
}

export const hintsFor = (mission, session) => {
  const problem = mission.apply(session.apply.seed, session.apply.before ?? session.state);
  return {
    shown: problem.hints.slice(0, session.apply.hints),
    more: session.apply.hints < problem.hints.length,
  };
};

// ---- Save schema (versioned, validated on load) ------------------------------------------------------------------
export const emptySave = () => ({ version: SAVE_VERSION, worlds: {}, completed: [], idea: "" });

const isStep = (value) => STEPS.includes(value);
export function sanitizeSession(raw, mission) {
  if (!raw || typeof raw !== "object" || raw.missionId !== mission.id) return null;
  const fresh = newSession(mission, Number.isInteger(raw.grade) ? raw.grade : 1);
  const step = isStep(raw.step) ? raw.step : "create";
  const explain = raw.explain && typeof raw.explain === "object" ? raw.explain : {};
  const apply = raw.apply && typeof raw.apply === "object" ? raw.apply : {};
  const prediction =
    raw.prediction && typeof raw.prediction === "object" && typeof raw.prediction.id === "string"
      ? {
          id: raw.prediction.id,
          correct: Boolean(raw.prediction.correct),
          tag: typeof raw.prediction.tag === "string" ? raw.prediction.tag : null,
        }
      : null;
  const base = raw.base ? clean(raw.base) : null;
  const state = clean(raw.state);
  // A step that depends on earlier work falls back to the last step whose inputs exist.
  const needsBase = ["observe", "explain", "apply", "reflect", "done"].includes(step);
  const safeStep =
    (needsBase && (!base || !prediction)) || (step === "experiment" && !base) ? "create" : step;
  const observed =
    base && safeStep !== "create"
      ? { before: base, after: state, consequences: consequences(base, state) }
      : null;
  return {
    ...fresh,
    step: safeStep,
    state,
    base,
    prediction,
    observed: ["explain", "apply", "reflect", "done"].includes(safeStep)
      ? raw.observed && base
        ? {
            before: base,
            after: clean(raw.observed.after),
            consequences: consequences(base, clean(raw.observed.after)),
          }
        : observed
      : safeStep === "observe"
        ? observed
        : null,
    explain: {
      choice: typeof explain.choice === "string" ? explain.choice : null,
      attempts: Math.max(0, Math.min(99, Math.floor(Number(explain.attempts) || 0))),
      correct: Boolean(explain.correct),
    },
    apply: {
      seed: Math.max(0, Math.min(99, Math.floor(Number(apply.seed) || 0))),
      attempts: Math.max(0, Math.min(99, Math.floor(Number(apply.attempts) || 0))),
      hints: Math.max(0, Math.min(9, Math.floor(Number(apply.hints) || 0))),
      earlier: Math.max(0, Math.min(99, Math.floor(Number(apply.earlier) || 0))),
      correct: Boolean(apply.correct),
      given: apply.given == null ? null : Number(apply.given) || 0,
      before: apply.before ? clean(apply.before) : base,
      setup: apply.setup && typeof apply.setup === "object" ? apply.setup : null,
    },
    reflection: typeof raw.reflection === "string" ? raw.reflection.slice(0, MAX_REFLECTION) : "",
    log: Array.isArray(raw.log)
      ? raw.log.filter((e) => e && typeof e.t === "string").slice(-MAX_LOG)
      : [],
    history: Array.isArray(raw.history)
      ? raw.history
          .filter((h) => h && h.state)
          .map((h) => ({ step: isStep(h.step) ? h.step : "create", state: clean(h.state) }))
          .slice(-MAX_HISTORY)
      : [],
  };
}

export function sanitizeSave(raw) {
  if (!raw || typeof raw !== "object" || raw.version !== SAVE_VERSION) return emptySave();
  const completed = Array.isArray(raw.completed)
    ? raw.completed
        .filter((e) => e && typeof e.missionId === "string" && typeof e.at === "number")
        .slice(-100)
    : [];
  return {
    version: SAVE_VERSION,
    worlds: raw.worlds && typeof raw.worlds === "object" ? raw.worlds : {},
    completed,
    idea: typeof raw.idea === "string" ? raw.idea.slice(0, 120) : "",
  };
}
