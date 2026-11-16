// Reading voice: one panel, reachable from the header and from any "Read to me" spot, where a learner picks the
// voice that reads aloud (English and Spanish) and how fast. The choice is saved on this device (prefs.readingVoice,
// prefs.readingVoiceEs, prefs.rate) and speech.js applies it to every read-aloud button on the site.
// Voices come from the device itself (nothing is sent anywhere), so the list differs by device; "Automatic" always works.
import { canSpeak, getVoiceOptions, setVoiceDefaults, speak, stop } from "./speech.js";
import { announce, esc, html, icon, toHtml } from "./util.js";

const SPEEDS = [0.75, 0.9, 1];
const AUTO = "";
const SAMPLE = {
  en: "Hello! This is how I will read to you.",
  es: "¡Hola! Así te voy a leer.",
};

let ctxRef = null;
let I = null;
let installed = false;
let dialog = null;

/** Header button that opens the panel. Icon-only on narrow screens; the label stays in the accessibility tree. */
export const voiceButtonHTML = (Ix) =>
  html`<button
    type="button"
    class="top-link lab-comfort-btn lab-voice-btn"
    data-voice-open
    aria-haspopup="dialog"
    aria-label="${Ix.S("Reading voice", "Voz de lectura")}"
    title="${Ix.S("Choose a reading voice", "Elige una voz de lectura")}"
  >
    ${icon("speaking")}<span>${Ix.T("Voice", "Voz")}</span>
  </button>`;

/** Push the saved choice into speech.js (called on every render, so a change in another tab or a reset also lands). */
export function applyVoicePrefs(prefs = {}) {
  setVoiceDefaults({ en: prefs.readingVoice, es: prefs.readingVoiceEs, rate: prefs.rate });
}

const prefKey = (lang) => (lang === "es" ? "readingVoiceEs" : "readingVoice");
const savedVoice = (lang) => ctxRef.prefs[prefKey(lang)] || AUTO;
const isAuto = (id) => !id || id === "default";

function voiceRow(lang, option) {
  const T = I.S;
  const auto = option.id === "default";
  const current = savedVoice(lang);
  const checked = auto ? isAuto(current) : current === option.id;
  const name = auto
    ? T("Automatic (best on this device)", "Automática (la mejor de este dispositivo)")
    : option.name;
  const value = auto ? AUTO : option.id;
  return `<li class="vc-row">
    <label class="vc-opt"><input type="radio" name="voice-${lang}" value="${esc(value)}"${checked ? " checked" : ""} /><span>${esc(name)}</span></label>
    <button type="button" class="btn small vc-hear" data-voice-hear="${esc(value)}" data-voice-lang="${lang}" aria-label="${esc(T("Hear", "Escuchar"))} ${esc(name)}">${toHtml(icon("volume"))}<span>${T("Hear it", "Escúchala")}</span></button>
  </li>`;
}

function section(lang) {
  const T = I.S;
  const options = getVoiceOptions(lang);
  const title =
    lang === "es" ? T("Spanish voice", "Voz en español") : T("English voice", "Voz en inglés");
  // Only "Automatic" left means this device has no extra voice for the language: say so instead of a one-item list.
  const note =
    options.length < 2
      ? `<p class="cm-note">${T("This device has no other voices for this language. Automatic uses the one it has.", "Este dispositivo no tiene otras voces para este idioma. La automática usa la que tiene.")}</p>`
      : "";
  return `<fieldset class="cm-group vc-group" data-voice-group="${lang}"${lang === "es" ? ' lang="es"' : ""}>
    <legend>${title}</legend>
    <ul class="vc-list">${options.map((o) => voiceRow(lang, o)).join("")}</ul>${note}
  </fieldset>`;
}

