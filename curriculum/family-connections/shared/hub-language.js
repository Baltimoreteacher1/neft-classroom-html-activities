/* =============================================================================
 * shared/hub-language.js — which language the weekly hub opens in, and how the
 * family's choice reaches the lesson pages.
 * -----------------------------------------------------------------------------
 * The lesson pages keep a family's language in localStorage `hw_lang_mode`
 * ('en' | 'es' | 'bilingual'; scripts/homework-guided-notes.mjs
 * `setLanguageMode` / `preferredLanguageMode`). The hub reads AND writes that
 * same key, so a family that picked Español once is in Español on every page.
 *
 * Order of authority, strongest first:
 *   1. `?lang=en|es` in the address      (a shared link is a choice)
 *   2. `hw_lang_mode` 'en' | 'es'        (chosen on a lesson page or here)
 *   3. the hub's own saved choice        (older visits)
 *   4. a Spanish browser                 (a default, NOT a choice)
 *   5. English
 *
 * `chosen` is what decides whether links carry `lang=`: a family that never
 * chose keeps whatever the lesson page decides for itself.
 *
 * Pure functions over an injected storage — nothing here touches the DOM.
 * ========================================================================== */

export const LANG_MODE_KEY = "hw_lang_mode";
const isLang = (value) => value === "en" || value === "es";

export function resolveHubLanguage({
  queryLang = "",
  storedMode = "",
  saved = {},
  browserLanguages = [],
} = {}) {
  if (isLang(queryLang)) return { language: queryLang, chosen: true };
  if (isLang(storedMode)) return { language: storedMode, chosen: true };
  if (saved.languageChosen === true && isLang(saved.language))
    return { language: saved.language, chosen: true };
  // Before the hub recorded choices it wrote 'en' on every first render, so only
  // a saved 'es' can be trusted as something a person did.
  if (saved.language === "es") return { language: "es", chosen: true };
  const spanish = browserLanguages.some((item) => String(item).toLowerCase().startsWith("es"));
  return { language: spanish ? "es" : "en", chosen: false };
}

/** Read `hw_lang_mode` without ever throwing (private windows, blocked storage). */
export function readLanguageMode(storage) {
  try {
    return storage?.getItem(LANG_MODE_KEY) || "";
  } catch {
    return "";
  }
}

/** Record an explicit choice where the lesson pages will find it. */
export function writeLanguageMode(storage, language) {
  if (!isLang(language)) throw new RangeError(`unsupported language "${language}"`);
  try {
    storage?.setItem(LANG_MODE_KEY, language);
    return true;
  } catch {
    return false;
  }
}
