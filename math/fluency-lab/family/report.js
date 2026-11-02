// Report page: a student report and a family report built from this device's saved evidence, printable and saveable.
import { reportChrome, reportControls } from "../family-pages-4.js";
import { loadJournal, summarize as summarizeJournal } from "../language-journal.js";
import { REPORT_AUDIENCES, buildReport, primaryGrade } from "../reports-family.js";
import { reportDocument, reportHtml } from "../reports-family-render.js";
import { REPORT_CSS } from "../reports-family-css.js";
import { downloadFile } from "../school-tools.js";
import { bootPage, loadEvidence } from "./page4.js";

const $ = (selector) => document.querySelector(selector);
const ui = { audience: new URLSearchParams(location.search).get("audience") === "family" ? "family" : "student", grade: null, name: "", profile: 0, report: null };

async function draw(state) {
  ui.profile = state.profile;
  const evidence = await loadEvidence(state.profile);
  if (ui.grade === null) ui.grade = primaryGrade(evidence.tutor);
  ui.report = buildReport({ ...evidence, journal: summarizeJournal(loadJournal()), grade: ui.grade, name: ui.name });
  const text = reportChrome();
  document.title = text.docTitle;
  $("#skip-link").textContent = text.skip;
  $("#back-link").textContent = text.back;
  $("#achievements-link").textContent = text.link;
  $("#foot-lab").textContent = text.foot;
  $("#rp-title").textContent = text.title;
  $("#rp-eyebrow").textContent = text.eyebrow;
  $("#rp-optional").textContent = text.optional;
  const key = document.activeElement?.dataset?.fk;
  $("#rp-controls").innerHTML = reportControls(ui);
  $("#rp-style").textContent = REPORT_CSS;
  $("#rp-preview").innerHTML = reportHtml(ui.report, ui.audience, { embedded: true });
  if (key) document.querySelector(`[data-fk="${CSS.escape(key)}"]`)?.focus({ preventScroll: true });
}

const redraw = () => draw({ profile: ui.profile }).catch(console.error);
document.addEventListener("click", (event) => {
  const audience = event.target.closest("[data-audience]");
  if (audience && REPORT_AUDIENCES.includes(audience.dataset.audience)) {
    ui.audience = audience.dataset.audience;
    return redraw();
  }
  if (event.target.closest("#rp-print")) {
    document.body.dataset.print = "report";
    return window.print();
  }
  if (event.target.closest("#rp-save")) downloadFile(`math-fluency-${ui.audience}-report.html`, reportDocument(ui.report, ui.audience), "text/html");
});
document.addEventListener("change", (event) => {
  if (event.target.id === "rp-grade") {
    ui.grade = Number(event.target.value);
    redraw();
  }
});
// The name is typed on this page only; it is never saved. Redraw the preview without moving focus out of the field.
document.addEventListener("input", (event) => {
  if (event.target.id !== "rp-name") return;
  ui.name = event.target.value;
  $("#rp-preview").innerHTML = reportHtml({ ...ui.report, name: ui.name.trim().slice(0, 40) }, ui.audience, { embedded: true });
  ui.report = { ...ui.report, name: ui.name.trim().slice(0, 40) };
});
window.addEventListener("afterprint", () => delete document.body.dataset.print);
bootPage({ draw, onProfile: () => { ui.grade = null; } });
