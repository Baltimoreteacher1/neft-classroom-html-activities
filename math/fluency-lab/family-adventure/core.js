/* Family Math Expedition — shared helpers: saved state (with migration), language, and small DOM builders.
 * State stays on this device. Language is "en", "es" or "bi" (English with Spanish under it) and is shared with the
 * other family pages through the same keys they already use. */

export const KEY = "ewl-fluency-family-expedition-v2";
export const LEGACY_KEY = "ewl-fluency-family-adventure-v1";
export const LANG_KEY = "ewl-family-lang-mode-v1";
export const FLUENCY_LANG_KEY = "ewl-fluency-lang-v1";
export const MODES = ["en", "es", "bi"];
export const GRADES = [1, 2, 3, 4, 5, 6, 7, 8];
export const STOP_IDS = ["welcome", "discover", "together", "explore", "night"];
export const ROUTINES = ["quick", "together", "deeper"];
export const SCREENS = ["stop", "free", "done"];
const NS = "http://www.w3.org/2000/svg";

/** A bilingual pair. */
export const p = (en, es) => ({ en, es });

export const fresh = () => ({
  v: 2,
  screen: "stop",
  stop: 0,
  grade: 0,
  done: [false, false, false, false, false],
  challenge: {},
  coach: { step: 0, picks: [] },
  plan: { gameId: "", skillId: "", routine: "quick" },
  narrate: false,
});

const clampInt = (value, lo, hi, fallback) =>
  Number.isInteger(value) && value >= lo && value <= hi ? value : fallback;

/** Accept only well-formed saved state; anything else falls back to a clean value. */
export function sanitize(raw) {
  const s = fresh();
  if (!raw || typeof raw !== "object") return s;
  s.grade = GRADES.includes(raw.grade) ? raw.grade : 0;
  s.screen = SCREENS.includes(raw.screen) ? raw.screen : "stop";
  s.stop = clampInt(raw.stop, 0, STOP_IDS.length - 1, 0);
  if (Array.isArray(raw.done)) s.done = s.done.map((_, i) => raw.done[i] === true);
  if (raw.challenge && typeof raw.challenge === "object") {
    for (const g of GRADES) {
      const c = raw.challenge[g];
      if (c && typeof c === "object")
        s.challenge[g] = {
          variant: clampInt(c.variant, 0, 1, 0),
          solved: c.solved === true,
          revised: c.revised === true,
        };
    }
  }
  if (raw.coach && typeof raw.coach === "object") {
    s.coach.step = clampInt(raw.coach.step, 0, 4, 0);
    if (Array.isArray(raw.coach.picks))
      s.coach.picks = raw.coach.picks.slice(0, 4).map((n) => clampInt(n, 0, 3, 0));
  }
  if (raw.plan && typeof raw.plan === "object") {
    const id = /^[a-z][a-z0-9-]{1,40}$/;
    s.plan.gameId =
      typeof raw.plan.gameId === "string" && id.test(raw.plan.gameId) ? raw.plan.gameId : "";
    s.plan.skillId =
      typeof raw.plan.skillId === "string" && id.test(raw.plan.skillId) ? raw.plan.skillId : "";
    s.plan.routine = ROUTINES.includes(raw.plan.routine) ? raw.plan.routine : "quick";
  }
  s.narrate = raw.narrate === true;
  return s;
}

/** The first Family Math Adventure kept {path, grade, stop, done[], view}. Keep the grade and what was finished. */
export function migrateLegacy(old) {
  const s = fresh();
  if (!old || typeof old !== "object" || !GRADES.includes(old.grade)) return s;
  s.grade = old.grade;
  s.done[0] = true;
  s.screen = old.path === "explore" || old.view === "explore" ? "free" : "stop";
  s.stop = old.view === "end" ? 4 : 1;
  return s;
}

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};

export function load() {
  const saved = read(KEY);
  if (saved) return sanitize(saved);
  const legacy = read(LEGACY_KEY);
  return legacy ? migrateLegacy(legacy) : fresh();
}

let warned = false;
export function save(state, onFail) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    if (!warned && onFail) onFail();
    warned = true;
  }
}

export function readLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (MODES.includes(saved)) return saved;
    if (JSON.parse(localStorage.getItem(FLUENCY_LANG_KEY) || '"en"') === "es") return "es";
  } catch {}
  return /^es\b/i.test(navigator.language || "") ? "es" : "en";
}
export function shareLang(mode) {
  try {
    localStorage.setItem(LANG_KEY, mode);
    // The Fluency Lab only knows English and Spanish; "both" keeps its English chrome.
    localStorage.setItem(FLUENCY_LANG_KEY, JSON.stringify(mode === "es" ? "es" : "en"));
  } catch {}
}

/** Which Lab learner slot this device is using, so links open on the same learner. */
export function activeProfile() {
  try {
    const stored = JSON.parse(localStorage.getItem("ewl-fluency-profiles-v1") || "{}");
    return Number.isInteger(stored.active) && stored.active >= 0 && stored.active < 6
      ? stored.active
      : 0;
  } catch {
    return 0;
  }
}

// ---- DOM builders ---------------------------------------------------------------------------------------------
export function h(tag, attrs, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") n.className = v;
    else if (k === "data") Object.assign(n.dataset, v);
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) n.append(kid);
  return n;
}
export function svg(markup, className, label) {
  const wrap = document.createElement("span");
  wrap.className = className || "art";
  wrap.innerHTML = markup;
  const el = wrap.firstElementChild;
  if (label) {
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", label);
  } else el.setAttribute("aria-hidden", "true");
  el.setAttribute("focusable", "false");
  return wrap;
}
export function se(tag, attrs, ...kids) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) if (v != null) n.setAttribute(k, v);
  for (const kid of kids.flat()) if (kid != null) n.append(kid);
  return n;
}

/** Language-aware text helpers, bound to a getter for the current mode. */
export function langKit(getMode) {
  const one = () => (getMode() === "es" ? "es" : "en");
  const bi = (tag, pair, className) => {
    const n = h(tag, { class: className });
    const m = getMode();
    if (m === "es") {
      n.lang = "es";
      n.textContent = pair.es;
      return n;
    }
    n.append(pair.en);
    if (m === "bi") n.append(h("span", { class: "es", lang: "es" }, pair.es));
    return n;
  };
  const plain = (pair) => {
    const m = getMode();
    return m === "es" ? pair.es : m === "bi" ? `${pair.en} / ${pair.es}` : pair.en;
  };
  /** Text for one language only (for aria-labels and live regions). */
  const only = (pair) => pair[one()];
  return { one, bi, plain, only };
}
