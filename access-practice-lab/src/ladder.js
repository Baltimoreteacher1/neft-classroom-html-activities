// Reading Ladder: short passages that move up or down one practice step after each round.
// Pure state logic only; the Ladder view draws it. A step orders texts by length and sentence
// complexity. It is a practice step on this device, never a Lexile measure, grade level or WIDA level.
export const LADDER_STEPS = 6;
export const HISTORY_LIMIT = 60;
export const MIN_ROUND_QUESTIONS = 3;

const clampStep = (n) => Math.max(1, Math.min(LADDER_STEPS, Number.isInteger(n) ? n : 1));
const count = (n) => (Number.isInteger(n) && n > 0 ? n : 0);

/** Where a first round begins. The learner can pick a different step at any time. */
export const startStep = (band) => (band === "3-5" ? 2 : 4);

/** Up after every question right, hold after one miss, down after two or more misses. */
export function nextStep(step, correct, total) {
  const here = clampStep(step);
  if (total < MIN_ROUND_QUESTIONS) return here;
  if (correct >= total) return clampStep(here + 1);
  if (correct >= total - 1) return here;
  return clampStep(here - 1);
}

export function stepMove(step, correct, total) {
  const next = nextStep(step, correct, total);
  return next > clampStep(step) ? "up" : next < clampStep(step) ? "down" : "hold";
}

/** Reads saved state defensively: anything unreadable becomes a fresh ladder at `fallbackStep`. */
export function normalizeLadder(raw, fallbackStep = 2) {
  const value = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const history = (Array.isArray(value.history) ? value.history : [])
    .filter(
      (row) =>
        row &&
        typeof row.id === "string" &&
        Number.isInteger(row.step) &&
        Number.isInteger(row.correct) &&
        Number.isInteger(row.total) &&
        row.total > 0,
    )
    .map((row) => ({
      id: row.id,
      step: clampStep(row.step),
      correct: Math.min(row.correct, row.total),
      total: row.total,
      day: typeof row.day === "string" ? row.day : "",
    }))
    .slice(-HISTORY_LIMIT);
  return {
    step: clampStep(value.step ?? fallbackStep),
    best: clampStep(value.best ?? value.step ?? fallbackStep),
    history,
    open:
      value.open && typeof value.open.id === "string"
        ? {
            id: value.open.id,
            picks: Array.isArray(value.open.picks)
              ? value.open.picks.map((p) => (Number.isInteger(p) ? p : null)).slice(0, 8)
              : [],
            checked: value.open.checked === true,
          }
        : null,
  };
}

/** The passage for this step that the learner has seen least; ties go to the earliest authored one. */
export function pickPassage(passages, step, history, random = Math.random) {
  const here = passages.filter((p) => p.step === clampStep(step));
  if (!here.length) return null;
  const seen = new Map();
  for (const row of history) seen.set(row.id, (seen.get(row.id) || 0) + 1);
  const fewest = Math.min(...here.map((p) => seen.get(p.id) || 0));
  const pool = here.filter((p) => (seen.get(p.id) || 0) === fewest);
  return pool[Math.floor(random() * pool.length)];
}

export const scoreRound = (passage, picks) =>
  passage.questions.filter((q, i) => picks[i] === q.answer).length;

/** Ends a round: records it, moves the step, and keeps the highest step reached. */
export function finishRound(state, passage, picks, day) {
  const correct = scoreRound(passage, picks);
  const total = passage.questions.length;
  const step = nextStep(passage.step, correct, total);
  const history = [
    ...state.history,
    { id: passage.id, step: passage.step, correct, total, day },
  ].slice(-HISTORY_LIMIT);
  return { ...state, step, best: Math.max(state.best, step), history, open: null };
}

export function ladderSummary(state) {
  const rounds = state.history.length;
  const right = state.history.reduce((sum, row) => sum + row.correct, 0);
  const asked = state.history.reduce((sum, row) => sum + row.total, 0);
  const days = new Set(state.history.map((row) => row.day).filter(Boolean));
  return {
    rounds,
    right,
    asked,
    days: days.size,
    best: state.best,
    step: state.step,
    enough: rounds >= 3,
  };
}

export const questionKindLabel = (kind) =>
  ({
    detail: "Find a detail",
    word: "Word in context",
    inference: "Make an inference",
    "main-idea": "Main idea",
  })[kind] || "Question";

export { clampStep, count };
