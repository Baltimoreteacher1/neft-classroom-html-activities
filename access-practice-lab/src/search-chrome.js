// The always-loaded part of site search: the header button, the search box in the More menu and the keyboard
// shortcuts (Ctrl or Cmd + K, or "/" outside a text field). The palette itself loads only when it is opened.
import { html, icon } from "./util.js";

let ctxRef = null;
let installed = false;

/** Header button that opens the palette. */
export const searchButtonHTML = (I) =>
  html`<button type="button" class="top-link lab-search-btn" data-search-open aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K /" aria-label="${I.S("Search the lab", "Buscar en el laboratorio")}">${icon("search")}<span>${I.T("Search", "Buscar")}</span></button>`;

/** The search box at the top of the More menu: it opens the full results page. */
export const searchFormHTML = (I) =>
  html`<form class="menu-search" role="search" data-search-form action="/access-practice-lab/search">
    <label class="visually-hidden" for="labSearchInput">${I.T("Search the lab", "Buscar en el laboratorio")}</label>
    <input id="labSearchInput" type="search" name="q" autocomplete="off" enterkeyhint="search" placeholder="${I.S("Search words, activities, pages", "Buscar palabras, actividades, páginas")}" />
    <button type="submit" class="btn small">${icon("search")}<span class="visually-hidden">${I.T("Search", "Buscar")}</span></button>
  </form>`;

const typing = (el) => !!el?.closest?.("input, textarea, select, [contenteditable=''], [contenteditable='true']");

export function openSearch() {
  if (!ctxRef) return;
  import("./search-palette.js").then((m) => m.openPalette(ctxRef)).catch(() => {});
}

/** Called by the shell on every render so the palette always sees the current language and band. */
export function installSearch(ctx) {
  ctxRef = ctx;
  if (installed) return;
  installed = true;
  document.addEventListener("keydown", (e) => {
    const k = e.key?.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && !e.altKey && k === "k") {
      e.preventDefault();
      openSearch();
    } else if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey && !typing(e.target) && !document.querySelector(".sx-overlay")) {
      e.preventDefault();
      openSearch();
    }
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-search-open]")) openSearch();
  });
  document.addEventListener("submit", (e) => {
    const form = e.target.closest?.("[data-search-form]");
    if (!form) return;
    e.preventDefault();
    const q = new FormData(form).get("q")?.toString().trim() || "";
    const url = new URL("/access-practice-lab/search", location.origin);
    if (q) url.searchParams.set("q", q);
    url.searchParams.set("grades", ctxRef.band);
    ctxRef.navigate(url.pathname + url.search);
  });
}
