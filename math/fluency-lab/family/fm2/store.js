// Learner progress for Family Math 2.0, kept on this device and separated per learner profile.
// Everything is validated on the way in (sanitize) so a damaged or hand-edited value can never crash a page.
// @fm2 FM-023 FM-025 FM-026
import { profileKey } from "./profile-key.js";
import { applyAttempt, mastery, starsFor } from "./adapt.js";

export const KEY = "ewl-fm2-v1";
export const GRADE_RANGE = [0, 8];
export const MINUTES = [5, 10, 15];
const MODES = ["solo", "together"];

export const emptyState = () => ({ version: 1, skills: {}, games: {}, sessions: [], days: {}, settings: { grade: 1, minutes: 10, mode: "solo" }, resume: null });
export const skillKey = (gameId, skillId) => `${gameId}:${skillId}`;
export const dayKey = (now = Date.now()) => {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const num = (v, min, max, fallback) => (Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback);
const idText = (v) => (typeof v === "string" && /^[a-z0-9:-]{1,60}$/.test(v) ? v : null);

function cleanSkill(raw) {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.recent)) return null;
  const recent = raw.recent
    .filter((a) => a && (a.c === 0 || a.c === 1))
    .slice(-12)
    .map((a) => ({ c: a.c, h: num(a.h, 0, 3, 0), l: num(a.l, 1, 3, 1), t: num(a.t, 0, 4e12, 0) }));
  return { recent, level: num(raw.level, 1, 3, 1), plays: num(raw.plays, 0, 1e6, recent.length), step: num(raw.step, 0, 4, 0), dueAt: num(raw.dueAt, 0, 4e12, 0), lastAt: num(raw.lastAt, 0, 4e12, 0) };
}

export function sanitize(raw) {
  const state = emptyState();
  if (!raw || typeof raw !== "object" || raw.version !== 1) return state;
  for (const [key, value] of Object.entries(raw.skills || {})) {
    const [gameId, skillId] = key.split(":");
    const clean = idText(gameId) && idText(skillId) ? cleanSkill(value) : null;
    if (clean) state.skills[key] = clean;
  }
  for (const [id, g] of Object.entries(raw.games || {})) {
    if (idText(id) && g && typeof g === "object") state.games[id] = { plays: num(g.plays, 0, 1e6, 0), completed: num(g.completed, 0, 1e6, 0), bestStars: num(g.bestStars, 0, 3, 0), lastAt: num(g.lastAt, 0, 4e12, 0) };
  }
  state.sessions = (Array.isArray(raw.sessions) ? raw.sessions : []).slice(-30).filter((s) => s && Number.isFinite(s.at)).map((s) => ({
    at: s.at, grade: num(s.grade, 0, 8, 1), minutes: num(s.minutes, 0, 120, 0), correct: num(s.correct, 0, 1000, 0), total: num(s.total, 0, 1000, 0), games: Array.isArray(s.games) ? s.games.filter(idText).slice(0, 8) : [], mode: MODES.includes(s.mode) ? s.mode : "solo",
  }));
  for (const [day, minutes] of Object.entries(raw.days || {})) if (/^\d{4}-\d{2}-\d{2}$/.test(day)) state.days[day] = num(minutes, 0, 1440, 0);
  const s = raw.settings || {};
  state.settings = { grade: Math.round(num(s.grade, GRADE_RANGE[0], GRADE_RANGE[1], 1)), minutes: MINUTES.includes(s.minutes) ? s.minutes : 10, mode: MODES.includes(s.mode) ? s.mode : "solo" };
  state.resume = cleanResume(raw.resume);
  return state;
}

