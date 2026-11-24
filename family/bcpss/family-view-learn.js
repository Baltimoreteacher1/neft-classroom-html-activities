// First half of the Family Guide: hero, what your child is learning, words to know, talk about it.

import { C, SUBJECT_NAMES, gradeName } from "./family-copy.js";
import { bi, biList, esc, sayButton } from "./family-util.js";

const firstSentence = (text) => String(text || "").split(/(?<=[.!?])\s+/)[0];
const join = (parts, sep) => ({ en: parts.map((x) => x.en).join(sep), es: parts.map((x) => x.es).join(sep) });

export function heroHtml(guide, startId) {
  const u = guide.unit;
  const eyebrow = join([gradeName(u.grade), SUBJECT_NAMES[u.subject] || { en: u.subject, es: u.subject }, { en: `Unit ${u.unit_number}`, es: `Unidad ${u.unit_number}` }], " · ");
  const lead = { en: firstSentence(guide.summary.en), es: firstSentence(guide.summary.es) };
  return `<section class="fb-hero" aria-labelledby="fbTitle">
    <p class="fb-eyebrow">${bi(eyebrow)}</p>
    <h1 id="fbTitle" lang="en">${esc(u.title)}</h1>
    <p class="fb-lead">${bi(lead)}</p>
    <a class="fb-btn is-primary is-large" href="#${startId}">${bi(C.startHere)} <span aria-hidden="true">↓</span></a>
    <p class="fb-hero-help">${bi(C.heroHelp)}</p>
    <div class="fb-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  </section>`;
}

function goalsHtml(guide) {
  if (guide.goals) return `${`<p class="fb-goals-lead">${bi(C.goalsLead)}</p>`}${biList(guide.goals, "ul", "fb-goals")}`;
  if (!guide.can_do) return "";
  const items = [
    [C.goalContent, guide.can_do.content],
    [C.goalLanguage, guide.can_do.language],
  ];
  return `<p class="fb-goals-lead">${bi(C.goalsLead)}</p><ul class="fb-goals">${items
    .map(([label, text]) => `<li>${bi(text, { lead: label })}</li>`)
    .join("")}</ul>`;
}

/** The hero already shows the first sentence of the summary; this section carries the rest. */
const restOf = (text) => String(text || "").split(/(?<=[.!?])\s+/).slice(1).join(" ");

export function learnHtml(guide) {
  const rest = { en: restOf(guide.summary.en), es: restOf(guide.summary.es) };
  const prose = rest.en ? `<div class="fb-prose">${bi(rest.es ? rest : { en: rest.en, es: null }, { cls: "fb-summary" })}</div>` : "";
  return `${prose}${goalsHtml(guide)}`;
}

function wordCard(w) {
  const hearEn = C.hearEn;
  const hearEs = C.hearEs;
  const spanish = w.es ? `<span class="fb-word-es" lang="es">${esc(w.es)}</span>${sayButton(w.es, "es", hearEs.es)}` : "";
  return `<li class="fb-word">
    <div class="fb-word-head">
      ${w.icon ? `<span class="fb-word-icon" aria-hidden="true">${esc(w.icon)}</span>` : ""}
      <div class="fb-word-names">
        <span class="fb-wp"><span class="fb-word-en" lang="en">${esc(w.term)}</span>${sayButton(w.term, "en", hearEn.en)}</span>
        ${spanish ? `<span class="fb-wp">${spanish}</span>` : ""}
      </div>
      ${w.cognate ? `<span class="fb-badge">${bi(C.cognate)}</span>` : ""}
    </div>
    ${w.def.en ? `<p class="fb-word-line">${bi(w.def, { speak: C.hear, lead: C.meaning })}</p>` : ""}
    ${w.example.en ? `<p class="fb-word-line fb-word-example">${bi(w.example, { speak: C.hear, lead: C.example })}</p>` : ""}
  </li>`;
}

export function wordsHtml(guide) {
  if (!guide.vocab.length) return "";
  return `<p class="fb-intro">${bi(C.wordsIntro)}</p><ul class="fb-words">${guide.vocab.map(wordCard).join("")}</ul>`;
}

export function talkHtml(guide) {
  if (!guide.talk?.length) return "";
  return `<p class="fb-intro">${bi(C.talkIntro)}</p>
    <ul class="fb-talk">${guide.talk.map((q) => `<li>${bi(q)}</li>`).join("")}</ul>`;
}
