// Goal setting: from the form's answers to one printable sheet. buildSheet() turns the form and the grade-band bank
// into a plain document model (no DOM); sheetHTML() draws it for the preview and for print / Save as PDF;
// sheetText() makes a plain-text copy. docx.js turns the same model into a Word file. One model, three outputs, so the
// screen, the printout and the Word copy can never disagree about what the teacher chose.
import { esc } from "../util.js";
import {
  CELEBRATIONS,
  CHECKINS,
  FAMILY_SUPPORTS,
  LABELS,
  MEASURES,
  REFLECTIONS,
  SCALE,
  TEACHER_SUPPORTS,
  TIMEFRAMES,
} from "./options.js";
import { DOMAIN_NAME, bandOfGrade, linkPath } from "./model.js";

const SITE = "https://thelanguagepage.com/access-practice-lab";
export const MAX_GOALS = 3;
const iso = (d) => d.toISOString().slice(0, 10);

/** A fresh form. `today` is injectable so tests are deterministic. */
export function emptyForm(today = new Date()) {
  return {
    lang: "en",
    style: "both",
    student: "",
    teacher: "",
    school: "",
    grade: "4",
    level: "",
    start: iso(today),
    timeframe: "9w",
    checkin: "biweekly",
    goals: [emptyGoal()],
    teacherSupports: ["frames", "model", "conference"],
    familySupports: ["talk", "practice"],
    reflections: ["proud", "hard", "help"],
    celebrations: ["share"],
  };
}

export const emptyGoal = () => ({
  domain: "speaking",
  goalId: "",
  studentText: "",
  teacherText: "",
  measure: "4of5",
  steps: [],
  evidence: [],
  extraStep: "",
});

const pick = (pair, lang) =>
  lang === "es" ? [pair[1]] : lang === "both" ? [pair[0], pair[1]] : [pair[0]];

/** The bank entries for one goal choice. */
export function bankFor(bank, goal) {
  const D = bank?.domains?.[goal.domain];
  return { D, g: D?.goals.find((x) => x.id === goal.goalId) || null };
}

const addDays = (isoDate, n) => {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
};

/** Check-in dates from the start: every `days` until the review date. */
export function checkinDates(form) {
  const tf = TIMEFRAMES.find((t) => t.id === form.timeframe) || TIMEFRAMES[2];
  const step = (CHECKINS.find((c) => c.id === form.checkin) || CHECKINS[1]).days;
  const end = addDays(form.start, tf.weeks * 7);
  const out = [];
  for (let d = addDays(form.start, step); d < end && out.length < 12; d = addDays(d, step))
    out.push(d);
  return { dates: out, end };
}

