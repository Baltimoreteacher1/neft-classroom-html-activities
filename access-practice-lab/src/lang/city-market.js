// Language City episode logic (pure, no DOM): the shopping check, money formatting, the writing self-check and the saved
// state of one visit to the Community Market. Content: src/content/city-market-episode.js. Nothing here scores the
// learner; the shopping check only says whether the basket fits the recipe and the budget, and why not.
import {
  BUDGET_CENTS,
  CONNECTORS,
  ITEMS,
  LEVELS,
  RECIPE,
  SPOTS,
  SPOTS_NEEDED,
  STEPS,
  costOf,
  itemOf,
} from "../content/city-market-episode.js";

/** Saved on this device only. The learner's message is kept here so they can come back to it; it is never sent. */
export const MARKET_KEY = "accessPracticeLab:v1:city-market";

export const DEFAULT_STATE = {
  level: "",
  step: 0,
  reached: 0,
  seen: [],
  answers: {},
  cart: [],
  said: false,
  message: "",
  saved: false,
  done: false,
  runs: 0,
};

/** "$9.50" from 950. Whole cents in, so nothing is rounded. */
export const money = (cents) => {
  const c = Math.round(Number(cents) || 0);
  const sign = c < 0 ? "-" : "";
  const a = Math.abs(c);
  return `${sign}$${Math.floor(a / 100)}.${String(a % 100).padStart(2, "0")}`;
};

/** The support level for this visit: the learner's own pick, else the lab's Speaking support tier, else B. */
export function levelFor(state, prefs = {}) {
  if (LEVELS.includes(state?.level)) return state.level;
  const tier = prefs?.tiers?.Speaking;
  return LEVELS.includes(tier) ? tier : "B";
}

/** Clean a saved state: unknown ids are dropped so an old or edited record cannot break the page. */
export function cleanState(raw) {
  const s = {
    ...DEFAULT_STATE,
    ...(raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}),
  };
  const last = STEPS.length - 1;
  s.level = LEVELS.includes(s.level) ? s.level : "";
  s.step = Math.min(last, Math.max(0, Math.trunc(Number(s.step)) || 0));
  s.reached = Math.min(last, Math.max(s.step, Math.trunc(Number(s.reached)) || 0));
  s.seen = Array.isArray(s.seen)
    ? [...new Set(s.seen.filter((id) => SPOTS.some((p) => p.id === id)))]
    : [];
  s.cart = Array.isArray(s.cart) ? [...new Set(s.cart.filter((id) => itemOf(id)))] : [];
  s.answers =
    s.answers && typeof s.answers === "object" && !Array.isArray(s.answers) ? s.answers : {};
  s.message = typeof s.message === "string" ? s.message.slice(0, 2000) : "";
  s.said = Boolean(s.said);
  s.saved = Boolean(s.saved);
  s.done = Boolean(s.done);
  s.runs = Math.max(0, Math.trunc(Number(s.runs)) || 0);
  return s;
}

/** A fresh visit that keeps the learner's level and how many visits they finished. */
export const freshVisit = (state) => ({
  ...structuredClone(DEFAULT_STATE),
  level: state.level,
  runs: state.runs,
});

// ── shopping ─────────────────────────────────────────────────────────────────
export const cartTotal = (ids) =>
  ids.reduce((sum, id) => sum + (itemOf(id) ? costOf(itemOf(id)) : 0), 0);

/**
 * Does the basket make the recipe inside the budget?
 * { total, left, missing: [needId], over: cents, extras: [itemId], ok }
 */
export function checkCart(ids) {
  const list = ids.map(itemOf).filter(Boolean);
  const total = cartTotal(ids);
  const missing = RECIPE.needs
    .filter((n) => list.filter((i) => i.covers === n.id).reduce((a, i) => a + i.count, 0) < n.count)
    .map((n) => n.id);
  const extras = list.filter((i) => !i.covers).map((i) => i.id);
  const over = Math.max(0, total - BUDGET_CENTS);
  return {
    total,
    left: BUDGET_CENTS - total,
    missing,
    over,
    extras,
    ok: missing.length === 0 && over === 0,
  };
}

/** Every basket that makes the recipe inside the budget (the test uses it to prove the task has one fair answer). */
export function validCarts() {
  const out = [];
  for (let mask = 0; mask < 1 << ITEMS.length; mask += 1) {
    const ids = ITEMS.filter((_, i) => mask & (1 << i)).map((i) => i.id);
    if (checkCart(ids).ok) out.push(ids);
  }
  return out;
}

// ── writing self-check (shown, never scored) ─────────────────────────────────
export const wordCount = (text) => (String(text).match(/[\p{L}\p{N}$.]+/gu) || []).length;
export const connectorsUsed = (text) =>
  CONNECTORS.filter((c) => new RegExp(`\\b${c}\\b`, "i").test(String(text)));

// ── step completion ──────────────────────────────────────────────────────────
const answerKey = (step, level) => `${step}:${level}`;
export const answerOf = (state, step, level) => state.answers[answerKey(step, level)] || null;
export function setAnswer(state, step, level, pick, ok) {
  const k = answerKey(step, level);
  const prev = state.answers[k];
  if (prev?.ok) return prev;
  const tries = (prev?.tries || 0) + 1;
  state.answers[k] = { pick, ok, tries };
  return state.answers[k];
}

/** Whether a step is finished at this level. Changing level keeps earlier work but asks the new level's question. */
export function stepDone(state, stepId, level) {
  switch (stepId) {
    case "look":
      return state.seen.length >= SPOTS_NEEDED[level];
    case "listen":
    case "compare":
      return Boolean(answerOf(state, stepId, level)?.ok);
    case "shop":
      return checkCart(state.cart).ok;
    case "speak":
      return state.said;
    case "write":
      return state.saved && state.message.trim().length > 0;
    default:
      return false;
  }
}
export const doneCount = (state, level) => STEPS.filter((s) => stepDone(state, s.id, level)).length;
