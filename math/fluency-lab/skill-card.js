// Shared pieces of the Fluency Lab 4.0 dashboard: the circular mastery indicator and the illustrated skill card.
// A learner's state is shown three ways at once (a word, a pie-fill shape and a ring pattern), never by colour alone.
// Markup is returned as strings; the caller owns event handling through data-open-key / data-skill hooks.
import { skillArt } from "./illustrations.js";
import { t } from "./i18n.js";

export const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

// Pie fill per state: how much of the small disc is filled (quarters), plus a check on a full disc.
const PIE = {
  new: "",
  learning: "M8 8V1.5A6.5 6.5 0 0 1 14.5 8Z",
  developing: "M8 8V1.5A6.5 6.5 0 0 1 8 14.5Z",
  proficient: "M8 8V1.5A6.5 6.5 0 1 1 1.5 8Z",
  mastered: "M8 1.5A6.5 6.5 0 1 1 8 14.5A6.5 6.5 0 1 1 8 1.5Z",
};

export const stateLabel = (state) =>
  ({
    new: t("New"),
    learning: t("Learning"),
    developing: t("Developing"),
    proficient: t("Proficient"),
    mastered: t("Mastered"),
  })[state] || t("New");

// A 16px pie glyph for the state. Decorative: the word next to it carries the meaning.
export function stateGlyph(state, size = 16) {
  const check =
    state === "mastered"
      ? '<path d="M4.6 8.2l2.3 2.3 4.5-4.8" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
      : "";
  return `<svg class="fl4-glyph" viewBox="0 0 16 16" width="${size}" height="${size}" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5"${state === "new" ? ' stroke-dasharray="2.2 2.2"' : ""}/>${PIE[state] ? `<path d="${PIE[state]}" fill="currentColor"/>` : ""}${check}</svg>`;
}

export const statePill = (state) =>
  `<span class="fl4-state" data-state="${state}">${stateGlyph(state)}<span>${escapeHtml(stateLabel(state))}</span></span>`;

// Circular indicator: arc length is the 0-100 mastery score, the track and arc pattern change with state,
// the centre prints the score (or a dash before the first answer) and the state word sits underneath.
export function masteryRing({ score, state }, { size = 72, word = true } = {}) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const value = score == null ? 0 : Math.max(0, Math.min(100, score));
  const arc = (value / 100) * circumference;
  const label =
    score == null
      ? `${stateLabel(state)}. ${t("No score yet.")}`
      : t("{state}. Mastery score {score} out of 100.", { state: stateLabel(state), score });
  const strong = state === "proficient" || state === "mastered";
  return `<span class="fl4-ring" data-state="${state}">
    <svg viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="${escapeHtml(label)}">
      ${state === "mastered" ? '<circle class="fl4-ring__halo" cx="32" cy="32" r="30.5" fill="none" stroke-width="1.5"/>' : ""}
      <circle class="fl4-ring__track" cx="32" cy="32" r="${radius}" fill="none" stroke-width="6"${state === "new" ? ' stroke-dasharray="2 6" stroke-linecap="round"' : ""}/>
      ${value ? `<circle class="fl4-ring__arc" cx="32" cy="32" r="${radius}" fill="none" stroke-width="${strong ? 7 : 5}" stroke-dasharray="${arc.toFixed(2)} ${(circumference - arc).toFixed(2)}" stroke-linecap="round" transform="rotate(-90 32 32)"/>` : ""}
      <text class="fl4-ring__score" x="32" y="37" text-anchor="middle">${score == null ? "–" : score}</text>
    </svg>
    ${word ? `<span class="fl4-ring__word">${stateGlyph(state, 14)}${escapeHtml(stateLabel(state))}</span>` : ""}
  </span>`;
}

const basisLabel = (basis) =>
  ({
    observed: t("From your answers"),
    inferred: t("A guess from how skills connect"),
    mixed: t("Your answers plus a guess"),
  })[basis] || "";

