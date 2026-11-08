// Exports for the class analysis: two CSV files, a JSON file and a printable class report. A file holds only
// what the teacher opened: learner labels (default "Learner N"), skill names and counts. No answer text.
import { mistakeCategoryLabel } from "./mistake-notes.js";
import { t } from "./i18n.js";
import { localDay } from "./tutor-engine.js";

export const esc = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

// Every cell is quoted, quotes are doubled, and text a spreadsheet would run as a formula gets a leading quote.
export function csvCell(value) {
  let text = value === null || value === undefined ? "" : String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export const toCsv = (header, lines) =>
  [header, ...lines].map((line) => line.map(csvCell).join(",")).join("\r\n");

const yesNo = (flag) => (flag ? t("Yes") : t("No"));

export function learnerCsv(analysis) {
  const header = [
    t("Learner"),
    t("Skills with evidence"),
    t("Average score (0-100)"),
    t("Proficient or mastered skills"),
    t("Independent answers"),
    t("Supported answers"),
    t("Independent share (%)"),
    t("Reviews due"),
    t("Reviews overdue"),
    t("Skills kept 14 or more days"),
    t("Answer patterns corrected"),
    t("Growth since first snapshot (points)"),
  ];
  const proficient = (summary) => summary.states.proficient + summary.states.mastered;
  return toCsv(
    header,
    analysis.learners.map((item) => [
      item.label,
      item.skills,
      item.avgScore,
      proficient(item),
      item.independentAnswers,
      item.supportedAnswers,
      item.independentShare,
      item.due,
      item.overdue,
      item.retained,
      item.corrected,
      item.growthDelta,
    ]),
  );
}

export function skillCsv(analysis) {
  const header = [
    t("Learner"),
    t("Grade"),
    t("Skill"),
    t("Standard"),
    t("Strand"),
    t("Score (0-100)"),
    t("Mastery state"),
    t("Independent checks"),
    t("Independent correct"),
    t("Supported answers"),
    t("Review due"),
    t("Review overdue"),
    t("Review step (1-5)"),
    t("Saved wrong answers matching a pattern (observed)"),
    t("Possible pattern (inferred)"),
    t("Last practiced"),
  ];
  return toCsv(
    header,
    analysis.rows.map((row) => {
      const matched = row.mistakes.filter((mistake) => mistake.category);
      const patterns = [
        ...new Set(matched.map((mistake) => mistakeCategoryLabel(mistake.category))),
      ].join("; ");
      return [
        row.label,
        row.skill.grade,
        row.skill.title,
        row.skill.standard,
        row.strand,
        row.score,
        row.state,
        row.independent,
        row.successes,
        row.supportedAll,
        yesNo(row.due),
        yesNo(row.overdue),
        row.ladderStep + 1,
        matched.length,
        patterns,
        row.lastAt ? localDay(row.lastAt) : "",
      ];
    }),
  );
}

const slim = (skill) => ({
  key: `${skill.grade}:${skill.id}`,
  title: skill.title,
  standard: skill.standard,
  strand: skill.strand,
});
const slimFinding = ({ skill, intervention, ...rest }) => ({
  ...rest,
  skill: slim(skill),
  intervention: intervention && { ...intervention, miniLesson: undefined },
});

export function reportJson(analysis, now = Date.now()) {
  return {
    app: "EduWonderLab Fluency Lab",
    kind: "class-report",
    version: 1,
    generatedAt: new Date(now).toISOString(),
    grade: analysis.grade,
    totals: analysis.totals,
    studio: analysis.studio || { explorations: 0, independentAttempts: 0, independentCorrect: 0, supportedAttempts: 0, skills: [] },
    learners: analysis.learners,
    skills: analysis.skills.map(({ skill, ...rest }) => ({ ...rest, skill: slim(skill) })),
    troubleSpots: analysis.troubleSpots.map(slimFinding),
    patterns: analysis.misconceptions.byPattern.map(slimFinding),
    groups: analysis.groups.map(slimFinding),
    strands: analysis.strands,
    retention: analysis.retention,
    growth: analysis.growth,
  };
}

const list = (items, render) =>
  items.length
    ? `<ul>${items.map((item) => `<li>${render(item)}</li>`).join("")}</ul>`
    : `<p>${esc(t("None met the evidence rules."))}</p>`;
const finding = (item) =>
  `<strong>${esc(item.skill.title)}</strong><br><span class="tp-observed"><b>${esc(t("Observed"))}:</b> ${esc(item.observed.text)}</span><br><span class="tp-inferred"><b>${esc(t("Possible reason (inferred)"))}:</b> ${esc(item.inferred.text)}</span>`;

// A printable class summary. showLabels false prints counts only, with no learner label anywhere.
export function classReportHtml(
  analysis,
  { title = "", showLabels = true, now = Date.now() } = {},
) {
  const who = (names) => (showLabels ? ` <small>${esc(names.join(", "))}</small>` : "");
  const gradeText =
    analysis.grade === null ? t("All grades") : t("Grade {n}", { n: analysis.grade });
  const { totals, retention, growth } = analysis;
  return `<article class="teacher-print">
    <header><p>${esc(t("Math Fluency Lab"))} · ${esc(gradeText)} · ${esc(localDay(now))}</p><h1>${esc(title || t("Class report"))}</h1>
    <p>${esc(t("{n} learners, {records} skill records, {answers} saved answers. Prepared on this device from files the teacher opened.", { n: totals.learners, records: totals.skillRecords, answers: totals.answers }))}</p></header>
    <section><h2>${esc(t("How to read this report"))}</h2><p>${esc(t("Observed lines count saved answers. Possible-reason lines are guesses from those counts, never a diagnosis of what a student was thinking. Groups describe one skill today and are not labels for students."))}</p></section>
    <section><h2>${esc(t("Skills to reteach"))}</h2>${list(analysis.troubleSpots.slice(0, 8), (item) => finding(item))}</section>
    <section><h2>${esc(t("Answer patterns to reteach"))}</h2>${list(analysis.misconceptions.byPattern.slice(0, 8), (item) => `${finding(item)}<br><span class="tp-tip"><b>${esc(t("Teaching move"))}:</b> ${esc(item.reteach)}</span>`)}</section>
    <section><h2>${esc(t("Flexible groups for this week"))}</h2>${list(analysis.groups.slice(0, 10), (item) => `${finding(item)}${who(item.learners)}`)}</section>
    <section><h2>${esc(t("Independent and supported work"))}</h2><p>${esc(t("{independent} independent answers and {supported} supported answers. {share}% of saved answers were independent.", { independent: totals.independentAnswers, supported: totals.supportedAnswers, share: totals.independentShare ?? 0 }))}</p></section>
    <section><h2>${esc(t("Retention"))}</h2><p>${esc(t("{due} skill reviews are due and {overdue} are a week or more late. {kept} skills were kept at least 14 days.", { due: retention.due, overdue: retention.overdue, kept: retention.retainedSkills }))}</p></section>
    <section><h2>${esc(t("Growth"))}</h2><p>${esc(growth.learners ? t("{n} learners have a growth history. Average change: {delta} points.", { n: growth.learners, delta: growth.avgDelta }) : t("No growth history in these files yet."))}</p></section>
    <section><h2>${esc(t("Math Discovery Studio evidence"))}</h2><p>${esc(t("{explorations} model explorations; {correct} of {attempts} fresh independent attempts correct; {supported} supported attempts.", { explorations: analysis.studio?.explorations || 0, correct: analysis.studio?.independentCorrect || 0, attempts: analysis.studio?.independentAttempts || 0, supported: analysis.studio?.supportedAttempts || 0 }))}</p><p>${esc(t("These practice observations are separate from mastery checks. Model exploration and supported success do not count as independent mastery."))}</p></section>
    <footer><p>${esc(t("Identifiable data stays on this device. This page lists only the labels the teacher opened or typed."))}</p></footer>
  </article>`;
}
