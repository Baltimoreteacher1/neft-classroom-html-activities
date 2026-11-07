// Reading Comfort: one panel, reachable from every screen, that lets a learner shape how the lab looks and moves.
// Colour theme, text size, line and letter spacing, a reading ruler and calm motion. Choices are saved on this
// device (accessPracticeLab:v1:comfort), apply to every route, and never touch lesson content or answers.
// The theme and spacing are CSS only: comfort.css reads the data-comfort-* attributes set on <html>.
import { PREFIX } from "./store.js";
import { html, icon, storage, announce, toHtml } from "./util.js";

export const COMFORT_KEY = `${PREFIX}:comfort`;
export const COMFORT_DEFAULTS = Object.freeze({ theme: "default", lh: "normal", ls: "normal", ruler: false, calm: false });
const THEMES = ["default", "paper", "calm", "contrast"];
const SPACING = ["normal", "roomy", "airy"];
const SIZES = [0.9, 1, 1.15, 1.3, 1.4];

let ctxRef = null;
let I = null;
let installed = false;
let state = { ...COMFORT_DEFAULTS };

const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);

/** Read the saved choices; anything missing or unknown falls back to the default, so stale data can never break a page. */
export function loadComfort() {
  let raw = {};
  try {
    raw = JSON.parse(storage.get(COMFORT_KEY) || "{}") || {};
  } catch {
    raw = {};
  }
  return {
    theme: pick(raw.theme, THEMES, "default"),
    lh: pick(raw.lh, SPACING, "normal"),
    ls: pick(raw.ls, SPACING, "normal"),
    ruler: raw.ruler === true,
    calm: raw.calm === true,
  };
}

/** Put the choices on <html> where comfort.css reads them. */
export function applyComfort(next = state) {
  const root = document.documentElement;
  root.dataset.comfortTheme = next.theme;
  root.dataset.comfortLh = next.lh;
  root.dataset.comfortLs = next.ls;
  root.dataset.comfortMotion = next.calm ? "calm" : "full";
  root.dataset.comfortRuler = next.ruler ? "on" : "off";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", { paper: "#5a4631", calm: "#2f5566", contrast: "#000000" }[next.theme] || "#1d2b58");
  syncRuler(next.ruler);
}

function save(patch) {
  state = { ...state, ...patch };
  storage.set(COMFORT_KEY, JSON.stringify(state));
  applyComfort(state);
}

// ── reading ruler ─────────────────────────────────────────────────────────────
// Dims everything except one band that follows the pointer, a finger, or the keyboard focus.
let ruler = null;
const RULER_PX = 56;
function moveRuler(y) {
  if (!ruler) return;
  const top = Math.max(0, Math.min(window.innerHeight - RULER_PX, y - RULER_PX / 2));
  ruler.style.setProperty("--cr-top", `${top}px`);
  ruler.style.setProperty("--cr-bottom", `${top + RULER_PX}px`);
}
const onPointer = (e) => moveRuler(e.clientY);
const onTouch = (e) => e.touches[0] && moveRuler(e.touches[0].clientY);
const onFocus = (e) => {
  const el = e.target;
  if (!(el instanceof Element) || el.closest(".comfort-dialog")) return;
  const box = el.getBoundingClientRect();
  if (box.height) moveRuler(box.top + Math.min(box.height / 2, 60));
};
function syncRuler(on) {
  if (on && !ruler) {
    ruler = document.createElement("div");
    ruler.id = "comfortRuler";
    ruler.className = "comfort-ruler no-print";
    ruler.setAttribute("aria-hidden", "true");
    ruler.innerHTML = '<span class="cr-shade cr-above"></span><span class="cr-shade cr-below"></span>';
    document.body.append(ruler);
    moveRuler(window.innerHeight * 0.4);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    document.addEventListener("focusin", onFocus);
  } else if (!on && ruler) {
    ruler.remove();
    ruler = null;
    window.removeEventListener("pointermove", onPointer);
    window.removeEventListener("touchmove", onTouch);
    document.removeEventListener("focusin", onFocus);
  }
}

// ── the panel ─────────────────────────────────────────────────────────────────
/** Header button that opens the panel. */
export const comfortButtonHTML = (Ix) =>
  html`<button type="button" class="top-link lab-comfort-btn" data-comfort-open aria-haspopup="dialog" aria-keyshortcuts="C" title="${Ix.S("Reading comfort (C)", "Comodidad de lectura (C)")}">${icon("text-size")}<span>${Ix.T("Comfort", "Comodidad")}</span></button>`;

const themeLabels = (T) => ({
  default: [T("Classic", "Clásico"), T("The lab's own colors", "Los colores del laboratorio")],
  paper: [T("Warm paper", "Papel cálido"), T("Soft cream, easy on the eyes", "Crema suave, cómodo para la vista")],
  calm: [T("Cool calm", "Calma fresca"), T("Quiet blue-gray", "Gris azulado tranquilo")],
  contrast: [T("High contrast", "Alto contraste"), T("Black and white, strong lines", "Blanco y negro, líneas fuertes")],
});

function radio(name, value, checked, label, extra = "") {
  return `<label class="cm-opt ${extra}"><input type="radio" name="${name}" value="${value}"${checked ? " checked" : ""} /><span>${label}</span></label>`;
}