const fmtDate = (isoDate, lang) => {
  if (!isoDate) return "";
  const d = new Date(`${isoDate}T12:00:00Z`);
  const loc = lang === "es" ? "es-US" : "en-US";
  return d.toLocaleDateString(loc, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
};

/** The document model both the preview and the Word file draw. `banks` maps a bank band to its loaded JSON. */
export function buildSheet(form, bank) {
  const lang = form.lang || "en";
  const band = bandOfGrade(form.grade);
  const { dates, end } = checkinDates(form);
  const tf = TIMEFRAMES.find((t) => t.id === form.timeframe) || TIMEFRAMES[2];
  const showStudent = form.style !== "teacher";
  const showTeacher = form.style !== "student";
  const goals = form.goals.map((goal, i) => {
    const { D, g } = bankFor(bank, goal);
    const meas = MEASURES.find((m) => m.id === goal.measure) || MEASURES[0];
    const stepItems = (D?.steps || []).filter((s) => goal.steps.includes(s.id));
    const steps = stepItems.map((s) => ({
      text: pick([s.en, s.es], lang),
      href: s.link ? `${SITE}${linkPath(s.link, band)}` : "",
    }));
    if (goal.extraStep?.trim()) steps.push({ text: [goal.extraStep.trim()], href: "" });
    const goalLink = g?.link ? `${SITE}${linkPath(g.link, band)}` : "";
    const studentEn = goal.studentText || g?.en || "";
    const studentEs = goal.studentText ? "" : g?.es || "";
    const teacherEn = goal.teacherText || g?.teacher || "";
    const teacherEs = goal.teacherText ? "" : g?.teacherEs || "";
    return {
      n: i + 1,
      domain: pick(DOMAIN_NAME[goal.domain] || [goal.domain, goal.domain], lang),
      student:
        lang === "es" && studentEs
          ? [studentEs]
          : lang === "both" && studentEs
            ? [studentEn, studentEs]
            : [studentEn],
      teacher:
        lang === "es" && teacherEs
          ? [teacherEs]
          : lang === "both" && teacherEs
            ? [teacherEn, teacherEs]
            : [teacherEn],
      measureStudent: pick(meas.student, lang),
      measureTeacher: pick(meas.teacher, lang),
      steps,
      goalLink,
      evidence: (D?.evidence || [])
        .filter((_, k) => goal.evidence.includes(String(k)))
        .map((e) => pick([e.en, e.es], lang)),
    };
  });
  return {
    lang,
    band,
    showStudent,
    showTeacher,
    title: pick(
      showStudent && !showTeacher
        ? LABELS.title
        : showTeacher && !showStudent
          ? LABELS.titleTeacher
          : LABELS.title,
      lang,
    ),
    info: [
      [LABELS.student, form.student],
      [LABELS.grade, form.grade],
      [LABELS.teacher, form.teacher],
      [LABELS.school, form.school],
      [LABELS.level, form.level],
      [LABELS.start, fmtDate(form.start, lang)],
      [LABELS.until, fmtDate(end, lang)],
    ].map(([label, value]) => ({ label: pick(label, lang), value })),
    timeframe: pick(tf.label, lang),
    goals,
    teacherSupports: TEACHER_SUPPORTS.filter((s) => form.teacherSupports.includes(s.id)).map((s) =>
      pick(s.label, lang),
    ),
    familySupports: FAMILY_SUPPORTS.filter((s) => form.familySupports.includes(s.id)).map((s) =>
      pick(s.label, lang),
    ),
    checkins: dates.map((d, i) => ({ n: i + 1, date: fmtDate(d, lang) })),
    scale: SCALE.map((s) => ({ mark: s.mark, n: s.n, label: pick(s.label, lang) })),
    reflections: REFLECTIONS.filter((r) => form.reflections.includes(r.id)).map((r) =>
      pick(r.label, lang),
    ),
    celebrations: CELEBRATIONS.filter((c) => form.celebrations.includes(c.id)).map((c) =>
      pick(c.label, lang),
    ),
    labels: Object.fromEntries(Object.entries(LABELS).map(([k, v]) => [k, pick(v, lang)])),
  };
}

const lines = (arr, cls = "") =>
  arr
    .map(
      (t, i) =>
        `<span class="gs-line ${cls}${i ? " gs-es" : ""}"${arr.length > 1 ? ` lang="${i ? "es" : "en"}"` : ""}>${esc(t)}</span>`,
    )
    .join("");
const label = (arr) => lines(arr, "gs-label");
const inline = (arr) => esc(arr.join(" / "));

/** The sheet as HTML (escaped). Used by the preview pane and by print / Save as PDF. */
export function sheetHTML(s) {
  const L = s.labels;
  const goalBlocks = s.goals
    .map((g) => {
      const steps = g.steps.length
        ? `<ul class="gs-steps">${g.steps.map((st) => `<li><span class="gs-box" aria-hidden="true"></span><span>${st.href ? `<a href="${esc(st.href)}">${lines(st.text)}</a>` : lines(st.text)}</span></li>`).join("")}</ul>`
        : `<div class="gs-blank"></div><div class="gs-blank"></div>`;
      const ev = g.evidence.length
        ? `<ul class="gs-plain">${g.evidence.map((e) => `<li>${lines(e)}</li>`).join("")}</ul>`
        : `<div class="gs-blank"></div>`;
      return `<section class="gs-goal" aria-label="${esc(g.domain[0])}">
  <header class="gs-goal-head"><span class="gs-goal-n">${g.n}</span><span class="gs-domain">${lines(g.domain)}</span></header>
  ${s.showStudent ? `<div class="gs-field"><h3>${label(L.myGoal)}</h3><p class="gs-big">${lines(g.student)}</p><p class="gs-sub">${inline(L.measure)}: <strong>${inline(g.measureStudent)}</strong></p></div>` : ""}
  ${s.showTeacher ? `<div class="gs-field"><h3>${label(L.goal)}</h3><p>${lines(g.teacher)} <strong>${inline(g.measureTeacher)}</strong></p></div>` : ""}
  <div class="gs-field"><h3>${label(L.steps)}</h3>${steps}${g.goalLink && !g.steps.some((st) => st.href === g.goalLink) ? `<p class="gs-sub"><a href="${esc(g.goalLink)}">${label(L.practice)}</a></p>` : ""}</div>
  <div class="gs-field"><h3>${label(L.evidence)}</h3>${ev}</div>
</section>`;
    })
    .join("");
  const list = (items) =>
    items.length
      ? `<ul class="gs-plain">${items.map((t) => `<li>${lines(t)}</li>`).join("")}</ul>`
      : `<div class="gs-blank"></div>`;
  const scale = `<p class="gs-scale">${s.scale.map((x) => `<span class="gs-scale-i"><b aria-hidden="true">${x.mark}</b> ${lines(x.label)}</span>`).join("")}</p>`;
  const checkins = s.checkins.length
    ? `<table class="gs-table"><thead><tr><th scope="col">#</th><th scope="col">${label(L.date)}</th><th scope="col">${label(L.rating)}</th><th scope="col">${label(L.note)}</th></tr></thead><tbody>${s.checkins.map((c) => `<tr><th scope="row">${c.n}</th><td>${esc(c.date)}</td><td class="gs-mid">${s.scale.map((x) => `<span aria-hidden="true">${x.mark}</span>`).join(" ")}</td><td></td></tr>`).join("")}</tbody></table>${scale}`
    : "";
  return `<article class="gs-sheet" lang="${s.lang === "es" ? "es" : "en"}">
  <header class="gs-head"><h2>${lines(s.title)}</h2><p class="gs-sub">${lines(s.timeframe)}</p></header>
  <dl class="gs-info">${s.info.map((i) => `<div><dt>${label(i.label)}</dt><dd>${esc(i.value) || "&nbsp;"}</dd></div>`).join("")}</dl>
  ${goalBlocks}
  <div class="gs-cols"><section class="gs-field"><h3>${label(L.teacherSup)}</h3>${list(s.teacherSupports)}</section><section class="gs-field"><h3>${label(L.familySup)}</h3>${list(s.familySupports)}</section></div>
  <section class="gs-field"><h3>${label(L.checkins)}</h3>${checkins}</section>
  ${s.reflections.length ? `<section class="gs-field"><h3>${label(L.reflect)}</h3>${s.reflections.map((r) => `<div class="gs-write"><span>${lines(r)}</span></div>`).join("")}</section>` : ""}
  ${s.celebrations.length ? `<section class="gs-field"><h3>${label(L.celebrate)}</h3>${list(s.celebrations)}</section>` : ""}
  <section class="gs-sign"><h3>${label(L.sign)}</h3><div class="gs-sign-row">${[L.signStudent, L.signTeacher, L.signFamily].map((l) => `<div><div class="gs-sign-line"></div>${label(l)} · ${label(L.date)}</div>`).join("")}</div></section>
  <footer class="gs-foot">${label(L.privacy)} · ${label(L.made)}</footer>
</article>`;
}

/** The sheet as plain text, for "Copy as text". */
export function sheetText(s) {
  const one = (arr) => arr.join(" / ");
  const out = [one(s.title), ""];
  for (const i of s.info) out.push(`${one(i.label)}: ${i.value}`);
  out.push(`${one(s.timeframe)}`, "");
  for (const g of s.goals) {
    out.push(`${g.n}. ${one(g.domain)}`);
    if (s.showStudent)
      out.push(`   ${one(s.labels.myGoal)}: ${one(g.student)} (${one(g.measureStudent)})`);
    if (s.showTeacher)
      out.push(`   ${one(s.labels.goal)}: ${one(g.teacher)} ${one(g.measureTeacher)}`);
    for (const st of g.steps) out.push(`   [ ] ${one(st.text)}`);
    for (const e of g.evidence) out.push(`   - ${one(e)}`);
    out.push("");
  }
  out.push(`${one(s.labels.teacherSup)}:`, ...s.teacherSupports.map((t) => `- ${one(t)}`), "");
  out.push(`${one(s.labels.familySup)}:`, ...s.familySupports.map((t) => `- ${one(t)}`), "");
  out.push(`${one(s.labels.checkins)}:`, ...s.checkins.map((c) => `${c.n}. ${c.date}`));
  return out.join("\n");
}
