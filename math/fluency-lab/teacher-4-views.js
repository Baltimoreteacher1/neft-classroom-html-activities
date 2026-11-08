// Teacher tools 4.0: HTML for each section of the Class insights tab. Pure string builders over an analysis.
// Every finding shows an "Observed" line (counts of saved answers) and a "Possible reason (inferred)" line.
import { esc } from "./reports-export.js";
import { t } from "./i18n.js";
import { mistakeCategoryLabel } from "./mistake-notes.js";
import { findSkill } from "./tutor-engine.js";

const findingLines = (item) =>
  `<p class="t4-obs"><b>${esc(t("Observed:"))}</b> ${esc(item.observed.text)}</p><p class="t4-inf"><b>${esc(t("Possible reason (inferred):"))}</b> ${esc(item.inferred.text)}</p>`;

function lessonHtml(plan) {
  const { miniLesson } = plan;
  return `<details class="t4-more"><summary>${esc(t("Mini-lesson and practice"))}</summary>
    <p><b>${esc(t("Teach:"))}</b> ${esc(miniLesson.rule)}</p><ol>${miniLesson.steps.map((step) => `<li>${esc(step)}</li>`).join("")}</ol>
    <p><b>${esc(t("Model:"))}</b> ${esc(miniLesson.example)}</p>
    ${plan.reteach ? `<p><b>${esc(t("Teaching move:"))}</b> ${esc(plan.reteach)}</p>` : ""}
    ${plan.prerequisiteTitle ? `<p><b>${esc(plan.prerequisiteMeasured ? t("Measured gap to check first:") : t("If learners still struggle, check this skill first:"))}</b> ${esc(plan.prerequisiteTitle)}</p>` : ""}
    <p><b>${esc(t("Suggested practice:"))}</b> ${esc(t("{n} problems, tiers {a} to {b}, target score {score} on {days} days.", { n: plan.practice.count, a: plan.practice.tiers[0], b: plan.practice.tiers[1], score: plan.practice.target.score, days: plan.practice.target.days }))}</p></details>`;
}
const planButton = (kind, index) =>
  `<button type="button" class="fl-btn fl-btn--ghost" data-t4-plan="${kind}:${index}">${esc(t("Add practice to assignment"))}</button>`;

export function summaryHtml(analysis) {
  const { totals } = analysis;
  const tile = (value, label) =>
    `<div class="t4-tile"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`;
  return `<div class="t4-tiles">${tile(totals.learners, t("learners with evidence"))}${tile(totals.skillRecords, t("skill records"))}${tile(totals.answers, t("saved answers"))}${tile(totals.independentShare === null ? "-" : `${totals.independentShare}%`, t("answered independently"))}</div>`;
}

export function troubleHtml(analysis) {
  if (!analysis.troubleSpots.length)
    return `<p class="t4-empty">${esc(t("No skill meets the evidence rules for reteaching yet. A skill needs at least two independent checks from a learner."))}</p>`;
  return analysis.troubleSpots
    .map(
      (spot, index) =>
        `<article class="t4-card"><header><h4>${esc(spot.skill.title)}</h4><span class="t4-tag">${esc(t("{low} of {checked} learners", { low: spot.lowLearners, checked: spot.checkedLearners }))}</span></header>${findingLines(spot)}${lessonHtml(spot.intervention)}${planButton("trouble", index)}</article>`,
    )
    .join("");
}

// fl-teacher: the trouble-spot rule (3 misses of the same item type), ranked by learners who share it.
export function troubleRankHtml(analysis) {
  const list = analysis.troubleRanked || [];
  if (!list.length)
    return `<p class="t4-empty">${esc(t("No learner has missed the same kind of item three times in the last four weeks."))}</p>`;
  const typeName = (spot) =>
    spot.category ? mistakeCategoryLabel(spot.category) || spot.category : t("Any item in this skill");
  return `<ol class="t4-plain t4-rank">${list
    .slice(0, 12)
    .map(
      (spot, index) =>
        `<li><article class="t4-card"><header><h4>${esc(spot.skill.title)}</h4><span class="t4-tag">${esc(typeName(spot))}</span></header>
      <p>${esc(t("{n} learners · {misses} misses in all", { n: spot.learners.length, misses: spot.misses }))}${spot.open ? "" : ` · ${esc(t("All repaired"))}`}</p>
      <p class="t4-hint">${spot.learners.map((name) => `<span class="t4-chip">${esc(name)}</span>`).join(" ")}</p>
      ${spot.intervention.reteach ? `<p><b>${esc(t("Teaching move:"))}</b> ${esc(spot.intervention.reteach)}</p>` : ""}${planButton("spot", index)}</article></li>`,
    )
    .join("")}</ol>`;
}

