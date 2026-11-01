// English / Spanish for the learner-facing Game Room and trail. English text is the key, so a string with no
// Spanish entry simply stays in English. Placeholders look like {name} and are filled from `vars`.
import { ES as ES_BASE } from "./i18n-es.js";
import { ES_MODELS } from "./i18n-es-models.js";
import { ES_WORLDS } from "./i18n-es-worlds.js";
import { ES_STUDIO } from "./i18n-es-studio.js";
import { ES_COMPETITOR, ES_SHOP_TEAMS } from "./i18n-es-competitor.js";
import { ES_DUEL } from "./i18n-es-duel.js";
import { ES_MOBY_FACTS } from "./moby/i18n-es-facts.js";
import { ES_MOBY_QUESTS } from "./moby/i18n-es-quests.js";
import { ES_MOBY_INTERVENTION } from "./moby/i18n-es-intervention.js";
import { ES_MOBY_STRATEGIES } from "./moby/i18n-es-strategies.js";
import { readLocal, writeLocal } from "./school-tools.js";

export const ES = {
  ...ES_STUDIO,
  ...ES_BASE,
  ...ES_MODELS,
  ...ES_WORLDS,
  ...ES_COMPETITOR,
  ...ES_SHOP_TEAMS,
  ...ES_DUEL,
  ...ES_MOBY_FACTS,
  ...ES_MOBY_QUESTS,
  ...ES_MOBY_INTERVENTION,
  ...ES_MOBY_STRATEGIES,
};
const KEY = "ewl-fluency-lang-v1";
let lang = null;

export const getLang = () => {
  if (lang === null) lang = readLocal(KEY, "en") === "es" ? "es" : "en";
  return lang;
};

export function setLang(next, { persist = true } = {}) {
  lang = next === "es" ? "es" : "en";
  if (persist) writeLocal(KEY, lang);
  if (typeof document !== "undefined") document.documentElement.lang = lang;
}

export function t(text, vars = null) {
  const base = getLang() === "es" && ES[text] !== undefined ? ES[text] : text;
  return vars ? base.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match)) : base;
}

// Translate static markup: elements marked data-i18n take their English text as the key.
export function translatePage(root = document) {
  for (const element of root.querySelectorAll("[data-i18n]")) {
    element.dataset.i18nEn ||= element.textContent.trim();
    element.textContent = t(element.dataset.i18nEn);
  }
  document.documentElement.lang = getLang();
}
