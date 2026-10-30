// Markup for the Math Writing Studio. Pure functions: state in, HTML string out, so the studio can redraw a part of
// the page without touching what the learner is typing. Colour belongs to a part's job (say it, show it, explain why,
// check it, wrap up) and is always paired with the job's name.
import { t } from "./i18n.js";
import { LEVELS } from "./language-frames.js";
import { connectors } from "./language-frames.js";
import { JOBS, ORGANIZERS, starterFor } from "./writing-organizers.js";
import { claimLine } from "./writing-prompts.js";
import { esc } from "./writing-print.js";

const pick = (pair, lang) => (lang === "es" ? pair.es : pair.en);

// A small picture of each organizer's shape: one bar per box, in the colour of its job.
function miniShape(organizer) {
  const paired = organizer.id === "compare";
  const rowOf = (index) => (paired && index >= 1 ? index - 1 : index);
  const rows = organizer.boxes.map((box, index) => {
    const side = paired && index < 2;
    const x = side ? 6 + index * 52 : 6;
    const width = side ? 48 : 100;
    return `<rect class="wr-mini-bar" data-job="${box.job}" x="${x}" y="${6 + rowOf(index) * 14}" width="${width}" height="10" rx="3"/>`;
  });
  const height = 6 + (rowOf(organizer.boxes.length - 1) + 1) * 14;
  return `<svg class="wr-mini" viewBox="0 0 112 ${height}" role="presentation" aria-hidden="true">${rows.join("")}</svg>`;
}

export const heroHtml = (level) => `<header class="wr-hero">
  <p class="wr-lede">${esc(t("Plan with an organizer. Write a paragraph. Check it like a test."))}</p>
  <div class="wr-levels" role="group" aria-label="${esc(t("Talk & write help"))}">
    ${LEVELS.map((entry) => `<button type="button" class="wr-level" data-wr-level="${entry.id}" aria-pressed="${entry.id === level}">${esc(t(entry.name))}</button>`).join("")}
  </div>
</header>`;

export const organizerCardsHtml = (
  current,
  lang,
) => `<nav class="wr-organizers" aria-label="${esc(t("Choose an organizer"))}">
  ${ORGANIZERS.map(
    (
      organizer,
    ) => `<button type="button" class="wr-org" data-wr-organizer="${organizer.id}" aria-pressed="${organizer.id === current}">
      ${miniShape(organizer)}
      <strong>${esc(pick(organizer.name, lang))}</strong>
      <span>${esc(pick(organizer.blurb, lang))}</span></button>`,
  ).join("")}
</nav>`;

export function taskHtml(state, skills) {
  const organizer = state.organizer;
  const lang = state.lang;
  const prompt = state.prompt;
  const claim = claimLine(prompt.claim, lang);
  const options = skills
    .map(
      (skill) =>
        `<option value="${esc(`${skill.grade}:${skill.id}`)}"${skill.id === state.skill.id ? " selected" : ""}>${esc(skill.title)}</option>`,
    )
    .join("");
  const fresh = state.confirmNew
    ? `<button type="button" class="wr-btn wr-btn-warn" data-wr-new="yes">${esc(t("Clear my writing and start a new problem"))}</button><button type="button" class="wr-btn" data-wr-new="no">${esc(t("Keep writing"))}</button>`
    : `<button type="button" class="wr-btn" data-wr-new="ask">${esc(t("New problem"))}</button>`;
  return `<section class="wr-task" aria-labelledby="wr-task-title">
  <div class="wr-task-top">
    <h3 id="wr-task-title">${esc(t("Your writing task"))}</h3>
    <label class="wr-select">${esc(t("Skill"))}<select data-wr-skill>${options}</select></label>
    <div class="wr-langs" role="group" aria-label="${esc(t("Write in"))}">
      <button type="button" data-wr-lang="en" aria-pressed="${lang === "en"}">English</button>
      <button type="button" data-wr-lang="es" aria-pressed="${lang === "es"}">Español</button>
    </div>
  </div>
  <p class="wr-problem" lang="en">${esc(prompt.problem)}</p>
  ${claim ? `<p class="wr-claim" lang="${lang}">${esc(claim)}</p>` : ""}
  <p class="wr-direction" lang="${lang}">${esc(pick(prompt.task, lang))}</p>
  ${prompt.spanish ? `<details class="wr-peek"><summary>${esc(t("See it in Spanish"))}</summary><p lang="es">${esc(prompt.spanish)}</p></details>` : ""}
  <div class="wr-task-actions">${fresh}
    <button type="button" class="wr-btn" data-wr-mode="${state.test ? "organizer" : "test"}" aria-pressed="${state.test}">${esc(state.test ? t("Back to the organizer") : t("Practice like the test"))}</button></div>
</section>`;
}

const starterHtml = (box, state) => {
  const level = state.level;
  const asked = Boolean(state.asked[box.id]);
  if (level >= 4 && !asked)
    return `<button type="button" class="wr-link" data-wr-ask="${box.id}">${esc(t("Need a starter?"))}</button>`;
  const text = starterFor(box, level, state.lang, { asked });
  return `<button type="button" class="wr-starter" data-wr-starter="${box.id}" lang="${state.lang}"><span class="wr-starter-tag">${esc(t("Starter"))}</span>${esc(text)}</button>
    <button type="button" class="wr-link" data-wr-blank="${box.id}">${esc(t("Next blank"))}</button>`;
};

