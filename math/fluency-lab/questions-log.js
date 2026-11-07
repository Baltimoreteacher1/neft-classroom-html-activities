// Questions Log: every saved miss with the learner's own typed answer, newest first, and "Print my misses as a
// fresh worksheet": one parallel problem per miss (same skill, same generator, new numbers), never the original.
// The log is the learner record's own mistake list (tutor.mistakes in tutor-engine.js), so it already travels in
// the learner file and the JSON backup; nothing new is stored.
import { t } from "./i18n.js";
import { generateProblem, seededRandom } from "./problem-bank.js";
import { escapeHtml } from "./school-tools.js";
import { findSkill } from "./tutor-engine.js";

export const WORKSHEET_MAX = 12;

export function questionsLog(tutor, { grade = null } = {}) {
  return (tutor?.mistakes || [])
    .filter((entry) => {
      const skill = findSkill(entry.key);
      return skill && (grade === null || skill.grade === grade);
    })
    .map((entry) => ({
      id: entry.id,
      key: entry.key,
      skill: findSkill(entry.key),
      question: entry.problemPrompt || entry.question,
      mine: entry.studentInput || entry.submitted || "",
      at: Number(entry.at) || 0,
      repaired: Boolean(entry.resolvedAt),
    }))
    .sort((a, b) => b.at - a.at);
}

// One fresh parallel item per miss, open misses first. Deterministic for a seed.
export function freshWorksheet(entries, seed = 1) {
  const rng = seededRandom(seed);
  const ordered = [...entries.filter((e) => !e.repaired), ...entries.filter((e) => e.repaired)];
  const items = [];
  for (const entry of ordered.slice(0, WORKSHEET_MAX)) {
    let item = null;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const candidate = generateProblem(entry.skill, rng);
      if (candidate?.question && candidate.question !== entry.question) {
        item = candidate;
        break;
      }
    }
    if (item) items.push({ skill: entry.skill, item });
  }
  return items;
}

const day = (at) => (at ? new Date(at).toISOString().slice(0, 10) : "");

export function questionsLogHtml(entries) {
  if (!entries.length)
    return `<p>${escapeHtml(t("No missed questions are saved yet. When you miss one, it appears here with your answer."))}</p>`;
  return `<div class="fl-tt-table-wrap"><table class="fl-tt-table"><caption class="sr-only">${escapeHtml(t("My Questions Log"))}</caption>
    <thead><tr><th scope="col">${escapeHtml(t("Question"))}</th><th scope="col">${escapeHtml(t("My answer"))}</th><th scope="col">${escapeHtml(t("Day"))}</th><th scope="col">${escapeHtml(t("Status"))}</th></tr></thead>
    <tbody>${entries
      .map(
        (entry) =>
          `<tr><td>${escapeHtml(entry.question)}<br><small>${escapeHtml(entry.skill.title)}</small></td><td>${escapeHtml(entry.mine || "—")}</td><td>${escapeHtml(day(entry.at))}</td><td>${escapeHtml(entry.repaired ? t("Fixed") : t("Still to fix"))}</td></tr>`,
      )
      .join("")}</tbody></table></div>`;
}

// Student page then a separate answer-key page (print breaks before the key).
export function worksheetHtml(items, { seed = 1 } = {}) {
  const student = items
    .map(
      ({ item }) =>
        `<li><span>${escapeHtml(item.question.replace(/\s*=\s*\?$/, " ="))}</span><i></i></li>`,
    )
    .join("");
  const key = items
    .map(
      ({ item }) =>
        `<li>${escapeHtml(item.question)} <b>${escapeHtml(item.displayAnswer ?? item.answers?.[0] ?? "")}</b></li>`,
    )
    .join("");
  return `<header><p>EduWonderLab Math Fluency Lab</p><h1>${escapeHtml(t("My misses, fresh practice"))}</h1><div><span>${escapeHtml(t("Name"))}: ________________________</span><span>${escapeHtml(t("Date"))}: ______________</span></div></header>
    <p class="print-directions">${escapeHtml(t("Each problem practises a skill you missed before, with new numbers. Show a useful step."))}</p>
    <ol>${student}</ol><footer>${escapeHtml(t("Worksheet {n}", { n: seed }))}</footer>
    <section class="fl-print-key" style="break-before:page"><h2>${escapeHtml(t("Answer key"))}</h2><ol>${key}</ol></section>`;
}