function cleanResume(r) {
  if (!r || typeof r !== "object" || !idText(r.gameId) || !idText(r.skillId) || !Array.isArray(r.results)) return null;
  return {
    gameId: r.gameId, skillId: r.skillId, grade: Math.round(num(r.grade, 0, 8, 1)), level: Math.round(num(r.level, 1, 3, 1)), seed: num(r.seed, 0, 4294967295, 0), rounds: Math.round(num(r.rounds, 1, 12, 5)),
    index: Math.round(num(r.index, 0, 12, 0)), mode: MODES.includes(r.mode) ? r.mode : "solo", plan: typeof r.plan === "string" ? r.plan.slice(0, 600) : "", step: Math.round(num(r.step, 0, 8, 0)), at: num(r.at, 0, 4e12, 0),
    results: r.results.slice(0, 12).map((x) => ({ correct: Boolean(x?.correct), hints: num(x?.hints, 0, 3, 0), attempts: num(x?.attempts, 0, 20, 0), revealed: Boolean(x?.revealed) })),
  };
}

// A store bound to one learner profile. `storage` is injectable for tests; the default is localStorage with an
// in-memory fallback, and onUnavailable fires once if the browser refuses to save.
export function createStore({ profile = 0, storage = null, onUnavailable = () => {}, now = () => Date.now() } = {}) {
  const memory = new Map();
  // Reading `localStorage` itself can throw (Safari with site data blocked), so the lookup is guarded too.
  let backing = storage;
  if (!backing) {
    try { backing = typeof localStorage !== "undefined" ? localStorage : null; } catch { backing = null; }
  }
  const key = profileKey(KEY, profile);
  let warned = false;
  const read = () => {
    try { return backing ? backing.getItem(key) : memory.get(key) ?? null; } catch { return memory.get(key) ?? null; }
  };
  const write = (text) => {
    memory.set(key, text);
    try { backing?.setItem(key, text); } catch { if (!warned) { warned = true; onUnavailable(); } }
  };
  let state;
  try { state = sanitize(JSON.parse(read())); } catch { state = emptyState(); }
  const save = () => write(JSON.stringify(state));
  return {
    profile,
    get state() { return state; },
    save,
    reset() { state = emptyState(); save(); },
    setSetting(name, value) { state.settings = sanitize({ ...state, settings: { ...state.settings, [name]: value } }).settings; save(); },
    recordRound({ gameId, skillId, level, correct, hints = 0 }) {
      const k = skillKey(gameId, skillId);
      state.skills[k] = applyAttempt(state.skills[k], { correct, hints, level }, now());
      save();
      return state.skills[k];
    },
    completeActivity({ gameId, correct, total }) {
      const g = state.games[gameId] || { plays: 0, completed: 0, bestStars: 0, lastAt: 0 };
      const stars = total ? (correct / total >= 0.9 ? 3 : correct / total >= 0.7 ? 2 : correct / total >= 0.4 ? 1 : 0) : 0;
      state.games[gameId] = { plays: g.plays + 1, completed: g.completed + 1, bestStars: Math.max(g.bestStars, stars), lastAt: now() };
      save();
      return stars;
    },
    recordSession({ grade, minutes, correct, total, games, mode }) {
      const at = now();
      state.sessions = [...state.sessions, { at, grade, minutes, correct, total, games, mode }].slice(-30);
      const day = dayKey(at);
      state.days[day] = (state.days[day] || 0) + minutes;
      for (const old of Object.keys(state.days).sort().slice(0, -60)) delete state.days[old];
      save();
    },
    saveResume(resume) { state.resume = cleanResume({ ...resume, at: now() }); save(); },
    clearResume() { state.resume = null; save(); },
    skill(gameId, skillId) { return state.skills[skillKey(gameId, skillId)] || null; },
    stars(gameId, skillId) { return starsFor(state.skills[skillKey(gameId, skillId)]); },
    mastery(gameId, skillId) { return mastery(state.skills[skillKey(gameId, skillId)]); },
  };
}

// Consecutive days with practice, counting today only if there is practice today (yesterday keeps a streak alive).
export function streak(state, now = Date.now()) {
  let count = 0;
  let cursor = now;
  if (!state.days[dayKey(cursor)]) cursor -= 86400000;
  while (state.days[dayKey(cursor)] > 0) { count += 1; cursor -= 86400000; }
  return count;
}

export function minutesThisWeek(state, now = Date.now()) {
  let total = 0;
  for (let i = 0; i < 7; i += 1) total += state.days[dayKey(now - i * 86400000)] || 0;
  return total;
}
