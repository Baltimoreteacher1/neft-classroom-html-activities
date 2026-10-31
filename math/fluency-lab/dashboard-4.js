// Fluency Lab 4.0 student home. Mounted by app.js into #personal-dashboard. It shows one prominent
// "Continue learning" step, the recommendation sections with their plain-language reasons, review reminders,
// streak and badges, grade and strand navigation, and the grade's skill map. All data comes from the tutor
// record already on this device; nothing is sent anywhere. Actions use the data-* hooks app.js already handles
// (data-open-key + data-open-mode, data-resume-practice, data-start-daily, data-start-checkup, data-view).
import {
  badgeArt,
  emptyStateArt,
  gradeArt,
  headerArt,
  onboardingArt,
  strandArt,
} from "./illustrations.js";
import { t } from "./i18n.js";
import {
  CONTINUE_ORDER,
  continueTarget,
  dueSkills,
  recommend,
  upcomingReviews,
  weekdayName,
} from "./recommendation-engine.js";
import { progressByGrade, progressByStrand } from "./progress-summary.js";
import { STICKERS, daysThisWeek, earnedIds, loadRewards, rankFor, summarize } from "./rewards.js";
import { escapeHtml, masteryRing, recommendationCard, statePill } from "./skill-card.js";
import { mountSkillMap } from "./skill-map.js";
import { localDay } from "./tutor-engine.js";

const contexts = new WeakMap();

const bar = (value, max, label) =>
  `<span class="fl4-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${value}" aria-label="${escapeHtml(label)}"><span style="--p:${max ? Math.round((value / max) * 100) : 0}%"></span></span>`;

const futureText = (days) =>
  days <= 0 ? t("today") : days === 1 ? t("tomorrow") : t("in {n} days", { n: days });

function heroHtml(ctx, sections, target) {
  const fresh = !ctx.resume && !target?.evidence.counts.checks && !ctx.hasAnyRecord;
  const resume = ctx.resume;
  const skill = target?.skill;
  const ring =
    target && !resume
      ? masteryRing(
          { score: target.evidence.counts.score, state: target.evidence.state },
          { size: 88, word: false },
        )
      : "";
  const action = resume
    ? `<button type="button" class="fl-btn fl-btn--hero" data-resume-practice>${t("Continue learning")} <span aria-hidden="true">→</span></button>`
    : target
      ? `<button type="button" class="fl-btn fl-btn--hero" data-open-key="${target.action.key}" data-open-mode="${target.action.mode}">${t("Continue learning")} <span aria-hidden="true">→</span></button>`
      : "";
  const checkup = ctx.tutor.diagnostics?.[ctx.grade];
  const body = resume
    ? `<p class="fl4-hero__skill">${escapeHtml(resume.title)}</p><p class="fl4-hero__why">${escapeHtml(t("{n} problems already completed. Your work is saved on this device.", { n: resume.answered }))}</p>`
    : skill
      ? `<p class="fl4-hero__skill">${escapeHtml(t(skill.title))}</p>${statePill(target.evidence.state)}<p class="fl4-hero__why">${escapeHtml(target.why)}</p>`
      : "";
  return `<section class="fl4-hero journey-continue" aria-labelledby="fl4-hero-title" data-fresh="${fresh}">
    <div class="fl4-hero__art" aria-hidden="true">${fresh ? onboardingArt(1, { decorative: true, size: 160, idPrefix: "hero" }) : headerArt("dashboard", { decorative: true, size: 160, idPrefix: "hero" })}</div>
    <div class="fl4-hero__copy">
      <p class="fl4-overline">${escapeHtml(ctx.gradeLabel)} · ${escapeHtml(ctx.profileName)}</p>
      <h2 id="fl4-hero-title">${fresh ? t("Welcome. Here is your first step.") : t("Continue learning")}</h2>
      <div class="fl4-hero__target">${ring ? `<div class="fl4-hero__ring">${ring}</div>` : ""}<div>${body}</div></div>
      <div class="fl4-hero__actions">${action}
        <button type="button" class="fl-btn fl-btn--ghost" data-start-daily>${t("Open today’s practice")}</button>
        <button type="button" class="fl-btn fl-btn--ghost" data-start-checkup>${checkup ? t("Check my starting point") : t("Find a starting point")}</button>
      </div></div>
  </section>${fresh ? onboardingHtml() : ""}`;
}

