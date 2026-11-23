// Print / Save as PDF for a vocabulary collection: cut-apart cards or a wall poster, via window.print().
// The print layout is built into a dedicated root that replaces everything else on the page while printing.
import { announce, h } from "../../core/dom.js";
import { printCardsMarkup, printPosterMarkup } from "./model.js";
import { visualSvg } from "./visual.js";
import { uid } from "./ui.js";

const ROOT_ID = "st-v-printroot";

export function buildPrintMarkup(layout, collection, { showAlt, bilingual, student }) {
  const make = layout === "poster" ? printPosterMarkup : printCardsMarkup;
  return make(collection, { renderSvg: visualSvg, showAlt, bilingual, student });
}

/** Put the layout in the document and open the browser print dialog. Cleans up when printing ends. */
export function printLayout(layout, collection, opts) {
  document.getElementById(ROOT_ID)?.remove();
  const rootEl = h("div", { id: ROOT_ID, "data-layout": layout, html: buildPrintMarkup(layout, collection, opts) });
  document.body.append(rootEl);
  document.body.classList.add("st-v-printing");
  const done = () => {
    window.removeEventListener("afterprint", done);
    clearTimeout(timer);
    rootEl.remove();
    document.body.classList.remove("st-v-printing");
  };
  window.addEventListener("afterprint", done);
  const timer = setTimeout(done, 120000);
  announce(layout === "poster" ? "Opening the print dialog for the wall poster." : "Opening the print dialog for the word cards.");
  // Let layout settle so the SVGs are measured before the dialog snapshots the page.
  requestAnimationFrame(() => window.print());
  return done;
}

/**
 * The "Print / Save as PDF" control: a disclosure with the two layouts and two options.
 * getOpts() may supply { bilingual } from the current view.
 */
export function printMenu(collection, { student = false, getBilingual = () => false } = {}) {
  const id = uid("print");
  const hasEs = collection.entries.some((e) => e.es?.word);
  const alt = h("input", { type: "checkbox", id: `${id}-alt`, checked: true });
  const es = h("input", { type: "checkbox", id: `${id}-es`, checked: getBilingual(), disabled: !hasEs });
  const go = (layout) => printLayout(layout, collection, { showAlt: alt.checked, bilingual: es.checked && hasEs, student });
  const details = h(
    "details",
    { class: "st-v-menu" },
    h("summary", { class: "st-v-btn" }, "Print / Save as PDF"),
    h(
      "div",
      { class: "st-v-menu-panel", role: "group", "aria-label": "Print options" },
      h("p", { class: "st-v-help" }, "Choose a layout. In the print window, pick Save as PDF to keep a file."),
      h("label", { class: "st-v-check", for: alt.id }, alt, " Include picture descriptions"),
      hasEs ? h("label", { class: "st-v-check", for: es.id }, es, " Include Spanish") : null,
      h("p", { class: "st-v-row" }, h("button", { class: "st-v-btn st-v-primary", type: "button", "data-print": "cards", onclick: () => go("cards") }, "Cut-apart cards"), h("button", { class: "st-v-btn st-v-primary", type: "button", "data-print": "poster", onclick: () => go("poster") }, "Wall poster")),
    ),
  );
  details.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && details.open) {
      details.open = false;
      details.querySelector("summary").focus();
    }
  });
  return details;
}
