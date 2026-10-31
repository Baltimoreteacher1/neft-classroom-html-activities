// Fluency Lab 4.0 additions to the Family Math home: grade chips, the optional-practice note and grown-up guide, short
// routines with one-tap start, topic cards, and links to achievements and the report. Pure markup builders; home.js owns
// the state and passes in what each needs.
import { familyArt, strandArt } from "../illustrations.js";
import { escapeHtml as esc, tx } from "./fm2/lang.js";
import { COPY4 as C } from "./home-4-copy.js";

const gradeText = (grade, lang) => (grade === 0 ? tx(C.gradeChipK, lang) : tx(C.gradeChip, lang, { n: grade }));

// Nine radio chips (K to 8). Keeps the radio group named "grade" so home.js reads the same change event as before.
export function gradeChipsHtml({ grades, current, lang }) {
  const chips = grades
    .map((grade) => {
      const label = gradeText(grade, lang);
      const short = grade === 0 ? "K" : String(grade);
      return `<label class="hm4-chip"><input type="radio" name="grade" value="${grade}" ${grade === current ? "checked" : ""} data-fk="grade-${grade}" data-testid="grade-${grade}" aria-label="${esc(label)}"><span aria-hidden="true">${short}</span></label>`;
    })
    .join("");
  return `<fieldset class="hm-field hm4-grades"><legend>${esc(tx(C.gradeGroup, lang))}: <b class="hm4-grade-now" data-testid="grade-now">${esc(gradeText(current, lang))}</b></legend><div class="hm4-chips" data-testid="grade-selector">${chips}</div></fieldset>`;
}

export function optionalHtml(lang) {
  return `<p class="hm4-optional" data-testid="optional-note"><b>${esc(tx(C.optionalTitle, lang))}</b> ${esc(tx(C.optionalText, lang))}</p>`;
}

// `open` is null for the default: open beside the setup on wide screens, folded below it on phones so Start stays near the top.
export function guideHtml(lang, open = null) {
  const isOpen = open ?? (typeof matchMedia === "function" && matchMedia("(min-width: 861px)").matches);
  const steps = tx(C.guideSteps, lang).split("|").map((step) => `<li>${esc(step)}</li>`).join("");
  return `<details class="hm4-guide" data-testid="grownup-guide" ${isOpen ? "open" : ""}><summary data-fk="guide">${esc(tx(C.guideTitle, lang))}</summary><ol>${steps}</ol></details>`;
}

// routines: [{ id, art, title, text, minutes, href }]. href null while the games are still loading.
export function routinesHtml({ routines, grade, lang }) {
  const cards = routines
    .map((routine) => {
      const label = tx(C.routineStart, lang, { name: routine.title });
      const go = routine.href
        ? `<a class="fm2-btn hm4-go" href="${esc(routine.href)}" data-testid="routine-${routine.id}">${esc(label)}</a>`
        : `<button type="button" class="fm2-btn hm4-go" disabled aria-disabled="true">${esc(label)}</button>`;
      return `<li class="hm4-routine" data-routine="${routine.id}"><div class="hm4-routine-head"><span class="hm4-art">${familyArt(routine.art, { decorative: true, size: 72, idPrefix: `rt-${routine.id}` })}</span><div><h3>${esc(routine.title)}</h3><p class="hm4-min">${esc(tx(C.routineMin, lang, { n: routine.minutes }))}</p></div></div><p>${esc(routine.text)}</p>${go}</li>`;
    })
    .join("");
  const note = tx(C.routineNote, lang, { grade: grade === 0 ? "K" : grade });
  return `<ul class="hm4-routines">${cards}</ul><p class="hm-note">${esc(note)}</p>`;
}

export function routineList({ lang, quick, steady, guided }) {
  return [
    { id: "quick", art: "warmup", title: tx(C.routineQuick, lang), text: tx(C.routineQuickText, lang), minutes: 5, href: quick },
    { id: "steady", art: "practice", title: tx(C.routineSteady, lang), text: tx(C.routineSteadyText, lang), minutes: 10, href: steady },
    { id: "guided", art: "guided", title: tx(C.routineGuided, lang), text: tx(C.routineGuidedText, lang), minutes: 10, href: guided },
  ];
}

// topics: [{ key, label, count }] for the chosen grade.
export function topicCardsHtml({ topics, lang }) {
  const cards = topics
    .map((topic) => {
      const count = topic.count === 1 ? tx(C.topicSkill, lang) : tx(C.topicSkills, lang, { n: topic.count });
      return `<li><button type="button" class="hm4-topic" data-open-topic="${esc(topic.key)}" data-fk="topic-${esc(topic.key)}" aria-label="${esc(tx(C.topicOpen, lang, { topic: topic.label }))}"><span class="hm4-art">${strandArt(topic.key, { decorative: true, size: 56, idPrefix: `tp-${topic.key}` })}</span><span class="hm4-topic-text"><b>${esc(topic.label)}</b><small>${esc(count)}</small></span></button></li>`;
    })
    .join("");
  return `<ul class="hm4-topics" data-testid="topic-cards">${cards}</ul>`;
}

export function celebrateHtml({ lang, achievementsHref, reportHref }) {
  return `<div class="hm4-celebrate"><span class="hm4-art">${familyArt("celebrate", { decorative: true, size: 72, idPrefix: "hm4-cel" })}</span><div><h3>${esc(tx(C.celebrateTitle, lang))}</h3><p>${esc(tx(C.celebrateText, lang))}</p><div class="hm4-links"><a class="fm2-btn" href="${esc(achievementsHref)}" data-testid="achievements-link">${esc(tx(C.achievementsLink, lang))}</a><a class="fm2-btn" href="${esc(reportHref)}" data-testid="report-link">${esc(tx(C.reportLink, lang))}</a></div></div></div>`;
}
