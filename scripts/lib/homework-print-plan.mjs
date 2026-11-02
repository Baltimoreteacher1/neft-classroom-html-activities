/**
 * homework-print-plan.mjs: "Print this plan" on the family homework page.
 *
 * The page carries the same Family Take-Home Sheet the PDF is made from (scripts/lib/family-takehome-html.mjs), in
 * English and Spanish, invisible on screen. Printing (the button, or Ctrl+P) shows only that sheet in the family's
 * language; nothing interactive reaches paper. The stylesheet is WEB_PRINT_CSS (scripts/lib/family-takehome-css.mjs).
 * "Print problems only" and the answer / domino / refrigerator sheets keep their own print modes.
 */
import { buildTakeHome, SHEET_UI } from "./family-takehome-data.mjs";
import { fittedItemCount } from "./family-takehome-files.mjs";
import { renderSheet } from "./family-takehome-html.mjs";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/** The hidden sheets (both languages). A direct child of <body>, so print can show it alone. */
export function renderPrintPlanSheets(lessonId) {
  return `<div class="fm-th-web">${webSheets(lessonId).join("\n")}</div>`;
}

/** The two sheets exactly as the page embeds them (also what validate:family-print compares the page against). */
export function webSheets(lessonId) {
  const items = fittedItemCount(lessonId); // the same count the PDF uses, so paper and PDF agree
  return ["en", "es"].map((lang) =>
    renderSheet(buildTakeHome(lessonId, lang, { items }), { forWeb: true, cls: `lang-${lang}` }),
  );
}

/** The screen button, bilingual with the page's own language switch. */
export function renderPrintPlanButton() {
  const label = (lang) =>
    `<span class="lang-${lang}"${lang === "es" ? ' lang="es"' : ""}>${esc(SHEET_UI[lang].printPlan)}</span>`;
  return `<p class="fm-print-cta" data-no-print><button type="button" class="fm-print-btn" data-print-plan>${label("en")}${label("es")}</button></p>`;
}

/** Delegated listeners only: no inline handler. Default print = the plan, unless another print mode owns the page. */
export const PRINT_PLAN_JS = `
(function () {
  var OWN = /(^|\\s)print-(answer-sheet|domino-sheet|refrigerator-sheet|problems-only)(\\s|$)/;
  window.addEventListener("beforeprint", function () {
    if (!OWN.test(document.body.className)) document.body.classList.add("fm-print-plan");
  });
  window.addEventListener("afterprint", function () { document.body.classList.remove("fm-print-plan"); });
  document.addEventListener("click", function (event) {
    if (event.target.closest && event.target.closest("[data-print-plan]")) window.print();
  });
})();
`;
