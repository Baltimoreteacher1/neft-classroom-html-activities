// The language a learner chose, remembered on the device. Its own small module so a screen can ask "English or
// Spanish?" without loading the Spanish dictionaries (i18n.js), which are most of the first screen's weight.
import { readLocal, writeLocal } from "./school-tools.js";

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
