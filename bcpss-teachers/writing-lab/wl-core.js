// BCPSS Writing Lab — shared state, persistence and small UI helpers.
// Content contract: db/seeds/bcpss/v2/writing-schema.mjs. Data: GET /api/bcpss/units/<unitId> → detail.writing.
import {
  LEVEL_INFO,
  announce,
  h,
  shuffle,
  storeGet,
  storeSet,
  tts,
  ttsAvailable,
  wordCount,
} from "../language-studio/studio-core.js";

export { LEVEL_INFO, announce, h, shuffle, tts, ttsAvailable, wordCount };

export const wl = {
  unitId: "",
  unit: null,
  studio: null,
  w: null,
  level: "l3_4",
  state: null,
  rerender: () => {},
};

const key = () => `bcpss-writing:${wl.unitId}`;
export function loadState() {
  const saved = storeGet(key());
  return saved && typeof saved === "object" ? saved : {};
}
let saveTimer = 0;
/** Patch a section of state and persist (debounced; flushed on pagehide). */
export function save(section, patch) {
  wl.state[section] = { ...(wl.state[section] || {}), ...patch };
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(flush, 250);
}
export function flush() {
  window.clearTimeout(saveTimer);
  storeSet(key(), wl.state);
}
window.addEventListener("pagehide", () => flush());

export const get = (section) => wl.state[section] || {};
export const markDone = (step) => save("done", { [step]: true });
export const isDone = (step) => Boolean(get("done")[step]);

export const lessonTitle = (id) => wl.w.lessons.find((l) => l.id === id)?.title || "";
/** "From lesson: Parts of a wave" tag. */
export const lessonTag = (id) =>
  id
    ? h(
        "span",
        { class: "wl-lesson" },
        h("span", { class: "wl-lesson__k" }, "From lesson"),
        lessonTitle(id),
      )
    : null;

/** Speaker button that reads `text` aloud (hidden when speech is unavailable). */
export function speakBtn(text, label = "Listen") {
  if (!ttsAvailable()) return null;
  return h(
    "button",
    {
      type: "button",
      class: "st-btn st-btn--ghost st-btn--sm wl-speak",
      "aria-label": `${label}: read aloud`,
      onclick: () => tts(typeof text === "function" ? text() : text),
    },
    speakerIcon(),
    label,
  );
}
export function speakerIcon() {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 20 20");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("aria-hidden", "true");
  const p = document.createElementNS(ns, "path");
  p.setAttribute("d", "M3 8h3l4-3v10l-4-3H3zM13 7.5a3.5 3.5 0 0 1 0 5M15 5a7 7 0 0 1 0 10");
  p.setAttribute("fill", "none");
  p.setAttribute("stroke", "currentColor");
  p.setAttribute("stroke-width", "1.7");
  p.setAttribute("stroke-linecap", "round");
  p.setAttribute("stroke-linejoin", "round");
  svg.append(p);
  return svg;
}

let uid = 0;
/** Labelled text box bound to state[section][field]. */
export function textBox({
  section,
  field,
  label,
  hint,
  rows = 2,
  placeholder = "",
  prefix = "",
  onInput,
}) {
  const id = `wl-f${++uid}`;
  const area = h("textarea", {
    id,
    class: "wl-input",
    rows: String(rows),
    placeholder,
    spellcheck: "true",
    autocomplete: "off",
  });
  area.value = get(section)[field] || "";
  area.addEventListener("input", () => {
    save(section, { [field]: area.value });
    onInput?.(area.value);
  });
  return h(
    "div",
    { class: "wl-field" },
    h("label", { for: id, class: "wl-field__label" }, label),
    hint ? h("p", { class: "wl-field__hint" }, hint) : null,
    prefix
      ? h("div", { class: "wl-field__row" }, h("span", { class: "wl-field__prefix" }, prefix), area)
      : area,
  );
}