export function patternsHtml(analysis) {
  const { byPattern, byCategory } = analysis.misconceptions;
  if (!byPattern.length)
    return `<p class="t4-empty">${esc(t("No saved wrong answers matched a known answer pattern."))}</p>`;
  const totals = byCategory
    .map(
      (entry) =>
        `<li><strong>${esc(entry.label)}</strong> <span>${esc(t("{count} saved answers, {n} learners", { count: entry.recorded, n: entry.learners }))}</span></li>`,
    )
    .join("");
  const cards = byPattern
    .map(
      (item, index) =>
        `<article class="t4-card"><header><h4>${esc(item.label)}</h4><span class="t4-tag">${esc(item.skill.title)}</span></header>${findingLines(item)}${lessonHtml(item.intervention)}${planButton("pattern", index)}</article>`,
    )
    .join("");
  return `<ul class="t4-plain">${totals}</ul>${cards}`;
}

const BASIS = () => ({
  misconception: t("Shared answer pattern"),
  gap: t("Shared gap"),
  review: t("Review due"),
  extend: t("Ready to extend"),
});
const NEXT = () => ({
  misconception: t("Reteach with the teaching move, then a short coached set."),
  gap: t("Check the earlier skill with a short set, then return to the later one."),
  review: t("Start with a two-minute retrieval check, then space the next practice."),
  extend: t("Offer harder tiers or a transfer task, and ask learners to explain."),
});

export function groupsHtml(analysis, levelKey) {
  const names = BASIS();
  const next = NEXT();
  const card = (
    group,
    kind,
    index,
  ) => `<article class="t4-card"><header><h4>${esc(group.skill.title)}</h4><span class="t4-tag">${esc(names[group.basis])}</span></header>
    <p class="t4-members"><b>${esc(t("Learners:"))}</b> ${group.learners.map((name) => `<span class="t4-chip">${esc(name)}</span>`).join(" ")}</p>${findingLines(group)}
    <p><b>${esc(t("Suggested next step:"))}</b> ${esc(next[group.basis])}</p>${lessonHtml(group.intervention)}${planButton(kind, index)}</article>`;
  const groups = analysis.groups.length
    ? analysis.groups.map((group, index) => card(group, "group", index)).join("")
    : `<p class="t4-empty">${esc(t("No group of two or more learners shares a gap yet."))}</p>`;
  const single = analysis.individual.length
    ? `<h4 class="t4-sub">${esc(t("Individual check-ins"))}</h4><p class="t4-hint">${esc(t("One learner only, so not a group."))}</p>${analysis.individual.map((item, index) => card(item, "individual", index)).join("")}`
    : "";
  const skillsWithRows = analysis.skills.map((stat) => stat.skill);
  const options = skillsWithRows
    .map(
      (skill) =>
        `<option value="${skill.grade}:${skill.id}" ${levelKey === `${skill.grade}:${skill.id}` ? "selected" : ""}>${esc(skill.title)}</option>`,
    )
    .join("");
  const level = levelKey ? analysis.levelGroupsFor(levelKey) : null;
  const bandNames = {
    support: t("Needs support now"),
    building: t("Building"),
    extend: t("Ready to extend"),
  };
  const levelHtml = level
    ? `<div class="t4-bands">${level.bands.map((band) => `<div class="t4-band"><h5>${esc(bandNames[band.id])} <small>${esc(t("score {range}", { range: band.range }))}</small></h5>${band.learners.length ? band.learners.map((name) => `<span class="t4-chip">${esc(name)}</span>`).join(" ") : `<span class="t4-hint">${esc(t("No one"))}</span>`}</div>`).join("")}</div>${findingLines(level)}`
    : "";
  return `${groups}${single}<h4 class="t4-sub">${esc(t("Group by level on one skill"))}</h4><label class="t4-inline">${esc(t("Skill"))}<select data-t4-level><option value="">${esc(t("Choose a skill"))}</option>${options}</select></label>${levelHtml}`;
}

