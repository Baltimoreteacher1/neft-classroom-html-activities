// Book Studio band-program markup (src/book/programs.js holds the data): the template card, the author's process strip,
// the author's-craft mini-lessons, the standards note, the editor's stage guide and the Finish self-check. Returns HTML
// strings; the bookshelf view, the editor dock (ui-story.js) and the Finish dialog (editor-dialogs.js) wire them in.
import { bkIcon } from "./icons.js";
import { bookFromTemplate, pick } from "./model.js";
import { EDITOR_STAGE_MAP, KEY_USES, STAGE_ICON, bookBand, programFor } from "./programs.js";
import { rubricFor } from "./rubrics.js";
import { esc, pageHTML } from "./render.js";
import { BASE } from "../util.js";

const langOf = (I) => (I.mode === "es" ? "es" : "en");

/** One template as a publisher catalogue card: fixed-ratio cover, key-language-use tag, page count, band note. */
export function templateCard(t, I, { band } = {}) {
  const lang = langOf(I);
  const b = bookFromTemplate(t, { title: pick(t.title, lang), lang });
  const use = KEY_USES[pick(t.purpose, "en")] || null;
  const only = t.grades?.length === 1 ? t.grades[0].replace("-", "–") : "";
  return `<li class="bk-tpl"><a href="${BASE}/book-studio/new?template=${t.id}${band ? `&grades=${band}` : ""}">
    <span class="bk-tpl-cover"><span class="bk-thumb-page" aria-hidden="true">${pageHTML(b, b.pages[0], { mode: "thumb" })}</span></span>
    <span class="bk-tpl-body">
      ${use ? `<span class="bk-use is-${use.tone}">${esc(use[lang])}</span>` : ""}
      <strong>${esc(pick(t.title, lang))}</strong>
      <span class="bk-tpl-sum">${esc(pick(t.summary, lang))}</span>
      <span class="bk-tpl-meta">${t.pages.length} ${esc(I.S("pages", "páginas"))}${only ? ` · ${esc(I.S("Grades", "Grados"))} ${only}` : ""}${t.family ? ` · ${esc(I.S("With family", "En familia"))}` : ""}</span>
    </span>
  </a></li>`;
}

/** The five-stage author's process, each with what to do and a sentence frame to say it. */
export function journeyHTML(p, I) {
  const lang = langOf(I);
  return `<section class="bk-journey" aria-labelledby="bkJourneyH">
    <div class="bk-section-head"><p class="eyebrow">${esc(I.S("How authors work", "Cómo trabajan los autores"))}</p><h2 id="bkJourneyH">${esc(I.S("The author's path", "El camino del autor"))}</h2></div>
    <ol class="bk-journey-steps" tabindex="0" aria-labelledby="bkJourneyH">${p.stages
      .map(
        (
          s,
          i,
        ) => `<li class="bk-pathstep"><span class="bk-pathstep-num" aria-hidden="true">${i + 1}</span>
        <span class="bk-pathstep-ico" aria-hidden="true">${bkIcon(STAGE_ICON[i])}</span>
        <strong>${esc(s[lang])}</strong>
        <span class="bk-pathstep-do">${esc(pick(s.do, lang))}</span>
        <span class="bk-pathstep-frame"><span class="sr-only">${esc(I.S("Sentence frame:", "Inicio de oración:"))} </span>${esc(pick(s.frame, lang))}</span></li>`,
      )
      .join("")}</ol>
  </section>`;
}

/** Four author's-craft mini-lessons, each with a mentor sentence. */
export function craftHTML(p, I) {
  const lang = langOf(I);
  return `<section class="bk-craft" aria-labelledby="bkCraftH">
    <div class="bk-section-head"><p class="eyebrow">${esc(I.S("Mini-lessons", "Minilecciones"))}</p><h2 id="bkCraftH">${esc(I.S("Author's craft", "El oficio del autor"))}</h2>
    <p class="bk-section-lead">${esc(I.S("Real authors use these moves. Try one on your next page.", "Los autores de verdad usan estas técnicas. Prueba una en tu próxima página."))}</p></div>
    <ul class="bk-craft-grid">${p.craft
      .map(
        (
          c,
          i,
        ) => `<li class="bk-craft-card"><span class="bk-craft-num" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
        <h3>${esc(c[lang])}</h3><p>${esc(pick(c.tip, lang))}</p>
        <figure class="bk-mentor"><figcaption>${esc(I.S("Mentor sentence", "Oración modelo"))}</figcaption><blockquote>${esc(pick(c.mentor, lang))}</blockquote></figure></li>`,
      )
      .join("")}</ul>
  </section>`;
}

