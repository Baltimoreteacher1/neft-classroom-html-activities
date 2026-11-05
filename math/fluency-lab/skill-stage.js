// The focused learning screen around one skill: "Grade 3 › Multiplication › Multiply by 5", the
// Learn → Try It → Practice → Play → Grow bar, and the one next action under the work. Pure HTML builders;
// app.js owns the events (data-sp-*, data-stage) and every stage opens the lab's existing modes and panels.
import { t } from "./i18n.js";
import { escapeHtml } from "./skill-card.js";
import { STAGES, stageAfter, stageLabel, topicOf, topicsFor } from "./skill-path.js";

const gradeName = (grade) => (grade === 0 ? t("Kindergarten") : t("Grade {n}", { n: grade }));

export function skillPathHtml({ skill, stage, visited }) {
  const topic = topicOf(skill);
  const siblings = topic
    ? topicsFor(skill.grade).find((entry) => entry.id === topic.id)?.skills || []
    : [];
  const switcher =
    siblings.length > 1
      ? `<label class="sp-switch"><span>${escapeHtml(t("Switch skill"))}</span><select data-sp-switch>${siblings
          .map(
            (entry) =>
              `<option value="${escapeHtml(entry.id)}"${entry.id === skill.id ? " selected" : ""}>${escapeHtml(t(entry.title))}</option>`,
          )
          .join("")}</select></label>`
      : "";
  return `<nav class="sp-crumbs" aria-label="${escapeHtml(t("Where you are"))}"><ol>
      <li><button type="button" data-sp-grade>${escapeHtml(gradeName(skill.grade))}</button></li>
      ${topic ? `<li><button type="button" data-sp-topic="${topic.id}">${escapeHtml(t(topic.name))}</button></li>` : ""}
      <li aria-current="page"><span>${escapeHtml(t(skill.title))}</span></li>
    </ol>${switcher}<button type="button" class="sp-copy" data-sp-copy>${escapeHtml(t("Copy link to this skill"))}</button></nav>
    <ol class="sp-stages" aria-label="${escapeHtml(t("Learning steps"))}">${STAGES.map(
      (entry, index) =>
        `<li><button type="button" data-stage="${entry.id}"${entry.id === stage ? ' aria-current="step"' : ""} data-visited="${visited.has(entry.id) && entry.id !== stage}"><span class="sp-stage__num" aria-hidden="true">${index + 1}</span>${escapeHtml(t(entry.name))}</button></li>`,
    ).join("")}</ol>`;
}

// One prominent next action; Quick Practice stays a quiet second choice, never a second navigation.
export function stageFooterHtml({ stage, pausedPractice }) {
  const go = (id, label, cls) =>
    `<button type="button" class="${cls}" data-stage-go="${id}">${escapeHtml(label)}</button>`;
  const next = stageAfter(stage);
  const forward = next ? t("Continue to {stage}", { stage: t(stageLabel(next)) }) : "";
  let primary = "";
  let secondary = "";
  if (stage === "learn") {
    primary = pausedPractice
      ? go("practice", t("Back to my practice"), "primary-action")
      : go("try", forward, "primary-action");
    secondary = go(
      "practice",
      pausedPractice ? t("Continue to Try It") : t("Go to Practice"),
      "outline-action",
    );
    if (pausedPractice) secondary = go("try", t("Continue to Try It"), "outline-action");
  } else if (stage === "try") {
    primary = pausedPractice
      ? go("practice", t("Back to my practice"), "primary-action")
      : go("practice", forward, "primary-action");
    secondary = go("learn", t("Back to Learn"), "outline-action");
  } else if (stage === "practice") {
    primary = go("play", forward, "primary-action");
    secondary = go("learn", t("Review the idea"), "outline-action");
  } else if (stage === "play") {
    primary = go("grow", forward, "primary-action");
    secondary = go("practice", t("Back to Practice"), "outline-action");
  }
  return `<div class="sp-footer">${primary}${secondary}</div>`;
}

export function growHtml({ skill, status, next, why }) {
  const line = status.independent
    ? t("{a} of {b} recent independent checks correct.", {
        a: status.successes,
        b: status.independent,
      })
    : t("Practice on your own to start your record for this skill.");
  return `<section class="sp-grow" aria-labelledby="sp-grow-title">
    <h3 id="sp-grow-title">${escapeHtml(t("How you are growing"))}</h3>
    <p class="sp-grow__state">${escapeHtml(status.label)}</p>
    <p>${escapeHtml(line)}</p>
    ${why ? `<p class="sp-grow__why">${escapeHtml(why)}</p>` : ""}
    <div class="sp-footer">
      ${next ? `<button type="button" class="primary-action" data-sp-next="${escapeHtml(next.id)}">${escapeHtml(t("Next skill: {skill}", { skill: t(next.title) }))}</button>` : ""}
      <button type="button" class="${next ? "outline-action" : "primary-action"}" data-sp-topic="${topicOf(skill)?.id || ""}">${escapeHtml(t("Choose another skill"))}</button>
      <button type="button" class="outline-action" data-stage-go="practice">${escapeHtml(t("Practice again"))}</button>
    </div>
  </section>`;
}