// Three plain steps for a learner with nothing recorded yet.
function onboardingHtml() {
  const steps = [t("See the idea"), t("Try it with help"), t("Try it on your own")];
  return `<ol class="fl4-steps" aria-label="${escapeHtml(t("How a skill works"))}">${steps
    .map(
      (text, index) =>
        `<li><span class="fl4-steps__art" aria-hidden="true">${onboardingArt(index + 1, { decorative: true, size: 56, idPrefix: `ob${index}` })}</span><span><b>${index + 1}</b> ${escapeHtml(text)}</span></li>`,
    )
    .join("")}</ol>`;
}

function reminderHtml(ctx) {
  const due = dueSkills(ctx.tutor, ctx.grade, ctx.now);
  if (due.length) {
    const first = due[0];
    const text =
      due.length === 1
        ? t("{n} skill ready for a memory refresh.", { n: due.length })
        : t("{n} skills ready for a memory refresh.", { n: due.length });
    return `<aside class="fl4-reminder" data-kind="due" aria-label="${escapeHtml(t("Review reminder"))}"><p><b>${escapeHtml(text)}</b></p>
      <button type="button" class="fl-btn fl-btn--ghost" data-open-key="${first.key}" data-open-mode="adaptive">${escapeHtml(t("Start with {skill}", { skill: t(first.skill.title) }))}</button></aside>`;
  }
  const next = upcomingReviews(ctx.tutor, ctx.grade, ctx.now)[0];
  if (!next) return "";
  return `<aside class="fl4-reminder" data-kind="soon" aria-label="${escapeHtml(t("Review reminder"))}"><p>${escapeHtml(t("Next refresh: {skill}, {when}.", { skill: t(next.skill.title), when: futureText(next.days) }))}</p></aside>`;
}

function planHtml(sections) {
  const shown = CONTINUE_ORDER.map((id) => sections.find((section) => section.id === id)).filter(
    (section) => section.items.length,
  );
  if (!shown.length) return "";
  return `<section class="fl4-plan" aria-labelledby="fl4-plan-title"><h2 id="fl4-plan-title">${t("Your next steps")}</h2>
    ${shown
      .map(
        (
          section,
        ) => `<section class="fl4-rec" data-section="${section.id}" aria-labelledby="fl4-rec-${section.id}">
      <header><h3 id="fl4-rec-${section.id}">${escapeHtml(section.title)}</h3><p>${escapeHtml(section.blurb)}</p></header>
      <ul class="fl4-rec__list">${section.items.map((entry) => recommendationCard(entry, { score: entry.evidence.counts.score, state: entry.evidence.state })).join("")}</ul></section>`,
      )
      .join("")}</section>`;
}

function lastSevenDays(days, now) {
  const out = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    out.push({ date, on: days.includes(localDay(date.getTime())) });
  }
  return out;
}

