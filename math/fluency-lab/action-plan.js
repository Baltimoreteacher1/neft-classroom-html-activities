// A printable student action plan from the starting-point checkup: what is already strong, what to work on, the
// next skills in order, and a QR code that reopens the first next skill. It never states a grade level, a score or
// a placement; the checkup recommends topics only (README, Progress rules).
import { t } from "./i18n.js";
import { escapeHtml, localQrMarkup } from "./school-tools.js";

const LAB_URL = "https://eduwonderlab.com/math/fluency-lab/";
const MAX_LINES = 6;

// The link the QR code opens: the first next skill's Learn stage. Short enough for the local QR encoder.
export function resumeUrl(skill, lang = "en") {
  if (!skill) return LAB_URL;
  const url = new URL(LAB_URL);
  url.searchParams.set("grade", String(skill.grade));
  url.searchParams.set("skill", skill.id);
  if (lang === "es") url.searchParams.set("lang", "es");
  return url.href;
}

// summary: checkupSummary(session); next: skill objects in the order to practise (gaps and foundations first).
export function actionPlanData(summary, next) {
  const unique = (list) => [...new Set(list.filter(Boolean))];
  const strengths = unique([...(summary?.solid || []), ...(summary?.secondLook || [])]).slice(
    0,
    MAX_LINES,
  );
  const gaps = unique([
    ...(summary?.gaps || []),
    ...(summary?.unsure || []),
    ...(summary?.foundationGaps || []).map((skill) => skill.title),
  ]).slice(0, MAX_LINES);
  const seen = new Set();
  const nextSkills = (next || [])
    .filter((skill) => skill && !seen.has(skill.id) && seen.add(skill.id))
    .slice(0, 4);
  return { strengths, gaps, nextSkills };
}

export function actionPlanHtml(summary, next, { lang = "en", date = "" } = {}) {
  const plan = actionPlanData(summary, next);
  const list = (items, empty) =>
    items.length
      ? `<ul>${items.map((text) => `<li>${escapeHtml(t(text))}</li>`).join("")}</ul>`
      : `<p>${escapeHtml(empty)}</p>`;
  const href = resumeUrl(plan.nextSkills[0], lang);
  const qr = localQrMarkup(href, { label: t("QR code: open my next skill"), size: 150 });
  return `<article class="fl-action-plan" lang="${lang === "es" ? "es" : "en"}">
    <header><p>EduWonderLab Math Fluency Lab</p><h1>${escapeHtml(t("My math action plan"))}</h1>
      <div><span>${escapeHtml(t("Name"))}: ________________________</span><span>${escapeHtml(t("Date"))}: ${escapeHtml(date || "______________")}</span></div></header>
    <section><h2>${escapeHtml(t("What I already do well"))}</h2>${list(plan.strengths, t("The checkup did not find a strong skill yet. That is fine: it is a starting point."))}</section>
    <section><h2>${escapeHtml(t("What I will work on"))}</h2>${list(plan.gaps, t("Nothing to fix right now. Keep practising to stay strong."))}</section>
    <section><h2>${escapeHtml(t("My next skills, in order"))}</h2>${
      plan.nextSkills.length
        ? `<ol>${plan.nextSkills.map((skill) => `<li>${escapeHtml(t(skill.title))} <label class="fl-plan-box"><input type="checkbox" disabled> ${escapeHtml(t("Practised"))}</label></li>`).join("")}</ol>`
        : `<p>${escapeHtml(t("Ask your teacher which skill to practise next."))}</p>`
    }</section>
    <section class="fl-plan-resume"><h2>${escapeHtml(t("Pick up where I left off"))}</h2>
      ${qr ? `<div class="fluency-local-qr">${qr}</div>` : ""}<p>${escapeHtml(t("Scan the code or open this link to start your next skill:"))}<br><span class="fl-plan-link">${escapeHtml(href)}</span></p></section>
    <footer>${escapeHtml(t("This plan shows what to practise next. It is not a grade or a test score."))}</footer>
  </article>`;
}
