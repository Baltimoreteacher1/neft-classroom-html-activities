// The front door: Grade → a useful first skill → Start, with optional topic/skill browsing below.
// No account, diagnostic or saved record is needed to use it; progress only adds the resume card.
// Selection happens in place (no reload, no modal); Start hands the chosen grade and skill to the app.
import { GRADES } from "./problem-bank.js";
import { t } from "./i18n.js";
import { topicsFor } from "./skill-path.js";
import { escapeHtml } from "./skill-card.js";

const gradeName = (grade) =>
  grade.grade === 0 ? t("Kindergarten") : t("Grade {n}", { n: grade.grade });
const gradeShort = (grade) => (grade.grade === 0 ? "K" : String(grade.grade));

function resumeHtml(resume) {
  if (!resume) return "";
  return `<section class="ep-resume" aria-labelledby="ep-resume-title">
    <h2 id="ep-resume-title">${escapeHtml(t("Welcome back!"))}</h2>
    <p class="ep-resume__skill">${escapeHtml(t("Continue:"))} <strong>${escapeHtml(resume.title)}</strong> <span class="ep-resume__where">${escapeHtml(resume.where)}</span></p>
    <button type="button" class="ep-btn ep-btn--primary" data-ep-resume>${escapeHtml(t("Continue learning"))}</button>
  </section>`;
}

function gradesHtml(pick) {
  return `<div class="ep-grades" role="group" aria-labelledby="ep-grade-label">${GRADES.map(
    (grade) =>
      `<button type="button" class="ep-grade" data-ep-grade="${grade.grade}" aria-pressed="${pick.grade === grade.grade}" aria-label="${escapeHtml(gradeName(grade))}" style="--grade:${grade.color}">${gradeShort(grade)}</button>`,
  ).join("")}</div>`;
}

function topicsHtml(topics, pick) {
  return `<div class="ep-topics" role="group" aria-labelledby="ep-topic-label">${topics
    .map(
      (topic) =>
        `<button type="button" class="ep-choice" data-ep-topic="${topic.id}" aria-pressed="${pick.topic === topic.id}"><span>${escapeHtml(t(topic.name))}</span><small>${escapeHtml(topic.skills.length === 1 ? t("1 skill") : t("{n} skills", { n: topic.skills.length }))}</small></button>`,
    )
    .join("")}</div>`;
}

function skillsHtml(topic, pick) {
  return `<div class="ep-skills" role="group" aria-labelledby="ep-skill-label">${topic.skills
    .map(
      (skill) =>
        `<button type="button" class="ep-choice ep-choice--skill" data-ep-skill="${escapeHtml(skill.id)}" aria-pressed="${pick.skill === skill.id}"><span>${escapeHtml(t(skill.title))}</span></button>`,
    )
    .join("")}</div>`;
}

function firstSkill(topics) {
  return topics.find((entry) => entry.skills.length)?.skills[0] || null;
}