// A recommendation card: art, strand, title, ring, the plain-language reason and the actions.
export function recommendationCard(entry, signal, { headingLevel = 4 } = {}) {
  const { skill, why, evidence, action, alt } = entry;
  const h = `h${headingLevel}`;
  const art = skillArt(skill, {
    decorative: true,
    size: 64,
    idPrefix: `rc-${skill.grade}-${skill.id}`,
  });
  return `<li class="fl4-card" data-state="${signal.state}" data-basis="${evidence.basis}" data-skill-key="${skill.grade}:${skill.id}">
    <div class="fl4-card__top"><span class="fl4-card__art" aria-hidden="true">${art}</span>
      <div class="fl4-card__id"><p class="fl4-strand">${escapeHtml(t(skill.strand))} · ${escapeHtml(t("Grade {n}", { n: skill.grade }))}</p>
      <${h} class="fl4-card__title">${escapeHtml(t(skill.title))}</${h}></div>
      ${masteryRing(signal, { size: 64 })}</div>
    <p class="fl4-why">${escapeHtml(why)}</p>
    <p class="fl4-basis"><span class="fl4-basis__mark" aria-hidden="true"></span>${escapeHtml(basisLabel(evidence.basis))}</p>
    <div class="fl4-card__actions">
      <button type="button" class="fl-btn" data-open-key="${action.key}" data-open-mode="${action.mode}">${escapeHtml(action.label)}<span class="fl4-visually-hidden"> ${escapeHtml(t(skill.title))}</span></button>
      ${alt ? `<button type="button" class="fl-btn fl-btn--ghost" data-open-key="${alt.key}" data-open-mode="${alt.mode}">${escapeHtml(alt.label)}</button>` : ""}
    </div></li>`;
}

const ICONS = {
  quick:
    '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M11.8 1.8 4.5 10h4.1l-.5 8.2 7.4-9h-4.2l.5-7.4Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  cards:
    '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="6" y="3" width="10" height="13" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M4 6H3.5A1.5 1.5 0 0 0 2 7.5v9A1.5 1.5 0 0 0 3.5 18h8" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M9 7h4m-4 3h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  idea: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6.3 13.2a6 6 0 1 1 7.4 0c-.8.6-1.2 1.2-1.3 2H7.6c-.1-.8-.5-1.4-1.3-2Z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7.8 17h4.4m-3.7 1.5h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
};

// The library card: same art and ring, plus the quick actions and a sample question. The hooks the older
// library code and tests use (.open-skill[data-skill], data-quick-skill, data-flashcard-skill, data-visual-skill)
// are kept. `preview` carries the sample question, its answer and the related skills, computed by the caller.
export function libraryCard(skill, signal, { recommendation = null, preview = null } = {}) {
  const art = skillArt(skill, {
    decorative: true,
    size: 64,
    idPrefix: `lc-${skill.grade}-${skill.id}`,
  });
  const related = preview
    ? `${preview.foundations?.length ? `<p><strong>${t("Builds on")}</strong> ${preview.foundations.map((s) => escapeHtml(s.title)).join(" · ")}</p>` : ""}${preview.next?.length ? `<p><strong>${t("Can lead to")}</strong> ${preview.next.map((s) => escapeHtml(s.title)).join(" · ")}</p>` : ""}`
    : "";
  return `<article class="fl4-skill" data-state="${signal.state}" data-level="${["new", "learning", "developing", "proficient", "mastered"].indexOf(signal.state)}">
    <div class="fl4-card__top"><span class="fl4-card__art" aria-hidden="true">${art}</span>
      <div class="fl4-card__id"><p class="fl4-strand">${escapeHtml(skill.strand)}</p><h3 class="fl4-card__title">${escapeHtml(t(skill.title))}</h3></div>
      ${masteryRing(signal, { size: 64 })}</div>
    <p class="fl4-rule">${escapeHtml(t(skill.learn.rule))}</p>
    ${recommendation ? `<p class="fl4-suggest"><strong>${t("Suggested for you")}</strong> · ${escapeHtml(recommendation)}</p>` : ""}
    ${
      preview
        ? `<details class="fl4-preview"><summary>${t("Preview a sample question")}</summary><div class="fl4-preview__body">
      <p><strong>${skill.standardNote ? t("Extension reference") : t("Standard")}: ${escapeHtml(skill.standard)}</strong>${skill.standardNote ? ` · ${escapeHtml(skill.standardNote)}` : ""}</p>
      <p class="fl4-preview__q">${escapeHtml(preview.question)}</p>
      <details class="sample-answer"><summary>${t("Show sample answer")}</summary><p>${escapeHtml(preview.answer)}</p></details>${related}</div></details>`
        : ""
    }
    <div class="fl4-card__actions fl4-card__actions--library">
      <button class="open-skill fl-btn" data-skill="${skill.id}">${t("Practice & Learn")}</button>
      <div class="fl4-quick">
        <button type="button" class="fl-btn fl-btn--ghost quick-drill-btn" data-quick-skill="${skill.id}">${ICONS.quick}<span>${t("Quick 5")}</span></button>
        <button type="button" class="fl-btn fl-btn--ghost flashcard-btn" data-flashcard-skill="${skill.id}">${ICONS.cards}<span>${t("Flashcards")}</span></button>
        <button type="button" class="fl-btn fl-btn--ghost learn-btn" data-visual-skill="${skill.id}">${ICONS.idea}<span>${t("See idea")}</span></button>
      </div></div></article>`;
}
