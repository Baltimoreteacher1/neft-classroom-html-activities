// Small shared controls for the vocabulary views.
import { announce, h } from "../../core/dom.js";
import { canSpeak, speak } from "../../core/speech.js";

let n = 0;
export const uid = (p = "v") => `st-${p}-${++n}`;

const SPEAKER =
  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>';

/** Pronunciation button. `text` is what is spoken; `lang` en-US or es-US. The spoken text is also the transcript. */
export function speakButton(text, { label, lang = "en-US", rate, cls = "" } = {}) {
  const b = h("button", { class: `st-v-icon-btn ${cls}`.trim(), type: "button", "aria-label": label || `Hear ${text}`, html: SPEAKER });
  b.addEventListener("click", async () => {
    if (!canSpeak()) return announce("Audio is not available in this browser. Read the pronunciation guide instead.");
    b.setAttribute("aria-pressed", "true");
    await speak(text, { lang, rate });
    b.removeAttribute("aria-pressed");
  });
  return b;
}

export const chip = (text, cls = "") => h("span", { class: `st-v-chip ${cls}`.trim() }, text);

export const reviewBadge = () => h("span", { class: "st-v-chip st-v-chip-review", title: "A teacher or translator has not yet checked this translation." }, "Needs review");

/** Disclosure button + panel pair. Returns { button, panel, set(open) }. */
export function disclosure({ label, openLabel, panelId, open = false, aria = null, onToggle = null }) {
  const button = h("button", { class: "st-v-btn st-v-quiet", type: "button", "aria-expanded": String(open), "aria-controls": panelId });
  const panel = h("div", { id: panelId, hidden: !open });
  const paint = (o) => {
    button.setAttribute("aria-expanded", String(o));
    button.textContent = o ? openLabel : label;
    if (aria) button.setAttribute("aria-label", aria(o));
    panel.hidden = !o;
    onToggle?.(o);
  };
  button.addEventListener("click", () => paint(button.getAttribute("aria-expanded") !== "true"));
  paint(open);
  return { button, panel, set: paint };
}

export const field = (label, body, cls = "") => h("div", { class: `st-v-field ${cls}`.trim() }, h("h4", { class: "st-v-field-label" }, label), typeof body === "string" ? h("p", {}, body) : body);
