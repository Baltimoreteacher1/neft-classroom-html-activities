// English and Spanish for Family Math 2.0. Copy is {en, es}; there is no English-key lookup, so a missing Spanish
// string is a visible test failure rather than a quiet fallback. The language choice is the Fluency Lab's own
// (ewl-fluency-lang-v1), so it follows the learner across the whole lab. @fm2 FM-020 FM-021
// Light on purpose: the full i18n module drags in the ~100 KB Game Room dictionaries and the legacy school tools, none of
// which Family Math reads. The key and the stored shape ("en" / "es" as JSON) are the same, so the choice is shared.
const KEY = "ewl-fluency-lang-v1";
let current = null;

export function getLang() {
  if (current === null) {
    try {
      current = JSON.parse(localStorage.getItem(KEY)) === "es" ? "es" : "en";
    } catch {
      current = "en";
    }
  }
  return current;
}

export function setLang(next, { persist = true } = {}) {
  current = next === "es" ? "es" : "en";
  if (persist) {
    try {
      localStorage.setItem(KEY, JSON.stringify(current));
    } catch {
      /* a browser that cannot save still switches language for this visit */
    }
  }
  if (typeof document !== "undefined") document.documentElement.lang = current;
}

export const LANGS = ["en", "es"];

// Resolve a copy value: a plain string is language-neutral (numbers, symbols); {en, es} picks by language.
export function L(copy, lang = getLang()) {
  if (copy == null) return "";
  if (typeof copy === "string" || typeof copy === "number") return String(copy);
  return copy[lang] ?? copy.en ?? "";
}

export const fmt = (template, vars = {}) => String(template).replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));

export const tx = (copy, lang, vars) => fmt(L(copy, lang), vars);

// Every leaf of a copy object must carry both languages; returns the dotted paths of the ones that do not.
export function missingLanguages(copy, path = "") {
  if (copy == null || typeof copy === "string" || typeof copy === "number") return [];
  if ("en" in copy || "es" in copy) {
    const gaps = [];
    for (const lang of LANGS) if (typeof copy[lang] !== "string" || !copy[lang].trim()) gaps.push(`${path}.${lang}`);
    return gaps;
  }
  return Object.entries(copy).flatMap(([key, value]) => missingLanguages(value, path ? `${path}.${key}` : key));
}

export const escapeHtml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
