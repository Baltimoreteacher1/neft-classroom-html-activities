// Lab-only shell: shared utilities stay reachable without floating over student work.
import { footerHTML, navHTML } from "./nav.js";
import { toHtml, storage } from "./util.js";

let spanish = false;
let watching = false;
let lastLocation = "";
const savedCopy = {
  en: "Drafts, checklists, and practice progress are saved in this browser when storage is available. Recordings last only until this page closes or reloads. In Passport, an ACCESS1 export code carries your lab work to another device. Site Save / Resume short codes depend on the configured storage service; they are not Passport codes. On a shared device, export your work before another learner uses the lab.",
  es: "Los borradores, las listas de cotejo y el progreso se guardan en este navegador cuando hay almacenamiento disponible. Las grabaciones duran solo hasta cerrar o recargar la página. En Pasaporte, un código de exportación ACCESS1 permite llevar el trabajo a otro dispositivo. Los códigos cortos de Guardar / Continuar dependen del servicio de almacenamiento configurado; no son códigos de Pasaporte. En un dispositivo compartido, exporta tu trabajo antes de que otra persona use el laboratorio.",
};
function text(selector, value) {
  const node = document.querySelector(selector);
  if (node && node.textContent !== value) node.textContent = value;
}
function updateSavePanel() {
  const panel = document.querySelector("#nsr-panel");
  if (!panel) return;
  const T = (en, es) => spanish ? es : en;
  panel.lang = spanish ? "es" : "en";
  panel.setAttribute("aria-label", T("Save and resume your work", "Guardar y continuar el trabajo"));
  const labels = {
    ".nsr-title": T("Save & Resume", "Guardar y continuar"),
    "#nsr-intro .nsr-lead": T("Optional site resume code. Use an alias, not your full name.", "Código opcional del sitio. Usa un alias, no tu nombre completo."),
    "#nsr-start": T("Start new work", "Comenzar trabajo"),
    "#nsr-continue": T("Continue", "Continuar"),
    "#nsr-active .nsr-lead": T("Your site resume code — keep it for later:", "Tu código del sitio — guárdalo para después:"),
    "#nsr-copy": T("Copy code", "Copiar código"),
    "#nsr-savebtn": T("Save now", "Guardar ahora"),
    "#nsr-switch": T("Use a different code", "Usar otro código"),
    "#nsr-switch-student": T("Switch learner", "Cambiar de estudiante"),
    ".nsr-or": T("— or —", "— o —"),
    ".nsr-foot": savedCopy[spanish ? "es" : "en"],
  };
  for (const [selector, value] of Object.entries(labels)) text(`#nsr-panel ${selector}`, value);
  for (const [id, label, placeholder] of [
    ["nsr-name", T("Initials or classroom alias", "Iniciales o alias de clase"), T("e.g. Reader 7", "p. ej., Lector 7")],
    ["nsr-section", T("Class label (optional)", "Clase (opcional)"), T("e.g. Period 3", "p. ej., Período 3")],
    ["nsr-code-in", T("Continue with a site code", "Continuar con un código del sitio"), "MATH-7KQ2"],
  ]) {
    const input = document.getElementById(id);
    if (input) { input.placeholder = placeholder; const labelNode = input.closest("label")?.querySelector("span"); if (labelNode && labelNode.textContent !== label) labelNode.textContent = label; }
  }
  document.querySelector("#nsr-close")?.setAttribute("aria-label", T("Close", "Cerrar"));
  document.querySelector("#nsr-code")?.setAttribute("aria-label", T("Your site resume code", "Tu código del sitio"));
  const states = {
    idle: ["Ready", "Listo"], loading: ["Loading your work…", "Cargando tu trabajo…"],
    saving: ["Saving…", "Guardando…"], saved: ["Saved", "Guardado"],
    "saved-local": ["Saved on this device", "Guardado en este dispositivo"],
    offline: ["Saved locally (offline — will sync later)", "Guardado en este dispositivo (sin conexión; se sincronizará después)"],
    error: ["Couldn't save — try again", "No se pudo guardar; inténtalo de nuevo"],
  };
  const dot = document.getElementById("nsr-dot");
  const status = Object.entries(states).find(([key]) => dot?.classList.contains(`nsr-dot-${key}`));
  if (status) text("#nsr-status", status[1][spanish ? 1 : 0]);
  const meta = [T("Alias", "Alias"), T("Class", "Clase"), T("Progress", "Progreso"), T("Last saved", "Último guardado")];
  panel.querySelectorAll("dt").forEach((node, i) => { if (meta[i] && node.textContent !== meta[i]) node.textContent = meta[i]; });
}
export function mountShell(ctx) {
  spanish = ctx.route.view === "family" && ctx.prefs.lang === "es";
  const T = (en, es) => spanish ? es : en;
  document.documentElement.lang = spanish ? "es" : "en";
  const nav = document.querySelector(".lab-tools");
  const currentLocation = location.pathname + location.search;
  const wasOpen = lastLocation === currentLocation && nav?.querySelector("details")?.open;
  lastLocation = currentLocation;
  if (nav) {
    nav.setAttribute("aria-label", T("Lab navigation", "Navegación del laboratorio"));
    nav.innerHTML = toHtml(navHTML(ctx, T));
    nav.querySelector("details").open = Boolean(wasOpen);
    nav.querySelector("[data-lab-save]").addEventListener("click", () => {
      const engine = window.NeftSaveResume;
      if (!engine?.open) { nav.querySelector("[data-save-unavailable]").hidden = false; return; }
      engine.open();
      updateSavePanel();
    });
  }
  document.querySelector(".crumbs")?.setAttribute("aria-label", T("Breadcrumb", "Ruta de navegación"));
  text(".skip-link", T("Skip to content", "Saltar al contenido"));
  text(".lab-wordmark strong", T("ACCESS Practice Lab", "Laboratorio ACCESS"));
  const footer = document.querySelector(".lab-footer");
  if (footer) {
    const build = footer.querySelector("#labBuild")?.dataset.build || "";
    footer.innerHTML = toHtml(footerHTML(ctx, T));
    const stamp = footer.querySelector("#labBuild");
    if (stamp && build) stamp.textContent = stamp.dataset.build = build;
  }
  updateSavePanel();
  storage.refreshWarning();
  if (!watching) {
    watching = true;
    // Shared engine can initialize after this module. Only adapt its copy, never its data.
    new MutationObserver(updateSavePanel).observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", (e) => {
      if (e.target.closest("#nsr-close")) document.querySelector("[data-lab-save]")?.focus();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && e.target.closest("#nsr-panel")) { document.querySelector("[data-lab-save]")?.focus(); return; }
      if (e.key === "Escape") { const details = document.querySelector(".lab-utilities[open]"); if (details && !document.querySelector("#nsr-root.nsr-open")) { details.open = false; details.querySelector("summary").focus(); } }
    });
  }
}
