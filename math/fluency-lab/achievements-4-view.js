// Markup for the achievements page. Recognition only: no points, no timers, nothing that can be lost. Every illustrated badge
// is decorative because its title, state and evidence are written beside it.
import { achievementText, challengeText, maxGoals, stateLabel } from "./achievements-4.js";
import { badgeArt, emptyStateArt, milestoneArt } from "./illustrations.js";
import { ALL_SKILLS, GRADES } from "./problem-bank.js";
import { findSkill } from "./tutor-engine.js";
import { t } from "./i18n.js";

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const gradeName = (grade) => (grade === 0 ? t("Kindergarten") : t("Grade {n}", { n: grade }));
const BADGE_ART = {
  mastery: "mastery",
  growth: "growth",
  corrected: "corrected",
  retained: "retained",
  goal: "goal",
  challenge: "challenge",
  strand: "strand",
};
export const badgeArtId = (item) => BADGE_ART[item.kind] || "mastery";

const certButton = (item, title) =>
  `<button type="button" class="a4-btn a4-cert" data-cert="${esc(item.id)}" aria-label="${esc(t("Print certificate: {title}", { title }))}">${t("Print certificate")}</button>`;

function card(item, extra = "") {
  const words = achievementText(item);
  const art = badgeArt(badgeArtId(item), {
    earned: true,
    decorative: true,
    size: 64,
    idPrefix: `b-${item.id.replace(/\W/g, "")}`,
  });
  return `<li class="a4-card" data-kind="${item.kind}"><span class="a4-art">${art}</span><div class="a4-card-main"><h3>${esc(words.title)}</h3><p>${esc(words.detail)}</p>${extra}${certButton(item, words.title)}</div></li>`;
}

export function celebrationsHtml(data) {
  const picks = data.badges.filter((item) =>
    ["growth", "corrected", "retained", "goal"].includes(item.kind),
  );
  const body = picks.length
    ? `<ul class="a4-grid">${picks
        .slice(0, 8)
        .map((item) => card(item))
        .join("")}</ul>`
    : `<div class="a4-empty"><span aria-hidden="true">${emptyStateArt("achievements", { decorative: true, size: 72, idPrefix: "a4-empty-1" })}</span><p>${t("Growth, fixed ideas and skills you still remember show up here. They come from practice on your own, so there is nothing to rush.")}</p></div>`;
  return `<section class="a4-sec" aria-labelledby="a4-h-celebrate"><h2 id="a4-h-celebrate">${t("Growth worth celebrating")}</h2><p class="a4-lead">${t("You grew, fixed a tricky idea or kept a skill. That is real learning.")}</p>${body}</section>`;
}

export function badgesHtml(data) {
  const earned = data.badges
    .filter((item) => item.kind === "mastery")
    .sort((a, b) => b.level - a.level || b.score - a.score || a.key.localeCompare(b.key));
  const lead = earned.length
    ? t("{n} skills with a badge", { n: earned.length })
    : t("No skill badges yet. A badge appears when a skill is solid on your own.");
  const cards = earned.map((item) =>
    card(item, `<p class="a4-chip">${esc(stateLabel(item.state))}</p>`),
  );
  const shown = cards.slice(0, 8).join("");
  const rest = cards.slice(8).join("");
  const more = rest
    ? `<details class="a4-more"><summary>${t("Show all {n} badges", { n: earned.length })}</summary><ul class="a4-grid">${rest}</ul></details>`
    : "";
  return `<section class="a4-sec" aria-labelledby="a4-h-badges"><h2 id="a4-h-badges">${t("Skill badges")}</h2><p class="a4-lead">${esc(lead)}</p>${shown ? `<ul class="a4-grid">${shown}</ul>` : ""}${more}</section>`;
}

const LEVEL_WORD = (level) =>
  level === 3
    ? t("Complete")
    : level === 2
      ? t("Halfway")
      : level === 1
        ? t("First step")
        : t("Not started");

export function milestonesHtml(data, ui) {
  const grades = GRADES.map(
    (entry) =>
      `<button type="button" class="a4-chip-btn" data-grade="${entry.grade}" aria-pressed="${entry.grade === ui.grade}">${entry.grade === 0 ? "K" : entry.grade}</button>`,
  ).join("");
  const strands = data.milestones.filter((item) => item.grade === ui.grade);
  const cards = strands
    .map((item) => {
      const rows = item.skills
        .map(
          (skill) =>
            `<li><span>${esc(skill.title)}</span><b>${esc(stateLabel(skill.state))}</b></li>`,
        )
        .join("");
      const art = milestoneArt(Math.max(1, item.level), {
        earned: item.earned,
        decorative: true,
        size: 56,
        idPrefix: `m-${item.id.replace(/\W/g, "")}`,
      });
      return `<details class="a4-strand" data-level="${item.level}"><summary data-fk="s-${esc(item.id)}"><span class="a4-art">${art}</span><span class="a4-strand-main"><b>${esc(item.strand)}</b><small>${t("{n} of {total} skills at proficient or better", { n: item.proficient, total: item.total })} · ${esc(LEVEL_WORD(item.level))}</small></span></summary><ul class="a4-rows">${rows}</ul></details>`;
    })
    .join("");
  return `<section class="a4-sec" aria-labelledby="a4-h-strands"><h2 id="a4-h-strands">${t("Strand milestones")}</h2><p class="a4-lead">${t("Open a strand to see each skill. A milestone grows as more of its skills become solid.")}</p><div class="a4-grades" role="group" aria-label="${esc(t("Choose a grade"))}">${grades}</div><p class="a4-grade-name">${esc(gradeName(ui.grade))}</p><div class="a4-strands">${cards}</div></section>`;
}

