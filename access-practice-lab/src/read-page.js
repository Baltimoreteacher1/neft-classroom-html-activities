// "Read this page": a header toggle that reads the main content aloud with the lab's own speech (src/speech.js).
// It reads #app only, skipping navigation, buttons, form controls and anything hidden. Pressing it again, pressing
// Escape, or going to another page stops it. aria-pressed tells assistive technology whether it is reading.
import { canSpeak, speak, stop } from "./speech.js";
import { announce, html, icon } from "./util.js";

// Blocks whose text is read, one utterance each.
const BLOCKS = "h1,h2,h3,h4,h5,h6,p,li,dt,dd,th,td,caption,figcaption,blockquote,legend,summary";
// Never read: chrome, controls and decoration.
const SKIP =
  "nav,button,select,textarea,input,script,style,template,svg,noscript,[hidden],[aria-hidden='true'],[inert],.visually-hidden,.no-read,.crumbs";

/** True when the element (or an ancestor up to `root`) is excluded or inside a closed <details> (beyond its summary). */
function skipped(el, root) {
  if (el.closest(SKIP)) return true;
  for (let node = el; node && node !== root; node = node.parentElement) {
    const details = node.parentElement?.closest("details");
    if (details && !details.open && root.contains(details) && !node.closest("summary")) return true;
  }
  return false;
}

/**
 * The text to read, as [{ text, lang }] in page order. A block that contains another block is skipped (the inner
 * blocks are read), so nothing is read twice. `lang` is "es" when the nearest lang attribute is Spanish.
 */
export function pageSegments(root) {
  if (!root) return [];
  const out = [];
  for (const el of root.querySelectorAll(BLOCKS)) {
    if (el.querySelector(BLOCKS) || skipped(el, root)) continue;
    const copy = el.cloneNode(true);
    for (const n of copy.querySelectorAll(SKIP)) n.remove();
    const text = copy.textContent.replace(/\s+/g, " ").trim();
    if (!text) continue;
    const lang = (el.closest("[lang]")?.getAttribute("lang") || "en").toLowerCase().startsWith("es")
      ? "es"
      : "en";
    out.push({ text, lang });
  }
  return out;
}

/** Group consecutive segments in one language so each group is one speak() call with the right voice. */
export function voiceRuns(segments, mode) {
  const runs = [];
  for (const s of segments) {
    // English-only and Spanish-only modes use one voice; bilingual follows each block's own language.
    const lang = mode === "es" ? "es" : mode === "bi" ? s.lang : "en";
    const last = runs.at(-1);
    if (last?.lang === lang) last.texts.push(s.text);
    else runs.push({ lang, texts: [s.text] });
  }
  return runs;
}

export const readPageButtonHTML = (I) =>
  html`<button
    type="button"
    class="top-link lab-read-btn"
    data-read-page
    aria-pressed="false"
    aria-keyshortcuts="Escape"
    title="${I.S("Read this page aloud (Escape stops)", "Leer esta página en voz alta (Escape detiene)")}"
  >
    ${icon("volume")}<span>${I.T("Read this page", "Leer esta página")}</span>
  </button>`;

let reading = null; // { token, location }
let I = null;
let mode = "en";
let installed = false;

function setPressed(on) {
  for (const b of document.querySelectorAll("[data-read-page]"))
    b.setAttribute("aria-pressed", String(on));
}

export function stopReading({ say = true } = {}) {
  if (!reading) return;
  reading = null;
  stop();
  setPressed(false);
  if (say && I) announce(I.S("Stopped reading.", "Se dejó de leer."));
}

async function startReading() {
  const runs = voiceRuns(pageSegments(document.getElementById("app")), mode);
  if (!runs.length || !canSpeak()) {
    announce(
      I.S(
        "Reading aloud is not available on this device.",
        "La lectura en voz alta no está disponible en este dispositivo.",
      ),
    );
    return;
  }
  const token = {};
  reading = { token, location: location.pathname + location.search };
  setPressed(true);
  for (const run of runs) {
    if (reading?.token !== token) return;
    const done = await speak(run.texts, { lang: run.lang === "es" ? "es-US" : "en-US" });
    if (!done) break;
  }
  if (reading?.token === token) {
    reading = null;
    setPressed(false);
  }
}

/** Called on every render by the shell: keep the button state true and stop when the page changed. */
export function installReadPage(ctx, I18n) {
  I = I18n;
  mode = I18n.mode || "en";
  if (reading && reading.location !== location.pathname + location.search)
    stopReading({ say: false });
  setPressed(Boolean(reading));
  if (installed) return;
  installed = true;
  document.addEventListener("click", (e) => {
    if (!e.target.closest?.("[data-read-page]")) return;
    if (reading) stopReading();
    else startReading();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && reading) stopReading();
  });
}