function panelHTML() {
  const T = I.S;
  const rate = Number(ctxRef.prefs.rate) || 0.9;
  const nearest = SPEEDS.reduce((a, b) => (Math.abs(b - rate) < Math.abs(a - rate) ? b : a), 0.9);
  const names = { 0.75: T("Slow", "Lento"), 0.9: T("Normal", "Normal"), 1: T("Quick", "Rápido") };
  const speeds = SPEEDS.map(
    (v) =>
      `<label class="cm-opt"><input type="radio" name="voice-rate" value="${v}"${v === nearest ? " checked" : ""} /><span>${names[v]}</span></label>`,
  ).join("");
  const body = canSpeak()
    ? `${section("en")}${section("es")}
    <fieldset class="cm-group"><legend>${T("Reading speed", "Velocidad de lectura")}</legend><div class="cm-row">${speeds}</div></fieldset>`
    : `<p class="cm-sample">${T("Reading aloud is not available on this device.", "La lectura en voz alta no está disponible en este dispositivo.")}</p>`;
  return `<form method="dialog" class="comfort-sheet voice-sheet" data-voice-form>
    <header class="cm-head">
      <div><p class="cm-kicker">${T("Make it yours", "Hazlo tuyo")}</p><h2 id="voiceTitle">${T("Reading voice", "Voz de lectura")}</h2></div>
      <button class="cm-close" value="close" aria-label="${T("Close", "Cerrar")}">${toHtml(icon("close"))}</button>
    </header>
    <p class="cm-sample">${T("Pick a voice, press Hear it, and keep the one you like. It reads everything on this site.", "Elige una voz, presiona Escúchala y quédate con la que te guste. Lee todo en este sitio.")}</p>
    ${body}
    <footer class="cm-foot">
      <button class="btn primary" value="close">${T("Done", "Listo")}</button>
    </footer>
    <p class="cm-note">${T("Saved on this device. Voices come from your device, so other devices may offer different ones.", "Se guarda en este dispositivo. Las voces vienen de tu dispositivo, así que otros pueden ofrecer otras.")}</p>
  </form>`;
}

/** Re-render the panel in place, keeping keyboard focus on the same control. */
function refreshPanel() {
  if (!dialog?.open) return;
  const active = document.activeElement;
  const focusKey = active?.name
    ? `[name="${active.name}"][value="${CSS.escape(active.value)}"]`
    : null;
  dialog.innerHTML = panelHTML();
  if (focusKey) dialog.querySelector(focusKey)?.focus();
}

function save(patch) {
  ctxRef.setPrefs(patch);
  applyVoicePrefs(ctxRef.prefs);
}

function hear(button) {
  const lang = button.dataset.voiceLang === "es" ? "es" : "en";
  const value = button.dataset.voiceHear;
  // An explicit voice for the preview (and "auto" for Automatic), so it never plays the previously saved choice.
  speak(SAMPLE[lang], { lang: lang === "es" ? "es-US" : "en-US", voiceURI: value || "auto" });
}

function onChange(e) {
  const t = e.target;
  if (t.name === "voice-en" || t.name === "voice-es") {
    const lang = t.name.slice(-2);
    save({ [prefKey(lang)]: t.value });
    // Hearing the new voice right away is the confirmation; the live region covers screen readers too.
    speak(SAMPLE[lang], { lang: lang === "es" ? "es-US" : "en-US", voiceURI: t.value || "auto" });
    announce(I.S("Reading voice updated.", "Voz de lectura actualizada."));
  } else if (t.name === "voice-rate") {
    save({ rate: Number(t.value) });
    announce(I.S("Reading speed updated.", "Velocidad de lectura actualizada."));
  }
}

export function openVoice(opener = document.activeElement) {
  if (!ctxRef) return;
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.className = "comfort-dialog voice-dialog no-print";
    dialog.setAttribute("aria-labelledby", "voiceTitle");
    document.body.append(dialog);
    dialog.addEventListener("close", () => {
      if (dialog.open) return; // a quick reopen can outrun the previous close event
      stop();
      dialog.innerHTML = "";
      (dialog._opener?.isConnected
        ? dialog._opener
        : document.querySelector("[data-voice-open]")
      )?.focus?.();
    });
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
      const hearBtn = e.target.closest("[data-voice-hear]");
      if (hearBtn) hear(hearBtn);
    });
    dialog.addEventListener("change", onChange);
    // The device finishes loading its voices after the page does: fill the list in when they arrive.
    window.speechSynthesis?.addEventListener?.("voiceschanged", refreshPanel);
  }
  dialog._opener = opener;
  dialog.lang = I.pageLang || "en";
  dialog.innerHTML = panelHTML();
  if (!dialog.open) dialog.showModal();
  (dialog.querySelector("input:checked") || dialog.querySelector(".cm-close"))?.focus();
}

/** Called by the shell on every render: hand speech.js the saved choice and wire the open buttons once. */
export function installVoice(ctx, I18n) {
  ctxRef = ctx;
  I = I18n;
  applyVoicePrefs(ctx.prefs);
  if (installed) return;
  installed = true;
  document.addEventListener("click", (e) => {
    const btn = e.target.closest?.("[data-voice-open]");
    if (btn) openVoice(btn);
  });
}
