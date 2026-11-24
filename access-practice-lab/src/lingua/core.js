/* Everyday English studio — shared engine: practice record (XP, streak, spaced cards, drafts) and helpers.
   Storage and read-aloud go through the lab's own modules so there is one implementation of each. */
import { announce, safeJson, storage } from "../util.js";
import { speak as labSpeak, stop as stopLabSpeech } from "../speech.js";
import { LEVEL_LABEL } from "./data.js";

const KEY = "accessPracticeLab:v1:lingua";
export const CHANGE_EVENT = "lingua:change";

const blank = () => ({ xp: 0, streak: 0, lastDay: null, answers: {}, mastery: {}, cards: {}, drafts: {}, sessions: 0 });

function read() {
  const saved = safeJson(storage.get(KEY), null);
  return saved && typeof saved === "object" && !Array.isArray(saved) ? { ...blank(), ...saved } : blank();
}

export const state = read();

function save() {
  storage.set(KEY, JSON.stringify(state));
  document.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: state }));
}

const dayNumber = (d) => Math.floor(Date.parse(`${d}T00:00:00Z`) / 86400000);
const todayKey = () => new Date().toISOString().slice(0, 10);

function touchStreak() {
  const d = todayKey();
  if (state.lastDay === d) return;
  state.streak = state.lastDay && dayNumber(d) - dayNumber(state.lastDay) === 1 ? state.streak + 1 : 1;
  state.lastDay = d;
}

export function awardXP(amount) {
  const n = Math.max(0, Math.round(amount));
  state.xp += n;
  touchStreak();
  save();
  return n;
}

export function countSession() {
  state.sessions += 1;
  touchStreak();
  save();
}

export function recordAnswer(activity, itemId, correct) {
  state.answers[`${activity}:${itemId}`] = { correct: !!correct, t: Date.now() };
  const m = state.mastery[activity] || { attempts: 0, correct: 0 };
  m.attempts += 1;
  if (correct) m.correct += 1;
  state.mastery[activity] = m;
  touchStreak();
  save();
}

export const attemptsOf = (activity) => state.mastery[activity]?.attempts || 0;

export function masteryOf(activity) {
  const m = state.mastery[activity];
  return m?.attempts ? Math.round((m.correct / m.attempts) * 100) : 0;
}

export const answeredCorrectly = (activity, itemId) => !!state.answers[`${activity}:${itemId}`]?.correct;

export function rememberCard(id, box, dueInDays) {
  state.cards[id] = { box, due: Date.now() + dueInDays * 86400000, seen: (state.cards[id]?.seen || 0) + 1 };
  save();
}

export const cardOf = (id) => state.cards[id] || { box: 0, due: 0, seen: 0 };

export function saveDraft(id, text) {
  state.drafts[id] = text;
  save();
}

export const draftOf = (id) => state.drafts[id] || "";

/* ---------- read-aloud: the lab's speech module (honours the learner's saved voice and speed) ---------- */
export const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
export const stopSpeaking = () => stopLabSpeech();
export const speak = (text, { rate = 0.95 } = {}) => labSpeak(text, { lang: "en-US", rate });

/* ---------- helpers ---------- */
export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const escapeHtml = (str) =>
  String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const norm = (str) =>
  String(str).toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]/g, " ").replace(/\s+/g, " ").trim();

export const byLevel = (items, level) => items.filter((i) => level === "All" || i.lvl === level);

/** What a learner sees for a difficulty tag: "Starter", "Building" or "Stretch". */
export const levelName = (lvl) => LEVEL_LABEL[lvl] || lvl;

export const toast = (message) => announce(message, { tone: "success" });
