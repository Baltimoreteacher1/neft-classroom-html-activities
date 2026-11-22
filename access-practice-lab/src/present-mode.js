// Presentation mode for any lab page: a teacher projects the page they are on. Larger text, the site header,
// breadcrumbs and footer hidden, a small control bar (exit, smaller and larger text, full screen), Esc to leave.
// Anything marked data-present-hide (teacher notes, answer keys) is hidden while presenting.
//
// "Teacher" here means this device last used the Teacher Hub (src/audience.js). That is a convenience, not a
// security boundary: the mode only changes how a page is shown and reveals nothing the page did not already show.
// It never writes to the URL and never stores anything but the text size, for this tab only.
import { readAudience } from "./audience.js";
import { html } from "./util.js";

export const SCALES = Object.freeze([1.15, 1.3, 1.5, 1.75, 2]);
export const DEFAULT_SCALE_INDEX = 1;
const SCALE_KEY = "accessPracticeLab:v1:presentScale";

export const presentAvailable = () => readAudience() === "teacher";

export const presentButtonHTML = (L) =>
  presentAvailable()
    ? html`<button type="button" class="crumbs-present" data-present="on">
        ${L.S("Present", "Presentar")}
      </button>`
    : "";

const state = { on: false, index: DEFAULT_SCALE_INDEX, path: "", opener: null };

const readIndex = () => {
  try {
    const stored = sessionStorage.getItem(SCALE_KEY);
    const n = stored === null ? Number.NaN : Number(stored);
    return Number.isInteger(n) && n >= 0 && n < SCALES.length ? n : DEFAULT_SCALE_INDEX;
  } catch {
    return DEFAULT_SCALE_INDEX;
  }
};
const saveIndex = () => {
  try {
    sessionStorage.setItem(SCALE_KEY, String(state.index));
  } catch {
    /* the size just is not remembered */
  }
};

const say = (message) => {
  const live = document.getElementById("labLive");
  if (live) live.textContent = message;
};
const spanish = () => document.documentElement.lang?.startsWith("es");
const T = (en, es) => (spanish() ? es : en);

function barHTML() {
  const pct = Math.round(SCALES[state.index] * 100);
  return `<button type="button" data-present="off" class="btn">${T("Exit presentation", "Salir de la presentación")} <span aria-hidden="true">(Esc)</span></button>
    <button type="button" data-present="smaller" class="ghost" aria-label="${T("Smaller text", "Texto más pequeño")}" ${state.index === 0 ? "disabled" : ""}>A−</button>
    <span class="present-size" aria-live="polite">${pct}%</span>
    <button type="button" data-present="larger" class="ghost" aria-label="${T("Larger text", "Texto más grande")}" ${state.index === SCALES.length - 1 ? "disabled" : ""}>A+</button>
    <button type="button" data-present="fullscreen" class="ghost">${T("Full screen", "Pantalla completa")}</button>`;
}

function draw() {
  document.documentElement.style.setProperty("--present-scale", String(SCALES[state.index]));
  let bar = document.getElementById("presentBar");
  if (!bar) {
    bar = Object.assign(document.createElement("div"), { id: "presentBar", className: "no-print" });
    bar.setAttribute("role", "toolbar");
    document.body.append(bar);
  }
  bar.setAttribute("aria-label", T("Presentation controls", "Controles de presentación"));
  const focused = document.activeElement?.dataset?.present;
  bar.innerHTML = barHTML();
  if (focused) {
    // A control that just became disabled (a size limit) cannot keep focus; hand it to its opposite, then to Exit.
    const next = { larger: "smaller", smaller: "larger" }[focused];
    const target = [focused, next, "off"].map((n) => n && bar.querySelector(`[data-present="${n}"]:not([disabled])`)).find(Boolean);
    target?.focus();
  }
}

export function setPresent(on) {
  if (on === state.on) return;
  if (on && !presentAvailable()) return;
  state.on = on;
  if (on) {
    state.index = readIndex();
    state.path = location.pathname;
    state.opener = document.activeElement;
    document.documentElement.dataset.present = "1";
    draw();
    document.querySelector('#presentBar [data-present="off"]')?.focus();
    say(
      T(
        "Presentation mode on. Press Escape to leave.",
        "Modo de presentación activado. Presiona Escape para salir.",
      ),
    );
  } else {
    delete document.documentElement.dataset.present;
    document.documentElement.style.removeProperty("--present-scale");
    document.getElementById("presentBar")?.remove();
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    if (state.opener?.isConnected) state.opener.focus({ preventScroll: true });
    say(T("Presentation mode off.", "Modo de presentación desactivado."));
  }
}

function act(name) {
  if (name === "on") return setPresent(true);
  if (name === "off") return setPresent(false);
  if (name === "fullscreen") {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
    return;
  }
  if (name === "smaller" && state.index > 0) state.index -= 1;
  else if (name === "larger" && state.index < SCALES.length - 1) state.index += 1;
  else return;
  saveIndex();
  draw();
}

/** Call after every page render: honors ?present=1 and leaves presenting when the learner-visible page changes. */
export function syncPresent() {
  const wanted = new URLSearchParams(location.search).get("present") === "1";
  if (state.on && location.pathname !== state.path && !wanted) setPresent(false);
  else if (!state.on && wanted) setPresent(true);
}

let installed = false;
export function installPresentMode() {
  if (installed) return;
  installed = true;
  document.addEventListener("click", (e) => {
    const t = e.target.closest?.("[data-present]");
    if (t && !t.disabled) act(t.dataset.present);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.on && !document.fullscreenElement) setPresent(false);
  });
}

export const isPresenting = () => state.on;
