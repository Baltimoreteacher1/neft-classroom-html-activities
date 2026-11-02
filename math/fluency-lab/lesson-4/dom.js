// Small shared helpers for the mini-lesson player (no learner-facing strings here).
export const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

// A { en, es } pair in the learner's language; a pair with no Spanish falls back to English.
export const pick = (pair, lang) => (pair ? (lang === "es" && pair.es ? pair.es : pair.en) : "");

export const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// The numbers a problem shows, for a graphic or animation that wants the givens (never the answer).
export const givens = (question) => (String(question).replaceAll(",", "").match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