function rewardsHtml(ctx) {
  const data = loadRewards();
  const summary = summarize(undefined, data);
  const rank = rankFor(summary);
  const week = Math.min(daysThisWeek(data.days, ctx.now), data.goal);
  const earned = earnedIds(summary);
  const shown = STICKERS.filter((sticker) => earned.includes(sticker.id)).slice(-6);
  const strip = lastSevenDays(data.days, ctx.now)
    .map(
      ({ date, on }) =>
        `<li data-on="${on}"><span class="fl4-dot" aria-hidden="true">${on ? '<svg viewBox="0 0 16 16"><path d="M4 8.4l2.6 2.6L12 5.4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ""}</span><span>${escapeHtml(weekdayName(date.getDay()).slice(0, 3))}<span class="fl4-visually-hidden"> ${on ? escapeHtml(t("practiced")) : escapeHtml(t("no practice"))}</span></span></li>`,
    )
    .join("");
  const streakText =
    summary.streak === 1
      ? t("{n} day in a row", { n: summary.streak })
      : t("{n} days in a row", { n: summary.streak });
  const todayText =
    ctx.completedToday > 0
      ? ctx.completedToday === 1
        ? t("{n} problem completed today", { n: ctx.completedToday })
        : t("{n} problems completed today", { n: ctx.completedToday })
      : t("A little practice over time helps ideas stick.");
  const toNext = rank.next
    ? t("{n} more to {rank}", { n: rank.next.at - rank.score, rank: rank.next.name })
    : t("Top rank");
  return `<section class="fl4-rewards" aria-labelledby="fl4-rewards-title"><h2 id="fl4-rewards-title">${t("Your streak and badges")}</h2>
    <div class="fl4-rewards__grid">
      <div class="fl4-panel"><p class="fl4-big">${summary.streak}</p><p class="fl4-big__label">${escapeHtml(streakText)}</p><p class="fl4-panel__note">${escapeHtml(todayText)}</p><ol class="fl4-week" aria-label="${escapeHtml(t("The last seven days"))}">${strip}</ol>
        ${summary.streak ? "" : `<div class="fl4-empty"><span aria-hidden="true">${emptyStateArt("streak", { decorative: true, size: 56, idPrefix: "streak" })}</span><p>${t("Practice today to start")}</p></div>`}</div>
      <div class="fl4-panel"><p class="fl4-panel__label">${escapeHtml(t("Your weekly goal"))}</p>
        <p class="fl4-panel__value">${escapeHtml(t("This week: {a} of {b} days", { a: week, b: data.goal }))}</p>${bar(week, data.goal, t("This week: {a} of {b} days", { a: week, b: data.goal }))}
        <p class="fl4-panel__label fl4-panel__label--gap">${escapeHtml(rank.name)}</p><p class="fl4-panel__note">${escapeHtml(toNext)}</p></div>
      <div class="fl4-panel"><p class="fl4-panel__label">${escapeHtml(t("{n} of {m} stickers", { n: earned.length, m: STICKERS.length }))}</p>
        ${shown.length ? `<ul class="fl4-badges">${shown.map((sticker) => `<li><span aria-hidden="true">${badgeArt(sticker.id, { earned: true, decorative: true, size: 56, idPrefix: `bd-${sticker.id}` })}</span><b>${escapeHtml(t(sticker.name))}</b></li>`).join("")}</ul>` : `<div class="fl4-empty"><span aria-hidden="true">${emptyStateArt("badges", { decorative: true, size: 56, idPrefix: "badges" })}</span><p>${t("Finish a trail round to earn your first sticker.")}</p></div>`}</div>
    </div></section>`;
}

function navHtml(ctx) {
  const grades = progressByGrade(ctx.tutor, ctx.now);
  const strands = progressByStrand(ctx.tutor, ctx.grade, ctx.now);
  const count = (row) => t("{a} of {b} skills strong", { a: row.strong, b: row.total });
  return `<section class="fl4-nav" aria-labelledby="fl4-nav-title"><h2 id="fl4-nav-title">${t("Find your way")}</h2>
    <h3 class="fl4-subhead">${escapeHtml(t("Choose a grade"))}</h3><nav aria-label="${escapeHtml(t("Choose a grade"))}"><ul class="fl4-grades">${grades
      .map(
        (row) =>
          `<li><button type="button" class="fl4-tile" data-fl4-grade="${row.grade}" aria-pressed="${row.grade === ctx.grade}"><span class="fl4-tile__art" aria-hidden="true">${gradeArt(row.grade, { decorative: true, size: 40, idPrefix: `ga${row.grade}` })}</span><span class="fl4-tile__name">${escapeHtml(row.grade === 0 ? t("Kindergarten") : t("Grade {n}", { n: row.grade }))}</span><span class="fl4-tile__count">${escapeHtml(count(row))}</span>${bar(row.strong, row.total, count(row))}</button></li>`,
      )
      .join("")}</ul></nav>
    <h3 class="fl4-subhead">${escapeHtml(t("Choose a strand in Grade {n}", { n: ctx.grade }))}</h3><nav aria-label="${escapeHtml(t("Choose a strand in Grade {n}", { n: ctx.grade }))}"><ul class="fl4-strands">${strands
      .map(
        (row) =>
          `<li><button type="button" class="fl4-tile fl4-tile--strand" data-fl4-strand="${escapeHtml(row.strand)}" aria-pressed="${row.strand === ctx.strand}"><span class="fl4-tile__art" aria-hidden="true">${strandArt(row.strand, { decorative: true, size: 40, idPrefix: `sa-${row.strand.replace(/\W/g, "")}` })}</span><span class="fl4-tile__name">${escapeHtml(t(row.strand))}</span><span class="fl4-tile__count">${escapeHtml(count(row))}</span>${bar(row.strong, row.total, count(row))}</button></li>`,
      )
      .join("")}</ul></nav></section>`;
}

