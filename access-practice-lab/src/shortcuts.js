// Keyboard shortcuts: press ? to see them, and "g" then a letter to jump anywhere without the mouse.
// Search keeps its own keys (Ctrl or Cmd + K, or "/"), and Reading comfort keeps "C" (comfort.js).
// Nothing here fires while a learner is typing or while a dialog is open.
import { BASE } from "./util.js";

/** [letter, lab route, English, Spanish] — every route is a real lab page (see home-registry.js). */
export const GO_KEYS = [
  ["h", "", "Home", "Inicio"],
  ["p", "path", "My Language Path", "Mi camino del lenguaje"],
  ["j", "journey/map", "My Journey Map", "Mi mapa del viaje"],
  ["w", "warmup", "Daily Warm-Up", "Calentamiento diario"],
  ["s", "speak", "Speaking Studio", "Estudio de habla"],
  ["e", "write", "Writing Studio", "Estudio de escritura"],
  ["r", "reading-room", "Reading Room", "Sala de lectura"],
  ["i", "reader", "Immersive Reader", "Lector inmersivo"],
  ["v", "vocabulary", "Vocabulary", "Vocabulario"],
  ["l", "library", "Practice library", "Biblioteca de práctica"],
  ["m", "growth", "My Growth", "Mi crecimiento"],
];

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const typing = (el) => !!el?.closest?.("input, textarea, select, [contenteditable=''], [contenteditable='true']");

let ctxRef = null;
let I = null;
let installed = false;
let armed = 0;
let hint = null;
let dialog = null;

function clearHint() {
  clearTimeout(armed);
  armed = 0;
  hint?.remove();
  hint = null;
}

function showHint() {
  hint?.remove();
  hint = document.createElement("div");
  hint.className = "go-hint no-print";
  hint.setAttribute("role", "status");
  hint.innerHTML = `<kbd>g</kbd> ${esc(I.S("then", "luego"))} ` + GO_KEYS.map(([k, , en, es]) => `<span><kbd>${k}</kbd> ${esc(I.S(en, es))}</span>`).join("");
  document.body.append(hint);
}

function keyRow(keys, label) {
  return `<div class="sc-row"><dt>${keys.map((k) => `<kbd>${esc(k)}</kbd>`).join('<span aria-hidden="true">then</span>')}</dt><dd>${esc(label)}</dd></div>`;
}

export function openShortcuts(opener = document.activeElement) {
  if (!ctxRef) return;
  const T = I.S;
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.className = "shortcuts-dialog no-print";
    dialog.setAttribute("aria-labelledby", "shortcutsTitle");
    document.body.append(dialog);
    dialog.addEventListener("close", () => {
      if (dialog.open) return; // a quick reopen can outrun the previous close event
      dialog.innerHTML = "";
      (dialog._opener?.isConnected ? dialog._opener : document.getElementById("app"))?.focus?.();
    });
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
  }
  dialog._opener = opener;
  dialog.lang = I.pageLang || "en";
  dialog.innerHTML = `<form method="dialog" class="shortcuts-sheet">
    <header class="cm-head"><div><p class="cm-kicker">${esc(T("Move faster", "Muévete más rápido"))}</p><h2 id="shortcutsTitle">${esc(T("Keyboard shortcuts", "Atajos de teclado"))}</h2></div>
    <button class="cm-close" value="close" aria-label="${esc(T("Close", "Cerrar"))}"><svg class="ico" aria-hidden="true" focusable="false"><use href="${BASE}/pictures/ui-icons.svg#close"></use></svg></button></header>
    <h3>${esc(T("Anywhere", "En cualquier lugar"))}</h3>
    <dl class="sc-list">
      ${keyRow(["?"], T("Show this list", "Mostrar esta lista"))}
      ${keyRow(["/"], T("Search the lab (or Ctrl or Cmd + K)", "Buscar en el laboratorio (o Ctrl o Cmd + K)"))}
      ${keyRow(["c"], T("Reading comfort: colors, text size, spacing, ruler", "Comodidad de lectura: colores, tamaño, espacio, regla"))}
      ${keyRow(["Esc"], T("Close a panel", "Cerrar un panel"))}
    </dl>
    <h3>${esc(T("Go to", "Ir a"))}</h3>
    <dl class="sc-list sc-go">${GO_KEYS.map(([k, , en, es]) => keyRow(["g", k], T(en, es))).join("")}</dl>
    <footer class="cm-foot"><button class="btn primary" value="close">${esc(T("Done", "Listo"))}</button></footer>
  </form>`;
  if (!dialog.open) dialog.showModal();
  dialog.querySelector(".cm-close")?.focus();
}

/** Called by the shell on every render so the shortcuts always see the current language and navigation. */
export function installShortcuts(ctx, I18n) {
  ctxRef = ctx;
  I = I18n;
  if (installed) return;
  installed = true;
  document.addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
    if (document.querySelector("dialog[open]")) return;
    if (armed) {
      const hit = GO_KEYS.find(([k]) => k === e.key.toLowerCase());
      clearHint();
      if (hit) {
        e.preventDefault();
        ctxRef.navigate(`${BASE}/${hit[1]}`);
      }
      return;
    }
    if (e.key === "?") {
      e.preventDefault();
      openShortcuts();
    } else if (e.key === "g" && !e.shiftKey) {
      armed = setTimeout(clearHint, 2500);
      showHint();
    }
  });
}