function panelHTML() {
  const T = I.S;
  const size = Number(ctxRef.prefs.textSize) || 1;
  const nearest = SIZES.reduce((a, b) => (Math.abs(b - size) < Math.abs(a - size) ? b : a), 1);
  const names = { normal: T("Normal", "Normal"), roomy: T("Roomy", "Amplio"), airy: T("Extra roomy", "Muy amplio") };
  const themes = Object.entries(themeLabels(T))
    .map(
      ([value, [name, hint]]) =>
        `<label class="cm-theme" data-theme-card="${value}"><input type="radio" name="theme" value="${value}"${state.theme === value ? " checked" : ""} /><span class="cm-swatch" aria-hidden="true"><i></i><i></i><i></i></span><strong>${name}</strong><small>${hint}</small></label>`,
    )
    .join("");
  const spacing = (key) => SPACING.map((v) => radio(key, v, state[key] === v, names[v])).join("");
  const sizes = SIZES.map((v, i) => radio("size", v, v === nearest, `<span style="font-size:${0.85 + i * 0.16}rem" aria-hidden="true">A</span><span class="visually-hidden">${Math.round(v * 100)}%</span>`, "cm-size")).join("");
  return `<form method="dialog" class="comfort-sheet" data-comfort-form>
    <header class="cm-head">
      <div><p class="cm-kicker">${T("Make it yours", "Hazlo tuyo")}</p><h2 id="comfortTitle">${T("Reading comfort", "Comodidad de lectura")}</h2></div>
      <button class="cm-close" value="close" aria-label="${T("Close", "Cerrar")}">${toHtml(icon("close"))}</button>
    </header>
    <p class="cm-sample" id="comfortSample">${T("Lighthouses guide ships safely home. Read this line and see how it feels.", "Los faros guían a los barcos a casa. Lee esta línea y mira cómo se siente.")}</p>
    <fieldset class="cm-group"><legend>${T("Color", "Color")}</legend><div class="cm-themes">${themes}</div></fieldset>
    <fieldset class="cm-group"><legend>${T("Text size", "Tamaño del texto")}</legend><div class="cm-row cm-sizes">${sizes}</div></fieldset>
    <fieldset class="cm-group"><legend>${T("Space between lines", "Espacio entre líneas")}</legend><div class="cm-row">${spacing("lh")}</div></fieldset>
    <fieldset class="cm-group"><legend>${T("Space between letters", "Espacio entre letras")}</legend><div class="cm-row">${spacing("ls")}</div></fieldset>
    <div class="cm-group cm-switches">
      <label class="cm-switch"><input type="checkbox" name="ruler"${state.ruler ? " checked" : ""} /><span><strong>${T("Reading ruler", "Regla de lectura")}</strong><small>${T("Dims everything except the line you are reading.", "Atenúa todo menos la línea que estás leyendo.")}</small></span></label>
      <label class="cm-switch"><input type="checkbox" name="calm"${state.calm ? " checked" : ""} /><span><strong>${T("Calm motion", "Movimiento tranquilo")}</strong><small>${T("Stops animations and fades.", "Detiene animaciones y desvanecimientos.")}</small></span></label>
    </div>
    <footer class="cm-foot">
      <button type="button" class="btn" data-comfort-reset>${T("Reset to classic", "Volver a clásico")}</button>
      <button class="btn primary" value="close">${T("Done", "Listo")}</button>
    </footer>
    <p class="cm-note">${T("Saved on this device. Shortcut: press C. Press ? for all shortcuts.", "Se guarda en este dispositivo. Atajo: presiona C. Presiona ? para ver todos los atajos.")}</p>
  </form>`;
}

let dialog = null;
export function openComfort(opener = document.activeElement) {
  if (!ctxRef) return;
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.className = "comfort-dialog no-print";
    dialog.setAttribute("aria-labelledby", "comfortTitle");
    document.body.append(dialog);
    dialog.addEventListener("close", () => {
      if (dialog.open) return; // a quick reopen can outrun the previous close event
      dialog.innerHTML = "";
      (dialog._opener?.isConnected ? dialog._opener : document.querySelector("[data-comfort-open]"))?.focus?.();
    });
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
      if (e.target.closest("[data-comfort-reset]")) {
        save({ ...COMFORT_DEFAULTS });
        ctxRef.setPrefs({ textSize: 1 });
        document.documentElement.style.setProperty("--lab-scale", "1");
        dialog.innerHTML = panelHTML();
        announce(I.S("Comfort settings reset", "Ajustes de comodidad restablecidos"));
      }
    });
    dialog.addEventListener("change", (e) => {
      const f = dialog.querySelector("[data-comfort-form]");
      if (!f || !e.target.name) return;
      const data = new FormData(f);
      save({ theme: data.get("theme"), lh: data.get("lh"), ls: data.get("ls"), ruler: data.has("ruler"), calm: data.has("calm") });
      if (e.target.name === "size") {
        const next = Number(data.get("size")) || 1;
        ctxRef.setPrefs({ textSize: next });
        document.documentElement.style.setProperty("--lab-scale", String(next));
      }
    });
  }
  dialog._opener = opener;
  dialog.lang = I.pageLang || "en";
  dialog.innerHTML = panelHTML();
  if (!dialog.open) dialog.showModal();
  dialog.querySelector("input:checked")?.focus();
}

const typing = (el) => !!el?.closest?.("input, textarea, select, [contenteditable=''], [contenteditable='true']");

/** Called by the shell on every render. Wires the saved choices once, and refreshes the language the panel speaks. */
export function installComfort(ctx, I18n) {
  ctxRef = ctx;
  I = I18n;
  if (!installed) {
    installed = true;
    state = loadComfort();
    applyComfort(state);
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-comfort-open]");
      if (btn) openComfort(btn);
    });
    document.addEventListener("keydown", (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
      if ((e.key === "c" || e.key === "C") && !document.querySelector("dialog[open]")) {
        e.preventDefault();
        openComfort();
      }
    });
  }
}
