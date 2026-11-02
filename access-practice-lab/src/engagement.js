// Shared learner engagement state. Preferences keep this in the existing ACCESS backup/resume
// boundary; the actual practice record and review ledger remain the source for learning evidence.
import { practiceDays } from "./store.js";
import { todayISO } from "./util.js";

const GOALS = [3, 4, 5, 7];
const clean = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
export const getEngagement = (prefs = {}) => {
  const e = clean(prefs.engagement);
  return {
    v: 1,
    weeklyGoal: GOALS.includes(Number(e.weeklyGoal)) ? Number(e.weeklyGoal) : 3,
    xp: Math.max(0, Math.min(100000, Number(e.xp) || 0)),
    events: Array.isArray(e.events) ? e.events.filter((event) => event && typeof event.key === "string" && Number.isFinite(event.amount)).slice(-400) : [],
    awards: Array.isArray(e.awards) ? e.awards.filter((id) => ["thoughtful-reviser", "evidence-finder", "all-four-skills", "review-explorer", "welcome-back", "strategy-on-new-task"].includes(id)) : [],
    activeSession: clean(e.activeSession).id ? e.activeSession : null,
    lastSession: clean(e.lastSession).id ? e.lastSession : null,
    encouragement: ["proud", "keepgoing", "strategy"].includes(e.encouragement) ? e.encouragement : "",
    questWeek: typeof e.questWeek === "string" ? e.questWeek : "",
    questDone: e.questDone === true,
    cosmetic: ["trail-glow", "map-pin", "word-wings"].includes(e.cosmetic) ? e.cosmetic : "",
    stories: clean(e.stories),
    reminder: {
      days: Array.isArray(e.reminder?.days) ? e.reminder.days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6) : [],
      time: /^([01]\d|2[0-3]):[0-5]\d$/.test(e.reminder?.time || "") ? e.reminder.time : "18:00",
      quiet: e.reminder?.quiet !== false,
      enabled: e.reminder?.enabled === true,
    },
  };
};

export const weekKey = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return todayISO(d);
};
export function daysThisWeek(days = practiceDays(), today = new Date()) {
  const start = weekKey(today);
  const end = new Date(`${start}T12:00:00`);
  end.setDate(end.getDate() + 7);
  return [...new Set(days.filter((day) => day >= start && day < todayISO(end)))].length;
}

export function saveEngagement(ctx, patch) {
  const current = getEngagement(ctx.prefs);
  const next = { ...current, ...patch };
  ctx.setPrefs({ engagement: next });
  return next;
}

// Every source key is idempotent. Replaying the same activity/session cannot farm XP.
export function award(ctx, key, amount, label) {
  if (typeof ctx?.setPrefs !== "function") return { earned: 0, state: getEngagement(ctx?.prefs) };
  const state = getEngagement(ctx.prefs);
  if (!key || state.events.some((event) => event.key === key)) return { earned: 0, state };
  const event = { key: String(key).slice(0, 160), amount: Math.max(0, Math.min(30, Number(amount) || 0)), label: String(label || "Practice").slice(0, 60), at: new Date().toISOString() };
  const events = [...state.events, event].slice(-400);
  const next = { ...state, xp: Math.min(100000, state.xp + event.amount), events };
  const kinds = new Set(events.map((item) => item.key.split(":")[0]));
  const awards = new Set(next.awards);
  if (kinds.has("revision") && !awards.has("thoughtful-reviser")) awards.add("thoughtful-reviser");
  if (kinds.has("evidence") && !awards.has("evidence-finder")) awards.add("evidence-finder");
  if (["listening", "reading", "speaking", "writing"].every((skill) => kinds.has(`skill-${skill}`))) awards.add("all-four-skills");
  if (kinds.has("review")) awards.add("review-explorer");
  if (kinds.has("welcome-back")) awards.add("welcome-back");
  if (kinds.has("transfer")) awards.add("strategy-on-new-task");
  next.awards = [...awards];
  ctx.setPrefs({ engagement: next });
  return { earned: event.amount, state: next };
}

export function startSession(ctx, rows, minutes, title = "Today's mission", reviewIds = []) {
  const id = `mission-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const session = { id, band: ctx.band, minutes, title, ids: rows.map((row) => row.id), reviewIds, index: 0, started: new Date().toISOString() };
  saveEngagement(ctx, { activeSession: session });
  const last = practiceDays()[0];
  if (last && (Date.now() - new Date(`${last}T12:00:00`).getTime()) >= 7 * 86400000) award(ctx, "welcome-back:first-return", 3, "Welcome back");
  return session;
}

export function sessionHref(session, index = session.index || 0) {
  return `/access-practice-lab/play?${new URLSearchParams({ ids: session.ids.join(","), i: String(index), grades: session.band, t: session.title, sid: session.id })}`;
}

export function finishSession(ctx, id, hasPractice) {
  if (!hasPractice) return { earned: 0, state: getEngagement(ctx.prefs) };
  const current = getEngagement(ctx.prefs);
  if (current.activeSession?.id !== id) return { earned: 0, state: current };
  const result = award(ctx, `session-day:${todayISO()}`, 8, "Session finished");
  const state = getEngagement(ctx.prefs);
  saveEngagement(ctx, { activeSession: null, lastSession: { ...current.activeSession, finishedAt: new Date().toISOString() } });
  return result;
}
