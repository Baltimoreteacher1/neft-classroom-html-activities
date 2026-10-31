// Where a learner stopped in a skill's mini-lesson, kept on this device per learner profile (language-settings.js
// helpers). Old saves with no mini-lesson key load as "nothing saved". Only a few known fields are kept.
import { readJson, writeJson } from "../language-settings.js";
import { TRY_COUNT } from "./practice.js";

const KEY = "ewl-mini-lesson-v1";
const MAX_SKILLS = 40;
const STEPS = ["learn", "watch", "try", "explain"];

// tried[i] is true (right), false (needed help or the answer) or null (not done yet) for each Try-It problem.
export function sanitizeResume(raw) {
  if (!raw || typeof raw !== "object" || !STEPS.includes(raw.step)) return null;
  const seed = Number(raw.seed);
  const tried = Array.from({ length: TRY_COUNT }, (_, i) => (raw.tried?.[i] === true ? true : raw.tried?.[i] === false ? false : null));
  return {
    step: raw.step,
    seed: Number.isInteger(seed) && seed >= 0 && seed < 2 ** 32 ? seed : 0,
    tried,
    at: Number.isFinite(raw.at) ? Math.floor(raw.at) : 0,
    writing: raw.writing === "es" ? "es" : "en",
  };
}

const all = () => {
  const saved = readJson(KEY, {});
  return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
};

export const loadResume = (skillKey) => sanitizeResume(all()[skillKey]);

export function saveResume(skillKey, state) {
  const entry = sanitizeResume({ ...state, at: Date.now() });
  if (!entry || !/^\d:[\w-]{1,40}$/.test(skillKey)) return false;
  const next = { ...all(), [skillKey]: entry };
  const keep = Object.entries(next).sort((a, b) => (b[1]?.at || 0) - (a[1]?.at || 0)).slice(0, MAX_SKILLS);
  return writeJson(KEY, Object.fromEntries(keep));
}

export function clearResume(skillKey) {
  const { [skillKey]: _gone, ...rest } = all();
  return writeJson(KEY, rest);
}
