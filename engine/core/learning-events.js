/**
 * Local learning events. Nothing here is a name, an initial, or a network call.
 * schema_version, lesson_id, skill, attempt, result, support_used.
 */

export const LEARNING_EVENT_KEY = "ewl-learning-events-v1";
const MAX_EVENTS = 200;

const ALLOWED = ["schema_version", "lesson_id", "skill", "attempt", "result", "support_used", "at"];

export function learningEvent(input = {}) {
  const event = {
    schema_version: 1,
    lesson_id: String(input.lesson_id || "").slice(0, 40),
    skill: String(input.skill || "").slice(0, 80),
    attempt: Math.max(1, Number(input.attempt) || 1),
    result: input.result === "correct" ? "correct" : "incorrect",
    support_used: Boolean(input.support_used),
    at: Number.isFinite(input.at) ? input.at : Date.now(),
  };
  for (const key of Object.keys(input)) {
    if (!ALLOWED.includes(key) && /name|student|email|initial/i.test(key)) {
      /* dropped on purpose — local progress stays local and unnamed */
    }
  }
  return event;
}

export function readLearningEvents(storage = safeStorage()) {
  try {
    const raw = storage?.getItem(LEARNING_EVENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((row) => row && row.schema_version === 1) : [];
  } catch {
    return [];
  }
}

export function recordLearningEvent(input, storage = safeStorage()) {
  const event = learningEvent(input);
  if (!event.lesson_id) return event;
  try {
    const next = readLearningEvents(storage).concat(event).slice(-MAX_EVENTS);
    storage?.setItem(LEARNING_EVENT_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked — the attempt still happened; it just will not resume */
  }
  return event;
}

function safeStorage() {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}
