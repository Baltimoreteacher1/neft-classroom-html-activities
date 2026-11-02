// Words and controls for the achievements and report pages. They live here, beside the other t() modules, so the Spanish
// coverage test (tools/fluency-i18n.test.mjs) sees every string.
import { GRADES } from "./problem-bank.js";
import { t } from "./i18n.js";

const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const gradeLabel = (grade) => (grade === 0 ? t("Kindergarten") : t("Grade {n}", { n: grade }));

export const achievementsChrome = () => ({
  docTitle: `${t("My Achievements")} · ${t("Family Math")} · EduWonderLab`,
  title: t("My achievements"),
  eyebrow: t("Recognition for real learning"),
  optional: t("Everything here is optional. Recognition comes from practice on your own, and nothing you earn is ever taken away."),
  back: t("← Back to family math"),
  link: t("See my report"),
  skip: t("Skip to my achievements"),
  foot: t("Back to the Fluency Lab"),
});

export const reportChrome = () => ({
  docTitle: `${t("My Math Fluency Report")} · ${t("Family Math")} · EduWonderLab`,
  title: t("Learning report"),
  eyebrow: t("Printable and shareable"),
  optional: t("A report shows practice and growth. It is never a grade or a prediction, and all practice is optional."),
  back: t("← Back to family math"),
  link: t("See my achievements"),
  skip: t("Skip to the report"),
  foot: t("Back to the Fluency Lab"),
});

export function reportControls(ui) {
  const tab = (id, label) => `<button type="button" class="a4-chip-btn" data-audience="${id}" aria-pressed="${ui.audience === id}" data-fk="aud-${id}">${esc(label)}</button>`;
  const grades = GRADES.map((entry) => `<option value="${entry.grade}"${entry.grade === ui.grade ? " selected" : ""}>${esc(gradeLabel(entry.grade))}</option>`).join("");
  return `<div class="a4-controls"><div class="a4-field"><span id="aud-label">${t("Report for")}</span><div class="a4-seg" role="group" aria-labelledby="aud-label">${tab("student", t("Student report"))}${tab("family", t("Family report"))}</div></div>
    <label class="a4-field">${t("Skills from")}<select id="rp-grade" data-fk="rp-grade">${grades}</select></label>
    <label class="a4-field">${t("Name on the report (optional)")}<input id="rp-name" type="text" maxlength="40" autocomplete="off" value="${esc(ui.name)}" data-fk="rp-name"/></label>
    <div class="a4-actions"><button type="button" class="a4-btn a4-primary" id="rp-print" data-fk="rp-print">${t("Print or save as PDF")}</button><button type="button" class="a4-btn" id="rp-save" data-fk="rp-save">${t("Save as a web page")}</button></div></div>`;
}