export function challengesHtml(data) {
  const cards = data.challenges
    .map((challenge) => {
      const earnedTiers = challenge.tiers.filter((tier) => tier.earned);
      const next = challenge.tiers.find((tier) => !tier.earned);
      const shown = next || challenge.tiers.at(-1);
      const words = challengeText(challenge.id, shown.at);
      const status = next
        ? t("{n} of {total}", { n: challenge.value, total: next.at })
        : t("All levels reached");
      return `<li class="a4-challenge"><span class="a4-art">${badgeArt("challenge", { earned: earnedTiers.length > 0, decorative: true, size: 48, idPrefix: `c-${challenge.id}` })}</span><div><h3>${esc(words.title)}</h3><p>${esc(words.detail)}</p><progress value="${Math.min(challenge.value, shown.at)}" max="${shown.at}" aria-label="${esc(`${words.title}: ${status}`)}"></progress><p class="a4-chip">${esc(t("Level {n} of {total}", { n: earnedTiers.length, total: challenge.tiers.length }))} · ${esc(status)}</p></div></li>`;
    })
    .join("");
  return `<section class="a4-sec" aria-labelledby="a4-h-challenges"><h2 id="a4-h-challenges">${t("Challenges that add up")}</h2><p class="a4-lead">${t("Each challenge has three levels. They count real, independent practice over time, never speed.")}</p><ul class="a4-challenges">${cards}</ul></section>`;
}

export function rhythmHtml(data) {
  const { streak } = data;
  const options = [2, 3, 4, 5]
    .map(
      (n) =>
        `<option value="${n}"${n === streak.weeklyGoal ? " selected" : ""}>${t("{n} days a week", { n })}</option>`,
    )
    .join("");
  const met = streak.thisWeek >= streak.weeklyGoal;
  return `<section class="a4-sec" aria-labelledby="a4-h-rhythm"><h2 id="a4-h-rhythm">${t("Learning rhythm")}</h2><p class="a4-lead">${t("Days you practice are yours to keep. Skipping a day never takes anything away.")}</p><div class="a4-stats"><div><b>${t("{a} of {b}", { a: streak.thisWeek, b: streak.weeklyGoal })}</b><span>${t("days this week")}</span></div><div><b>${streak.current}</b><span>${t("days in a row right now")}</span></div><div><b>${streak.best}</b><span>${t("best run so far")}</span></div></div>${met ? `<p class="a4-note" role="status">${t("You reached your weekly goal. Nice steady work.")}</p>` : `<p class="a4-note">${t("Your weekly goal is optional. Pick one that feels right.")}</p>`}<label class="a4-field">${t("My weekly goal")}<select id="weekly-goal" data-fk="weekly">${options}</select></label></section>`;
}

export function goalsHtml(data, ui) {
  const current = new Set(data.goals.map((goal) => goal.key));
  const open = ALL_SKILLS.filter(
    (skill) => skill.grade === ui.grade && !current.has(`${skill.grade}:${skill.id}`),
  );
  const options = open
    .map(
      (skill) =>
        `<option value="${esc(`${skill.grade}:${skill.id}`)}">${esc(skill.title)}</option>`,
    )
    .join("");
  const rows = data.goals
    .map((goal) => {
      const title = findSkill(goal.key)?.title || goal.key;
      const status = goal.met
        ? t("Reached. You did it.")
        : t("Now: {state}. Started at {start}.", {
            state: stateLabel(goal.state),
            start: stateLabel(goal.startState),
          });
      return `<li class="a4-goal" data-met="${goal.met}"><div><b>${esc(title)}</b><p>${esc(status)}</p></div><button type="button" class="a4-btn" data-goal-remove="${esc(goal.key)}" aria-label="${esc(t("Remove goal: {title}", { title }))}">${t("Remove")}</button></li>`;
    })
    .join("");
  const full = data.goals.length >= maxGoals();
  const form = full
    ? `<p class="a4-note">${t("You have {n} goals. Finish or remove one to add another.", { n: maxGoals() })}</p>`
    : `<div class="a4-field-row"><label class="a4-field">${t("Pick a skill from {grade}", { grade: gradeName(ui.grade) })}<select id="goal-skill" data-fk="goal-skill">${options}</select></label><button type="button" class="a4-btn a4-primary" data-goal-add data-fk="goal-add">${t("Set this goal")}</button></div>`;
  return `<section class="a4-sec" aria-labelledby="a4-h-goals"><h2 id="a4-h-goals">${t("My goals")}</h2><p class="a4-lead">${t("Choose up to {n} skills you want to get solid on. A goal is reached when you solve it on your own.", { n: maxGoals() })}</p>${rows ? `<ul class="a4-goals">${rows}</ul>` : ""}${form}</section>`;
}

export function summaryHtml(data) {
  const tile = (value, label) => `<div><b>${value}</b><span>${esc(label)}</span></div>`;
  return `<div class="a4-stats a4-top">${tile(data.badges.length, t("recognitions earned"))}${tile(data.summary.proficient, t("skills solid or better"))}${tile(data.summary.skills, t("skills practiced"))}</div>`;
}

export function achievementsPage(data, ui) {
  return `${summaryHtml(data)}${celebrationsHtml(data)}${badgesHtml(data)}${milestonesHtml(data, ui)}${challengesHtml(data)}${rhythmHtml(data)}${goalsHtml(data, ui)}`;
}
