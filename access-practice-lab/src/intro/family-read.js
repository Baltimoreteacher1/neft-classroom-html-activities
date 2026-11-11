// "Hear the steps" on Practice Together: reads one card's three steps aloud with the lab's speech helpers (speech.js),
// in the language on screen. Español reads the Spanish with a Spanish voice; English + Español reads the Spanish when
// the device's own language is Spanish, else the English. One reading at a time (any other speech stops first);
// pressing again stops it, a re-render stops it, and the lab stops all speech when the page changes (main.js).
// The button is rendered hidden and shown on mount only when the browser can speak.
import { canSpeak, speak, speakSpanish, stop } from "../speech.js";
import { html, icon } from "../util.js";

export const READ_LABELS = {
  hear: { en: "Hear the steps", es: "Escuchar los pasos" },
  stop: { en: "Stop reading", es: "Dejar de leer" },
  noVoice: {
    en: "This device has no Spanish voice, so the steps cannot be read aloud in Spanish.",
    es: "Este dispositivo no tiene una voz en español, así que no se pueden leer los pasos en español.",
  },
};

let reading = ""; // the card id being read, or ""

/** The language the steps are read in for a language mode ("en" | "es" | "bi"). */
export function readLang(mode, deviceLang = globalThis.navigator?.language || "en") {
  if (mode === "es") return "es";
  if (mode === "bi") return /^es\b/i.test(deviceLang) ? "es" : "en";
  return "en";
}

/** The sentences read for a card: each step's head and body, in one language. */
export const stepLines = (steps, lang) => steps.map((s) => `${s.head[lang]}. ${s.body[lang]}`);

/** The button and its status line for one card. `I` is the page's i18n; `id` names the card. */
export function readButtonHTML(I, id, title) {
  return html`<div class="tg-read" data-tg-read-box="${id}" hidden>
    <button type="button" class="btn tg-read-btn" data-tg-read="${id}" aria-pressed="false">
      ${icon("volume")}<span class="tg-read-hear">${I.TO(READ_LABELS.hear)}</span
      ><span class="tg-read-stop">${I.TO(READ_LABELS.stop)}</span
      ><span class="visually-hidden">: ${I.TO(title)}</span>
    </button>
    <p class="fine tg-read-status" role="status" data-tg-read-status></p>
  </div>`;
}

const show = (btn, on) => btn.setAttribute("aria-pressed", String(on));

/**
 * A click on a "Hear the steps" button. `stepsFor(id)` returns that card's steps ({ head, body } pairs).
 * Returns true when the click was one of these buttons.
 */
export function onReadClick(e, mode, stepsFor) {
  const btn = e.target.closest?.("[data-tg-read]");
  if (!btn) return false;
  const id = btn.dataset.tgRead;
  const status = btn.parentElement?.querySelector("[data-tg-read-status]");
  if (status) status.textContent = "";
  const again = reading === id;
  reading = "";
  stop();
  for (const b of document.querySelectorAll("[data-tg-read]")) show(b, false);
  if (again) return true;
  const lang = readLang(mode);
  reading = id;
  show(btn, true);
  const lines = stepLines(stepsFor(id), lang);
  (lang === "es" ? speakSpanish(lines) : speak(lines, { lang: "en-US", rate: 0.9 })).then(
    (result) => {
      if (result === "no-voice" && status) status.textContent = READ_LABELS.noVoice[lang];
      if (reading !== id) return;
      reading = "";
      show(btn, false);
    },
  );
  return true;
}

/** Show the buttons when the browser can speak; a re-render drops any reading that was going on. */
export function mountRead(root = document) {
  if (reading) {
    reading = "";
    stop();
  }
  if (!canSpeak()) return;
  for (const box of root.querySelectorAll("[data-tg-read-box]")) box.hidden = false;
}

export function unmountRead() {
  if (reading) stop();
  reading = "";
}
