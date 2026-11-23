// WidaLevels.js — the six WIDA English language proficiency level names, the three practice groups the
// game UI shows, and how a chosen level changes SUPPORT (never the academic thinking asked for).
//
// Honesty rules (PLATFORM.md): the level here is a PRACTICE TARGET the learner or teacher picks. It is not
// a test result, not an ACCESS score and not a placement. It maps onto the lab's existing support modes
// (A Starting, B Growing, C Expanding) so every scaffold, hint count and tier label stays consistent.

export const WIDA_LEVELS = Object.freeze([
  { n: 1, id: "entering", en: "Entering", es: "Ingresando" },
  { n: 2, id: "emerging", en: "Emerging", es: "Emergiendo" },
  { n: 3, id: "developing", en: "Developing", es: "Desarrollando" },
  { n: 4, id: "expanding", en: "Expanding", es: "Expandiendo" },
  { n: 5, id: "bridging", en: "Bridging", es: "Conectando" },
  { n: 6, id: "reaching", en: "Reaching", es: "Alcanzando" },
]);

export const LEVEL_GROUPS = Object.freeze([
  { id: "scaffolded", levels: [1, 2], support: "A", en: "Scaffolded", es: "Con andamiaje" },
  {
    id: "developing-independence",
    levels: [3, 4],
    support: "B",
    en: "Developing Independence",
    es: "Independencia en desarrollo",
  },
  {
    id: "advanced",
    levels: [5, 6],
    support: "C",
    en: "Advanced Language Use",
    es: "Uso avanzado del lenguaje",
  },
]);

export const LEVEL_NOTE = Object.freeze({
  en: "Your practice level is a choice you can change any time. It sets how much help is offered. It is not a test score.",
  es: "Tu nivel de práctica es una elección que puedes cambiar cuando quieras. Define cuánta ayuda se ofrece. No es una calificación de examen.",
});

export const clampLevel = (n) => Math.min(6, Math.max(1, Math.round(Number(n)) || 1));
export const levelOf = (n) => WIDA_LEVELS[clampLevel(n) - 1];
export const groupOfLevel = (n) =>
  LEVEL_GROUPS.find((g) => g.levels.includes(clampLevel(n))) || LEVEL_GROUPS[0];
/** The lab support mode (A/B/C) a practice level uses. */
export const supportOfLevel = (n) => groupOfLevel(n).support;
/** A level to start from when only a support mode is known (the middle of its group, rounded down). */
export const levelOfSupport = (support) =>
  (LEVEL_GROUPS.find((g) => g.support === support) || LEVEL_GROUPS[0]).levels[0];

/**
 * What a level changes. `textDemand` and `production` shape the language; `hintLayers` is how many scaffold
 * layers can be opened; `eliminate` and `glossShown` are the supports. `rigor` is constant on purpose: the
 * academic thinking required never drops with the level.
 */
export function levelProfile(n) {
  const level = clampLevel(n);
  const group = groupOfLevel(level);
  return Object.freeze({
    level,
    group: group.id,
    support: group.support,
    textDemand: level <= 2 ? "short" : level <= 4 ? "medium" : "long",
    production: level <= 2 ? "word-or-phrase" : level <= 4 ? "sentence" : "paragraph",
    hintLayers: level <= 2 ? 3 : level <= 4 ? 2 : 1,
    eliminate: level <= 4,
    glossShown: level <= 2 ? "show" : level <= 4 ? "tap" : "off",
    framesShown: level <= 2 ? "full" : level <= 4 ? "starter" : "none",
    audioAuto: level <= 2,
    rigor: "grade-level",
  });
}
