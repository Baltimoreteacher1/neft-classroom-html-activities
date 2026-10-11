// English / Spanish for the learner-facing Game Room and trail. English text is the key, so a string with no
// Spanish entry simply stays in English. Placeholders look like {name} and are filled from `vars`.
import { ES } from "./i18n-es.js";
import { readLocal, writeLocal } from "./school-tools.js";

const KEY = "ewl-fluency-lang-v1";
let lang = null;

export const getLang = () => {
  if (lang === null) lang = readLocal(KEY, "en") === "es" ? "es" : "en";
  return lang;
};

export function setLang(next) {
  lang = next === "es" ? "es" : "en";
  writeLocal(KEY, lang);
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
