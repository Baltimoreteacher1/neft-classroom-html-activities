// Interface languages. A language is one file in ./lang that exports a `strings` object with the same keys as
// en.js; add the file and one line in LANGS to add a language. Missing keys fall back to English, and
// tools/family-tour.test.mjs fails if any language lacks a key that English has.
import en from "./lang/en.js";
import es from "./lang/es.js";

export const LANGS = [
  { code: "en", label: "English", speech: "en-US", strings: en },
  { code: "es", label: "Español", speech: "es-US", strings: es },
];

let current = "en";

export const setLang = (code) => {
  current = LANGS.some((l) => l.code === code) ? code : "en";
  document.documentElement.lang = current;
  return current;
};
export const getLang = () => current;
export const speechLang = (code = current) => LANGS.find((l) => l.code === code)?.speech || "en-US";

const dig = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

/** t("welcome.title") or t("kit.minutes", { n: 10 }). Arrays and objects come back as they are. */
export function t(path, vars) {
  const lang = LANGS.find((l) => l.code === current) || LANGS[0];
  let value = dig(lang.strings, path);
  if (value == null) value = dig(LANGS[0].strings, path);
  if (value == null) return path;
  if (typeof value !== "string" || !vars) return value;
  return value.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/** Both languages of one string, for a screen reader that must read English words inside Spanish text. */
export const tIn = (code, path) => {
  const lang = LANGS.find((l) => l.code === code) || LANGS[0];
  return dig(lang.strings, path) ?? dig(LANGS[0].strings, path) ?? path;
};

export const allKeys = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" && !Array.isArray(v) ? allKeys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