export function strandsHtml(analysis) {
  if (!analysis.strands.length) return `<p class="t4-empty">${esc(t("No scored skills yet."))}</p>`;
  const strands = analysis.strands.map((entry) => entry.strand);
  const cell = (score) =>
    score === undefined
      ? `<td class="t4-na">-</td>`
      : `<td><span class="t4-bar" style="--v:${Math.round(score)}" aria-hidden="true"></span><span class="t4-num">${Math.round(score)}</span></td>`;
  return `<div class="t4-scroll" role="region" tabindex="0" aria-label="${esc(t("Mastery by strand"))}"><table class="t4-table"><caption class="t4-sr">${esc(t("Average mastery score from 0 to 100 for each learner and strand"))}</caption>
    <thead><tr><th scope="col">${esc(t("Learner"))}</th>${strands.map((strand) => `<th scope="col">${esc(strand)}</th>`).join("")}</tr></thead>
    <tbody>${analysis.learners.map((learner) => `<tr><th scope="row">${esc(learner.label)}</th>${strands.map((strand) => cell(learner.strands[strand])).join("")}</tr>`).join("")}
    <tr class="t4-total"><th scope="row">${esc(t("Class average"))}</th>${analysis.strands.map((entry) => cell(entry.avgScore)).join("")}</tr></tbody></table></div>`;
}

export function progressHtml(analysis) {
  const { totals, retention, growth, supportHeavy } = analysis;
  const studio = analysis.studio || { explorations: 0, independentAttempts: 0, independentCorrect: 0, supportedAttempts: 0, skills: [] };
  const ladder = retention.ladder
    .map((count, index) => `<li>${esc(t("Rung {n}: {count}", { n: index + 1, count }))}</li>`)
    .join("");
  const learnerRows = analysis.learners
    .map(
      (item) =>
        `<tr><th scope="row">${esc(item.label)}</th><td>${item.independentAnswers}</td><td>${item.supportedAnswers}</td><td>${item.independentShare === null ? "-" : `${item.independentShare}%`}</td><td>${item.due}</td><td>${item.overdue}</td><td>${item.retained}</td><td>${item.growthDelta === null ? "-" : (item.growthDelta > 0 ? "+" : "") + item.growthDelta}</td></tr>`,
    )
    .join("");
  const studioSkills = studio.skills.length
    ? `<ul class="t4-plain">${studio.skills.map((row) => {
        const skill = analysis.skills.find((item) => item.key === row.key)?.skill || findSkill(row.key);
        const title = skill?.title || row.key;
        return `<li><strong>${esc(title)}</strong> · ${esc(t("{learners} learners", { learners: row.learners }))} · ${esc(t("{n} model explorations", { n: row.explorations }))} · ${esc(t("{correct} of {n} independent attempts correct", { correct: row.independentCorrect, n: row.independentAttempts }))} · ${esc(t("{n} supported attempts", { n: row.supportedAttempts }))}</li>`;
      }).join("")}</ul>`
    : `<p class="t4-hint">${esc(t("No Math Discovery Studio evidence in the selected files."))}</p>`;
  return `<div class="t4-grid3">
    <section class="t4-panel"><h4>${esc(t("Independent and supported work"))}</h4><p>${esc(t("{independent} independent answers, {supported} supported answers.", { independent: totals.independentAnswers, supported: totals.supportedAnswers }))}</p>
      ${
        supportHeavy.length
          ? `<p>${esc(t("Mostly supported so far:"))}</p><ul>${supportHeavy
              .slice(0, 5)
              .map(
                (item) =>
                  `<li>${esc(item.skill.title)} <small>${esc(t("{share}% supported", { share: item.share }))}</small></li>`,
              )
              .join("")}</ul>`
          : `<p class="t4-hint">${esc(t("No skill is mostly supported work."))}</p>`
      }</section>
    <section class="t4-panel"><h4>${esc(t("Retention"))}</h4><p>${esc(t("{due} reviews due, {overdue} a week or more late, {kept} skills kept 14 or more days.", { due: retention.due, overdue: retention.overdue, kept: retention.retainedSkills }))}</p><p class="t4-hint">${esc(t("Skills waiting at each step of the 1, 3, 7, 14 and 30 day review ladder:"))}</p><ul class="t4-plain">${ladder}</ul></section>
    <section class="t4-panel"><h4>${esc(t("Growth"))}</h4>${growth.learners ? `<p>${esc(t("{n} learners have a growth history. Average change {delta} points; {up} gained 10 or more, {down} lost 10 or more.", { n: growth.learners, delta: growth.avgDelta, up: growth.improved, down: growth.declined }))}</p>${growth.weekly.length > 1 ? sparkline(growth.weekly) : ""}` : `<p class="t4-hint">${esc(t("These files have no growth history yet. It builds as learners practice."))}</p>`}</section></div>
    <section class="t4-panel" aria-labelledby="t4-studio-evidence"><h4 id="t4-studio-evidence">${esc(t("Math Discovery Studio evidence"))}</h4>
      <p>${esc(t("{explorations} model explorations (each after at least three meaningful actions); {correct} of {attempts} fresh independent attempts correct; {supported} supported attempts.", { explorations: studio.explorations, correct: studio.independentCorrect, attempts: studio.independentAttempts, supported: studio.supportedAttempts }))}</p>
      <p class="t4-hint">${esc(t("These are observed Studio actions and attempts, separate from mastery checks. Model exploration and supported success do not count as independent mastery."))}</p>${studioSkills}</section>
    <div class="t4-scroll" role="region" tabindex="0" aria-label="${esc(t("Per-learner progress"))}"><table class="t4-table"><caption class="t4-sr">${esc(t("Independent and supported answers, reviews and growth for each learner"))}</caption>
    <thead><tr><th scope="col">${esc(t("Learner"))}</th><th scope="col">${esc(t("Independent"))}</th><th scope="col">${esc(t("Supported"))}</th><th scope="col">${esc(t("Independent share"))}</th><th scope="col">${esc(t("Reviews due"))}</th><th scope="col">${esc(t("Overdue"))}</th><th scope="col">${esc(t("Kept 14+ days"))}</th><th scope="col">${esc(t("Growth (points)"))}</th></tr></thead><tbody>${learnerRows}</tbody></table></div>`;
}

