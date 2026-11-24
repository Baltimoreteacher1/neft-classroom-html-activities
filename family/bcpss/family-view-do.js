// Second half of the Family Guide: try at home, play together, say it, help, language, celebrate, resources.

import { C, KIND_LABELS } from "./family-copy.js";
import { bi, biList, esc } from "./family-util.js";

export function tryHtml(guide, done) {
  const acts = guide.try_at_home || [];
  if (!acts.length) return "";
  const cards = acts
    .map((a, i) => {
      const id = `fbTry${i}`;
      return `<li class="fb-try${done.includes(i) ? " is-done" : ""}">
        <div class="fb-try-head">
          <h3>${bi(a.title)}</h3>
          <span class="fb-chip">⏱ ${esc(a.minutes)} min</span>
        </div>
        <p class="fb-need">${bi(a.materials, { lead: C.youNeed })}</p>
        ${biList(a.steps, "ol", "fb-steps")}
        <label class="fb-check" for="${id}">
          <input type="checkbox" id="${id}" data-try="${i}"${done.includes(i) ? " checked" : ""} />
          <span>${bi(C.triedIt)}</span>
        </label>
      </li>`;
    })
    .join("");
  return `<p class="fb-intro">${bi(C.tryIntro)}</p><ul class="fb-tries">${cards}</ul>
    <p class="fb-progress" id="fbTryProgress" role="status">${progressInner(acts.length, done.length)}</p>`;
}

export function progressInner(total, n) {
  if (!n) return "";
  const t = C.tried(n, total);
  return bi(n === total ? { en: `${t.en} · ${C.tryDone.en}`, es: `${t.es} · ${C.tryDone.es}` } : t);
}

export function playHtml(guide) {
  const games = (guide.play || [])
    .map(
      (g) => `<li class="fb-game">
        <span class="fb-game-kind">${bi(KIND_LABELS[g.kind] || { en: g.kind, es: g.kind })}</span>
        <h3 lang="en">${esc(g.title)}</h3>
        <p class="fb-game-meta"><span>⏱ ${esc(g.minutes)} min</span>${bi(C.playEnglish)}</p>
        <a class="fb-btn is-primary" href="${esc(g.url)}">${bi(C.play)} <span aria-hidden="true">→</span></a>
      </li>`,
    )
    .join("");
  const labs = (guide.labs || [])
    .map(
      (l) => `<li class="fb-game"><h3>${bi(l.key === "words" ? C.labWords : C.labSpeak)}</h3>
        <a class="fb-btn is-primary" href="${esc(l.url)}">${bi(C.play)} <span aria-hidden="true">→</span></a></li>`,
    )
    .join("");
  if (!games && !labs) return "";
  return `<p class="fb-intro">${bi(C.playIntro)}</p><ul class="fb-games">${games || labs}</ul>`;
}

export function sayHtml(guide) {
  if (!guide.say_it?.length) return "";
  return `<p class="fb-intro">${bi(C.sayIntro)}</p>
    <ul class="fb-say-list">${guide.say_it.map((s) => `<li>${bi(s, { blanks: true, speak: C.hear })}</li>`).join("")}</ul>`;
}

export const helpHtml = (guide) => (guide.help ? biList(guide.help, "ul", "fb-help") : "");

export function languageHtml(guide) {
  return `<p class="fb-intro">${bi(C.languageIntro)}</p>
    <div class="fb-callout">${bi(guide.home_language)}</div>`;
}

export const celebrateHtml = (guide) => `<div class="fb-celebrate"><span class="fb-celebrate-icon" aria-hidden="true">🎉</span>${bi(guide.celebrate)}</div>`;

export function resourcesHtml(guide) {
  const d = guide.downloads || {};
  return `<p class="fb-intro">${bi(C.resourcesIntro)}</p>
    <div class="fb-actions">
      <a class="fb-btn" href="${esc(d.pdf)}" target="_blank" rel="noopener">${bi(C.printPdf)}</a>
      <a class="fb-btn" href="${esc(d.docx)}" download>${bi(C.wordFile)}</a>
    </div>
    <h3 class="fb-subhead">${bi(C.sendPhone)}</h3>
    <div class="fb-actions">
      <button type="button" class="fb-btn is-primary" data-share hidden>${bi(C.share)}</button>
      <button type="button" class="fb-btn" data-copy-link>${bi(C.copy)}</button>
      <a class="fb-btn" data-whatsapp href="https://wa.me/" target="_blank" rel="noopener">${bi(C.whatsapp)}</a>
    </div>
    <p class="fb-toast" id="fbToast" role="status"></p>`;
}

export function navHtml(guide, urlFor) {
  const link = (u, label) =>
    u
      ? `<a class="fb-nav-link" href="${esc(urlFor(u.id))}"><span>${bi(label)}</span><strong lang="en">${esc(u.unit_number)}. ${esc(u.title)}</strong></a>`
      : "";
  const back = `/family/bcpss/?grade=${encodeURIComponent(guide.unit.grade)}&subject=${encodeURIComponent(guide.unit.subject)}`;
  return `<nav class="fb-nav" aria-label="${esc(C.navLabel.en)} / ${esc(C.navLabel.es)}">
    ${link(guide.neighbours?.prev, C.prev)}
    ${link(guide.neighbours?.next, C.next)}
    <a class="fb-nav-link is-plain" href="${esc(back)}"><strong>${bi(C.another)}</strong></a>
  </nav>`;
}