/** Inserts text at the caret of the most recently focused writing box. */
let lastBox = null;
document.addEventListener("focusin", (e) => {
  if (e.target instanceof HTMLTextAreaElement && e.target.classList.contains("wl-input"))
    lastBox = e.target;
});
export function insertWord(word) {
  const box =
    lastBox && document.body.contains(lastBox) ? lastBox : document.querySelector(".wl-input");
  if (!box) return;
  const start = box.selectionStart ?? box.value.length;
  const end = box.selectionEnd ?? start;
  const before = box.value.slice(0, start);
  const pad = before && !/\s$/.test(before) ? " " : "";
  box.value = `${before}${pad}${word} ${box.value.slice(end)}`;
  const caret = before.length + pad.length + word.length + 1;
  box.focus();
  box.setSelectionRange(caret, caret);
  box.dispatchEvent(new Event("input", { bubbles: true }));
}
/** Word bank chips that insert into the active writing box. */
export function wordBank(words, label = "Word bank") {
  // Each word is a string or { text, es } — `es` shows a small home-language gloss; the English word is inserted.
  return h(
    "div",
    { class: "wl-bank", role: "group", "aria-label": label },
    h("span", { class: "wl-bank__label" }, label),
    ...words.map((wd) => {
      const text = typeof wd === "string" ? wd : wd.text;
      const es = typeof wd === "string" ? "" : wd.es;
      return h(
        "button",
        {
          type: "button",
          class: `st-chip wl-bank__chip${es ? " wl-bank__chip--es" : ""}`,
          "aria-label": es ? `${text} (en español: ${es})` : null,
          onclick: () => insertWord(text),
        },
        h("span", null, text),
        es ? h("span", { class: "wl-bank__es", lang: "es", "aria-hidden": "true" }, es) : null,
      );
    }),
  );
}

/** "Word help": the unit's words with icon, kid definition and Spanish term (home-language support on every step). */
export function wordHelp() {
  const vocab = wl.studio?.vocab || [];
  if (!vocab.length) return null;
  return h(
    "details",
    { class: "wl-help" },
    h("summary", null, "Word help", h("span", { "aria-hidden": "true" }, "·"), h("span", { lang: "es" }, "Ayuda con palabras")),
    h(
      "dl",
      { class: "wl-help__list" },
      ...vocab.flatMap((v) => [
        h("dt", null, v.icon ? h("span", { "aria-hidden": "true" }, `${v.icon} `) : null, v.term, v.es ? h("span", { class: "wl-help__es", lang: "es" }, ` · ${v.es}`) : null),
        h("dd", null, v.def),
      ]),
    ),
  );
}

/** Feedback line (polite live region per step). */
export function feedback() {
  const el = h("p", { class: "st-feedback wl-fb", role: "status", "aria-live": "polite" });
  el.set = (msg, tone = "ok") => {
    el.textContent = msg;
    el.dataset.tone = tone;
  };
  return el;
}

/** Collapsible "Compare with a model" panel, unlocked once `ready()` is true. */
export function modelReveal(
  modelText,
  ready,
  { label = "Compare with a model", note = "Write first, then compare." } = {},
) {
  const body = h(
    "div",
    { class: "wl-model__body", hidden: true },
    h("p", { class: "wl-model__text" }, modelText),
    speakBtn(modelText, "Hear it"),
  );
  const btn = h(
    "button",
    { type: "button", class: "st-btn st-btn--sm wl-model__btn", "aria-expanded": "false" },
    label,
  );
  const msg = h("span", { class: "wl-model__note" });
  btn.addEventListener("click", () => {
    if (!ready()) {
      msg.textContent = note;
      return;
    }
    msg.textContent = "";
    const open = body.hidden;
    body.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
  });
  return h("div", { class: "wl-model" }, h("div", { class: "wl-model__bar" }, btn, msg), body);
}

/** Simple sentence checks shared by steps (forgiving; never block). */
export const capitalStart = (s) => /^\s*["']?[A-Z0-9]/.test(s);
export const endMark = (s) => /[.!?]["']?\s*$/.test(s);
export const startsWithWord = (s, w) =>
  String(s).trim().toLowerCase().startsWith(String(w).toLowerCase());
export const sentenceCount = (t) =>
  String(t || "")
    .split(/(?<=[.!?])\s+/)
    .filter((x) => wordCount(x) > 1).length;

export function levelName() {
  return LEVEL_INFO[wl.level]?.name || "Core";
}
export const byLevel = (o) => o?.[wl.level] ?? o?.l3_4 ?? "";
export const isStarter = () => wl.level === "l1_2";
export const isStretch = () => wl.level === "l5_6";
export const seed = (s) => `${wl.unitId}:${s}`;
export { shuffle as shuffleSeeded };
