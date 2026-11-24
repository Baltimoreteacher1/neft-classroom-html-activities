// Shared helpers for the Family Guide: escaping, bilingual markup, safe storage and read-aloud.
// Every bilingual string renders BOTH languages once; CSS (html[data-view]) decides which one shows,
// so switching language never re-renders the page and never loses a checked box.

export const VIEWS = ["en", "es", "both"];
const SAY_LANG = { en: "en-US", es: "es-US" };

export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}

/** "[word]" or "___" in a sentence starter becomes a visible blank. */
const withBlanks = (html) => html.replace(/\[([^\]]+)\]/g, '<span class="fb-blank">$1</span>').replace(/___/g, '<span class="fb-blank">&nbsp;&nbsp;&nbsp;&nbsp;</span>');
const spoken = (text) => String(text).replace(/\[[^\]]+\]|___/g, "…");

export function sayButton(text, lang, label) {
  return `<button type="button" class="fb-say" data-say="${esc(spoken(text))}" data-say-lang="${SAY_LANG[lang]}" aria-label="${esc(label)}"><span aria-hidden="true">🔊</span></button>`;
}

/**
 * Markup for a {en, es} pair (or a plain English string). Options: blanks (highlight [slots]), lead (bold label pair),
 * speak ({en: label, es: label}: add a read-aloud button to each language), cls.
 * A missing Spanish side renders English once (class fb-only) and shows an "EN" tag in Spanish view.
 */
export function bi(value, { blanks = false, speak = null, cls = "", lead = null } = {}) {
  if (value == null) return "";
  const pair = typeof value === "string" ? { en: value, es: null } : value;
  const one = (lang, text, extra = "") => {
    const body = blanks ? withBlanks(esc(text)) : esc(text);
    const btn = speak ? sayButton(text, lang, speak[lang]) : "";
    const label = lead ? `<strong class="fb-label">${esc(lead[lang])}</strong>` : "";
    const cls2 = speak ? `${extra} has-say` : extra;
    return `<span class="fb-${lang}${cls2}" lang="${lang}"><span class="fb-text">${label}${body}</span>${btn}</span>`;
  };
  if (!pair.es) return `<span class="fb-pair ${cls}">${one("en", pair.en ?? "", " fb-only")}</span>`;
  return `<span class="fb-pair ${cls}">${one("en", pair.en ?? "")}${one("es", pair.es)}</span>`;
}

/** Two parallel arrays ({en:[..], es:[..]}) as one list whose items are bilingual pairs. */
export function biList(arrays, tag = "ul", cls = "", itemOpts = {}) {
  const en = arrays?.en || [];
  const es = arrays?.es || [];
  return `<${tag} class="${cls}">${en.map((t, i) => `<li>${bi({ en: t, es: es[i] || null }, itemOpts)}</li>`).join("")}</${tag}>`;
}

export function store() {
  return {
    get(key, fallback = null) {
      try {
        const raw = window.localStorage.getItem(key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* storage blocked: the page still works, it just forgets */
      }
    },
  };
}

export function speak(text, lang) {
  const synth = window.speechSynthesis;
  if (!synth || !text) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.9;
  synth.speak(u);
}

export const canSpeak = () => "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
