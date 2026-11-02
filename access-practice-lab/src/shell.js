// Lab-only shell: shared utilities stay reachable without floating over student work.
import { i18nFor, langSwitchHTML } from "./i18n.js";
import { footerHTML, navHTML } from "./nav.js";
import { toHtml, storage } from "./util.js";

let I = i18nFor({ prefs: {}, route: {} });
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
/** The site-wide Save / Resume launcher is built by the shared engine in English; relabel it for the chosen language. */
function updateLauncher() {
  const launcher = document.getElementById("nsr-launcher");
  if (!launcher) return;
  const title = I.S("Save / Resume your work", "Guardar y continuar tu trabajo");
  if (launcher.title !== title) launcher.title = title;
  const aria = launcher.getAttribute("aria-label");
  if (aria?.startsWith("Save / Resume your work") && title !== "Save / Resume your work") launcher.setAttribute("aria-label", aria.replace("Save / Resume your work", title));
  text("#nsr-launcher .nsr-launcher-label", I.S("Save / Resume", "Guardar y continuar"));
}
function updateSavePanel() {
  updateLauncher();
  const panel = document.querySelector("#nsr-panel");
  if (!panel) return;
  const T = I.S;
  const spanish = I.spanish;
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
    ".nsr-foot": I.S(savedCopy.en, savedCopy.es),
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
  if (status) text("#nsr-status", I.S(status[1][0], status[1][1]));
  const meta = [T("Alias", "Alias"), T("Class", "Clase"), T("Progress", "Progreso"), T("Last saved", "Último guardado")];
  panel.querySelectorAll("dt").forEach((node, i) => { if (meta[i] && node.textContent !== meta[i]) node.textContent = meta[i]; });
}
/** First visit: offer the three language modes once, on every page except the family hub (which has its own). */
function mountLangBanner(ctx) {
  const existing = document.getElementById("labLangBanner");
  const wanted = !ctx.prefs.langChosen && ctx.route?.view !== "family";
  if (!wanted) return existing?.remove();
  if (existing) return;
  const banner = document.createElement("div");
  banner.id = "labLangBanner";
  banner.className = "lang-banner no-print";
  banner.setAttribute("role", "region");
  banner.setAttribute("aria-label", "Language / Idioma");
  banner.innerHTML =
    `<p class="lang-banner-text"><strong>Choose your language</strong> <span lang="es">Elija su idioma</span></p>` +
    toHtml(langSwitchHTML(ctx.prefs.lang || "en", { large: true, idPrefix: "banner" })) +
    `<button type="button" class="lang-banner-skip" data-lang-keep>Keep English <span lang="es">/ Seguir en inglés</span></button>`;
  document.getElementById("labStorageWarning")?.before(banner);
}

export function mountShell(ctx) {
  I = i18nFor(ctx);
  const T = I.S;
  document.documentElement.lang = I.pageLang;
  const nav = document.querySelector(".lab-tools");
  const currentLocation = location.pathname + location.search;
  const wasOpen = lastLocation === currentLocation && nav?.querySelector("details")?.open;
  lastLocation = currentLocation;
  if (nav) {
    nav.setAttribute("aria-label", T("Lab navigation", "Navegación del laboratorio"));
    nav.innerHTML = toHtml(navHTML(ctx, I));
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
  // The wordmark is a name: bilingual mode keeps it short rather than printing both languages.
  text(".lab-wordmark strong", I.bilingual ? "ACCESS Practice Lab" : T("ACCESS Practice Lab", "Laboratorio ACCESS"));
  // Plain-text swaps need their own language tag when Spanish sits on an English page.
  const tagEs = I.spanish && I.pageLang !== "es";
  for (const selector of [".skip-link", ".lab-wordmark strong"]) {
    const node = document.querySelector(selector);
    if (node) tagEs ? node.setAttribute("lang", "es") : node.removeAttribute("lang");
  }
  mountLangBanner(ctx);
  const footer = document.querySelector(".lab-footer");
  if (footer) {
    const build = footer.querySelector("#labBuild")?.dataset.build || "";
    footer.innerHTML = toHtml(footerHTML(ctx, I));
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
