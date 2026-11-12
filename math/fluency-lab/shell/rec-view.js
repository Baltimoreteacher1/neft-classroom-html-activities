// How a skill is named to a student, and the recommended-next strip shown on home and after a milestone.
// Links carry `data-skill-link`, which app.js opens in place; without JavaScript they are ordinary links.
import { kidLearnFor } from "../kid-learn.js";
import { AUTHORED } from "./authored/index.js";
import { meterMini } from "./meter.js";
import { esc, named, pickL, tr } from "./words.js";

// The authored student-friendly title when there is one, else the bank title in the interface language.
export const titleOf = (s) => pickL(AUTHORED[`${s.grade}:${s.id}`]?.title) || named(s.title);
// One line: the skill's big idea (bilingual), else the bank rule.
export const blurbOf = (s) => pickL(kidLearnFor(s, s.grade)?.idea) || s.learn?.rule || "";

const reasonText = (row) =>
  row.forSkill ? `${tr("Builds the base for")} ${titleOf(row.forSkill)}` : tr(row.reason);

// rows: recommendedNext() output; meters: { "grade:id": meter } (optional) for the compact mirror.
export function recStripHtml(rows, { title = "Recommended for you", level = 2, meters = {} } = {}) {
  if (!rows.length) return "";
  const h = `h${level}`;
  return `<section class="rec" aria-labelledby="rec-title-${level}"><${h} class="rec-title" id="rec-title-${level}">${esc(tr(title))}</${h}><ul class="rec-list">${rows
    .map(({ skill, ...row }) => {
      const key = `${skill.grade}:${skill.id}`;
      const meter = meters[key];
      return `<li><a class="rec-card" href="?grade=${skill.grade}&skill=${esc(skill.id)}" data-skill-link="${esc(key)}"><span class="rec-name">${esc(titleOf(skill))}</span><span class="rec-why">${esc(reasonText(row))}</span>${meter && meter.stage !== "new" ? meterMini(meter) : ""}</a></li>`;
    })
    .join("")}</ul></section>`;
}