function doorsHtml(ctx) {
  const count = ctx.gradeSkillCount;
  return `<div class="fl4-doors">
    <button type="button" class="fl4-door journey-game" data-view="games"><span class="fl4-overline">${t("Untimed · think and play")}</span><strong>${t("Play a game")}</strong><span>${t("Build, compare, and solve with the Game Room activities.")}</span><span class="fl4-door__link">${t("Choose a game")} <span aria-hidden="true">→</span></span></button>
    <article class="fl4-door journey-explore"><span class="fl4-overline">${t("Grades 1–8 · many ways in")}</span><h3>${t("Explore skills")}</h3><p>${t("Browse the grade-level library by topic. Every skill includes a lesson, practice, and ways to check your thinking.")}</p><a class="fl4-door__link" href="#subnav-skills">${t("Browse {count} Grade {grade} skills", { count, grade: ctx.grade })} <span aria-hidden="true">→</span></a></article></div>`;
}

// ctx: { tutor, grade, now, gradeLabel, profileName, strand, resume: {title, answered}|null, gradeSkillCount,
//        evidenceHtml, onGrade(grade), onStrand(strand) }
export function mountDashboard(host, ctx) {
  const full = { now: Date.now(), strand: "All", evidenceHtml: "", ...ctx };
  full.hasAnyRecord = Object.values(full.tutor.records).some(
    (record) => record.recent?.length || record.lessonCompleted,
  );
  contexts.set(host, full);
  const sections = recommend(full.tutor, full.grade, full.now);
  const target = continueTarget(sections);
  host.innerHTML = `<div class="fl4-home">${heroHtml(full, sections, target)}${reminderHtml(full)}${planHtml(sections)}${rewardsHtml(full)}${navHtml(full)}
    <section class="fl4-pathway" aria-labelledby="fl4-map-title"><h2 id="fl4-map-title">${escapeHtml(t("Your Grade {n} skill map", { n: full.grade }))}</h2><p>${t("See how skills build on each other. Open any skill to learn or practice it.")}</p><div id="fl4-map-host"></div></section>
    ${doorsHtml(full)}${full.evidenceHtml ? `<div class="journey-evidence">${full.evidenceHtml}</div>` : ""}</div>`;
  mountSkillMap(host.querySelector("#fl4-map-host"), {
    grade: full.grade,
    tutor: full.tutor,
    now: full.now,
  });
  if (!host.dataset.fl4Bound) {
    host.dataset.fl4Bound = "1";
    host.addEventListener("click", (event) => {
      const current = contexts.get(host);
      const grade = event.target.closest("[data-fl4-grade]");
      if (grade) current.onGrade?.(Number(grade.dataset.fl4Grade));
      const strand = event.target.closest("[data-fl4-strand]");
      if (strand) current.onStrand?.(strand.dataset.fl4Strand);
    });
  }
  return { sections, target };
}