/** Standards the studio practises, for teachers and families. */
export function standardsHTML(p, I) {
  const lang = langOf(I);
  return `<details class="bk-standards"><summary>${bkIcon("check")} ${esc(I.S(`Standards practised · ${p.grades.en}`, `Estándares que se practican · ${p.grades.es}`))}</summary>
    <ul><li>${esc(pick(p.standards.ccss, lang))}</li><li>${esc(pick(p.standards.wida, lang))}</li>
    <li>${esc(I.S("Every template names its key language use and lists language goals, a word bank, sentence starters and a model.", "Cada plantilla nombra su uso clave del lenguaje y trae metas de lenguaje, un banco de palabras, inicios de oración y un modelo."))}</li></ul>
  </details>`;
}

/** The editor dock's guide for the current stage: what authors do now, a sentence frame to add, and (Improve) craft moves. */
export function bandGuideHTML(E) {
  const I = E.I;
  const lang = langOf(I);
  const p = programFor(bookBand(E.core.S.book, E.ctx.band));
  const stages = (EDITOR_STAGE_MAP[E.stage] || []).map((i) => p.stages[i]).filter(Boolean);
  if (!stages.length) return "";
  const frameText = (s) => pick(s.frame, lang).replace(/_{2,}/g, "…");
  return `<aside class="bk-pathguide" aria-label="${esc(I.S("Author's path", "Camino del autor"))}">
    <span class="bk-pathguide-band">${esc(pick(p.grades, lang))}</span>
    ${stages
      .map(
        (s) => `<div class="bk-pathguide-step"><strong>${esc(s[lang])}</strong> <span>${esc(pick(s.do, lang))}</span>
      <button type="button" class="bk-pathguide-frame" data-dock="frame" data-frame="${esc(frameText(s))}" aria-label="${esc(I.S(`Add the sentence starter: ${pick(s.frame, lang)}`, `Agregar el inicio de oración: ${pick(s.frame, lang)}`))}">${bkIcon("plus")} ${esc(pick(s.frame, lang))}</button></div>`,
      )
      .join("")}
    ${
      E.stage === "improve"
        ? `<details class="bk-pathguide-craft"><summary>${esc(I.S("Try an author's craft move", "Prueba una técnica de autor"))}</summary><ul>${p.craft.map((c) => `<li><strong>${esc(c[lang])}.</strong> ${esc(pick(c.tip, lang))} <em>${esc(pick(c.mentor, lang))}</em></li>`).join("")}</ul></details>`
        : ""
    }
  </aside>`;
}

/** The Finish dialog's self-check: the band rubric for the book's purpose, each item a toggle saved on the book. */
export function selfCheckHTML(book, band, I) {
  const lang = langOf(I);
  const items = rubricFor(bookBand(book, band), book.purpose);
  const done = items.filter((r) => book.selfCheck.includes(r.id)).length;
  const use = KEY_USES[book.purpose];
  return `<section class="bk-selfcheck" aria-labelledby="bkSelfH">
    <h3 id="bkSelfH">${bkIcon("check")} ${esc(I.S("Check my book", "Revisa mi libro"))}${use ? ` <span class="bk-use is-${use.tone}">${esc(use[lang])}</span>` : ""} <span class="bk-count" data-bk-selfcount>${done}/${items.length}</span></h3>
    <p class="fine">${esc(I.S("Tap each one your book does. Fix the others, then tap them.", "Toca cada punto que tu libro cumple. Mejora los demás y luego tócalos."))}</p>
    <ul>${items.map((r) => `<li><button type="button" class="bk-selfcheck-item" data-bk-dlg="selfcheck" data-id="${esc(r.id)}" aria-pressed="${book.selfCheck.includes(r.id)}"><span class="bk-selfcheck-box" aria-hidden="true">${bkIcon("check")}</span><span>${esc(r[lang])}</span></button></li>`).join("")}</ul>
  </section>`;
}
