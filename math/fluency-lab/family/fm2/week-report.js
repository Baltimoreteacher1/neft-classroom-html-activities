// Weekly family practice summary, carried over from the previous family home so the printed weekly summary keeps working.
// It reads the Fluency Lab's own saved practice (family-report.js) for the learner's grade. @fm2 FM-024 FM-028
import { familyWeeklyReport } from "../family-report.js";
import { emptyTutor, sanitizeTutor } from "../../tutor-engine.js";
import { profileKey, readLocal } from "../../school-tools.js";
import { escapeHtml as esc, L } from "./lang.js";

const TUTOR_KEY = "ewl-fluency-tutor-v2";
const COPY = {
  kicker: { en: "A LOOK BACK, WITH CARE", es: "UN REPASO CON CUIDADO" },
  title: { en: "Practice this week", es: "Práctica de esta semana" },
  intro: { en: "A simple summary of saved practice from the last seven days. Supported checks stay separate from independent checks.", es: "Un resumen sencillo de la práctica guardada en los últimos siete días. Las comprobaciones con apoyo se muestran aparte de las independientes." },
  none: { en: "No practice is recorded for the last seven days. New practice will appear here after it is saved.", es: "No hay práctica registrada en los últimos siete días. La práctica nueva aparecerá aquí después de guardarse." },
  independent: { en: "Independent checks", es: "Comprobaciones independientes" },
  correct: { en: "correct", es: "correctas" },
  supported: { en: "checks with support", es: "comprobaciones con apoyo" },
  skills: { en: "Skills this week", es: "Destrezas de esta semana" },
  checkFor: { en: "independent check", es: "comprobación independiente" },
  checksFor: { en: "independent checks", es: "comprobaciones independientes" },
  noIndependent: { en: "no independent checks", es: "sin comprobaciones independientes" },
  supportedFor: { en: "supported checks", es: "comprobaciones con apoyo" },
  supportedForOne: { en: "supported check", es: "comprobación con apoyo" },
  due: { en: "Skills to revisit", es: "Destrezas para repasar" },
  noDue: { en: "No skills are currently marked due for review.", es: "No hay destrezas marcadas para repasar por ahora." },
  print: { en: "Print weekly summary", es: "Imprimir resumen semanal" },
  printTitle: { en: "Family practice this week", es: "Práctica familiar de esta semana" },
};
const t = (key, lang) => L(COPY[key], lang);

function reportFor(profile, grade) {
  const tutor = sanitizeTutor(readLocal(profileKey(TUTOR_KEY, profile), emptyTutor()));
  return familyWeeklyReport(tutor, grade);
}

// The panel markup, rendered inside the home's progress section.
export function weekReportHtml({ lang, profile, grade }) {
  const report = reportFor(profile, grade);
  const body = !report.available
    ? `<p class="hm-note">${esc(t("none", lang))}</p>`
    : `<div class="week-report-totals"><p><strong>${report.totals.independent}</strong><span>${esc(t("independent", lang))} · ${report.totals.correct} ${esc(t("correct", lang))}</span></p><p><strong>${report.totals.supported}</strong><span>${esc(t("supported", lang))}</span></p></div>
      <h3>${esc(t("skills", lang))}</h3><ul class="week-skill-list">${report.skills
        .map((row) => `<li><strong>${esc(row.title)}</strong><span>${row.checks ? `${row.correct}/${row.checks} ${esc(t(row.checks === 1 ? "checkFor" : "checksFor", lang))}` : esc(t("noIndependent", lang))} · ${row.supported} ${esc(t(row.supported === 1 ? "supportedForOne" : "supportedFor", lang))}</span></li>`)
        .join("")}</ul>
      <h3>${esc(t("due", lang))}</h3>${report.due.length ? `<ul>${report.due.map((title) => `<li>${esc(title)}</li>`).join("")}</ul>` : `<p>${esc(t("noDue", lang))}</p>`}`;
  return `<section class="week-report" id="family-week-report" aria-labelledby="week-report-heading" data-testid="week-report">
    <p class="eyebrow">${esc(t("kicker", lang))}</p><h2 id="week-report-heading">${esc(t("title", lang))}</h2>
    <p class="hm-note">${esc(t("intro", lang))}</p>${body}
    <button type="button" class="fm2-btn" id="print-week-report" data-testid="print-week-report">${esc(t("print", lang))}</button></section>`;
}

// Print the summary in a clean window (or a hidden frame where popups are blocked), as the previous home did.
export function printWeekReport({ lang, profile, grade }) {
  const report = reportFor(profile, grade);
  const lines = report.skills.map((row) => `<li><strong>${esc(row.title)}</strong>: ${row.checks ? `${row.correct}/${row.checks}` : "0"} · ${row.supported}</li>`).join("");
  const due = report.due.map((title) => `<li>${esc(title)}</li>`).join("");
  const html = `<!doctype html><html lang="${lang}"><meta charset="utf-8"><title>${esc(t("printTitle", lang))}</title><style>body{font:16px/1.6 system-ui,sans-serif;max-width:660px;margin:36px auto;padding:0 20px;color:#20233d}h1,h2{font-family:Georgia,serif}li{margin:.4rem 0}</style><h1>${esc(t("printTitle", lang))}</h1><p>${esc(t("intro", lang))}</p><p><strong>${report.totals?.independent ?? 0}</strong> ${esc(t("independent", lang))} · ${report.totals?.correct ?? 0} ${esc(t("correct", lang))} · <strong>${report.totals?.supported ?? 0}</strong> ${esc(t("supported", lang))}</p><ul>${lines}</ul><h2>${esc(t("due", lang))}</h2>${due ? `<ul>${due}</ul>` : `<p>${esc(t("noDue", lang))}</p>`}</html>`;
  const win = window.open("", "_blank", "width=700,height=700");
  if (win) { win.document.write(html); win.document.close(); win.focus(); win.print(); return; }
  const frame = document.createElement("iframe");
  frame.title = t("printTitle", lang);
  frame.style.cssText = "position:fixed;width:1px;height:1px;left:-10px;bottom:0;border:0";
  frame.srcdoc = html;
  frame.onload = () => { frame.contentWindow.print(); window.setTimeout(() => frame.remove(), 1000); };
  document.body.append(frame);
}