function render(host, ctx, pick, focus) {
  const grade = GRADES.find((entry) => entry.grade === pick.grade);
  const topics = grade ? topicsFor(grade.grade) : [];
  const topic = topics.find((entry) => entry.id === pick.topic);
  const skill = topic?.skills.find((entry) => entry.id === pick.skill);
  const trail = [
    grade && gradeName(grade),
    topic && t(topic.name),
    skill && t(skill.title),
  ].filter(Boolean);
  host.innerHTML = `<div class="ep">
    ${resumeHtml(ctx.resume)}
    <section class="ep-main" aria-labelledby="ep-title">
      <h2 id="ep-title">${escapeHtml(t("What would you like to learn?"))}</h2>
      ${ctx.resume ? `<p class="ep-or">${escapeHtml(t("Or choose a grade and skill"))}</p>` : ""}
      <h3 id="ep-grade-label" class="ep-label"><span class="ep-num" aria-hidden="true">1</span>${escapeHtml(t("Choose your grade"))}</h3>
      ${gradesHtml(pick)}
      ${grade && skill && pick.quickStart ? `<section class="ep-quick-start" aria-label="${escapeHtml(t("A first step"))}"><div><p class="ep-quick-start__eyebrow">${escapeHtml(t("A first step"))}</p><p>${escapeHtml(t("Start with {skill}, or browse the topics below.", { skill: t(skill.title) }))}</p></div><button type="button" class="ep-btn ep-btn--primary" data-ep-start>${escapeHtml(t("Start with {skill}", { skill: t(skill.title) }))}<span aria-hidden="true"> →</span></button></section>` : ""}
      ${grade ? `<h3 id="ep-topic-label" class="ep-label"><span class="ep-num" aria-hidden="true">2</span>${escapeHtml(t("Choose a topic"))} <span class="ep-label__optional">${escapeHtml(t("or browse"))}</span></h3>${topicsHtml(topics, pick)}` : ""}
      ${topic ? `<h3 id="ep-skill-label" class="ep-label"><span class="ep-num" aria-hidden="true">3</span>${escapeHtml(t("Choose your skill"))}</h3>${skillsHtml(topic, pick)}` : ""}
      <div class="ep-start" ${skill && !pick.quickStart ? "" : "hidden"}>
        <p class="ep-trail" aria-live="polite">${escapeHtml(trail.join(" › "))}</p>
        <button type="button" class="ep-btn ep-btn--primary ep-btn--start" data-ep-start>${escapeHtml(t("Start"))}</button>
      </div>
    </section>
  </div>`;
  if (focus) host.querySelector(focus)?.focus({ preventScroll: true });
}

// ctx: { grade, topic, resume: {title, where} | null, onStart(grade, skillId), onResume() }
export function mountEntryPicker(host, ctx) {
  const grades = new Set(GRADES.map((entry) => entry.grade));
  const pick = { grade: grades.has(ctx.grade) ? ctx.grade : null, topic: null, skill: null };
  if (pick.grade !== null) {
    const topics = topicsFor(pick.grade);
    const start = firstSkill(topics);
    pick.topic = topics.find((entry) => entry.id === ctx.topic || entry.skills.some((candidate) => candidate.id === start?.id))?.id || null;
    pick.skill = topics.find((entry) => entry.id === pick.topic)?.skills[0]?.id || null;
    pick.quickStart = Boolean(start && !ctx.topic);
  }
  render(host, ctx, pick, null);
  const onClick = (event) => {
    const grade = event.target.closest("[data-ep-grade]");
    const topic = event.target.closest("[data-ep-topic]");
    const skill = event.target.closest("[data-ep-skill]");
    if (grade) {
      pick.grade = Number(grade.dataset.epGrade);
      const topics = topicsFor(pick.grade);
      const start = firstSkill(topics);
      pick.topic = topics.find((entry) => entry.skills.some((candidate) => candidate.id === start?.id))?.id || null;
      pick.skill = start?.id || null;
      pick.quickStart = Boolean(start);
      render(host, ctx, pick, `[data-ep-grade="${pick.grade}"]`);
    } else if (topic) {
      pick.topic = topic.dataset.epTopic;
      pick.skill = null;
      pick.quickStart = false;
      render(host, ctx, pick, `[data-ep-topic="${pick.topic}"]`);
    } else if (skill) {
      pick.skill = skill.dataset.epSkill;
      pick.quickStart = false;
      render(host, ctx, pick, `[data-ep-skill="${pick.skill}"]`);
      host.querySelector(".ep-start")?.scrollIntoView?.({ block: "nearest" });
    } else if (event.target.closest("[data-ep-start]") && pick.skill)
      ctx.onStart(pick.grade, pick.skill);
    else if (event.target.closest("[data-ep-resume]")) ctx.onResume();
  };
  host.addEventListener("click", onClick);
  return () => host.removeEventListener("click", onClick);
}