function sparkline(points) {
  const width = 240;
  const height = 64;
  const xs = (index) => 8 + (index * (width - 16)) / (points.length - 1);
  const ys = (score) => height - 8 - (score / 100) * (height - 16);
  const path = points
    .map(
      (point, index) =>
        `${index ? "L" : "M"}${xs(index).toFixed(1)} ${ys(point.avgScore).toFixed(1)}`,
    )
    .join(" ");
  const label = points.map((point) => `${point.day}: ${point.avgScore}`).join("; ");
  return `<svg class="t4-spark" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(t("Weekly class average score: {list}", { list: label }))}"><path d="${path}" fill="none" stroke="currentColor" stroke-width="2.5"/>${points.map((point, index) => `<circle cx="${xs(index).toFixed(1)}" cy="${ys(point.avgScore).toFixed(1)}" r="3.5" fill="currentColor"/>`).join("")}</svg>`;
}

export function trendsHtml(trend, titleOf) {
  if (trend.points.length < 2)
    return `<p class="t4-empty">${esc(t("Open a second set of learner files from a different date to compare. Each set is one snapshot of the class."))}</p>`;
  const list = (rows, text) =>
    rows.length
      ? `<ul class="t4-plain">${rows.map((row) => `<li><strong>${esc(titleOf(row.key))}</strong> <span>${esc(text(row))}</span></li>`).join("")}</ul>`
      : `<p class="t4-hint">${esc(t("None"))}</p>`;
  const pct = (value) => (value === null ? "-" : `${value}%`);
  return `<div class="t4-scroll" role="region" tabindex="0" aria-label="${esc(t("Snapshot comparison"))}"><table class="t4-table"><caption class="t4-sr">${esc(t("Class measures for each snapshot set"))}</caption>
    <thead><tr><th scope="col">${esc(t("Snapshot"))}</th><th scope="col">${esc(t("Date"))}</th><th scope="col">${esc(t("Learners"))}</th><th scope="col">${esc(t("Average score"))}</th><th scope="col">${esc(t("Change"))}</th><th scope="col">${esc(t("Proficient or mastered"))}</th><th scope="col">${esc(t("Independent"))}</th><th scope="col">${esc(t("Reviews due"))}</th></tr></thead>
    <tbody>${trend.points.map((point) => `<tr><th scope="row">${esc(point.label)}</th><td>${esc(point.day)}</td><td>${point.learners}</td><td>${point.avgScore ?? "-"}</td><td>${point.change === null ? "-" : (point.change > 0 ? "+" : "") + point.change}</td><td>${pct(point.proficientShare)}</td><td>${pct(point.independentShare)}</td><td>${pct(point.dueShare)}</td></tr>`).join("")}</tbody></table></div>
    <div class="t4-grid3"><section class="t4-panel"><h4>${esc(t("Getting easier"))}</h4>${list(trend.improved, (row) => t("{was} learners stuck, now {now}", row))}</section>
    <section class="t4-panel"><h4>${esc(t("Still stuck"))}</h4>${list(trend.stillStuck, (row) => t("{was} before, {now} now", row))}</section>
    <section class="t4-panel"><h4>${esc(t("Newly stuck"))}</h4>${list(trend.newlyStuck, (row) => t("{now} learners", row))}</section></div>`;
}
