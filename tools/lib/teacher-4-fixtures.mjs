// Shared fixtures for the teacher 4.0 tests: browser stubs (import this first) and learner builders.
const store = new Map();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  },
});
Object.defineProperty(globalThis, "sessionStorage", {
  configurable: true,
  value: { getItem: () => null, setItem() {} },
});
Object.defineProperty(globalThis, "window", { configurable: true, value: globalThis });
globalThis.CustomEvent ??= class {
  constructor(type) {
    this.type = type;
  }
};
globalThis.dispatchEvent ??= () => true;

export const clearStore = () => store.clear();
export const NOW = Date.UTC(2026, 9, 15, 17, 0, 0);
export const DAY = 86400000;
const { ALL_SKILLS } = await import("../../math/fluency-lab/problem-bank.js");
const { emptyTutor } = await import("../../math/fluency-lab/tutor-engine.js");

export { ALL_SKILLS, emptyTutor };
export const keyOf = (id) => ALL_SKILLS.find((skill) => skill.id === id).grade + ":" + id;

// "cwc" -> three answers, c = correct, w = wrong, one per `gap` ms starting at `start`.
export const answers = (
  pattern,
  { independent = true, start = NOW - 12 * DAY, gap = DAY, level = 1 } = {},
) =>
  [...pattern].map((char, index) => ({
    correct: char === "c",
    independent,
    level,
    at: start + index * gap,
  }));

export function tutorWith(records, mistakes = [], extra = {}) {
  const tutor = emptyTutor();
  for (const [key, recent] of Object.entries(records)) {
    tutor.records[key] = {
      recent,
      independentTotal: recent.filter((e) => e.independent).length,
      supportedTotal: recent.filter((e) => !e.independent).length,
      dueAt: null,
      interval: 0,
      lastAt: recent.at(-1)?.at ?? null,
      lessonCompleted: false,
      strategyTags: [],
      metrics: {},
      ...(extra[key] || {}),
    };
  }
  tutor.mistakes = mistakes;
  return tutor;
}
export const mistake = (key, category, { resolved = false, n = 0 } = {}) => ({
  id: `${key}-${category}-${n}`,
  key,
  question: `q${n}`,
  submitted: "0",
  category,
  at: NOW - DAY,
  resolvedAt: resolved ? NOW - 1000 : null,
});
