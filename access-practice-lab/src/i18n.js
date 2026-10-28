// Language modes for the whole lab: English, Español, or both (bilingual).
//
// One preference (`prefs.lang`: "en" | "es" | "bi") drives every localized surface. Copy comes from two
// places only: pairs written at the call site, T("English", "Español"), and the keyed dictionary in
// strings.js, L("hub.title"). tools/access-i18n.test.mjs keeps every key bilingual.
//
//   T / L  → markup-safe. English or Spanish mode returns a string; bilingual mode returns raw markup
//            with the Spanish in its own lang="es" span. Use inside html`` templates.
//   S / LS → always a plain string ("English / Español" when bilingual). Use for aria-label, title,
//            placeholder, textContent and anywhere markup would be wrong.
//
// Practice content (passages, questions, answer choices) is English-language practice and never
// changes with this setting. Only the chrome, directions help and family guidance do.
import { esc, raw } from "./util.js";
import { STRINGS } from "./strings.js";

export const LANG_MODES = ["en", "es", "bi"];
export const DEFAULT_LANG = "en";
export const langMode = (prefs) => (LANG_MODES.includes(prefs?.lang) ? prefs.lang : DEFAULT_LANG);

/** Views whose entire chrome is localized. Elsewhere the page stays lang="en" and Spanish is marked inline. */
const FULLY_LOCALIZED = new Set(["family"]);
export const docLang = (view, mode) => (mode === "es" && FULLY_LOCALIZED.has(view) ? "es" : "en");

// A var may be one value or { en, es } when the filled text differs by language (a learning goal, a count word).
const fill = (text, vars, lang) =>
  String(text).replace(/\{(\w+)\}/g, (match, key) => {
    if (!(key in vars)) return match;
    const v = vars[key];
    return String(v && typeof v === "object" ? (v[lang] ?? v.en) : v);
  });

/** i18n bound to one language mode and the page's document language. */
export function makeI18n(mode = DEFAULT_LANG, pageLang = "en") {
  const bilingual = mode === "bi";
  const spanish = mode === "es";
  const wrapEs = spanish && pageLang !== "es"; // Spanish chrome on an English page still needs lang="es"

  const S = (en, es) => (bilingual && es && es !== en ? `${en} / ${es}` : spanish && es ? es : en);
  const T = (en, es) => {
    if (!es || es === en) return en;
    if (bilingual) return raw(`<span class="bi-pair">${esc(en)}<span class="bi-es" lang="es">${esc(es)}</span></span>`);
    if (spanish) return wrapEs ? raw(`<span lang="es">${esc(es)}</span>`) : es;
    return en;
  };
  const entry = (key) => {
    const e = STRINGS[key];
    if (!e) throw new Error(`Missing string "${key}"`);
    return e;
  };
  // Dictionary entries use {name} placeholders. T escapes the filled text, so vars need no escaping here.
  const L = (key, vars = {}) => {
    const e = entry(key);
    return T(fill(e.en, vars, "en"), fill(e.es, vars, "es"));
  };
  const LS = (key, vars = {}) => {
    const e = entry(key);
    return S(fill(e.en, vars, "en"), fill(e.es, vars, "es"));
  };
  /** One entry as { en, es }, filled. Pass it as a var to embed one phrase inside another in both languages. */
  const pair = (key, vars = {}) => {
    const e = entry(key);
    return { en: fill(e.en, vars, "en"), es: fill(e.es, vars, "es") };
  };
  /** Pick one side of a bilingual object { en, es } (family content JSON). */
  const pick = (o) => (o && typeof o === "object" ? (spanish ? o.es || o.en : o.en) : o);
  /** Both sides of { en, es } as markup honoring the mode. */
  const TO = (o) => (o && typeof o === "object" ? T(o.en, o.es) : o);
  return { mode, bilingual, spanish, pageLang, T, S, L, LS, pair, pick, TO };
}

/** i18n for a render ctx: the mode from prefs, the document language from the current view. */
export const i18nFor = (ctx) => {
  const mode = langMode(ctx.prefs);
  return makeI18n(mode, docLang(ctx.route?.view, mode));
};

export const LANG_LABELS = {
  en: { short: "EN", full: "English", name: "English" },
  es: { short: "ES", full: "Español", name: "Español" },
  bi: { short: "EN+ES", full: "English + Español", name: "English and Español (bilingual)" },
};

/** The three-way language control. `large` shows full words (family hub); the default is the compact header form. */
export function langSwitchHTML(mode, { large = false, idPrefix = "" } = {}) {
  const buttons = LANG_MODES.map((m) => {
    const label = LANG_LABELS[m];
    const lang = m === "es" ? 'lang="es"' : "";
    return `<button type="button" class="lang-btn" data-lang-mode="${m}" ${idPrefix ? `id="${idPrefix}-${m}"` : ""} aria-pressed="${m === mode}" ${lang} aria-label="${esc(label.name)}"><span aria-hidden="true">${esc(large ? label.full : label.short)}</span></button>`;
  }).join("");
  return raw(
    `<div class="lang-switch${large ? " lang-switch-large" : ""}" role="group" aria-label="Language / Idioma">${buttons}</div>`,
  );
}