export const boxesHtml = (state) => `<div class="wr-sheet" aria-label="${esc(t("Organizer"))}">
  ${state.organizer.boxes
    .map(
      (box) => `<section class="wr-box" data-job="${box.job}">
    <header><span class="wr-job">${esc(pick(JOBS[box.job], state.lang))}</span><h4 id="wr-h-${box.id}">${esc(pick(box.label, state.lang))}</h4></header>
    <p class="wr-box-task" lang="${state.lang}">${esc(pick(box.task, state.lang))}</p>
    <div class="wr-starters">${starterHtml(box, state)}</div>
    <textarea id="wr-${box.id}" data-wr-box="${box.id}" rows="3" lang="${state.lang}" aria-labelledby="wr-h-${box.id}" spellcheck="true">${esc(state.boxes[box.id] || "")}</textarea>
  </section>`,
    )
    .join("")}
</div>`;

export const testHtml = (
  state,
) => `<div class="wr-sheet wr-test" aria-label="${esc(t("Test-style response"))}">
  <section class="wr-box wr-box-test" data-job="end">
    <header><span class="wr-job">${esc(t("Test view"))}</span><h4 id="wr-h-all">${esc(t("Your response"))}</h4></header>
    <p class="wr-box-task" lang="${state.lang}">${esc(pick(state.organizer.prompt, state.lang))}</p>
    <textarea id="wr-all" data-wr-box="all" rows="12" lang="${state.lang}" aria-labelledby="wr-h-all" spellcheck="true">${esc(state.boxes.all || "")}</textarea>
  </section>
  <p class="wr-note">${esc(t("No starters or word bank here. This is how it feels on a test. Use the checklist when you finish."))}</p>
</div>`;

export function bankHtml(state, terms) {
  const lang = state.lang;
  const words = terms
    .map(
      (term) =>
        `<button type="button" class="wr-chip" data-wr-chip="${esc(lang === "es" ? term.es : term.en)}" lang="${lang}">${esc(lang === "es" ? term.es : term.en)}<small>${esc(lang === "es" ? term.en : term.es)}</small></button>`,
    )
    .join("");
  const joiners = connectors()
    .map(
      (word) =>
        `<button type="button" class="wr-chip wr-chip-join" data-wr-chip="${esc(lang === "es" ? word.es : word.en)}" lang="${lang}">${esc(lang === "es" ? word.es : word.en)}</button>`,
    )
    .join("");
  return `<details class="wr-bank"${state.level <= 3 ? " open" : ""}><summary>${esc(t("Words to use"))}</summary>
    <p class="wr-bank-label">${esc(t("Math words"))}</p><div class="wr-chips">${words}</div>
    <p class="wr-bank-label">${esc(t("Joining words"))}</p><div class="wr-chips">${joiners}</div></details>`;
}

export const modelHtml = (state) => {
  const organizer = state.organizer;
  const sentences = organizer.model
    .map((sentence, index) => {
      const box = organizer.boxes[index];
      return `<li data-job="${box.job}"><span class="wr-model-tag">${esc(pick(box.label, state.lang))}</span><span lang="${state.lang}">${esc(pick(sentence, state.lang))}</span></li>`;
    })
    .join("");
  return `<details class="wr-model"><summary>${esc(t("See a model"))}</summary>
    <p class="wr-note">${esc(t("A finished example about a different problem. Notice how each colour does one job."))}</p><ol>${sentences}</ol></details>`;
};

export const previewHtml = (state, parts) => {
  const lang = state.lang;
  const body = parts.length
    ? parts
        .map(
          (part) =>
            `<span class="wr-s" data-job="${part.job}"${part.label ? ` title="${esc(part.label)}"` : ""}>${esc(part.text)}</span>`,
        )
        .join(" ")
    : `<span class="wr-empty">${esc(t("Your paragraph builds here as you write."))}</span>`;
  return `<div class="wr-preview-body" lang="${lang}">${body}</div>`;
};

export function looksHtml(items) {
  return `<ul class="wr-looks">${items
    .map((item) =>
      item.manual
        ? `<li><label><input type="checkbox" data-wr-tick="${item.key}"${item.done ? " checked" : ""}> ${esc(item.label)}</label></li>`
        : `<li class="${item.done ? "got" : ""}"><span aria-hidden="true">${item.done ? "✓" : "○"}</span> ${esc(item.label)}</li>`,
    )
    .join("")}</ul>`;
}

export const portfolioHtml = (pieces, lang) => {
  if (!pieces.length)
    return `<p class="wr-empty-state">${esc(t("Finished paragraphs you save appear here. They stay on this device."))}</p>`;
  return `<ul class="wr-pieces">${pieces
    .map((piece) => {
      const organizer = ORGANIZERS.find((entry) => entry.id === piece.organizer);
      const when = piece.day || new Date(piece.at).toISOString().slice(0, 10);
      return `<li><div><strong>${esc(pick(organizer.name, lang))}</strong><span>${esc(piece.problem)} · ${esc(when)}</span></div>
        <div class="wr-piece-actions"><button type="button" class="wr-btn" data-wr-open="${piece.id}">${esc(t("Open"))}</button>
        <button type="button" class="wr-btn" data-wr-print-piece="${piece.id}">${esc(t("Print"))}</button>
        <button type="button" class="wr-btn" data-wr-delete="${piece.id}" aria-label="${esc(t("Delete this piece"))}">${esc(t("Delete"))}</button></div></li>`;
    })
    .join("")}</ul>`;
};
